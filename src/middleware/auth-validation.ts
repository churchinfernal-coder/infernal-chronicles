/**
 * Auth Validation Middleware
 * Purpose: Enforce JWT authentication on all sensitive endpoints
 * Requirement: Hard gate - no auth = request blocked
 */

import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';

// Supabase JWT secret from environment
const JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET || '');

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/api/subscriptions',
  '/api/ebooks',
  '/api/social',
  '/api/user',
];

/**
 * Verify JWT token from Authorization header
 * Expected format: Authorization: Bearer <token>
 */
export async function authValidation(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Check Authorization header exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`[AUTH] No authorization header for ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized: Missing JWT token' });
  }

  const token = authHeader.substring(7); // Remove "Bearer "

  try {
    // Verify JWT signature
    const verified = await jwtVerify(token, JWT_SECRET);

    // Attach user info to request
    (req as any).user = verified.payload;
    (req as any).userId = verified.payload.sub; // sub = user ID

    console.log(`[AUTH] Token verified for user ${(req as any).userId}`);
    next();
  } catch (error) {
    console.error(`[AUTH] Invalid JWT: ${error}`);
    return res.status(401).json({ error: 'Unauthorized: Invalid JWT token' });
  }
}

/**
 * Check if user subscription is active
 * Used for: E-book access, premium content
 */
export async function checkSubscriptionActive(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user context' });
  }

  // TODO: Query subscriptions table for active subscription
  // SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
  // For now, attach subscription check to request
  (req as any).hasActiveSubscription = true; // Will be set by database query

  next();
}

/**
 * Rate limiting check (implemented by separate middleware)
 * This just logs the check
 */
export function checkRateLimit(req: Request, res: Response, next: NextFunction) {
  // Rate limiting is handled by rateLimitingMiddleware
  // This function is a placeholder for consistency
  next();
}

/**
 * Hard gate: Reject all unauthenticated requests to protected endpoints
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const isProtected = PROTECTED_ROUTES.some(route => req.path.startsWith(route));

  if (isProtected) {
    const user = (req as any).user;
    if (!user) {
      console.warn(`[AUTH] Blocked unauthenticated request to ${req.method} ${req.path}`);
      return res.status(401).json({ error: 'Unauthorized: JWT required' });
    }
  }

  next();
}

/**
 * Export middleware as Express compatible handler
 */
export const authMiddleware = [authValidation, requireAuth];
