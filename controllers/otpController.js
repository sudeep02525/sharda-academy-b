import Otp from '../models/Otp.js';
import { sendOTP } from '../utils/emailService.js';

// Generate a 6-digit numeric OTP
const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const requestOtp = async (req, res) => {
  try {
    const { email, context } = req.body;

    if (!email || !context) {
      return res.status(400).json({ message: 'Email and context are required' });
    }

    // Optional: Delete any existing OTPs for this email and context to prevent spam
    await Otp.deleteMany({ email, context });

    const otpCode = generateOtpCode();

    // Save to database
    const newOtp = new Otp({
      email,
      otp: otpCode,
      context
    });
    await newOtp.save();

    // Send email
    const emailResult = await sendOTP(email, otpCode, context);

    if (emailResult.success) {
      res.status(200).json({ message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP email', error: emailResult.error });
    }
  } catch (error) {
    console.error('Error in requestOtp:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, context } = req.body;

    if (!email || !otp || !context) {
      return res.status(400).json({ message: 'Email, OTP, and context are required' });
    }

    // Find the OTP record
    const otpRecord = await Otp.findOne({ email, context }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP is valid! Delete it so it can't be used again
    await Otp.deleteMany({ email, context });

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
