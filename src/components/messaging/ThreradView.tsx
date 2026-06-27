// src/components/messaging/ThreadView.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessaging } from './MessagingProvider';
import { useAuth } from '@/hooks/use-auth';
import { Send, Paperclip, Smile, Phone, Video, Info, ArrowLeft, MessageCircle } from 'lucide-react';

export interface ThreadViewProps {
  threadId: string;
  userId: string;
  onBack?: () => void;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  type: 'text' | 'image' | 'file' | 'system';
  status: 'sent' | 'delivered' | 'read';
}

interface ThreadParticipant {
  id: string;
  name: string;
  isOnline: boolean;
}

export const ThreadView: React.FC<ThreadViewProps> = ({ threadId, userId, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState<ThreadParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, markAsRead } = useMessaging();
  const { user: authUser } = useAuth();

  useEffect(() => {
    const loadThreadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [messagesResponse, participantsResponse] = await Promise.all([
          fetch(`/api/threads/${threadId}/messages`),
          fetch(`/api/threads/${threadId}/participants`)
        ]);

        if (!messagesResponse.ok || !participantsResponse.ok) {
          throw new Error('Failed to load conversation data');
        }

        const messagesData = await messagesResponse.json();
        const participantsData = await participantsResponse.json();

        setMessages(messagesData);
        setParticipants(participantsData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    if (threadId) loadThreadData();
  }, [threadId]);

  useEffect(() => {
    const unreadMessageIds = messages
      .filter(msg => msg.senderId !== userId && msg.status === 'sent')
      .map(msg => msg.id);

    if (unreadMessageIds.length > 0) {
      markAsRead(threadId, unreadMessageIds).catch(console.error);
    }
  }, [messages, threadId, userId, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(threadId, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getDisplayName = useCallback(() => {
    if (participants.length === 2) {
      const otherParticipant = participants.find(p => p.id !== userId);
      return otherParticipant?.name || 'Unknown';
    }
    return `Group (${participants.length})`;
  }, [participants, userId]);

  const getOnlineStatus = useCallback(() => {
    if (participants.length === 2) {
      const otherParticipant = participants.find(p => p.id !== userId);
      return otherParticipant?.isOnline ? 'Online' : 'Offline';
    }
    const onlineCount = participants.filter(p => p.id !== userId && p.isOnline).length;
    return `${onlineCount} online`;
  }, [participants, userId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-label="Loading conversation" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-center h-full text-destructive">
          <div className="text-center">
            <p className="mb-2">Failed to load conversation</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors" title="Back to conversations" aria-label="Back to conversations">
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{getDisplayName().charAt(0).toUpperCase()}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" aria-label="Online" />
              </div>
              
              <div>
                <h2 className="font-semibold">{getDisplayName()}</h2>
                <p className="text-sm text-muted-foreground">{getOnlineStatus()}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-accent rounded-lg transition-colors" title="Voice call" aria-label="Start voice call">
              <Phone size={20} />
            </button>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors" title="Video call" aria-label="Start video call">
              <Video size={20} />
            </button>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors" title="Conversation info" aria-label="View conversation details">
              <Info size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} isOwn={message.senderId === userId} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex items-center gap-1">
            <button type="button" className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground" title="Add attachment" aria-label="Add attachment">
              <Paperclip size={20} />
            </button>
            <button type="button" className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground" title="Add emoji" aria-label="Add emoji">
              <Smile size={20} />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              aria-label="Type your message"
            />
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message; isOwn: boolean }> = ({ message, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-2xl px-4 py-2`}>
        {!isOwn && <div className="text-xs font-medium mb-1 opacity-80">{message.senderName}</div>}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'} flex items-center gap-2`}>
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isOwn && <span>{message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}</span>}
        </div>
      </div>
    </div>
  );
};