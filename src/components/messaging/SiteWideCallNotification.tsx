import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { webRTCService } from '@/lib/webRTC-Service';  // ✅ FIXED: Consistent casing
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PhoneOff, Video, Phone, ArrowRight, MessageCircle, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// ==================== INTERFACES ====================

interface RingtoneRef {
  audioContext: AudioContext;
  playBeep: () => void;
  stop: () => void;
}

interface IncomingCall {
  from: string;
  callId:  string;
  callType: 'audio' | 'video';
  timestamp: number;
  fromUser?:  {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    account_status?:  string;
  };
}

// ==================== RATE LIMITER ====================

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    const validAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      console.warn(`⚠️ [RATE LIMIT] ${key} exceeded ${maxAttempts} attempts in ${windowMs}ms`);
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
}

const rateLimiter = new RateLimiter();

// ==================== MAIN COMPONENT ====================

export function SiteWideCallNotification() {
  const { user } = useAuth();
  const userId = user?.id;
  
  const { toast } = useToast();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const ringtoneRef = useRef<RingtoneRef | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const webrtcInitRef = useRef(false);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== AUDIT LOGGING ====================

  const logAuditEvent = useCallback(async (action: string, details:  any) => {
    if (!userId) return;
    
    try {
      // ✅ FIXED: Removed audit_logs insert (table doesn't exist or schema mismatch)
      console.log(`📋 [AUDIT] ${action}: `, details);
    } catch (error) {
      console.error('❌ [AUDIT] Failed to log:', error);
    }
  }, [userId]);

  // ==================== RINGTONE INITIALIZATION ====================

  const initializeRingtone = useCallback(async () => {
    if (ringtoneRef.current) return true;
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.warn('⚠️ [RINGTONE] AudioContext not supported');
        return false;
      }

      const audioContext = new AudioContext();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      let currentOscillators:  OscillatorNode[] = [];
      
      const playBeep = () => {
        try {
          if (audioContext.state === 'suspended') {
            audioContext. resume().catch(console.error);
          }
          
          currentOscillators. forEach(osc => {
            try { osc.stop(); } catch (e) {}
          });
          currentOscillators = [];
          
          const oscillator1 = audioContext.createOscillator();
          const oscillator2 = audioContext. createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator1.connect(gainNode);
          oscillator2.connect(gainNode);
          gainNode. connect(audioContext.destination);
          
          oscillator1.frequency.value = 440;
          oscillator2.frequency.value = 480;
          oscillator1.type = 'sine';
          oscillator2.type = 'sine';
          
          const now = audioContext.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
          gainNode.gain.linearRampToValueAtTime(0.15, now + 0.4);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
          
          oscillator1.start(now);
          oscillator2.start(now);
          oscillator1.stop(now + 0.5);
          oscillator2.stop(now + 0.5);
          
          currentOscillators.push(oscillator1, oscillator2);
        } catch (err) {
          console.error('❌ [RINGTONE] Playback error:', err);
        }
      };
      
      const stop = () => {
        currentOscillators.forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
        currentOscillators = [];
      };
      
      ringtoneRef.current = { audioContext, playBeep, stop };
      setAudioEnabled(true);
      
      console.log('✅ [RINGTONE] Initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ [RINGTONE] Initialization failed:', error);
      return false;
    }
  }, []);

  // ==================== AUDIO PERMISSION ====================

  useEffect(() => {
    const enableAudio = () => {
      if (! audioEnabled) {
        initializeRingtone();
      }
    };

    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document. addEventListener(event, enableAudio, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, enableAudio);
      });
      
      if (ringtoneRef.current) {
        ringtoneRef.current. stop();
        ringtoneRef.current. audioContext.close().catch(console.error);
        ringtoneRef.current = null;
      }
    };
  }, [audioEnabled, initializeRingtone]);

  // ==================== RINGTONE PLAYBACK ====================

  useEffect(() => {
    if (incomingCall && ringtoneRef.current && audioEnabled) {
      const playRingtone = () => {
        if (ringtoneRef.current) {
          ringtoneRef. current.playBeep();
        }
      };
      
      playRingtone();
      
      ringIntervalRef.current = setInterval(() => {
        playRingtone();
        setTimeout(playRingtone, 600);
      }, 3000);
      
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
      }
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    }

    return () => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    };
  }, [incomingCall, audioEnabled]);

  // ==================== WEBRTC LISTENER ====================

  useEffect(() => {
    if (! userId || webrtcInitRef.current) return;
    
    // ✅ FIXED:  ALWAYS initialize WebRTC, just don't show UI if on /mensajes
    const isOnChatPage = window.location.pathname === '/mensajes';
    if (isOnChatPage) {
      console.log('📞 [SITE-WIDE] On /mensajes - WebRTC active but UI disabled (Chat.tsx handles it)');
    }
    
    webrtcInitRef.current = true;
    console.log('📞 [SITE-WIDE] Initializing for user:', userId);

    webRTCService.ensureInitialized().catch(err => {
      console. error('❌ [WEBRTC] Initialization failed:', err);
    });

    webRTCService.onCallRequest = async (from:  string, callId: string, callType: 'audio' | 'video') => {
      console.log('📞 [SITE-WIDE] Incoming call:', { from, callId, callType, currentPath: window.location.pathname });
      
      // ✅ FIXED: If on /mensajes, don't show this modal (Chat.tsx handles it)
      if (window.location.pathname === '/mensajes') {
        console.log('📞 [SITE-WIDE] Ignoring - Chat.tsx will handle');
        return;
      }
      
      if (! rateLimiter.check(`call-notification-${from}`, 5, 60000)) {
        console.warn('⚠️ [RATE LIMIT] Too many calls from:', from);
        toast({
          title: '⚠️ Demasiadas llamadas',
          description: 'Intenta de nuevo más tarde',
          variant: 'destructive',
        });
        return;
      }

      if (! ringtoneRef.current) {
        await initializeRingtone();
      }
      
      try {
                const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, account_status')
          .eq('id', from)
          .single();

        if (profileError) {
          console.error('❌ [PROFILE] Fetch error:', profileError);
        }

        // ✅ Type-safe profile with explicit typing
        const profile = profileData as {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          account_status?:  string;
        } | null;

        // ✅ Null-safe banned user check
        if (profile?. account_status === 'banned') {
          console.warn('⚠️ [SECURITY] Blocked call from banned user:', from);
          webRTCService.rejectCall(callId);
          return;
        }

        const callData:  IncomingCall = { 
          from, 
          callId, 
          callType, 
          timestamp: Date.now(),
          fromUser: profile || undefined 
        };

        setIncomingCall(callData);
        
        toast({
          title: '📞 LLAMADA ENTRANTE',
          description: `${profile?.full_name || profile?. username || 'Usuario'} te está llamando`,
          duration: 25000,
        });

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const notification = new Notification('📞 Llamada entrante - Mexichat', {
             body: `${(profile?.full_name || profile?.username) || 'Usuario'} te está llamando`,
icon: profile?.avatar_url || '/logo.png',
              badge: '/logo-badge.png',
              tag: callId,
              requireInteraction: true,
            });

            notification.onclick = () => {
              window.focus();
              notification.close();
              goToChat();
            };
          } catch (notifError) {
            console.warn('⚠️ [NOTIFICATION] Failed:', notifError);
          }
        }

        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }

        callTimeoutRef.current = setTimeout(() => {
          console.log('⏰ [TIMEOUT] Auto-dismissing call:', callId);
          dismissCall();
        }, 30000);

        await logAuditEvent('CALL_NOTIFICATION_SHOWN', {
          callId,
          callerId: from,
          callType,
        });

      } catch (error) {
        console.error('❌ [SITE-WIDE] Error processing call:', error);
        
        setIncomingCall({ from, callId, callType, timestamp: Date.now() });
        
        toast({
          title: '📞 Llamada entrante',
          description: 'Un usuario te está llamando',
          duration:  25000,
        });
      }
    };

    webRTCService.onCallEnd = () => {
      console.log('🔚 [SITE-WIDE] Call ended remotely');
      if (incomingCall) {
        dismissCall();
        toast({
          title: 'Llamada finalizada',
          description: 'El usuario canceló la llamada',
        });
      }
    };

    return () => {
      console.log('🔚 [SITE-WIDE] Cleanup');
      webrtcInitRef.current = false;
      
      if (callTimeoutRef. current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    };
  }, [userId, toast, initializeRingtone, logAuditEvent, incomingCall]);

  // ==================== GO TO CHAT ====================

  const goToChat = useCallback(() => {
    if (! incomingCall || isProcessing) return;

    setIsProcessing(true);

    console.log('✅ [REDIRECT] Going to /mensajes with call:', incomingCall.callId);

    if (ringtoneRef.current) {
      ringtoneRef.current. stop();
    }
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    try {
      sessionStorage.setItem('incomingCallNotification', JSON.stringify({
        from: incomingCall.from,
        callId: incomingCall.callId,
        callType: incomingCall.callType,
        fromUser: incomingCall.fromUser,
        timestamp: Date.now()
      }));
    } catch (storageError) {
      console.error('❌ [STORAGE] Failed to save call data:', storageError);
    }

    logAuditEvent('CALL_NOTIFICATION_ACCEPTED_REDIRECT', {
      callId: incomingCall.callId,
      callType: incomingCall.callType,
    });

    window.location.href = '/mensajes';
  }, [incomingCall, isProcessing, logAuditEvent]);

  // ==================== DISMISS CALL ====================

  const dismissCall = useCallback(async () => {
    if (!incomingCall || isProcessing) return;

    setIsProcessing(true);

    console.log('❌ [DISMISS] Rejecting call:', incomingCall. callId);

    if (ringtoneRef.current) {
      ringtoneRef.current. stop();
    }
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    try {
      // ✅ FIXED:  Removed active_calls table update (doesn't exist or wrong schema)
      // Just reject the call via WebRTC
      webRTCService.rejectCall(incomingCall.callId);

      await logAuditEvent('CALL_NOTIFICATION_DISMISSED', {
        callId: incomingCall.callId,
        callType: incomingCall.callType,
      });

      setIncomingCall(null);
      
      toast({
        title: 'Llamada ignorada',
        description: 'Puedes responder desde Mexichat',
      });

    } catch (error) {
      console.error('❌ [DISMISS] Error:', error);
      
      setIncomingCall(null);
      
      toast({
        title:  'Error al rechazar',
        description: 'La llamada se cerró localmente',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [incomingCall, isProcessing, logAuditEvent, toast]);

  // ==================== RENDER ====================

  if (!userId) return null;

  // ✅ FIXED: Don't render UI if on /mensajes (but WebRTC still listens)
  if (window.location.pathname === '/mensajes') {
    return null;
  }

  return (
    <Dialog open={!! incomingCall && !isProcessing} onOpenChange={() => ! isProcessing && dismissCall()}>
      <DialogContent 
       className="max-w-sm sm:max-w-md border-2 border-primary/20 shadow-2xl z-100"
        onEscapeKeyDown={(e) => {
          if (! isProcessing) dismissCall();
          else e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold flex items-center justify-center gap-2">
            <Phone className="w-5 h-5 text-primary animate-pulse" />
            Llamada entrante
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {incomingCall?. fromUser?.full_name || incomingCall?.fromUser?.username || 'Usuario'} te está llamando
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative">
            <Avatar className="w-24 h-24 ring-4 ring-primary/30 shadow-xl">
              <AvatarImage 
                src={incomingCall?.fromUser?.avatar_url || undefined}
                alt={incomingCall?.fromUser?.full_name || 'Usuario'}
              />
              <AvatarFallback className="text-2xl bg-primary/10 font-bold text-primary">
                {incomingCall?.fromUser?.full_name?.substring(0, 2).toUpperCase() || 
                 incomingCall?.fromUser?. username?.substring(0, 2).toUpperCase() || 
                 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-30" />
          </div>

          <div className="text-center space-y-1">
            <p className="font-bold text-lg">
              {incomingCall?. fromUser?.full_name || incomingCall?.fromUser?.username || 'Usuario'}
            </p>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              {incomingCall?.callType === 'video' ? (
                <>
                  <Video className="w-4 h-4 text-blue-600" />
                  <span>Videollamada</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>Llamada de voz</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1. 5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <Shield className="w-3 h-3 text-green-600" />
            <span>Llamada cifrada de extremo a extremo</span>
          </div>

          <p className="... border dark:border-blue-800">
            Haz clic en <strong>Mexichat</strong> para responder
          </p>

          <div className="flex gap-3 w-full mt-2">
            <Button
              size="lg"
              variant="outline"
              onClick={dismissCall}
              disabled={isProcessing}
              className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Ignorar
            </Button>
            <Button
              size="lg"
              onClick={goToChat}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Mexichat
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
              <span>Procesando...</span>
            </div>
          )}
        </div>

        <div className="absolute inset-0 border-2 border-primary/50 rounded-lg animate-pulse opacity-20 pointer-events-none" />
      </DialogContent>
    </Dialog>
  );
}