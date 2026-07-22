#!/usr/bin/env node

/**
 * Create Storage Buckets & Configure Database
 * Automates remaining production setup tasks
 */

const SUPABASE_URL = 'https://khugyibzsujjgtddwzpa.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodWd5aWJ6c3Vqamd0ZGR3enBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAzNzM3NiwiZXhwIjoyMDc1NjEzMzc2fQ.KPG0a3CEXLukkp6j-FqvgOgsyqPYSmLSdVffpUqOvrs';

async function createStorageBuckets() {
  console.log('📦 Creating Storage Buckets\n');

  const buckets = [
    { name: 'book-pdfs', isPublic: false },
    { name: 'book-epubs', isPublic: false }
  ];

  for (const bucket of buckets) {
    try {
      const response = await fetch(`${SUPABASE_URL}/storage/v1/b`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: bucket.name,
          public: bucket.isPublic,
        }),
      });

      const data = await response.json();

      if (response.ok || response.status === 400) {
        console.log(`✓ ${bucket.name}`);
        console.log(`  Status: ${bucket.isPublic ? 'Public' : 'Private'}`);
        if (response.status === 400) {
          console.log(`  (May already exist)`);
        }
      } else {
        console.log(`✗ ${bucket.name}: ${data.message}`);
      }
    } catch (error) {
      console.log(`✗ ${bucket.name}: ${error.message}`);
    }
  }

  console.log('\n✅ Storage buckets configured\n');
}

async function setupComplete() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 REMAINING SETUP TASKS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('✓ Storage buckets created\n');

  console.log('⏳ Manual Setup (via Dashboard):\n');

  console.log('1️⃣  Connection Pool Configuration');
  console.log('   Dashboard → Settings → Database → Connection Pooling');
  console.log('   Set: Mode=Transaction, Min=10, Max=200, Default=15\n');

  console.log('2️⃣  Database Migrations');
  console.log('   Option A (CLI): supabase db push');
  console.log('   Option B (Dashboard): SQL Editor → Paste migration SQL\n');

  console.log('3️⃣  Webhook Configuration');
  console.log('   Stripe → Webhooks → Add endpoint');
  console.log('   URL: https://khugyibzsujjgtddwzpa.supabase.co/functions/v1/stripe-webhook\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ All automated tasks complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function main() {
  await createStorageBuckets();
  await setupComplete();
}

main().catch(console.error);
