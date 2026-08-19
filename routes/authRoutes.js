import express from 'express';
import { login, forgotPassword, resetPassword, requestPasswordChange, verifyPasswordChange, getAdmins, addAdmin, removeAdmin } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Logged-in profile password change routes
router.post('/request-password-change', requestPasswordChange);
router.post('/verify-password-change', verifyPasswordChange);

// Admin Management routes
router.get('/admins', getAdmins);
router.post('/admins', addAdmin);
router.delete('/admins/:id', removeAdmin);

export default router;
