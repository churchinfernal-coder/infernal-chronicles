import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, Loader2, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface IncomingCallNotificationProps {
  userId: string;
}

interface CallerProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface IncomingCall {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'voice' | 'video';
  status: string;
  created_at: string;
}

interface RingtoneController {
  audioContext: AudioContext;
  playBeep: () => void;
  stop: () => void;
}

/**
 * Enterprise-Grade Site-Wide Incoming Call Notification
 * - Web Audio API ringtone (no external files)
 * - Real-time Supabase subscriptions
 * - Auto-decline after timeout
 * - Browser notifications
 * - Mobile vibration
 * - Accessibility compliant (ARIA labels, keyboard navigation)
 * - Memory leak prevention
 * - Error handling and fallbacks
 * - Duplicate action prevention
 */
export function IncomingCallNotification({ userId }: IncomingCallNotificationProps) {
  console.log('[CALL-NOTIFICATION] 🎯 Component mounted, userId:', userId);
  
  const { toast } = useToast();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callerProfile, setCallerProfile] = useState<CallerProfile | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const ringtoneRef = useRef<RingtoneController | null>(null);
  const ringIntervalRef = useRef<NodeJS. Timeout | null>(null);
  const missedCallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const browserNotificationRef = useRef<Notification | null>(null);

  /**
   * Initialize Web Audio API ringtone
   */
  const initializeRingtone = useCallback(() => {
    console.log('[CALL-NOTIFICATION] 📱 Initializing Web Audio API ringtone');
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!AudioContext) {
        console.error('[CALL-NOTIFICATION] ❌ Web Audio API not supported');
        setAudioReady(true);
        return;
      }

      const audioContext = new AudioContext();
      let currentOscillators: OscillatorNode[] = [];
      
      const playBeep = () => {
        try {
          // Resume context if suspended (autoplay policy)
          if (audioContext. state === 'suspended') {
            audioContext.resume(). catch(err => {
              console.warn('[CALL-NOTIFICATION] ⚠️ Could not resume AudioContext:', err);
            });
          }
          
          // Stop any currently playing oscillators
          currentOscillators. forEach(osc => {
            try {
              osc.stop();
            } catch (e) {
              // Already stopped
            }
          });
          currentOscillators = [];
          
          // Create dual-tone ringtone (classic phone ring)
          const oscillator1 = audioContext.createOscillator();
          const oscillator2 = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator1.connect(gainNode);
          oscillator2.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Classic phone ring frequencies
          oscillator1.frequency.value = 440; // A4 note
          oscillator2.frequency. value = 480; // Slightly sharp for richness
          oscillator1.type = 'sine';
          oscillator2.type = 'sine';
          
          // Envelope: attack, sustain, release
          const now = audioContext.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05); // Attack
          gainNode.gain.linearRampToValueAtTime(0.15, now + 0.4);  // Sustain
          gainNode.gain.linearRampToValueAtTime(0, now + 0.5);     // Release
          
          oscillator1.start(now);
          oscillator2. start(now);
          oscillator1.stop(now + 0.5);
          oscillator2.stop(now + 0.5);
          
          currentOscillators. push(oscillator1, oscillator2);
          
          console.log('[CALL-NOTIFICATION] 🔊 Ringtone beep played');
        } catch (err) {
          console.error('[CALL-NOTIFICATION] ❌ Error playing beep:', err);
        }
      };
      
      const stop = () => {
        currentOscillators.forEach(osc => {
          try {
            osc.stop();
          } catch (e) {
            // Already stopped
          }
        });
        currentOscillators = [];
        console.log('[CALL-NOTIFICATION] 🔇 Ringtone stopped');
      };
      
      ringtoneRef.current = {
        audioContext,
        playBeep,
        stop
      };
      
      setAudioReady(true);
      console.log('[CALL-NOTIFICATION] ✅ Ringtone ready (Web Audio API)');
      
    } catch (error) {
      console.error('[CALL-NOTIFICATION] ❌ Error creating Web Audio ringtone:', error);
      setAudioReady(true); // Continue without audio
    }
  }, []);

  /**
   * Cleanup all resources
   */
  const cleanup = useCallback(() => {
    console.log('[CALL-NOTIFICATION] 🧹 Cleaning up resources');
    
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
      ringtoneRef.current. audioContext.close(). catch(() => {});
      ringtoneRef.current = null;
    }
    
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    
    if (missedCallTimeoutRef.current) {
      clearTimeout(missedCallTimeoutRef.current);
      missedCallTimeoutRef. current = null;
    }
    
    if (browserNotificationRef.current) {
      browserNotificationRef.current. close();
      browserNotificationRef.current = null;
    }
  }, []);

  /**
   * Play ringtone with pattern
   */
  const startRingtone = useCallback(() => {
    if (!audioReady || !ringtoneRef.current) return;
    
    console.log('[CALL-NOTIFICATION] 🔊 Starting ringtone pattern');
    
    const playRingtone = () => {
      if (ringtoneRef.current) {
        try {
          ringtoneRef. current.playBeep();
        } catch (err: any) {
          console.error('[CALL-NOTIFICATION] ❌ Error playing ringtone:', err. message);
        }
      }
    };
    
    // Play immediately
    playRingtone();
    
    // Repeat: double-beep pattern (ring-ring... pause... ring-ring)
    ringIntervalRef.current = setInterval(() => {
      playRingtone();
      setTimeout(playRingtone, 600); // Second beep after 600ms
    }, 3000); // Repeat every 3 seconds
    
  }, [audioReady]);

  /**
   * Stop ringtone
   */
  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current. stop();
    }
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  }, []);

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.warn('[CALL-NOTIFICATION] ⚠️ Could not request notification permission:', err);
      }
    }
  }, []);

  /**
   * Show browser notification
   */
  const showBrowserNotification = useCallback((profile: CallerProfile, callType: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        browserNotificationRef.current = new Notification('📞 Llamada entrante', {
          body: `${profile.full_name || profile.username || 'Usuario'} te está llamando`,
          icon: profile. avatar_url || '/logo.png',
          tag: `call-${Date.now()}`,
          requireInteraction: true,
        });
        
        console.log('[CALL-NOTIFICATION] 🔔 Browser notification shown');
      } catch (err) {
        console.warn('[CALL-NOTIFICATION] ⚠️ Could not show browser notification:', err);
      }
    }
  }, []);

  /**
   * Vibrate device (mobile)
   */
  const vibrateDevice = useCallback(() => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 200]);
        console.log('[CALL-NOTIFICATION] 📳 Device vibration triggered');
      } catch (err) {
        console.warn('[CALL-NOTIFICATION] ⚠️ Could not vibrate device:', err);
      }
    }
  }, []);

  /**
   * Handle incoming call
   */
  const handleIncomingCall = useCallback(async (call: IncomingCall) => {
    if (!isMountedRef.current) return;
    
    console.log('[CALL-NOTIFICATION] 📞 Processing incoming call:', call.id);
    setHasError(false);
    
    try {
      // Fetch caller profile
      const { data: profile, error } = await supabase
        . from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', call.caller_id)
        .single();

      if (error) {
        console.error('[CALL-NOTIFICATION] ❌ Error fetching caller profile:', error);
        setHasError(true);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la información del llamante',
          variant: 'destructive',
        });
        return;
      }

      if (!isMountedRef.current) return;

      console.log('[CALL-NOTIFICATION] 👤 Caller profile loaded:', profile. full_name || profile.username);
      setCallerProfile(profile);
      setIncomingCall(call);

      // Start ringtone
      startRingtone();

      // Request notification permission
      await requestNotificationPermission();

      // Show browser notification
      showBrowserNotification(profile, call.call_type);

      // Vibrate device
      vibrateDevice();

      // Show toast notification
      toast({
        title: '📞 LLAMADA ENTRANTE',
        description: `${profile.full_name || profile.username || 'Usuario'} te está llamando`,
        duration: 10000,
      });

      // Set missed call timeout (30 seconds)
      missedCallTimeoutRef.current = setTimeout(async () => {
        console. log('[CALL-NOTIFICATION] ⏰ Call timeout - marking as missed');
        
        try {
          await supabase
            .from('active_calls')
            .update({ 
              status: 'missed',
              ended_at: new Date().toISOString()
            })
            .eq('id', call.id);
          
          if (isMountedRef.current) {
            setIncomingCall(null);
            setCallerProfile(null);
            stopRingtone();
            
            toast({
              title: 'Llamada perdida',
              description: `Llamada perdida de ${profile.full_name || profile.username}`,
              variant: 'destructive',
            });
          }
        } catch (err) {
          console.error('[CALL-NOTIFICATION] ❌ Error marking call as missed:', err);
        }
      }, 30000);

    } catch (error) {
      console.error('[CALL-NOTIFICATION] ❌ Error processing incoming call:', error);
      if (isMountedRef.current) {
        setHasError(true);
        toast({
          title: 'Error',
          description: 'Error al procesar la llamada entrante',
          variant: 'destructive',
        });
      }
    }
  }, [startRingtone, stopRingtone, requestNotificationPermission, showBrowserNotification, vibrateDevice, toast]);

  /**
   * Accept call
   */
  const acceptCall = useCallback(async () => {
    if (!incomingCall || isConnecting || isDeclining) {
      console.log('[CALL-NOTIFICATION] ⚠️ Cannot accept call - already processing');
      return;
    }

    console.log('[CALL-NOTIFICATION] ✅ Accepting call:', incomingCall.id);
    setIsConnecting(true);
    stopRingtone();
    
    if (missedCallTimeoutRef.current) {
      clearTimeout(missedCallTimeoutRef.current);
      missedCallTimeoutRef. current = null;
    }

    try {
      const { error } = await supabase
        .from('active_calls')
        .update({ status: 'connecting' })
        .eq('id', incomingCall.id);

      if (error) {
        console.error('[CALL-NOTIFICATION] ❌ Error updating call status:', error);
        throw error;
      }

      console.log('[CALL-NOTIFICATION] 📞 Call status updated to connecting, redirecting.. .');
      
      // Redirect with query param for auto-accept
      window.location.href = `/mensajes? acceptCall=${incomingCall.id}`;
      
    } catch (error: any) {
      console.error('[CALL-NOTIFICATION] ❌ Error accepting call:', error);
      setIsConnecting(false);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aceptar la llamada',
        variant: 'destructive',
      });
    }
  }, [incomingCall, isConnecting, isDeclining, stopRingtone, toast]);

  /**
   * Reject call
   */
  const rejectCall = useCallback(async () => {
    if (!incomingCall || isDeclining || isConnecting) {
      console.log('[CALL-NOTIFICATION] ⚠️ Cannot reject call - already processing');
      return;
    }

    console.log('[CALL-NOTIFICATION] ❌ Rejecting call:', incomingCall.id);
    setIsDeclining(true);
    stopRingtone();
    
    if (missedCallTimeoutRef.current) {
      clearTimeout(missedCallTimeoutRef.current);
      missedCallTimeoutRef.current = null;
    }

    try {
      // Update call status to rejected
      await supabase
        .from('active_calls')
        .update({ 
          status: 'rejected',
          ended_at: new Date().toISOString(),
        })
        .eq('id', incomingCall.id);

      // Send rejection signal (non-critical)
      try {
        await supabase. from('call_signals').insert({
          call_id: incomingCall. id,
          sender_id: userId,
          receiver_id: incomingCall. caller_id,
          signal_type: 'reject',
          signal_data: { reason: 'user_rejected', timestamp: new Date().toISOString() },
        });
      } catch (signalErr) {
        console.warn('[CALL-NOTIFICATION] ⚠️ Could not send rejection signal:', signalErr);
      }

      // Create call log (non-critical)
      try {
        await supabase. from('call_logs').insert({
          caller_id: incomingCall. caller_id,
          receiver_id: incomingCall. receiver_id,
          type: incomingCall.call_type,
          duration: 0,
          status: 'declined',
        });
      } catch (logErr) {
        console.warn('[CALL-NOTIFICATION] ⚠️ Could not create call log:', logErr);
      }

      console.log('[CALL-NOTIFICATION] ✅ Call rejected successfully');
      
      toast({
        title: 'Llamada rechazada',
        description: 'Has rechazado la llamada',
      });

    } catch (error: any) {
      console.error('[CALL-NOTIFICATION] ❌ Error rejecting call:', error);
      toast({
        title: 'Error',
        description: 'Error al rechazar la llamada',
        variant: 'destructive',
      });
    } finally {
      setIncomingCall(null);
      setCallerProfile(null);
      setIsConnecting(false);
      setIsDeclining(false);
    }
  }, [incomingCall, isDeclining, isConnecting, userId, stopRingtone, toast]);

  /**
   * Initialize ringtone on mount
   */
  useEffect(() => {
    initializeRingtone();
    
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [initializeRingtone, cleanup]);

  /**
   * Subscribe to incoming calls
   */
  useEffect(() => {
    if (!userId) {
      console.warn('[CALL-NOTIFICATION] ⚠️ No userId provided');
      return;
    }

    console.log('[CALL-NOTIFICATION] 📞 Setting up incoming call listener for user:', userId);

    const channelName = `incoming-calls-${userId}-${Date.now()}`;

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: userId }
        }
      })
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'active_calls',
          filter: `receiver_id=eq.${userId}`,
        } as any,
        (payload: any) => {
          const call = payload.new;
          if (call.status === 'ringing') {
            handleIncomingCall(call);
          }
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'active_calls',
          filter: `receiver_id=eq.${userId}`,
        } as any,
        async (payload: any) => {
          const call = payload.new;
          console.log('[CALL-NOTIFICATION] 📞 Call status updated:', call.status);
          
          if ((call.status === 'ended' || call.status === 'cancelled' || call.status === 'rejected') && 
              incomingCall?. id === call.id) {
            console.log('[CALL-NOTIFICATION] 📞 Call ended by caller');
            
            stopRingtone();
            
            if (missedCallTimeoutRef.current) {
              clearTimeout(missedCallTimeoutRef.current);
              missedCallTimeoutRef.current = null;
            }
            
            setIncomingCall(null);
            setCallerProfile(null);
            setIsConnecting(false);
            setIsDeclining(false);
            
            if (call.status !== 'rejected') {
              toast({
                title: 'Llamada finalizada',
                description: 'El llamador finalizó la llamada',
                variant: 'destructive',
              });
            }
          }
        }
      )
      .subscribe((status: string) => {
        console.log('[CALL-NOTIFICATION] 📞 Channel subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[CALL-NOTIFICATION] ✅ Successfully subscribed to incoming calls channel');
        }
      });

    return () => {
      console.log('[CALL-NOTIFICATION] 📞 Cleaning up call listener');
      supabase.removeChannel(channel);
    };
  }, [userId, incomingCall, handleIncomingCall, stopRingtone, toast]);

  /**
   * Keyboard navigation
   */
  useEffect(() => {
    if (! incomingCall) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        acceptCall();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        rejectCall();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [incomingCall, acceptCall, rejectCall]);

  // Don't render if no user
  if (!userId) {
    console.warn('[CALL-NOTIFICATION] ⚠️ No userId, not rendering');
    return null;
  }

  return (
    <Dialog 
      open={!! incomingCall} 
      onOpenChange={() => ! isConnecting && !isDeclining && rejectCall()}
    >
      <DialogContent 
        className="max-w-md z-[9999] sm:max-w-lg"
        aria-describedby="incoming-call-description"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold" id="incoming-call-title">
            📞 Llamada entrante
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-8" id="incoming-call-description">
          {/* Animated Avatar */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <div className="w-32 h-32 rounded-full ring-4 ring-green-500 opacity-50" />
            </div>
            <Avatar className="w-32 h-32 ring-4 ring-green-500 animate-pulse shadow-lg relative z-10">
              {! hasError && callerProfile?.avatar_url && (
                <AvatarImage 
                  src={callerProfile.avatar_url} 
                  alt={`Avatar de ${callerProfile.full_name || callerProfile.username || 'Usuario'}`}
                />
              )}
              <AvatarFallback className="text-3xl bg-green-100 font-bold">
                {hasError ? (
                  <AlertCircle className="w-12 h-12 text-destructive" />
                ) : (
                  callerProfile?.full_name?. substring(0, 2). toUpperCase() || 
                  callerProfile?.username?. substring(0, 2).toUpperCase() || 
                  'U'
                )}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller Info */}
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold truncate max-w-full px-4">
              {callerProfile?.full_name || callerProfile?.username || 'Usuario'}
            </p>
            <p className="text-base text-muted-foreground flex items-center justify-center gap-2">
              {incomingCall?.call_type === 'video' ?  (
                <>
                  <Video className="w-5 h-5" aria-hidden="true" />
                  <span>Videollamada</span>
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  <span>Llamada de voz</span>
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground animate-pulse font-semibold mt-4" aria-live="polite">
              {isConnecting ? '🔄 Conectando.. .' : isDeclining ? '❌ Rechazando...' : '🔔 Llamando...'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 sm:gap-6 mt-4">
            <Button
              size="lg"
              variant="destructive"
              onClick={rejectCall}
              disabled={isConnecting || isDeclining}
              className="rounded-full px-8 sm:px-10 py-6 text-lg font-semibold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Rechazar llamada (Presiona Escape)"
            >
              <PhoneOff className="w-6 h-6 mr-2" aria-hidden="true" />
              {isDeclining ? 'Rechazando...' : 'Rechazar'}
            </Button>
            <Button
              size="lg"
              onClick={acceptCall}
              disabled={isConnecting || isDeclining || hasError}
              className="rounded-full px-8 sm:px-10 py-6 text-lg font-semibold bg-green-600 hover:bg-green-700 shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Aceptar llamada (Presiona Enter o Espacio)"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" aria-hidden="true" />
                  Conectando...
                </>
              ) : (
                <>
                  <Phone className="w-6 h-6 mr-2" aria-hidden="true" />
                  Aceptar
                </>
              )}
            </Button>
          </div>

          {/* Keyboard Hints */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">Enter</kbd> para aceptar · 
              <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded ml-1">Esc</kbd> para rechazar
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default IncomingCallNotification;