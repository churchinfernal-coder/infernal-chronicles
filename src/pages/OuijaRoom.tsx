import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OuijaBoard } from "@/components/OuijaBoard";
import { OuijaRoomSetup } from "@/components/OuijaRoomSetup";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Skull, Flame, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import OuijaPaywall from "./ouija/OuijaPaywall";

interface RoomData {
  id: string;
  host_user_id: string;
  invite_code: string;
  questions_asked: number;
  max_questions: number;
  current_turn_user_id: string | null;
  status: string;
  spirit_type?:  string;
}

interface Participant {
  id: string;
  user_id: string;
  turn_order: number;
  room_id: string;
  profiles: { username: string | null; avatar_url: string | null };
}

const OuijaRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  
  // ✅ Token & paywall states
  const [tokens, setTokens] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    // ✅ Fetch tokens when user is authenticated
    fetchTokens();
    
    const inviteCode = searchParams.get("invite");
    if (inviteCode) {
      joinRoomByInvite(inviteCode);
    }
  }, [userId, searchParams]);

  const checkAuth = async () => {
    try {
      const { data:  { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    } catch (error) {
      console.error("Auth error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch ouija tokens
  const fetchTokens = async () => {
    if (!userId) return;
    
    try {
      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .select('ouija_tokens')
        .eq('user_id', userId)
        .single();

      if (error || !profile) {
        console.error('Error fetching tokens:', error);
        setTokens(0);
        setShowPaywall(true);
      } else {
        const userTokens = profile.ouija_tokens || 0;
        setTokens(userTokens);
        
        console.log('🔥 OUIJA TOKENS:', userTokens, 'SHOW PAYWALL:', userTokens === 0);
        
        // Show paywall if no tokens
        if (userTokens === 0) {
          setShowPaywall(true);
        }
      }
    } catch (error) {
      console.error('Fetch tokens error:', error);
      setTokens(0);
      setShowPaywall(true);
    }
  };

  const joinRoomByInvite = async (inviteCode: string) => {
    if (!userId) return;
    
    setJoiningRoom(true);
    try {
      const { data: roomData, error:  roomError } = await (supabase as any)
        .from("ouija_rooms")
        .select("*")
        .eq("invite_code", inviteCode)
        .eq("status", "active")
        .single();

      if (roomError || !roomData) {
        toast({
          title: "👻 Invalid Invite",
          description: "This room doesn't exist or has ended.  The spirits have departed.",
          variant: "destructive",
        });
        navigate("/ouija-room");
        return;
      }

      const { data: existingParticipant } = await (supabase as any)
        .from("ouija_participants")
        .select("*")
        .eq("room_id", roomData.id)
        .eq("user_id", userId)
        .single();

      if (! existingParticipant) {
        const { count } = await (supabase as any)
          .from("ouija_participants")
          .select("*", { count: "exact", head:  true })
          .eq("room_id", roomData.id);

        if ((count || 0) >= 6) {
          toast({
            title: "🚫 Room Full",
            description: "This séance already has the maximum 6 participants.",
            variant: "destructive",
          });
          navigate("/ouija-room");
          return;
        }

        const { error: joinError } = await (supabase as any)
          .from("ouija_participants")
          .insert({
            room_id: roomData.id,
            user_id: userId,
            turn_order: (count || 0) + 1,
          });

        if (joinError) {
          console.error("Error joining room:", joinError);
          toast({
            title: "❌ Failed to Join",
            description: "Could not join the séance. Try again.",
            variant: "destructive",
          });
          return;
        }

        sonnerToast. success("✨ Joined the Séance", {
          description: `You are now participant #${(count || 0) + 1}`,
          duration: 3000,
        });
      }

      setRoom(roomData as RoomData);
      await loadParticipants(roomData. id);
      setupRealtimeSync(roomData.id);
    } catch (error) {
      console.error("Error joining room:", error);
      toast({
        title: "⚠️ Connection Error",
        description: "Failed to connect to the spirit realm.",
        variant: "destructive",
      });
    } finally {
      setJoiningRoom(false);
    }
  };

  const loadParticipants = async (roomId: string) => {
    try {
      const { data } = await (supabase as any)
        .from("ouija_participants")
        .select("*")
        .eq("room_id", roomId)
        .order("turn_order");

      if (data) {
        const participantsWithProfiles = await Promise.all(
          data. map(async (participant:  any) => {
            const { data: profile } = await (supabase as any)
              .from("profiles")
              .select("username, avatar_url")
              .eq("user_id", participant.user_id)
              .single();
            
            return {
              ...participant,
              profiles: profile || { username: null, avatar_url: null }
            } as Participant;
          })
        );
        
        setParticipants(participantsWithProfiles);
      }
    } catch (error) {
      console.error("Error loading participants:", error);
    }
  };

  const handleRoomCreated = async (roomData: RoomData) => {
    setRoom(roomData);
    await loadParticipants(roomData.id);
    setupRealtimeSync(roomData.id);
    
    sonnerToast.success("🔮 Séance Created", {
      description:  "The spirits are gathering.. .",
      duration: 3000,
    });
  };

  const setupRealtimeSync = (roomId: string) => {
    if (realtimeChannel) {
      supabase. removeChannel(realtimeChannel);
    }

    const channel = supabase
      .channel(`ouija-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ouija_rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Room update:', payload);
          if (payload.new) {
            setRoom(payload.new as RoomData);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ouija_participants',
          filter:  `room_id=eq.${roomId}`,
        },
        () => {
          loadParticipants(roomId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ouija_questions',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          sonnerToast.success('👻 New Spirit Response', {
            description: 'The spirits have spoken...',
            duration: 2500,
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    setRealtimeChannel(channel);
  };

  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [realtimeChannel]);

  const handleExitRoom = () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      setRealtimeChannel(null);
    }
    
    sonnerToast.info("👋 Left the Séance", {
      description: "The spirits bid you farewell...",
      duration: 2000,
    });
    
    setRoom(null);
    setParticipants([]);
    navigate("/ouija-room");
  };

  // ✅ CRITICAL: Show loading screen first
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950 flex items-center justify-center relative overflow-hidden">
        {/* Inverted Pentagram Background */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease:  "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-[600px] h-[600px]">
            <polygon 
              points="50,10 20,90 90,35 10,35 80,90" 
              fill="none" 
              stroke="rgb(139, 0, 0)" 
              strokeWidth="0.5"
              transform="rotate(180 50 50)"
            />
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(139, 0, 0)" strokeWidth="0.5" />
          </svg>
        </motion. div>

        {/* Blood drips */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-0"
              style={{ left: `${(i / 12) * 100}%` }}
              initial={{ y: -20, opacity: 0 }}
              animate={{ 
                y: typeof window !== 'undefined' ? window.innerHeight : 1080,
                opacity: [0, 0.6, 0]
              }}
              transition={{ 
                duration: 3 + Math.random() * 4, 
                repeat: Infinity,
                delay:  Math.random() * 5,
                ease: "easeIn"
              }}
            >
              <Droplet className="w-3 h-3 text-red-900 fill-red-900" />
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="text-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="relative inline-block mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease:  "linear" }}
              className="relative"
            >
              <Skull className="w-24 h-24 text-red-900 drop-shadow-[0_0_30px_rgba(139,0,0,0.8)]" />
            </motion.div>
            
            <motion.div 
              className="absolute -inset-4"
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease:  "linear" }}
            >
              <Flame className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 text-red-900" />
              <Flame className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 text-red-900" />
              <Flame className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 text-red-900" />
              <Flame className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 text-red-900" />
            </motion.div>
          </div>
          
          <motion.h2 
            className="text-4xl font-gothic text-red-900 mb-4 drop-shadow-[0_0_20px_rgba(139,0,0,1)]"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Summoning the Damned
          </motion.h2>
          
          <motion. div
            className="flex items-center justify-center gap-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-red-900 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration:  1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ✅ CRITICAL: Show paywall IMMEDIATELY after loading if no tokens (BLOCKS EVERYTHING)
  if (showPaywall || tokens === 0) {
   return <OuijaPaywall onUpgrade={() => navigate('/ouija-purchase')} />;
  }

  if (joiningRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950 flex items-center justify-center relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10"
          animate={{ rotate:  360 }}
          transition={{ duration: 20, repeat: Infinity, ease:  "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-[500px] h-[500px]">
            <polygon 
              points="50,10 20,90 90,35 10,35 80,90" 
              fill="none" 
              stroke="rgb(139, 0, 0)" 
              strokeWidth="0.5"
              transform="rotate(180 50 50)"
            />
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(139, 0, 0)" strokeWidth="0.5" />
          </svg>
        </motion.div>

        <motion.div 
          className="text-center z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity:  1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative inline-block mb-8">
            <motion. div
              className="w-32 h-32 border-2 border-red-900/30 border-t-red-900 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease:  "linear" }}
            />
            <Skull className="absolute inset-0 m-auto w-16 h-16 text-red-900 drop-shadow-[0_0_20px_rgba(139,0,0,0.8)]" />
          </div>
          
          <h2 className="text-4xl font-gothic text-red-900 mb-3 drop-shadow-[0_0_20px_rgba(139,0,0,1)]">
            Entering the Circle
          </h2>
          
          <p className="text-gray-400 text-lg">
            Blood offerings accepted... 
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <main className={cn(
      "min-h-screen bg-gradient-to-b from-gray-950 via-red-950/20 to-gray-950",
      "relative overflow-hidden"
    )}>
      {/* Inverted Pentagram Background */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease:  "linear" }}
      >
        <svg viewBox="0 0 100 100" className="w-[900px] h-[900px]">
          <polygon 
            points="50,10 20,90 90,35 10,35 80,90" 
            fill="none" 
            stroke="rgb(139, 0, 0)" 
            strokeWidth="0.3"
            transform="rotate(180 50 50)"
          />
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(139, 0, 0)" strokeWidth="0.3" />
        </svg>
      </motion.div>

      {/* Blood drip effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0"
            style={{ left: `${(i / 15) * 100}%` }}
            initial={{ y: -20 }}
            animate={{ 
              y: ["-20px", "100vh"],
              opacity: [0, 0.8, 0]
            }}
            transition={{ 
              duration:  4 + Math.random() * 6, 
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: "easeIn"
            }}
          >
            <Droplet className="w-2 h-2 text-red-900 fill-red-900" />
          </motion.div>
        ))}
      </div>

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {! room ?  (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-16">
                <motion.h1 
                  className="text-6xl md:text-8xl font-['Tangerine',_'Brush_Script_MT',_cursive] text-[rgb(139,0,0)] mb-6 drop-shadow-[0_0_50px_rgba(139,0,0,1)] tracking-wide"
                  style={{ fontWeight: 700 }}
                  animate={{ 
                    textShadow: [
                      "0 0 50px rgba(139,0,0,1), 0 0 30px rgba(139,0,0,0.8)",
                      "0 0 70px rgba(139,0,0,1), 0 0 50px rgba(139,0,0,0.9)",
                      "0 0 50px rgba(139,0,0,1), 0 0 30px rgba(139,0,0,0.8)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Infernal Ouija Chamber
                </motion.h1>
                
                <p className="text-2xl text-gray-400 italic font-serif">
                  Consult Darkness and the spirits of the Abyss
                </p>
              </div>

              <OuijaRoomSetup onRoomCreated={handleRoomCreated} userId={userId! } />
            </motion.div>
          ) : (
            <motion.div
              key="board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <OuijaBoard
                room={room}
                participants={participants}
                currentUserId={userId!}
                onExit={handleExitRoom}
                onRoomUpdate={setRoom}
                onParticipantsUpdate={setParticipants}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tangerine:wght@700&display=swap');
        
        html {
          scroll-behavior: smooth;
        }

        : :-webkit-scrollbar {
          width: 12px;
        }

        : :-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.5);
          border-radius: 6px;
        }

        : :-webkit-scrollbar-thumb {
          background: rgba(139, 0, 0, 0.6);
          border-radius: 6px;
          border: 2px solid rgba(0, 0, 0, 0.5);
        }

        : :-webkit-scrollbar-thumb: hover {
          background: rgba(139, 0, 0, 0.8);
        }
      `}</style>
    </main>
  );
};

export default OuijaRoom;