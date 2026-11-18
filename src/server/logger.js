// Lightweight Node.js logger utility with levels and TTY color support
import { LOGGER_DEFAULTS } from './defaults.js';
import { validateString, validateBoolean, validateObject } from '../shared/validate.js';

const COLOR_CODES = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m'  // Red
};

export function createLogger(options = {}) {
  validateObject(options, 'options');

  const levelName = options.level !== undefined ? options.level : LOGGER_DEFAULTS.DEFAULT_LEVEL;
  validateString(levelName, 'level', { allowed: Object.keys(LOGGER_DEFAULTS.LEVELS) });

  const timestamps = options.timestamps !== undefined ? options.timestamps : LOGGER_DEFAULTS.TIMESTAMPS;
  validateBoolean(timestamps, 'timestamps');

  let colors = options.colors !== undefined ? options.colors : LOGGER_DEFAULTS.COLORS;
  validateBoolean(colors, 'colors');

  const transport = options.transport || null;

  // Auto-disable colors if NO_COLOR is present or stdout is not a TTY
  if (typeof process !== 'undefined') {
    if (process.env && (process.env.NO_COLOR !== undefined || process.env.NODE_DISABLE_COLORS !== undefined)) {
      colors = false;
    } else if (process.stdout && !process.stdout.isTTY && options.colors === undefined) {
      colors = false;
    }
  }

  function log(severity, message, ...args) {
    const minSeverity = LOGGER_DEFAULTS.LEVELS[levelName];
    const targetSeverity = LOGGER_DEFAULTS.LEVELS[severity];
    if (targetSeverity < minSeverity) {
      return;
    }

    const timeStr = timestamps ? `[${new Date().toISOString()}] ` : '';
    const upperLevel = severity.toUpperCase().padEnd(5);

    let prefix = `${timeStr}${upperLevel}:`;
    if (colors) {
      const color = COLOR_CODES[severity] || '';
      prefix = `${COLOR_CODES.dim}${timeStr}${COLOR_CODES.reset}${color}${upperLevel}${COLOR_CODES.reset}:`;
    }

    const output = `${prefix} ${message}`;

    if (transport && typeof transport.write === 'function') {
      const extra = args.length > 0 ? ' ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') : '';
      transport.write(`${output}${extra}\n`);
    } else {
      if (severity === 'error') {
        console.error(output, ...args);
      } else if (severity === 'warn') {
        console.warn(output, ...args);
      } else {
        console.log(output, ...args);
      }
    }
  }

  return {
    debug: (msg, ...args) => log('debug', msg, ...args),
    info: (msg, ...args) => log('info', msg, ...args),
    warn: (msg, ...args) => log('warn', msg, ...args),
    error: (msg, ...args) => log('error', msg, ...args),
    getLevel: () => levelName
  };
}

export const logger = createLogger();
