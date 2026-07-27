import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  context: {
    type: String,
    required: true,
    enum: ['login', 'forgot-password', 'admin-login', 'student-login'],
    default: 'login'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // The document will be automatically deleted after 5 minutes (300 seconds)
  }
});

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
