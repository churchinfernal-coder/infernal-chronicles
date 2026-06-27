import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  stripe_product_id: string;
  stripe_price_id: string;
  price_cents: number;
  is_active: boolean;
  chamber_type?: string;
  feature_type?: string;
  created_at?: string;
  updated_at?: string;
}

export default function Premium() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (! user) {
      navigate("/login");
      return;
    }
    fetchProducts();
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("stripe_products")
        .select("*")
        .eq("is_active", true)
        .eq("feature_type", "subscription") // Only get subscription products
        .order("price_cents", { ascending: true });

      if (error) throw error;
      
      console.log("Fetched products:", data);
      setProducts(data || []);
    } catch (error:  any) {
      console.error("Error fetching products:", error);
      toast({
        title:  "Error",
        description: "Failed to load premium plans",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubscribe = async (product:  StripeProduct) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      console.log("Subscribing to:", product);

      // Use create-checkout-session with subscription mode
      const { data: sessionData, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body:  {
            userId: user.id,
            productType: "premium",
            quantity: 999999, // Unlimited
            priceId: product.stripe_price_id,
            mode: "subscription", // This tells the function to use subscription mode
          },
        }
      );

      if (error) throw error;

      console.log("Checkout session created:", sessionData);

      if (sessionData?.url) {
        window.location.href = sessionData. url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  if (loadingProducts) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-transparent">
            Unlock the Dark Arts
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Gain unlimited access to tarot readings, rune interpretations, and mystical insights
          </p>
        </div>

        {profile?.is_premium && (
          <Card className="bg-gradient-to-r from-red-900/20 to-purple-900/20 border-red-500/30 mb-12 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-red-500" />
                Active Premium Member
              </CardTitle>
              <CardDescription className="text-gray-300">
                You have unlimited access to all premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Tarot Credits:</span>
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                  {profile.tarot_credits || 0} / ∞
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {products.length === 0 ? (
          <Card className="bg-zinc-900/50 border-yellow-500/30 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-yellow-500">Stripe Integration Coming Soon... </CardTitle>
              <CardDescription className="text-gray-400">
                Premium subscriptions will be available shortly.  Check back soon!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {products.map((product) => (
              <Card
                key={product.id}
                className="bg-zinc-900/50 border-red-500/30 hover: border-red-500/50 transition-all duration-300 backdrop-blur-sm"
              >
                <CardHeader>
                  <CardTitle className="text-2xl text-white">{product.name}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {product.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">
                      ${(product.price_cents / 100).toFixed(2)}
                    </span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-gray-300 text-sm">Unlimited Tarot Readings</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-gray-300 text-sm">Unlimited Ouija Sessions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-gray-300 text-sm">Unlimited Rune Casts</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-gray-300 text-sm">All Advanced Spreads</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-gray-300 text-sm">Reading History Access</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-gray-300 text-sm">Priority Support</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-gray-300 text-sm">Early Feature Access</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-gray-300 text-sm">No Ads, Pure Darkness</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSubscribe(product)}
                    disabled={loading || profile?.is_premium}
                    className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : profile?.is_premium ? (
                      "Current Plan"
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="bg-zinc-900/30 border-zinc-700/30 max-w-2xl mx-auto mt-12">
          <CardHeader>
            <CardTitle className="text-white">Free Tier</CardTitle>
            <CardDescription className="text-gray-400">
              Limited access to occult features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-gray-300 text-sm">5 Tarot Readings per Month</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-gray-300 text-sm">3 Rune Casts per Month</span>
            </div>
            <div className="flex items-start gap-2">
              <X className="h-5 w-5 text-red-500 shrink-0" />
              <span className="text-gray-400 text-sm line-through">Priority Support</span>
            </div>
            <div className="flex items-start gap-2">
              <X className="h-5 w-5 text-red-500 shrink-0" />
              <span className="text-gray-400 text-sm line-through">Early Access</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            All subscriptions are billed monthly. Cancel anytime from your dashboard.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Powered by Stripe • Secure payments
          </p>
        </div>
      </div>
    </div>
  );
}