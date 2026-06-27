import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  tarot_credits: number;
}

export default function Purchase() {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(0);

  useEffect(() => {
    fetchCurrentCredits();
  }, []);

  const fetchCurrentCredits = async () => {
    try {
      const { data:  { user }, error: userError } = await supabase.auth. getUser();
      
      if (userError || !user) {
        console.error('User fetch error:', userError);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tarot_credits')
        .eq('id', user.id)
        .single<ProfileData>();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        setCurrentCredits(0);
        return;
      }

      setCurrentCredits(profile.tarot_credits || 0);
    } catch (error) {
      console.error('Fetch credits error:', error);
      setCurrentCredits(0);
    }
  };

  const handlePurchase = async () => {
    setProcessing(true);

    try {
      const { data: { user }, error: userError } = await supabase. auth.getUser();
      
      if (userError || !user) {
        toast.error('Please log in first');
        setProcessing(false);
        return;
      }

      const { error } = await (supabase as any).rpc('add_tarot_credits', {
        p_user_id: user.id,
        p_credits: 13,
        p_amount:  9.99,
        p_provider: 'test',
        p_payment_id: `test_${Date.now()}`
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      toast.success('13 readings unlocked!  🎴', { duration:  3000 });
      
      await fetchCurrentCredits();

      setTimeout(() => {
        navigate('/tarot');
      }, 1500);

    } catch (error:  any) {
      console.error('Purchase error:', error);
      toast.error(error?.message || 'Purchase failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950 flex items-center justify-center p-4">
      <Card className="bg-black/90 border-2 border-red-600/50 max-w-2xl shadow-2xl">
        <CardContent className="p-8 text-center">
          <Crown className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-4xl font-gothic text-red-600 mb-4">
            Purchase Readings
          </h1>

          {currentCredits > 0 && (
            <div className="bg-purple-950/50 border border-purple-600/30 rounded-lg p-4 mb-6">
              <p className="text-white">
                You currently have <span className="text-purple-400 font-bold">{currentCredits}</span> {currentCredits === 1 ? 'reading' : 'readings'} remaining
              </p>
            </div>
          )}

          <div className="bg-red-950/30 border border-red-600/30 rounded-lg p-6 mb-6">
            <p className="text-6xl font-bold text-red-500 mb-2">13 Readings</p>
            <p className="text-4xl font-bold text-white mb-4">$9.99</p>
            <p className="text-gray-400">Only $0.77 per reading</p>
          </div>

          <p className="text-gray-400 mb-6">
            Stripe integration coming soon... 
            <br />
            <span className="text-sm">(Click below to add 13 test credits)</span>
          </p>

          <div className="space-y-3">
            <Button 
              onClick={handlePurchase}
              disabled={processing}
              className="w-full bg-red-600 hover: bg-red-700 text-white text-lg py-6"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-5 w-5" />
                  Purchase Now (Test)
                </>
              )}
            </Button>

            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full border-red-600/50 text-red-600 hover:bg-red-600/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          <div className="text-center mt-6 pt-6 border-t border-red-600/20">
            <p className="text-gray-500 text-sm">
              ✓ Secure payment • ✓ Instant access • ✓ No subscription
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}