import mongoose from 'mongoose';

const receiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amountPaid: { type: Number, required: true },
  totalFee: { type: Number, required: true },
  paidTillNow: { type: Number, required: true },
  dueAmount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Online', 'Cash'], required: true },
  transactionId: { type: String }, // Razorpay Payment ID or null for Cash
  collectedBy: { type: String }, // Staff name for Cash or null for Online
  paymentDate: { type: Date, default: Date.now }
}, { timestamps: true });

const Receipt = mongoose.model('Receipt', receiptSchema);
export default Receipt;
