import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { initSocket } from './socket.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const server = http.createServer(app);
initSocket(server);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} with WebSockets enabled`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

import adminRoutes from './routes/adminRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import otpRoutes from './routes/otpRoutes.js';

// Application Routes (removed /api prefix)
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);

// CMS Universal Route
app.use('/api/cms', cmsRoutes);

// Upload Route
app.use('/api/upload', uploadRoutes);

// Admission Inquiries Route (public submit + CMS management)
app.use('/api/admissions', admissionRoutes);

// OTP Routes (Universal)
app.use('/api/otp', otpRoutes);

// Basic Health Check Routes
app.get('/health', (req, res) => res.json({ status: 'ok', message: 'Server is healthy' }));
app.get('/api', (req, res) => res.json({ status: 'ok', message: 'API is reachable' }));

app.get('/', (req, res) => {
  res.send('Sharda Academy API is running...');
});
