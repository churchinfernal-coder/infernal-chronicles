-- Create payment_settings table for storing gateway configurations
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_gateway text NOT NULL CHECK (payment_gateway IN ('stripe', 'paypal')),
  is_active boolean DEFAULT false,
  webhook_secret text,
  test_mode boolean DEFAULT true,
  currency text DEFAULT 'usd',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(payment_gateway)
);

-- Create product_prices table for managing pricing
CREATE TABLE IF NOT EXISTS public.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  description text,
  stripe_product_id text,
  stripe_price_id text,
  paypal_product_id text,
  paypal_plan_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  billing_interval text CHECK (billing_interval IN ('one_time', 'day', 'week', 'month', 'year')),
  is_active boolean DEFAULT true,
  features jsonb,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create payment_transactions table for tracking payments
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  payment_gateway text NOT NULL,
  transaction_type text CHECK (transaction_type IN ('one_time', 'subscription')),
  gateway_transaction_id text NOT NULL,
  product_price_id uuid REFERENCES public.product_prices(id),
  amount_cents integer NOT NULL,
  currency text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_settings
CREATE POLICY "Admins can manage payment settings"
  ON public.payment_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for product_prices
CREATE POLICY "Everyone can view active prices"
  ON public.product_prices
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage product prices"
  ON public.product_prices
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.payment_transactions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create transactions"
  ON public.payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_gateway ON public.payment_transactions(payment_gateway);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_product_prices_active ON public.product_prices(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_updated_at();

CREATE TRIGGER update_product_prices_updated_at
  BEFORE UPDATE ON public.product_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_updated_at();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_updated_at();