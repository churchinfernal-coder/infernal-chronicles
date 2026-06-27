// 
// SEO HEAD COMPONENT - Complete Meta Tags
// FIXED: Added null checks for meta_keywords
// 

import { Helmet } from 'react-helmet-async';
import type { LandingSEOMetadata } from '@/types/landing';

interface LandingSEOProps {
  metadata: LandingSEOMetadata;
  breadcrumbSchema?: Record<string, any>;
}

export default function LandingSEO({ metadata, breadcrumbSchema }: LandingSEOProps) {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{metadata.meta_title}</title>
      <meta name="title" content={metadata.meta_title} />
      <meta name="description" content={metadata.meta_description} />
      {metadata.meta_keywords && metadata.meta_keywords.length > 0 && (
        <meta name="keywords" content={metadata.meta_keywords.join(', ')} />
      )}
      
      {/* Robots */}
      <meta name="robots" content={metadata.robots} />
      <meta name="googlebot" content={metadata.robots} />
      
      {/* Canonical URL (prevents duplicate content) */}
      <link rel="canonical" href={metadata.canonical_url} />
      
      {/* Hreflang (multilingual SEO) */}
      {metadata.hreflang_alternates && metadata.hreflang_alternates.map((alt) => (
        <link
          key={alt.lang}
          rel="alternate"
          hrefLang={alt.lang}
          href={alt.url}
        />
      ))}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={metadata.og_type} />
      <meta property="og:url" content={metadata.canonical_url} />
      <meta property="og:title" content={metadata.og_title || metadata.meta_title} />
      <meta
        property="og:description"
        content={metadata.og_description || metadata.meta_description}
      />
      {metadata.og_image && <meta property="og:image" content={metadata.og_image} />}
      <meta property="og:site_name" content="Infernal Church of Satan (I.C.O.S)" />
      <meta property="og:locale" content={metadata.language_code} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={metadata.twitter_card} />
      <meta name="twitter:url" content={metadata.canonical_url} />
      <meta
        name="twitter:title"
        content={metadata.twitter_title || metadata.meta_title}
      />
      <meta
        name="twitter:description"
        content={metadata.twitter_description || metadata.meta_description}
      />
      {metadata.twitter_image && (
        <meta name="twitter:image" content={metadata.twitter_image} />
      )}
      
      {/* Additional SEO */}
      <meta name="author" content="Infernal Church of Satan (I.C.O.S)" />
      <meta name="language" content={metadata.language_code} />
      <meta name="theme-color" content="#000000" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Structured Data (Schema.org) */}
      {metadata.structured_data && (
        <script type="application/ld+json">
          {JSON.stringify(metadata.structured_data)}
        </script>
      )}
      
      {/* Breadcrumb Schema */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
}
