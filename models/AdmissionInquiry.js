import mongoose from 'mongoose';

const AdmissionInquirySchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  parentName:  { type: String, required: true },
  email:       { type: String, required: true },
  phone:       { type: String, required: true },
  altPhone:    { type: String, default: '' },
  course:      { type: String, required: true },
  qualification: { type: String, required: true },
  batch:       { type: String, required: true },
  address:     { type: String, required: true },
  message:     { type: String, default: '' },
  status:      { type: String, enum: ['New', 'Contacted', 'Enrolled', 'Rejected'], default: 'New' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('AdmissionInquiry', AdmissionInquirySchema);
