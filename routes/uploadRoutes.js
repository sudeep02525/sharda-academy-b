import express from 'express';
import rateLimit from 'express-rate-limit';
import { uploadImage, deleteImage, uploadMiddleware } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public upload stays open on purpose: the website admission form (AdmissionForm.jsx)
// uploads a student's documents before submitting, and that visitor is not logged in.
// Abuse is limited by a tight per-IP rate limit here plus the 5 MB / image-or-PDF
// filter configured on multer in controllers/uploadController.js.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many uploads from this IP. Please try again after 15 minutes.' }
});

// Wrap multer so size/type rejections return a clean 400 instead of a 500.
const handleUpload = (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large. Maximum size is 5 MB.' :
      err.code === 'LIMIT_FILE_COUNT' ? 'Only one file can be uploaded at a time.' :
      err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Unexpected file field. Use the field name "image".' :
      err.message || 'Upload failed.';
    return res.status(400).json({ success: false, message });
  });
};

// @route   POST /api/upload
// @desc    Upload an image / PDF (admission documents + CMS images)
// @access  Public, rate limited
router.post('/', uploadLimiter, handleUpload, uploadImage);

// @route   POST /api/upload/delete
// @desc    Delete an image from Cloudinary
// @access  Private (logged-in CMS user)
router.post('/delete', protect, deleteImage);

export default router;
