import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(import.meta.env. VITE_STRIPE_PUBLIC_KEY || '');

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

const PRODUCTS: Record<string, Product> = {
  prod_tarot_unlimited:  {
    id: 'prod_tarot_unlimited',
    name: 'Unlimited Tarot Readings',
    price: 999,
    description: 'Get unlimited tarot readings for one month',
  },
  prod_rune_casting: {
    id: 'prod_rune_casting',
    name: 'Rune Casting Mastery',
    price: 499,
    description: 'Learn and practice rune casting techniques',
  },
  prod_unlimited_questions: {
    id: 'prod_unlimited_questions',
    name: 'Unlimited Ouija Questions',
    price: 499,
    description: 'Ask unlimited questions to the spirits',
  },
  prod_spirit_customization: {
    id: 'prod_spirit_customization',
    name: 'Custom Spirit Summoning',
    price:  299,
    description: 'Summon your own personalized spirit guide',
  },
  prod_session_recording: {
    id: 'prod_session_recording',
    name: 'Session Recording',
    price: 399,
    description: 'Record and replay your spiritual sessions',
  },
  prod_spirit_insights: {
    id: 'prod_spirit_insights',
    name: 'Spirit Insights Analysis',
    price: 199,
    description: 'Get detailed analysis of spirit messages',
  },
};

function CheckoutFormContent() {
  const stripe = useStripe();
  const elements = useElements();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const productId = searchParams.get('product') || '';
  const feature = searchParams.get('feature') || '';
  const product = PRODUCTS[productId];

  useEffect(() => {
    if (!product) {
      setError('Product not found');
      return;
    }

    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { session }, error:  sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to continue with your purchase.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
          {
            method: 'POST',
            headers: {
              'Authorization':   `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'apikey': import.meta. env.  VITE_SUPABASE_ANON_KEY || '',
            },
            body: JSON.stringify({
              productId,
              feature,
              amount:   product.price,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error:  errorText || 'Failed to create payment intent' };
          }
          throw new Error(errorData.error || `HTTP ${response.status}:  Payment service unavailable`);
        }

        const data = await response.json();
        
        if (!data.clientSecret) {
          throw new Error('Payment initialization failed - no client secret received');
        }

        setClientSecret(data.  clientSecret);
      } catch (err) {
        const message = err instanceof Error ? err.message :   'Unable to initialize payment.   Please try again.';
        setError(message);
        console.error('Payment intent error:', err);
        toast({
          title:   "Payment Error",
          description:   message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [product, productId, feature, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !  clientSecret) {
      setError('Payment service is unavailable. Please try again.');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { data: { user } } = await supabase.  auth.getUser();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card:  cardElement,
          billing_details: {
            name: user?.user_metadata?.full_name || user?.email || 'Guest',
            email: user?.email,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error. message || 'Payment failed');
      }

      if (result.paymentIntent?.status === 'succeeded') {
        setSucceeded(true);
        toast({
          title: "Payment Successful!   🎉",
          description: `You've successfully purchased ${product.name}`,
        });

        // Save subscription or feature unlock to database
        try {
          await (supabase as any).from('user_subscriptions').insert({
            user_id: user?. id,
            product_id:   productId,
            feature:  feature,
            status: 'active',
            payment_intent_id: result.paymentIntent.  id,
          });
        } catch (dbError) {
          console.error('Failed to save subscription:', dbError);
        }

        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.  message :  'Payment processing failed';
      setError(message);
      console.error('Payment error:', err);
      toast({
        title: "Payment Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Product Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The product you're trying to purchase doesn't exist. 
            </p>
            <Button onClick={() => navigate('/')} className="w-full" variant="outline">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (succeeded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-green-500 shadow-lg shadow-green-500/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500 animate-pulse" />
              <CardTitle className="text-green-500">Payment Successful!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <p className="text-sm font-medium mb-2">
                ✅ Purchase Complete
              </p>
              <p className="text-sm text-muted-foreground">
                Your purchase of <strong className="text-foreground">{product.name}</strong> has been completed successfully.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Redirecting to dashboard...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Complete Your Purchase</CardTitle>
          <CardDescription>Secure payment powered by Stripe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2 border border-border">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.description}</p>
            {feature && (
              <div className="pt-2">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  {feature. replace(/_/g, ' ')}
                </span>
              </div>
            )}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <p className="text-2xl font-bold text-primary">
                ${(product.price / 100).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Payment Form */}
          {!loading && clientSecret && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="card" className="text-sm font-medium">
                  Card Details
                </label>
                <div className="p-4 border border-input rounded-lg bg-background shadow-sm">
                  <CardElement
                    id="card"
                    options={{
                      style: {
                        base:   {
                          fontSize: '16px',
                          color: 'hsl(var(--foreground))',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          '::placeholder':  {
                            color: 'hsl(var(--muted-foreground))',
                          },
                        },
                        invalid: {
                          color:  'hsl(var(--destructive))',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!  stripe || processingPayment || loading}
                className="w-full"
                size="lg"
              >
                {processingPayment ?   (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    🔒 Pay ${(product.price / 100).toFixed(2)}
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Your payment is secure and encrypted
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormContent />
    </Elements>
  );
}