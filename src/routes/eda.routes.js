/**
 * EDA Routes
 * 
 * Express router for EDA (Electrodermal Activity) data endpoints.
 * Defines REST API routes for health data management.
 * 
 * Base Path: /api/v1/health-data
 * 
 * Available Routes:
 * - POST /eda-batch - Batch upload EDA data from Samsung Watch
 * - GET /eda - Retrieve EDA data with pagination
 * 
 * @module routes/eda.routes
 * @requires express
 * @requires ../controllers/eda.controller
 */

import express from 'express';
import { batchUploadEDAData, getEDAData } from '../controllers/eda.controller.js';

const router = express.Router();

/**
 * POST /api/v1/health-data/eda-batch
 * Batch upload EDA data from Samsung Watch
 * 
 * @name BatchUploadEDAData
 * @route {POST} /eda-batch
 * @bodyparam {Array<Object>} data - Array of EDA data records
 * @returns {Object} 201 - Upload success with inserted count
 * @returns {Object} 400 - Invalid request format
 * @returns {Object} 500 - Server error
 */
router.post('/eda-batch', batchUploadEDAData);

/**
 * GET /api/v1/health-data/eda
 * Retrieve EDA data with pagination
 * 
 * @name GetEDAData
 * @route {GET} /eda
 * @queryparam {string} [user_id] - Filter by user ID
 * @queryparam {number} [limit=50] - Records per page (max 500)
 * @queryparam {number} [page=1] - Page number
 * @returns {Object} 200 - Paginated EDA data
 * @returns {Object} 500 - Server error
 */
router.get('/eda', getEDAData);

export default router;
