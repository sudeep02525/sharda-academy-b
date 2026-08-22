import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import { 
  getAnalytics, syncBiometric, getUsers, addUser, deleteUser, updateUser,
  addHomework, addAttendance, addResult, addNotice, 
  addFee, updateFeeStatus, addTimetable,
  getCourses, addCourse, updateCourse, deleteCourse,
  getStudyMaterials, addStudyMaterial, deleteStudyMaterial,
  getResults, deleteResult, getStudents,
  getReceipts, recordCashPayment
} from '../controllers/adminController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();

// Apply auth middleware to all admin routes
router.use(protect, admin);

router.get('/receipts', getReceipts);
router.post('/fees/cash', recordCashPayment);

router.get('/analytics', getAnalytics);
router.post('/biometric-sync', syncBiometric);

router.get('/users', getUsers);
router.post('/users', upload.any(), addUser); 
router.put('/users/:id', upload.any(), updateUser);
router.put('/students/:id', upload.any(), updateUser);
router.delete('/users/:id', deleteUser);
router.get('/students', getStudents);

router.post('/homework', addHomework);
router.post('/attendance', addAttendance);

router.get('/results', getResults);
router.post('/results', addResult);
router.delete('/results/:id', deleteResult);

router.post('/notices', addNotice);

router.post('/fees', addFee);
router.put('/fees/:id', updateFeeStatus);
router.post('/timetables', addTimetable);

router.get('/courses', getCourses);
router.post('/courses', addCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

router.get('/study-materials', getStudyMaterials);
router.post('/study-materials', upload.any(), addStudyMaterial);
router.delete('/study-materials/:id', deleteStudyMaterial);

export default router;
