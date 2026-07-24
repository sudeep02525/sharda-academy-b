import Student from '../models/Student.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import { getIo } from '../socket.js';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const getAnalytics = async (req, res) => {
  try {
    const users = await User.find().lean();
    const studentsData = await Student.find().lean();
    
    let totalStudents = 0;
    let pendingFees = 0;
    
    const usersList = users.map(user => {
      if (user.role === 'student') totalStudents++;
      
      const studentProfile = studentsData.find(s => String(s.user) === String(user._id)) || {};
      
      if (studentProfile.fees) {
        studentProfile.fees.forEach(f => {
          if (f.status === 'Pending' || f.status === 'Unpaid') pendingFees += (Number(f.amount) || 0);
        });
      }
      
      return {
        _id: user._id,
        name: user.name || studentProfile.personalInfo?.fullName || 'Student',
        email: user.email || studentProfile.personalInfo?.email || '',
        phone: user.phone || studentProfile.personalInfo?.phone || '',
        role: user.role,
        rollNumber: studentProfile.rollNo || '',
        classLevel: studentProfile.admissionInfo?.class || studentProfile.course || 12,
        batch: studentProfile.batch || studentProfile.admissionInfo?.batch || 'Batch A',
        biometricId: studentProfile.admissionInfo?.biometricId || '',
        parentEmail: studentProfile.personalInfo?.parentEmail || '',
        status: user.status || 'Active',
        fees: studentProfile.fees || [],
        notices: studentProfile.notices || [],
        homework: studentProfile.homework || [],
        timetable: studentProfile.timetable || []
      };
    });

    res.json({
      success: true,
      analytics: { totalStudents, totalTeachers: 12, averageAttendance: 89, pendingFees },
      usersList
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const syncBiometric = async (req, res) => {
  res.json({ success: true, message: 'Biometric synced successfully' });
};

export const getUsers = async (req, res) => {
  try {
    const students = await Student.find().populate('user', 'name email');
    res.json({ success: true, users: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addUser = async (req, res) => {
  try {
    const { name, email, phone, role, rollNumber, classLevel, batch, biometricId } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Handle profile photo upload to Cloudinary
    let profilePhotoUrl = "";
    if (req.files && req.files.length > 0) {
      const file = req.files.find(f => f.fieldname === 'profilePhoto');
      if (file) {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'sharda_academy',
          resource_type: 'auto'
        });
        profilePhotoUrl = result.secure_url;
      }
    }

    // Default password for new students
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Sharda@123', salt);

    const newUser = await User.create({
      name,
      email,
      phone,
      role: role || 'student',
      password: hashedPassword,
      ...(profilePhotoUrl && { profilePhoto: profilePhotoUrl })
    });

    if (newUser.role === 'student') {
      const newStudent = await Student.create({
        user: newUser._id,
        rollNo: rollNumber,
        batch: batch,
        personalInfo: {
          fullName: name,
          email: email,
          phone: phone,
          ...(profilePhotoUrl && { profilePhoto: profilePhotoUrl })
        },
        admissionInfo: {
          class: classLevel,
          batch: batch,
          biometricId: biometricId
        },
        attendance: [],
        fees: [],
        notices: [],
        timetable: []
      });
    }

    res.json({ success: true, message: 'User added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await Student.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addHomework = async (req, res) => {
  try {
    const { title, description, subject, dueDate, teacherName, classLevel, batch, attachmentName, attachmentData } = req.body;
    
    let finalAttachmentData = "";
    let cloudinaryPublicId = "";
    if (attachmentData) {
      const result = await cloudinary.uploader.upload(attachmentData, { folder: 'sharda_academy/homework', resource_type: 'auto' });
      finalAttachmentData = result.secure_url;
      cloudinaryPublicId = result.public_id;
    }

    const query = { "admissionInfo.class": classLevel };
    if (batch && batch !== "All Batches") query.batch = batch;

    await Student.updateMany(query, {
      $push: {
        homework: { title, description, subject, dueDate, teacherName, attachmentName, attachmentData: finalAttachmentData, cloudinaryPublicId }
      }
    });

    try {
      getIo().emit('new_homework', { title, subject, dueDate, teacherName });
    } catch (e) {
      console.error('Socket emit error:', e);
    }

    res.json({ success: true, message: 'Homework added' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addAttendance = async (req, res) => {
  try {
    const { studentId, date, status } = req.body;
    const student = await Student.findOne({ user: studentId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    if (!student.attendance) student.attendance = { percentage: 0, recent: [] };
    
    student.attendance.recent.push({ date, status });
    const present = student.attendance.recent.filter(a => a.status === 'Present' || a.status === 'Late').length;
    student.attendance.percentage = Math.round((present / student.attendance.recent.length) * 100);
    
    await student.save();
    res.json({ success: true, message: 'Attendance marked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addResult = async (req, res) => {
  try {
    const { examName, classLevel, batch, results } = req.body;
    for (let r of results) {
      await Student.updateOne({ user: r.studentId }, {
        $push: { results: { examName, marks: r.marks } }
      });
    }
    res.json({ success: true, message: 'Result published' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addNotice = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    await Student.updateMany({}, {
      $push: { notices: { title, date: new Date().toISOString().split('T')[0], isRecent: true, content, category } }
    });

    try {
      getIo().emit('new_notice', { title, category });
    } catch (e) {
      console.error('Socket emit error:', e);
    }

    res.json({ success: true, message: 'Notice broadcasted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addFee = async (req, res) => {
  try {
    const { studentId, amount, dueDate, description } = req.body;
    await Student.updateOne({ user: studentId }, {
      $push: { fees: { title: description, amount: Number(amount), dueDate, status: 'Unpaid', amountPaid: 0 } }
    });

    try {
      getIo().emit('new_fee', { title: description, amount, dueDate });
    } catch (e) {
      console.error('Socket emit error:', e);
    }

    res.json({ success: true, message: 'Fee applied' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateFeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentMethod } = req.body;
    
    const student = await Student.findOne({ "fees._id": id });
    if (!student) return res.status(404).json({ success: false, message: 'Fee record not found' });
    
    const fee = student.fees.id(id);
    fee.amountPaid += Number(amountPaid);
    fee.paymentMethod = paymentMethod;
    if (fee.amountPaid >= fee.amount) {
      fee.status = 'Paid';
    } else {
      fee.status = 'Pending';
    }
    
    await student.save();
    res.json({ success: true, message: 'Fee updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addTimetable = async (req, res) => {
  try {
    const { classLevel, batch, subject, teacherName, day, startTime, endTime, room } = req.body;
    
    const query = { "admissionInfo.class": classLevel };
    if (batch && batch !== "All Batches") query.batch = batch;
    
    await Student.updateMany(query, {
      $push: { timetable: { subject, time: `${startTime} - ${endTime}`, teacher: teacherName, day, room } }
    });
    
    res.json({ success: true, message: 'Timetable created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
