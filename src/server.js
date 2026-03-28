/**
 * EDA Backend Server
 * Handles EDA data from Samsung Watch
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import edaRoutes from './routes/eda.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/v1/health-data', edaRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'EDA Backend is running' });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tech_user:Nextyou@24@cluster0.ush6z3w.mongodb.net/';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('MongoDB connected successfully');
    logger.info(`Database: ${mongoose.connection.name}`);
    logger.info(`Collection: Eda_Data`);
    
    app.listen(PORT, () => {
      logger.info(`EDA Backend server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  });

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

export default app;
