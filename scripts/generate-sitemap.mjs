// 
// SITEMAP GENERATOR - SEO
// Run this to generate sitemap.xml: node scripts/generate-sitemap.mjs
// 

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SITE_URL = process.env.VITE_SITE_URL || 'https://infernalsocial.com';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSitemap() {
  console.log('  Generating sitemap...');

  const urls = [];

  // Get all active countries
  const { data: countries } = await supabase
    .from('countries')
    .select('slug, updated_at')
    .eq('is_active', true);

  for (const country of countries || []) {
    urls.push({
      loc: `${SITE_URL}/landing/${country.slug}`,
      lastmod: country.updated_at,
      changefreq: 'monthly',
      priority: 0.8,
    });

    // Get states for this country
    const { data: states } = await supabase
      .from('states')
      .select('slug, updated_at')
      .eq('country_id', country.id)
      .eq('is_active', true);

    for (const state of states || []) {
      urls.push({
        loc: `${SITE_URL}/landing/${country.slug}/${state.slug}`,
        lastmod: state.updated_at,
        changefreq: 'monthly',
        priority: 0.6,
      });

      // Get cities for this state
      const { data: cities } = await supabase
        .from('cities')
        .select('slug, updated_at')
        .eq('state_id', state.id)
        .eq('is_active', true);

      for (const city of cities || []) {
        urls.push({
          loc: `${SITE_URL}/landing/${country.slug}/${state.slug}/${city.slug}`,
          lastmod: city.updated_at,
          changefreq: 'monthly',
          priority: 0.5,
        });
      }
    }
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${new Date(url.lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  // Write to public folder
  fs.writeFileSync('public/sitemap.xml', xml);
  console.log(` Generated sitemap with ${urls.length} URLs`);
}

generateSitemap().catch(console.error);
