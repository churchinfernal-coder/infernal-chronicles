import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Planchette } from "./Planchette";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, Lock, Scroll } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OuijaBoardProps {
  room: any;
  participants: any[];
  currentUserId: string;
  onExit: () => void;
  onRoomUpdate: (room: any) => void;
  onParticipantsUpdate: (participants: any[]) => void;
}

// Premium features configuration
const PREMIUM_FEATURES:  Record<string, { name: string; description: string; price: number; stripeProductId: string }> = {
  unlimited_questions: {
    name: "Unlimited Questions",
    description: "Ask unlimited questions instead of 6",
    price: 4.99,
    stripeProductId: "prod_unlimited_questions"
  },
  spirit_customization: {
    name: "Custom Spirit",
    description: "Summon a unique personalized spirit",
    price: 2.99,
    stripeProductId: "prod_spirit_customization"
  },
  session_recording: {
    name:  "Session Recording",
    description:  "Record and replay your ouija sessions",
    price: 3.99,
    stripeProductId: "prod_session_recording"
  },
  spirit_insights: {
    name: "Spirit Insights",
    description: "Get detailed analysis of spirit messages",
    price: 1.99,
    stripeProductId: "prod_spirit_insights"
  }
};

// Dynamic metaphor generation engine
const generateDynamicMetaphor = (question: string, spiritType: string): string => {
  const lowerQ = question.toLowerCase();
  
  // Extract key themes from question
  const themes = {
    love: lowerQ.includes('love') || lowerQ.includes('heart') || lowerQ.includes('relationship'),
    money: lowerQ.includes('money') || lowerQ.includes('wealth') || lowerQ.includes('rich') || lowerQ.includes('financial'),
    death: lowerQ.includes('death') || lowerQ.includes('die') || lowerQ.includes('end'),
    future: lowerQ.includes('future') || lowerQ.includes('tomorrow') || lowerQ.includes('will'),
    past: lowerQ. includes('past') || lowerQ.includes('before') || lowerQ.includes('was'),
    truth: lowerQ.includes('truth') || lowerQ.includes('real') || lowerQ.includes('honest'),
    fear: lowerQ.includes('fear') || lowerQ.includes('afraid') || lowerQ.includes('scared'),
    success: lowerQ.includes('success') || lowerQ.includes('achieve') || lowerQ.includes('win'),
    change: lowerQ. includes('change') || lowerQ.includes('transform') || lowerQ.includes('different'),
    purpose: lowerQ.includes('why') || lowerQ.includes('purpose') || lowerQ.includes('meaning'),
  };

  // Metaphor component libraries
  const naturalElements = [
    'the river', 'the mountain', 'the ocean', 'the forest', 'the storm', 'the desert',
    'the wind', 'the flame', 'the ice', 'the thunder', 'the lightning', 'the fog',
    'the eclipse', 'the comet', 'the earthquake', 'the avalanche', 'the tide', 'the volcano'
  ];

  const mysticalSymbols = [
    'the serpent', 'the phoenix', 'the raven', 'the wolf', 'the dragon', 'the spider',
    'the butterfly', 'the owl', 'the moth', 'the crow', 'the cat', 'the fox'
  ];

  const abstractConcepts = [
    'shadow and light', 'chaos and order', 'beginning and end', 'void and form',
    'silence and sound', 'stillness and motion', 'memory and forgetting', 'truth and illusion'
  ];

  const actions = [
    'whispers', 'screams', 'dances', 'burns', 'freezes', 'transforms', 'shatters',
    'dissolves', 'awakens', 'sleeps', 'hunts', 'hides', 'reveals', 'conceals'
  ];

  const outcomes = [
    'yet the path remains hidden', 'but clarity comes with dawn', 'though shadows linger',
    'and the answer unfolds slowly', 'while time bends backward', 'as fate weaves its tapestry',
    'until the veil lifts', 'when the circle completes', 'before the threshold opens'
  ];

  // Spirit-specific response generators
  const generators = {
    the_whisperer: () => {
      const element = naturalElements[Math.floor(Math.random() * naturalElements.length)];
      const symbol = mysticalSymbols[Math.floor(Math.random() * mysticalSymbols.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

      if (themes. love) {
        return `Through the mist I see ${element} merging with ${symbol}—two forces becoming one, ${action} in eternal union, ${outcome}... `;
      } else if (themes.money) {
        return `${element. charAt(0).toUpperCase() + element.slice(1)} ${action} where coins fall—abundance is not gathered, but recognized, ${outcome}...`;
      } else if (themes.death) {
        return `${symbol.charAt(0).toUpperCase() + symbol.slice(1)} ${action} at life's edge—endings are doorways dressed as walls, ${outcome}... `;
      } else if (themes.future) {
        return `I peer through time's fabric where ${element} ${action}—tomorrow exists now, waiting to be noticed, ${outcome}...`;
      } else if (themes.fear) {
        return `${symbol.charAt(0).toUpperCase() + symbol.slice(1)} stalks ${element}—fear is wisdom wearing a terrible mask, ${outcome}...`;
      } else {
        return `In shadows between worlds, ${element} ${action} with ${symbol}—your answer lives there, ${outcome}...`;
      }
    },

    the_archivist: () => {
      const concept = abstractConcepts[Math. floor(Math.random() * abstractConcepts.length)];
      const element = naturalElements[Math.floor(Math.random() * naturalElements.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];

      if (themes.past) {
        return `The scrolls of ${concept} record this:  what was ${action} cannot un-${action}—history is the ink, you are the page, ${element} holds the lesson... `;
      } else if (themes.truth) {
        return `Ancient texts speak of ${concept}—truth ${action} away all falseness like ${element} eroding stone, leaving only essence...`;
      } else if (themes.purpose) {
        return `In volumes spanning eons, ${concept} ${action}—the why is written in the how, ${element} demonstrates this eternally...`;
      } else if (themes.success) {
        return `Records show ${element} ${action} through ${concept}—victory is measured not in gain, but in transformation...`;
      } else if (themes.change) {
        return `The archives reveal ${concept} ${action} like ${element}—change is the only constant, resistance is the only variable...`;
      } else {
        return `Between every line of history, ${concept} ${action}—${element} remembers what minds forget, the body keeps the score...`;
      }
    },

    the_trickster:  () => {
      const symbol1 = mysticalSymbols[Math.floor(Math.random() * mysticalSymbols.length)];
      const symbol2 = mysticalSymbols[Math.floor(Math.random() * mysticalSymbols.length)];
      const element = naturalElements[Math.floor(Math.random() * naturalElements.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];

      if (themes.truth) {
        return `Hehehehe! ${symbol1} asks ${symbol2}: "Is truth the lie we believe, or the belief we lie about?"—${element} ${action} with the answer, but which element? Which action?`;
      } else if (themes.future) {
        return `The future laughs at your question! ${element} ${action} backwards while ${symbol1} chases ${symbol2}—tomorrow is yesterday's prank, time is the comedian...`;
      } else if (themes.love) {
        return `Love? ${symbol1} and ${symbol2} dance the eternal paradox—together they're apart, apart they're together, ${element} ${action} in confusion and clarity simultaneously! `;
      } else if (themes.fear) {
        return `Fear ${action}! But wait—does ${element} fear ${symbol1}, or does ${symbol1} fear being ${element}? The cosmic joke is that fear fears itself!`;
      } else if (themes.money) {
        return `Gold! ${symbol1} hoards while ${symbol2} spends, yet both are equally empty or full—${element} ${action} through the illusion, laughing...`;
      } else {
        return `Question and answer swap masks! ${symbol1} becomes ${symbol2} becomes ${element}—all ${action} in the great cosmic jest where nothing is everything wearing different hats!`;
      }
    },

    the_watcher: () => {
      const concept = abstractConcepts[Math.floor(Math.random() * abstractConcepts.length)];
      const element = naturalElements[Math.floor(Math.random() * naturalElements.length)];
      const symbol = mysticalSymbols[Math.floor(Math. random() * mysticalSymbols.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];

      if (themes.future) {
        return `I have observed ${concept} across millennia—${element} ${action}, ${symbol} responds, the future is merely the past viewed from another angle.  I see all angles simultaneously...`;
      } else if (themes.death) {
        return `The Watcher has seen ${element} birth ${symbol} infinite times—death is transformation observed by the eternal eye, ${concept} ${action} endlessly... `;
      } else if (themes.truth) {
        return `Truth exists independent of observation, yet I observe: ${concept} ${action} while ${element} carries ${symbol}—what is, is, regardless of belief...`;
      } else if (themes.purpose) {
        return `Through silent vigil I perceive ${concept}—${element} ${action} without asking why, ${symbol} exists without justification. Purpose is the question, being is the answer...`;
      } else if (themes.change) {
        return `Change is the only constant I have witnessed—${element} ${action}, ${symbol} transforms, ${concept} cycles. I remain, watching the eternal dance...`;
      } else {
        return `From beyond time I observe: ${element} ${action} through ${concept}, ${symbol} witnesses silently—your answer exists in the space between question and asking...`;
      }
    }
  };

  const generator = generators[spiritType as keyof typeof generators] || generators.the_whisperer;
  return generator();
};

// Enhanced metaphorical spirit responses using dynamic generation
const SPIRIT_METAPHORS:  Record<string, (question: string) => string> = {
  the_whisperer: (q) => generateDynamicMetaphor(q, 'the_whisperer'),
  the_archivist: (q) => generateDynamicMetaphor(q, 'the_archivist'),
  the_trickster: (q) => generateDynamicMetaphor(q, 'the_trickster'),
  the_watcher: (q) => generateDynamicMetaphor(q, 'the_watcher'),
};

export const OuijaBoard = ({
  room,
  participants,
  currentUserId,
  onExit,
  onRoomUpdate,
  onParticipantsUpdate,
}: OuijaBoardProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const boardRef = useRef<HTMLDivElement>(null);
  const [planchettePos, setPlanchettePos] = useState({ x: 50, y: 50 });
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [isSpelling, setIsSpelling] = useState(false);
  const [currentLetter, setCurrentLetter] = useState("");
  const [hoveredLetter, setHoveredLetter] = useState("");
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [currentResponse, setCurrentResponse] = useState("");
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ". split("");
  const numbers = "0123456789".split("");
  const isMyTurn = room.current_turn_user_id === currentUserId;

  const hasUnlimitedQuestions = userSubscription?.features?.includes("unlimited_questions");
  const maxQuestions = hasUnlimitedQuestions ? 999 : room.max_questions;
  const questionsRemaining = maxQuestions - room. questions_asked;

  const getLetterPositions = () => {
    const letterPositions: Record<string, { x: number; y: number }> = {};
    const topArcLetters = "ABCDEFGHIJKLM";
    const bottomArcLetters = "NOPQRSTUVWXYZ";

    topArcLetters.split("").forEach((letter, idx) => {
      const totalLetters = 13;
      const spreadDegrees = 140;
      const startAngle = -70;
      const angleDeg = startAngle + (idx / (totalLetters - 1)) * spreadDegrees;
      const angleRad = (angleDeg * Math.PI) / 180;
      const centerX = 50;
      const centerY = 35;
      const radius = 35;

      const x = centerX + radius * Math.sin(angleRad);
      const y = centerY - radius * Math.cos(angleRad) + 5;
      letterPositions[letter] = { x, y };
    });

    bottomArcLetters. split("").forEach((letter, idx) => {
      const totalLetters = 13;
      const spreadDegrees = 140;
      const startAngle = -70;
      const angleDeg = startAngle + (idx / (totalLetters - 1)) * spreadDegrees;
      const angleRad = (angleDeg * Math.PI) / 180;
      const centerX = 50;
      const centerY = 55;
      const radius = 35;

      const x = centerX + radius * Math.sin(angleRad);
      const y = centerY - radius * Math.cos(angleRad) + 5;
      letterPositions[letter] = { x, y };
    });

    return letterPositions;
  };

  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        setLoadingSubscription(true);
        const { data, error } = await (supabase as any)
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", currentUserId)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Subscription fetch error:", error);
        }

        setUserSubscription(data);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    fetchUserSubscription();
  }, [currentUserId]);

  useEffect(() => {
    loadQuestions();
    const unsubscribe1 = setupRealtimeSubscription();
    const unsubscribe2 = setupPresenceChannel();

    return () => {
      unsubscribe1?. ();
      unsubscribe2?.();
    };
  }, [room.id]);

  const setupPresenceChannel = () => {
    try {
      const channel = supabase. channel(`presence_${room.id}`, {
        config: { presence: { key: currentUserId } }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          console.log('Presence sync:', state);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('New user joined:', newPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: currentUserId,
              planchette_position: planchettePos,
              online_at: new Date().toISOString(),
            });
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Presence channel error:", error);
      return () => {};
    }
  };

  const loadQuestions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("ouija_questions")
        .select("*")
        .eq("room_id", room.id)
        .order("question_number");

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error("Error loading questions:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      const channel = supabase
        .channel(`room_${room.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "ouija_rooms",
            filter: `id=eq.${room.id}`,
          },
          (payload) => {
            onRoomUpdate(payload.new);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ouija_questions",
            filter: `room_id=eq.${room.id}`,
          },
          () => {
            loadQuestions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Subscription error:", error);
      return () => {};
    }
  };

  const copyInviteLink = () => {
    try {
      const link = `${window.location.origin}/ouija-room? invite=${room.invite_code}`;
      navigator.clipboard.writeText(link);
      toast({
        title: t("ouija. inviteCopied"),
        description: t("ouija.inviteDesc"),
      });
    } catch (error) {
      console.error("Copy error:", error);
      toast({
        title: "Error",
        description: "Failed to copy invite link",
        variant: "destructive"
      });
    }
  };

  const handleUpgradeClick = (featureKey: string) => {
    const feature = PREMIUM_FEATURES[featureKey];
    if (! feature) return;

    window.location.href = `/checkout?product=${feature.stripeProductId}&feature=${featureKey}`;
  };

  const getMetaphoricalResponse = (question: string, spiritType: string): string => {
    const generator = SPIRIT_METAPHORS[spiritType] || SPIRIT_METAPHORS.the_whisperer;
    return generator(question);
  };

  const askQuestion = async () => {
    if (!currentQuestion.trim() || ! isMyTurn || participants.length === 0) return;

    if (questionsRemaining <= 0) {
      toast({
        title:  "Limit Reached",
        description: hasUnlimitedQuestions
          ? "An unexpected error occurred."
          : "Upgrade to Unlimited Questions to continue.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSpelling(true);
      setPlanchettePos({ x: 50, y: 50 });
      
      setCurrentResponse("");

      const spiritResponse = getMetaphoricalResponse(currentQuestion, room.spirit_type);

      await animateSpelling(spiritResponse);

      setCurrentResponse(spiritResponse);

      const { error:  insertError } = await (supabase as any)
        .from("ouija_questions")
        .insert({
          room_id: room. id,
          asker_user_id: currentUserId,
          question_text: currentQuestion,
          question_number: room.questions_asked + 1,
          spirit_response: spiritResponse,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      const newQuestionsAsked = room.questions_asked + 1;

      const nextTurnIndex = participants.findIndex(p => p. user_id === currentUserId);
      const nextParticipant = participants[(nextTurnIndex + 1) % participants.length];

      if (nextParticipant) {
        const { error: updateError } = await (supabase as any)
          .from("ouija_rooms")
          .update({
            questions_asked: newQuestionsAsked,
            current_turn_user_id: nextParticipant.user_id,
            status: newQuestionsAsked >= maxQuestions ? "completed" : "active",
          })
          .eq("id", room.id);

        if (updateError) {
          console.error("Room update error:", updateError);
          throw updateError;
        }
      }

      setCurrentQuestion("");
      
      toast({
        title: "👻 The Spirit Has Spoken",
        description: "The full message is now revealed",
        duration: 4000
      });
    } catch (error) {
      console.error("Error asking question:", error);
      toast({
        title: t("ouija.error"),
        description: t("ouija.spiritsReached"),
        variant: "destructive",
      });
    } finally {
      setIsSpelling(false);
      setCurrentLetter("");
    }
  };

  const animateSpelling = async (text: string) => {
    const letterPositions = getLetterPositions();

    const spiritTimings:  Record<string, { letterDelay: number; driftChance: number }> = {
      the_whisperer: { letterDelay: 1200, driftChance: 0.3 },
      the_archivist: { letterDelay: 800, driftChance: 0.1 },
      the_trickster: { letterDelay: 500, driftChance: 0.6 },
      the_watcher: { letterDelay: 2000, driftChance: 0.8 },
    };

    const timing = spiritTimings[room.spirit_type] || spiritTimings.the_whisperer;

    const cleanText = text.toUpperCase().replace(/[^A-Z ]/g, "");
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];

      if (char === " ") {
        await new Promise((resolve) => setTimeout(resolve, 400));
        continue;
      }

      if (letterPositions[char]) {
        if (Math.random() < timing.driftChance) {
          const driftX = 50 + (Math.random() - 0.5) * 15;
          const driftY = 50 + (Math.random() - 0.5) * 15;
          setPlanchettePos({ x:  driftX, y: driftY });
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        const pos = letterPositions[char];
        setCurrentLetter(char);
        setPlanchettePos(pos);
        await new Promise((resolve) => setTimeout(resolve, timing.letterDelay));
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    setPlanchettePos({ x: 50, y: 50 });
  };

  const handlePlanchetteMove = (x: number, y: number) => {
    if (! isMyTurn || isSpelling) return;

    setPlanchettePos({ x, y });

    const letterPositions = getLetterPositions();
    let closestLetter = "";
    let minDistance = Infinity;

    Object.entries(letterPositions).forEach(([letter, pos]) => {
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance < minDistance && distance < 5) {
        minDistance = distance;
        closestLetter = letter;
      }
    });

    if (closestLetter && closestLetter !== hoveredLetter) {
      setHoveredLetter(closestLetter);

      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      hoverTimeoutRef. current = setTimeout(() => {
        toast({
          title: t("ouija.letterDetected"),
          description: `${t("ouija.spiritHovers")} ${closestLetter}`,
          duration: 2000,
        });
      }, 2000);
    } else if (! closestLetter) {
      setHoveredLetter("");
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    }
  };

  const getSpiritGlow = (spiritType: string) => {
    const glows:  Record<string, string> = {
      the_whisperer:  "rgba(139, 0, 139, 0.6)",
      the_archivist: "rgba(0, 100, 200, 0.6)",
      the_trickster: "rgba(255, 50, 0, 0.6)",
      the_watcher: "rgba(100, 100, 100, 0.4)",
    };
    return glows[spiritType] || glows.the_whisperer;
  };

  const getSpiritGlowClass = (spiritType: string) => {
    const classes: Record<string, string> = {
      the_whisperer: "animate-pulse",
      the_archivist:  "",
      the_trickster:  "animate-pulse",
      the_watcher: "",
    };
    return classes[spiritType] || "";
  };

  const currentTurnParticipant = participants.find(p => p.user_id === room.current_turn_user_id);

  if (loadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-900/30 border-t-red-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Summoning the spirits...</p>
        </div>
      </div>
    );
  }

  if (room.status === "completed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <h2 className="text-4xl font-gothic text-red-900 drop-shadow-[0_0_20px_rgba(139,0,0,1)]">
          The Séance Has Concluded
        </h2>
        <p className="text-gray-400 text-xl italic">The spirits return to the void... </p>
        <Card className="p-6 max-w-3xl w-full bg-black/90 border-red-900/30">
          <h3 className="font-semibold text-red-900 mb-4 text-xl flex items-center gap-2">
            <Scroll className="w-6 h-6" />
            Communion Record
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity:  1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="border-l-4 border-red-900/50 pl-4 py-2"
              >
                <p className="text-sm text-gray-400 mb-1">
                  <span className="text-red-900 font-bold">Question {idx + 1}:</span> {q.question_text}
                </p>
                <p className="text-sm text-gray-300 italic">
                  <span className="text-red-900/70">→</span> {q.spirit_response}
                </p>
              </motion.div>
            ))}
          </div>
        </Card>
        <Button 
          onClick={onExit}
          className="bg-red-900 hover:bg-red-800 text-white px-8 py-6 text-lg"
        >
          Leave the Chamber
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <Card className="mb-4 p-4 bg-black/90 border-red-900/30">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-sm text-gray-400">Summoned Spirit</p>
              <p className="font-semibold text-red-900 capitalize text-lg">
                {room. spirit_type?. replace(/_/g, " ") || "Unknown"}
              </p>
            </div>
            <div className="border-l border-red-900/30 pl-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">Questions Remaining</p>
                {! hasUnlimitedQuestions && questionsRemaining <= 2 && (
                  <Lock className="w-3 h-3 text-red-900" />
                )}
              </div>
              <p className="text-2xl font-bold text-red-900">
                {hasUnlimitedQuestions ? "∞" : `${questionsRemaining}/${maxQuestions}`}
              </p>
            </div>
            <div className="border-l border-red-900/30 pl-4">
              <p className="text-sm text-gray-400">Current Turn</p>
              <p className="font-semibold text-white">
                {currentTurnParticipant?.profiles?.username || "Unknown"}
                {isMyTurn && <span className="text-red-900 ml-2">(You)</span>}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-red-900/30 text-red-900 hover:bg-red-900/10">
                  Premium Features
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 bg-black/95 backdrop-blur-md border-red-900/30"
              >
                {Object.entries(PREMIUM_FEATURES).map(([key, feature]) => (
                  <div
                    key={key}
                    className="px-3 py-3 border-b border-red-900/20 last:border-b-0 hover:bg-red-900/10 cursor-pointer transition-all"
                    onClick={() => handleUpgradeClick(key)}
                  >
                    <p className="text-sm font-semibold text-white">{feature.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{feature.description}</p>
                    <p className="text-xs text-red-900 font-semibold mt-2">${feature.price}</p>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyInviteLink} 
              className="border-red-900/30 text-red-900 hover:bg-red-900/10"
            >
              <Copy className="w-4 h-4 mr-2" />
              Invite Others
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">
            Participants ({participants.length}/6):
          </span>
          {participants.map((p) => (
            <span
              key={p.id}
              className={`text-sm px-3 py-1 rounded ${
                p.user_id === room.current_turn_user_id
                  ? "bg-red-900/30 text-red-900 font-semibold border border-red-900/50"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              {p.profiles?.username || "Anonymous"}
            </span>
          ))}
        </div>
      </Card>

      <AnimatePresence>
        {isSpelling && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity:  1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="mb-4 p-4 bg-black/90 border-red-900/30 text-center">
              <p className="text-red-900 animate-pulse font-semibold text-lg font-gothic">
                The Spirit Speaks Through the Board... 
                {currentLetter && (
                  <motion.span 
                    className="text-4xl ml-4 inline-block"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    {currentLetter}
                  </motion.span>
                )}
              </p>
              <p className="text-sm text-gray-400 mt-2">Watch the planchette reveal the message... </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hoveredLetter && ! isSpelling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="mb-4 p-3 bg-black/95 border-red-900/20 text-center">
              <p className="text-red-900/80 text-sm font-gothic">
                Hovering over <span className="text-2xl font-bold ml-2 text-red-900">{hoveredLetter}</span>
              </p>
            </Card>
          </motion. div>
        )}
      </AnimatePresence>

      {isMyTurn && ! isSpelling && (
        <Card className="mb-4 p-4 bg-black/90 border-red-900/30">
          <div className="flex gap-2">
            <Input
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Ask the spirits your question..."
              onKeyDown={(e) => e.key === "Enter" && askQuestion()}
              className="bg-black border-red-900/30 text-white placeholder: text-gray-500 focus:border-red-900"
            />
            <Button
              onClick={askQuestion}
              disabled={!currentQuestion.trim() || questionsRemaining <= 0}
              className="bg-red-900 hover:bg-red-800 text-white px-6"
            >
              Ask Spirit
            </Button>
          </div>
          {questionsRemaining <= 2 && questionsRemaining > 0 && (
            <p className="text-xs text-red-900/70 mt-2 italic">⚠️ {questionsRemaining} questions remaining</p>
          )}
        </Card>
      )}

      <AnimatePresence>
        {currentResponse && ! isSpelling && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity:  1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="mb-6 p-6 bg-gradient-to-br from-black via-red-950/20 to-black border-2 border-red-900/50 shadow-[0_0_30px_rgba(139,0,0,0.3)]">
              <div className="flex items-start gap-4">
                <Scroll className="w-8 h-8 text-red-900 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-gothic text-red-900 mb-3 flex items-center gap-2">
                    <span className="animate-pulse">👻</span>
                    The Spirit's Revelation
                  </h3>
                  <p className="text-gray-300 text-lg leading-relaxed italic font-serif">
                    {currentResponse}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={boardRef}
        className={`relative w-full aspect-[16/10] rounded-lg shadow-2xl overflow-hidden transition-all duration-1000 ${
          isSpelling ? getSpiritGlowClass(room.spirit_type) : ""
        }`}
        style={{
          background: "linear-gradient(135deg, #1a0a00 0%, #000000 50%, #1a0a00 100%)",
          boxShadow: `0 0 80px ${getSpiritGlow(room.spirit_type)}, inset 0 0 100px rgba(0, 0, 0, 0.9)`,
        }}
      >
        <div className="absolute inset-0 border-8 border-double border-red-900/20 rounded-lg pointer-events-none" />

        <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-red-900/40" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-red-900/40" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-red-900/40" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-red-900/40" />

        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 text-center">
          <div
            className="text-6xl font-serif font-bold tracking-wider"
            style={{
              color: "#000",
              textShadow: "0 0 20px rgba(139, 0, 0, 0.8), 0 0 10px rgba(255, 0, 0, 0.5)",
              WebkitTextStroke: "1px #8b0000"
            }}
          >
            OUIJA
          </div>
          <div className="text-sm tracking-widest text-red-900/70 mt-1">MYSTIFYING ORACLE</div>
        </div>

        <div className="absolute top-[18%] left-[12%] text-center">
          <div className="w-16 h-16 rounded-full border-4 border-red-900/40 flex items-center justify-center mb-2">
            <svg className="w-10 h-10 text-red-900/60" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.3" />
              <text x="50" y="65" textAnchor="middle" fontSize="24" fill="#000" fontWeight="bold">
                ☀
              </text>
            </svg>
          </div>
          <div
            className="text-3xl font-serif font-bold tracking-wider"
            style={{
              color:  "#000",
              textShadow: "0 0 10px rgba(139, 0, 0, 0.8)",
              WebkitTextStroke: "0.5px #8b0000"
            }}
          >
            YES
          </div>
        </div>

        <div className="absolute top-[18%] right-[12%] text-center">
          <div className="w-16 h-16 rounded-full border-4 border-red-900/40 flex items-center justify-center mb-2">
            <svg className="w-10 h-10 text-red-900/60" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.3" />
              <text x="50" y="65" textAnchor="middle" fontSize="24" fill="#000" fontWeight="bold">
                ☾
              </text>
            </svg>
          </div>
          <div
            className="text-3xl font-serif font-bold tracking-wider"
            style={{
              color: "#000",
              textShadow: "0 0 10px rgba(139, 0, 0, 0.8)",
              WebkitTextStroke: "0.5px #8b0000"
            }}
          >
            NO
          </div>
        </div>

        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[85%] h-[18%]">
          {letters.slice(0, 13).map((letterChar, idx) => {
            const angle = (idx - 6) * 11;
            const radius = 48;
            const xPos = 50 + radius * Math.sin((angle * Math.PI) / 180);
            const yPos = 12 + radius * (1 - Math.cos((angle * Math.PI) / 180));
            return (
              <div
                key={letterChar}
                className="absolute font-serif font-bold select-none"
                style={{
                  left: `${xPos}%`,
                  top: `${yPos}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: "2rem",
                  color: "#000",
                  textShadow: "0 0 15px rgba(139, 0, 0, 0.9), 0 0 5px rgba(255, 0, 0, 0.6)",
                  WebkitTextStroke: "0.5px #8b0000",
                }}
              >
                {letterChar}
              </div>
            );
          })}
        </div>

        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-[85%] h-[18%]">
          {letters.slice(13).map((letterChar, idx) => {
            const angle = (idx - 6.5) * 11;
            const radius = 48;
            const xPos = 50 + radius * Math.sin((angle * Math.PI) / 180);
            const yPos = 12 + radius * (1 - Math.cos((angle * Math. PI) / 180));
            return (
              <div
                key={letterChar}
                className="absolute font-serif font-bold select-none"
                style={{
                  left: `${xPos}%`,
                  top: `${yPos}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: "2rem",
                  color: "#000",
                  textShadow: "0 0 15px rgba(139, 0, 0, 0.9), 0 0 5px rgba(255, 0, 0, 0.6)",
                  WebkitTextStroke: "0.5px #8b0000",
                }}
              >
                {letterChar}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[75%] flex justify-between items-center">
          {numbers.map((num) => (
            <div
              key={num}
              className="font-serif font-bold select-none"
              style={{
                fontSize: "1.75rem",
                color: "#000",
                textShadow:  "0 0 15px rgba(139, 0, 0, 0.9), 0 0 5px rgba(255, 0, 0, 0.6)",
                WebkitTextStroke: "0.5px #8b0000",
              }}
            >
              {num}
            </div>
          ))}
        </div>

        <button
          onClick={onExit}
          className="absolute bottom-[6%] left-1/2 -translate-x-1/2 font-serif font-bold tracking-widest select-none transition-all hover:scale-105"
          style={{
            fontSize: "2. 5rem",
            color: "#000",
            textShadow: "0 0 20px rgba(139, 0, 0, 1), 0 0 10px rgba(255, 0, 0, 0.8)",
            WebkitTextStroke: "0.5px #8b0000",
          }}
        >
          GOOD BYE
        </button>

        <Planchette
          position={planchettePos}
          onMove={handlePlanchetteMove}
          boardRef={boardRef}
          disabled={! isMyTurn || isSpelling}
        />

        {! isMyTurn && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-none">
            <p className="text-xl text-red-900 font-semibold bg-black/90 px-6 py-3 rounded-lg border border-red-900/30 font-gothic">
              Waiting for {currentTurnParticipant?.profiles?.username}&apos;s turn...
            </p>
          </div>
        )}
      </div>

      {questions.length > 0 && (
        <Card className="mt-6 p-6 bg-black/90 border-red-900/30">
          <h3 className="font-semibold text-red-900 mb-4 text-xl flex items-center gap-2 font-gothic">
            <Scroll className="w-6 h-6" />
            Spirit Communications Archive
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {questions. slice().reverse().map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x:  0 }}
                transition={{ delay: idx * 0.05 }}
                className="border-l-4 border-red-900/50 pl-4 py-3 hover:bg-red-900/5 transition-colors rounded-r"
              >
                <p className="text-sm text-gray-400 mb-2">
                  <span className="text-red-900 font-bold font-gothic">Question {q.question_number}:</span> {q. question_text}
                </p>
                <p className="text-sm text-gray-300 italic leading-relaxed font-serif">
                  <span className="text-red-900/70">→</span> {q.spirit_response}
                </p>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};