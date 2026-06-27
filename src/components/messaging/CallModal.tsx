import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  userId: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  callType: 'audio' | 'video';
  isInitiator: boolean;
  activeCallId?: string;
}

export function CallModal({
  open,
  onOpenChange,
  chatId,
  userId,
  otherUser,
  callType,
  isInitiator,
  activeCallId: initialCallId,
}: CallModalProps) {
  const { toast } = useToast();
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidate[]>([]);
  const signalChannelCleanupRef = useRef<(() => void) | null>(null);
  const callLockRef = useRef<boolean>(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    if (open) {
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [open]);

  const initializeCall = async () => {
    try {
      // Check browser compatibility
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta llamadas. Por favor usa Chrome, Firefox o Safari.');
      }

      // Get user media with explicit error handling
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      }).catch((err) => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error('Debes permitir acceso al micrófono y cámara para hacer llamadas.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          throw new Error('No se encontró micrófono o cámara. Verifica tus dispositivos.');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          throw new Error('No se puede acceder al micrófono o cámara. Puede estar siendo usado por otra aplicación.');
        } else {
          throw new Error('Error al acceder a los dispositivos: ' + err.message);
        }
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection with improved ICE servers
      const configuration: RTCConfiguration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        if (peerConnection.iceConnectionState === 'failed') {
          peerConnection.restartIce();
        } else if (peerConnection.iceConnectionState === 'disconnected') {
          toast({
            title: 'Conexión inestable',
            description: 'Intentando reconectar...',
          });
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
          const callId = activeCallId || initialCallId;
          if (callId) {
            await supabase.from('call_signals').insert({
              call_id: callId,
              sender_id: userId,
              receiver_id: otherUser.id,
              signal_type: 'ice_candidate',
              signal_data: { candidate: event.candidate },
            } as any);
          }
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = async () => {
        if (peerConnection.connectionState === 'connected') {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          callLockRef.current = false;
          
          setCallStatus('connected');
          
          const callId = activeCallId || initialCallId;
          if (callId) {
            await supabase
              .from('active_calls')
              .update({ status: 'active', started_at: new Date().toISOString() })
              .eq('id', callId);
          }
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          if (retryCountRef.current < MAX_RETRIES && peerConnection.connectionState === 'failed') {
            retryCountRef.current++;
            callLockRef.current = false;
            
            toast({
              title: 'Reintentando conexión',
              description: `Intento ${retryCountRef.current} de ${MAX_RETRIES}`,
            });
            
            peerConnection.restartIce();
            return;
          }
          
          callLockRef.current = false;
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          endCall();
        }
      };

      // Failsafe timeout: 45 seconds for user to accept and connect
      connectionTimeoutRef.current = setTimeout(async () => {
        if (peerConnection.connectionState !== 'connected') {
          callLockRef.current = false;
          
          // Create missed call notification for the receiver - with ALL required fields
          if (isInitiator && activeCallId) {
            await supabase.from('notifications').insert({
              user_id: otherUser.id,
              from_user_id: userId, // ✅ Added missing required field
              type: 'missed_call',
              title: 'Llamada perdida',
              message: `Llamada ${callType === 'video' ? 'de video' : 'de voz'} perdida`,
              is_read: false, // ✅ Added default value
            });
          }
          
          toast({
            title: 'Llamada sin respuesta',
            description: 'El usuario no respondió a tiempo',
            variant: 'destructive',
          });
          endCall();
        }
      }, 45000);

      // Subscribe to call signals first
      subscribeToSignals(peerConnection);

      if (isInitiator) {
        await initiateCall(peerConnection);
      } else {
        // Receiver: set the call ID and fetch any existing signals
        if (initialCallId) {
          setActiveCallId(initialCallId);
          
          // Fetch existing signals that were sent before we subscribed
          const { data: existingSignals } = await supabase
            .from('call_signals')
            .select('*')
            .eq('call_id', initialCallId)
            .eq('receiver_id', userId)
            .order('created_at', { ascending: true });

          if (existingSignals && existingSignals.length > 0) {
            // Process signals in order
            for (const signal of existingSignals) {
              try {
                if (signal.signal_type === 'offer') {
                  const offerData = signal.signal_data as unknown as { offer: RTCSessionDescriptionInit };
                  await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(offerData.offer)
                  );

                  // Create and send answer
                  const answer = await peerConnection.createAnswer();
                  await peerConnection.setLocalDescription(answer);

                  await supabase.from('call_signals').insert({
                    call_id: initialCallId,
                    sender_id: userId,
                    receiver_id: otherUser.id,
                    signal_type: 'answer',
                    signal_data: { answer },
                  } as any);

                } else if (signal.signal_type === 'ice_candidate') {
                  const candidateData = signal.signal_data as unknown as { candidate: RTCIceCandidateInit };
                  const candidate = new RTCIceCandidate(candidateData.candidate);
                  if (peerConnection.remoteDescription) {
                    await peerConnection.addIceCandidate(candidate);
                  } else {
                    iceCandidatesQueueRef.current.push(candidate);
                  }
                }
              } catch (err) {
                console.error('Error processing existing signal:', err);
              }
            }
          }
        }
      }

    } catch (error: any) {
      toast({
        title: '❌ Error al iniciar llamada',
        description: error.message || 'No se pudo iniciar la llamada. Verifica permisos de micrófono/cámara.',
        variant: 'destructive',
        duration: 10000,
      });
      
      // Log error to database for debugging - only if audit_logs table exists
      try {
        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'call_error',
          entity_type: 'call',
          changes: {
            error: error.message,
            error_name: error.name,
            call_type: callType,
            is_initiator: isInitiator,
          },
        });
      } catch (logError) {
        // Silently fail if audit_logs table doesn't exist
      }
      
      onOpenChange(false);
    }
  };

  const initiateCall = async (peerConnection: RTCPeerConnection) => {
    if (callLockRef.current) {
      return;
    }
    
    callLockRef.current = true;

    try {
      // Create active call record
      const { data: callData, error: callError } = await supabase
        .from('active_calls')
        .insert({
          caller_id: userId,
          receiver_id: otherUser.id,
          call_type: callType,
          status: 'ringing',
        })
        .select()
        .single();

      if (callError) {
        throw new Error('Error al crear la llamada en la base de datos: ' + callError.message);
      }
      
      setActiveCallId(callData.id);

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const { error: signalError } = await supabase.from('call_signals').insert({
        call_id: callData.id,
        sender_id: userId,
        receiver_id: otherUser.id,
        signal_type: 'offer',
        signal_data: { offer },
      } as any);

      if (signalError) {
        throw new Error('Error al enviar señal de llamada: ' + signalError.message);
      }

    } catch (error: any) {
      callLockRef.current = false;
      toast({
        title: 'Error al iniciar llamada',
        description: error.message || 'No se pudo establecer la conexión',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const subscribeToSignals = (peerConnection: RTCPeerConnection) => {
    const channel = supabase
      .channel(`call_signals_${chatId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload: any) => {
          const signal = payload.new;

          try {
            if (!peerConnectionRef.current) {
              return;
            }

            if (signal.signal_type === 'offer') {
              setActiveCallId(signal.call_id);
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(signal.signal_data.offer)
              );

              // Process queued ICE candidates
              for (const candidate of iceCandidatesQueueRef.current) {
                await peerConnection.addIceCandidate(candidate);
              }
              iceCandidatesQueueRef.current = [];

              // Create and send answer
              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);

              await supabase.from('call_signals').insert({
                call_id: signal.call_id,
                sender_id: userId,
                receiver_id: otherUser.id,
                signal_type: 'answer',
                signal_data: { answer },
              } as any);

            } else if (signal.signal_type === 'answer') {
              if (!peerConnectionRef.current) {
                return;
              }
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(signal.signal_data.answer)
              );

            } else if (signal.signal_type === 'ice_candidate') {
              const candidate = new RTCIceCandidate(signal.signal_data.candidate);
              
              if (peerConnection.remoteDescription) {
                await peerConnection.addIceCandidate(candidate);
              } else {
                iceCandidatesQueueRef.current.push(candidate);
              }
            }
          } catch (error) {
            console.error('Error processing signal:', error);
            toast({
              title: 'Error en la llamada',
              description: 'Hubo un problema con la conexión',
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    const cleanup = () => {
      supabase.removeChannel(channel);
    };

    signalChannelCleanupRef.current = cleanup;
    return cleanup;
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    setCallStatus('ended');
    
    if (activeCallId) {
      // Calculate call duration
      const { data: callData } = await supabase
        .from('active_calls')
        .select('started_at')
        .eq('id', activeCallId)
        .single();

      let duration = 0;
      if (callData?.started_at && callStatus === 'connected') {
        const startTime = new Date(callData.started_at).getTime();
        const endTime = Date.now();
        duration = Math.floor((endTime - startTime) / 1000);
      }

      // Update active call
      await supabase
        .from('active_calls')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', activeCallId);

      // Create call log - only if call_logs table exists
      try {
        const { data: activeCall } = await supabase
          .from('active_calls')
          .select('caller_id, receiver_id, call_type')
          .eq('id', activeCallId)
          .single();

        if (activeCall) {
          await supabase.from('call_logs').insert({
            caller_id: activeCall.caller_id,
            receiver_id: activeCall.receiver_id,
            type: activeCall.call_type,
            duration,
            status: callStatus === 'connected' ? 'completed' : 'missed',
          });
        }
      } catch (error) {
        // Silently fail if call_logs table doesn't exist
      }
    }

    cleanup();
    onOpenChange(false);
  };

  const cleanup = () => {
    // Clear timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // Release call lock and reset retry count
    callLockRef.current = false;
    retryCountRef.current = 0;

    // Clean up signal subscription first
    if (signalChannelCleanupRef.current) {
      signalChannelCleanupRef.current();
      signalChannelCleanupRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] p-0">
        <div className="relative h-full bg-black rounded-lg overflow-hidden">
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Local Video (Picture-in-Picture) */}
          {callType === 'video' && (
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call Status Overlay */}
          {callStatus === 'connecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={otherUser?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {(otherUser?.full_name || 'U').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-xl font-semibold mb-2">
                {otherUser?.full_name || 'Usuario'}
              </p>
              <div className="flex items-center gap-2 text-white/70">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Conectando...</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <Button
              size="lg"
              variant={isMuted ? 'destructive' : 'secondary'}
              onClick={toggleMute}
              className="rounded-full w-14 h-14"
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            {callType === 'video' && (
              <Button
                size="lg"
                variant={isVideoEnabled ? 'secondary' : 'destructive'}
                onClick={toggleVideo}
                className="rounded-full w-14 h-14"
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>
            )}

            <Button
              size="lg"
              variant="destructive"
              onClick={endCall}
              className="rounded-full w-14 h-14"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
