import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary config is automatically picked up from process.env.CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME etc.
// But it's best to configure it explicitly if needed, assuming dotenv is loaded.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadMiddleware = upload.single('image');

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Public
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided' });
    }

    // Convert buffer to base64 string
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'sharda_academy',
      resource_type: 'auto'
    });

    res.status(200).json({
      success: true,
      data: {
        imageUrl: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Server Error during upload', error: error.message });
  }
};

// @desc    Delete image from Cloudinary
// @route   POST /api/upload/delete
// @access  Public
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId is required' });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok' || result.result === 'not found') {
      res.status(200).json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to delete image', result });
    }
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ success: false, message: 'Server Error during delete', error: error.message });
  }
};
