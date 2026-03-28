/**
 * EDA Data Model
 * Collection: EDA_Data
 * 
 * Stores health data with EDA (Electrodermal Activity) from Samsung Watch
 */

import mongoose from 'mongoose';

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
    watch_data_send_datetime_ist: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'Eda_Data',
  }
);

// Compound index for duplicate prevention
edaDataSchema.index({ user_id: 1, timestamp: 1 }, { unique: true });

const EDAData = mongoose.model('EDAData', edaDataSchema);

export default EDAData;
