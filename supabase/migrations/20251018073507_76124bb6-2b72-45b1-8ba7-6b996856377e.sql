-- Create premium_services table for managing all premium offerings
CREATE TABLE IF NOT EXISTS public.premium_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('subscription', 'one_time')),
  tier_level TEXT NOT NULL CHECK (tier_level IN ('basic', 'premium', 'enterprise', 'custom')),
  description TEXT,
  price_amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  billing_interval TEXT CHECK (billing_interval IN ('month', 'year', 'week', 'day', 'one_time')),
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  paypal_plan_id TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.premium_services ENABLE ROW LEVEL SECURITY;

-- Public can view active services
CREATE POLICY "Anyone can view active premium services"
  ON public.premium_services
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all services
CREATE POLICY "Admins can manage all premium services"
  ON public.premium_services
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_premium_services_active ON public.premium_services(is_active, display_order);
CREATE INDEX idx_premium_services_stripe ON public.premium_services(stripe_product_id, stripe_price_id);

-- Trigger for updated_at
CREATE TRIGGER update_premium_services_updated_at
  BEFORE UPDATE ON public.premium_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();