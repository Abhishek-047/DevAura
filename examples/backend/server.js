// Express server example showcasing devaura/server utilities
import express from 'express';
import {
  success,
  created,
  notFound,
  AppError,
  errorHandler,
  createRequestMonitor,
  logger
} from '../../dist/esm/server/index.js';

const app = express();
const port = process.env.PORT || 3000;

// Initialize request monitor
const monitor = createRequestMonitor({
  maxHistorySize: 200,
  ignorePaths: ['/health', '/favicon.ico']
});

app.use(express.json());
app.use(monitor.middleware);

// Health check endpoint
app.get('/health', (req, res) => {
  success(res, { status: 'healthy', uptime: process.uptime() }, 'Service is operational');
});

// Items in-memory demo store
const items = [
  { id: 1, name: 'Sample Item Alpha' },
  { id: 2, name: 'Sample Item Beta' }
];

// List items
app.get('/api/items', (req, res) => {
  logger.info(`Fetching items list (count: ${items.length})`);
  success(res, items, 'Items retrieved successfully');
});

// Create item
app.post('/api/items', (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string') {
    throw new AppError('Item name is required and must be a string', 400, { field: 'name' });
  }
  const newItem = { id: items.length + 1, name };
  items.push(newItem);
  created(res, newItem, 'Item created successfully');
});

// Trigger error example
app.get('/api/fail', (req, res) => {
  throw new AppError('Deliberate operational failure', 403, { code: 'PERMISSION_DENIED' });
});

// Expose live monitor stats
app.get('/api/stats', monitor.statsHandler());

// 404 handler
app.use((req, res) => {
  notFound(res, `Route ${req.method} ${req.url} does not exist`);
});

// DevAura centralized error handling middleware
app.use(errorHandler());

// Start server if executed directly via node CLI
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  app.listen(port, () => {
    logger.info(`DevAura backend server listening on port ${port}`);
  });
}

export default app;
