import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  MessageCircle,
  Smile,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  X
} from 'lucide-react';
import { useCallManager } from '@/hooks/useCallManager';
import { Profile } from './types';
import './ChatArea.css';

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  account_status: string;
  is_online?: boolean;
  role?: string;
  full_name?: string;
}

interface PrivateMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ChatAreaProps {
  authUser: any;
  activeChatId: string | null;
  activeUser: Profile | null;
  enterpriseMessages: PrivateMessage[] | undefined;
  messagesLoading: boolean;
  messageInput: string;
  setMessageInput: (value: string) => void;
  emojiPickerOpen: boolean;
  setEmojiPickerOpen: (open: boolean) => void;
  onSendMessage: () => void;
  onFileUpload: (file: File) => void;
  onStartVoiceCall?: (userId: string) => void;
  onStartVideoCall?: (userId: string) => void;
  onBackToChats?: () => void;
  formatTimestamp: (timestamp: string) => string;
  sendMessageMutation: any;
  translations: any;
  language: 'es' | 'en';
  isMobile: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  authUser,
  activeChatId,
  activeUser,
  enterpriseMessages,
  messagesLoading,
  messageInput,
  setMessageInput,
  emojiPickerOpen,
  setEmojiPickerOpen,
  onSendMessage,
  onFileUpload,
  onStartVoiceCall,
  onStartVideoCall,
  onBackToChats,
  formatTimestamp,
  sendMessageMutation,
  translations,
  language,
  isMobile
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
    
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [enterpriseMessages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(messageInput + emoji);
    setEmojiPickerOpen(false);
  };

  const getMessageStatusIcon = (isRead: boolean) => {
    return isRead ? <CheckCheck size={12} /> : <Check size={12} />;
  };

  return (
    <main className="main-chat-area">
      <div className="chat-header">
        {isMobile && onBackToChats && (
          <button className="back-button" onClick={onBackToChats}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="chat-user-info">
          <div className="user-avatar">
            <div className="avatar-fallback">
              {activeUser?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="online-indicator"></div>
          </div>
          <div className="user-details">
            <div className="user-name">{activeUser?.username || (language === 'es' ? 'Usuario' : 'User')}</div>
            <div className="user-status">
              {translations?.online ?? (language === 'es' ? 'En línea' : 'Online')} •{' '}
              {translations?.available ?? (language === 'es' ? 'Disponible' : 'Available')}
            </div>
          </div>
        </div>
        <div className="chat-actions">
          <button
            className="icon-btn"
            onClick={() => activeUser && onStartVoiceCall(activeUser.id)}
            title={language === 'es' ? 'Llamada de voz' : 'Voice call'}
          >
            <Phone size={20} />
          </button>
          <button
            className="icon-btn"
            onClick={() => activeUser && onStartVideoCall(activeUser.id)}
            title={language === 'es' ? 'Videollamada' : 'Video call'}
          >
            <Video size={20} />
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messagesLoading ? (
          <div className="loading-messages">
            <div className="loading-spinner"></div>
            <p>{language === 'es' ? 'Cargando mensajes...' : 'Loading messages...'}</p>
          </div>
        ) : enterpriseMessages?.length === 0 ? (
          <div className="no-messages">
            <MessageCircle size={48} />
            <p>{language === 'es' ? 'No hay mensajes aún' : 'No messages yet'}</p>
          </div>
        ) : (
          enterpriseMessages?.map((message) => {
            const isSent = message.sender_id === authUser?.id;
            return (
              <div key={message.id} className={`message ${isSent ? 'sent' : 'received'}`}>
                <div className="message-content">{message.content}</div>
                <div className="message-footer">
                  <span className="message-time">{formatTimestamp(message.created_at)}</span>
                  {isSent && (
                    <span className="message-status">{getMessageStatusIcon(message.is_read)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        <div className="input-actions">
          <button className="icon-btn" onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}>
            <Smile size={20} />
          </button>
          <button className="icon-btn" onClick={() => fileInputRef.current?.click()}>
            <Paperclip size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>
        <div className="message-input-wrapper">
          <input
            type="text"
            placeholder={translations?.writeMessage ?? (language === 'es' ? 'Escribe un mensaje...' : 'Write a message...')}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="message-input"
          />
          {emojiPickerOpen && (
            <div className="emoji-picker">
              {['😀', '😂', '❤️', '👍', '🔥', '🎉'].map((emoji) => (
                <button key={emoji} className="emoji-option" onClick={() => handleEmojiSelect(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="send-button"
          onClick={onSendMessage}
          disabled={!messageInput.trim() || sendMessageMutation?.isPending}
        >
          {sendMessageMutation?.isPending ? <div className="loading-spinner"></div> : <Send size={20} />}
        </button>
      </div>
    </main>
  );
};

export default ChatArea;
