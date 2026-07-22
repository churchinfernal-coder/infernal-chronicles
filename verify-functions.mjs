#!/usr/bin/env node

/**
 * Verify Function Environment Variables Are Set
 */

const SUPABASE_URL = 'https://khugyibzsujjgtddwzpa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodWd5aWJ6c3Vqamd0ZGR3enBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzczNzYsImV4cCI6MjA3NTYxMzM3Nn0.AqE_-hXoCwfrHp5jq_uXREiT_KJTD8ES2i8HlZWZvPQ';

const tests = [
  {
    name: 'create-checkout-session',
    method: 'POST',
    payload: { priceId: 'test', mode: 'subscription' },
    desc: 'Stripe checkout function'
  },
  {
    name: 'get-book-file',
    method: 'GET',
    payload: null,
    desc: 'E-book file access'
  },
  {
    name: 'check-subscription',
    method: 'GET',
    payload: null,
    desc: 'Subscription status'
  }
];

async function testFunctions() {
  console.log('🔍 Testing Function Endpoints\n');

  for (const test of tests) {
    try {
      const url = `${SUPABASE_URL}/functions/v1/${test.name}`;
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
      };

      if (test.payload) {
        options.body = JSON.stringify(test.payload);
      }

      const response = await fetch(url, options);
      const text = await response.text();

      console.log(`${test.name}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${text.substring(0, 100)}`);

      if (response.status === 400) {
        console.log(`  ⚠️  Function returned 400 - Check environment variables in dashboard!`);
      } else if (response.status === 401) {
        console.log(`  ✓ Auth enforced (expected)`);
      } else if (response.status === 200) {
        console.log(`  ✓ Function working`);
      }
      console.log('');
    } catch (error) {
      console.log(`${test.name}: ERROR - ${error.message}\n`);
    }
  }

  console.log('\n⚠️  If any function shows 400:');
  console.log('   1. Go to: https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions');
  console.log('   2. Click each function → Settings → Environment Variables');
  console.log('   3. Add the required variables (see FUNCTION_ENVVARS.md)');
  console.log('   4. Click Deploy\n');
}

testFunctions().catch(console.error);
