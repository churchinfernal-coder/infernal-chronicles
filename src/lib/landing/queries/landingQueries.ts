// 
// SUPABASE QUERIES - Landing Pages
// High-performance queries with automatic caching
// 

import { supabase } from '@/lib/supabase';
import { landingCache, getCacheKey, CACHE_TTL } from '../cache/landingCache';
import { validateSlug } from '../security/sanitize';
import type {
  Country,
  State,
  City,
  LandingPageContent,
  LandingSEOMetadata,
  LocationType,
} from '@/types/landing';

// 
// LOCATION QUERIES
// 

/**
 * Get country by slug (with caching)
 */
export async function getCountryBySlug(slug: string): Promise<Country | null> {
  if (!validateSlug(slug)) {
    console.error('Invalid country slug:', slug);
    return null;
  }

  const cacheKey = getCacheKey('country', slug);
  const cached = landingCache.get<Country>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (data) landingCache.set(cacheKey, data, CACHE_TTL.COUNTRIES);
    
    return data;
  } catch (error) {
    console.error('Error fetching country:', error);
    return null;
  }
}

/**
 * Get state by slug within a country (with caching)
 */
export async function getStateBySlug(
  countryId: string,
  slug: string
): Promise<State | null> {
  if (!validateSlug(slug)) {
    console.error('Invalid state slug:', slug);
    return null;
  }

  const cacheKey = getCacheKey('state', `${countryId}:${slug}`);
  const cached = landingCache.get<State>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('states')
      .select('*')
      .eq('country_id', countryId)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (data) landingCache.set(cacheKey, data, CACHE_TTL.STATES);
    
    return data;
  } catch (error) {
    console.error('Error fetching state:', error);
    return null;
  }
}

/**
 * Get city by slug within a state (with caching)
 */
export async function getCityBySlug(
  stateId: string,
  slug: string
): Promise<City | null> {
  if (!validateSlug(slug)) {
    console.error('Invalid city slug:', slug);
    return null;
  }

  const cacheKey = getCacheKey('city', `${stateId}:${slug}`);
  const cached = landingCache.get<City>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('state_id', stateId)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (data) landingCache.set(cacheKey, data, CACHE_TTL.CITIES);
    
    return data;
  } catch (error) {
    console.error('Error fetching city:', error);
    return null;
  }
}

/**
 * Get all states for a country (with caching)
 */
export async function getStatesByCountry(countryId: string): Promise<State[]> {
  const cacheKey = `states:country:${countryId}`;
  const cached = landingCache.get<State[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('states')
      .select('*')
      .eq('country_id', countryId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    
    const result = data || [];
    landingCache.set(cacheKey, result, CACHE_TTL.STATES);
    return result;
  } catch (error) {
    console.error('Error fetching states:', error);
    return [];
  }
}

/**
 * Get all cities for a state (with caching)
 */
export async function getCitiesByState(stateId: string): Promise<City[]> {
  const cacheKey = `cities:state:${stateId}`;
  const cached = landingCache.get<City[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('state_id', stateId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    
    const result = data || [];
    landingCache.set(cacheKey, result, CACHE_TTL.CITIES);
    return result;
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

/**
 * Get all active countries (with caching)
 */
export async function getAllCountries(): Promise<Country[]> {
  const cacheKey = 'countries:all';
  const cached = landingCache.get<Country[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    
    const result = data || [];
    landingCache.set(cacheKey, result, CACHE_TTL.COUNTRIES);
    return result;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

// 
// CONTENT QUERIES
// 

/**
 * Get landing page content (with caching)
 */
export async function getLandingPageContent(
  locationType: LocationType,
  locationId: string,
  languageCode: string
): Promise<LandingPageContent | null> {
  const cacheKey = getCacheKey(locationType, `content:${locationId}`, languageCode);
  const cached = landingCache.get<LandingPageContent>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('landing_page_content')
      .select('*')
      .eq('location_type', locationType)
      .eq('location_id', locationId)
      .eq('language_code', languageCode)
      .single();

    if (error) {
      // Try fallback to English if not found
      if (languageCode !== 'en') {
        return getLandingPageContent(locationType, locationId, 'en');
      }
      throw error;
    }
    
    if (data) landingCache.set(cacheKey, data, CACHE_TTL.CONTENT);
    return data;
  } catch (error) {
    console.error('Error fetching landing content:', error);
    return null;
  }
}

/**
 * Get SEO metadata (with caching)
 */
export async function getSEOMetadata(
  entityType: LocationType,
  entityId: string,
  languageCode: string
): Promise<LandingSEOMetadata | null> {
  const cacheKey = getCacheKey(entityType, `seo:${entityId}`, languageCode);
  const cached = landingCache.get<LandingSEOMetadata>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('landing_seo_metadata')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('language_code', languageCode)
      .single();

    if (error) {
      // Try fallback to English if not found
      if (languageCode !== 'en') {
        return getSEOMetadata(entityType, entityId, 'en');
      }
      throw error;
    }
    
    if (data) landingCache.set(cacheKey, data, CACHE_TTL.SEO);
    return data;
  } catch (error) {
    console.error('Error fetching SEO metadata:', error);
    return null;
  }
}

// 
// SEARCH QUERIES
// 

/**
 * Search locations (fuzzy search with trigram similarity)
 */
export async function searchLocations(
  query: string,
  limit: number = 10
): Promise<{
  countries: Country[];
  states: State[];
  cities: City[];
}> {
  if (!query || query.length < 2) {
    return { countries: [], states: [], cities: [] };
  }

  const cacheKey = `search:${query}:${limit}`;
  const cached = landingCache.get<any>(cacheKey);
  if (cached) return cached;

  try {
    const searchPattern = `%${query}%`;

    const [countriesResult, statesResult, citiesResult] = await Promise.all([
      supabase
        .from('countries')
        .select('*')
        .ilike('name', searchPattern)
        .eq('is_active', true)
        .limit(limit),
      supabase
        .from('states')
        .select('*')
        .ilike('name', searchPattern)
        .eq('is_active', true)
        .limit(limit),
      supabase
        .from('cities')
        .select('*')
        .ilike('name', searchPattern)
        .eq('is_active', true)
        .limit(limit),
    ]);

    const result = {
      countries: countriesResult.data || [],
      states: statesResult.data || [],
      cities: citiesResult.data || [],
    };

    landingCache.set(cacheKey, result, CACHE_TTL.SEARCH);
    return result;
  } catch (error) {
    console.error('Error searching locations:', error);
    return { countries: [], states: [], cities: [] };
  }
}

// 
// BATCH QUERIES (PERFORMANCE OPTIMIZATION)
// 

/**
 * Get complete page data in one call
 */
export async function getCompletePageData(
  country: string,
  state?: string,
  city?: string,
  lang: string = 'en'
): Promise<{
  country: Country | null;
  state: State | null;
  city: City | null;
  content: LandingPageContent | null;
  seo: LandingSEOMetadata | null;
  subLocations: Array<State | City>;
} | null> {
  try {
    // Step 1: Get country
    const countryData = await getCountryBySlug(country);
    if (!countryData) return null;

    let stateData: State | null = null;
    let cityData: City | null = null;
    let locationType: LocationType = 'country';
    let locationId = countryData.id;
    let subLocations: Array<State | City> = [];

    // Step 2: Get state if provided
    if (state) {
      stateData = await getStateBySlug(countryData.id, state);
      if (!stateData) return null;

      locationType = 'state';
      locationId = stateData.id;

      // Get cities for this state
      subLocations = await getCitiesByState(stateData.id);

      // Step 3: Get city if provided
      if (city) {
        cityData = await getCityBySlug(stateData.id, city);
        if (!cityData) return null;

        locationType = 'city';
        locationId = cityData.id;
        subLocations = [];
      }
    } else {
      // Get states for this country
      subLocations = await getStatesByCountry(countryData.id);
    }

    // Step 4: Get content and SEO in parallel
    const [content, seo] = await Promise.all([
      getLandingPageContent(locationType, locationId, lang),
      getSEOMetadata(locationType, locationId, lang),
    ]);

    return {
      country: countryData,
      state: stateData,
      city: cityData,
      content,
      seo,
      subLocations,
    };
  } catch (error) {
    console.error('Error fetching complete page data:', error);
    return null;
  }
}

// 
// CACHE MANAGEMENT
// 

/**
 * Invalidate cache for a specific location
 */
export function invalidateLocationCache(
  type: LocationType,
  id: string
): void {
  const patterns = [
    getCacheKey(type, id),
    getCacheKey(type, `content:${id}`),
    getCacheKey(type, `seo:${id}`),
  ];

  patterns.forEach(pattern => {
    landingCache.delete(pattern);
  });
}

/**
 * Preload critical data (run on app init)
 */
export async function preloadCriticalData(): Promise<void> {
  try {
    await Promise.all([
      getAllCountries(),
      // Add more critical data as needed
    ]);
    console.log(' Critical landing page data preloaded');
  } catch (error) {
    console.error('Failed to preload critical data:', error);
  }
}
