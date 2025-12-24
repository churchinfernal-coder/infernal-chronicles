import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, DollarSign, Loader2 } from "lucide-react";

interface PremiumService {
  id: string;
  service_name: string;
  service_type: string;
  tier_level: string;
  description: string;
  price_amount: number;
  currency: string;
  billing_interval: string;
  features: any;
  is_active: boolean;
  display_order: number;
}

export default function PremiumServicesDisplay() {
  const [services, setServices] = useState<PremiumService[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('premium_services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      console.error('Error loading services:', error);
      toast.error('Failed to load premium services');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (serviceId: string) => {
    try {
      setCheckoutLoading(serviceId);

      const { data, error } = await supabase.functions.invoke('create-premium-checkout', {
        body: { service_id: serviceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      case 'enterprise': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getBillingText = (interval: string) => {
    const intervalMap: Record<string, string> = {
      'month': '/month',
      'year': '/year',
      'week': '/week',
      'day': '/day',
      'one_time': 'one-time',
    };
    return intervalMap[interval] || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No premium services available at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <Card key={service.id} className="bg-card border-border flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <Badge className={getTierBadgeColor(service.tier_level)}>
                {service.tier_level}
              </Badge>
              <Badge variant={service.service_type === 'subscription' ? 'default' : 'secondary'}>
                {service.service_type === 'subscription' ? 'Subscription' : 'One-Time'}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{service.service_name}</CardTitle>
            <CardDescription>{service.description}</CardDescription>
          </CardHeader>

          <CardContent className="flex-1">
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(service.price_amount, service.currency)}
                </span>
                <span className="text-muted-foreground">
                  {getBillingText(service.billing_interval)}
                </span>
              </div>
            </div>

            {service.features && service.features.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Features:</p>
                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <Button
              onClick={() => handleCheckout(service.id)}
              disabled={checkoutLoading !== null}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {checkoutLoading === service.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
