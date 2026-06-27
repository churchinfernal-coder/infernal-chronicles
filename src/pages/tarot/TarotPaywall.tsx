import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Crown, ArrowLeft, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TarotPaywallProps {
  onUpgrade:  () => void;
}

const INFERNAL_CARDS = [
  {
    name: 'The Infernal Priest',
    image: 'https://khugyibzsujjgtddwzpa.supabase.co/storage/v1/object/public/Tarot%20cards/Infernal%20Priest.png', // FIXED:  Removed space
    description: 'Knowledge & Wisdom'
  },
  {
    name: 'The Infernal Card',
    image:  'https://khugyibzsujjgtddwzpa.supabase.co/storage/v1/object/public/Tarot%20cards/Infernal%20%20card. png', // FIXED: Removed space (filename has 2 spaces)
    description: 'Chaos & Unpredictability'
  },
  {
    name: 'The Infernal Witch',
    image: 'https://khugyibzsujjgtddwzpa.supabase.co/storage/v1/object/public/Tarot%20cards/Infernal%20Witch. png', // FIXED: Removed space
    description: 'Spellcraft & Power'
  }
];

export default function TarotPaywall({ onUpgrade }: TarotPaywallProps) {
  const navigate = useNavigate();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCardIndex((prev) => (prev + 1) % INFERNAL_CARDS. length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const pricePerReading = (9.99 / 13).toFixed(2);

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const { data:  { user }, error: userError } = await supabase.auth. getUser();
      
      if (userError || !user) {
        toast.error('Please log in to purchase');
        navigate('/auth');
        return;
      }

      // CHANGE THIS PRICE ID TO YOUR NEW ONE-TIME PRICE
    const { data, error } = await supabase. functions.invoke('create-checkout-session', {
  body: {
    userId: user.id,
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
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950 flex items-center justify-center p-4 overflow-hidden">
      
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920), 
              y: -20 
            }}
            animate={{ 
              y: typeof window !== 'undefined' ? window. innerHeight + 20 : 1080,
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity, 
              delay: Math.random() * 2 
            }}
          />
        ))}
      </div>

      {/* Spinning Cards Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="relative w-full h-full flex items-center justify-center">
          {INFERNAL_CARDS.map((card, index) => {
            const totalCards = INFERNAL_CARDS.length;
            const angle = (index / totalCards) * 360 + (Date.now() / 50) % 360;
            const radius = Math.min(window. innerWidth, window.innerHeight) * 0.38;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <motion.div
                key={card.name}
                className="absolute w-56 h-80 md:w-64 md:h-96 lg:w-72 lg: h-[28rem]"
                style={{
                  left:  '50%',
                  top: '50%',
                }}
                animate={{
                  x: x - 112,
                  y: y - 160,
                  rotate: angle + 90,
                  scale: currentCardIndex === index ? 1.15 : 0.75,
                  opacity: currentCardIndex === index ? 0.95 : 0.35,
                }}
                transition={{
                  duration: 3,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                <div className="relative w-full h-full">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-cover rounded-lg shadow-2xl shadow-red-600/60 border-2 border-red-600/40"
                    onError={(e) => {
                      console. error('Failed to load card:', card.image);
                      e. currentTarget.style.display = 'none';
                    }}
                  />
                  {currentCardIndex === index && (
                    <motion.div
                      className="absolute inset-0 bg-red-600/30 rounded-lg blur-2xl"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main Paywall Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration:  0.5 }}
        className="relative z-50 max-w-2xl w-full"
      >
        <Card className="bg-black/95 backdrop-blur-xl border-2 border-red-600/50 shadow-2xl shadow-red-600/30">
          <CardContent className="p-8">
            
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration:  2, repeat: Infinity }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <Lock className="h-20 w-20 text-red-600" />
                <motion.div
                  className="absolute inset-0 bg-red-600/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion. div>

            <h1 className="text-5xl font-gothic text-center text-red-600 mb-3">
              Enter the Infernal Realm
            </h1>
            <p className="text-center text-gray-400 text-lg mb-8">
              The Tarot Chamber awaits those who seek forbidden knowledge
            </p>

            <div className="bg-red-950/30 border border-red-600/30 rounded-lg p-4 mb-6 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCardIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <p className="text-red-500 text-sm mb-1">Now Channeling</p>
                  <h3 className="text-white text-xl font-bold">{INFERNAL_CARDS[currentCardIndex]. name}</h3>
                  <p className="text-gray-400 text-sm">{INFERNAL_CARDS[currentCardIndex].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="bg-gradient-to-br from-red-950/50 to-purple-950/50 border-2 border-red-600/50 rounded-lg p-6 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 text-center">
                <p className="text-gray-400 text-sm mb-2">Sacred Number of Lunar Cycles</p>
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div>
                    <p className="text-6xl font-bold text-red-500">13</p>
                    <p className="text-gray-400 text-sm">Readings</p>
                  </div>
                  <div className="text-red-600 text-3xl">=</div>
                  <div>
                    <p className="text-6xl font-bold text-red-500">$9.99</p>
                    <p className="text-gray-400 text-sm">One-Time</p>
                  </div>
                </div>
                
                <div className="inline-block bg-black/50 px-4 py-2 rounded-full border border-red-600/30">
                  <p className="text-white text-lg">
                    Only <span className="text-red-500 font-bold">${pricePerReading}</span> per reading
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                13 Readings Unlock: 
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  'All 78 Tarot cards',
                  'All 3 Infernal Paths',
                  '3 spread types',
                  'Advanced interpretations',
                  'Card reversals',
                  'Reading history saved',
                  'Beautiful animations',
                  'No ads, no tracking'
                ].map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x:  -20 }}
                    animate={{ opacity: 1, x:  0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 text-gray-300"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handlePurchase}
                disabled={loading}
                size="lg"
                className="w-full bg-red-600 hover: bg-red-700 text-white text-lg py-6 shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_rgba(220,38,38,0.7)] transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Opening Portal... 
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
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

            <div className="text-center mt-6 pt-6 border-t border-red-600/20">
              <p className="text-gray-500 text-sm flex items-center justify-center gap-4 flex-wrap">
                <span>✓ Secure payment</span>
                <span>✓ Instant access</span>
                <span>✓ No subscription</span>
              </p>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}