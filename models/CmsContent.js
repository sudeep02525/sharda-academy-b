import mongoose from 'mongoose';

const cmsContentSchema = new mongoose.Schema({
  page: { 
    type: String, 
    required: true 
  },
  section: { 
    type: String, 
    required: true 
  },
  data: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  isPublished: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Create a unique index to ensure no duplicate sections exist for the same page
cmsContentSchema.index({ page: 1, section: 1 }, { unique: true });

export default mongoose.model('CmsContent', cmsContentSchema);
