// HTTP response envelope helpers for Express and http.ServerResponse
import { RESPONSE_DEFAULTS } from './defaults.js';
import { validateNumber, validateString, validateObject } from '../shared/validate.js';

function sendJson(res, statusCode, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload);
  }

  // Raw http.ServerResponse fallback
  const body = JSON.stringify(payload);
  if (!res.headersSent) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(body));
  }
  res.end(body);
  return res;
}

function buildEnvelope({ success, message, data, error, options = {} }) {
  const envelope = {
    [RESPONSE_DEFAULTS.FIELD_SUCCESS]: success,
    [RESPONSE_DEFAULTS.FIELD_MESSAGE]: message
  };

  if (success) {
    envelope[RESPONSE_DEFAULTS.FIELD_DATA] = data !== undefined ? data : null;
  } else {
    envelope[RESPONSE_DEFAULTS.FIELD_ERROR] = error !== undefined ? error : null;
  }

  const includeTimestamp = options.includeTimestamp !== undefined
    ? options.includeTimestamp
    : RESPONSE_DEFAULTS.INCLUDE_TIMESTAMP;

  if (includeTimestamp) {
    envelope[RESPONSE_DEFAULTS.FIELD_TIMESTAMP] = new Date().toISOString();
  }

  return envelope;
}

export function success(res, data = null, message = 'Success', status = RESPONSE_DEFAULTS.STATUS_OK, options = {}) {
  validateString(message, 'message');
  validateNumber(status, 'status', { min: 100, max: 599, integer: true });
  validateObject(options, 'options');

  const payload = buildEnvelope({ success: true, message, data, options });
  return sendJson(res, status, payload);
}

export function created(res, data = null, message = 'Resource created', status = RESPONSE_DEFAULTS.STATUS_CREATED, options = {}) {
  return success(res, data, message, status, options);
}

export function error(res, message = 'An error occurred', status = RESPONSE_DEFAULTS.STATUS_INTERNAL_ERROR, details = null, options = {}) {
  validateString(message, 'message');
  validateNumber(status, 'status', { min: 100, max: 599, integer: true });
  validateObject(options, 'options');

  const payload = buildEnvelope({ success: false, message, error: details, options });
  return sendJson(res, status, payload);
}

export function notFound(res, message = 'Resource not found', details = null, options = {}) {
  return error(res, message, RESPONSE_DEFAULTS.STATUS_NOT_FOUND, details, options);
}
