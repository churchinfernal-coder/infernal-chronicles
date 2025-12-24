import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DrawnCard {
  id: string;
  name: string;
  suit: string;
  isReversed: boolean;
  position: number;
  meaning: string;
}

interface Session {
  id: string;
  spread_type: string;
  spirit_tone: string;
}

interface UserProfile {
  username: string | null;
  date_of_birth: string | null;
  location: string | null;
  zodiac_sign: string | null;
  background: string | null;
  spirit_tone_preference: string | null;
  career_focus: string | null;
  relationship_status: string | null;
}

export default function TarotReading() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [spreadType, setSpreadType] = useState<'1-card' | '3-card' | 'celtic-cross'>('1-card');
  const [spiritTone, setSpiritTone] = useState<'poetic' | 'factual' | 'chaotic' | 'silent'>('poetic');
  const [previousSessions, setPreviousSessions] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUserId(user.id);
    await checkAccess(user.id);
    await loadPreviousSessions(user.id);
    await loadUserProfile(user.id);
  };

  const loadUserProfile = async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username, date_of_birth, location, zodiac_sign, background, spirit_tone_preference, career_focus, relationship_status')
      .eq('user_id', uid)
      .single();
    
    if (data) {
      setUserProfile(data);
      if (data.spirit_tone_preference) {
        setSpiritTone(data.spirit_tone_preference as any);
      }
    }
  };

  const checkAccess = async (uid: string) => {
    const { data: keys } = await supabase
      .from('tarot_reading_keys')
      .select('*')
      .eq('user_id', uid)
      .eq('is_used', false)
      .limit(1);

    if (keys && keys.length > 0) {
      setHasAccess(true);
      return;
    }

    setHasAccess(false);
  };

  const loadPreviousSessions = async (uid: string) => {
    const { data, count } = await supabase
      .from('tarot_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', uid);
    
    setPreviousSessions(count || 0);
  };

  const validateToken = async () => {
    if (!userId || !inviteToken.trim()) {
      toast.error('Please enter a valid token');
      return;
    }

    const { data } = await supabase
      .from('tarot_reading_keys')
      .select('*')
      .eq('key_code', inviteToken)
      .eq('is_used', false)
      .maybeSingle();

    if (data) {
      await supabase
        .from('tarot_reading_keys')
        .update({ is_used: true, used_at: new Date().toISOString(), user_id: userId })
        .eq('id', data.id);
      
      setHasAccess(true);
      toast.success('Access granted! Your token has been activated.');
    } else {
      toast.error('Invalid or already used token');
    }
  };

  const startReading = async () => {
    if (!userId) return;

    // Mark the access key as used
    const { data: availableKey } = await supabase
      .from('tarot_reading_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('is_used', false)
      .limit(1)
      .maybeSingle();

    if (availableKey) {
      await supabase
        .from('tarot_reading_keys')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', availableKey.id);
    }

    const { data: newSession, error } = await supabase
      .from('tarot_sessions')
      .insert({
        user_id: userId,
        spread_type: spreadType,
        spirit_tone: spiritTone,
      })
      .select()
      .single();

    if (error || !newSession) {
      toast.error('Failed to start session');
      return;
    }

    setSession(newSession);
    await drawCards(newSession.id);
  };

  const drawCards = async (sessionId: string) => {
    if (!userId) return;
    setIsDrawing(true);

    const cardCount = spreadType === '1-card' ? 1 : spreadType === '3-card' ? 3 : 10;

    try {
      const { data: allCards } = await supabase
        .from('tarot_cards')
        .select('*');

      if (!allCards) throw new Error('No cards found');

      const { data: drawnCardIds } = await supabase
        .from('tarot_session_cards')
        .select('card_id')
        .eq('session_id', sessionId);

      const usedIds = new Set(drawnCardIds?.map(d => d.card_id) || []);
      const availableCards = allCards.filter(c => !usedIds.has(c.id));

      const shuffled = availableCards.sort(() => Math.random() - 0.5);
      const drawn = shuffled.slice(0, cardCount);

      const cardsWithPositions: DrawnCard[] = drawn.map((card, index) => ({
        id: card.id,
        name: card.name,
        suit: card.suit || '',
        isReversed: Math.random() > 0.5,
        position: index,
        meaning: Math.random() > 0.5 ? card.upright_meaning : card.reversed_meaning,
      }));

      for (const card of cardsWithPositions) {
        await supabase.from('tarot_session_cards').insert({
          session_id: sessionId,
          card_id: card.id,
        });

        await supabase.from('tarot_readings').insert({
          session_id: sessionId,
          card_id: card.id,
          position: card.position,
          is_reversed: card.isReversed,
        });
      }

      setDrawnCards(cardsWithPositions);
      await generateInterpretation(cardsWithPositions, sessionId);
    } catch (error) {
      console.error('Error drawing cards:', error);
      toast.error('Failed to draw cards');
    } finally {
      setIsDrawing(false);
    }
  };

  const generateInterpretation = async (cards: DrawnCard[], sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-tarot-interpretation', {
        body: {
          cards,
          spreadType,
          spiritTone,
          sessionCount: previousSessions,
          userProfile,
        },
      });

      if (error) throw error;

      const interpretationText = data?.interpretation || 'The spirits remain silent...';
      setInterpretation(interpretationText);

      await supabase
        .from('tarot_sessions')
        .update({ 
          completed_at: new Date().toISOString(),
          transcript: interpretationText,
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error generating interpretation:', error);
      toast.error('Failed to generate interpretation');
    }
  };

  const exportTranscript = () => {
    if (!interpretation) return;

    const transcript = `
TAROT READING TRANSCRIPT
========================
Date: ${new Date().toLocaleDateString()}
Spread: ${spreadType}
Spirit Tone: ${spiritTone}

CARDS DRAWN:
${drawnCards.map(c => `${c.position + 1}. ${c.name} (${c.suit}) ${c.isReversed ? '(Reversed)' : ''}\n   ${c.meaning}`).join('\n\n')}

INTERPRETATION:
${interpretation}
    `;

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarot-reading-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcript exported');
  };

  const resetReading = () => {
    setSession(null);
    setDrawnCards([]);
    setInterpretation('');
  };

  const getSpiritGlow = () => {
    switch (spiritTone) {
      case 'poetic': return 'hsl(280, 70%, 50%)';
      case 'factual': return 'hsl(200, 70%, 50%)';
      case 'chaotic': return 'hsl(0, 70%, 50%)';
      case 'silent': return 'hsl(0, 0%, 30%)';
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 p-8">
        <Card className="max-w-md mx-auto p-8 bg-card/80 backdrop-blur-sm border-primary/20">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("tarot.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6 text-center">
            {t("tarot.accessRequired")}
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="token">{t("tarot.enterToken")}</Label>
              <Input
                id="token"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder={t("tarot.tokenPlaceholder")}
                className="mt-2"
              />
            </div>

            <Button onClick={validateToken} className="w-full">
              {t("tarot.validateToken")}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t("tarot.purchaseKey")}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-8 relative overflow-hidden"
      style={{
        background: `radial-gradient(circle at 50% 50%, ${getSpiritGlow()}15 0%, transparent 50%), 
                     linear-gradient(to bottom, hsl(var(--background)), hsl(var(--background)/0.9))`
      }}
    >
      <div className="absolute inset-0 bg-[url('/goetia-sigils.png')] opacity-5 bg-repeat" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {t("tarot.title")}
          </h1>
          <p className="text-muted-foreground">{t("tarot.previousReadings")}: {previousSessions}</p>
        </div>

        {!session ? (
          <Card className="max-w-2xl mx-auto p-8 bg-card/80 backdrop-blur-sm border-primary/20">
            <div className="space-y-6">
              <div>
                <Label>{t("tarot.spreadType")}</Label>
                <Select value={spreadType} onValueChange={(v: any) => setSpreadType(v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    <SelectItem value="1-card">{t("tarot.spread.1card")}</SelectItem>
                    <SelectItem value="3-card">{t("tarot.spread.3card")}</SelectItem>
                    <SelectItem value="celtic-cross">{t("tarot.spread.celtic")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("tarot.spiritTone")}</Label>
                <Select value={spiritTone} onValueChange={(v: any) => setSpiritTone(v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    <SelectItem value="poetic">{t("tarot.tone.poetic")}</SelectItem>
                    <SelectItem value="factual">{t("tarot.tone.factual")}</SelectItem>
                    <SelectItem value="chaotic">{t("tarot.tone.chaotic")}</SelectItem>
                    <SelectItem value="silent">{t("tarot.tone.silent")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={startReading} className="w-full" size="lg">
                <Sparkles className="mr-2" />
                {t("tarot.beginReading")}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {drawnCards.map((card, i) => (
                <Card
                  key={i}
                  className="p-6 text-center transform hover:scale-105 transition-all duration-300 animate-fade-in bg-card/90 backdrop-blur-sm"
                  style={{
                    animationDelay: `${i * 200}ms`,
                    boxShadow: `0 0 20px ${getSpiritGlow()}40`,
                  }}
                >
                  <div className={card.isReversed ? 'rotate-180' : ''}>
                    <div className="text-4xl mb-4">🃏</div>
                  </div>
                  <h3 className="font-bold text-sm mb-2">{card.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{card.suit}</p>
                  {card.isReversed && (
                    <span className="text-xs text-destructive">{t("tarot.reversed")}</span>
                  )}
                </Card>
              ))}
            </div>

            {isDrawing && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin text-6xl">🔮</div>
                <p className="text-muted-foreground mt-4">{t("tarot.drawingCards")}</p>
              </div>
            )}

            {interpretation && (
              <Card className="p-8 bg-card/90 backdrop-blur-sm border-primary/30">
                <h2 className="text-2xl font-bold mb-4">{t("tarot.interpretation")}</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-foreground/90">{interpretation}</p>
                </div>
              </Card>
            )}

            <div className="flex gap-4 justify-center">
              <Button onClick={exportTranscript} variant="outline">
                <Download className="mr-2" />
                {t("tarot.exportTranscript")}
              </Button>
              <Button onClick={resetReading} variant="secondary">
                {t("tarot.newReading")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
