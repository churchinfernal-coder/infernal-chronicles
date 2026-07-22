#!/usr/bin/env node

/**
 * Deploy Edge Functions - Requires STRIPE_SECRET_KEY and JWT_SECRET
 * Usage:
 *   export STRIPE_SECRET_KEY=sk_live_xxx
 *   export JWT_SECRET=xxx
 *   npm run deploy:functions
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const SUPABASE_URL = 'https://khugyibzsujjgtddwzpa.supabase.co';

console.log('🔧 FUNCTION DEPLOYMENT - Environment Check\n');

if (!STRIPE_SECRET_KEY) {
  console.log('❌ Missing STRIPE_SECRET_KEY');
  console.log('   Get it from: https://dashboard.stripe.com/apikeys\n');
}

if (!JWT_SECRET) {
  console.log('❌ Missing JWT_SECRET');
  console.log('   Get it from: https://app.supabase.com/project/khugyibzsujjgtddwzpa/settings/api\n');
}

if (!STRIPE_SECRET_KEY || !JWT_SECRET) {
  console.log('\n📝 Run this to set env vars:');
  console.log('   export STRIPE_SECRET_KEY=sk_live_your_key_here');
  console.log('   export JWT_SECRET=your_jwt_secret_here');
  console.log('   npm run deploy:functions\n');
  process.exit(1);
}

console.log('✓ All required env vars present\n');

// Write env vars to Supabase secrets
console.log('📦 To apply these to your functions:');
console.log('\n1. Go to: https://app.supabase.com/project/khugyibzsujjgtddwzpa/functions');
console.log('\n2. For create-checkout-session → Settings:');
console.log(`   STRIPE_SECRET_KEY = ${STRIPE_SECRET_KEY.substring(0, 20)}...${STRIPE_SECRET_KEY.substring(STRIPE_SECRET_KEY.length - 10)}`);
console.log('   PUBLIC_URL = http://localhost:5173');
console.log('\n3. For get-book-file → Settings:');
console.log(`   JWT_SECRET = ${JWT_SECRET.substring(0, 20)}...${JWT_SECRET.substring(JWT_SECRET.length - 10)}`);
console.log('\n4. Click Deploy on each function');
console.log('\n✓ Then run: npm run test:all:gates\n');
