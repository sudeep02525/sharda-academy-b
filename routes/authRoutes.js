import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import { login, googleAuth, forgotPassword, resetPassword, requestPasswordChange, verifyPasswordChange, getAdmins, addAdmin, removeAdmin, me, logout } from '../controllers/authController.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: 'Too many login attempts, please try again after a minute' }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: { success: false, message: 'Too many reset attempts, please try again after 15 minutes' }
});

router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.get('/me', protect, me);
router.post('/logout', protect, logout);

// Logged-in profile password change routes
router.post('/request-password-change', requestPasswordChange);
router.post('/verify-password-change', verifyPasswordChange);

// Admin Management routes
router.get('/admins', getAdmins);
router.post('/admins', addAdmin);
router.delete('/admins/:id', removeAdmin);

export default router;
