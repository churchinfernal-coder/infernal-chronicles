// 
// ENTERPRISE TYPE DEFINITIONS - Landing Pages
// Complete type safety for all operations
// 

export interface Country {
  id: string;
  name: string;
  slug: string;
  iso_code: string;
  continent: string | null;
  languages: string[];
  timezone: string | null;
  currency: string | null;
  is_active: boolean;
  view_count: number;
  last_viewed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface State {
  id: string;
  country_id: string;
  name: string;
  slug: string;
  state_code: string | null;
  is_active: boolean;
  view_count: number;
  last_viewed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface City {
  id: string;
  state_id: string;
  country_id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  timezone: string | null;
  is_active: boolean;
  view_count: number;
  last_viewed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LandingPageContent {
  id: string;
  location_type: 'country' | 'state' | 'city';
  location_id: string;
  language_code: string;
  
  // Unique content per level
  h1_title: string;
  h2_subtitle: string;
  hero_description: string;
  about_title: string;
  about_content: string;
  
  // CTAs
  cta_primary_text: string;
  cta_secondary_text: string | null;
  
  // Features (unique per level)
  feature_1_title: string | null;
  feature_1_description: string | null;
  feature_2_title: string | null;
  feature_2_description: string | null;
  feature_3_title: string | null;
  feature_3_description: string | null;
  
  additional_sections: Record<string, any>;
  featured_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface LandingSEOMetadata {
  id: string;
  entity_type: 'country' | 'state' | 'city';
  entity_id: string;
  language_code: string;
  
  // Meta tags
  meta_title: string;
  meta_description: string;
  meta_keywords: string[];
  
  // Open Graph
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_type: string;
  
  // Twitter
  twitter_card: string;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image: string | null;
  
  // SEO
  canonical_url: string;
  hreflang_alternates: Array<{ lang: string; url: string }>;
  structured_data: Record<string, any> | null;
  robots: string;
  
  created_at: string;
  updated_at: string;
}

export interface LandingPageView {
  id: string;
  entity_type: 'country' | 'state' | 'city';
  entity_id: string;
  session_id: string | null;
  user_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referrer: string | null;
  language: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  screen_resolution: string | null;
  time_on_page: number | null;
  scroll_depth: number | null;
  clicked_cta: boolean;
  cta_name: string | null;
  visitor_country: string | null;
  visitor_city: string | null;
  created_at: string;
}

export interface LandingTranslation {
  id: string;
  entity_type: 'country' | 'state' | 'city';
  entity_id: string;
  language_code: string;
  field_name: string;
  translated_text: string;
  created_at: string;
  updated_at: string;
}

// Helper types
export type LocationType = 'country' | 'state' | 'city';

export interface LocationData {
  country: Country;
  state?: State;
  city?: City;
}

export interface PageData {
  location: LocationData;
  content: LandingPageContent;
  seo: LandingSEOMetadata;
  subLocations: Array<State | City>;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultImage: string;
  twitterHandle?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}
