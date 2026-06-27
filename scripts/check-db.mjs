import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

console.log('Checking database...\n');

const { data: countries } = await supabase.from('countries').select('*').limit(1);
console.log('Countries:', countries?.length || 0);

const { data: states } = await supabase.from('states').select('*').limit(1);
console.log('States:', states?.length || 0);

const { data: cities } = await supabase.from('cities').select('*').limit(1);
console.log('Cities:', cities?.length || 0);

const { data: content, error: contentErr } = await supabase.from('landing_page_content').select('*').limit(1);
console.log('Content:', content?.length || 0, contentErr ? `ERROR: ${contentErr.message}` : '');

const { data: seo, error: seoErr } = await supabase.from('landing_seo_metadata').select('*').limit(1);
console.log('SEO:', seo?.length || 0, seoErr ? `ERROR: ${seoErr.message}` : '');

const { data: la } = await supabase.from('cities').select('*').eq('slug', 'los-angeles').single();
if (la) {
  console.log('\nLos Angeles ID:', la.id);
  const { data: laContent } = await supabase.from('landing_page_content').select('*').eq('location_id', la.id);
  console.log('LA Content rows:', laContent?.length || 0);
}
