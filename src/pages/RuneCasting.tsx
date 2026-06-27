import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Download, Lock, Crown, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== TYPES ====================
interface DrawnRune {
  id:  string;
  name: string;
  symbol: string;
  isReversed: boolean;
  position: number;
  meaning: string;
}

interface RuneProfile {
  rune_credits: number;
  is_premium: boolean;
}

type SpreadType = '1-rune' | '3-rune' | '9-rune';
type SpiritTone = 'poetic' | 'factual' | 'chaotic' | 'silent';

// ==================== FALLBACK INTERPRETATIONS ====================
const FALLBACK_INTERPRETATIONS:  Record<SpiritTone, string[]> = {
  poetic: [
    'The runes whisper ancient wisdom through the veil of time.. .',
    'The threads of fate weave patterns only the runes can read...',
    'In the silence between worlds, the runes speak their truth...',
  ],
  factual: [
    'Based on the runes drawn, the reading suggests a period of transition.',
    'The runes indicate a need for careful consideration before moving forward.',
    'This casting reveals themes of balance and harmony in your situation.',
  ],
  chaotic: [
    'CHAOS!  The runes dance in madness, revealing EVERYTHING AND NOTHING!',
    'The runes spin wildly - order breaks, reality bends, all is POSSIBLE!',
    'Entropy rules!  The runes mock order - embrace the glorious DISORDER!',
  ],
  silent: [
    '.. .',
    'The runes are silent.',
    'No words.  Only the void.',
  ],
};

// ==================== PAYWALL COMPONENT ====================
const RunePaywall = ({ onUpgrade }: { onUpgrade:  () => void }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
        <Card className="bg-gradient-to-br from-gray-950 to-purple-950/50 border-2 border-purple-600/50 shadow-2xl shadow-purple-600/30">
          <div className="p-8 text-center">
            <Lock className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
            
            <h2 className="text-4xl font-gothic text-purple-600 mb-3">
              No Castings Remaining
            </h2>
            
            <p className="text-gray-400 mb-6">
              The runes require tribute to reveal their secrets
            </p>

            <div className="bg-purple-950/30 border border-purple-600/30 rounded-lg p-6 mb-6">
              <p className="text-5xl font-bold text-purple-500 mb-2">$9.99</p>
              <p className="text-2xl font-bold text-purple-400 mb-1">13 Castings</p>
              <p className="text-sm text-gray-400">Only $0.77 per casting</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={onUpgrade}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 shadow-[0_0_30px_rgba(147,51,234,0.6)]"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Purchase Castings
              </Button>

              <Button
                onClick={() => navigate('/premium')}
                variant="outline"
                size="lg"
                className="w-full border-yellow-600/50 text-yellow-600 hover:bg-yellow-600/10"
              >
                <Crown className="mr-2 h-5 w-5" />
                Get Unlimited Premium
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="lg"
                className="w-full text-gray-400 hover:text-purple-600"
              >
                Return to Sanctuary
              </Button>
            </div>

            <p className="text-gray-500 text-sm mt-6">
              ✓ Secure payment • ✓ Instant access • ✓ No subscription
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function RuneCasting() {
  const navigate = useNavigate();

  // Credits & Premium State
  const [credits, setCredits] = useState<number>(0);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  // Casting State
  const [drawnRunes, setDrawnRunes] = useState<DrawnRune[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [isCasting, setIsCasting] = useState(false);

  // Configuration
  const [spreadType, setSpreadType] = useState<SpreadType>('1-rune');
  const [spiritTone, setSpiritTone] = useState<SpiritTone>('poetic');
  const [showCreditWarning, setShowCreditWarning] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, []);

  useEffect(() => {
    if (credits <= 3 && credits > 0) {
      setShowCreditWarning(true);
    }
  }, [credits]);

  const fetchCredits = async () => {
    try {
      const { data: { user }, error:  userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        navigate('/auth');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('rune_credits, is_premium')
        .eq('user_id', user.id)
        .single<RuneProfile>();

      if (profileError || !profile) {
        console.error('Error fetching credits:', profileError);
        setCredits(0);
        setShowPaywall(true);
      } else {
        const userCredits = profile.rune_credits ??  0;
        const userPremium = profile.is_premium ?? false;
        
        setCredits(userCredits);
        setIsPremium(userPremium);
        
        if (userCredits === 0 && ! userPremium) {
          setShowPaywall(true);
        }
      }
    } catch (error) {
      console.error('Fetch credits error:', error);
      setCredits(0);
      setShowPaywall(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCastRunes = async () => {
    try {
      const { data: { user }, error:  userError } = await supabase.auth.getUser();
      
      if (userError || ! user) {
        toast.error('Please log in to continue', { icon: '⚠️' });
        navigate('/auth');
        return;
      }

      // Use credit via RPC
      const { data: creditUsed, error: creditError } = await (supabase as any).rpc('use_rune_credit', {
        p_user_id: user.id,
        p_spread_type: spreadType
      });

      if (creditError) {
        console.error('Credit usage error:', creditError);
        toast.error('Failed to use credit.  Please try again.', { icon: '❌' });
        return;
      }

      if (! creditUsed) {
        toast.error('No credits remaining!  Purchase more to continue.', { 
          icon: '💳',
          duration: 5000
        });
        setShowPaywall(true);
        return;
      }

      await fetchCredits();
      await performCasting();

    } catch (error) {
      console.error('Casting error:', error);
      toast.error('An error occurred.  Please try again.', { icon: '❌' });
    }
  };

  const performCasting = async () => {
    setIsCasting(true);

    const runeCount = spreadType === '1-rune' ? 1 : spreadType === '3-rune' ? 3 : 9;

    try {
      const { data: allRunes, error: runesError } = await supabase
        .from('runes')
        .select('*')
        .order('rune_order');

      if (runesError || !allRunes || allRunes.length === 0) {
        throw new Error('No runes found in database');
      }

      const shuffled = [...allRunes].sort(() => Math.random() - 0.5);
      const drawn = shuffled.slice(0, runeCount);

      const runesWithPositions:  DrawnRune[] = drawn.map((rune: any, index: number) => {
        const isReversed = Math.random() > 0.5;
        return {
          id: rune.id,
          name: rune.name,
          symbol: rune.symbol || 'ᚠ',
          isReversed,
          position: index,
          meaning: isReversed ? (rune.meaning_reversed || rune.meaning_upright) : rune.meaning_upright,
        };
      });

      setDrawnRunes(runesWithPositions);

      // Generate interpretation
      const fallbacks = FALLBACK_INTERPRETATIONS[spiritTone];
      const interpretationText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      
      setTimeout(() => {
        setInterpretation(interpretationText);
        setIsCasting(false);
        
        const newCredits = credits - 1;
        toast.success(`Runes cast! ${newCredits} ${newCredits === 1 ? 'casting' : 'castings'} remaining`, { 
          icon: 'ᚠ',
          duration:  3000 
        });
      }, 2000);

    } catch (error) {
      console.error('Casting error:', error);
      toast.error('Failed to cast runes', { icon: '❌' });
      setIsCasting(false);
    }
  };

  const resetCasting = () => {
    setDrawnRunes([]);
    setInterpretation('');
  };

  const exportTranscript = () => {
    if (!interpretation) {
      toast.error('No interpretation to export');
      return;
    }

    const transcript = `
RUNE CASTING TRANSCRIPT
========================
Date: ${new Date().toLocaleDateString()}
Spread:  ${spreadType}
Spirit Tone: ${spiritTone}

RUNES CAST:
${drawnRunes. map((r) => `${r.position + 1}. ${r.name} ${r.isReversed ? '(Reversed)' : '(Upright)'}\n   ${r.meaning}`).join('\n\n')}

INTERPRETATION:
${interpretation}
    `;

    const blob = new Blob([transcript], { type:  'text/plain' });
    const url = URL. createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rune-casting-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcript exported!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">ᚠ</div>
          <p className="text-gray-400 text-lg">Loading Rune Chamber...</p>
        </div>
      </div>
    );
  }

  if (showPaywall) {
    return <RunePaywall onUpgrade={() => navigate('/rune-purchase')} />;
  }

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950 overflow-hidden pb-20">
      <div className="absolute inset-0 bg-black/40" />

      {/* Credit Display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <Badge className={`text-white text-sm px-4 py-2 shadow-lg ${credits <= 3 ? 'bg-orange-600 animate-pulse' : 'bg-purple-600'}`}>
          ᚠ {credits} {credits === 1 ? 'Casting' : 'Castings'} Remaining
        </Badge>
      </div>

      {/* Low Credit Warning */}
      {showCreditWarning && credits <= 3 && credits > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity:  1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-orange-600 text-white px-6 py-3 rounded-lg shadow-2xl"
        >
          ⚠️ Only {credits} castings left! 
          <button 
            onClick={() => navigate('/rune-purchase')}
            className="ml-4 underline font-bold"
          >
            Get More
          </button>
        </motion.div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 pt-20">
        <motion. div initial={{ opacity: 0, y:  -50 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-gothic text-purple-600 mb-2 drop-shadow-[0_0_15px_rgba(147,51,234,0.9)]">
            The Rune Chamber
          </h1>
          <p className="text-gray-400 text-lg px-4">
            Cast the ancient runes and divine your path
          </p>
        </motion.div>

        {drawnRunes.length === 0 && ! isCasting ?  (
          <Card className="max-w-2xl mx-auto p-8 bg-black/80 backdrop-blur-sm border-2 border-purple-600/50">
            <div className="space-y-6">
              <div>
                <Label>Spread Type</Label>
                <Select value={spreadType} onValueChange={(v:  SpreadType) => setSpreadType(v)}>
                  <SelectTrigger className="mt-2 bg-card/90 border-purple-600/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 border-purple-600/30">
                    <SelectItem value="1-rune">Single Rune</SelectItem>
                    <SelectItem value="3-rune">Three Rune Spread</SelectItem>
                    <SelectItem value="9-rune" disabled={! isPremium}>
                      <div className="flex items-center gap-2">
                        {! isPremium && <Lock className="w-3 h-3" />}
                        Nine Rune Elder Futhark
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Spirit Tone</Label>
                <Select value={spiritTone} onValueChange={(v: SpiritTone) => setSpiritTone(v)}>
                  <SelectTrigger className="mt-2 bg-card/90 border-purple-600/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card/95 border-purple-600/30">
                    <SelectItem value="poetic">Poetic - Mystical & Metaphorical</SelectItem>
                    <SelectItem value="factual">Factual - Direct & Clear</SelectItem>
                    <SelectItem value="chaotic">Chaotic - Unpredictable & Wild</SelectItem>
                    <SelectItem value="silent">Silent - Minimal & Meditative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCastRunes} className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                <Sparkles className="mr-2" />
                Begin Casting
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-8 w-full max-w-6xl">
            {isCasting ?  (
              <div className="text-center py-12">
                <div className="inline-block animate-spin text-6xl mb-4">ᚠ</div>
                <p className="text-gray-400">Casting runes...</p>
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${spreadType === '9-rune' ? 'grid-cols-3' : spreadType === '3-rune' ? 'grid-cols-3' : 'grid-cols-1'} max-w-4xl mx-auto`}>
                  {drawnRunes.map((rune, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity:  0, scale: 0 }}
                      animate={{ opacity:  1, scale: 1 }}
                      transition={{ delay:  i * 0.2 }}
                    >
                      <Card className="p-8 text-center bg-black/80 backdrop-blur border-2 border-purple-600/50 shadow-[0_0_20px_rgba(147,51,234,0.4)]">
                        <div className={rune.isReversed ? 'rotate-180' : ''}>
                          <div className="text-6xl mb-4">{rune.symbol}</div>
                        </div>
                        <h3 className="font-bold text-xl text-purple-400 mb-2">{rune.name}</h3>
                        {rune.isReversed && <span className="text-xs text-red-400">Reversed</span>}
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {interpretation && (
                  <Card className="p-8 bg-black/90 backdrop-blur border-2 border-purple-600/50">
                    <h2 className="text-3xl font-bold text-purple-500 mb-4">Interpretation</h2>
                    <p className="text-gray-300 text-lg whitespace-pre-wrap">{interpretation}</p>
                  </Card>
                )}

                <div className="flex gap-4 justify-center">
                  <Button onClick={exportTranscript} variant="outline" className="border-purple-600/50 text-purple-600">
                    <Download className="mr-2" />
                    Export Transcript
                  </Button>
                  <Button onClick={resetCasting} className="bg-purple-600 hover:bg-purple-700">
                    <RotateCcw className="mr-2" />
                    New Casting
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}