import express from 'express';
import { getContent, updateContent } from '../controllers/cmsController.js';

const router = express.Router();

// @route   GET /api/cms/:page/:section
// @desc    Get content for a specific page section
// @access  Public
router.get('/:page/:section', getContent);

// @route   PUT /api/cms/:page/:section
// @desc    Create or update content for a specific page section
// @access  Public (Should be protected via middleware in production, keeping accessible for development)
router.put('/:page/:section', updateContent);

export default router;
