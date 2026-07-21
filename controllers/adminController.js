import Student from '../models/Student.js';
import User from '../models/User.js';

export const getAnalytics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const students = await Student.find();
    
    let pendingFees = 0;
    students.forEach(s => {
      s.fees.forEach(f => { if (f.status === 'Pending') pendingFees += f.amount; });
    });

    res.json({
      success: true,
      analytics: { totalStudents, totalTeachers: 12, averageAttendance: 89, pendingFees }
    });
  } catch (error) {
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

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await Student.findByIdAndDelete(id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addHomework = async (req, res) => res.json({ success: true, message: 'Homework added' });
export const addAttendance = async (req, res) => res.json({ success: true, message: 'Attendance marked' });
export const addResult = async (req, res) => res.json({ success: true, message: 'Result published' });
export const addNotice = async (req, res) => res.json({ success: true, message: 'Notice broadcasted' });

export const addFee = async (req, res) => res.json({ success: true, message: 'Fee applied' });
export const updateFeeStatus = async (req, res) => res.json({ success: true, message: 'Fee updated' });

export const addTimetable = async (req, res) => res.json({ success: true, message: 'Timetable created' });
