-- 🔍 DATABASE DISCOVERY QUERIES
-- Run these queries in Supabase SQL Editor (https://app.supabase.com/project/khugyibzsujjgtddwzpa/sql)
-- Copy each query below, run separately, and share results

-- ============================================================================
-- QUERY 1: List all tables in public schema
-- ============================================================================
SELECT 
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- QUERY 2: Show schema for subscription-related tables
-- ============================================================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('occult_subscriptions', 'subscriptions', 'subscription_plans', 'book_purchases')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- QUERY 3: Show schema for reading/progress tables
-- ============================================================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('reading_history', 'reading_progress', 'book_chapters', 'coven_posts')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- QUERY 4: Count rows in subscription/purchase tables
-- ============================================================================
SELECT 'occult_subscriptions' AS table_name, COUNT(*) AS row_count FROM public.occult_subscriptions
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM public.subscriptions
UNION ALL
SELECT 'subscription_plans', COUNT(*) FROM public.subscription_plans
UNION ALL
SELECT 'book_purchases', COUNT(*) FROM public.book_purchases
ORDER BY table_name;

-- ============================================================================
-- QUERY 5: Count rows in reading/chapter tables
-- ============================================================================
SELECT 'reading_history' AS table_name, COUNT(*) AS row_count FROM public.reading_history
UNION ALL
SELECT 'reading_progress', COUNT(*) FROM public.reading_progress
UNION ALL
SELECT 'book_chapters', COUNT(*) FROM public.book_chapters
UNION ALL
SELECT 'coven_posts', COUNT(*) FROM public.coven_posts
ORDER BY table_name;

-- ============================================================================
-- QUERY 6: Show existing indexes (except default ones)
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'occult_subscriptions', 'subscriptions', 'subscription_plans',
    'book_purchases', 'reading_history', 'reading_progress',
    'book_chapters', 'coven_posts'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- QUERY 7: Show RLS policies for relevant tables
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual AS filter_condition,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'occult_subscriptions', 'subscriptions', 'subscription_plans',
    'book_purchases', 'reading_history', 'reading_progress',
    'book_chapters', 'coven_posts'
  )
ORDER BY tablename, policyname;
