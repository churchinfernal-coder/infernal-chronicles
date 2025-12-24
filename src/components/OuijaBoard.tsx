import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Planchette } from "./Planchette";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface OuijaBoardProps {
  room: any;
  participants: any[];
  currentUserId: string;
  onExit: () => void;
  onRoomUpdate: (room: any) => void;
  onParticipantsUpdate: (participants: any[]) => void;
}

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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const numbers = "0123456789".split("");
  const isMyTurn = room.current_turn_user_id === currentUserId;
  const questionsRemaining = room.max_questions - room.questions_asked;

  // Letter positions for the board - MUST match visual layout
  const getLetterPositions = () => {
    const letterPositions: Record<string, { x: number; y: number }> = {};
    const topArcLetters = "ABCDEFGHIJKLM";
    const bottomArcLetters = "NOPQRSTUVWXYZ";

    // Top arc positioning
    topArcLetters.split("").forEach((letter, idx) => {
      const totalLetters = 13;
      const spreadDegrees = 140; // Total arc span
      const startAngle = -70; // Start from left
      const angleDeg = startAngle + (idx / (totalLetters - 1)) * spreadDegrees;
      const angleRad = (angleDeg * Math.PI) / 180;
      const centerX = 50;
      const centerY = 35;
      const radius = 35;
      
      const x = centerX + radius * Math.sin(angleRad);
      const y = centerY - radius * Math.cos(angleRad) + 5;
      letterPositions[letter] = { x, y };
    });

    // Bottom arc positioning
    bottomArcLetters.split("").forEach((letter, idx) => {
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
    loadQuestions();
    setupRealtimeSubscription();
    setupPresenceChannel();
  }, [room.id]);

  const setupPresenceChannel = () => {
    const channel = supabase.channel(`presence_${room.id}`, {
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
  };

  const loadQuestions = async () => {
    const { data } = await supabase
      .from("ouija_questions")
      .select("*")
      .eq("room_id", room.id)
      .order("question_number");

    if (data) setQuestions(data);
  };

  const setupRealtimeSubscription = () => {
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
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/ouija-room?invite=${room.invite_code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: t("ouija.inviteCopied"),
      description: t("ouija.inviteDesc"),
    });
  };

  const askQuestion = async () => {
    if (!currentQuestion.trim() || !isMyTurn || participants.length === 0) return;

    try {
      setIsSpelling(true);
      setPlanchettePos({ x: 50, y: 50 }); // Reset to center
      
      // Build session memory
      const previousQuestions = questions.map(q => q.question_text);
      
      // Get AI spirit response with session memory
      const { data: spiritData, error: functionError } = await supabase.functions.invoke(
        'ouija-spirit-response',
        { 
          body: { 
            question: currentQuestion, 
            spiritType: room.spirit_type,
            previousQuestions 
          } 
        }
      );

      const spiritResponse = spiritData?.response || "The spirits remain silent...";

      // Animate planchette spelling out the response
      await animateSpelling(spiritResponse);

      const { error } = await supabase.from("ouija_questions").insert({
        room_id: room.id,
        asker_user_id: currentUserId,
        question_text: currentQuestion,
        question_number: room.questions_asked + 1,
        spirit_response: spiritResponse,
      });

      if (!error) {
        const newQuestionsAsked = room.questions_asked + 1;
        
        const nextTurnIndex = participants.findIndex(p => p.user_id === currentUserId);
        const nextParticipant = participants[(nextTurnIndex + 1) % participants.length];

        if (nextParticipant) {
          await supabase
            .from("ouija_rooms")
            .update({
              questions_asked: newQuestionsAsked,
              current_turn_user_id: nextParticipant.user_id,
              status: newQuestionsAsked >= room.max_questions ? "completed" : "active",
            })
            .eq("id", room.id);
        }

        setCurrentQuestion("");
      }
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

    // Spirit-specific movement timing
    const spiritTimings: Record<string, { letterDelay: number; driftChance: number }> = {
      the_whisperer: { letterDelay: 1200, driftChance: 0.3 },
      the_archivist: { letterDelay: 800, driftChance: 0.1 },
      the_trickster: { letterDelay: 500, driftChance: 0.6 },
      the_watcher: { letterDelay: 2000, driftChance: 0.8 },
    };

    const timing = spiritTimings[room.spirit_type] || spiritTimings.the_whisperer;

    console.log("Starting animation for:", text);
    console.log("Letter positions:", letterPositions);

    // Spell out each letter
    const cleanText = text.toUpperCase().replace(/[^A-Z ]/g, "");
    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      
      if (char === " ") {
        await new Promise((resolve) => setTimeout(resolve, 400));
        continue;
      }

      if (letterPositions[char]) {
        // Random drift for certain spirits
        if (Math.random() < timing.driftChance) {
          const driftX = 50 + (Math.random() - 0.5) * 15;
          const driftY = 50 + (Math.random() - 0.5) * 15;
          console.log(`Drifting to (${driftX}, ${driftY})`);
          setPlanchettePos({ x: driftX, y: driftY });
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        const pos = letterPositions[char];
        console.log(`Moving to letter ${char} at position (${pos.x}, ${pos.y})`);
        setCurrentLetter(char);
        setPlanchettePos(pos);
        await new Promise((resolve) => setTimeout(resolve, timing.letterDelay));
      }
    }

    // Return to center
    console.log("Animation complete, returning to center");
    await new Promise((resolve) => setTimeout(resolve, 500));
    setPlanchettePos({ x: 50, y: 50 });
  };

  const handlePlanchetteMove = (x: number, y: number) => {
    if (!isMyTurn || isSpelling) return;
    
    setPlanchettePos({ x, y });
    
    // Detect letter hover
    const letterPositions = getLetterPositions();
    let closestLetter = "";
    let minDistance = Infinity;
    
    Object.entries(letterPositions).forEach(([letter, pos]) => {
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance < minDistance && distance < 5) { // Within 5% of board
        minDistance = distance;
        closestLetter = letter;
      }
    });
    
    if (closestLetter && closestLetter !== hoveredLetter) {
      setHoveredLetter(closestLetter);
      
      // Clear previous timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      // Set new timeout for 2 seconds
      hoverTimeoutRef.current = setTimeout(() => {
        console.log(`Letter detected: ${closestLetter}`);
        toast({
          title: t("ouija.letterDetected"),
          description: `${t("ouija.spiritHovers")} ${closestLetter}`,
          duration: 2000,
        });
      }, 2000);
    } else if (!closestLetter) {
      setHoveredLetter("");
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    }
  };

  const getSpiritGlow = (spiritType: string) => {
    const glows: Record<string, string> = {
      the_whisperer: "rgba(139, 0, 139, 0.6)",
      the_archivist: "rgba(0, 100, 200, 0.6)",
      the_trickster: "rgba(255, 50, 0, 0.6)",
      the_watcher: "rgba(100, 100, 100, 0.4)",
    };
    return glows[spiritType] || glows.the_whisperer;
  };

  const getSpiritGlowClass = (spiritType: string) => {
    const classes: Record<string, string> = {
      the_whisperer: "animate-pulse",
      the_archivist: "",
      the_trickster: "animate-pulse",
      the_watcher: "",
    };
    return classes[spiritType] || "";
  };

  const currentTurnParticipant = participants.find(p => p.user_id === room.current_turn_user_id);

  if (room.status === "completed") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <h2 className="text-3xl font-bold text-primary">{t("ouija.sessionEnded")}</h2>
        <p className="text-muted-foreground">{t("ouija.spiritsDepart")}</p>
        <Card className="p-4 max-w-2xl w-full">
          <h3 className="font-semibold mb-3">{t("ouija.questionsAsked")}</h3>
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="text-sm">
                <span className="text-primary font-medium">Q{idx + 1}:</span> {q.question_text}
              </div>
            ))}
          </div>
        </Card>
        <Button onClick={onExit}>{t("ouija.exitRoom")}</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Header Info */}
      <Card className="mb-4 p-4 bg-black/80 border-destructive/30">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("ouija.summonedSpirit")}</p>
              <p className="font-semibold text-destructive capitalize">
                {room.spirit_type?.replace(/_/g, " ") || "Unknown"}
              </p>
            </div>
            <div className="border-l border-destructive/30 pl-4">
              <p className="text-sm text-muted-foreground">{t("ouija.questionsRemaining")}</p>
              <p className="text-2xl font-bold text-destructive">{questionsRemaining}/6</p>
            </div>
            <div className="border-l border-destructive/30 pl-4">
              <p className="text-sm text-muted-foreground">{t("ouija.currentTurn")}</p>
              <p className="font-semibold text-foreground">
                {currentTurnParticipant?.profiles?.username || "Unknown"}
                {isMyTurn && <span className="text-destructive ml-2">{t("ouija.you")}</span>}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyInviteLink} className="border-destructive/30">
              <Copy className="w-4 h-4 mr-2" />
              {t("ouija.copyInvite")}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("ouija.participants")} ({participants.length}/6):
          </span>
          {participants.map((p) => (
            <span
              key={p.id}
              className={`text-sm px-2 py-1 rounded ${
                p.user_id === room.current_turn_user_id
                  ? "bg-destructive/20 text-destructive font-semibold border border-destructive/30"
                  : "bg-muted"
              }`}
            >
              {p.profiles?.username || "Anonymous"}
            </span>
          ))}
        </div>
      </Card>

      {/* Spelling Animation Indicator */}
      {isSpelling && (
        <Card className="mb-4 p-4 bg-black/80 border-destructive/30 text-center">
          <p className="text-destructive animate-pulse font-semibold text-lg">
            {t("ouija.spiritSpeaks")} {currentLetter && <span className="text-3xl ml-3 inline-block animate-bounce">{currentLetter}</span>}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{t("ouija.watchPlanchette")}</p>
        </Card>
      )}

      {/* Letter Hover Indicator */}
      {hoveredLetter && !isSpelling && (
        <Card className="mb-4 p-3 bg-black/90 border-destructive/20 text-center">
          <p className="text-destructive/80 text-sm">
            {t("ouija.hoveringOver")} <span className="text-xl font-bold ml-2">{hoveredLetter}</span>
          </p>
        </Card>
      )}

      {/* Question Input */}
      {isMyTurn && !isSpelling && (
        <Card className="mb-4 p-4 bg-black/80 border-destructive/30">
          <div className="flex gap-2">
            <Input
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder={t("ouija.askQuestion")}
              onKeyDown={(e) => e.key === "Enter" && askQuestion()}
              className="bg-background border-destructive/30"
            />
            <Button onClick={askQuestion} disabled={!currentQuestion.trim()} className="bg-destructive hover:bg-destructive/90">
              {t("ouija.askSpirit")}
            </Button>
          </div>
        </Card>
      )}

      {/* Message Log */}
      {questions.length > 0 && (
        <Card className="mb-4 p-4 bg-black/80 border-destructive/30">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-destructive">{t("ouija.spiritResponses")}</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive/70 hover:text-destructive"
              onClick={() => setQuestions([])}
            >
              {t("ouija.clearLog")}
            </Button>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {questions.slice(-5).reverse().map((q) => (
              <div key={q.id} className="border-l-2 border-destructive/30 pl-3">
                <p className="text-sm text-muted-foreground">Q: {q.question_text}</p>
                <p className="text-sm text-foreground mt-1 italic">Spirit: {q.spirit_response}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ouija Board - Vintage Style */}
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
        {/* Ornate border */}
        <div className="absolute inset-0 border-8 border-double border-destructive/20 rounded-lg pointer-events-none" />
        
        {/* Corner decorations */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-destructive/40" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-destructive/40" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-destructive/40" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-destructive/40" />

        {/* Title "OUIJA" */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 text-center">
          <div className="text-6xl font-serif font-bold tracking-wider" style={{ 
            color: "#000", 
            textShadow: "0 0 20px rgba(139, 0, 0, 0.8), 0 0 10px rgba(255, 0, 0, 0.5)",
            WebkitTextStroke: "1px #8b0000"
          }}>
            OUIJA
          </div>
          <div className="text-sm tracking-widest text-destructive/70 mt-1">MYSTIFYING ORACLE</div>
        </div>

        {/* YES - Left side */}
        <div className="absolute top-[18%] left-[12%] text-center">
          <div className="w-16 h-16 rounded-full border-4 border-destructive/40 flex items-center justify-center mb-2">
            <svg className="w-10 h-10 text-destructive/60" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.3"/>
              <text x="50" y="65" textAnchor="middle" fontSize="24" fill="#000" fontWeight="bold">☀</text>
            </svg>
          </div>
          <div className="text-3xl font-serif font-bold tracking-wider" style={{ 
            color: "#000",
            textShadow: "0 0 10px rgba(139, 0, 0, 0.8)",
            WebkitTextStroke: "0.5px #8b0000"
          }}>
            YES
          </div>
        </div>

        {/* NO - Right side */}
        <div className="absolute top-[18%] right-[12%] text-center">
          <div className="w-16 h-16 rounded-full border-4 border-destructive/40 flex items-center justify-center mb-2">
            <svg className="w-10 h-10 text-destructive/60" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.3"/>
              <text x="50" y="65" textAnchor="middle" fontSize="24" fill="#000" fontWeight="bold">☾</text>
            </svg>
          </div>
          <div className="text-3xl font-serif font-bold tracking-wider" style={{ 
            color: "#000",
            textShadow: "0 0 10px rgba(139, 0, 0, 0.8)",
            WebkitTextStroke: "0.5px #8b0000"
          }}>
            NO
          </div>
        </div>

        {/* Top Arc - Letters A-M */}
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[85%] h-[18%]">
          {letters.slice(0, 13).map((letter, idx) => {
            const angle = (idx - 6) * 11;
            const radius = 48;
            const x = 50 + radius * Math.sin((angle * Math.PI) / 180);
            const y = 12 + radius * (1 - Math.cos((angle * Math.PI) / 180));
            return (
              <div
                key={letter}
                className="absolute font-serif font-bold select-none"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: "2rem",
                  color: "#000",
                  textShadow: "0 0 15px rgba(139, 0, 0, 0.9), 0 0 5px rgba(255, 0, 0, 0.6)",
                  WebkitTextStroke: "0.5px #8b0000",
                }}
              >
                {letter}
              </div>
            );
          })}
        </div>

        {/* Bottom Arc - Letters N-Z */}
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-[85%] h-[18%]">
          {letters.slice(13).map((letter, idx) => {
            const angle = (idx - 6.5) * 11;
            const radius = 48;
            const x = 50 + radius * Math.sin((angle * Math.PI) / 180);
            const y = 12 + radius * (1 - Math.cos((angle * Math.PI) / 180));
            return (
              <div
                key={letter}
                className="absolute font-serif font-bold select-none"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: "2rem",
                  color: "#000",
                  textShadow: "0 0 15px rgba(139, 0, 0, 0.9), 0 0 5px rgba(255, 0, 0, 0.6)",
                  WebkitTextStroke: "0.5px #8b0000",
                }}
              >
                {letter}
              </div>
            );
          })}
        </div>

        {/* Numbers Row */}
        <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[75%] flex justify-between items-center">
          {numbers.map((num) => (
            <div 
              key={num} 
              className="font-serif font-bold select-none"
              style={{
                fontSize: "1.75rem",
                color: "#000",
                textShadow: "0 0 15px rgba(139, 0, 0, 0.9), 0 0 5px rgba(255, 0, 0, 0.6)",
                WebkitTextStroke: "0.5px #8b0000",
              }}
            >
              {num}
            </div>
          ))}
        </div>

        {/* GOOD BYE */}
        <button
          onClick={onExit}
          className="absolute bottom-[6%] left-1/2 -translate-x-1/2 font-serif font-bold tracking-widest select-none transition-all hover:scale-105"
          style={{
            fontSize: "2.5rem",
            color: "#000",
            textShadow: "0 0 20px rgba(139, 0, 0, 1), 0 0 10px rgba(255, 0, 0, 0.8)",
            WebkitTextStroke: "0.5px #8b0000",
          }}
        >
          GOOD BYE
        </button>

        {/* Planchette */}
        <Planchette
          position={planchettePos}
          onMove={handlePlanchetteMove}
          boardRef={boardRef}
          disabled={!isMyTurn || isSpelling}
        />

        {/* Turn indicator overlay */}
        {!isMyTurn && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-none">
            <p className="text-xl text-destructive font-semibold bg-black/90 px-6 py-3 rounded-lg border border-destructive/30">
              Waiting for {currentTurnParticipant?.profiles?.username}&apos;s turn...
            </p>
          </div>
        )}
      </div>

      {/* Recent Questions */}
      {questions.length > 0 && (
        <Card className="mt-4 p-4 bg-black/80 border-destructive/30">
          <h3 className="font-semibold mb-2">Spirit Messages:</h3>
          <div className="space-y-3 text-sm max-h-64 overflow-y-auto">
            {questions.slice(-3).map((q) => (
              <div key={q.id} className="border-l-2 border-destructive/30 pl-3">
                <p className="text-muted-foreground">
                  <span className="text-destructive font-semibold">Q{q.question_number}:</span> {q.question_text}
                </p>
                <p className="text-destructive/90 italic mt-1">
                  <span className="text-destructive/60">→</span> {q.spirit_response}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
