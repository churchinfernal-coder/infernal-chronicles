-- 🎯 PRODUCTION INDEXES - EXACT FOR YOUR SCHEMA
-- These are the ONLY indexes missing for production performance

-- INDEX 1: Fast active subscription lookup (CRITICAL for entitlement checks)
-- Current: idx_subscriptions_user on (user_id) only
-- Problem: Can't efficiently filter by status
-- Solution: Composite index for (user_id, status) checks
CREATE INDEX IF NOT EXISTS idx_occult_subscriptions_user_status
ON public.occult_subscriptions(user_id, status)
WHERE status = 'active';

-- INDEX 2: User coven post timeline (CRITICAL for social feed)
-- Current: Separate indexes on coven_posts(user_id) and coven_posts(created_at DESC)
-- Problem: Timeline queries need both columns together
-- Solution: Composite index for efficient filtering + sorting
CREATE INDEX IF NOT EXISTS idx_coven_posts_user_created
ON public.coven_posts(user_id, created_at DESC);

-- ============================================================================
-- OPTIONAL: Create subscription_plans table if needed by checkout flow
-- ============================================================================
-- Check if subscription_plans is actually used by your functions
-- If yes, uncomment and run this:

-- CREATE TABLE IF NOT EXISTS public.subscription_plans (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   stripe_price_id TEXT NOT NULL UNIQUE,
--   name TEXT NOT NULL,
--   description TEXT,
--   price_cents INTEGER NOT NULL,
--   interval TEXT DEFAULT 'month', -- 'month', 'year'
--   active BOOLEAN DEFAULT true,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
-- );

-- CREATE INDEX idx_subscription_plans_stripe_price
-- ON public.subscription_plans(stripe_price_id)
-- WHERE active = true;

-- ============================================================================
-- VERIFY: Check indexes were created
-- ============================================================================
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_occult_subscriptions_user_status',
    'idx_coven_posts_user_created'
  )
ORDER BY tablename;
