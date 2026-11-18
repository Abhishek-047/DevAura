// Named, documented default constants for devaura/server

export const RESPONSE_DEFAULTS = Object.freeze({
  STATUS_OK: 200,
  STATUS_CREATED: 201,
  STATUS_BAD_REQUEST: 400,
  STATUS_NOT_FOUND: 404,
  STATUS_INTERNAL_ERROR: 500,
  FIELD_SUCCESS: 'success',
  FIELD_MESSAGE: 'message',
  FIELD_DATA: 'data',
  FIELD_ERROR: 'error',
  FIELD_TIMESTAMP: 'timestamp',
  INCLUDE_TIMESTAMP: true
});

export const LOGGER_DEFAULTS = Object.freeze({
  LEVELS: Object.freeze({
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }),
  DEFAULT_LEVEL: 'info',
  TIMESTAMPS: true,
  COLORS: true
});

export const ERROR_HANDLER_DEFAULTS = Object.freeze({
  DEFAULT_STATUS: 500,
  DEFAULT_MESSAGE: 'Internal Server Error',
  PRODUCTION_ENV: 'production'
});

export const MONITOR_DEFAULTS = Object.freeze({
  MAX_HISTORY_SIZE: 500,
  MAX_SLOWEST_ROUTES: 10,
  DEFAULT_IGNORE_PATHS: Object.freeze(['/health', '/favicon.ico']),
  STATS_PATH: '/stats'
});
