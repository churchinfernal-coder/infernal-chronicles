import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowLeft, Crown, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WickedWorksPaywallProps {
  onUpgrade:  () => void;
}

export default function WickedWorksPaywall({ onUpgrade }: WickedWorksPaywallProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const { data:  { user }, error: userError } = await supabase.auth. getUser();
      
      if (userError || !user) {
        toast.error('Please log in to upgrade');
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase. functions.invoke('create-checkout-session', {
        body: {
          userId: user.id,
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
      <Card className="max-w-2xl w-full bg-black/95 backdrop-blur-xl border-2 border-purple-600/50">
        <CardContent className="p-8">
          
          <div className="flex justify-center mb-6">
            <Crown className="h-20 w-20 text-purple-600" />
          </div>

          <div className="text-center mb-6">
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white mb-4">
              Premium Feature
            </Badge>
            <h1 className="text-5xl font-bold text-purple-600 mb-3">
              Unlock Wicked Works Pro
            </h1>
            <p className="text-gray-400 text-lg">
              Advanced design tools and unlimited AI generation
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 border-2 border-purple-600/50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Professional Design Suite</p>
              <p className="text-6xl font-bold text-purple-500">$9.99</p>
              <p className="text-gray-400 text-sm">/month</p>
              <p className="text-white text-lg mt-3">
                Cancel anytime • <span className="text-purple-500 font-bold">7-day free trial</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <h3 className="text-xl font-bold text-purple-500">Pro Features:</h3>
            <ul className="space-y-2 text-gray-300">
              <li>✓ Advanced Design Editor</li>
              <li>✓ AI Image Generation (100/hour)</li>
              <li>✓ 1000+ Premium Templates</li>
              <li>✓ Priority Support</li>
              <li>✓ Commercial License</li>
              <li>✓ Cloud Storage</li>
              <li>✓ Stock Assets</li>
              <li>✓ No Watermarks</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handlePurchase}
              disabled={loading}
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Free Trial - Then $9.99/month
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
              Maybe Later
            </Button>
          </div>

          <div className="text-center mt-6 pt-6 border-t border-purple-600/20">
            <p className="text-gray-500 text-sm">
              ✓ Secure payment • ✓ Cancel anytime • ✓ 7-day free trial
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}