/**
 * EDA Routes
 */

import express from 'express';
import { batchUploadEDAData, getEDAData } from '../controllers/eda.controller.js';

const router = express.Router();

// POST /api/v1/health-data/eda-batch - Batch upload EDA data
router.post('/eda-batch', batchUploadEDAData);

// GET /api/v1/health-data/eda - Get EDA data
router.get('/eda', getEDAData);

export default router;
