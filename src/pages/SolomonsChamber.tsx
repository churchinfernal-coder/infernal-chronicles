import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GOETIA_DEMONS } from "@/data/goetia";
import { GoetiaSignil } from "@/components/GoetiaSignil";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { X, Lock, Unlock, Crown, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SolomonsChamber() {
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string>("");
  const [selectedDemon, setSelectedDemon] = useState<number | null>(null);
  const [currentSigil, setCurrentSigil] = useState<string | null>(null);
  const [portalOpen, setPortalOpen] = useState(false);
  const [chamberActive, setChamberActive] = useState(false);
  const [hoveredDemon, setHoveredDemon] = useState<number | null>(null);
  const [rankFilter, setRankFilter] = useState<string>("All");
  const [domainFilter, setDomainFilter] = useState<string>("All");
  const [summoning, setSummoning] = useState(false);
  const [lockedContent, setLockedContent] = useState<any[]>([]);
  const [unlockedContent, setUnlockedContent] = useState<Set<string>>(new Set());
  const [primeLevel, setPrimeLevel] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchLockedContent();
    setTimeout(() => setPortalOpen(true), 100);
    setTimeout(() => setChamberActive(true), 800);
  }, []);

  const inferDomain = (desc: string): string => {
    const d = desc.toLowerCase();
    if (/(love|lust|reconciles?)/.test(d)) return "lust";
    if (/(war|battle|storm|wind|drown)/.test(d)) return "war";
    if (/(teach|science|astronom|philosophy|languages|logic|ethics)/.test(d)) return "knowledge";
    if (/(treasure|gold|riches|wealth)/.test(d)) return "wealth";
    if (/(heal|disease|herbs)/.test(d)) return "healing";
    if (/(necromancy|souls)/.test(d)) return "necromancy";
    if (/(transform|invisib)/.test(d)) return "transformation";
    if (/(arts|poetry|music|rhetoric)/.test(d)) return "arts";
    if (/(water|sea|ocean)/.test(d)) return "water";
    return "mystery";
  };

  const domainOptions = Array.from(new Set(GOETIA_DEMONS.map(d => inferDomain(d. description))));

  const filteredDemons = GOETIA_DEMONS.filter(d =>
    (rankFilter === "All" || d.rank === rankFilter) &&
    (domainFilter === "All" || inferDomain(d.description) === domainFilter)
  );

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth. getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);

    const { data } = await (supabase as any)
      .from("profiles")
      .select("selected_goetia_sigil, prime_level")
      . eq("user_id", user. id)
      .single();
    
    if (data?. selected_goetia_sigil) {
      const demonNumber = parseInt(data.selected_goetia_sigil.split("-")[1]);
      setCurrentSigil(data.selected_goetia_sigil);
      setSelectedDemon(demonNumber);
    }
    
    setPrimeLevel(data?.prime_level || 0);

    const { data: unlocked } = await (supabase as any)
      .from("user_unlocked_content")
      .select("content_id")
      . eq("user_id", user. id);
    
    if (unlocked) {
      setUnlockedContent(new Set(unlocked. map((u: any) => u.content_id)));
    }
  };

  const fetchLockedContent = async () => {
    const { data } = await (supabase as any)
      .from("locked_content")
      .select("*")
      .order("required_prime_level", { ascending: true });
    
    if (data) {
      setLockedContent(data);
    }
  };

  const unlockContent = async (contentId: string, requiredPrimeLevel: number) => {
    if (!userId) return;

    if (primeLevel < requiredPrimeLevel) {
      toast. error(`${t("solomon.toast.requiresLevel")} ${requiredPrimeLevel}`, {
        description: `${t("solomon.toast.currentLevel")}: ${primeLevel}`
      });
      return;
    }

    const { error } = await (supabase as any)
      .from("user_unlocked_content")
      .insert({ user_id: userId, content_id: contentId });

    if (error) {
      toast.error(t("solomon.toast.unlockFailed"));
      return;
    }

    setUnlockedContent(prev => new Set([...prev, contentId]));
    toast.success(t("solomon.toast.unlockSuccess"), {
      description: t("solomon. toast.unlockDesc")
    });
  };

  const selectDemon = async (demonNumber: number) => {
    if (!userId) return;

    const demon = GOETIA_DEMONS[demonNumber - 1];
    const sigilId = `goetia-${demonNumber}`;
    
    setSummoning(true);
    setTimeout(() => setSummoning(false), 900);

    playAmbientSound(demon.rank);
    
    setSelectedDemon(demonNumber);

    const { error } = await (supabase as any)
      .from("profiles")
      .update({ selected_goetia_sigil: sigilId })
      .eq("user_id", userId);

    if (error) {
      toast.error(t("solomon.toast.failed"));
      return;
    }

    await awardBadge(demon.rank);

    if (! currentSigil) {
      await awardFirstSummonerBadge();
    }

    setCurrentSigil(sigilId);
    toast.success(`${demon.name} ${t("solomon.toast.bound")}`, {
      description: `${demon.rank} of ${demon.description. split(". ")[0]}`
    });
  };

  const playAmbientSound = (rank: string) => {
    const AC = new (window. AudioContext || (window as any).webkitAudioContext)();

    const master = AC.createGain();
    master.gain. value = 0.15;
    master.connect(AC.destination);

    const noiseBuffer = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const makeNoise = (type: 'wind' | 'whisper') => {
      const src = AC.createBufferSource();
      src.buffer = noiseBuffer;
      const biquad = AC.createBiquadFilter();
      if (type === 'wind') {
        biquad.type = 'lowpass';
        biquad. frequency.value = 800;
      } else {
        biquad.type = 'bandpass';
        biquad. frequency.value = 2000;
        biquad. Q.value = 0.8;
      }
      const gain = AC.createGain();
      gain.gain.setValueAtTime(0.08, AC.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, AC.currentTime + 1.2);
      src.connect(biquad);
      biquad.connect(gain);
      gain.connect(master);
      src.start();
      src.stop(AC.currentTime + 1.25);
    };

    const chains = () => {
      const osc = AC.createOscillator();
      osc.type = 'square';
      osc.frequency. setValueAtTime(900, AC.currentTime);
      const gain = AC.createGain();
      gain.gain.setValueAtTime(0.06, AC.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.003, AC.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(AC.currentTime + 0.65);
    };

    switch (rank) {
      case 'King':
        makeNoise('wind'); chains(); break;
      case 'Duke':
        chains(); break;
      case 'Prince':
        makeNoise('whisper'); break;
      case 'Marquis':
        makeNoise('wind'); break;
      case 'President':
        makeNoise('whisper'); chains(); break;
      default:
        makeNoise('wind');
    }
  };

  const awardBadge = async (rank: string) => {
    try {
      const { data: badges } = await (supabase as any)
        .from("activity_badges")
        .select("id")
        .limit(1);

      const badge = badges?. find((b: any) => {
        try {
          const criteria = b.criteria as any;
          return criteria?. rank === rank;
        } catch {
          return false;
        }
      });

      if (badge) {
        await (supabase as any)
          .from("user_activity_badges")
          . insert({ user_id: userId, badge_id: badge.id })
          . select();
      }
    } catch (err) {
      console.error("Badge award error:", err);
    }
  };

  const awardFirstSummonerBadge = async () => {
    try {
      const { data: badge, error } = await (supabase as any)
        .from("activity_badges")
        .select("id")
        .eq("name", "First Summoner")
        .limit(1)
        .maybeSingle();

      if (! error && badge) {
        await (supabase as any)
          .from("user_activity_badges")
          .insert({ user_id: userId, badge_id: badge.id })
          . select();
      }
    } catch (err) {
      console.error("Badge award error:", err);
    }
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      King: "bg-red-900/30 text-red-400 border-red-600/50 shadow-[0_0_15px_rgba(220,20,60,0.4)]",
      Duke: "bg-purple-900/30 text-purple-400 border-purple-600/50 shadow-[0_0_15px_rgba(147,51,234,0.4)]",
      Prince: "bg-blue-900/30 text-blue-400 border-blue-600/50 shadow-[0_0_15px_rgba(59,130,246,0.4)]",
      Marquis: "bg-orange-900/30 text-orange-400 border-orange-600/50 shadow-[0_0_15px_rgba(249,115,22,0.4)]",
      President: "bg-green-900/30 text-green-400 border-green-600/50 shadow-[0_0_15px_rgba(34,197,94,0.4)]",
      Earl: "bg-yellow-900/30 text-yellow-400 border-yellow-600/50 shadow-[0_0_15px_rgba(234,179,8,0.4)]",
      Knight: "bg-cyan-900/30 text-cyan-400 border-cyan-600/50 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
    };
    return colors[rank] || colors.King;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] overflow-hidden pb-20 px-4 md:ml-64 lg:ml-72">
      <div className={cn(
        "fixed inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 z-0",
        portalOpen ? "opacity-0" : "opacity-100"
      )}>
        <div className="relative w-64 h-64 animate-spin-slow">
          <svg viewBox="0 0 200 200" className="w-full h-full text-[hsl(var(--primary))] drop-shadow-[0_0_30px_hsl(var(--primary))]">
            <path d="M100 20 L100 180 M20 100 L180 100" stroke="currentColor" strokeWidth="4" />
            <circle cx="100" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M85 160 L100 180 L115 160" stroke="currentColor" strokeWidth="4" fill="none" />
          </svg>
        </div>
      </div>

      <div className={cn(
        "max-w-7xl mx-auto py-6 md:py-8 transition-all duration-1000 relative z-10",
        chamberActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}>
        <div className="text-center mb-8 md:mb-12 relative">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/profile")}
            className="absolute left-0 top-0"
          >
            <X className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl md:text-5xl font-serif text-[hsl(var(--primary))] mb-3 animate-sigil-glow">
            {t("solomon.title")}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            {t("solomon.subtitle")}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Crown className="h-5 w-5 text-[hsl(var(--primary))]" />
            <span className="text-[hsl(var(--primary))] font-semibold">{t("solomon. primeLevel")}: {primeLevel}</span>
          </div>
        </div>

        <Tabs defaultValue="sigils" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 md:mb-8">
            <TabsTrigger value="sigils">{t("solomon.goetiaTab")}</TabsTrigger>
            <TabsTrigger value="locked">{t("solomon.lockedTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="sigils" className="space-y-6 md:space-y-8">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                <svg viewBox="0 0 300 300" className="w-full max-w-2xl md:max-w-4xl h-auto animate-torch-flicker">
                  <path 
                    d="M150 50 L175 125 L250 125 L190 170 L215 245 L150 200 L85 245 L110 170 L50 125 L125 125 Z" 
                    fill="none" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="3"
                  />
                  <circle cx="150" cy="150" r="130" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                </svg>
              </div>

              <div className="relative grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 md:gap-6 lg:gap-8 p-4 md:p-8 lg:p-12">
                {filteredDemons.map((demon) => (
                  <button
                    key={demon.number}
                    onMouseEnter={() => setHoveredDemon(demon. number)}
                    onMouseLeave={() => setHoveredDemon(null)}
                    onClick={() => selectDemon(demon. number)}
                    className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-1 md:p-2"
                  >
                    <GoetiaSignil
                      demonNumber={demon.number}
                      demonName={demon.name}
                      isSelected={selectedDemon === demon.number}
                      isActive={hoveredDemon === demon. number}
                    />
                  </button>
                ))}
              </div>
            </div>

            {selectedDemon && (
              <Card className={cn(
                "max-w-3xl mx-auto p-4 md:p-8 bg-linear-to-br from-background via-background to-red-950/10 border-red-900/30",
                "animate-fade-in shadow-[0_0_50px_rgba(220,20,60,0.3)]"
              )}>
                <div className="text-center space-y-4 md:space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <GoetiaSignil
                      demonNumber={selectedDemon}
                      demonName={GOETIA_DEMONS[selectedDemon - 1].name}
                      isSelected={true}
                      className="scale-125 md:scale-150"
                    />
                    
                    <div className="space-y-2 mt-4 md:mt-8">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3">
                        <h2 className="text-2xl md:text-4xl font-serif text-red-600 drop-shadow-[0_0_10px_rgba(220,20,60,0.8)]">
                          {GOETIA_DEMONS[selectedDemon - 1].name}
                        </h2>
                        <Badge className={cn(getRankColor(GOETIA_DEMONS[selectedDemon - 1].rank), "text-sm md:text-base px-3 md:px-4 py-1")}>
                          {GOETIA_DEMONS[selectedDemon - 1].rank}
                        </Badge>
                      </div>
                      <p className="text-base md:text-xl text-red-500/80 font-serif">
                        {t("solomon.spiritNumber")}{selectedDemon} {t("solomon.ofGoetia")}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-base md:text-lg text-foreground/90 leading-relaxed max-w-xl mx-auto">
                    {t(`demon.${selectedDemon}`)}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="locked" className="space-y-6">
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lockedContent.map((content) => {
                const isUnlocked = unlockedContent.has(content.id);
                const canUnlock = primeLevel >= content.required_prime_level;

                return (
                  <Card 
                    key={content.id}
                    className={cn(
                      "relative overflow-hidden",
                      isUnlocked && "border-[hsl(var(--primary))] shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                          {isUnlocked ? (
                            <Unlock className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--primary))]" />
                          ) : (
                            <Lock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                          )}
                          <span className="line-clamp-1">{content.title}</span>
                        </CardTitle>
                        <Badge variant={canUnlock ? "default" : "secondary"} className="text-xs shrink-0">
                          <Crown className="h-3 w-3 mr-1" />
                          {content.required_prime_level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {isUnlocked ? content.description : content.preview_data?. preview || t("solomon.lockedContent")}
                      </p>
                      
                      {isUnlocked ?  (
                        <div className="p-3 md:p-4 bg-[hsl(var(--primary))]/10 rounded-lg border border-[hsl(var(--primary))]/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="h-4 w-4 text-[hsl(var(--primary))]" />
                            <span className="text-sm font-semibold text-[hsl(var(--primary))]">{t("solomon.unlocked")}</span>
                          </div>
                          {content.content_data?.text && (
                            <p className="text-sm">{content.content_data. text}</p>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={() => unlockContent(content.id, content.required_prime_level)}
                          disabled={!canUnlock}
                          className="w-full text-sm"
                          size="sm"
                          variant={canUnlock ? "default" : "secondary"}
                        >
                          {canUnlock ? t("solomon.unlockContent") : `${t("solomon.toast.requiresLevel")} ${content.required_prime_level}`}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {lockedContent.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Lock className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm md:text-base text-muted-foreground">No locked content available yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}