import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { VoiceCall } from "@/lib/webrtc";
import { toast } from "sonner";

interface VoiceCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

export function VoiceCallDialog({ open, onOpenChange, username }: VoiceCallDialogProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const voiceCallRef = useRef<VoiceCall | null>(null);

  const handleMessage = (event: any) => {
    console.log('Voice event:', event);
    
    if (event.type === 'session.created') {
      setIsConnected(true);
      setIsConnecting(false);
      toast.success("Voice call connected");
    } else if (event.type === 'error') {
      toast.error("Voice call error: " + event.error?.message);
    }
  };

  const startCall = async () => {
    try {
      setIsConnecting(true);
      // Preflight mic permission on explicit user gesture
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({ audio: true });
        tmp.getTracks().forEach(t => t.stop());
      } catch (permErr: any) {
        console.error('Microphone permission error:', permErr);
        setIsConnecting(false);
        toast.error(
          permErr?.name === 'NotAllowedError'
            ? 'Microphone permission denied. Enable mic in your browser site settings and retry.'
            : 'Unable to access microphone. Please check your device permissions.'
        );
        return;
      }

      voiceCallRef.current = new VoiceCall(handleMessage);
      await voiceCallRef.current.init();
    } catch (error: any) {
      console.error('Error starting call:', error);
      toast.error("Failed to start call: " + (error?.message || 'Unknown error'));
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const endCall = () => {
    voiceCallRef.current?.disconnect();
    voiceCallRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    onOpenChange(false);
  };

  useEffect(() => {
    // Only handle cleanup on close; require explicit user gesture to start call
    return () => {
      if (voiceCallRef.current) {
        voiceCallRef.current.disconnect();
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Call with {username}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <Phone className="h-12 w-12 text-primary" />
            </div>
            {isConnected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="text-center">
            <p className="text-lg font-semibold">{username}</p>
            <p className="text-sm text-muted-foreground">
              {isConnecting ? "Connecting..." : isConnected ? "Connected" : "Calling..."}
            </p>
          </div>

          {(!isConnected && !isConnecting) ? (
            <Button
              variant="default"
              size="lg"
              className="rounded-full px-6"
              onClick={startCall}
            >
              Start Voice Call
            </Button>
          ) : (
            <div className="flex gap-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={() => setIsMuted(!isMuted)}
                disabled={!isConnected}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full w-14 h-14"
                onClick={endCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
