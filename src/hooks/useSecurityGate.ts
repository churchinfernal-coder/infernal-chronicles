/**
 * useSecurityGate Hook
 * Purpose: React hook for client-side security checks
 * Verifies auth, subscription status, rate limits
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth'; // Assumes existing auth hook

interface SecurityGateState {
  isAuthorized: boolean;
  hasActiveSubscription: boolean;
  isWithinRateLimit: boolean;
  error?: string;
  loading: boolean;
}

/**
 * Custom hook for security gate checks
 * Usage: const { isAuthorized } = useSecurityGate();
 */
export function useSecurityGate(): SecurityGateState {
  const { user, token } = useAuth();
  const [state, setState] = useState<SecurityGateState>({
    isAuthorized: false,
    hasActiveSubscription: false,
    isWithinRateLimit: true,
    loading: true,
  });

  // Check if user is authorized (has valid JWT)
  const checkAuthorization = useCallback(() => {
    if (!user || !token) {
      return false;
    }

    // Verify token is not expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      return expiryTime > Date.now();
    } catch {
      return false;
    }
  }, [user, token]);

  // Check if user has active subscription
  const checkSubscription = useCallback(async () => {
    if (!user || !token) {
      return false;
    }

    try {
      const response = await fetch('/api/subscriptions/check', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.active === true;
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return false;
    }
  }, [user, token]);

  // Check rate limit (based on response headers)
  const checkRateLimit = useCallback(() => {
    // This is checked server-side; client can read headers:
    // X-RateLimit-Remaining > 0
    return true; // Default to allow; server will block if exceeded
  }, []);

  // Run security checks on mount and when dependencies change
  useEffect(() => {
    const runChecks = async () => {
      try {
        const authorized = checkAuthorization();
        const subscription = authorized ? await checkSubscription() : false;
        const rateLimit = checkRateLimit();

        setState({
          isAuthorized: authorized,
          hasActiveSubscription: subscription,
          isWithinRateLimit: rateLimit,
          loading: false,
        });
      } catch (error) {
        setState({
          isAuthorized: false,
          hasActiveSubscription: false,
          isWithinRateLimit: false,
          error: String(error),
          loading: false,
        });
      }
    };

    runChecks();
  }, [checkAuthorization, checkSubscription, checkRateLimit]);

  return state;
}

/**
 * Component wrapper for security-gated content
 * Usage: <SecureContent><YourComponent /></SecureContent>
 */
interface SecureContentProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  fallback?: React.ReactNode;
}

export function SecureContent({ children, requireSubscription = false, fallback }: SecureContentProps) {
  const security = useSecurityGate();

  if (security.loading) {
    return <div className="p-4 text-center">Verifying access...</div>;
  }

  if (!security.isAuthorized) {
    return fallback || <div className="p-4 text-red-600">Unauthorized. Please log in.</div>;
  }

  if (requireSubscription && !security.hasActiveSubscription) {
    return fallback || <div className="p-4 text-yellow-600">Subscription required to access this content.</div>;
  }

  if (!security.isWithinRateLimit) {
    return fallback || <div className="p-4 text-orange-600">Too many requests. Please try again later.</div>;
  }

  return <>{children}</>;
}

/**
 * Hook to add JWT token to fetch requests
 * Usage: const { fetchWithAuth } = useAuthFetch();
 */
export function useAuthFetch() {
  const { token } = useAuth();

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token || ''}`,
        },
      });
    },
    [token]
  );

  return { fetchWithAuth };
}
