import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

import adminRoutes from './routes/adminRoutes.js';

// Application Routes (removed /api prefix)
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);

// Basic Health Check Routes
app.get('/health', (req, res) => res.json({ status: 'ok', message: 'Server is healthy' }));
app.get('/api', (req, res) => res.json({ status: 'ok', message: 'API is reachable' }));

app.get('/', (req, res) => {
  res.send('Sharda Academy API is running...');
});
