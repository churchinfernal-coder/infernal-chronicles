import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OuijaBoard } from "@/components/OuijaBoard";
import { OuijaRoomSetup } from "@/components/OuijaRoomSetup";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

interface RoomData {
  id: string;
  host_user_id: string;
  invite_code: string;
  questions_asked: number;
  max_questions: number;
  current_turn_user_id: string | null;
  status: string;
}

interface Participant {
  id: string;
  user_id: string;
  turn_order: number;
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
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    const inviteCode = searchParams.get("invite");
    if (inviteCode) {
      joinRoomByInvite(inviteCode);
    }
  }, [userId, searchParams]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    setLoading(false);
  };

  const joinRoomByInvite = async (inviteCode: string) => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from("ouija_rooms")
        .select("*")
        .eq("invite_code", inviteCode)
        .eq("status", "active")
        .single();

      if (roomError || !roomData) {
        toast({
          title: "Invalid Invite",
          description: "This room doesn't exist or has ended.",
          variant: "destructive",
        });
        return;
      }

      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from("ouija_participants")
        .select("*")
        .eq("room_id", roomData.id)
        .eq("user_id", userId)
        .single();

      if (!existingParticipant) {
        // Get current participant count
        const { count } = await supabase
          .from("ouija_participants")
          .select("*", { count: "exact", head: true })
          .eq("room_id", roomData.id);

        if ((count || 0) >= 6) {
          toast({
            title: "Room Full",
            description: "This room already has the maximum 6 participants.",
            variant: "destructive",
          });
          return;
        }

        // Add as participant
        await supabase.from("ouija_participants").insert({
          room_id: roomData.id,
          user_id: userId,
          turn_order: (count || 0) + 1,
        });
      }

      setRoom(roomData);
      loadParticipants(roomData.id);
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const loadParticipants = async (roomId: string) => {
    const { data } = await supabase
      .from("ouija_participants")
      .select("*")
      .eq("room_id", roomId)
      .order("turn_order");

    if (data) {
      // Fetch profile data separately for each participant
      const participantsWithProfiles = await Promise.all(
        data.map(async (participant) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("user_id", participant.user_id)
            .single();
          
          return {
            ...participant,
            profiles: profile
          };
        })
      );
      
      setParticipants(participantsWithProfiles);
    }
  };

  const handleRoomCreated = async (roomData: RoomData) => {
    setRoom(roomData);
    await loadParticipants(roomData.id);
    setupRealtimeSync(roomData.id);
  };

  const setupRealtimeSync = (roomId: string) => {
    // Subscribe to room updates
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
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadParticipants(roomId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ouija_questions',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Trigger reload in OuijaBoard component
          sonnerToast.success('New spirit response received', {
            duration: 2000,
          });
        }
      )
      .subscribe();

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
    setRoom(null);
    setParticipants([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {!room ? (
        <OuijaRoomSetup onRoomCreated={handleRoomCreated} userId={userId!} />
      ) : (
        <OuijaBoard
            room={room}
            participants={participants}
            currentUserId={userId!}
            onExit={handleExitRoom}
            onRoomUpdate={setRoom}
            onParticipantsUpdate={setParticipants}
        />
      )}
    </main>
  );
};

export default OuijaRoom;
