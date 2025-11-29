// server/src/index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { setupSocket } from './socket.js';
import authRoutes from './routes/authRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());

// CORS
app.use(
  cors({
    origin:  process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    contentType: ['application/json', 'multipart/form-data'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// Health check endpoint (before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/quizzes', quizRoutes);  
app.use('/api/notes', noteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Check if running on Render (where build is copied to server/client/dist)
  const renderPath = path.join(__dirname, '../client/dist');
  const localPath = path.join(__dirname, '../../client/dist');
  
  let clientBuildPath;
  if (fs.existsSync(renderPath)) {
    clientBuildPath = renderPath;
    console.log('📁 Using Render path for client files');
  } else if (fs.existsSync(localPath)) {
    clientBuildPath = localPath;
    console.log('📁 Using local path for client files');
  } else {
    console.error('❌ Client build not found at:', renderPath, 'or', localPath);
    clientBuildPath = renderPath; // fallback
  }
  
  console.log('📁 Serving static files from:', clientBuildPath);
  
  // Serve static files with proper cache headers
  app.use(express.static(clientBuildPath, {
    maxAge: '1d',
    etag: true,
    lastModified: true
  }));

  // Handle React routing - return index.html for any non-API routes
  // This MUST be after all API routes
  app.use((req, res, next) => {
    // Skip if it's an API request or already handled
    if (req.path.startsWith('/api') || res.headersSent) {
      return next();
    }
    
    // Only handle GET requests for HTML pages
    if (req.method === 'GET' && !req.path.includes('.')) {
      console.log('🔄 Serving index.html for:', req.path);
      const indexPath = path.join(clientBuildPath, 'index.html');
      return res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('❌ Error sending index.html:', err);
          res.status(500).send('Error loading application');
        }
      });
    }
    
    next();
  });
  
  console.log('✅ SPA routing configured - all non-API routes will serve index.html');
}

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

  
