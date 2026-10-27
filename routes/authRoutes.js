import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect, admin } from '../middleware/auth.js';
import { login, googleAuth, forgotPassword, resetPassword, requestPasswordChange, verifyPasswordChange, getAdmins, addAdmin, removeAdmin, me, logout } from '../controllers/authController.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: true,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' }
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

// Admin Management routes (admin only)
router.get('/admins', protect, admin, getAdmins);
router.post('/admins', protect, admin, addAdmin);
router.delete('/admins/:id', protect, admin, removeAdmin);

export default router;
