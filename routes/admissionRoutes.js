import express from 'express';
import AdmissionInquiry from '../models/AdmissionInquiry.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = express.Router();

import { getIo } from '../socket.js';

// POST /api/admissions - Submit a new inquiry (public, no auth)
router.post('/', async (req, res) => {
  try {
    const { studentName, parentName, email, phone, altPhone, course, qualification, batch, address, message, documents } = req.body;

    if (!studentName || !parentName || !email || !phone || !course || !qualification || !batch || !address) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    }

    const inquiry = await AdmissionInquiry.create({
      studentName, parentName, email, phone, altPhone, course, qualification, batch, address, message, documents: documents || []
    });

    try {
      const io = getIo();
      io.to('cms-admins').emit('new-admission', inquiry);
    } catch (ioError) {
      console.error('Socket.io emit error:', ioError.message);
    }

    res.status(201).json({ success: true, message: 'Application submitted successfully!', data: inquiry });
  } catch (error) {
    console.error('Error saving admission inquiry:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// GET /api/admissions - Get all inquiries (for CMS)
router.get('/', async (req, res) => {
  try {
    const inquiries = await AdmissionInquiry.find().sort({ submittedAt: -1 });
    res.json({ success: true, data: inquiries, total: inquiries.length });
  } catch (error) {
    console.error('Error fetching admission inquiries:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/admissions/:id - Delete an inquiry (for CMS)
router.delete('/:id', async (req, res) => {
  try {
    const inquiry = await AdmissionInquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found.' });
    }

    // Delete associated documents from Cloudinary
    if (inquiry.documents && inquiry.documents.length > 0) {
      for (const doc of inquiry.documents) {
        if (doc.publicId) {
          try {
            await cloudinary.uploader.destroy(doc.publicId);
          } catch (cloudinaryError) {
            console.error('Error deleting image from Cloudinary:', cloudinaryError);
          }
        }
      }
    }

    await inquiry.deleteOne();
    res.json({ success: true, message: 'Inquiry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/admissions/:id/status - Update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await AdmissionInquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!inquiry) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/admissions/:id/documents/:publicId - Delete a single document from an inquiry
router.delete('/:id/documents/:publicId', async (req, res) => {
  try {
    const { id, publicId } = req.params;
    
    // Attempt to delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Cloudinary delete error:', err);
    }

    // Remove from DB
    const inquiry = await AdmissionInquiry.findByIdAndUpdate(
      id,
      { $pull: { documents: { publicId } } },
      { new: true }
    );
    
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    res.json({ success: true, data: inquiry });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

export default router;
