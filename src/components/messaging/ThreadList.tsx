// src/components/messaging/ThreadList.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/hooks/use-websocket';
import { MessageCircle, Users, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface Thread {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: string;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    timestamp: string;
    senderId: string;
    type: 'text' | 'image' | 'file' | 'system';
    status: 'sent' | 'delivered' | 'read';
  };
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  lastActivity: string;
  isArchived: boolean;
}

interface ThreadListProps {
  onThreadSelect: (threadId: string) => void;
}

export const ThreadList: React.FC<ThreadListProps> = ({ onThreadSelect }) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuth();
  
  // WebSocket setup - will attempt connection but handle gracefully if unavailable
  const protocol = typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'wss:' : 'ws:') : 'ws:';
  const wsUrl = typeof window !== 'undefined' ? `${protocol}//${window.location.host}/api/ws/threads` : '';
  
  const { isConnected, connect, disconnect, sendMessage } = useWebSocket(wsUrl);

  const fetchThreads = useCallback(async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/threads', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') || 'dev-token'}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.status}`);
      }

      const threadsData = await response.json();
      setThreads(threadsData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      fetchThreads();
      
      // Attempt WebSocket connection
      try {
        connect();
      } catch (err) {
        console.log('WebSocket connection not available, continuing without real-time updates');
      }
    }

    return () => {
      disconnect();
    };
  }, [authUser, fetchThreads, connect, disconnect]);

  const handleRetry = () => {
    setError(null);
    fetchThreads();
    
    // Retry WebSocket connection
    try {
      connect();
    } catch (err) {
      console.log('WebSocket retry failed');
    }
  };

  const handleThreadSelect = (threadId: string) => {
    // If WebSocket is connected, send read receipt
    if (isConnected) {
      sendMessage({
        type: 'mark_thread_read',
        threadId,
        userId: authUser?.id
      });
    }
    
    onThreadSelect(threadId);
  };

  const getConnectionStatus = () => {
    return {
      icon: isConnected ? <Wifi size={14} className="text-green-600" /> : <WifiOff size={14} className="text-red-600" />,
      text: isConnected ? 'Live' : 'No real-time',
      color: isConnected ? 'text-green-600' : 'text-red-600'
    };
  };

  const status = getConnectionStatus();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-32" aria-live="polite">
        <RefreshCw size={24} className="animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading conversations...</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          {status.icon}
          <span>{status.text}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-destructive" aria-live="assertive">
        <WifiOff size={32} className="mb-2" />
        <p className="text-sm font-medium mb-1">Connection Error</p>
        <p className="text-xs text-muted-foreground text-center mb-3 px-4">{error}</p>
        <button 
          onClick={handleRetry}
          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Retry
        </button>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          {status.icon}
          <span>{status.text}</span>
        </div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground" aria-live="polite">
        <MessageCircle size={32} className="mb-2 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs">Start a new conversation to begin messaging</p>
        <div className="flex items-center gap-2 mt-3 text-xs">
          {status.icon}
          <span className={status.color}>{status.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connection Status Indicator */}
      <div className={`absolute top-2 right-2 z-10 flex items-center gap-2 text-xs ${status.color}`}>
        {status.icon}
        {status.text}
      </div>

      <div className="divide-y" role="list" aria-label="Conversations list">
        {threads.map((thread) => (
          <ThreadListItem 
            key={thread.id} 
            thread={thread} 
            currentUserId={authUser?.id} 
            onThreadSelect={handleThreadSelect}
          />
        ))}
      </div>
    </div>
  );
};

// ThreadListItem component (same as before)
interface ThreadListItemProps {
  thread: Thread;
  currentUserId?: string;
  onThreadSelect: (threadId: string) => void;
}

const ThreadListItem: React.FC<ThreadListItemProps> = ({ thread, currentUserId, onThreadSelect }) => {
  const displayName = thread.isGroup 
    ? thread.groupName 
    : thread.participants.find(p => p.id !== currentUserId)?.name || 'Unknown';

  const lastMessage = thread.lastMessage?.content 
    ? (thread.lastMessage.content.length > 50 
        ? thread.lastMessage.content.substring(0, 50) + '...' 
        : thread.lastMessage.content)
    : 'No messages yet';

  const onlineParticipants = thread.participants.filter(p => p.isOnline && p.id !== currentUserId);
  const isAnyOnline = onlineParticipants.length > 0;

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 168) {
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return '--:--';
    }
  };

  return (
    <button
      onClick={() => onThreadSelect(thread.id)}
      className="w-full p-3 text-left hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
      role="listitem"
      aria-label={`Conversation with ${displayName}, ${thread.unreadCount > 0 ? `${thread.unreadCount} unread messages` : 'no unread messages'}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            {thread.isGroup ? (
              <Users size={20} className="text-muted-foreground" aria-hidden="true" />
            ) : (
              <span className="text-sm font-medium">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {isAnyOnline && (
            <div 
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" 
              aria-label={`${onlineParticipants.length} participant${onlineParticipants.length > 1 ? 's' : ''} online`}
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium truncate">{displayName}</h3>
            {thread.lastMessage && (
              <time className="text-xs text-muted-foreground">
                {formatTime(thread.lastMessage.timestamp)}
              </time>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
        </div>
        
        {thread.unreadCount > 0 && (
          <div 
            className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center"
            aria-label={`${thread.unreadCount} unread messages`}
          >
            {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
          </div>
        )}
      </div>
    </button>
  );
};