// src/components/messaging/MessagingProvider.tsx
import React, { createContext, useContext, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface MessagingContextType {
  sendMessage: (threadId: string, content: string, attachments?: File[]) => Promise<void>;
  markAsRead: (threadId: string, messageIds: string[]) => Promise<void>;
  deleteMessage: (threadId: string, messageId: string) => Promise<void>;
  createThread: (participantIds: string[], groupName?: string) => Promise<string>;
  archiveThread: (threadId: string) => Promise<void>;
}

export const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();

  const sendMessage = useCallback(async (threadId: string, content: string, attachments?: File[]) => {
    if (!authUser) throw new Error('Not authenticated');

    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, content, attachments: attachments?.length || 0 }),
    });

    if (!response.ok) throw new Error('Failed to send message');
  }, [authUser]);

  const markAsRead = useCallback(async (threadId: string, messageIds: string[]) => {
    if (!authUser) throw new Error('Not authenticated');

    const response = await fetch('/api/messages/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, messageIds }),
    });

    if (!response.ok) throw new Error('Failed to mark messages as read');
  }, [authUser]);

  const deleteMessage = useCallback(async (threadId: string, messageId: string) => {
    if (!authUser) throw new Error('Not authenticated');

    const response = await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId }),
    });

    if (!response.ok) throw new Error('Failed to delete message');
  }, [authUser]);

  const createThread = useCallback(async (participantIds: string[], groupName?: string) => {
    if (!authUser) throw new Error('Not authenticated');

    const response = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantIds, groupName }),
    });

    if (!response.ok) throw new Error('Failed to create thread');
    
    const thread = await response.json();
    return thread.id;
  }, [authUser]);

  const archiveThread = useCallback(async (threadId: string) => {
    if (!authUser) throw new Error('Not authenticated');

    const response = await fetch(`/api/threads/${threadId}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Failed to archive thread');
  }, [authUser]);

  const value: MessagingContextType = {
    sendMessage,
    markAsRead,
    deleteMessage,
    createThread,
    archiveThread,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) throw new Error('useMessaging must be used within a MessagingProvider');
  return context;
};
