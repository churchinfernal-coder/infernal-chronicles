import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff } from "lucide-react";
import { VideoCall } from "@/lib/webrtc";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  conversationId: string;
}

export function VideoCallDialog({ open, onOpenChange, username, conversationId }: VideoCallDialogProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const videoCallRef = useRef<VideoCall | null>(null);

  const handleIceCandidate = async (candidate: RTCIceCandidate) => {
    // Send ICE candidate through Supabase realtime
    const channel = supabase.channel(`video-call-${conversationId}`);
    channel.send({
      type: 'broadcast',
      event: 'ice-candidate',
      payload: { candidate }
    });
  };

  const startCall = async () => {
    try {
      if (!localVideoRef.current || !remoteVideoRef.current) return;
      setIsStarting(true);

      // Preflight camera+mic permission on explicit user gesture
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        tmp.getTracks().forEach(t => t.stop());
      } catch (permErr: any) {
        console.error('Camera/Mic permission error:', permErr);
        setIsStarting(false);
        toast.error(
          permErr?.name === 'NotAllowedError'
            ? 'Camera/Mic permission denied. Enable permissions in browser site settings and retry.'
            : 'Unable to access camera/mic. Please check device permissions.'
        );
        return;
      }

      videoCallRef.current = new VideoCall(
        localVideoRef.current,
        remoteVideoRef.current,
        handleIceCandidate
      );

      const offer = await videoCallRef.current.startCall();
      
      // Send offer through Supabase realtime
      const channel = supabase.channel(`video-call-${conversationId}`);
      await channel.subscribe();
      
      channel.send({
        type: 'broadcast',
        event: 'call-offer',
        payload: { offer }
      });

      // Listen for answer
      channel.on('broadcast', { event: 'call-answer' }, async (payload) => {
        if (payload.answer && videoCallRef.current) {
          await videoCallRef.current.setRemoteDescription(payload.answer);
          setIsConnected(true);
          setIsStarting(false);
        }
      });

      // Listen for ICE candidates
      channel.on('broadcast', { event: 'ice-candidate' }, async (payload) => {
        if (payload.candidate && videoCallRef.current) {
          await videoCallRef.current.addIceCandidate(payload.candidate);
        }
      });

      toast.success("Video call started");
    } catch (error: any) {
      console.error('Error starting video call:', error);
      toast.error("Failed to start video call: " + (error?.message || 'Unknown error'));
      setIsStarting(false);
    }
  };

  const endCall = () => {
    videoCallRef.current?.endCall();
    videoCallRef.current = null;
    setIsConnected(false);
    onOpenChange(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
    }
  };

  useEffect(() => {
    // Only handle cleanup; require explicit user gesture to start the call
    return () => {
      if (videoCallRef.current) {
        videoCallRef.current.endCall();
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[600px]">
        <DialogHeader>
          <DialogTitle>Video Call with {username}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full bg-black rounded-lg object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg object-cover border-2 border-white"
          />
        </div>

        <div className="flex justify-center gap-4 pb-4">
          {(!isConnected && !isStarting) ? (
            <Button
              variant="default"
              size="lg"
              className="rounded-full px-6"
              onClick={startCall}
            >
              Start Video Call
            </Button>
          ) : (
            <>
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              <Button
                variant={isVideoOff ? "destructive" : "outline"}
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={endCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
