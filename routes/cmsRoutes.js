import express from 'express';
import { getContent, updateContent } from '../controllers/cmsController.js';

const router = express.Router();

import { protect, admin } from '../middleware/auth.js';

// @route   GET /api/cms/:page/:section
// @desc    Get content for a specific page section
// @access  Public
router.get('/:page/:section', getContent);

// @route   PUT /api/cms/:page/:section
// @desc    Create or update content for a specific page section
// @access  Admin Protected
router.put('/:page/:section', protect, admin, updateContent);

export default router;
