// Express 4-arg error handling middleware and AppError class
import { ERROR_HANDLER_DEFAULTS } from './defaults.js';
import { error as sendError } from './response.js';
import { logger as defaultLogger } from './logger.js';
import { validateNumber, validateString, validateBoolean, validateObject } from '../shared/validate.js';

export class AppError extends Error {
  constructor(message, statusCode = ERROR_HANDLER_DEFAULTS.DEFAULT_STATUS, details = null, isOperational = true) {
    super(message);
    validateString(message, 'message');
    validateNumber(statusCode, 'statusCode', { min: 100, max: 599, integer: true });
    validateBoolean(isOperational, 'isOperational');

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export function errorHandler(options = {}) {
  validateObject(options, 'options');
  const loggerInstance = options.logger || defaultLogger;

  return function (err, req, res, next) {
    const statusCode = (err && typeof err.statusCode === 'number')
      ? err.statusCode
      : ERROR_HANDLER_DEFAULTS.DEFAULT_STATUS;

    const isProd = typeof process !== 'undefined' &&
      process.env &&
      process.env.NODE_ENV === ERROR_HANDLER_DEFAULTS.PRODUCTION_ENV;

    const isOperational = err && err.isOperational === true;

    // Log the error
    if (loggerInstance && typeof loggerInstance.error === 'function') {
      loggerInstance.error(`[Error] ${err ? err.message : 'Unknown error'}`, {
        statusCode,
        path: req ? req.originalUrl || req.url : undefined,
        method: req ? req.method : undefined,
        stack: isProd ? undefined : (err ? err.stack : undefined)
      });
    }

    let userMessage = ERROR_HANDLER_DEFAULTS.DEFAULT_MESSAGE;
    let details = null;

    if (!isProd) {
      userMessage = err && err.message ? err.message : ERROR_HANDLER_DEFAULTS.DEFAULT_MESSAGE;
      details = err && err.details ? err.details : (err && err.stack ? { stack: err.stack } : null);
    } else {
      // In production, only expose operational error messages
      if (isOperational && err && err.message) {
        userMessage = err.message;
        details = err.details || null;
      }
    }

    return sendError(res, userMessage, statusCode, details);
  };
}
