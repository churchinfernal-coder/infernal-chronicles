import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

const { data: la } = await supabase.from('cities').select('*, states(*), countries(*)').eq('slug', 'los-angeles').single();

console.log('City:', la.name);
console.log('State:', la.states.name);
console.log('Country:', la.countries.name);
console.log('City ID:', la.id);

console.log('\nInserting content...');

const { data: content, error: contentErr } = await supabase
  .from('landing_page_content')
  .insert({
    location_type: 'city',
    location_id: la.id,
    language_code: 'en',
    h1_title: 'Los Angeles Horror Stories',
    meta_title: 'Los Angeles Horror Stories | Infernal Chronicles',
    meta_description: 'Discover terrifying true horror stories from Los Angeles',
    intro_paragraph: 'Welcome to Los Angeles horror stories',
    body_content: 'Test content',
    cta_text: 'Share Your Story',
    cta_url: '/submit'
  })
  .select()
  .single();

if (contentErr) {
  console.error('ERROR:', contentErr);
} else {
  console.log('SUCCESS! Created content:', content.id);
}

const { data: check } = await supabase.from('landing_page_content').select('*').eq('location_id', la.id);
console.log('\nContent rows for LA:', check?.length || 0);
