import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNo: { type: String, required: true },
  course: { type: String, default: "JEE Advanced Batch" },
  batch: { type: String, default: "Batch A" },
  personalInfo: { type: Object },
  admissionInfo: { type: Object },
  attendance: {
    percentage: { type: Number, default: 0 },
    recent: [
      { date: { type: String }, status: { type: String, enum: ['Present', 'Absent', 'Late'] } }
    ]
  },
  fees: [
    {
      title: { type: String },
      amount: { type: Number },
      amountPaid: { type: Number, default: 0 },
      paymentMethod: { type: String },
      dueDate: { type: String },
      status: { type: String, enum: ['Paid', 'Pending', 'Unpaid', 'Overdue'] }
    }
  ],
  notices: [
    {
      title: { type: String },
      date: { type: String },
      isRecent: { type: Boolean, default: false }
    }
  ],
  timetable: [
    {
      subject: { type: String },
      time: { type: String },
      teacher: { type: String }
    }
  ],
  homework: [
    {
      title: { type: String },
      description: { type: String },
      subject: { type: String },
      dueDate: { type: String },
      teacherName: { type: String },
      attachmentName: { type: String },
      attachmentData: { type: String },
      cloudinaryPublicId: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  results: [
    {
      examName: { type: String },
      marks: [
        {
          subject: { type: String },
          obtained: { type: Number },
          max: { type: Number },
          passingMarks: { type: Number }
        }
      ]
    }
  ]
}, { timestamps: true, suppressReservedKeysWarning: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;
