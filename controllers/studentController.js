import Student from '../models/Student.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getDashboardData = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('user', 'name email');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    
    // Transform to match frontend expectations
    const dashboardData = {
      _id: student._id,
      name: student.user.name,
      email: student.user.email,
      rollNo: student.rollNo,
      course: student.course,
      batch: student.batch,
      attendance: student.attendance,
      fees: student.fees,
      notices: student.notices,
      timetable: student.timetable
    };
    
    res.json({ success: true, student: dashboardData });
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
    // Mock Razorpay Order
    const mockOrder = {
      id: `order_mock_${Math.floor(Math.random()*1000000)}`,
      amount: amount * 100, // in paise
      currency: "INR"
    };
    
    res.json({ success: true, order: mockOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  const { id } = req.params; // fee id
  const { paymentId, orderId, signature } = req.body;
  
  try {
    // Find student and update the specific fee status to Paid
    const student = await Student.findOne({ user: req.user._id });
    if (student) {
      const fee = student.fees.id(id);
      if (fee) {
        fee.status = 'Paid';
        await student.save();
      }
    }
    
    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};
