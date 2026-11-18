import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import {
  success,
  created,
  error,
  notFound,
  createLogger,
  logger,
  AppError,
  errorHandler,
  createRequestMonitor
} from '../../src/server/index.js';

describe('devaura/server tests', () => {
  describe('response helpers', () => {
    it('formats envelopes correctly for raw http.ServerResponse mock', () => {
      let status = 200;
      let headers = {};
      let body = '';

      const resMock = {
        statusCode: 200,
        headersSent: false,
        setHeader(name, val) {
          headers[name] = val;
        },
        end(data) {
          body = data;
        }
      };

      success(resMock, { id: 1 }, 'Fetched item');
      const parsed = JSON.parse(body);
      assert.strictEqual(parsed.success, true);
      assert.strictEqual(parsed.message, 'Fetched item');
      assert.strictEqual(parsed.data.id, 1);
      assert.ok(parsed.timestamp);

      // error
      error(resMock, 'Failed to fetch', 500, { reason: 'db' });
      const errParsed = JSON.parse(body);
      assert.strictEqual(errParsed.success, false);
      assert.strictEqual(errParsed.message, 'Failed to fetch');
      assert.strictEqual(errParsed.error.reason, 'db');

      // notFound
      notFound(resMock, 'Item missing');
      const nfParsed = JSON.parse(body);
      assert.strictEqual(nfParsed.success, false);
      assert.strictEqual(nfParsed.message, 'Item missing');
    });

    it('works with Express res mock status().json() chaining', () => {
      let code = 0;
      let payload = null;
      const res = {
        status(c) {
          code = c;
          return this;
        },
        json(p) {
          payload = p;
          return this;
        }
      };

      created(res, { created: true }, 'Created new resource');
      assert.strictEqual(code, 201);
      assert.strictEqual(payload.success, true);
      assert.strictEqual(payload.data.created, true);
    });
  });

  describe('logger', () => {
    it('filters messages below configured level and writes to custom transport', () => {
      let written = [];
      const testLogger = createLogger({
        level: 'warn',
        timestamps: false,
        colors: false,
        transport: {
          write(str) {
            written.push(str.trim());
          }
        }
      });

      testLogger.debug('debug msg');
      testLogger.info('info msg');
      testLogger.warn('warn msg');
      testLogger.error('error msg');

      assert.strictEqual(written.length, 2);
      assert.ok(written[0].includes('WARN : warn msg'));
      assert.ok(written[1].includes('ERROR: error msg'));
    });
  });

  describe('errorHandler & AppError', () => {
    it('handles AppError and hides details in production', () => {
      const err = new AppError('Bad Input', 400, { field: 'email' }, true);
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.isOperational, true);

      let sentStatus = 0;
      let sentPayload = null;
      const res = {
        status(s) {
          sentStatus = s;
          return this;
        },
        json(p) {
          sentPayload = p;
          return this;
        }
      };

      const handler = errorHandler();

      // Dev mode (default)
      process.env.NODE_ENV = 'development';
      handler(err, { method: 'POST', url: '/api' }, res, () => {});
      assert.strictEqual(sentStatus, 400);
      assert.strictEqual(sentPayload.message, 'Bad Input');
      assert.deepStrictEqual(sentPayload.error, { field: 'email' });

      // Prod mode with non-operational error
      process.env.NODE_ENV = 'production';
      const crash = new Error('Database connection failed');
      handler(crash, { method: 'GET', url: '/api' }, res, () => {});
      assert.strictEqual(sentStatus, 500);
      assert.strictEqual(sentPayload.message, 'Internal Server Error');
      assert.strictEqual(sentPayload.error, null);

      process.env.NODE_ENV = 'test';
    });
  });

  describe('requestMonitor', () => {
    it('records stats, tracks latency, respects ignorePaths, and bounds ring buffer', () => {
      const monitor = createRequestMonitor({ maxHistorySize: 10, ignorePaths: ['/health'] });

      const reqMock = { method: 'GET', url: '/test' };
      let finishCallback;
      const resMock = {
        statusCode: 200,
        once(event, cb) {
          if (event === 'finish') finishCallback = cb;
        },
        removeListener() {}
      };

      monitor.middleware(reqMock, resMock, () => {});
      if (finishCallback) finishCallback();

      const stats = monitor.getStats();
      assert.strictEqual(stats.totalRequests, 1);
      assert.strictEqual(stats.statusCodes['2xx'], 1);
      assert.strictEqual(stats.slowestRoutes.length, 1);
      assert.strictEqual(stats.slowestRoutes[0].route, 'GET /test');

      // Test ignore path
      let nextCalled = false;
      monitor.middleware({ method: 'GET', url: '/health' }, resMock, () => {
        nextCalled = true;
      });
      assert.strictEqual(nextCalled, true);
      assert.strictEqual(monitor.getStats().totalRequests, 1); // unchanged

      // Ring buffer bounding
      for (let i = 0; i < 20; i++) {
        let fin;
        const r = {
          statusCode: 200,
          once(e, cb) { if (e === 'finish') fin = cb; },
          removeListener() {}
        };
        monitor.middleware({ method: 'GET', url: '/loop' }, r, () => {});
        if (fin) fin();
      }

      assert.strictEqual(monitor.getStats().sampleSize, 10); // capped at maxHistorySize

      monitor.resetStats();
      assert.strictEqual(monitor.getStats().totalRequests, 0);
    });
  });

  describe('Integration with real Express pipeline without network socket requirement', () => {
    it('handles requests, logs, monitors, and returns errors through Express router pipeline', () => {
      const app = express();
      const monitor = createRequestMonitor({ maxHistorySize: 50 });

      app.use(monitor.middleware);

      app.get('/api/users', (req, res) => {
        success(res, [{ id: 1, name: 'Alice' }]);
      });

      app.get('/api/error', (req, res, next) => {
        next(new AppError('Unauthorized access', 401, null, true));
      });

      app.get('/api/stats', monitor.statsHandler());

      app.use(errorHandler());

      // Execute request through Express app instance directly
      function simulate(method, url) {
        let statusCode = 200;
        let body = '';
        let headers = {};

        const req = new http.IncomingMessage();
        req.method = method;
        req.url = url;

        const res = new http.ServerResponse(req);
        res.status = function(code) {
          this.statusCode = code;
          return this;
        };
        res.json = function(obj) {
          body = JSON.stringify(obj);
          this.emit('finish');
          return this;
        };
        res.end = function(chunk) {
          if (chunk) body = chunk.toString();
          this.emit('finish');
          return this;
        };

        app.handle(req, res);
        return { statusCode: res.statusCode, body: body ? JSON.parse(body) : null };
      }

      // 1. Success endpoint
      const res1 = simulate('GET', '/api/users');
      assert.strictEqual(res1.statusCode, 200);
      assert.strictEqual(res1.body.success, true);
      assert.strictEqual(res1.body.data[0].name, 'Alice');

      // 2. Error endpoint
      const res2 = simulate('GET', '/api/error');
      assert.strictEqual(res2.statusCode, 401);
      assert.strictEqual(res2.body.success, false);
      assert.strictEqual(res2.body.message, 'Unauthorized access');

      // 3. Stats endpoint
      const res3 = simulate('GET', '/api/stats');
      assert.strictEqual(res3.statusCode, 200);
      assert.strictEqual(res3.body.data.totalRequests, 2);
      assert.strictEqual(res3.body.data.statusCodes['2xx'], 1);
      assert.strictEqual(res3.body.data.statusCodes['4xx'], 1);
    });
  });
});
