-- 🎯 PRODUCTION DATABASE SETUP - Critical Indexes
-- Apply this SQL in Supabase Dashboard → SQL Editor
-- This creates 6 critical indexes for performance optimization

-- Index 1: Subscriptions - Fast user + status lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
ON subscriptions(user_id, status)
WHERE status = 'active';

-- Index 2: Book Purchases - Fast user + book lookup
CREATE INDEX IF NOT EXISTS idx_book_purchases_user_book
ON book_purchases(user_id, book_id);

-- Index 3: Coven Posts - Fast user lookup + sort by date
CREATE INDEX IF NOT EXISTS idx_coven_posts_user_created
ON coven_posts(user_id, created_at DESC);

-- Index 4: Reading Progress - Fast user + book lookup
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book
ON reading_progress(user_id, book_id);

-- Index 5: Subscription Plans - Fast Stripe price lookup
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price
ON subscription_plans(stripe_price_id);

-- Index 6: Book Chapters - Fast book + order lookup
CREATE INDEX IF NOT EXISTS idx_book_chapters_book_order
ON book_chapters(book_id, chapter_order);

-- ✅ These indexes are critical for:
-- - Database P99 latency < 100ms
-- - Subscription lookup fast
-- - E-book access control fast
-- - Social posting fast
-- - Reading progress tracking fast
