const client = require('prom-client');
const express = require('express');
const router = express.Router();

// Metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000]
});
const httpRequestCount = new client.Counter({
  name: 'http_request_count',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code']
});
const httpErrorCount = new client.Counter({
  name: 'http_error_count',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'code']
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Middleware for metrics
function prometheusMiddleware(req, res, next) {
  const startEpoch = Date.now();
  res.on('finish', () => {
    const responseTimeInMs = Date.now() - startEpoch;
    httpRequestDurationMicroseconds.labels(req.method, req.route?.path || req.path, res.statusCode).observe(responseTimeInMs);
    httpRequestCount.labels(req.method, req.route?.path || req.path, res.statusCode).inc();
    if (res.statusCode >= 400) {
      httpErrorCount.labels(req.method, req.route?.path || req.path, res.statusCode).inc();
    }
  });
  next();
}

module.exports = { router, prometheusMiddleware };
