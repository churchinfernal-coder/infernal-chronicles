import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Video } from 'lucide-react';
import { CallModal } from './CallModal';

interface CallLauncherProps {
  chatId: string;
  userId: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string | null;
  disabled?: boolean;
}

export function CallLauncher({ chatId, userId, receiverId, receiverName, receiverAvatar, disabled }: CallLauncherProps) {
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');

  const handleStartCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setShowCallModal(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleStartCall('audio')}
        disabled={disabled}
        title="Llamada de audio"
      >
        <Phone className="w-5 h-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleStartCall('video')}
        disabled={disabled}
        title="Videollamada"
      >
        <Video className="w-5 h-5" />
      </Button>

      <CallModal
        open={showCallModal}
        onOpenChange={setShowCallModal}
        chatId={chatId}
        userId={userId}
        otherUser={{
          id: receiverId || '',
          full_name: receiverName || 'Usuario',
          avatar_url: receiverAvatar || null
        }}
        callType={callType}
        isInitiator={true}
      />
    </>
  );
}
