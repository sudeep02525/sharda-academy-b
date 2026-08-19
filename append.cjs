const fs = require('fs');
const content = `
// Fee Receipts & Cash Payment
export const getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find().populate('studentId', 'name email').sort({ paymentDate: -1 });
    res.json({ success: true, data: receipts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const recordCashPayment = async (req, res) => {
  try {
    const { studentId, amountPaid, collectedBy } = req.body;
    if (!studentId || !amountPaid || amountPaid <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    const student = await Student.findOne({ user: studentId });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    let totalFee = 0;
    let oldPaidTillNow = 0;
    student.fees.forEach(f => {
      totalFee += f.amount || 0;
      oldPaidTillNow += f.amountPaid || 0;
    });

    const oldDue = totalFee - oldPaidTillNow;
    if (amountPaid > oldDue) {
      return res.status(400).json({ success: false, message: 'Amount exceeds remaining due' });
    }

    const pendingFees = student.fees.filter(f => f.status !== 'Paid').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    let remainingPayment = Number(amountPaid);

    for (let fee of pendingFees) {
      if (remainingPayment <= 0) break;
      const dueOnFee = (fee.amount || 0) - (fee.amountPaid || 0);
      if (dueOnFee > 0) {
        const applyToFee = Math.min(dueOnFee, remainingPayment);
        fee.amountPaid = (fee.amountPaid || 0) + applyToFee;
        remainingPayment -= applyToFee;
        if (fee.amountPaid >= fee.amount) {
          fee.status = 'Paid';
          fee.paymentMethod = 'Cash';
        }
      }
    }
    
    await student.save();

    const newPaidTillNow = oldPaidTillNow + Number(amountPaid);
    const newDue = totalFee - newPaidTillNow;
    
    const count = await Receipt.countDocuments();
    const receiptNumber = \`SA-\${new Date().getFullYear()}-\${(count + 1).toString().padStart(4, '0')}\`;

    const receipt = await Receipt.create({
      receiptNumber,
      studentId: studentId,
      amountPaid: Number(amountPaid),
      totalFee,
      paidTillNow: newPaidTillNow,
      dueAmount: newDue,
      paymentMode: 'Cash',
      collectedBy: collectedBy || req.user?.name || 'Admin',
      paymentDate: new Date()
    });

    res.json({ success: true, message: 'Cash payment recorded', data: receipt });
  } catch (error) {
    console.error('Record cash error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
`;
fs.appendFileSync('controllers/adminController.js', content);
