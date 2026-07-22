/**
 * Rate Limiting Middleware
 * Purpose: Prevent abuse by limiting requests per hour per user
 * Hard gates: Enforce specific limits per endpoint
 */

import { Request, Response, NextFunction } from 'express';

// Rate limit configuration (requests per hour)
const RATE_LIMITS: Record<string, number> = {
  '/api/subscriptions/checkout': 5,      // Max 5 checkout attempts per hour
  '/api/ebooks/download': 100,            // Max 100 downloads per hour
  '/api/social': 50,                      // Max 50 social posts per hour
  '/api/user': 100,                       // Max 100 user API calls per hour
};

// In-memory store: userId -> { endpoint -> { count, resetAt } }
const rateLimitStore: Record<string, Record<string, { count: number; resetAt: number }>> = {};

/**
 * Get or initialize rate limit bucket for user+endpoint
 */
function getRateLimitBucket(userId: string, endpoint: string) {
  if (!rateLimitStore[userId]) {
    rateLimitStore[userId] = {};
  }

  const now = Date.now();
  const bucket = rateLimitStore[userId][endpoint];

  // Initialize or reset if expired
  if (!bucket || bucket.resetAt < now) {
    rateLimitStore[userId][endpoint] = {
      count: 0,
      resetAt: now + 3600000, // 1 hour from now
    };
  }

  return rateLimitStore[userId][endpoint];
}

/**
 * Rate limiting middleware
 * Hard gate: Return 429 if limit exceeded
 */
export function rateLimiting(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;

  // Only enforce rate limiting for authenticated requests
  if (!userId) {
    return next();
  }

  // Get applicable limit for this endpoint
  let limit: number | undefined;
  for (const [endpoint, maxRequests] of Object.entries(RATE_LIMITS)) {
    if (req.path.startsWith(endpoint)) {
      limit = maxRequests;
      break;
    }
  }

  // If no limit configured, allow request
  if (limit === undefined) {
    return next();
  }

  // Check rate limit bucket
  const bucket = getRateLimitBucket(userId, req.path);
  bucket.count++;

  const timeUntilReset = Math.ceil((bucket.resetAt - Date.now()) / 1000);

  // Set rate limit headers
  res.set('X-RateLimit-Limit', String(limit));
  res.set('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
  res.set('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  // Block if exceeded
  if (bucket.count > limit) {
    console.warn(`[RATE-LIMIT] User ${userId} exceeded limit for ${req.path}: ${bucket.count}/${limit}`);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry after ${timeUntilReset} seconds.`,
      retryAfter: timeUntilReset,
    });
  }

  console.log(`[RATE-LIMIT] User ${userId} - ${req.path}: ${bucket.count}/${limit}`);
  next();
}

/**
 * Cleanup: Remove old entries from rate limit store (run periodically)
 * Prevents memory leaks from inactive users
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  for (const userId in rateLimitStore) {
    for (const endpoint in rateLimitStore[userId]) {
      if (rateLimitStore[userId][endpoint].resetAt < oneHourAgo) {
        delete rateLimitStore[userId][endpoint];
      }
    }

    // Remove user bucket if empty
    if (Object.keys(rateLimitStore[userId]).length === 0) {
      delete rateLimitStore[userId];
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupRateLimitStore, 30 * 60 * 1000);
