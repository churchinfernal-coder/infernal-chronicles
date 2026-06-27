import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const serviceRoleKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('Using SERVICE ROLE KEY');

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data: countries } = await supabase.from('countries').select('*');
console.log(`Found ${countries.length} countries\n`);

const SAMPLE = {
  name: 'California',
  slug: 'california',
  code: 'CA',
  cities: [
    { name: 'Los Angeles', slug: 'los-angeles', lat: 34.0522, lon: -118.2437, pop: 3898747 },
    { name: 'San Francisco', slug: 'san-francisco', lat: 37.7749, lon: -122.4194, pop: 873965 }
  ]
};

console.log('Seeding California...\n');

const { data: usa } = await supabase.from('countries').select('*').eq('iso_code', 'US').single();
console.log('Found USA:', usa.name);

const { data: state, error: stateErr } = await supabase
  .from('states')
  .upsert({
    country_id: usa.id,
    name: SAMPLE.name,
    slug: SAMPLE.slug,
    state_code: SAMPLE.code,
    is_active: true,
  }, { onConflict: 'country_id,slug' })
  .select()
  .single();

if (stateErr) {
  console.error('State error:', stateErr);
  process.exit(1);
}

console.log('Created state:', state.name);

for (const cityData of SAMPLE.cities) {
  const { data: city, error: cityErr } = await supabase
    .from('cities')
    .upsert({
      state_id: state.id,
      country_id: usa.id,
      name: cityData.name,
      slug: cityData.slug,
      latitude: cityData.lat,
      longitude: cityData.lon,
      population: cityData.pop,
      is_active: true,
    }, { onConflict: 'state_id,slug' })
    .select()
    .single();

  if (cityErr) {
    console.error('City error:', cityData.name, cityErr);
  } else {
    console.log('Created:', city.name);
  }
}

console.log('\nCOMPLETE');
console.log('Visit: http://localhost:5173/landing/united-states/california/los-angeles');
