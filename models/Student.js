import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNo: { type: String, required: true },
  course: { type: String, default: "JEE Advanced Batch" },
  batch: { type: String, default: "Batch A" },
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
      dueDate: { type: String },
      status: { type: String, enum: ['Paid', 'Pending', 'Overdue'] }
    }
  ],
  notices: [
    {
      title: { type: String },
      date: { type: String },
      isNew: { type: Boolean, default: false }
    }
  ],
  timetable: [
    {
      subject: { type: String },
      time: { type: String },
      teacher: { type: String }
    }
  ]
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;
