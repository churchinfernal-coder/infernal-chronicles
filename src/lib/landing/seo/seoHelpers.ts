// 
// SEO HELPERS - Anti-Duplication Strategy
// Unique titles, descriptions, H1-H6 per location level
// 

import type { Country, State, City, LocationType } from '@/types/landing';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://infernalsocial.com';

/**
 * Generate unique canonical URL
 */
export function generateCanonicalURL(
  country: Country,
  state?: State,
  city?: City
): string {
  let path = `/landing/${country.slug}`;
  if (state) path += `/${state.slug}`;
  if (city) path += `/${city.slug}`;
  return `${SITE_URL}${path}`;
}

/**
 * Generate unique H1 title (NO DUPLICATION)
 */
export function generateH1Title(
  locationType: LocationType,
  locationName: string,
  parentName?: string
): string {
  switch (locationType) {
    case 'country':
      return `Infernal Church of Satan - ${locationName}`;
    case 'state':
      return `I.C.O.S ${locationName} - Infernalist Community`;
    case 'city':
      return `I.C.O.S ${locationName} - Local Chapter`;
    default:
      return `I.C.O.S ${locationName}`;
  }
}

/**
 * Generate unique H2 subtitle
 */
export function generateH2Subtitle(
  locationType: LocationType,
  locationName: string
): string {
  switch (locationType) {
    case 'country':
      return `Join the Nationwide Infernalist Movement in ${locationName}`;
    case 'state':
      return `Connect with Infernalists Across ${locationName}`;
    case 'city':
      return `Meet Fellow Infernalists in ${locationName}`;
    default:
      return `Discover I.C.O.S in ${locationName}`;
  }
}

/**
 * Generate unique meta title (NO DUPLICATION)
 */
export function generateMetaTitle(
  locationType: LocationType,
  locationName: string,
  parentName?: string
): string {
  switch (locationType) {
    case 'country':
      return `Infernal Church of Satan (I.C.O.S) ${locationName} | Join the Infernalist Community`;
    case 'state':
      return `I.C.O.S ${locationName} | Infernalism & Satanism in ${parentName}`;
    case 'city':
      return `I.C.O.S ${locationName} | Local Infernalist Chapter in ${parentName}`;
    default:
      return `I.C.O.S ${locationName} | Infernal Church of Satan`;
  }
}

/**
 * Generate unique meta description (NO DUPLICATION)
 */
export function generateMetaDescription(
  locationType: LocationType,
  locationName: string,
  parentName?: string
): string {
  const baseKeywords = 'I.C.O.S, infernalism, infernal bible, infernalist, Satan';
  
  switch (locationType) {
    case 'country':
      return `Join the Infernal Church of Satan (I.C.O.S) in ${locationName}. Connect with infernalists nationwide, explore the infernal bible, and discover the path of Satan. Active chapters across the country.`;
    case 'state':
      return `Connect with the ${locationName} infernalist community. I.C.O.S welcomes seekers of infernal wisdom throughout ${locationName}. Study the infernal bible, attend local gatherings, and walk the path of Satan with fellow ${locationName} infernalists.`;
    case 'city':
      return `Meet fellow infernalists in ${locationName}, ${parentName}. The I.C.O.S ${locationName} chapter offers regular gatherings, infernal bible study, and community support for those walking the path of Satan in ${locationName}.`;
    default:
      return `Join the Infernal Church of Satan (I.C.O.S) in ${locationName}. Explore infernalism and connect with fellow infernalists.`;
  }
}

/**
 * Generate unique keywords array
 */
export function generateKeywords(
  locationType: LocationType,
  locationName: string,
  parentName?: string
): string[] {
  const baseKeywords = [
    'infernal church of satan',
    'infernalism',
    'infernal bible',
    'infernalist',
    'satan',
    'ICOS',
    'I.C.O.S',
  ];

  const locationSpecific = [
    `infernal church ${locationName}`,
    `infernalism ${locationName}`,
    `infernalist ${locationName}`,
    `satanism ${locationName}`,
    `I.C.O.S ${locationName}`,
  ];

  if (locationType === 'city' && parentName) {
    locationSpecific.push(
      `infernal church ${locationName} ${parentName}`,
      `satanism ${locationName} ${parentName}`
    );
  }

  return [...baseKeywords, ...locationSpecific];
}

/**
 * Generate structured data (Schema.org) - Unique per level
 */
export function generateStructuredData(
  locationType: LocationType,
  location: { name: string; slug: string },
  country: Country,
  state?: State,
  city?: City
): Record<string, any> {
  const baseUrl = generateCanonicalURL(country, state, city);

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: `Infernal Church of Satan - ${location.name}`,
    alternateName: ['I.C.O.S', 'ICOS', 'Infernal Church'],
    url: baseUrl,
  };

  switch (locationType) {
    case 'country':
      return {
        ...baseSchema,
        description: `The Infernal Church of Satan (I.C.O.S) welcomes seekers of infernal wisdom across ${location.name}`,
        areaServed: {
          '@type': 'Country',
          name: location.name,
        },
      };

    case 'state':
      return {
        ...baseSchema,
        description: `I.C.O.S ${location.name} chapter - Connect with infernalists throughout ${location.name}`,
        areaServed: {
          '@type': 'State',
          name: location.name,
          containedInPlace: {
            '@type': 'Country',
            name: country.name,
          },
        },
      };

    case 'city':
      return {
        ...baseSchema,
        '@type': 'LocalBusiness',
        description: `I.C.O.S ${location.name} local chapter - Meet fellow infernalists in ${location.name}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: location.name,
          addressRegion: state?.name,
          addressCountry: country.iso_code,
        },
        areaServed: {
          '@type': 'City',
          name: location.name,
        },
      };

    default:
      return baseSchema;
  }
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(
  country: Country,
  state?: State,
  city?: City
): Record<string, any> {
  const items: Array<{ name: string; url: string }> = [
    {
      name: 'Home',
      url: SITE_URL,
    },
    {
      name: country.name,
      url: `${SITE_URL}/landing/${country.slug}`,
    },
  ];

  if (state) {
    items.push({
      name: state.name,
      url: `${SITE_URL}/landing/${country.slug}/${state.slug}`,
    });
  }

  if (city) {
    items.push({
      name: city.name,
      url: `${SITE_URL}/landing/${country.slug}/${state?.slug}/${city.slug}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate hreflang alternates
 */
export function generateHreflangAlternates(
  country: Country,
  state?: State,
  city?: City
): Array<{ lang: string; url: string }> {
  const baseUrl = generateCanonicalURL(country, state, city);
  const languages = country.languages || ['en'];

  return languages.map(lang => ({
    lang,
    url: `${baseUrl}?lang=${lang}`,
  }));
}

/**
 * Generate unique about content (NO DUPLICATION)
 */
export function generateAboutContent(
  locationType: LocationType,
  locationName: string,
  parentName?: string
): { title: string; content: string } {
  switch (locationType) {
    case 'country':
      return {
        title: `I.C.O.S Across ${locationName}`,
        content: `The Infernal Church of Satan (I.C.O.S) has established a strong presence throughout ${locationName}. From major cities to rural communities, infernalists gather to study the infernal bible, practice infernalism, and walk the path of Satan. Our nationwide network provides support, education, and fellowship for all who seek the infernal way.`,
      };
    case 'state':
      return {
        title: `The ${locationName} Infernalist Community`,
        content: `I.C.O.S ${locationName} welcomes seekers of infernal wisdom throughout the region. Our ${locationName} chapters offer regular gatherings, infernal bible study groups, and community events. Whether you're in ${locationName}'s largest cities or smaller towns, you'll find fellow infernalists ready to support your journey on the path of Satan.`,
      };
    case 'city':
      return {
        title: `I.C.O.S ${locationName} Local Chapter`,
        content: `The ${locationName} chapter of the Infernal Church of Satan provides a welcoming community for local infernalists. Meet regularly with fellow ${locationName} residents who share your interest in infernalism, the infernal bible, and the teachings of Satan. Our ${locationName} community offers both in-person gatherings and online connections for those walking the infernal path.`,
      };
    default:
      return {
        title: `I.C.O.S ${locationName}`,
        content: `Welcome to the Infernal Church of Satan in ${locationName}.`,
      };
  }
}
