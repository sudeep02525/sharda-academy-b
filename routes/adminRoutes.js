import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  getAnalytics, syncBiometric, getUsers, deleteUser, 
  addHomework, addAttendance, addResult, addNotice, 
  addFee, updateFeeStatus, addTimetable 
} from '../controllers/adminController.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(protect);

router.get('/analytics', getAnalytics);
router.post('/biometric-sync', syncBiometric);
router.get('/users', getUsers);
router.post('/users', getUsers); // Create mock
router.delete('/users/:id', deleteUser);

router.post('/homework', addHomework);
router.post('/attendance', addAttendance);
router.post('/results', addResult);
router.post('/notices', addNotice);

router.post('/fees', addFee);
router.put('/fees/:id', updateFeeStatus);
router.post('/timetables', addTimetable);

export default router;
