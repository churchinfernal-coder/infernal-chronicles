import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Crown, ArrowLeft, CheckCircle2, Ghost } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OuijaPaywallProps {
  onUpgrade: () => void;
}

export default function OuijaPaywall({ onUpgrade }: OuijaPaywallProps) {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950 flex items-center justify-center p-4 overflow-hidden">
      
      {/* Animated spirits */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ 
              x:  Math.random() * (typeof window !== 'undefined' ? window. innerWidth : 1920), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight :  1080),
              opacity:  0
            }}
            animate={{ 
              x: Math. random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              opacity: [0, 0.3, 0]
            }}
            transition={{ 
              duration: Math.random() * 5 + 3, 
              repeat: Infinity, 
              delay: Math.random() * 3 
            }}
          >
            <Ghost className="w-8 h-8 text-purple-500/30" />
          </motion.div>
        ))}
      </div>

      {/* Main Paywall Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration:  0.5 }}
        className="relative z-50 max-w-2xl w-full"
      >
        <Card className="bg-black/95 backdrop-blur-xl border-2 border-purple-600/50 shadow-2xl shadow-purple-600/30">
          <CardContent className="p-8">
            
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration:  2, repeat: Infinity }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <Lock className="h-20 w-20 text-purple-600" />
                <motion.div
                  className="absolute inset-0 bg-purple-600/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>

            <h1 className="text-5xl font-gothic text-center text-purple-600 mb-3">
              Summon the Spirits
            </h1>
            <p className="text-center text-gray-400 text-lg mb-8">
              The Ouija Chamber requires tokens to contact the spirit realm
            </p>

            <div className="bg-gradient-to-br from-purple-950/50 to-indigo-950/50 border-2 border-purple-600/50 rounded-lg p-6 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 text-center">
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
                
                <div className="inline-block bg-black/50 px-4 py-2 rounded-full border border-purple-600/30">
                  <p className="text-white text-lg">
                    Only <span className="text-purple-500 font-bold">$0.50</span> per session
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="text-xl font-bold text-purple-500 flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-500" />
                Each Token Unlocks: 
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  'Create séance room',
                  'Invite up to 5 friends',
                  '6 questions per session',
                  'Multiple spirit types',
                  'Real-time spirit board',
                  'Turn-based questions',
                  'Session saved',
                  'No ads, pure darkness'
                ].map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity:  0, x: -20 }}
                    animate={{ opacity:  1, x: 0 }}
                    transition={{ delay:  i * 0.05 }}
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
                onClick={() => navigate('/ouija-purchase')}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6 shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:shadow-[0_0_40px_rgba(147,51,234,0.7)] transition-all"
              >
                <Ghost className="mr-2 h-5 w-5" />
                Buy 10 Tokens for $4.99
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
                onClick={() => navigate('/')}
                variant="outline"
                size="lg"
                className="w-full border-purple-600/50 text-purple-600 hover: bg-purple-600/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Darkness
              </Button>
            </div>

            <div className="text-center mt-6 pt-6 border-t border-purple-600/20">
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