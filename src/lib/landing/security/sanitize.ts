// 
// SECURITY UTILITIES - XSS Protection, Validation, Sanitization
// 

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text (removes all HTML)
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Validate slug format (lowercase, hyphens only)
 */
export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Validate ISO country code
 */
export function validateISOCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Validate language code (ISO 639-1)
 */
export function validateLanguageCode(code: string): boolean {
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(code);
}

/**
 * Validate URL
 */
export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Hash IP for privacy (simple hash for client-side)
 */
export function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Escape SQL LIKE wildcards (defense in depth)
 */
export function escapeSQLLike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * Rate limiting check (client-side)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clean object for database insertion
 */
export function cleanObject<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        cleaned[key] = sanitizeText(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}
