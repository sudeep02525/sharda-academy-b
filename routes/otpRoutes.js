import express from 'express';
import { requestOtp, verifyOtp } from '../controllers/otpController.js';

const router = express.Router();

// Route to request an OTP (also used for resending)
router.post('/send', requestOtp);

// Route to verify an OTP
router.post('/verify', verifyOtp);

export default router;
