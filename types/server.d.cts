// Type definitions for devaura/server

export interface EnvelopeOptions {
  includeTimestamp?: boolean;
}

export function success<T = any>(
  res: any,
  data?: T,
  message?: string,
  status?: number,
  options?: EnvelopeOptions
): any;

export function created<T = any>(
  res: any,
  data?: T,
  message?: string,
  status?: number,
  options?: EnvelopeOptions
): any;

export function error<T = any>(
  res: any,
  message?: string,
  status?: number,
  details?: T,
  options?: EnvelopeOptions
): any;

export function notFound<T = any>(
  res: any,
  message?: string,
  details?: T,
  options?: EnvelopeOptions
): any;

export interface LoggerOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';
  timestamps?: boolean;
  colors?: boolean;
  transport?: { write(msg: string): void };
}

export interface Logger {
  debug(msg: string, ...args: any[]): void;
  info(msg: string, ...args: any[]): void;
  warn(msg: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  getLevel(): string;
}

export function createLogger(options?: LoggerOptions): Logger;
export const logger: Logger;

export class AppError extends Error {
  statusCode: number;
  details: any;
  isOperational: boolean;
  constructor(message: string, statusCode?: number, details?: any, isOperational?: boolean);
}

export interface ErrorHandlerOptions {
  logger?: Logger;
}

export function errorHandler(
  options?: ErrorHandlerOptions
): (err: any, req: any, res: any, next: (err?: any) => void) => any;

export interface RequestMonitorOptions {
  maxHistorySize?: number;
  ignorePaths?: string[];
}

export interface MonitorStats {
  totalRequests: number;
  statusCodes: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
    other: number;
  };
  avgLatencyMs: number;
  p95LatencyMs: number;
  slowestRoutes: Array<{
    route: string;
    count: number;
    avgMs: number;
    maxMs: number;
  }>;
  sampleSize: number;
}

export interface RequestMonitorInstance {
  middleware(req: any, res: any, next: (err?: any) => void): void;
  getStats(): MonitorStats;
  resetStats(): void;
  statsHandler(): (req: any, res: any) => any;
}

export function createRequestMonitor(options?: RequestMonitorOptions): RequestMonitorInstance;
export const requestMonitor: (req: any, res: any, next: (err?: any) => void) => void;
export const getStats: () => MonitorStats;
export const resetStats: () => void;
export const statsHandler: () => (req: any, res: any) => any;

export const RESPONSE_DEFAULTS: {
  readonly STATUS_OK: number;
  readonly STATUS_CREATED: number;
  readonly STATUS_BAD_REQUEST: number;
  readonly STATUS_NOT_FOUND: number;
  readonly STATUS_INTERNAL_ERROR: number;
  readonly FIELD_SUCCESS: string;
  readonly FIELD_MESSAGE: string;
  readonly FIELD_DATA: string;
  readonly FIELD_ERROR: string;
  readonly FIELD_TIMESTAMP: string;
  readonly INCLUDE_TIMESTAMP: boolean;
};

export const LOGGER_DEFAULTS: {
  readonly LEVELS: {
    readonly debug: number;
    readonly info: number;
    readonly warn: number;
    readonly error: number;
  };
  readonly DEFAULT_LEVEL: string;
  readonly TIMESTAMPS: boolean;
  readonly COLORS: boolean;
};

export const ERROR_HANDLER_DEFAULTS: {
  readonly DEFAULT_STATUS: number;
  readonly DEFAULT_MESSAGE: string;
  readonly PRODUCTION_ENV: string;
};

export const MONITOR_DEFAULTS: {
  readonly MAX_HISTORY_SIZE: number;
  readonly MAX_SLOWEST_ROUTES: number;
  readonly DEFAULT_IGNORE_PATHS: readonly string[];
  readonly STATS_PATH: string;
};
