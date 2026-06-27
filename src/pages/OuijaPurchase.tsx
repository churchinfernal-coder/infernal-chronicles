import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Ghost, ArrowLeft, CreditCard, Lock, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function OuijaPurchase() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    
    try {
      const { data:  { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast. error('Please log in to purchase');
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          userId: user.id,
          productType: 'ouija',
          quantity: 10,
          priceId: 'price_1SkCzLC79jfp0SqdnpcB0o5A', // Ouija Chamber Unlimited Questions
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error('Failed to create checkout session');
        setLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('No checkout URL returned');
        setLoading(false);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('An error occurred during purchase');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <Card className="bg-black/95 backdrop-blur-xl border-2 border-purple-600/50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Lock className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h1 className="text-4xl font-gothic text-purple-500 mb-2">
                Summon the Spirits
              </h1>
              <p className="text-gray-400">
                The Ouija Chamber requires tokens to contact the spirit realm
              </p>
            </div>

            <div className="bg-purple-950/30 border border-purple-600/30 rounded-lg p-6 mb-6 text-center">
              <p className="text-gray-400 text-sm mb-2">Séance Sessions</p>
              <div className="flex items-center justify-center gap-4 mb-3">
                <div>
                  <p className="text-6xl font-bold text-purple-500">10</p>
                  <p className="text-gray-400 text-sm">Tokens</p>
                </div>
                <div className="text-purple-600 text-3xl">=</div>
                <div>
                  <p className="text-6xl font-bold text-purple-500">$4.99</p>
                  <p className="text-gray-400 text-sm">One-Time</p>
                </div>
              </div>
              <p className="text-sm text-purple-400">Only $0.50 per session</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Create séance room
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Invite up to 5 friends
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> 6 questions per session
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Multiple spirit types
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Real-time spirit board
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span> No ads, pure darkness
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handlePurchase}
                disabled={loading}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6"
              >
                <Ghost className="mr-2 h-5 w-5" />
                {loading ? 'Processing...' :  'Buy 10 Tokens for $4.99'}
              </Button>

              <Button
                onClick={() => navigate('/premium')}
                variant="outline"
                size="lg"
                className="w-full border-yellow-600/50 text-yellow-600 hover:bg-yellow-600/10"
              >
                <Crown className="mr-2 h-5 w-5" />
                Get Unlimited with Premium
              </Button>

              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="lg"
                className="w-full border-purple-600/50 text-purple-600"
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