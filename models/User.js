import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.googleId; } },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  resetOtp: { type: String },
  resetOtpExpiry: { type: Date },
  profilePhoto: { type: String }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
