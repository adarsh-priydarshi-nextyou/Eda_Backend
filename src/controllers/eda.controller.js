/**
 * EDA Data Controller
 * Handles batch upload of EDA data from Samsung Watch
 */

import { logger } from '../utils/logger.js';
import EDAData from '../models/EDAData.js';

/**
 * Batch upload EDA data
 * Endpoint: POST /api/v1/health-data/eda-batch
 */
export const batchUploadEDAData = async (req, res) => {
  const { data } = req.body;

  try {
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

    // Remove duplicates based on timestamp
    const seenTimestamps = new Set();
    const uniqueEntries = [];
    let duplicatesRemoved = 0;

    for (const entry of data) {
      const key = `${entry.user_id}_${entry.timestamp}`;
      
      if (!seenTimestamps.has(key)) {
        seenTimestamps.add(key);
        uniqueEntries.push({
          user_id: String(entry.user_id),
          timestamp: String(entry.timestamp),
          rr_interval_ms: Number(entry.rr_interval_ms) || 0,
          accel_x: Number(entry.accel_x) || 0,
          accel_y: Number(entry.accel_y) || 0,
          accel_z: Number(entry.accel_z) || 0,
          step_count: Number(entry.step_count) || 0,
          eda: Number(entry.eda) || 0,
          sensor_datetime_ist: String(entry.sensor_datetime_ist) || '',
          watch_data_send_datetime_ist: String(entry.watch_data_send_datetime_ist) || '',
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

    // Check for existing records in DB
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

    // Insert new records
    const result = await EDAData.insertMany(newEntries, {
      ordered: false,
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
 * Endpoint: GET /api/v1/health-data/eda
 */
export const getEDAData = async (req, res) => {
  try {
    const { user_id, limit = 50, page = 1 } = req.query;

    const limitValue = Math.min(parseInt(limit, 10) || 50, 500);
    const pageValue = parseInt(page, 10) || 1;
    const skip = (pageValue - 1) * limitValue;

    const query = {};
    if (user_id) {
      query.user_id = user_id;
    }

    const data = await EDAData.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitValue)
      .lean();

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
