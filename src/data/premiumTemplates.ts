export interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  thumbnail?:  string;
  isPremium: boolean;
  canvasData?:  any;
}

export const TEMPLATE_CATEGORIES = [
  'Social Media',
  'Business Cards',
  'Flyers',
  'Posters',
  'Invitations',
  'Logos',
  'Banners',
  'Presentations',
  'Email Headers',
  'Thumbnails'
];

// Social Media Templates
const socialMediaTemplates: DesignTemplate[] = [
  // Instagram
  ... Array.from({ length: 100 }, (_, i) => ({
    id: `instagram-post-${i + 1}`,
    name: `Instagram Post ${i + 1}`,
    category: 'Social Media',
    width: 1080,
    height: 1080,
    isPremium: true,
    canvasData: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          width: 1080,
          height: 1080,
          fill: `hsl(${i * 3. 6}, 70%, ${50 + (i % 30)})`,
        }
      ]
    }
  })),
  
  // Instagram Stories
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `instagram-story-${i + 1}`,
    name: `Instagram Story ${i + 1}`,
    category: 'Social Media',
    width: 1080,
    height: 1920,
    isPremium: true,
    canvasData: {
      version: '5.3.0',
      objects: [
        {
          type: 'rect',
          width: 1080,
          height: 1920,
          fill: `linear-gradient(135deg, hsl(${i * 3.6}, 80%, 60%), hsl(${(i * 3.6 + 60) % 360}, 80%, 40%))`
        }
      ]
    }
  })),

  // Facebook Posts
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `facebook-post-${i + 1}`,
    name: `Facebook Post ${i + 1}`,
    category: 'Social Media',
    width: 1200,
    height: 630,
    isPremium: true,
  })),

  // Twitter/X Headers
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `twitter-header-${i + 1}`,
    name: `Twitter Header ${i + 1}`,
    category: 'Social Media',
    width: 1500,
    height: 500,
    isPremium: true,
  })),
];

// Business Templates
const businessTemplates: DesignTemplate[] = [
  ... Array.from({ length: 200 }, (_, i) => ({
    id: `business-card-${i + 1}`,
    name: `Business Card ${i + 1}`,
    category: 'Business Cards',
    width: 1050,
    height: 600,
    isPremium: true,
  })),

  ...Array.from({ length: 100 }, (_, i) => ({
    id: `flyer-${i + 1}`,
    name: `Flyer Design ${i + 1}`,
    category: 'Flyers',
    width: 2550,
    height: 3300,
    isPremium:  true,
  })),
];

// Marketing Templates
const marketingTemplates:  DesignTemplate[] = [
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `poster-${i + 1}`,
    name: `Poster ${i + 1}`,
    category: 'Posters',
    width: 2480,
    height: 3508,
    isPremium: true,
  })),

  ...Array.from({ length: 100 }, (_, i) => ({
    id: `banner-${i + 1}`,
    name: `Web Banner ${i + 1}`,
    category: 'Banners',
    width: 728,
    height: 90,
    isPremium: true,
  })),
];

// Event Templates
const eventTemplates: DesignTemplate[] = [
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `invitation-${i + 1}`,
    name: `Invitation ${i + 1}`,
    category: 'Invitations',
    width: 2100,
    height: 2970,
    isPremium: true,
  })),
];

// Branding Templates
const brandingTemplates: DesignTemplate[] = [
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `logo-${i + 1}`,
    name: `Logo Template ${i + 1}`,
    category: 'Logos',
    width: 1000,
    height: 1000,
    isPremium: true,
  })),
];

// Presentation Templates
const presentationTemplates: DesignTemplate[] = [
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `presentation-${i + 1}`,
    name: `Slide ${i + 1}`,
    category: 'Presentations',
    width: 1920,
    height: 1080,
    isPremium: true,
  })),
];

export const ALL_PREMIUM_TEMPLATES:  DesignTemplate[] = [
  ...socialMediaTemplates,
  ...businessTemplates,
  ...marketingTemplates,
  ...eventTemplates,
  ... brandingTemplates,
  ... presentationTemplates,
];

export function getTemplatesByCategory(category: string): DesignTemplate[] {
  return ALL_PREMIUM_TEMPLATES.filter(t => t.category === category);
}

export function searchTemplates(query: string): DesignTemplate[] {
  const lowerQuery = query.toLowerCase();
  return ALL_PREMIUM_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.category.toLowerCase().includes(lowerQuery)
  );
}

console.log(`✅ Loaded ${ALL_PREMIUM_TEMPLATES.length} premium templates`);