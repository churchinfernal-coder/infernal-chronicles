import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

const { data: cities } = await supabase.from('cities').select('id, name, slug, states(name, slug, countries(name, slug))');

console.log(`Seeding SEO for ${cities.length} cities...`);

for (const city of cities) {
  await supabase.from('landing_seo_metadata').upsert({
    entity_type: 'city',
    entity_id: city.id,
    language_code: 'en',
    canonical_url: `https://infernalchurch.com/landing/${city.states.countries.slug}/${city.states.slug}/${city.slug}`,
    og_title: `${city.name} - Infernal Church`,
    og_description: `Connect with infernalists in ${city.name}`,
    meta_title: `${city.name} - Infernal Church`,
    meta_description: `Join the infernalist movement in ${city.name}`,
    structured_data: {}
  }, { onConflict: 'entity_type,entity_id,language_code' });
}

console.log(' DONE');
