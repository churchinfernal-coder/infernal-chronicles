import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, Video, PhoneIncoming, PhoneMissed, PhoneOutgoing } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CallLog {
  id: string;
  caller_id: string;
  receiver_id: string;
  type: 'voice' | 'video';
  duration: number;
  status: 'completed' | 'missed' | 'declined';
  created_at: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  is_incoming: boolean;
}

interface RecentCallsProps {
  userId: string;
}

export function RecentCalls({ userId }: RecentCallsProps) {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [missedCount, setMissedCount] = useState(0);

  useEffect(() => {
    fetchCalls();

    // Subscribe to new call logs
    const channel = supabase
      .channel('call_logs_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_logs',
        },
        () => {
          fetchCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchCalls = async () => {
    try {
      const { data: callsData, error } = await supabase
        .from('call_logs')
        .select('*')
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Fetch other user profiles
      const enrichedCalls = await Promise.all(
        (callsData || []).map(async (call) => {
          const isIncoming = call.receiver_id === userId;
          const otherUserId = isIncoming ? call.caller_id : call.receiver_id;

          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          return {
            ...call,
            type: call.type as 'voice' | 'video',
            status: call.status as 'completed' | 'missed' | 'declined',
            other_user: profileData || { id: otherUserId, full_name: 'Usuario', avatar_url: null },
            is_incoming: isIncoming,
          };
        })
      );

      setCalls(enrichedCalls);

      // Count missed incoming calls
      const missed = enrichedCalls.filter(
        call => call.status === 'missed' && call.is_incoming
      ).length;
      setMissedCount(missed);

    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (call: CallLog) => {
    if (call.status === 'missed' && call.is_incoming) {
      return <PhoneMissed className="w-4 h-4 text-red-500" />;
    } else if (call.is_incoming) {
      return <PhoneIncoming className="w-4 h-4 text-green-500" />;
    } else {
      return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay llamadas recientes</p>
      </div>
    );
  }

  return (
    <div>
      {missedCount > 0 && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-950 rounded-lg flex items-center justify-between">
          <span className="text-sm text-red-700 dark:text-red-300 font-medium">
            Llamadas perdidas
          </span>
          <Badge variant="destructive" className="ml-2">
            {missedCount}
          </Badge>
        </div>
      )}

      <div className="space-y-2">
        {calls.map((call) => (
          <div
            key={call.id}
            className={`p-3 rounded-lg hover:bg-accent transition-colors ${
              call.status === 'missed' && call.is_incoming ? 'bg-red-50 dark:bg-red-950/20' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={call.other_user.avatar_url || undefined} />
                <AvatarFallback>
                  {call.other_user.full_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate text-sm">
                    {call.other_user.full_name}
                  </p>
                  {call.type === 'video' ? (
                    <Video className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Phone className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {getCallIcon(call)}
                  <span>
                    {call.status === 'missed' && call.is_incoming
                      ? 'Perdida'
                      : call.status === 'declined'
                      ? 'Rechazada'
                      : formatDuration(call.duration)}
                  </span>
                  <span>·</span>
                  <span>
                    {formatDistanceToNow(new Date(call.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
