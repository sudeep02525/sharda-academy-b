import express from 'express';
import { uploadImage, deleteImage, uploadMiddleware } from '../controllers/uploadController.js';

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload an image to Cloudinary
// @access  Public (in production, secure this)
router.post('/', uploadMiddleware, uploadImage);

// @route   POST /api/upload/delete
// @desc    Delete an image from Cloudinary
// @access  Public (in production, secure this)
router.post('/delete', deleteImage);

export default router;
