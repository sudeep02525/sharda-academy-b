import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { sendOTP } from '../utils/emailService.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '7d',
  });
};

const sendTokenResponse = (user, statusCode, res, message = undefined) => {
  const token = generateToken(user._id);
  
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };

  const responsePayload = {
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || user.profilePhoto
    }
  };
  
  if (message) {
    responsePayload.message = message;
  }

  res.status(statusCode).cookie('token', token, options).json(responsePayload);
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password || ''))) {
      sendTokenResponse(user, 200, res);
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const googleAuth = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Token missing' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });
    
    if (!user) {
      // User is not registered by admin
      return res.status(403).json({
        success: false,
        message: 'Your email is not registered in our system. Please contact the Admin to create your account first.',
      });
    } else {
      // Update existing user with Google details if they log in via Google
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
      }
    }

    sendTokenResponse(user, 200, res, 'Authentication successful');
  } catch (error) {
    console.error('Google token verification failed:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid Google Token',
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Simulate OTP generation
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();
    
    // Send email using Resend
    const emailResult = await sendOTP(email, otp, 'forgot-password');
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }
    
    console.log(`Email sent via Resend to ${email} with OTP: ${otp}`);
    
    res.json({ success: true, message: 'Recovery code sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email, resetOtp: otp, resetOtpExpiry: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const requestPasswordChange = async (req, res) => {
  const { email, currentPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Send email using Resend
    const emailResult = await sendOTP(email, otp, 'password-change');
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    console.log(`Email sent via Resend to ${email} with OTP: ${otp} (Password Change)`);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const verifyPasswordChange = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email, resetOtp: otp, resetOtpExpiry: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// --- Admin Management ---

export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password -resetOtp -resetOtpExpiry');
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const addAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    await newAdmin.save();
    
    // Return admin without password
    const adminData = { _id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role };
    res.status(201).json({ success: true, data: adminData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const removeAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const admin = await User.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Protection: Prevent deleting the primary super admin
    if (admin.email === 'sharda.academyofficial@gmail.com') {
      return res.status(403).json({ success: false, message: 'Cannot delete the primary Super Admin' });
    }

    await User.findByIdAndDelete(id);
    res.json({ success: true, message: 'Admin removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/'
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

export const me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar || req.user.profilePhoto
    }
  });
};
