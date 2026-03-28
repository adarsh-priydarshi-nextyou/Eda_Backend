/**
 * EDA Data Model
 * 
 * Mongoose schema for storing Electrodermal Activity (EDA) health data from Samsung Watch.
 * Collection: Eda_Data
 * 
 * Features:
 * - Stores sensor data including RR interval, accelerometer, steps, and EDA
 * - Duplicate prevention using compound index on user_id and timestamp
 * - Automatic timestamps (createdAt, updatedAt)
 * - IST timezone support for sensor timestamp
 * 
 * @module models/EDAData
 * @requires mongoose
 */

import mongoose from 'mongoose';

/**
 * EDA Data Schema Definition
 * 
 * @typedef {Object} EDADataSchema
 * @property {string} user_id - Unique user identifier (16-digit device-based ID)
 * @property {string} timestamp - ISO 8601 timestamp of data collection
 * @property {number} rr_interval_ms - RR interval in milliseconds from heart rate sensor
 * @property {number} accel_x - Accelerometer X-axis value
 * @property {number} accel_y - Accelerometer Y-axis value
 * @property {number} accel_z - Accelerometer Z-axis value
 * @property {number} step_count - Step count from accelerometer
 * @property {number} eda - Electrodermal Activity (skin conductance in μS)
 * @property {string} sensor_datetime_ist - IST timestamp when sensor detected data
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */
const edaDataSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: String,
      required: true,
    },
    rr_interval_ms: {
      type: Number,
      default: 0,
    },
    accel_x: {
      type: Number,
      default: 0,
    },
    accel_y: {
      type: Number,
      default: 0,
    },
    accel_z: {
      type: Number,
      default: 0,
    },
    step_count: {
      type: Number,
      default: 0,
    },
    eda: {
      type: Number,
      default: 0,
      required: true,
    },
    sensor_datetime_ist: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, /* Auto-generate createdAt and updatedAt */
    collection: 'Eda_Data', /* MongoDB collection name */
  }
);

/* Compound index for duplicate prevention - ensures unique user_id + timestamp combination */
edaDataSchema.index({ user_id: 1, timestamp: 1 }, { unique: true });

/**
 * EDA Data Model
 * @type {mongoose.Model}
 */
const EDAData = mongoose.model('EDAData', edaDataSchema);

export default EDAData;
