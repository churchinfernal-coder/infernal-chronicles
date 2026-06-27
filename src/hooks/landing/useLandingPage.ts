// 
// REACT HOOKS - Landing Pages
// Custom hooks for data fetching with loading/error states
// 

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getCompletePageData,
  getAllCountries,
  searchLocations,
} from '@/lib/landing/queries/landingQueries';
import { analytics } from '@/lib/landing/analytics';
import type {
  Country,
  State,
  City,
  LandingPageContent,
  LandingSEOMetadata,
  PageData,
} from '@/types/landing';

// 
// MAIN PAGE DATA HOOK
// 

interface UseLandingPageResult {
  loading: boolean;
  error: string | null;
  data: PageData | null;
}

/**
 * Main hook for landing page data
 */
export function useLandingPage(): UseLandingPageResult {
  const { country, state, city } = useParams<{
    country: string;
    state?: string;
    city?: string;
  }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PageData | null>(null);

  useEffect(() => {
    loadPageData();
  }, [country, state, city, i18n.language]);

  async function loadPageData() {
    if (!country) {
      setError('No country specified');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pageData = await getCompletePageData(
        country,
        state,
        city,
        i18n.language
      );

      if (!pageData) {
        setError('Location not found');
        navigate('/404', { replace: true });
        return;
      }

      // Track page view
      const locationType = city ? 'city' : state ? 'state' : 'country';
      const locationId = city
        ? pageData.city!.id
        : state
        ? pageData.state!.id
        : pageData.country.id;

      analytics.trackPageView({
        entity_type: locationType,
        entity_id: locationId,
        language: i18n.language,
      });

      setData({
        location: {
          country: pageData.country,
          state: pageData.state || undefined,
          city: pageData.city || undefined,
        },
        content: pageData.content!,
        seo: pageData.seo!,
        subLocations: pageData.subLocations,
      });
    } catch (err) {
      console.error('Failed to load page data:', err);
      setError('Failed to load page data');
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, data };
}

// 
// COUNTRIES HOOK
// 

interface UseCountriesResult {
  loading: boolean;
  error: string | null;
  countries: Country[];
}

/**
 * Hook to get all countries
 */
export function useCountries(): UseCountriesResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    loadCountries();
  }, []);

  async function loadCountries() {
    try {
      const data = await getAllCountries();
      setCountries(data);
    } catch (err) {
      console.error('Failed to load countries:', err);
      setError('Failed to load countries');
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, countries };
}

// 
// SEARCH HOOK
// 

interface UseLocationSearchResult {
  loading: boolean;
  results: {
    countries: Country[];
    states: State[];
    cities: City[];
  };
  search: (query: string) => Promise<void>;
  clear: () => void;
}

/**
 * Hook for location search
 */
export function useLocationSearch(): UseLocationSearchResult {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    countries: Country[];
    states: State[];
    cities: City[];
  }>({
    countries: [],
    states: [],
    cities: [],
  });

  async function search(query: string) {
    if (!query || query.length < 2) {
      clear();
      return;
    }

    setLoading(true);
    try {
      const data = await searchLocations(query);
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setResults({ countries: [], states: [], cities: [] });
  }

  return { loading, results, search, clear };
}

// 
// CTA TRACKING HOOK
// 

/**
 * Hook to track CTA clicks
 */
export function useCTATracking() {
  const trackClick = (ctaName: string, destination: string) => {
    analytics.trackCTAClick(ctaName, destination);
  };

  return { trackClick };
}

// 
// SCROLL DEPTH HOOK
// 

/**
 * Hook to track scroll depth
 */
export function useScrollDepth() {
  const [scrollDepth, setScrollDepth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercentage = Math.round(
        ((window.scrollY + window.innerHeight) /
          document.documentElement.scrollHeight) *
          100
      );
      setScrollDepth(Math.min(scrollPercentage, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollDepth;
}

// 
// PAGE VISIBILITY HOOK
// 

/**
 * Hook to track page visibility
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}
