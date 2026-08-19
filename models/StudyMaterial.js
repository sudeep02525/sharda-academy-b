import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  classLevel: { type: String, required: true },
  batch: { type: String },
  materialType: { type: String },
  attachmentName: { type: String },
  attachmentData: { type: String }, // This will store the Cloudinary URL
  pages: { type: String },
  fileSize: { type: String }
}, { timestamps: true });

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
export default StudyMaterial;
