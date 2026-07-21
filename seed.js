import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Student from './models/Student.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Seeding data...');

    // Clear existing
    await User.deleteMany({ email: 'pooja@sharda.com' });
    
    // Create new
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const user = await User.create({
      name: 'Pooja',
      email: 'pooja@sharda.com',
      password: hashedPassword,
      role: 'student'
    });

    await Student.create({
      user: user._id,
      rollNo: 'SA2026001',
      course: 'JEE Advanced Batch',
      batch: 'Batch A',
      attendance: {
        percentage: 85,
        recent: [
          { date: '2026-07-20', status: 'Present' },
          { date: '2026-07-19', status: 'Present' },
          { date: '2026-07-18', status: 'Absent' }
        ]
      },
      fees: [
        { title: 'Term 1 Tuition', amount: 25000, dueDate: '2026-08-01', status: 'Pending' }
      ],
      notices: [
        { title: 'Chemistry Test Tomorrow', date: '2026-07-21', isNew: true }
      ],
      timetable: [
        { subject: 'Physics', time: '10:00 AM', teacher: 'R. K. Sharma' },
        { subject: 'Maths', time: '11:30 AM', teacher: 'S. Singh' }
      ]
    });

    // Create Admin User
    await User.deleteMany({ email: 'admin@sharda.com' });
    await User.create({
      name: 'Admin Panel',
      email: 'admin@sharda.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Dummy users created:');
    console.log('Student: pooja@sharda.com / password123');
    console.log('Admin: admin@sharda.com / password123');
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
