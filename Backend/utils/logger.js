/**
 * ============================================================================
 * ASYNCHRONOUS LOGGER
 * ============================================================================
 * Replaces synchronous console.log() calls. Writes logs asynchronously 
 * to prevent blocking the Node.js event loop during high API traffic.
 *
 * @module utils/logger
 * @requires winston
 * ============================================================================
 */

const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  ],
});

module.exports = logger;
