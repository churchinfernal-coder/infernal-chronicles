import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import TarotChamber from '@/pages/TarotChamber';
import TarotPaywall from './TarotPaywall';

interface ProfileData {
  tarot_credits: number;
  is_premium: boolean;
}

export default function TarotRoute() {
  const [credits, setCredits] = useState<number>(0);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCredits = async () => {
      const { data: { user } } = await supabase. auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('tarot_credits, is_premium')
        .eq('user_id', user.id)
        .single<ProfileData>();

      if (!data) {
        console.log('🔥 NO DATA - User not found');
        setCredits(0);
        setIsPremium(false);
        setLoading(false);
        return;
      }

      console.log('🔥 RAW DATA FROM DB:', data);
      console.log('🔥 CREDITS:', data.tarot_credits);
      console.log('🔥 IS_PREMIUM:', data.is_premium);

      const userCredits = data.tarot_credits ??  0;
      const userPremium = data.is_premium ?? false;

      setCredits(userCredits);
      setIsPremium(userPremium);
      setLoading(false);

      console.log('🔥 STATE SET - Credits:', userCredits, '| Premium:', userPremium);
      console.log('🔥 SHOULD SHOW PAYWALL? ', userCredits === 0 && !userPremium);
    };

    fetchCredits();
  }, [navigate]);

  console.log('🔥 RENDER - Credits:', credits, '| Premium:', isPremium, '| Loading:', loading);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (credits === 0 && !isPremium) {
    console.log('🔥 SHOWING PAYWALL! ');
    return <TarotPaywall onUpgrade={() => navigate('/tarot-purchase')} />;
  }

  console. log('🔥 SHOWING TAROT CHAMBER!');
  return <TarotChamber remainingCredits={credits} onCreditUsed={() => window.location.reload()} />;
}