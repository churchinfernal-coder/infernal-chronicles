-- Update constraints to support all monetization models

-- Drop old constraints
ALTER TABLE premium_services DROP CONSTRAINT IF EXISTS premium_services_service_type_check;
ALTER TABLE premium_services DROP CONSTRAINT IF EXISTS premium_services_tier_level_check;
ALTER TABLE premium_services DROP CONSTRAINT IF EXISTS premium_services_billing_interval_check;

-- Add updated constraints
ALTER TABLE premium_services 
  ADD CONSTRAINT premium_services_service_type_check 
  CHECK (service_type IN ('subscription', 'one_time', 'token_package', 'admin_only'));

ALTER TABLE premium_services 
  ADD CONSTRAINT premium_services_tier_level_check 
  CHECK (tier_level IN ('basic', 'premium', 'enterprise', 'custom', 'token_10', 'token_50', 'token_100', 'library', 'wicked_works', 'lifetime', 'admin_only'));

ALTER TABLE premium_services 
  ADD CONSTRAINT premium_services_billing_interval_check 
  CHECK (billing_interval IS NULL OR billing_interval IN ('month', 'year', 'week', 'day', 'one_time'));

-- Insert initial premium services
INSERT INTO premium_services (service_name, description, service_type, tier_level, price_amount, currency, features, is_active, display_order)
VALUES 
  -- Token-based services
  ('Ouija Tokens - 10 Pack', 'Pay-per-use tokens for Ouija board sessions', 'token_package', 'token_10', 9.99, 'usd', '["10 Ouija sessions", "AI-powered spirit responses", "Session history"]'::jsonb, true, 1),
  ('Rune Casting Tokens - 10 Pack', 'Pay-per-use tokens for Rune casting readings', 'token_package', 'token_10', 9.99, 'usd', '["10 Rune casting sessions", "AI interpretations", "Reading history"]'::jsonb, true, 2),
  ('Tarot Reading Tokens - 10 Pack', 'Pay-per-use tokens for Tarot readings', 'token_package', 'token_10', 9.99, 'usd', '["10 Tarot reading sessions", "Multiple spread types", "AI interpretations"]'::jsonb, true, 3),
  ('Image Generation Tokens - 50 Pack', 'AI-powered image generation credits', 'token_package', 'token_50', 19.99, 'usd', '["50 AI image generations", "High-quality output", "Multiple styles"]'::jsonb, true, 4),
  ('Gaming Tokens - 100 Pack', 'Credits for game creation and play', 'token_package', 'token_100', 14.99, 'usd', '["100 game credits", "Asset generation", "Game publishing"]'::jsonb, true, 5),
  
  -- Subscription services
  ('Occult Library Access', 'Full access to the Occult Library collection', 'subscription', 'library', 9.99, 'usd', '["Unlimited book access", "PDF downloads", "Highlighting & notes", "New releases"]'::jsonb, true, 6),
  ('Wicked Works Pro', 'Professional design and AI image tools', 'subscription', 'wicked_works', 19.99, 'usd', '["Design editor access", "Unlimited AI generations", "Advanced filters", "Export options"]'::jsonb, true, 7),
  
  -- One-time purchase
  ('Prime Membership', 'Lifetime premium access to core features', 'one_time', 'lifetime', 99.99, 'usd', '["Lifetime access", "Priority support", "Exclusive badges", "Ad-free experience"]'::jsonb, true, 8),
  
  -- Admin-only service
  ('Book Generator', 'AI-powered book writing engine (Admin only)', 'admin_only', 'admin_only', 0.00, 'usd', '["AI chapter generation", "Character creation", "Plot assistance", "Export options"]'::jsonb, true, 9)
ON CONFLICT DO NOTHING;

-- Add billing_interval for subscriptions
UPDATE premium_services 
SET billing_interval = 'month' 
WHERE service_type = 'subscription' AND billing_interval IS NULL;