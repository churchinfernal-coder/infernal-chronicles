const express = require('express');
const { Post } = require('../models/Post');
const Redis = require('ioredis');
const auditLogger = require('../middleware/auditLogger');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const redis = new Redis();

// Healthcheck endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Timeline route with Redis caching
router.get('/', async (req, res) => {
  authMiddleware(req, res, async () => {
    const userId = req.user.id;
    const requestId = req.headers['x-request-id'] || Date.now().toString();
    const cacheKey = `timeline:${userId}`;
    try {
      let timeline = await redis.get(cacheKey);
      if (timeline) {
        auditLogger({
          timestamp: new Date().toISOString(),
          userId,
          route: req.originalUrl,
          method: req.method,
          action: 'timeline_cache_hit'
        });
        return res.json(JSON.parse(timeline));
      }
      timeline = await Post.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
      await redis.set(cacheKey, JSON.stringify(timeline), 'EX', 60);
      auditLogger({
        timestamp: new Date().toISOString(),
        userId,
        route: req.originalUrl,
        method: req.method,
        action: 'timeline_cache_miss'
      });
      res.json(timeline);
    } catch (err) {
      auditLogger({
        timestamp: new Date().toISOString(),
        userId,
        route: req.originalUrl,
        method: req.method,
        action: 'timeline_error',
        error: err.message
      });
      res.status(500).json({ error: 'Failed to fetch timeline' });
    }
  });
});

module.exports = router;
