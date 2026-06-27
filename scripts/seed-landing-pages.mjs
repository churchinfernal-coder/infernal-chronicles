import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

console.log(' SEEDING LANDING PAGES\n');

const seedCity = async (city, state, country) => {
  const content = {
    location_type: 'city',
    location_id: city.id,
    language_code: 'en',
    hero_title: `Infernal Church of Satan - ${city.name}, ${state.name}`,
    hero_subtitle: `Join the infernalist movement in ${city.name}. Connect with fellow believers.`,
    about_content: `The Infernal Church of Satan welcomes seekers in ${city.name}, ${state.name}. Join infernalsocial.com to connect with local infernalists.`,
    cta_primary_text: 'Join infernalsocial.com',
    additional_sections: {}
  };

  const seo = {
    entity_type: 'city',
    entity_id: city.id,
    language_code: 'en',
    canonical_url: `https://infernalchurch.com/landing/${country.slug}/${state.slug}/${city.slug}`,
    og_title: `${city.name} - Infernal Church`,
    og_description: `Connect with infernalists in ${city.name}`,
    structured_data: { '@type': 'Organization', name: 'Infernal Church' }
  };

  await supabase.from('landing_page_content').upsert(content, { onConflict: 'location_type,location_id,language_code' });
  await supabase.from('landing_seo_metadata').upsert(seo, { onConflict: 'entity_type,entity_id,language_code' });
};

const { data: countries } = await supabase.from('countries').select('*');

for (const country of countries) {
  console.log(` ${country.name}`);
  const { data: states } = await supabase.from('states').select('*').eq('country_id', country.id);
  
  for (const state of states) {
    console.log(`  ${state.name}`);
    const { data: cities } = await supabase.from('cities').select('*').eq('state_id', state.id);
    
    for (const city of cities) {
      console.log(`    ${city.name}`);
      await seedCity(city, state, country);
    }
  }
}

const { count: contentCount } = await supabase.from('landing_page_content').select('*', { count: 'exact', head: true });
const { count: seoCount } = await supabase.from('landing_seo_metadata').select('*', { count: 'exact', head: true });

console.log(`\n COMPLETE! Content: ${contentCount} | SEO: ${seoCount}`);
