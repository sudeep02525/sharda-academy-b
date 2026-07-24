import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  getAnalytics, syncBiometric, getUsers, addUser, deleteUser, 
  addHomework, addAttendance, addResult, addNotice, 
  addFee, updateFeeStatus, addTimetable 
} from '../controllers/adminController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();

// Apply auth middleware to all admin routes
router.use(protect);

router.get('/analytics', getAnalytics);
router.post('/biometric-sync', syncBiometric);
router.get('/users', getUsers);
router.post('/users', upload.any(), addUser); // Replaced mock with real implementation
router.delete('/users/:id', deleteUser);

router.post('/homework', addHomework);
router.post('/attendance', addAttendance);
router.post('/results', addResult);
router.post('/notices', addNotice);

router.post('/fees', addFee);
router.put('/fees/:id', updateFeeStatus);
router.post('/timetables', addTimetable);

export default router;
