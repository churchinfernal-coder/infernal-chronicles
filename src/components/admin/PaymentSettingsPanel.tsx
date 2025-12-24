import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, DollarSign, Key, Loader2, Save, Shield } from "lucide-react";

export const PaymentSettingsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [stripeSettings, setStripeSettings] = useState({
    isActive: false,
    testMode: true,
    currency: "usd",
    webhookSecret: ""
  });
  const [paypalSettings, setPaypalSettings] = useState({
    isActive: false,
    testMode: true,
    currency: "usd",
    webhookSecret: ""
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*');

      if (error) throw error;

      data?.forEach(setting => {
        if (setting.payment_gateway === 'stripe') {
          setStripeSettings({
            isActive: setting.is_active || false,
            testMode: setting.test_mode || true,
            currency: setting.currency || 'usd',
            webhookSecret: setting.webhook_secret || ''
          });
        } else if (setting.payment_gateway === 'paypal') {
          setPaypalSettings({
            isActive: setting.is_active || false,
            testMode: setting.test_mode || true,
            currency: setting.currency || 'usd',
            webhookSecret: setting.webhook_secret || ''
          });
        }
      });
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load payment settings');
    }
  };

  const saveStripeSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('payment_settings')
        .upsert({
          payment_gateway: 'stripe',
          is_active: stripeSettings.isActive,
          test_mode: stripeSettings.testMode,
          currency: stripeSettings.currency,
          webhook_secret: stripeSettings.webhookSecret
        }, {
          onConflict: 'payment_gateway'
        });

      if (error) throw error;
      toast.success('Stripe settings saved successfully');
    } catch (error: any) {
      console.error('Error saving Stripe settings:', error);
      toast.error('Failed to save Stripe settings');
    } finally {
      setLoading(false);
    }
  };

  const savePayPalSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('payment_settings')
        .upsert({
          payment_gateway: 'paypal',
          is_active: paypalSettings.isActive,
          test_mode: paypalSettings.testMode,
          currency: paypalSettings.currency,
          webhook_secret: paypalSettings.webhookSecret
        }, {
          onConflict: 'payment_gateway'
        });

      if (error) throw error;
      toast.success('PayPal settings saved successfully');
    } catch (error: any) {
      console.error('Error saving PayPal settings:', error);
      toast.error('Failed to save PayPal settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Shield className="w-5 h-5 text-primary" />
          Payment Gateway Settings
        </CardTitle>
        <CardDescription>
          Configure Stripe and PayPal payment integrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stripe" className="w-full">
          <TabsList className="grid grid-cols-2 bg-muted/50">
            <TabsTrigger value="stripe">
              <CreditCard className="w-4 h-4 mr-2" />
              Stripe
            </TabsTrigger>
            <TabsTrigger value="paypal">
              <DollarSign className="w-4 h-4 mr-2" />
              PayPal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stripe" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stripe-active">Enable Stripe</Label>
                <p className="text-xs text-muted-foreground">
                  Activate Stripe payment processing
                </p>
              </div>
              <Switch
                id="stripe-active"
                checked={stripeSettings.isActive}
                onCheckedChange={(checked) =>
                  setStripeSettings({ ...stripeSettings, isActive: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stripe-test">Test Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Use Stripe test API keys
                </p>
              </div>
              <Switch
                id="stripe-test"
                checked={stripeSettings.testMode}
                onCheckedChange={(checked) =>
                  setStripeSettings({ ...stripeSettings, testMode: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripe-currency">Currency</Label>
              <Input
                id="stripe-currency"
                value={stripeSettings.currency}
                onChange={(e) =>
                  setStripeSettings({ ...stripeSettings, currency: e.target.value })
                }
                placeholder="usd"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripe-webhook">Webhook Secret</Label>
              <Input
                id="stripe-webhook"
                type="password"
                value={stripeSettings.webhookSecret}
                onChange={(e) =>
                  setStripeSettings({ ...stripeSettings, webhookSecret: e.target.value })
                }
                placeholder="whsec_..."
              />
              <p className="text-xs text-muted-foreground">
                Get this from your Stripe Dashboard → Webhooks
              </p>
            </div>

            <div className="p-3 rounded-md bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Key className="w-4 h-4 text-primary" />
                API Keys (Stored in Supabase Secrets)
              </div>
              <p className="text-xs text-muted-foreground">
                Stripe API keys are securely stored as STRIPE_SECRET_KEY in Supabase Edge Function Secrets.
                Configure them in the Supabase Dashboard.
              </p>
            </div>

            <Button
              onClick={saveStripeSettings}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Stripe Settings
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="paypal-active">Enable PayPal</Label>
                <p className="text-xs text-muted-foreground">
                  Activate PayPal payment processing
                </p>
              </div>
              <Switch
                id="paypal-active"
                checked={paypalSettings.isActive}
                onCheckedChange={(checked) =>
                  setPaypalSettings({ ...paypalSettings, isActive: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="paypal-test">Sandbox Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Use PayPal sandbox environment
                </p>
              </div>
              <Switch
                id="paypal-test"
                checked={paypalSettings.testMode}
                onCheckedChange={(checked) =>
                  setPaypalSettings({ ...paypalSettings, testMode: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypal-currency">Currency</Label>
              <Input
                id="paypal-currency"
                value={paypalSettings.currency}
                onChange={(e) =>
                  setPaypalSettings({ ...paypalSettings, currency: e.target.value })
                }
                placeholder="usd"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypal-webhook">Webhook Secret</Label>
              <Input
                id="paypal-webhook"
                type="password"
                value={paypalSettings.webhookSecret}
                onChange={(e) =>
                  setPaypalSettings({ ...paypalSettings, webhookSecret: e.target.value })
                }
                placeholder="Webhook ID from PayPal"
              />
              <p className="text-xs text-muted-foreground">
                Get this from your PayPal Developer Dashboard → Webhooks
              </p>
            </div>

            <div className="p-3 rounded-md bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Key className="w-4 h-4 text-primary" />
                API Credentials (Stored in Supabase Secrets)
              </div>
              <p className="text-xs text-muted-foreground">
                PayPal Client ID and Secret are securely stored as PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET
                in Supabase Edge Function Secrets. Configure them in the Supabase Dashboard.
              </p>
            </div>

            <Button
              onClick={savePayPalSettings}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save PayPal Settings
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
