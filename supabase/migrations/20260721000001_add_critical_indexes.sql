-- Critical Performance Indexes for Production Release
-- Purpose: Reduce query latency from 4000ms to <100ms
-- Status: Required for gate passage

-- Index 1: Subscriptions lookup (most common query)
-- Optimizes: Check if user has active subscription
-- Impact: Subscription validation, checkout flow, access control
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status 
ON subscriptions(user_id, status, expires_at DESC)
WHERE status = 'active';

-- Index 2: Book purchases lookup
-- Optimizes: Check if user purchased a book
-- Impact: E-book access, library display, entitlement checks
CREATE INDEX IF NOT EXISTS idx_book_purchases_user_book 
ON book_purchases(user_id, book_id)
WHERE deleted_at IS NULL;

-- Index 3: Coven posts timeline
-- Optimizes: Load user's posts and feed
-- Impact: Social network, covenantry, post listing
CREATE INDEX IF NOT EXISTS idx_coven_posts_user_created 
ON coven_posts(user_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Index 4: Reading progress tracking
-- Optimizes: Load user's reading state per book
-- Impact: E-book reader, resume functionality
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book 
ON reading_progress(user_id, book_id)
WHERE deleted_at IS NULL;

-- Index 5: Subscription plans
-- Optimizes: List available plans, load plan by price ID
-- Impact: Checkout page, plan selection
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price 
ON subscription_plans(stripe_price_id)
WHERE active = true;

-- Index 6: Book chapters
-- Optimizes: Load chapters for a book in order
-- Impact: E-book reader chapter navigation
CREATE INDEX IF NOT EXISTS idx_book_chapters_book_order 
ON book_chapters(book_id, chapter_number ASC)
WHERE deleted_at IS NULL;

-- Verify indexes were created
-- If this block produces 0 rows, indexes failed to create
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
