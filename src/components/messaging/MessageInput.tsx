import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image as ImageIcon, Smile, FileText, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { CallModal } from '@/components/messaging/CallModal';
import { useToast } from '@/components/ui/use-toast';

interface MessageInputProps {
  onSend: (content: string, mediaFiles: File[], documentFile: File | null) => Promise<void>;
  disabled?: boolean;
  onTyping?: (isTyping: boolean) => void;
}

export function MessageInput({ onSend, disabled, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
const { toast } = useToast(); // Add this if not already there
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = () => {
    onTyping?.(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false);
    }, 3000);
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map(file => URL.createObjectURL(file));
    setMediaFiles(files);
    setMediaPreviews(previews);
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDocumentFile(file);
  };

  const handleRemoveMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const input = inputRef.current;
    if (!input) return;
    
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newText = message.substring(0, start) + emojiData.emoji + message.substring(end);
    setMessage(newText);
    
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
    }, 0);
  };

  const handleSend = async () => {
    if (!message.trim() && mediaFiles.length === 0 && !documentFile) return;
    
    setSending(true);
    try {
      await onSend(message, mediaFiles, documentFile);
      setMessage('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setDocumentFile(null);
      onTyping?.(false);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (documentInputRef.current) documentInputRef.current.value = '';
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t bg-background p-4">
      {/* Media/Document Previews */}
      {(mediaPreviews.length > 0 || documentFile) && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
          {mediaPreviews.map((preview, idx) => (
            <div key={idx} className="relative shrink-0">
              <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded" />
              <button
                onClick={() => handleRemoveMedia(idx)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {documentFile && (
            <div className="relative shrink-0 bg-muted p-2 rounded flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="text-xs">{documentFile.name}</span>
              <button
                onClick={() => setDocumentFile(null)}
                className="ml-2 text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleMediaSelect}
          className="hidden"
        />
        
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          onChange={handleDocumentSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
        >
          <ImageIcon className="w-5 h-5" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => documentInputRef.current?.click()}
          disabled={disabled || sending}
        >
          <FileText className="w-5 h-5" />
        </Button>
        
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" disabled={disabled || sending}>
              <Smile className="w-5 h-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </PopoverContent>
        </Popover>
        
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje..."
          disabled={disabled || sending}
          className="flex-1"
        />
        
        <Button
          onClick={handleSend}
          disabled={disabled || sending || (!message.trim() && mediaFiles.length === 0 && !documentFile)}
          size="icon"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
