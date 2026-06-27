import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck } from 'lucide-react';
import { MessageEncryption } from '@/utils/encryption';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MessageBubbleProps {
  message: {
    id: string;
    sender_id: string;
    content: string;
    media_url: string | null;
    media_type: 'image' | 'video' | null;
    file_url: string | null;
    file_name: string | null;
    created_at: string;
  };
  isOwn: boolean;
  senderAvatar?: string;
  senderName?: string;
  encryptionKey: string;
  readStatus?: string | null;
  onVisible?: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  senderAvatar,
  senderName,
  encryptionKey,
  readStatus,
  onVisible
}: MessageBubbleProps) {
  const [decryptedContent, setDecryptedContent] = useState<string>('');

  useEffect(() => {
    const decrypt = async () => {
      try {
        const content = await MessageEncryption.decrypt(message.content, encryptionKey);
        setDecryptedContent(content);
      } catch {
        setDecryptedContent('[Error al descifrar]');
      }
    };
    decrypt();
  }, [message.content, encryptionKey]);

  return (
    <div
      data-message-id={message.id}
      data-sender-id={message.sender_id}
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      {!isOwn && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback>{senderName?.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isOwn && (
          <span className="text-xs text-muted-foreground mb-1">{senderName}</span>
        )}
        
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          {message.media_url && (
            <div className="mb-2">
              {message.media_type === 'image' ? (
                <img
                  src={message.media_url}
                  alt="Shared media"
                  className="rounded-lg max-w-full h-auto"
                />
              ) : (
                <video
                  src={message.media_url}
                  controls
                  className="rounded-lg max-w-full h-auto"
                />
              )}
            </div>
          )}
          
          {message.file_url && (
            <a
              href={message.file_url}
              download={message.file_name}
              className="flex items-center gap-2 text-sm underline mb-2"
            >
              📎 {message.file_name}
            </a>
          )}
          
          <p className="text-sm whitespace-pre-wrap break-words">{decryptedContent}</p>
        </div>
        
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
              locale: es
            })}
          </span>
          
          {isOwn && (
            <span className="text-muted-foreground">
              {readStatus ? (
                <CheckCheck className="w-3 h-3 text-blue-500" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
