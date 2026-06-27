import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessageAlertProps {
  userId: string;
  activeThreadId: string | null;
}

export function MessageAlert({ userId, activeThreadId }: MessageAlertProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/assets/sfx/new-message.mp3');
    audioRef.current.volume = 0.5;

    const channel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `sender_id=neq.${userId}`
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Only show notification if message is not from active thread
          if (message.chat_id !== activeThreadId) {
            // Get sender info
            const { data: chat } = await supabase
              .from('conversations')
              .select('user_1, user_2')
              .eq('id', message.chat_id)
              .single();

            if (chat) {
              const senderId = chat.user_1 === userId ? chat.user_2 : chat.user_1;
              const { data: sender } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', senderId)
                .single();

              // Play notification sound
              try {
                await audioRef.current?.play();
              } catch (e) {
                // Autoplay blocked
              }

              // Vibrate if supported
              if (navigator.vibrate) {
                navigator.vibrate(200);
              }

              // Show toast
              toast({
                title: `Nuevo mensaje de ${sender?.full_name || 'Usuario'}`,
                description: '🔒 Mensaje cifrado',
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, activeThreadId, toast]);

  return null;
}
