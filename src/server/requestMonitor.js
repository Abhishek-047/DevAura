// Bounded in-memory HTTP request monitoring middleware and statistics
import { MONITOR_DEFAULTS } from './defaults.js';
import { success } from './response.js';
import { validateObject, validateArray, validateNumber } from '../shared/validate.js';

export function createRequestMonitor(options = {}) {
  validateObject(options, 'options');

  const maxHistory = options.maxHistorySize !== undefined ? options.maxHistorySize : MONITOR_DEFAULTS.MAX_HISTORY_SIZE;
  validateNumber(maxHistory, 'maxHistorySize', { min: 10, integer: true });

  const ignorePaths = options.ignorePaths !== undefined ? options.ignorePaths : MONITOR_DEFAULTS.DEFAULT_IGNORE_PATHS;
  validateArray(ignorePaths, 'ignorePaths');

  let totalRequests = 0;
  let statusCodes = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 };
  let durations = []; // Ring buffer capped at maxHistory
  let routeStats = new Map(); // path -> { count, totalMs, maxMs }

  function recordRequest(method, path, statusCode, durationMs) {
    totalRequests++;

    const statusGroup = `${Math.floor(statusCode / 100)}xx`;
    if (statusCodes[statusGroup] !== undefined) {
      statusCodes[statusGroup]++;
    } else {
      statusCodes.other++;
    }

    // Maintain ring buffer for latency percentiles
    if (durations.length >= maxHistory) {
      durations.shift();
    }
    durations.push(durationMs);

    // Track per-route stats
    const routeKey = `${method.toUpperCase()} ${path}`;
    const current = routeStats.get(routeKey) || { count: 0, totalMs: 0, maxMs: 0 };
    current.count++;
    current.totalMs += durationMs;
    if (durationMs > current.maxMs) {
      current.maxMs = durationMs;
    }
    routeStats.set(routeKey, current);
  }

  function getStats() {
    let avgLatencyMs = 0;
    let p95LatencyMs = 0;

    if (durations.length > 0) {
      const sum = durations.reduce((acc, val) => acc + val, 0);
      avgLatencyMs = Number((sum / durations.length).toFixed(2));

      const sorted = [...durations].sort((a, b) => a - b);
      const p95Index = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1);
      p95LatencyMs = Number(sorted[p95Index].toFixed(2));
    }

    const slowestRoutes = Array.from(routeStats.entries())
      .map(([route, data]) => ({
        route,
        count: data.count,
        avgMs: Number((data.totalMs / data.count).toFixed(2)),
        maxMs: Number(data.maxMs.toFixed(2))
      }))
      .sort((a, b) => b.avgMs - a.avgMs)
      .slice(0, MONITOR_DEFAULTS.MAX_SLOWEST_ROUTES);

    return {
      totalRequests,
      statusCodes: { ...statusCodes },
      avgLatencyMs,
      p95LatencyMs,
      slowestRoutes,
      sampleSize: durations.length
    };
  }

  function resetStats() {
    totalRequests = 0;
    statusCodes = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 };
    durations = [];
    routeStats.clear();
  }

  function middleware(req, res, next) {
    const rawPath = req.path || (req.url ? req.url.split('?')[0] : '/');
    if (ignorePaths.includes(rawPath)) {
      if (typeof next === 'function') next();
      return;
    }

    const startTime = process.hrtime.bigint();

    const onFinish = () => {
      res.removeListener('finish', onFinish);
      res.removeListener('close', onFinish);

      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1e6;
      const statusCode = res.statusCode || 200;
      const method = req.method || 'GET';

      recordRequest(method, rawPath, statusCode, durationMs);
    };

    res.once('finish', onFinish);
    res.once('close', onFinish);

    if (typeof next === 'function') {
      next();
    }
  }

  function statsHandler() {
    return (req, res) => {
      return success(res, getStats(), 'Monitor statistics');
    };
  }

  return {
    middleware,
    getStats,
    resetStats,
    statsHandler
  };
}

const defaultMonitor = createRequestMonitor();
export const requestMonitor = defaultMonitor.middleware;
export const getStats = defaultMonitor.getStats;
export const resetStats = defaultMonitor.resetStats;
export const statsHandler = defaultMonitor.statsHandler;
