import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function TarotPurchase() {
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
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
  body: {
    userId,
    productType: 'tarot',
    quantity: 13,
   priceId: 'price_1SmgiLC79jfp0SqdGTcsuPgT', // NEW ONE-TIME $9.99
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
      toast.error('An error occurred.  Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale:  0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <Card className="bg-black/95 backdrop-blur-xl border-2 border-red-600/50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
              <h1 className="text-4xl font-gothic text-red-500 mb-2">
                Enter the Infernal Realm
              </h1>
              <p className="text-gray-400">
                The Tarot Chamber awaits those who seek forbidden knowledge
              </p>
            </div>

            <div className="text-center mb-4">
              <p className="text-red-500 text-sm font-bold mb-1">Now Channeling</p>
              <p className="text-white text-xl font-bold mb-1">The Infernal Card</p>
              <p className="text-gray-400 text-sm">Chaos & Unpredictability</p>
            </div>

            <div className="bg-gradient-to-br from-red-950/50 to-orange-950/50 border-2 border-red-600/50 rounded-lg p-6 mb-6 text-center">
              <p className="text-gray-400 text-sm mb-2">Sacred Number of Lunar Cycles</p>
              <div className="flex items-center justify-center gap-4 mb-3">
                <p className="text-6xl font-bold text-red-500">13</p>
                <p className="text-4xl text-gray-500">=</p>
                <p className="text-6xl font-bold text-red-500">$9.99</p>
              </div>
              <p className="text-red-400 text-sm">Readings</p>
              <p className="text-gray-400 text-sm mb-3">One-Time</p>
              <p className="text-sm text-gray-400">
                Only <span className="text-red-500 font-bold">$0.77</span> per reading
              </p>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-red-500 font-bold text-center mb-3">👑 13 Readings Unlock: </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">All 78 Tarot cards</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">All 3 Infernal Paths</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">3 spread types</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">Advanced interpretations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">Card reversals</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">Reading history saved</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">Beautiful animations</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">No ads, no tracking</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handlePurchase}
                disabled={loading}
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 shadow-[0_0_30px_rgba(220,38,38,0.6)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Opening Portal...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Unlock 13 Readings for $9.99
                  </>
                )}
              </Button>

              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="lg"
                disabled={loading}
                className="w-full border-red-600/50 text-red-600 hover:bg-red-600/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Darkness
              </Button>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              ✓ Secure payment • ✓ Instant access • ✓ No subscription
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}