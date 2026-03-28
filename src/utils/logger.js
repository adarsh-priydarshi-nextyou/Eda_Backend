/**
 * Logger Utility
 * 
 * Winston-based logging system for the EDA Backend.
 * Provides structured logging with timestamps, levels, and metadata support.
 * 
 * Features:
 * - Console logging with colors for development
 * - File logging for production (error.log and combined.log)
 * - Automatic logs directory creation
 * - Configurable log levels via LOG_LEVEL environment variable
 * - JSON metadata support for structured logging
 * 
 * Log Levels (in order of priority):
 * - error: Error messages
 * - warn: Warning messages
 * - info: Informational messages (default)
 * - debug: Debug messages
 * 
 * @module utils/logger
 * @requires winston
 * @requires fs
 * @requires path
 */

import winston from 'winston';
import fs from 'fs';
import path from 'path';

const { combine, timestamp, printf, colorize } = winston.format;

/* Ensure logs directory exists */
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format
 * Formats log messages with timestamp, level, message, and optional metadata
 * 
 * @param {Object} info - Log information object
 * @param {string} info.level - Log level
 * @param {string} info.message - Log message
 * @param {string} info.timestamp - Timestamp
 * @param {Object} metadata - Additional metadata
 * @returns {string} Formatted log message
 */
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  /* Append metadata as JSON if present */
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

/* Configure transports (output destinations) */
const transports = [
  /* Console transport with colors for development */
  new winston.transports.Console({
    format: combine(
      colorize(), /* Add colors to log levels */
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
  })
];

/* Add file transports in production or when logs directory exists */
if (process.env.NODE_ENV === 'production' || fs.existsSync(logsDir)) {
  transports.push(
    /* Error log file - only error level messages */
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    /* Combined log file - all log levels */
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  );
}

/**
 * Winston logger instance
 * 
 * @type {winston.Logger}
 * @example
 * logger.info('Server started', { port: 5001 });
 * logger.error('Database connection failed', { error: err.message });
 * logger.warn('Duplicate data detected', { count: 5 });
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', /* Default to 'info' level */
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports,
});
