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

interface DrawnRune {
  id: string;
  name: string;
  isReversed: boolean;
  position: number;
  meaning: string;
}

interface Casting {
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

export default function RuneCasting() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [casting, setCasting] = useState<Casting | null>(null);
  const [drawnRunes, setDrawnRunes] = useState<DrawnRune[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [isCasting, setIsCasting] = useState(false);
  const [spreadType, setSpreadType] = useState<'1-rune' | '3-rune' | '9-rune'>('1-rune');
  const [spiritTone, setSpiritTone] = useState<'poetic' | 'factual' | 'chaotic' | 'silent'>('poetic');
  const [previousCastings, setPreviousCastings] = useState<number>(0);
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
    await checkAdminStatus(user.id);
    await checkAccess(user.id);
    await loadPreviousCastings(user.id);
    await loadUserProfile(user.id);
  };

  const checkAdminStatus = async (uid: string) => {
    const { data } = await supabase.rpc('has_role', {
      _user_id: uid,
      _role: 'admin'
    });
    
    if (data === true) {
      setIsAdmin(true);
      setHasAccess(true);
    }
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
    // Admin already granted access in checkAdminStatus
    if (isAdmin) return;

    // Check for regular rune casting keys
    const { data: keys } = await supabase
      .from('rune_casting_keys')
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

  const loadPreviousCastings = async (uid: string) => {
    const { data, count } = await supabase
      .from('rune_castings')
      .select('*', { count: 'exact' })
      .eq('user_id', uid);
    
    setPreviousCastings(count || 0);
  };

  const validateToken = async () => {
    if (!userId || !inviteToken.trim()) {
      toast.error(t("rune.error.invalidToken"));
      return;
    }

    // Check if it's a master key first
    if (inviteToken.startsWith('MASTER-')) {
      const { data: masterKeyResult, error } = await supabase.functions.invoke('master-key-manager', {
        body: { action: 'validate', keyCode: inviteToken },
      });

      if (!error && masterKeyResult?.valid) {
        setHasAccess(true);
        toast.success("🔑 Master Key Accepted - All Premium Services Unlocked!");
        return;
      }
    }

    // Check regular rune casting keys
    const { data } = await supabase
      .from('rune_casting_keys')
      .select('*')
      .eq('key_code', inviteToken)
      .eq('is_used', false)
      .maybeSingle();

    if (data) {
      await supabase
        .from('rune_casting_keys')
        .update({ is_used: true, used_at: new Date().toISOString(), user_id: userId })
        .eq('id', data.id);
      
      setHasAccess(true);
      toast.success(t("rune.success.accessGranted"));
    } else {
      toast.error(t("rune.error.invalidToken"));
    }
  };

  const startCasting = async () => {
    if (!userId) return;

    // Skip marking key as used if user is admin
    if (!isAdmin) {
      // Mark the access key as used (only for regular keys, not master keys)
      const { data: availableKey } = await supabase
        .from('rune_casting_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('is_used', false)
        .limit(1)
        .maybeSingle();

      if (availableKey) {
        await supabase
          .from('rune_casting_keys')
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq('id', availableKey.id);
      }
    }

    const { data: newCasting, error } = await supabase
      .from('rune_castings')
      .insert({
        user_id: userId,
        spread_type: spreadType,
        spirit_tone: spiritTone,
      })
      .select()
      .single();

    if (error || !newCasting) {
      toast.error(t("rune.error.startFailed"));
      return;
    }

    setCasting(newCasting);
    await castRunes(newCasting.id);
  };

  const castRunes = async (castingId: string) => {
    if (!userId) return;
    setIsCasting(true);

    const runeCount = spreadType === '1-rune' ? 1 : spreadType === '3-rune' ? 3 : 9;

    try {
      const { data: allRunes } = await supabase
        .from('runes')
        .select('*')
        .order('rune_order');

      if (!allRunes) throw new Error('No runes found');

      const { data: drawnRuneIds } = await supabase
        .from('rune_casting_runes')
        .select('rune_id')
        .eq('casting_id', castingId);

      const usedIds = new Set(drawnRuneIds?.map(d => d.rune_id) || []);
      const availableRunes = allRunes.filter(r => !usedIds.has(r.id));

      const shuffled = availableRunes.sort(() => Math.random() - 0.5);
      const drawn = shuffled.slice(0, runeCount);

      const runesWithPositions: DrawnRune[] = drawn.map((rune, index) => ({
        id: rune.id,
        name: rune.name,
        isReversed: Math.random() > 0.5,
        position: index,
        meaning: Math.random() > 0.5 ? rune.meaning_upright : rune.meaning_reversed,
      }));

      for (const rune of runesWithPositions) {
        await supabase.from('rune_casting_runes').insert({
          casting_id: castingId,
          rune_id: rune.id,
        });

        await supabase.from('rune_readings').insert({
          casting_id: castingId,
          rune_id: rune.id,
          position: rune.position,
          is_reversed: rune.isReversed,
        });
      }

      setDrawnRunes(runesWithPositions);
      await generateInterpretation(runesWithPositions, castingId);
    } catch (error) {
      console.error('Error casting runes:', error);
      toast.error(t("rune.error.castFailed"));
    } finally {
      setIsCasting(false);
    }
  };

  const generateInterpretation = async (runes: DrawnRune[], castingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-rune-interpretation', {
        body: {
          runes,
          spreadType,
          spiritTone,
          castingCount: previousCastings,
          userProfile,
        },
      });

      if (error) throw error;

      const interpretationText = data?.interpretation || 'The runes remain silent...';
      setInterpretation(interpretationText);

      await supabase
        .from('rune_castings')
        .update({ 
          completed_at: new Date().toISOString(),
          transcript: interpretationText,
        })
        .eq('id', castingId);
    } catch (error) {
      console.error('Error generating interpretation:', error);
      toast.error(t("rune.error.interpretFailed"));
    }
  };

  const exportTranscript = () => {
    if (!interpretation) return;

    const transcript = `
RUNE CASTING TRANSCRIPT
========================
Date: ${new Date().toLocaleDateString()}
Spread: ${spreadType}
Spirit Tone: ${spiritTone}

RUNES CAST:
${drawnRunes.map(r => `${r.position + 1}. ${r.name} ${r.isReversed ? '(Reversed)' : '(Upright)'}\n   ${r.meaning}`).join('\n\n')}

INTERPRETATION:
${interpretation}
    `;

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rune-casting-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("rune.success.exported"));
  };

  const resetCasting = () => {
    setCasting(null);
    setDrawnRunes([]);
    setInterpretation('');
  };

  const getSpiritGlow = () => {
    switch (spiritTone) {
      case 'poetic': return 'hsl(210, 70%, 50%)';
      case 'factual': return 'hsl(140, 70%, 50%)';
      case 'chaotic': return 'hsl(350, 70%, 50%)';
      case 'silent': return 'hsl(0, 0%, 40%)';
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90 p-8">
        <Card className="max-w-md mx-auto p-8 bg-card/80 backdrop-blur-sm border-primary/20">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("rune.title")}
          </h1>
          
          <p className="text-muted-foreground mb-6 text-center">
            {t("rune.accessRequired")}
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="token">{t("rune.enterToken")}</Label>
              <Input
                id="token"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder={t("rune.tokenPlaceholder")}
                className="mt-2"
              />
            </div>

            <Button onClick={validateToken} className="w-full">
              {t("rune.validateToken")}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t("rune.purchaseKey")}
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
            {t("rune.title")}
          </h1>
          <p className="text-muted-foreground">{t("rune.previousCastings")}: {previousCastings}</p>
        </div>

        {!casting ? (
          <Card className="max-w-2xl mx-auto p-8 bg-card/80 backdrop-blur-sm border-primary/20">
            <div className="space-y-6">
              <div>
                <Label>{t("rune.spreadType")}</Label>
                <Select value={spreadType} onValueChange={(v: any) => setSpreadType(v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    <SelectItem value="1-rune">{t("rune.spread.1rune")}</SelectItem>
                    <SelectItem value="3-rune">{t("rune.spread.3rune")}</SelectItem>
                    <SelectItem value="9-rune">{t("rune.spread.9rune")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("rune.spiritTone")}</Label>
                <Select value={spiritTone} onValueChange={(v: any) => setSpiritTone(v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    <SelectItem value="poetic">{t("rune.tone.poetic")}</SelectItem>
                    <SelectItem value="factual">{t("rune.tone.factual")}</SelectItem>
                    <SelectItem value="chaotic">{t("rune.tone.chaotic")}</SelectItem>
                    <SelectItem value="silent">{t("rune.tone.silent")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={startCasting} className="w-full" size="lg">
                <Sparkles className="mr-2" />
                {t("rune.beginCasting")}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className={`grid gap-4 ${spreadType === '9-rune' ? 'grid-cols-3' : spreadType === '3-rune' ? 'grid-cols-3' : 'grid-cols-1'} max-w-3xl mx-auto`}>
              {drawnRunes.map((rune, i) => (
                <Card
                  key={i}
                  className="p-6 text-center transform hover:scale-105 transition-all duration-300 animate-fade-in bg-card/90 backdrop-blur-sm"
                  style={{
                    animationDelay: `${i * 200}ms`,
                    boxShadow: `0 0 20px ${getSpiritGlow()}40`,
                  }}
                >
                  <div className={rune.isReversed ? 'rotate-180' : ''}>
                    <div className="text-5xl mb-4 font-serif">ᚠ</div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{rune.name}</h3>
                  {rune.isReversed && (
                    <span className="text-xs text-destructive">{t("rune.reversed")}</span>
                  )}
                </Card>
              ))}
            </div>

            {isCasting && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin text-6xl">🔮</div>
                <p className="text-muted-foreground mt-4">{t("rune.castingRunes")}</p>
              </div>
            )}

            {interpretation && (
              <Card className="p-8 bg-card/90 backdrop-blur-sm border-primary/30">
                <h2 className="text-2xl font-bold mb-4">{t("rune.interpretation")}</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-foreground/90">{interpretation}</p>
                </div>
              </Card>
            )}

            <div className="flex gap-4 justify-center">
              <Button onClick={exportTranscript} variant="outline">
                <Download className="mr-2" />
                {t("rune.exportTranscript")}
              </Button>
              <Button onClick={resetCasting} variant="secondary">
                {t("rune.newCasting")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
