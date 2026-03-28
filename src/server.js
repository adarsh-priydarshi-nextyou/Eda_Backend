/**
 * EDA Backend Server
 * 
 * Express.js server for handling Electrodermal Activity (EDA) data from Samsung Watch.
 * Provides REST API endpoints for batch upload and retrieval of health sensor data.
 * 
 * Features:
 * - MongoDB integration with Mongoose ODM
 * - CORS enabled for cross-origin requests
 * - JSON payload support up to 50MB
 * - Comprehensive error handling and logging
 * - Health check endpoint for monitoring
 * 
 * Environment Variables:
 * - PORT: Server port (default: 5001)
 * - MONGODB_URI: MongoDB connection string
 * - NODE_ENV: Environment mode (development/production)
 * 
 * @module server
 * @requires express
 * @requires mongoose
 * @requires cors
 * @requires dotenv
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import edaRoutes from './routes/eda.routes.js';

/* Load environment variables from .env file */
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

/* Middleware Configuration */
app.use(cors()); /* Enable CORS for all routes */
app.use(express.json({ limit: '50mb' })); /* Parse JSON bodies up to 50MB */
app.use(express.urlencoded({ extended: true, limit: '50mb' })); /* Parse URL-encoded bodies */

/* API Routes */
app.use('/api/v1/health-data', edaRoutes);

/**
 * Health check endpoint
 * Returns server status for monitoring and load balancers
 * 
 * @route GET /health
 * @returns {Object} 200 - Server status
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'EDA Backend is running' });
});

/* MongoDB Connection Configuration */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tech_user:Nextyou%4024@cluster0.ush6z3w.mongodb.net/?retryWrites=true&w=majority';

/* Connect to MongoDB and start server */
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    logger.info('MongoDB connected successfully');
    logger.info(`Database: ${mongoose.connection.name}`);
    logger.info(`Collection: Eda_Data`);
    
    /* Start Express server after successful DB connection */
    app.listen(PORT, () => {
      logger.info(`EDA Backend server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection failed:', error);
    process.exit(1); /* Exit with error code */
  });

/**
 * Global error handler middleware
 * Catches unhandled errors and returns 500 response
 */
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

export default app;
