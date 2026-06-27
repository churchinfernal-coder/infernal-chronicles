import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, ArrowLeft, CreditCard, Loader2, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function WickedWorksPurchase() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user }, error } = await supabase. auth.getUser();
    if (error || !user) {
      toast.error('Please log in to purchase');
      navigate('/auth');
      return;
    }
    setUserId(user.id);
  };

  const handlePurchase = async () => {
    if (!userId) {
      toast.error('Please log in to purchase');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase. functions.invoke('create-checkout-session', {
        body: {
          userId,
          productType: 'wicked_works',
          priceId: 'price_1SmhlMC79jfp0SqdZ1M9nGuI',
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error('Failed to create checkout session');
        setLoading(false);
        return;
      }

      if (data?. url) {
        window.location.href = data.url;
      } else {
        toast. error('No checkout URL received');
        setLoading(false);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="bg-black/95 backdrop-blur-xl border-2 border-purple-600/50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Crown className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-pulse" />
              <h1 className="text-4xl font-gothic text-purple-500 mb-2">
                Upgrade to Pro
              </h1>
              <p className="text-gray-400">
                Unlock the full power of Wicked Works
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 border-2 border-purple-600/50 rounded-lg p-6 mb-6 text-center">
              <p className="text-gray-400 text-sm mb-2">Professional Design Suite</p>
              <div className="flex items-center justify-center gap-4 mb-3">
                <p className="text-6xl font-bold text-purple-500">$9.99</p>
              </div>
              <p className="text-gray-400 text-sm mb-3">/month</p>
              <p className="text-sm text-gray-400">
                Start with <span className="text-purple-500 font-bold">7-day free trial</span>
              </p>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-purple-500 font-bold text-center mb-3">👑 Pro Features: </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">Advanced Editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">AI Image Gen</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">1000+ Templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">Priority Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">Commercial License</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">No Watermarks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">Cloud Storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">Stock Assets</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handlePurchase}
                disabled={loading}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 shadow-[0_0_30px_rgba(168,85,247,0.6)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Start Free Trial
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="lg"
                disabled={loading}
                className="w-full border-purple-600/50 text-purple-600 hover:bg-purple-600/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              ✓ Secure payment • ✓ Cancel anytime • ✓ 7-day free trial
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}