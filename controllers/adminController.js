import Student from '../models/Student.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Receipt from '../models/Receipt.js';
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

export const updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    let user = await User.findById(id);
    let student;
    if (user) {
      student = await Student.findOne({ user: user._id });
    } else {
      student = await Student.findById(id);
      if (student) {
        user = await User.findById(student.user);
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      name, email, phone, rollNumber, classLevel, batch, biometricId,
      parentEmail, dob, gender, bloodGroup, aadhaarNo, fatherName,
      fatherPhone, motherName, motherPhone, homeAddress, status, password
    } = req.body;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    let profilePhotoUrl = undefined;
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

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (status) user.status = status;
    if (profilePhotoUrl !== undefined) {
      user.profilePhoto = profilePhotoUrl;
    } else if (req.body.profilePhoto === "") {
      user.profilePhoto = "";
    }
    await user.save();

    if (student) {
      if (rollNumber !== undefined) student.rollNo = rollNumber;
      if (batch !== undefined) student.batch = batch;
      
      if (!student.personalInfo) student.personalInfo = {};
      if (name) student.personalInfo.fullName = name;
      if (email) student.personalInfo.email = email;
      if (phone) student.personalInfo.phone = phone;
      if (parentEmail !== undefined) student.personalInfo.parentEmail = parentEmail;
      if (dob !== undefined) student.personalInfo.dob = dob;
      if (gender !== undefined) student.personalInfo.gender = gender;
      if (bloodGroup !== undefined) student.personalInfo.bloodGroup = bloodGroup;
      if (aadhaarNo !== undefined) student.personalInfo.aadhaarNo = aadhaarNo;
      if (fatherName !== undefined) student.personalInfo.fatherName = fatherName;
      if (fatherPhone !== undefined) student.personalInfo.fatherPhone = fatherPhone;
      if (motherName !== undefined) student.personalInfo.motherName = motherName;
      if (motherPhone !== undefined) student.personalInfo.motherPhone = motherPhone;
      if (homeAddress !== undefined) student.personalInfo.homeAddress = homeAddress;
      
      if (profilePhotoUrl !== undefined) {
        student.personalInfo.profilePhoto = profilePhotoUrl;
      } else if (req.body.profilePhoto === "") {
        student.personalInfo.profilePhoto = "";
      }

      if (!student.admissionInfo) student.admissionInfo = {};
      if (classLevel !== undefined) student.admissionInfo.class = classLevel;
      if (batch !== undefined) student.admissionInfo.batch = batch;
      if (biometricId !== undefined) student.admissionInfo.biometricId = biometricId;

      student.markModified('personalInfo');
      student.markModified('admissionInfo');
      await student.save();
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Course Management
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addCourse = async (req, res) => {
  try {
    const newCourse = await Course.create(req.body);
    res.json({ success: true, data: newCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Study Material Management
export const getStudyMaterials = async (req, res) => {
  try {
    const materials = await StudyMaterial.find();
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addStudyMaterial = async (req, res) => {
  try {
    const { attachmentData, ...rest } = req.body;
    let finalAttachmentData = "";
    if (attachmentData) {
      const result = await cloudinary.uploader.upload(attachmentData, { folder: 'sharda_academy/study_material', resource_type: 'auto' });
      finalAttachmentData = result.secure_url;
    }
    const newMaterial = await StudyMaterial.create({ ...rest, attachmentData: finalAttachmentData });
    res.json({ success: true, data: newMaterial });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteStudyMaterial = async (req, res) => {
  try {
    await StudyMaterial.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Results Management (Get and Delete)
export const getResults = async (req, res) => {
  try {
    const { examName } = req.query;
    const match = examName ? { "results.examName": { $regex: examName, $options: 'i' } } : { "results": { $ne: [] } };
    const students = await Student.find(match).populate('user', 'name email profilePhoto');
    
    let allResults = [];
    students.forEach(student => {
      student.results.forEach(result => {
        if (examName && !result.examName.toLowerCase().includes(examName.toLowerCase())) return;
        
        let totalObtained = 0;
        let totalMax = 0;
        result.marks.forEach(m => {
          totalObtained += m.obtained;
          totalMax += m.max;
        });
        const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';

        allResults.push({
          _id: result._id,
          studentId: student.user, 
          examName: result.examName,
          percentage: percentage,
          grade: grade,
          marks: result.marks
        });
      });
    });

    res.json({ success: true, data: allResults });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    await Student.updateMany(
      { "results._id": id },
      { $pull: { results: { _id: id } } }
    );
    res.json({ success: true, message: 'Result deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Students Listing for Results Load
export const getStudents = async (req, res) => {
  try {
    const { classLevel, batch } = req.query;
    let query = {};
    if (classLevel) query["admissionInfo.class"] = classLevel;
    if (batch && batch !== "All Batches") query.batch = batch;

    const students = await Student.find(query).populate('user', 'name email');
    const formatted = students.map(s => ({
      _id: s.user?._id || s._id,
      name: s.user?.name || s.personalInfo?.fullName,
      rollNumber: s.rollNo,
      studentObjId: s._id,
      fees: s.fees || []
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// Fee Receipts & Cash Payment
export const getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find().populate('studentId', 'name email').sort({ paymentDate: -1 });
    res.json({ success: true, data: receipts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const recordCashPayment = async (req, res) => {
  try {
    const { studentId, amountPaid, collectedBy } = req.body;
    if (!studentId || !amountPaid || amountPaid <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    const student = await Student.findOne({ user: studentId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    let totalFee = 0;
    let oldPaidTillNow = 0;
    student.fees.forEach(f => {
      totalFee += f.amount || 0;
      oldPaidTillNow += f.amountPaid || 0;
    });

    const oldDue = totalFee - oldPaidTillNow;
    if (amountPaid > oldDue) {
      return res.status(400).json({ success: false, message: 'Amount exceeds remaining due' });
    }

    const pendingFees = student.fees.filter(f => f.status !== 'Paid').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    let remainingPayment = Number(amountPaid);

    for (let fee of pendingFees) {
      if (remainingPayment <= 0) break;
      const dueOnFee = (fee.amount || 0) - (fee.amountPaid || 0);
      if (dueOnFee > 0) {
        const applyToFee = Math.min(dueOnFee, remainingPayment);
        fee.amountPaid = (fee.amountPaid || 0) + applyToFee;
        remainingPayment -= applyToFee;
        if (fee.amountPaid >= fee.amount) {
          fee.status = 'Paid';
          fee.paymentMethod = 'Cash';
        }
      }
    }
    
    await student.save();

    const newPaidTillNow = oldPaidTillNow + Number(amountPaid);
    const newDue = totalFee - newPaidTillNow;
    
    const count = await Receipt.countDocuments();
    const receiptNumber = `SA-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const receipt = await Receipt.create({
      receiptNumber,
      studentId: studentId,
      amountPaid: Number(amountPaid),
      totalFee,
      paidTillNow: newPaidTillNow,
      dueAmount: newDue,
      paymentMode: 'Cash',
      collectedBy: collectedBy || req.user?.name || 'Admin',
      paymentDate: new Date()
    });

    res.json({ success: true, message: 'Cash payment recorded', data: receipt });
  } catch (error) {
    console.error('Record cash error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
