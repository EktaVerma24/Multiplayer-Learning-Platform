// server/src/index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import { setupSocket } from './socket.js';
import authRoutes from './routes/authRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';


const app = express();

// Middleware
app.use(express.json());

// CORS
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    contentType: ['application/json', 'multipart/form-data'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/quizzes', quizRoutes);  
app.use('/api/notes', noteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);

const server = http.createServer(app);
setupSocket(server); // socket.io logic

// Connect to MongoDB
const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined in .env file');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

  
