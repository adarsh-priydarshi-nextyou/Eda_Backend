/**
 * EDA Data Controller
 * 
 * Handles HTTP requests for EDA (Electrodermal Activity) data management.
 * Provides endpoints for batch upload and retrieval of health data from Samsung Watch.
 * 
 * Features:
 * - Batch upload with duplicate detection and prevention
 * - Pagination support for data retrieval
 * - Automatic data validation and type conversion
 * - Comprehensive error handling and logging
 * 
 * @module controllers/eda.controller
 * @requires ../utils/logger
 * @requires ../models/EDAData
 */

import { logger } from '../utils/logger.js';
import EDAData from '../models/EDAData.js';

/**
 * Batch upload EDA data from Samsung Watch
 * 
 * Accepts array of health data records and stores them in MongoDB.
 * Implements duplicate detection at two levels:
 * 1. Within the request payload (removes duplicate timestamps)
 * 2. Against existing database records (skips already stored data)
 * 
 * @async
 * @function batchUploadEDAData
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Array<Object>} req.body.data - Array of EDA data records
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with upload status
 * 
 * @example
 * POST /api/v1/health-data/eda-batch
 * {
 *   "data": [
 *     {
 *       "user_id": "1234567890123456",
 *       "timestamp": "2026-03-28T11:32:58.795Z",
 *       "rr_interval_ms": 602,
 *       "accel_x": -1506,
 *       "accel_y": -3586,
 *       "accel_z": 1387,
 *       "step_count": 836,
 *       "eda": 2.5,
 *       "sensor_datetime_ist": "28/03/2026, 17:02:58",
 *       "watch_data_send_datetime_ist": "28/03/2026, 17:06:19"
 *     }
 *   ]
 * }
 */
export const batchUploadEDAData = async (req, res) => {
  const { data } = req.body;

  try {
    /* Validate request payload */
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format - expected non-empty array',
      });
    }

    const watchUserId = data[0]?.user_id;

    logger.info('EDA data sync started', {
      user_id: watchUserId,
      records: data.length,
    });

    /* Remove duplicates within request payload based on timestamp */
    const seenTimestamps = new Set();
    const uniqueEntries = [];
    let duplicatesRemoved = 0;

    for (const entry of data) {
      const key = `${entry.user_id}_${entry.timestamp}`;
      
      if (!seenTimestamps.has(key)) {
        seenTimestamps.add(key);
        /* Convert and validate data types */
        uniqueEntries.push({
          user_id: String(entry.user_id),
          timestamp: String(entry.timestamp),
          rr_interval_ms: Number(entry.rr_interval_ms) || 0,
          accel_x: Number(entry.accel_x) || 0,
          accel_y: Number(entry.accel_y) || 0,
          accel_z: Number(entry.accel_z) || 0,
          step_count: Number(entry.step_count) || 0,
          eda: Number(entry.eda) || 0,
          eda_status: Number(entry.eda_status) || 0,
          eda_timestamp_ist: String(entry.eda_timestamp_ist) || '',
          sensor_datetime_ist: String(entry.sensor_datetime_ist) || '',
        });
      } else {
        duplicatesRemoved++;
      }
    }

    if (duplicatesRemoved > 0) {
      logger.warn('Duplicate timestamps filtered', {
        user_id: watchUserId,
        duplicates: duplicatesRemoved,
        unique: uniqueEntries.length,
      });
    }

    /* Check for existing records in database */
    const existingRecords = await EDAData.find({
      user_id: watchUserId,
      timestamp: { $in: uniqueEntries.map(e => e.timestamp) }
    }).select('timestamp').lean();

    const existingTimestamps = new Set(existingRecords.map(r => r.timestamp));
    const newEntries = uniqueEntries.filter(e => !existingTimestamps.has(e.timestamp));
    const dbDuplicates = uniqueEntries.length - newEntries.length;

    if (dbDuplicates > 0) {
      logger.warn('Existing records found in DB', {
        user_id: watchUserId,
        existing: dbDuplicates,
        new: newEntries.length,
      });
    }

    /* Return early if all records already exist */
    if (newEntries.length === 0) {
      return res.status(201).json({
        success: true,
        message: 'All records already exist in database',
        data: {
          inserted: 0,
          duplicates: data.length,
          user_id: watchUserId,
        },
      });
    }

    /* Insert new records into MongoDB */
    const result = await EDAData.insertMany(newEntries, {
      ordered: false, /* Continue on duplicate key errors */
    });

    const insertedCount = Array.isArray(result) ? result.length : (result.insertedCount || 0);

    logger.info('EDA data uploaded', {
      user_id: watchUserId,
      count: insertedCount,
    });

    return res.status(201).json({
      success: true,
      message: 'EDA data uploaded successfully',
      data: {
        inserted: insertedCount,
        duplicates: duplicatesRemoved + dbDuplicates,
        user_id: watchUserId,
      },
    });

  } catch (error) {
    /* Handle MongoDB duplicate key errors */
    if (error.code === 11000) {
      const insertedCount = error.result?.nInserted || error.insertedDocs?.length || 0;
      const watchUserId = data[0]?.user_id;

      logger.warn('Duplicates skipped', {
        user_id: watchUserId,
        inserted: insertedCount,
        duplicates: data.length - insertedCount,
      });

      return res.status(201).json({
        success: true,
        message: 'EDA data uploaded with duplicates skipped',
        data: {
          inserted: insertedCount,
          duplicates: data.length - insertedCount,
          user_id: watchUserId,
        },
      });
    }

    logger.error('Upload failed', { error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get EDA data with pagination
 * 
 * Retrieves EDA data from MongoDB with optional filtering by user_id.
 * Supports pagination with configurable page size (max 500 records per page).
 * Results are sorted by creation date in descending order (newest first).
 * 
 * @async
 * @function getEDAData
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} [req.query.user_id] - Filter by user ID
 * @param {number} [req.query.limit=50] - Records per page (max 500)
 * @param {number} [req.query.page=1] - Page number
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with paginated data
 * 
 * @example
 * GET /api/v1/health-data/eda?user_id=1234567890123456&limit=100&page=1
 */
export const getEDAData = async (req, res) => {
  try {
    const { user_id, limit = 50, page = 1 } = req.query;

    /* Validate and sanitize pagination parameters */
    const limitValue = Math.min(parseInt(limit, 10) || 50, 500); /* Max 500 records per page */
    const pageValue = parseInt(page, 10) || 1;
    const skip = (pageValue - 1) * limitValue;

    /* Build query filter */
    const query = {};
    if (user_id) {
      query.user_id = user_id;
    }

    /* Fetch data with pagination */
    const data = await EDAData.find(query)
      .sort({ createdAt: -1 }) /* Newest first */
      .skip(skip)
      .limit(limitValue)
      .lean(); /* Return plain JavaScript objects */

    /* Get total count for pagination metadata */
    const total = await EDAData.countDocuments(query);

    logger.info('EDA data retrieved', {
      count: data.length,
      total,
      user_id: user_id || 'all',
    });

    return res.status(200).json({
      success: true,
      message: 'EDA data retrieved successfully',
      data: data,
      pagination: {
        total,
        page: pageValue,
        limit: limitValue,
        pages: Math.ceil(total / limitValue),
      },
    });

  } catch (error) {
    logger.error('Get EDA data failed', { error: error.message });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
