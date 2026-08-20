import Student from '../models/Student.js';
import User from '../models/User.js';
import Receipt from '../models/Receipt.js';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { getIo } from '../socket.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id_here',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret_here'
});

export const getDashboardData = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('user', 'name email');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    
    // Lazy deletion of homework attachments older than 5 days
    let homeworkUpdated = false;
    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
    
    if (student.homework && student.homework.length > 0) {
      for (let hw of student.homework) {
        if (hw.cloudinaryPublicId && hw.createdAt) {
          const age = Date.now() - new Date(hw.createdAt).getTime();
          if (age > FIVE_DAYS_MS) {
            try {
              await cloudinary.uploader.destroy(hw.cloudinaryPublicId);
            } catch (err) {
              console.error("Cloudinary delete error:", err);
            }
            hw.attachmentData = null;
            hw.attachmentName = null;
            hw.cloudinaryPublicId = null;
            homeworkUpdated = true;
          }
        }
      }
      if (homeworkUpdated) {
        await student.save();
      }
    }
    
    // Transform to match frontend expectations
    const dashboardData = {
      _id: student._id,
      name: student.user?.name || student.personalInfo?.fullName || "Student",
      email: student.user?.email || student.personalInfo?.email || "",
      phone: student.personalInfo?.phone || "",
      rollNo: student.rollNo,
      course: student.course || "",
      batch: student.batch || student.admissionInfo?.batch || "",
      classLevel: student.admissionInfo?.class || 12,
      stream: student.admissionInfo?.stream || ""
    };
    
    res.json({ 
      success: true, 
      student: dashboardData,
      attendance: Array.isArray(student.attendance) ? student.attendance : (student.attendance?.recent || []),
      fees: student.fees || [],
      notices: student.notices || [],
      timetable: student.timetable || [],
      results: student.results || [],
      homework: student.homework || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createRazorpayOrder = async (req, res) => {
  const { id } = req.params; // fee id
  const { amount } = req.body;
  
  try {
    const options = {
      amount: Math.round(amount * 100), // in paise
      currency: "INR",
      receipt: `receipt_${id}_${Date.now()}`
    };
    
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  const { id } = req.params; // fee id (can be ignored since we apply automatically)
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, paidAmount } = req.body;
  
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'your_key_secret_here';
    
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
      
    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    let amountToApply = Number(paidAmount);
    if (!amountToApply || amountToApply <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount paid' });
    }

    let totalFee = 0;
    let oldPaidTillNow = 0;
    student.fees.forEach(f => {
      totalFee += f.amount || 0;
      oldPaidTillNow += f.amountPaid || 0;
    });

    const pendingFees = student.fees.filter(f => f.status !== 'Paid').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    let remainingPayment = amountToApply;

    for (let fee of pendingFees) {
      if (remainingPayment <= 0) break;
      const dueOnFee = (fee.amount || 0) - (fee.amountPaid || 0);
      if (dueOnFee > 0) {
        const applyToFee = Math.min(dueOnFee, remainingPayment);
        fee.amountPaid = (fee.amountPaid || 0) + applyToFee;
        remainingPayment -= applyToFee;
        if (fee.amountPaid >= fee.amount) {
          fee.status = 'Paid';
          fee.paymentMethod = 'Razorpay Online';
        }
      }
    }
    await student.save();

    const newPaidTillNow = oldPaidTillNow + amountToApply;
    const newDue = totalFee - newPaidTillNow;
    
    const count = await Receipt.countDocuments();
    const receiptNumber = `SA-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const receipt = await Receipt.create({
      receiptNumber,
      studentId: req.user._id,
      amountPaid: amountToApply,
      totalFee,
      paidTillNow: newPaidTillNow,
      dueAmount: newDue,
      paymentMode: 'Online',
      transactionId: razorpay_payment_id,
      collectedBy: null,
      paymentDate: new Date()
    });

    try {
      getIo().to('admins').emit('fee_paid', { 
        studentName: student.personalInfo?.fullName || "Student", 
        amount: amountToApply,
        receiptNumber
      });
    } catch (e) {
      console.error('Socket emit error:', e);
    }

    res.json({ success: true, message: 'Payment verified successfully', receipt });
  } catch (error) {
    console.error("Razorpay Verify Error:", error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export const getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find({ studentId: req.user._id }).sort({ paymentDate: -1 });
    res.json({ success: true, data: receipts });
  } catch (error) {
    console.error('Fetch receipts error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
