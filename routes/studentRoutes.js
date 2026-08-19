import express from 'express';
import { getDashboardData, changePassword, createRazorpayOrder, verifyRazorpayPayment, getReceipts } from '../controllers/studentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes below
router.use(protect);

router.get('/dashboard', getDashboardData);
router.post('/change-password', changePassword);
router.post('/fees/:id/razorpay-order', createRazorpayOrder);
router.post('/fees/:id/razorpay-verify', verifyRazorpayPayment);
router.get('/receipts', getReceipts);

export default router;
