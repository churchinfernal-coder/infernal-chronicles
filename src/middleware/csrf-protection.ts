/**
 * CSRF Protection Middleware
 * Purpose: Prevent Cross-Site Request Forgery on state-changing operations
 * Hard gate: POST/PUT/DELETE without valid CSRF token = blocked
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// CSRF token store: sessionId -> token
const csrfTokenStore: Record<string, string> = {};

// Token expiry: 1 hour
const TOKEN_EXPIRY = 3600000;

/**
 * Generate CSRF token for session
 * Called when user starts a session
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokenStore[sessionId] = token;

  // Auto-cleanup after expiry
  setTimeout(() => {
    delete csrfTokenStore[sessionId];
  }, TOKEN_EXPIRY);

  return token;
}

/**
 * Validate CSRF token
 * Required for: POST, PUT, DELETE, PATCH
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Only protect state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (!stateChangingMethods.includes(req.method)) {
    return next(); // GET, HEAD, OPTIONS don't need CSRF
  }

  // Get session ID (usually from cookie or header)
  const sessionId = (req as any).sessionId || req.headers['x-session-id'] as string;

  if (!sessionId) {
    console.warn(`[CSRF] No session ID for ${req.method} ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized: No session' });
  }

  // Get CSRF token from request (check multiple sources)
  const tokenFromHeader = req.headers['x-csrf-token'] as string;
  const tokenFromBody = (req.body as any)?.csrfToken;
  const token = tokenFromHeader || tokenFromBody;

  if (!token) {
    console.warn(`[CSRF] No CSRF token for ${req.method} ${req.path}`);
    return res.status(403).json({ error: 'Forbidden: CSRF token required' });
  }

  // Verify token matches stored token
  const storedToken = csrfTokenStore[sessionId];

  if (!storedToken || storedToken !== token) {
    console.warn(`[CSRF] Invalid CSRF token for ${req.method} ${req.path}`);
    return res.status(403).json({ error: 'Forbidden: Invalid CSRF token' });
  }

  console.log(`[CSRF] Valid token for ${req.method} ${req.path}`);
  next();
}

/**
 * Middleware to attach CSRF token to response
 * Client reads this and includes in requests
 */
export function attachCSRFToken(req: Request, res: Response, next: NextFunction) {
  const sessionId = (req as any).sessionId;

  if (sessionId) {
    const token = generateCSRFToken(sessionId);
    res.set('X-CSRF-Token', token);
  }

  next();
}

/**
 * Endpoint: GET /api/csrf-token
 * Client calls this to get a fresh CSRF token
 */
export function getCsrfTokenEndpoint(req: Request, res: Response) {
  const sessionId = (req as any).sessionId;

  if (!sessionId) {
    return res.status(401).json({ error: 'Unauthorized: No session' });
  }

  const token = generateCSRFToken(sessionId);
  res.json({ csrfToken: token });
}

/**
 * Hard gate: Verify CORS headers are set correctly
 * Prevents requests from unauthorized origins
 */
export function corsHeaders(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',      // Dev
    'http://localhost:3000',      // Dev alt
    process.env.PRODUCTION_URL,   // Production
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
}
