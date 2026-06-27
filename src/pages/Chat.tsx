import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo,
  memo
} from 'react';

// Individual icon imports for optimal bundle size
import { ArrowLeft } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { Phone } from 'lucide-react';
import { Video } from 'lucide-react';
import { Smile } from 'lucide-react';
import { Paperclip } from 'lucide-react';
import { Send } from 'lucide-react';
import { Moon } from 'lucide-react';
import { Sun } from 'lucide-react';
import { Search } from 'lucide-react';
import { X } from 'lucide-react';
import { Settings } from 'lucide-react';
import { Shield } from 'lucide-react';
import { Check } from 'lucide-react';
import { CheckCheck } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { User } from 'lucide-react';
import { PhoneOff } from 'lucide-react';
import { Mic } from 'lucide-react';
import { MicOff } from 'lucide-react';
import { VideoOff } from 'lucide-react';
import { Monitor } from 'lucide-react';
import { Keyboard } from 'lucide-react';
import { Menu } from 'lucide-react';
import Auth from "@/pages/Auth";
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useToast } from '@/components/ui/use-toast';
import webRTCService from "@/lib/webRTC-Service";
import '@/styles/Chat.css';
import { useAuth } from "@/hooks/use-auth";
import { NotificationPrompt } from "@/components/messaging/NotificationPrompt";
import ChatArea from "@/components/messaging/ChatArea";
import CustomCallModal from '@/components/messaging/CustomCallModal';

// ==================== ERROR BOUNDARY ====================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ [ERROR BOUNDARY] Caught error:', error, errorInfo);
    toast.error('Ha ocurrido un error. Por favor recarga la página.');
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary-fallback">
          <Shield size={64} className="text-red-500" />
          <h2>Algo salió mal</h2>
          <p>Por favor recarga la página</p>
          <button onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ==================== RATE LIMITER ====================

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const userAttempts = this.attempts. get(key) || [];
    
    const validAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      console.warn(`⚠️ [RATE LIMIT] ${key} exceeded ${maxAttempts} attempts in ${windowMs}ms`);
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  
  reset(key: string) {
    this.attempts.delete(key);
  }
}

const rateLimiter = new RateLimiter();

// ==================== LOCAL STORAGE MANAGER ====================

class StorageManager {
  static set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('❌ [STORAGE] Error saving:', error);
    }
  }
  
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('❌ [STORAGE] Error reading:', error);
      return defaultValue;
    }
  }
  
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('❌ [STORAGE] Error removing:', error);
    }
  }
}

// ==================== DEBOUNCE HOOK ====================

function useDebounce<T>(value:  T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ==================== KEYBOARD SHORTCUTS HOOK ====================

function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.altKey ? 'Alt+' :  ''}${e.key}`;
      
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// ==================== INTERFACES ====================

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url:  string | null;
  account_status: string;
  is_online?:  boolean;
  role?: string;
  full_name?: string;
}

interface PrivateChat {
  id: string;
  user_1: string;
  user_2: string;
  last_message_at: string;
  created_at: string;
  last_message?:  string;
  user1_profile?:  Profile;
  user2_profile?: Profile;
}

interface PrivateMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: Profile;
  receiver_profile?: Profile;
  attachment_url?: string;
}

interface AuditLog {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?:  string;
  changes?:  any;
}

interface CallState {
  callType: 'voice' | 'video';
  callStatus: 'idle' | 'calling' | 'ringing' | 'active' | 'ended';
  targetUserId?: string;
  callId?: string;
  reconnectAttempts?: number;
}

interface IncomingCall {
  from:  string;
  callId: string;
  callType: 'audio' | 'video';
  fromUser?:  Profile;
}

interface RingtoneRef {
  audioContext: AudioContext;
  playBeep: () => void;
  stop: () => void;
}

interface TypingUser {
  userId: string;
  timestamp: number;
}

interface MessageReaction {
  messageId: string;
  userId: string;
  emoji: string;
}

interface UserPreferences {
  darkMode: boolean;
  language: 'es' | 'en';
  notifications: boolean;
  soundEnabled: boolean;
}

// ==================== HELPER FUNCTIONS ====================

const setupMessageListener = (
  userId: string,
  onMessageReceived?:  (message: any) => void,
  onError?: (error:  Error) => void
): (() => void) | null => {
  try {
    const channel = supabase
      .channel(`messages: ${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📨 [MESSAGE LISTENER] New message:', payload. new);
          onMessageReceived?.(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('🔔 [MESSAGE LISTENER] Subscription status:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  } catch (error) {
    console.error('❌ [MESSAGE LISTENER] Error:', error);
    onError?.(error as Error);
    return null;
  }
};

const areNotificationsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (! ('Notification' in window)) return false;
  return Notification.permission === 'granted';
};

// ==================== MAIN COMPONENT ====================

const Chat = () => {
  const { user:  authUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast:  uiToast } = useToast();

  // ==================== PERSISTENT STATE ====================

  const [preferences, setPreferences] = useState<UserPreferences>(() => 
    StorageManager.get('infernal-chat-preferences', {
      darkMode: false,
      language: 'es',
      notifications: true,
      soundEnabled: true
    })
  );

  useEffect(() => {
    StorageManager.set('infernal-chat-preferences', preferences);
  }, [preferences]);

  const [darkMode, setDarkMode] = useState(preferences.darkMode);
  const [language, setLanguage] = useState(preferences.language);

  useEffect(() => {
    setPreferences(prev => ({ ...prev, darkMode, language }));
  }, [darkMode, language]);

  // ==================== STATE ====================

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'chats' | 'contacts'>('chats');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [chatActionsMenu, setChatActionsMenu] = useState<{ chatId: string; x: number; y: number; otherUserId: string } | null>(null);
  const [callState, setCallState] = useState<CallState>({
    callType: 'voice',
    callStatus: 'idle',
    reconnectAttempts: 0
  });
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // ==================== REFS ====================

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const webrtcInitRef = useRef(false);
  const ringtoneRef = useRef<RingtoneRef | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const voiceRecordingCleanupRef = useRef<(() => void) | null>(null);
  const callStateRef = useRef<CallState>({ callType: 'voice', callStatus: 'idle', reconnectAttempts: 0 });
const incomingCallRef = useRef<IncomingCall | null>(null);


  // ==================== DEBOUNCED SEARCH ====================

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // ==================== AUTH EFFECT ====================

  useEffect(() => {
    console.log('🔐 [AUTH] Chat loaded - User:', authUser?.id);
    
    if (! authUser) return;

    const initNotifications = async () => {
      console.log('🔔 [Notifications] Checking permission...');
      
      const permission = Notification.permission;
      console.log('🔔 [Notifications] Current permission:', permission);

      if (permission === 'granted') {
        setupMessageListener(authUser.id);
        console.log('✅ [Notifications] Listener active');
      } else if (permission === 'default') {
        console.log('🔔 [Notifications] Will show prompt.. .');
      } else {
        console.warn('⚠️ [Notifications] Permission denied');
      }
    };

    initNotifications();
  }, [authUser]);

  // ==================== DATA MAPPERS ====================

  const mapToProfile = useCallback((data: any): Profile => ({
    id: data.user_id || data.id || '',
    username: data.username || data.display_name || data.email?. split('@')[0] || 'Usuario',
    full_name: data.display_name || data.username || 'Usuario',
    email: data.email || '',
    avatar_url: data.avatar_url || null,
    account_status: data.account_status || 'active',
    is_online: data.is_online ??  false,
    role: data. role || 'user'
  }), []);

  const mapToPrivateChat = useCallback((data: any): PrivateChat => ({
    id:  data.id || '',
    user_1: data.user_1 || '',
    user_2: data.user_2 || '',
    last_message_at: data.last_message_at || new Date().toISOString(),
    created_at: data.created_at || new Date().toISOString(),
    last_message: data.last_message,
    user1_profile: data.user1_profile ?  mapToProfile(data.user1_profile) : undefined,
    user2_profile: data.user2_profile ? mapToProfile(data.user2_profile) : undefined
  }), [mapToProfile]);

  const mapToPrivateMessage = useCallback((data:  any): PrivateMessage => ({
    id: data.id || '',
    chat_id: data.chat_id || '',
    sender_id: data.sender_id || '',
    receiver_id: data. receiver_id || '',
    content: data.content || '',
    is_read: data.is_read ??  false,
    created_at:  data.created_at || new Date().toISOString(),
    sender_profile: data.sender_profile ? mapToProfile(data. sender_profile) : undefined,
    receiver_profile: data.receiver_profile ? mapToProfile(data.receiver_profile) : undefined,
    attachment_url: data. attachment_url
  }), [mapToProfile]);

  // ==================== QUERIES ====================

  const { data:  enterpriseFriends, isLoading: friendsLoading } = useQuery({
    queryKey: ['enterprise-friends', authUser?.id],
    queryFn: async () => {
      if (!authUser) return [];
      
      const { data:  friendships, error:  friendError } = await supabase
        .from('friendships')
        .select('user_id, friend_id, status')
        .or(`user_id.eq.${authUser.id},friend_id.eq.${authUser.id}`)
        .eq('status', 'accepted');

      if (friendError) {
        console.error('❌ [FRIENDS QUERY] Error:', friendError);
        return [];
      }

      if (! friendships?. length) return [];

      const friendIds = friendships.map((f: any) => 
        f.user_id === authUser.id ? f.friend_id : f.user_id
      );

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', friendIds);

      if (profileError) {
        console.error('❌ [FRIENDS PROFILES] Error:', profileError);
        return [];
      }

      console.log('✅ [FRIENDS QUERY] Loaded:', profiles?.length || 0, 'friends');
      return (profiles || []).map(mapToProfile);
    },
    enabled: !!authUser,
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true
  });

  const { data: enterpriseUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['enterprise-users', authUser?.id],
    queryFn: async () => {
      if (!authUser) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', authUser.id);

      if (error) {
        console.error('❌ [USERS QUERY] Error:', error);
        return [];
      }

      console.log('✅ [USERS QUERY] Loaded:', data?.length || 0, 'users');
      return (data || []).map(mapToProfile);
    },
    enabled: !!authUser,
    staleTime: 30000,
    refetchInterval: 60000
  });

  const { data:  enterpriseChats, isLoading:  chatsLoading, error: chatsError } = useQuery({
  queryKey: ['enterprise-chats', authUser?.id],
  queryFn: async () => {
    if (!authUser) return [];

    const userId = authUser.id;
    console.log('🔍 [DEBUG] Querying conversations for userId:', userId);
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_1.eq.${userId},user_2.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('❌ [CONVERSATIONS ERROR]', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return [];
    }

    console.log('✅ [CONVERSATIONS] Loaded:', data?.length || 0);
    return (data || []).map(mapToPrivateChat);
  },
  enabled: !!authUser,
  staleTime: 30000,
  refetchOnWindowFocus: true
});

  const { data: enterpriseMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['enterprise-messages', activeChatId],
    queryFn: async () => {
      if (!authUser || !activeChatId) return [];

      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [MESSAGES QUERY] Error:', error);
        return [];
      }

      return (data || []).map(mapToPrivateMessage);
    },
    enabled: !!authUser && !!activeChatId
  });

  // ==================== SYNC REFS WITH STATE ====================

  useEffect(() => {
  // Sync refs with state
  }, [enterpriseUsers]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // ==================== MEMOIZED COMPUTATIONS ====================

  const activeChat = useMemo(() => 
    enterpriseChats?. find(c => c.id === activeChatId),
    [enterpriseChats, activeChatId]
  );

  const activeUser = useMemo(() => {
    if (!activeChat || !authUser) return null;
    const otherUserId = activeChat.user_1 === authUser.id ? activeChat. user_2 : activeChat. user_1;
    return enterpriseUsers?.find(u => u.id === otherUserId) || null;
  }, [activeChat, authUser, enterpriseUsers]);

  const filteredChats = useMemo(() => {
    if (!enterpriseChats) return [];
    
    return enterpriseChats
      .filter(chat => {
        if (! debouncedSearchQuery. trim()) return true;
        
        const otherUserId = chat.user_1 === authUser?. id ? chat.user_2 : chat.user_1;
        const otherUser = enterpriseUsers?.find(u => u.id === otherUserId);
        return otherUser?. username?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      })
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  }, [enterpriseChats, debouncedSearchQuery, authUser, enterpriseUsers]);

  const getFilteredContacts = useMemo(() => {
    const friendIds = new Set(enterpriseFriends?.map((f: any) => f.id) || []);
    const otherUsers = enterpriseUsers?.filter(u => !friendIds.has(u.id)) || [];

    if (!debouncedSearchQuery. trim()) {
      return { filteredFriends: enterpriseFriends || [], filteredOtherUsers: otherUsers };
    }

    const query = debouncedSearchQuery. toLowerCase().trim();
    
    const filteredFriends = (enterpriseFriends || []).filter((user: Profile) =>
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );

    const filteredOtherUsers = otherUsers.filter((user: Profile) =>
      user.username?.toLowerCase().includes(query) ||
      user.email?. toLowerCase().includes(query)
    );

    return { filteredFriends, filteredOtherUsers };
  }, [enterpriseFriends, enterpriseUsers, debouncedSearchQuery]);

 // ==================== HANDLER DECLARATIONS ====================

const logAuditEvent = useCallback(async (auditData: AuditLog) => {
  console.log('📋 [AUDIT]', auditData. action);
}, []);

const checkCallPermissions = useCallback((targetUser: Profile) => {
  const targetRole = targetUser.role || 'user';
  const targetStatus = targetUser.account_status;
  
  return {
    canVoiceCall: targetStatus === 'active' && targetRole !== 'restricted',
    canVideoCall: targetStatus === 'active' && targetRole !== 'restricted',
    canChat: targetStatus === 'active' && targetRole !== 'banned'
  };
}, []);

const isUserAvailable = useCallback((user: Profile): boolean => {
  return user.account_status === 'active';  // ✅ Removed is_online check
}, []);

const stopScreenShare = useCallback(async () => {
  if (screenStream) {
    screenStream.getTracks().forEach(track => track. stop());
    setScreenStream(null);
    setIsScreenSharing(false);
    
    if (localStream && callState.callId) {
      const videoTrack = localStream.getVideoTracks()[0];
      const pc = webRTCService.getPeerConnection(callState.callId);
      const sender = pc?. getSenders().find(s => s.track?. kind === 'video');
      
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    }
    
    toast.info('Compartir pantalla detenido');
  }
}, [screenStream, localStream, callState.callId]);

const stopRecording = useCallback(() => {
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingStartTime(null);
    
    toast.info('Grabación detenida');
  }
}, [isRecording]);

const handleCallEnd = useCallback(async () => {
  console.log('🔚 [CALL] Ending call');

  if (callTimeoutRef.current) {
    clearTimeout(callTimeoutRef. current);
    callTimeoutRef.current = null;
  }

  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = null;
  }

  if (ringtoneRef.current) {
    ringtoneRef.current. stop();
  }
  if (ringIntervalRef.current) {
    clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = null;
  }

  if (isRecording) {
    stopRecording();
  }

  if (isScreenSharing) {
    stopScreenShare();
  }

  if (callState.targetUserId && authUser) {
    await logAuditEvent({
      user_id: authUser.id,
      action: 'CALL_ENDED',
      entity_type: 'call',
      entity_id: callState.targetUserId,
      changes: { call_type: callState.callType }
    });
  }

  await webRTCService.endCall(callState.callId);

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    setLocalStream(null);
  }
  
  if (screenStream) {
    screenStream. getTracks().forEach(track => track.stop());
    setScreenStream(null);
  }
  
  setRemoteStream(null);

  setCallState({ callType: 'voice', callStatus: 'idle', reconnectAttempts: 0 });
  setCallModalOpen(false);
  setIncomingCall(null);
  setIsMicMuted(false);
  setIsVideoOff(false);
  setIsScreenSharing(false);
  setIsRecording(false);
  setRecordingStartTime(null);
}, [callState, authUser, logAuditEvent, localStream, screenStream, isRecording, isScreenSharing, stopRecording, stopScreenShare]);

const startVoiceCall = useCallback(async (userId: string) => {
  if (!authUser) {
    toast.error('Debes iniciar sesión');
    return;
  }

  if (! rateLimiter.check(`start-call-${authUser.id}`, 3, 60000)) {
    toast.error('Demasiadas llamadas.  Espera un minuto.');
    return;
  }

  const targetUser = enterpriseUsers?. find(u => u.id === userId);
  if (!targetUser) {
    toast.error('Usuario no encontrado');
    return;
  }

  const { canVoiceCall } = checkCallPermissions(targetUser);
  if (!canVoiceCall) {
  toast.error('Usuario no disponible');
  return;
}

  try {
    const { localStream, callId } = await webRTCService.initiateCall(userId, 'audio');
    
    setLocalStream(localStream);
    setCallState({ 
      callType: 'voice', 
      callStatus: 'calling', 
      targetUserId:  userId, 
      callId,
      reconnectAttempts:  0
    });
    setCallModalOpen(true);

    const timeout = setTimeout(() => {
      if (callStateRef.current. callStatus === 'calling' && callStateRef.current.callId === callId) {
        console.log('⏰ [AUTO-HANGUP] Outgoing call timeout');
        handleCallEnd();
        toast.error('No se pudo conectar la llamada');
      }
    }, 30000);
    
    callTimeoutRef.current = timeout;

    await logAuditEvent({
      user_id:  authUser.id,
      action: 'CALL_INITIATED',
      entity_type: 'call',
      entity_id: userId,
      changes: { call_type: 'audio', call_id: callId }
    });
  } catch (err) {
    console.error('❌ [CALL] Failed:', err);
    toast.error('No se pudo iniciar la llamada');
  }
}, [authUser, enterpriseUsers, checkCallPermissions, isUserAvailable, logAuditEvent, handleCallEnd]);

const startVideoCall = useCallback(async (userId: string) => {
  if (!authUser) {
    toast.error('Debes iniciar sesión');
    return;
  }

  if (!rateLimiter.check(`start-call-${authUser.id}`, 3, 60000)) {
    toast.error('Demasiadas llamadas. Espera un minuto.');
    return;
  }

  const targetUser = enterpriseUsers?.find(u => u.id === userId);
  if (!targetUser) {
    toast.error('Usuario no encontrado');
    return;
  }

  const { canVideoCall } = checkCallPermissions(targetUser);
  if (!canVideoCall || !isUserAvailable(targetUser)) {
    toast.error('Usuario no disponible');
    return;
  }

  try {
    const { localStream, callId } = await webRTCService.initiateCall(userId, 'video');
    
    setLocalStream(localStream);
    setCallState({ 
      callType: 'video', 
      callStatus:  'calling', 
      targetUserId: userId, 
      callId,
      reconnectAttempts: 0
    });
    setCallModalOpen(true);

    const timeout = setTimeout(() => {
      if (callStateRef.current.callStatus === 'calling' && callStateRef. current.callId === callId) {
        console.log('⏰ [AUTO-HANGUP] Outgoing call timeout');
        handleCallEnd();
        toast.error('No se pudo conectar la videollamada');
      }
    }, 30000);
    
    callTimeoutRef.current = timeout;

    await logAuditEvent({
      user_id: authUser.id,
      action: 'CALL_INITIATED',
      entity_type: 'call',
      entity_id: userId,
      changes: { call_type: 'video', call_id: callId }
    });
  } catch (err) {
    console.error('❌ [CALL] Failed:', err);
    toast.error('No se pudo iniciar la videollamada');
  }
}, [authUser, enterpriseUsers, checkCallPermissions, isUserAvailable, logAuditEvent, handleCallEnd]);

const handleAcceptIncomingCall = useCallback(async (from: string, callId: string, callType: 'audio' | 'video') => {
  if (!authUser) return;

  console.log('✅ [INCOMING] Accepting call');

  if (callTimeoutRef.current) {
    clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = null;
  }

  if (ringtoneRef.current) {
    ringtoneRef.current.stop();
  }
  if (ringIntervalRef.current) {
    clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = null;
  }

  try {
    const localStream = await webRTCService.acceptCall(callId, callType);
    
    setLocalStream(localStream);
    setIncomingCall(null);

    setCallState({
      callType:  callType === 'audio' ?  'voice' : 'video',
      callStatus: 'active',
      targetUserId:  from,
      callId,
      reconnectAttempts: 0
    });

    setCallModalOpen(true);
    toast.success('Llamada aceptada');

    await logAuditEvent({
      user_id: authUser.id,
      action: 'CALL_ACCEPTED',
      entity_type:  'call',
      entity_id: from,
      changes:  { call_id: callId, call_type:  callType }
    });
  } catch (err) {
    console.error('❌ [INCOMING] Error:', err);
    toast.error('Error al aceptar llamada');
    webRTCService.rejectCall(callId);
  }
}, [authUser, logAuditEvent]);

const handleRejectIncomingCall = useCallback(() => {
  if (!incomingCall) return;

  console.log('❌ [INCOMING] Rejecting call');

  if (callTimeoutRef.current) {
    clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = null;
  }

  if (ringtoneRef.current) {
    ringtoneRef.current.stop();
  }
  if (ringIntervalRef.current) {
    clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = null;
  }

  webRTCService.rejectCall(incomingCall.callId);
  
  if (authUser) {
    logAuditEvent({
      user_id: authUser.id,
      action: 'CALL_REJECTED',
      entity_type: 'call',
      entity_id: incomingCall.from,
      changes: { call_id: incomingCall.callId }
    });
  }
  
  setIncomingCall(null);
  toast.info('Llamada rechazada');
}, [incomingCall, authUser, logAuditEvent]);
  // ==================== WEB AUDIO RINGTONE SETUP ====================

  useEffect(() => {
    if (!preferences.soundEnabled) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      let currentOscillators:  OscillatorNode[] = [];
      
      const playBeep = () => {
        try {
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
          
          currentOscillators. forEach(osc => {
            try { osc.stop(); } catch (e) {}
          });
          currentOscillators = [];
          
          const oscillator1 = audioContext.createOscillator();
          const oscillator2 = audioContext. createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator1.connect(gainNode);
          oscillator2.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator1.frequency.value = 440;
          oscillator2.frequency.value = 480;
          oscillator1.type = 'sine';
          oscillator2.type = 'sine';
          
          const now = audioContext.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
          gainNode.gain. linearRampToValueAtTime(0.15, now + 0.4);
          gainNode.gain. linearRampToValueAtTime(0, now + 0.5);
          
          oscillator1.start(now);
          oscillator2.start(now);
          oscillator1.stop(now + 0.5);
          oscillator2.stop(now + 0.5);
          
          currentOscillators.push(oscillator1, oscillator2);
        } catch (err) {
          console.error('❌ [RINGTONE] Error playing beep:', err);
        }
      };
      
      const stop = () => {
        currentOscillators.forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
        currentOscillators = [];
      };
      
      ringtoneRef.current = { audioContext, playBeep, stop };
      
      console.log('✅ [RINGTONE] Initialized successfully');
    } catch (error) {
      console.error('❌ [RINGTONE] Error creating ringtone:', error);
    }

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef. current.stop();
        ringtoneRef.current. audioContext.close();
        ringtoneRef.current = null;
      }
    };
  }, [preferences.soundEnabled]);

  // ==================== RINGTONE PLAYBACK ====================

  useEffect(() => {
    if (incomingCall && ringtoneRef.current && preferences.soundEnabled) {
      const playRingtone = () => {
        if (ringtoneRef. current) {
          ringtoneRef. current.playBeep();
        }
      };
      
      playRingtone();
      
      ringIntervalRef.current = setInterval(() => {
        playRingtone();
        setTimeout(playRingtone, 600);
      }, 3000);
      
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current. stop();
      }
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    }

    return () => {
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef. current = null;
      }
    };
  }, [incomingCall, preferences.soundEnabled]);

  // ==================== WEBRTC WITH RECONNECTION ====================

  const handleWebRTCReconnect = useCallback(async () => {
    if (!callStateRef.current. callId || !callStateRef.current.targetUserId) return;
    
    const maxReconnectAttempts = 3;
    const currentAttempts = callStateRef. current.reconnectAttempts || 0;
    
    if (currentAttempts >= maxReconnectAttempts) {
      console.error('❌ [WEBRTC] Max reconnection attempts reached');
      toast.error('No se pudo reconectar la llamada');
      handleCallEnd();
      return;
    }
    
    console.log(`🔄 [WEBRTC] Reconnection attempt ${currentAttempts + 1}/${maxReconnectAttempts}`);
    
    setCallState(prev => ({ 
      ...prev, 
      reconnectAttempts: currentAttempts + 1,
      callStatus: 'calling'
    }));
    
    toast.info('Reconectando llamada...');
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        await webRTCService.endCall(callStateRef.current. callId);
        
        const { localStream:  newStream, callId:  newCallId } = await webRTCService.initiateCall(
          callStateRef.current. targetUserId! ,
          callStateRef.current.callType === 'voice' ? 'audio' : 'video'
        );
        
        setLocalStream(newStream);
        setCallState(prev => ({ 
          ...prev, 
          callId: newCallId,
          callStatus: 'active'
        }));
        
        toast.success('Llamada reconectada');
      } catch (error) {
        console.error('❌ [WEBRTC] Reconnection failed:', error);
        handleWebRTCReconnect();
      }
    }, 2000 * (currentAttempts + 1));
  }, [handleCallEnd]);

  // ==================== WEBRTC INITIALIZATION ====================

  useEffect(() => {
    if (!authUser || webrtcInitRef.current) return;
    
    webrtcInitRef.current = true;

    webRTCService.ensureInitialized().catch(console.error);

    webRTCService.onRemoteStream = (stream: MediaStream) => {
      console.log('📺 [WEBRTC] Remote stream received');
      setRemoteStream(stream);
      setCallState(prev => ({ ...prev, callStatus: 'active', reconnectAttempts: 0 }));
    };

    webRTCService.onCallRequest = (from: string, callId: string, callType: 'audio' | 'video') => {
      console.log('📞 [WEBRTC] Incoming call from:', from);
      
      if (! rateLimiter.check(`call-request-${from}`, 5, 60000)) {
        toast.error('Demasiadas llamadas. Intenta más tarde.');
        return;
      }
      
      const fromUser = enterpriseUsers?.find(u => u.id === from);
      
      setIncomingCall({ from, callId, callType, fromUser });
      
      toast.info(`${fromUser?.username || 'Usuario'} está llamando... `, {
        duration: 30000,
        action: {
          label: 'Responder',
          onClick: () => {
            if (ringtoneRef.current) {
              ringtoneRef.current. stop();
            }
            if (ringIntervalRef.current) {
              clearInterval(ringIntervalRef.current);
              ringIntervalRef.current = null;
            }
            handleAcceptIncomingCall(from, callId, callType);
          }
        }
      });

      const timeout = setTimeout(() => {
        if (incomingCallRef.current?.callId === callId) {
          console.log('⏰ [AUTO-HANGUP] Incoming call timeout');
          handleRejectIncomingCall();
          toast.error('Llamada perdida');
        }
      }, 30000);
      
      callTimeoutRef.current = timeout;
    };

    webRTCService.onCallAccept = () => {
      console.log('✅ [WEBRTC] Call accepted');
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef. current);
        callTimeoutRef.current = null;
      }
      setCallState(prev => ({ ...prev, callStatus: 'active', reconnectAttempts: 0 }));
      toast.success('Llamada conectada');
    };

    webRTCService.onCallReject = () => {
      console.log('❌ [WEBRTC] Call rejected');
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      handleCallEnd();
      toast.error('Llamada rechazada');
    };

    webRTCService.onCallEnd = () => {
      console.log('🔚 [WEBRTC] Call ended');
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef. current);
        callTimeoutRef.current = null;
      }
      handleCallEnd();
      toast.info('Llamada finalizada');
    };

    webRTCService.onError = (error: any) => {
      console.error('❌ [WEBRTC] Error:', error);
      
      if (callStateRef.current. callStatus === 'active') {
        toast.error('Error en la llamada.  Intentando reconectar...');
        handleWebRTCReconnect();
      } else {
        toast. error(`Error: ${error}`);
      }
    };

    webRTCService.onCallStateChange = (state: string) => {
      console.log('🔌 [WEBRTC] Call state:', state);
      
      if (state === 'connected') {
        setCallState(prev => ({ ...prev, callStatus: 'active', reconnectAttempts: 0 }));
      } else if (state === 'disconnected' && callStateRef.current.callStatus === 'active') {
        console.warn('⚠️ [WEBRTC] Connection lost, attempting reconnect...');
        handleWebRTCReconnect();
      } else if (state === 'failed') {
        console.error('❌ [WEBRTC] Connection failed');
        handleWebRTCReconnect();
      }
    };

    return () => {
      console.log('🔚 [WEBRTC] Cleanup');
      webrtcInitRef.current = false;
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [authUser, handleWebRTCReconnect, handleCallEnd, handleRejectIncomingCall, handleAcceptIncomingCall]);

  // ==================== INCOMING CALL NOTIFICATION ====================
useEffect(() => {
  const notificationData = sessionStorage.getItem('incomingCallNotification');
  if (!notificationData || !enterpriseUsers) return;

  try {
    const { from, callId, callType, fromUser, timestamp } = JSON.parse(notificationData);  // ✅ ADDED: callId
    
    if (Date.now() - timestamp < 60000) {
      const callingUser = enterpriseUsers.find(u => u.id === from);
      const displayName = callingUser?.username || fromUser?.full_name || 'Usuario';
      
      console.log('📞 [NOTIFICATION] Auto-accepting call:', { from, callId, callType });
      
      // ✅ FIXED:  Automatically accept the call (don't show toast, just connect)
      (async () => {
        try {
          // Clear storage first
          sessionStorage.removeItem('incomingCallNotification');
          
          // Accept the call directly
          const localStream = await webRTCService.acceptCall(callId, callType);
          
          setLocalStream(localStream);
          setCallState({
            callType:  callType === 'audio' ? 'voice' : 'video',
            callStatus: 'active',
            targetUserId: from,
            callId,
            reconnectAttempts: 0
          });
          setCallModalOpen(true);
          
          toast.success(`Llamada aceptada con ${displayName}`);
          
          await logAuditEvent({
            user_id: authUser! .id,
            action: 'CALL_ACCEPTED_FROM_NOTIFICATION',
            entity_type: 'call',
            entity_id: from,
            changes: { call_id: callId, call_type: callType }
          });
        } catch (err) {
          console.error('❌ [NOTIFICATION] Failed to accept call:', err);
          toast.error('Error al aceptar la llamada');
        }
      })();
    } else {
      console.log('📞 [NOTIFICATION] Call expired (>60s old)');
      sessionStorage.removeItem('incomingCallNotification');
    }
  } catch (error) {
    console.error('❌ [NOTIFICATION] Error:', error);
    sessionStorage.removeItem('incomingCallNotification');
  }
}, [enterpriseUsers, authUser, logAuditEvent]);  // ✅ FIXED: Updated dependencies
  // ==================== TYPING INDICATOR ====================

  const sendTypingIndicator = useCallback(() => {
    if (!activeChatId || !authUser) return;
    
    const channel = supabase.channel(`chat-${activeChatId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: authUser.id, timestamp: Date.now() }
    });
  }, [activeChatId, authUser]);

  useEffect(() => {
    if (!activeChatId) return;

    const channel = supabase.channel(`chat-${activeChatId}`)
      .on('broadcast', { event: 'typing' }, (payload:  any) => {
        const { userId, timestamp } = payload. payload;
        
        if (userId !== authUser?. id) {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(userId, { userId, timestamp });
            return newMap;
          });
          
          setTimeout(() => {
            setTypingUsers(prev => {
              const newMap = new Map(prev);
              newMap.delete(userId);
              return newMap;
            });
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [activeChatId, authUser]);

  // ==================== NOTIFICATION LISTENER ====================
  
  useEffect(() => {
    const initNotifications = async () => {
      const enabled = areNotificationsEnabled();
      if (enabled && authUser) {
        setupMessageListener(authUser.id);
        console.log('✅ [Chat] Notification listener active');
      }
    };
    
    if (authUser) {
      initNotifications();
    }
  }, [authUser]);

  // ==================== MUTATIONS ====================

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!authUser || !activeChatId) throw new Error('No auth or chat');

      if (!rateLimiter.check(`send-message-${authUser.id}`, 10, 10000)) {
        throw new Error('Demasiados mensajes. Espera un momento.');
      }

      const activeChat = enterpriseChats?. find(c => c.id === activeChatId);
      const receiverId = activeChat?.user_1 === authUser.id ? activeChat?. user_2 : activeChat?. user_1;

      const { data, error } = await supabase
        .from('private_messages')
        .insert([{
          chat_id: activeChatId,
          sender_id: authUser.id,
          receiver_id: receiverId,
          content:  content. trim(),
          attachment_url: null,
          is_read: false
        }])
        .select()
        .single();

      if (error) throw error;

      const { error: updateError } = await supabase
     .from('conversations')
        .update({
          last_message:  content. trim(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', activeChatId);

      if (updateError) console.warn('⚠️ [CHAT UPDATE] Warning:', updateError);

      return data;
    },
    onSuccess:  () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['enterprise-chats'] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-messages', activeChatId] });
    },
    onError: (error:  any) => {
      toast.error(error.message || 'Error al enviar mensaje');
    }
  });

  const createChatMutation = useMutation({
    mutationFn:  async (otherUserId: string) => {
      if (!authUser) throw new Error('No auth');

      const existingChat = enterpriseChats?. find(chat => 
        (chat.user_1 === authUser.id && chat.user_2 === otherUserId) ||
        (chat.user_2 === authUser.id && chat.user_1 === otherUserId)
      );

      if (existingChat) return existingChat;

      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          user_1: authUser.id,
          user_2: otherUserId,
          last_message_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Chat iniciado');
      queryClient.invalidateQueries({ queryKey: ['enterprise-chats'] });
      setActiveChatId(data.id);
      setActiveView('chats');
      
      if (isMobile) {
        setMobileChatOpen(true);
        setMobileSidebarOpen(false);
      }
    },
    onError:  () => {
      toast.error('Error al crear chat');
    }
  });

  // ==================== CHAT HANDLERS ====================

  const startChat = useCallback(async (userId: string) => {
    if (!authUser) {
      toast.error('Debes iniciar sesión');
      return;
    }

    const targetUser = enterpriseUsers?. find(u => u.id === userId);
    if (!targetUser) {
      toast.error('Usuario no encontrado');
      return;
    }

    const { canChat } = checkCallPermissions(targetUser);
    if (!canChat) {
      toast.error('No tienes permiso para chatear');
      return;
    }

    await createChatMutation.mutateAsync(userId);

    if (isMobile) {
      setMobileSidebarOpen(false);
      setMobileChatOpen(true);
    }
  }, [authUser, enterpriseUsers, checkCallPermissions, createChatMutation, isMobile]);

  const toggleMic = useCallback(() => {
    if (localStream) {
      const enabled = ! isMicMuted;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      setIsMicMuted(! enabled);
      webRTCService.toggleAudio(enabled, callState. callId);
      
      toast.info(enabled ? '🎤 Micrófono activado' : '🔇 Micrófono silenciado');
    }
  }, [localStream, isMicMuted, callState.callId]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const enabled = !isVideoOff;
      localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      setIsVideoOff(!enabled);
      webRTCService.toggleVideo(enabled, callState.callId);
      
      toast.info(enabled ? '📹 Video activado' : '📴 Video desactivado');
    }
  }, [localStream, isVideoOff, callState. callId]);

  // ==================== SCREEN SHARING ====================

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always' as any
        } as MediaTrackConstraints,
        audio:  false
      });
      
      setScreenStream(stream);
      setIsScreenSharing(true);
      
      if (localStream && callState.callId) {
        const videoTrack = stream.getVideoTracks()[0];
        const pc = webRTCService.getPeerConnection(callState.callId);
        const sender = pc?. getSenders().find(s => s.track?. kind === 'video');
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }
      
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
      
      toast.success('📺 Compartiendo pantalla');
    } catch (error) {
      console.error('❌ [SCREEN SHARE] Error:', error);
      toast.error('No se pudo compartir la pantalla');
    }
  }, [localStream, callState.callId, stopScreenShare]);

  // ==================== CALL RECORDING ====================

  const startRecording = useCallback(async () => {
    try {
      if (!localStream || !remoteStream) {
        toast.error('No hay streams para grabar');
        return;
      }
      
      const combinedStream = new MediaStream([
        ... localStream.getTracks(),
        ...remoteStream.getTracks()
      ]);
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `infernal-call-${Date.now()}.webm`;
        a.click();
        
        toast.success('📹 Grabación guardada');
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingStartTime(Date. now());
      
      toast. success('🔴 Grabando llamada');
    } catch (error) {
      console.error('❌ [RECORDING] Error:', error);
      toast.error('No se pudo iniciar la grabación');
    }
  }, [localStream, remoteStream]);

  // ==================== VOICE MESSAGE ====================

  const startVoiceMessage = useCallback(async () => {
    if (!authUser || !activeChatId) {
      toast.error('No hay chat activo');
      return undefined;
    }

    if (!rateLimiter.check(`voice-message-${authUser.id}`, 3, 60000)) {
      toast.error('Demasiados mensajes de voz.  Espera un momento.');
      return undefined;
    }

    let stream: MediaStream | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let recordingTimeout: NodeJS.Timeout | null = null;

    try {
      stream = await navigator. mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: mimeType });
          
          if (blob.size > 10485760) {
            toast.error('Mensaje de voz muy largo (máx 10MB)');
            return;
          }

          if (blob.size < 1000) {
            toast.error('Mensaje de voz muy corto');
            return;
          }

          toast.info('Subiendo mensaje de voz... ', { id: 'voice-upload', duration:  Infinity });

          const fileExt = mimeType.includes('webm') ? 'webm' : 'mp4';
          const fileName = `voice-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${authUser.id}/${fileName}`;
          
          const { error:  uploadError } = await supabase. storage
            .from('chat-attachments')
            .upload(filePath, blob, {
              cacheControl: '3600',
              upsert: false,
              contentType: mimeType
            });
                      
          if (uploadError) throw uploadError;
          
          const { data:   { publicUrl } } = supabase. storage
            .from('chat-attachments')
            .getPublicUrl(filePath);
          
          const activeChat = enterpriseChats?. find(c => c.id === activeChatId);
          const receiverId = activeChat?.user_1 === authUser.id ? activeChat?. user_2 : activeChat?. user_1;
          
          if (!receiverId) {
            throw new Error('No se pudo determinar el destinatario');
          }

          const duration = Math.floor(blob.size / 16000);
          const content = `🎤 Mensaje de voz (${duration}s)`;

          const { error:  messageError } = await supabase
            .from('private_messages')
            .insert([{
              chat_id: activeChatId,
              sender_id: authUser.id,
              receiver_id: receiverId,
              content,
              attachment_url: publicUrl,
              is_read: false
            }]);

          if (messageError) throw messageError;

          const { error:  chatUpdateError } = await supabase
            .from('conversations')
            .update({
              last_message:  content,
              last_message_at: new Date().toISOString()
            })
            .eq('id', activeChatId);

          if (chatUpdateError) {
            console.warn('⚠️ [VOICE] Chat update warning:', chatUpdateError);
          }
          
          queryClient.invalidateQueries({ queryKey: ['enterprise-messages', activeChatId] });
          queryClient.invalidateQueries({ queryKey: ['enterprise-chats'] });
          
          toast.dismiss('voice-upload');
          toast.success('🎤 Mensaje de voz enviado');

          await logAuditEvent({
            user_id: authUser.id,
            action: 'VOICE_MESSAGE_SENT',
            entity_type: 'message',
            entity_id: activeChatId,
            changes: { file_size: blob.size, duration }
          });

        } catch (error:   any) {
          console.error('❌ [VOICE MESSAGE] Upload error:', error);
          toast.dismiss('voice-upload');
          toast.error(`Error al enviar:  ${error.message || 'Desconocido'}`);
        } finally {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
      };

      mediaRecorder.onerror = (event:   any) => {
        console.error('❌ [VOICE MESSAGE] Recording error:', event.  error);
        toast.error('Error al grabar mensaje de voz');
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.start(1000);
      
      recordingTimeout = setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          toast.info('Grabación detenida (límite de 60s alcanzado)');
        }
      }, 60000);
      
      toast.info('🔴 Grabando mensaje de voz... (máx 60s)', {
        duration: 60000,
        action: {
          label: 'Detener',
          onClick: () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
              if (recordingTimeout) clearTimeout(recordingTimeout);
            }
          }
        }
      });
      
      const cleanup = () => {
        if (mediaRecorder && mediaRecorder. state === 'recording') {
          mediaRecorder.stop();
        }
        if (recordingTimeout) {
          clearTimeout(recordingTimeout);
        }
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      voiceRecordingCleanupRef.current = cleanup;
      
      return cleanup;

    } catch (error:  any) {
      console.error('❌ [VOICE MESSAGE] Error:', error);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Permiso de micrófono denegado');
      } else if (error.name === 'NotFoundError') {
        toast.error('No se encontró micrófono');
      } else {
        toast.error('No se pudo grabar el mensaje de voz');
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
      }

      return undefined;
    }
  }, [authUser, activeChatId, enterpriseChats, queryClient, logAuditEvent]);

  useEffect(() => {
    return () => {
      if (voiceRecordingCleanupRef.current) {
        voiceRecordingCleanupRef. current();
        voiceRecordingCleanupRef.current = null;
      }
    };
  }, []);

  // ==================== MESSAGE REACTIONS ====================

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!authUser) return;
    
    try {
      const existingReaction = reactions.find(
        r => r.messageId === messageId && r.userId === authUser.id && r.emoji === emoji
      );
      
      if (existingReaction) {
        setReactions(prev => prev.filter(r => r !== existingReaction));
        toast.info('Reacción eliminada');
      } else {
        const newReaction:  MessageReaction = {
          messageId,
          userId: authUser.id,
          emoji
        };
        setReactions(prev => [...prev, newReaction]);
        toast.success(`Reacción ${emoji} añadida`);
      }
    } catch (error) {
      console.error('❌ [REACTION] Error:', error);
      toast.error('Error al añadir reacción');
    }
  }, [authUser, reactions]);

  // ==================== AVATAR CLICK HANDLER ====================

  const handleAvatarClick = useCallback((userId: string) => {
    console.log('👤 [AVATAR] Clicked user:', userId);
    
    const user = enterpriseUsers?. find(u => u.id === userId);
    if (!user) {
      toast.error('Usuario no encontrado');
      return;
    }

    toast.info(`Perfil de ${user.username}`, {
      description: `Email: ${user.email}\nEstado: ${user.is_online ? 'En línea' : 'Desconectado'}`,
      duration: 5000,
      action: {
        label: 'Chatear',
        onClick: () => startChat(userId)
      }
    });
  }, [enterpriseUsers, startChat]);

  // ==================== REALTIME SUBSCRIPTIONS ====================

  useEffect(() => {
    if (!authUser || !activeChatId) return;

    const subscription = supabase
      .channel(`messages-${activeChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `chat_id=eq.${activeChatId}`
        },
        (payload) => {
          const isOwnMessage = payload.new?.  sender_id === authUser.id;
          
          queryClient.invalidateQueries({ queryKey: ['enterprise-messages', activeChatId] });
          queryClient.invalidateQueries({ queryKey: ['enterprise-chats'] });
          
          if (preferences.soundEnabled && ! isOwnMessage) {
            try {
              const ctx = new (window. AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              
              osc.connect(gain);
              gain.connect(ctx.destination);
              
              osc.frequency. value = 800;
              osc.type = 'sine';
              gain.gain.setValueAtTime(0, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
              gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
              
              osc. start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.15);
              
              setTimeout(() => ctx.close(), 200);
            } catch (e) {
              console.warn('⚠️ [AUDIO] Notification sound failed:', e);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [authUser, activeChatId, queryClient, preferences.soundEnabled]);

  // ==================== UI EFFECTS ====================

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [enterpriseMessages]);

  // ==================== UI HANDLERS ====================

  const handleChatSelect = useCallback(async (chatId: string) => {
    if (!authUser) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setActiveChatId(chatId);
    
    try {
      const { error } = await supabase
        .from('private_messages')
        .update({
          is_read: true
        })
        .eq('chat_id', chatId);

      if (error) {
        console.warn('⚠️ [CHAT] Failed to mark as read:', error);
      }
      
      queryClient.invalidateQueries({ queryKey: ['enterprise-messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-chats'] });

      await logAuditEvent({
        user_id: authUser.id,
        action: 'CHAT_OPENED',
        entity_type: 'chat',
        entity_id: chatId
      });
    } catch (error) {
      console.error('❌ [CHAT] Error marking as read:', error);
    }

    if (isMobile) {
      setMobileChatOpen(true);
      setMobileSidebarOpen(false);
    }
  }, [authUser, isMobile, queryClient, logAuditEvent]);

  const handleSendMessage = useCallback(() => {
    if (!messageInput.trim()) {
      toast.error('Escribe un mensaje');
      return;
    }

    if (!activeChatId) {
      toast.error('Selecciona un chat');
      return;
    }

    if (! authUser) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (messageInput.length > 1000) {
      toast.error('Mensaje muy largo (máx 1000 caracteres)');
      return;
    }

    sendMessageMutation.mutate(messageInput);
  }, [messageInput, activeChatId, authUser, sendMessageMutation]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    if (! activeChatId || !authUser) {
      toast.error('No hay chat activo');
      return;
    }

    if (! rateLimiter.check(`file-upload-${authUser.id}`, 5, 60000)) {
      toast.error('Demasiados archivos.  Espera un momento.');
      return;
    }

    if (file.size > 10485760) {
      toast.error('El archivo es demasiado grande (máx 10MB)');
      return;
    }

    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf'
    ];

    if (!validTypes.includes(file.  type)) {
      toast.error('Tipo de archivo no soportado.  Solo imágenes, videos o PDF.');
      return;
    }

    try {
      console.log('📎 [FILE] Uploading:', file.name, file.size, 'bytes', file.type);
      toast.info('Subiendo archivo...  ', { duration:    Infinity, id: 'file-upload' });

      const fileExt = file.name.split('.').pop() || 'bin';
      const sanitizedFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${authUser.id}/${sanitizedFileName}`;

      const { error:   uploadError } = await supabase. storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('❌ [FILE] Upload error:', uploadError);
        throw new Error(uploadError. message || 'Error al subir archivo');
      }

      const { data:  { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      console.log('🔗 [FILE] Public URL:', publicUrl);

      let messageContent = '';
      const fileSizeMB = (file.size / 1048576).toFixed(2);
      
      if (file.type.startsWith('image/')) {
        messageContent = `📷 Imagen:  ${file.name} (${fileSizeMB}MB)`;
      } else if (file.type. startsWith('video/')) {
        messageContent = `🎥 Video: ${file.name} (${fileSizeMB}MB)`;
      } else if (file.type === 'application/pdf') {
        messageContent = `📄 PDF: ${file.name} (${fileSizeMB}MB)`;
      } else {
        messageContent = `📎 Archivo: ${file.name} (${fileSizeMB}MB)`;
      }

      const activeChat = enterpriseChats?.  find(c => c.id === activeChatId);
      const receiverId = activeChat?.user_1 === authUser.id ?  activeChat?.user_2 :  activeChat?.user_1;

      if (!receiverId) {
        throw new Error('No se pudo determinar el destinatario');
      }

      const { error:  messageError } = await supabase
        .from('private_messages')
        .insert([{
          chat_id: activeChatId,
          sender_id: authUser.id,
          receiver_id: receiverId,
          content: messageContent,
          attachment_url: publicUrl,
          is_read: false
        }]);

      if (messageError) {
        console.error('❌ [FILE] Message insert error:', messageError);
        throw new Error(messageError. message || 'Error al enviar mensaje');
      }

      const { error: chatUpdateError } = await supabase
        .from('conversations')
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString()
        })
        .eq('id', activeChatId);

      if (chatUpdateError) {
        console.warn('⚠️ [FILE] Chat update warning:', chatUpdateError);
      }

      queryClient.invalidateQueries({ queryKey: ['enterprise-chats'] });
      queryClient. invalidateQueries({ queryKey:  ['enterprise-messages', activeChatId] });

      await logAuditEvent({
        user_id: authUser.id,
        action: 'FILE_UPLOADED',
        entity_type: 'message',
        entity_id: activeChatId,
        changes:    { 
          file_name: file.name, 
          file_size: file.size, 
          file_type: file.type 
        }
      });

      toast.dismiss('file-upload');
      toast.success('✅ Archivo enviado correctamente');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error:  any) {
      console.error('❌ [FILE] Error:', error);
      toast.dismiss('file-upload');
      toast.error(`Error al subir archivo: ${error.message || 'Desconocido'}`);
    }
  }, [activeChatId, authUser, enterpriseChats, queryClient, logAuditEvent]);

  const handleBackToSocial = useCallback(() => {
    if (confirm('¿Volver a la página social?')) {
      window.location.href = '/feed';
    }
  }, []);

  const handleBackToChats = useCallback(() => {
    if (isMobile) {
      setMobileChatOpen(false);
      setMobileSidebarOpen(true);
      setActiveChatId(null);
    }
  }, [isMobile]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newMode = !prev;
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setEmojiPickerOpen(false);
    
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('. message-input')?.focus();
    }, 100);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(prev => !prev);
  }, []);

  // ==================== KEYBOARD SHORTCUTS ====================

  useKeyboardShortcuts({
    'Ctrl+k': () => {
      document.querySelector<HTMLInputElement>('.search-input')?.focus();
    },
    'Ctrl+Enter': handleSendMessage,
    'Escape': () => {
      if (callModalOpen) {
        handleCallEnd();
      } else if (settingsOpen) {
        setSettingsOpen(false);
      } else if (keyboardShortcutsOpen) {
        setKeyboardShortcutsOpen(false);
      }
    },
    'Ctrl+m': toggleMic,
    'Ctrl+Shift+v': toggleVideo,
    'Ctrl+Shift+s': () => {
      if (isScreenSharing) {
        stopScreenShare();
      } else {
        startScreenShare();
      }
    },
    'Ctrl+Shift+r': () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    },
    'Ctrl+/': () => setKeyboardShortcutsOpen(true),
    'Alt+1': () => setActiveView('chats'),
    'Alt+2': () => setActiveView('contacts'),
  });

  // ==================== TRANSLATIONS ====================

  const translations = {
    es: {
      online: 'En línea',
      offline: 'Desconectado',
      available: 'Disponible',
      searchChats: 'Buscar chats...  (Ctrl+K)',
      searchContacts: 'Buscar contactos... (Ctrl+K)',
      all: 'Todos',
      unread: 'No leídos',
      welcome: 'Bienvenido a Infernal Chat',
      welcomeDesc: 'Selecciona un chat o inicia uno nuevo',
      writeMessage: 'Escribe un mensaje...  (Shift+Enter para nueva línea)',
      suggestedContacts: 'Contactos sugeridos',
      friends: 'Amigos',
      settings: 'Configuración',
      darkMode: 'Modo oscuro',
      language: 'Idioma',
      encryption: 'Cifrado',
      logout: 'Cerrar sesión',
      noChats: 'No hay chats',
      noContacts: 'No hay contactos',
      startChat: 'Iniciar chat',
      loadingContacts: 'Cargando.. .',
      noResults: 'Sin resultados',
      accept: 'Aceptar',
      reject: 'Rechazar',
      incomingCall: 'Llamada entrante',
      typing: 'escribiendo...',
      screenSharing: 'Compartir pantalla',
      recording: 'Grabando',
      voiceMessage: 'Mensaje de voz',
      keyboardShortcuts: 'Atajos de teclado',
      soundEnabled: 'Sonido',
      notifications: 'Notificaciones'
    },
    en: {
      online: 'Online',
      offline: 'Offline',
      available: 'Available',
      searchChats: 'Search chats... (Ctrl+K)',
      searchContacts: 'Search contacts... (Ctrl+K)',
      all: 'All',
      unread: 'Unread',
      welcome:  'Welcome to Infernal Chat',
      welcomeDesc: 'Select a chat or start a new one',
      writeMessage:  'Write a message... (Shift+Enter for new line)',
      suggestedContacts: 'Suggested Contacts',
      friends: 'Friends',
      settings: 'Settings',
      darkMode: 'Dark mode',
      language: 'Language',
      encryption: 'Encryption',
      logout: 'Log out',
      noChats:  'No chats',
      noContacts: 'No contacts',
      startChat: 'Start chat',
      loadingContacts: 'Loading...',
      noResults: 'No results',
      accept: 'Accept',
      reject: 'Reject',
      incomingCall: 'Incoming call',
      typing: 'typing...',
      screenSharing: 'Screen sharing',
      recording: 'Recording',
      voiceMessage: 'Voice message',
      keyboardShortcuts: 'Keyboard shortcuts',
      soundEnabled: 'Sound',
      notifications: 'Notifications'
    }
  };

  const t = translations[language as keyof typeof translations];

  // ==================== UTILITY FUNCTIONS ====================

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return language === 'es' ? 'Ayer' : 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }, [language]);

  const getMessageStatusIcon = useCallback((isRead: boolean) => {
    return isRead ? <CheckCheck size={12} className="text-blue-500" /> : <Check size={12} className="text-gray-400" />;
  }, []);

  const getCallStatusForModal = useCallback((): 'calling' | 'ringing' | 'active' | 'ended' => {
    if (callState. callStatus === 'idle') return 'ended';
    return callState.callStatus as 'calling' | 'ringing' | 'active' | 'ended';
  }, [callState.callStatus]);

  const getTypingIndicator = useCallback(() => {
    if (typingUsers.size === 0) return null;
    
    const userNames = Array.from(typingUsers.keys())
      .map(userId => enterpriseUsers?.find(u => u.id === userId)?.username || 'Usuario')
      .join(', ');
    
    return `${userNames} ${t. typing}`;
  }, [typingUsers, enterpriseUsers, t. typing]);

  // ==================== MEMOIZED CONTACT LIST ====================

  const ContactListItem = memo(({ user, isCalling, callType }: { 
    user: Profile; 
    isCalling:  boolean; 
    callType:  'audio' | 'video' 
  }) => {
    const isOnline = user.is_online;
    const { canVoiceCall, canVideoCall, canChat } = checkCallPermissions(user);
    
    return (
      <div 
        className={`contact-item ${isCalling ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950 animate-pulse' : ''}`}
        role="listitem"
        aria-label={`${user.username} ${isOnline ? 'en línea' : 'desconectado'}`}
      >
        <div className="contact-avatar relative" onClick={() => handleAvatarClick(user.id)}>
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={`Avatar de ${user.username}`}
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`avatar-fallback ${user.avatar_url ? 'hidden' :  ''}`}>
            {user.username?. charAt(0).toUpperCase() || 'U'}
          </div>
          <div 
            className={`online-indicator ${isOnline ? 'online' : 'offline'}`}
            aria-label={isOnline ? 'En línea' : 'Desconectado'}
          />
          {isCalling && (
            <div 
              className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-bounce shadow-lg z-10"
              aria-label="Llamando"
            >
              {callType === 'video' ? (
                <Video className="w-3 h-3 text-white" />
              ) : (
                <Phone className="w-3 h-3 text-white" />
              )}
            </div>
          )}
        </div>
        <div className="contact-details">
          <div className={`contact-name ${isCalling ? 'font-bold text-green-600 dark:text-green-500' : ''}`}>
            {user.username}
            {isCalling && ' 📞'}
          </div>
          <div className="contact-email">
            {isCalling ? (
              <span className="text-green-600 dark:text-green-500 font-semibold text-xs">
                🔔 ¡Te está llamando!
              </span>
            ) : (
              user.email
            )}
          </div>
        </div>
        <div className="contact-actions">
          <button 
            className={`action-btn chat-btn ${! canChat ? 'disabled' :  ''}`}
            onClick={() => startChat(user.id)}
            disabled={!canChat}
            aria-label={`Chatear con ${user.username}`}
          >
            <MessageCircle size={16} />
          </button>
          <button 
            className={`action-btn call-btn ${!canVoiceCall ? 'disabled' : ''} ${isCalling && callType === 'audio' ? 'bg-green-500 text-white animate-pulse' : ''}`}
            onClick={() => {
              sessionStorage.removeItem('incomingCallNotification');
              startVoiceCall(user.id);
            }}
            disabled={! canVoiceCall}
            aria-label={`Llamar a ${user.username}`}
          >
            <Phone size={16} />
          </button>
          <button 
            className={`action-btn video-btn ${!canVideoCall ?  'disabled' : ''} ${isCalling && callType === 'video' ? 'bg-green-500 text-white animate-pulse' : ''}`}
            onClick={() => {
              sessionStorage.removeItem('incomingCallNotification');
              startVideoCall(user.id);
            }}
            disabled={!canVideoCall}
            aria-label={`Videollamar a ${user.username}`}
          >
            <Video size={16} />
          </button>
        </div>
      </div>
    );
  });

  ContactListItem.displayName = 'ContactListItem';

  // ==================== RENDER CONTACTS LIST ====================

  const renderContactsList = useCallback(() => {
    if (friendsLoading || usersLoading) {
      return (
        <div className="loading-state" role="status" aria-live="polite">
          <div className="loading-spinner"></div>
          <p>{t.loadingContacts}</p>
        </div>
      );
    }

    const { filteredFriends, filteredOtherUsers } = getFilteredContacts;

    if (debouncedSearchQuery.trim() && filteredFriends.length === 0 && filteredOtherUsers.length === 0) {
      return (
        <div className="empty-state" role="status">
          <Search size={48} />
          <p>{t.noResults}</p>
        </div>
      );
    }

    const notificationData = sessionStorage.getItem('incomingCallNotification');
    let callingUserId: string | null = null;
    let callType: 'audio' | 'video' = 'video';
    
    if (notificationData) {
      try {
        const parsed = JSON.parse(notificationData);
        callingUserId = parsed.from;
        callType = parsed. callType;
      } catch (e) {}
    }

    return (
      <div className="contacts-list" role="list">
        {filteredFriends.length > 0 && (
          <>
            <div className="contacts-section-header">
              <User size={16} />
              <span>{t.friends} ({filteredFriends.length})</span>
            </div>
            {filteredFriends.map(user => (
              <ContactListItem 
                key={user. id} 
                user={user}
                isCalling={callingUserId === user.id}
                callType={callType}
              />
            ))}
          </>
        )}

        {filteredOtherUsers.length > 0 && (
          <>
            <div className="contacts-section-header">
              <User size={16} />
              <span>{t.suggestedContacts} ({filteredOtherUsers. length})</span>
            </div>
            {filteredOtherUsers.map(user => (
              <ContactListItem 
                key={user.id} 
                user={user}
                isCalling={callingUserId === user.id}
                callType={callType}
              />
            ))}
          </>
        )}
      </div>
    );
  }, [friendsLoading, usersLoading, getFilteredContacts, debouncedSearchQuery, t, startChat, startVoiceCall, startVideoCall, checkCallPermissions, handleAvatarClick]);

  // ==================== MAIN RENDER ====================

  return (
    <>
      <NotificationPrompt />
      <ErrorBoundary>
        <div className={`infernal-chat-enterprise ${darkMode ? 'dark' : ''}`} role="main">
          <header 
            className="enterprise-header" 
            role="banner"
            style={{
              height: isMobile ? '56px' : '64px',
              minHeight: isMobile ? '56px' : '64px',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--header-bg)',
              padding: isMobile ? '0 0.75rem' : '0 1.5rem',
              position: 'sticky',
              top: 0,
              zIndex: 40
            }}
          >
            <div className="header-content" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="brand-section" style={{ display: 'flex', alignItems:  'center', gap: '0.5rem' }}>
                {isMobile ?  (
                  <>
                    {! mobileChatOpen ?  (
                      <button 
                        className="icon-btn menu-btn"
                        onClick={toggleMobileSidebar}
                        aria-label="Abrir menú"
                        aria-expanded={mobileSidebarOpen}
                        style={{ marginRight: '0.5rem' }}
                      >
                        <Menu size={24} />
                      </button>
                    ) : (
                      <button 
                        className="icon-btn back-btn" 
                        onClick={handleBackToChats}
                        aria-label="Volver a chats"
                      >
                        <ArrowLeft size={20} />
                      </button>
                    )}
                  </>
                ) : (
                  activeChatId && (
                    <button 
                      className="icon-btn back-btn" 
                      onClick={handleBackToSocial}
                      aria-label="Volver a social"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )
                )}
                <div className="logo" style={{ display: 'flex', alignItems:  'center', gap: '0.5rem' }}>
                  <MessageCircle size={24} className="logo-icon" />
                  <span className="app-name">Infernal Chat</span>
                </div>
              </div>

              <div className="status-section" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="status-indicator online" role="status" aria-live="polite" style={{ display: 'flex', alignItems:  'center', gap: '0.5rem' }}>
                  <div className="status-dot"></div>
                  <span className="hidden sm:inline">{t.online}</span>
                </div>
                
                <div className="language-toggle hidden sm:flex" role="group" aria-label="Seleccionar idioma">
                  <button 
                    className={`lang-btn ${language === 'es' ? 'active' : ''}`}
                    onClick={() => setLanguage('es')}
                    aria-label="Español"
                    aria-pressed={language === 'es'}
                  >
                    ES
                  </button>
                  <button 
                    className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                    onClick={() => setLanguage('en')}
                    aria-label="English"
                    aria-pressed={language === 'en'}
                  >
                    EN
                  </button>
                </div>
              </div>

              <div className="actions-section" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isMobile && (
                  <button 
                    className="icon-btn" 
                    onClick={handleBackToSocial}
                    aria-label="Volver a social"
                    title="Volver a social"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <button 
                  className="icon-btn hidden sm:flex" 
                  onClick={toggleDarkMode}
                  aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
                  aria-pressed={darkMode}
                >
                  {darkMode ?  <Sun size={20} /> :  <Moon size={20} />}
                </button>
                <button 
                  className="icon-btn" 
                  onClick={() => setKeyboardShortcutsOpen(true)}
                  aria-label="Atajos de teclado (Ctrl+/)"
                  title="Atajos de teclado (Ctrl+/)"
                >
                  <Keyboard size={20} />
                </button>
                <button 
                  className="icon-btn" 
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Configuración"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>
          </header>

          <div className="infernal-layout">
            {isMobile && mobileSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-35 transition-opacity duration-300"
                onClick={() => setMobileSidebarOpen(false)}
                aria-hidden="true"
              />
            )}

            <aside 
              className={`chats-sidebar ${isMobile ? (mobileSidebarOpen ? 'mobile-open' : 'mobile-closed') : ''}`}
              role="complementary"
              aria-label="Barra lateral de chats"
              style={isMobile ? { 
                display: mobileSidebarOpen ? 'flex' : 'none',
                zIndex: mobileSidebarOpen ? 50 : -1 
              } : {
                display: 'flex'
              }}
            >
              <div className="sidebar-header">
                <div className="user-profile">
                  <div className="user-avatar">
                    <div className="avatar-fallback">
                      {authUser?.email?. charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="online-indicator"></div>
                  </div>
                  <div className="user-info">
                    <div className="user-name truncate">{authUser?.email || 'Usuario'}</div>
                    <div className="user-status">{t.available}</div>
                  </div>
                  {isMobile && (
                    <button 
                      className="icon-btn mobile-close-btn" 
                      onClick={() => setMobileSidebarOpen(false)}
                      aria-label="Cerrar menú"
                      style={{ marginLeft: 'auto' }}
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div className="view-tabs" role="tablist">
                  <button 
                    className={`view-tab ${activeView === 'chats' ?  'active' : ''}`}
                    onClick={() => setActiveView('chats')}
                    role="tab"
                    aria-selected={activeView === 'chats'}
                    aria-label="Todos los chats (Alt+1)"
                  >
                    <MessageCircle size={18} />
                    <span className="hidden sm:inline">{t.all}</span>
                  </button>
                  <button 
                    className={`view-tab ${activeView === 'contacts' ? 'active' : ''}`}
                    onClick={() => setActiveView('contacts')}
                    role="tab"
                    aria-selected={activeView === 'contacts'}
                    aria-label="Contactos sugeridos (Alt+2)"
                  >
                    <User size={18} />
                    <span className="hidden sm:inline">{t.suggestedContacts}</span>
                  </button>
                </div>
              </div>

              <div className="search-section">
                <div className="search-input-container">
                  <Search size={18} aria-hidden="true" />
                  <input
                    type="text"
                    placeholder={activeView === 'chats' ?  t.searchChats : t.searchContacts}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e. target.value)}
                    className="search-input"
                    aria-label="Buscar"
                  />
                  {searchQuery && (
                    <button 
                      className="clear-search" 
                      onClick={() => setSearchQuery('')}
                      aria-label="Limpiar búsqueda"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {activeView === 'chats' && (
                <div className="chats-tabs" role="tablist">
                  <button 
                    className={`chats-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                    role="tab"
                    aria-selected={activeTab === 'all'}
                  >
                    {t.all}
                  </button>
                  <button 
                    className={`chats-tab ${activeTab === 'unread' ? 'active' :  ''}`}
                    onClick={() => setActiveTab('unread')}
                    role="tab"
                    aria-selected={activeTab === 'unread'}
                  >
                    {t.unread}
                  </button>
                </div>
              )}

              <div className="chats-list flex-1 overflow-y-auto" role="list">
                {activeView === 'chats' ?  (
                  filteredChats.length === 0 ? (
                    <div className="empty-state" role="status">
                      <MessageCircle size={48} />
                      <p>{t.noChats}</p>
                    </div>
                  ) : (
                    (() => {
                      const notificationData = sessionStorage.getItem('incomingCallNotification');
                      let callingUserId: string | null = null;
                      let callType: 'audio' | 'video' = 'video';
                      
                      if (notificationData) {
                        try {
                          const parsed = JSON.parse(notificationData);
                          callingUserId = parsed.from;
                          callType = parsed. callType;
                        } catch (e) {}
                      }

                      return filteredChats.map(chat => {
                        const otherUserId = chat.user_1 === authUser?.id ? chat.user_2 : chat. user_1;
                        const otherUser = enterpriseUsers?. find(u => u.id === otherUserId);
                        const displayName = otherUser?.username || 'Usuario';
                        const isOnline = otherUser?.is_online;
                        const isCalling = callingUserId === otherUserId;
                        
                        return (
                          <div 
                            key={chat.id} 
                            className={`chat-item ${activeChatId === chat.id ?  'active' : ''} ${isCalling ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950' : ''}`}
                            onClick={() => handleChatSelect(chat.id)}
                            role="listitem"
                            aria-label={`Chat con ${displayName}`}
                          >
                            <div className="chat-avatar relative" onClick={(e) => {
                              e.stopPropagation();
                              handleAvatarClick(otherUserId);
                            }}>
                              {otherUser?.avatar_url ? (
                                <img 
                                  src={otherUser.avatar_url} 
                                  alt={`Avatar de ${displayName}`}
                                  className="w-full h-full object-cover rounded-full"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`avatar-fallback ${otherUser?.avatar_url ? 'hidden' :  ''}`}>
                                {displayName. charAt(0).toUpperCase()}
                              </div>
                              <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                              {isCalling && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-bounce shadow-lg z-10">
                                  {callType === 'video' ?  (
                                    <Video className="w-3 h-3 text-white" />
                                  ) : (
                                    <Phone className="w-3 h-3 text-white" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="chat-details flex-1 min-w-0">
                              <div className="chat-header">
                                <span className={`chat-name truncate ${isCalling ? 'font-bold text-green-600 dark:text-green-500' : ''}`}>
                                  {displayName}
                                  {isCalling && ' 📞'}
                                </span>
                                <span className="chat-time text-xs">{formatTimestamp(chat.last_message_at)}</span>
                              </div>
                              <div className="chat-preview wrap-break-word">
                                {isCalling ? (
                                  <span className="text-green-600 dark:text-green-500 font-semibold animate-pulse text-xs">
                                    🔔 Llamando...  
                                  </span>
                                ) : (
                                  chat.last_message || 'Chat iniciado'
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )
                ) : (
                  renderContactsList()
                )}
              </div>
            </aside>

            <main className="main-chat-area flex-1" role="main">
              {! activeChatId ?  (
                <div 
                  className="welcome-screen"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent:  'center',
                    width: '100%',
                    height: '100%',
                    padding: '2rem 1rem',
                    visibility: 'visible',
                    opacity: 1
                  }}
                >
                  <div className="welcome-icon" style={{ display: 'flex', marginBottom: '1.5rem', color: '#007bff' }}>
                    <Shield size={64} />
                  </div>
                  <h2 style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.5rem', fontWeight: 600 }}>
                    {t.welcome}
                  </h2>
                  <p style={{ display: 'block', marginBottom:  '1.5rem', textAlign: 'center', maxWidth: '320px' }}>
                    {t.welcomeDesc}
                  </p>
                  {isMobile && (
                    <button
                      onClick={() => setMobileSidebarOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginTop: '2rem',
                        padding: '1rem 2rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      <MessageCircle size={20} />
                      Ver Chats
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="chat-header">
                    {isMobile && (
                      <button 
                        className="icon-btn" 
                        onClick={handleBackToChats}
                        aria-label="Cerrar chat"
                      >
                        <X size={20} />
                      </button>
                    )}
                    
                    <div className="chat-user-info">
                      <div className="user-avatar" onClick={() => activeUser && handleAvatarClick(activeUser.id)}>
                        {activeUser?.avatar_url ? (
                          <img 
                            src={activeUser.avatar_url} 
                            alt={`Avatar de ${activeUser.username}`}
                            className="w-full h-full object-cover rounded-full"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`avatar-fallback ${activeUser?.avatar_url ? 'hidden' : ''}`}>
                          {activeUser?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="online-indicator"></div>
                      </div>
                      <div className="user-details">
                        <div className="user-name truncate">{activeUser?.username || 'Usuario'}</div>
                        <div className="user-status text-xs">
                          {getTypingIndicator() || t.online}
                        </div>
                      </div>
                    </div>
                    
                    <div className="chat-actions">
                      <button 
                        className="icon-btn" 
                        onClick={() => activeUser && startVoiceCall(activeUser.id)}
                        aria-label="Llamada de voz"
                        disabled={!activeUser}
                      >
                        <Phone size={20} />
                      </button>
                      <button 
                        className="icon-btn" 
                        onClick={() => activeUser && startVideoCall(activeUser.id)}
                        aria-label="Videollamada"
                        disabled={!activeUser}
                      >
                        <Video size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="messages-container" role="log" aria-live="polite" aria-label="Mensajes">
                    {messagesLoading ? (
                      <div className="loading-messages">
                        <div className="loading-spinner"></div>
                        <p>Cargando mensajes...</p>
                      </div>
                    ) : enterpriseMessages?. length === 0 ? (
                      <div className="no-messages">
                        <MessageCircle size={48} />
                        <p>No hay mensajes aún</p>
                      </div>
                    ) : (
                      enterpriseMessages?.map(message => {
                        const isSent = message.sender_id === authUser?.id;
                        const messageReactions = reactions. filter(r => r.messageId === message.id);
                        const hasAttachment = !!message.attachment_url;
                        const isImage = hasAttachment && message.content. includes('📷');
                        const isVideo = hasAttachment && message.content.includes('🎥');
                        const isAudio = hasAttachment && message.content.includes('🎤');
                        
                        return (
                          <div 
                            key={message.id} 
                            className={`message ${isSent ? 'sent' : 'received'}`}
                            role="article"
                            aria-label={`Mensaje de ${isSent ? 'ti' : message.sender_profile?. username || 'usuario'}`}
                          >
                            <div className="message-content wrap-break-word">
                              {isImage && hasAttachment && (
                                <img 
                                  src={message.attachment_url} 
                                  alt="Imagen adjunta"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    cursor: 'pointer',
                                    display: 'block'
                                  }}
                                  loading="lazy"
                                  onClick={() => window.open(message.attachment_url, '_blank')}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              {isVideo && hasAttachment && (
                                <video 
                                  src={message.attachment_url}
                                  controls
                                  preload="metadata"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    display: 'block'
                                  }}
                                >
                                  Tu navegador no soporta video. 
                                </video>
                              )}

                              {isAudio && hasAttachment && (
                                <audio 
                                  src={message.attachment_url}
                                  controls
                                  style={{
                                    maxWidth:  '100%',
                                    marginBottom: '8px',
                                    display: 'block'
                                  }}
                                >
                                  Tu navegador no soporta audio.
                                </audio>
                              )}

                              {hasAttachment && ! isImage && !isVideo && ! isAudio && (
                                <a 
                                  href={message.attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems:  'center',
                                    gap: '8px',
                                    padding:  '8px 12px',
                                    background: 'rgba(255,255,255,0.15)',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    marginBottom: '8px'
                                  }}
                                >
                                  <Paperclip size={14} />
                                  <span style={{ fontSize: '0.875rem' }}>Ver archivo</span>
                                </a>
                              )}

                              {message.content}

                              {messageReactions.length > 0 && (
                                <div className="message-reactions">
                                  {messageReactions.map((r, i) => (
                                    <span key={i} className="reaction">{r.emoji}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="message-footer" style={{ display: 'flex', alignItems: 'center', gap:  '0.5rem', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                              <span className="message-time text-xs">{formatTimestamp(message.created_at)}</span>
                              {isSent && (
                                <span className="message-status">
                                  {getMessageStatusIcon(message.is_read)}
                                </span>
                              )}
                              <button
                                className="reaction-btn"
                                onClick={() => addReaction(message.id, '👍')}
                                aria-label="Añadir reacción"
                                style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '0.875rem', opacity: 0.6 }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="message-input-container">
                    <div className="input-actions">
                      <button 
                        className="icon-btn"
                        onClick={() => setEmojiPickerOpen(! emojiPickerOpen)}
                        aria-label="Seleccionar emoji"
                        aria-expanded={emojiPickerOpen}
                      >
                        <Smile size={20} />
                      </button>
                      <button 
                        className="icon-btn"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Adjuntar archivo"
                      >
                        <Paperclip size={20} />
                      </button>
                      <button 
                        className="icon-btn"
                        onClick={startVoiceMessage}
                        aria-label="Mensaje de voz"
                      >
                        <Mic size={20} />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept="image/*,video/*,. pdf,.doc,.docx"
                        aria-label="Seleccionar archivo"
                      />
                    </div>
                    <div className="message-input-wrapper flex-1">
                      <input
                        type="text"
                        placeholder={t.writeMessage}
                        value={messageInput}
                        onChange={(e) => {
                          setMessageInput(e.target.value);
                          sendTypingIndicator();
                        }}
                        onKeyDown={handleKeyPress}
                        className="message-input w-full"
                        aria-label="Escribir mensaje"
                        maxLength={1000}
                      />
                      {emojiPickerOpen && (
                        <div className="emoji-picker" role="dialog" aria-label="Selector de emojis">
                          {[
                            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
                            '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
                            '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
                            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                            '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
                            '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '⭐', '🌟',
                            '💫', '✨', '🔥', '💥', '💯', '✅', '❌', '⚠️'
                          ].map(emoji => (
                            <button
                              key={emoji}
                              className="emoji-option"
                              onClick={() => handleEmojiSelect(emoji)}
                              aria-label={`Emoji ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="send-button"
                      onClick={handleSendMessage}
                      disabled={!messageInput. trim() || sendMessageMutation.isPending}
                      aria-label="Enviar mensaje (Ctrl+Enter)"
                    >
                      {sendMessageMutation.isPending ?  (
                        <div className="loading-spinner"></div>
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                </>
              )}
            </main>
          </div>

          {settingsOpen && (
            <div className="settings-overlay" onClick={() => setSettingsOpen(false)} role="dialog" aria-modal="true" aria-labelledby="settings-title">
              <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                  <h3 id="settings-title">{t.settings}</h3>
                  <button className="close-btn" onClick={() => setSettingsOpen(false)} aria-label="Cerrar">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="settings-content">
                  <div className="settings-section">
                    <h4>Apariencia</h4>
                    <div className="setting-item">
                      <span>{t.darkMode}</span>
                      <button 
                        className={`theme-toggle ${darkMode ? 'dark' : 'light'}`}
                        onClick={toggleDarkMode}
                        role="switch"
                        aria-checked={darkMode}
                        aria-label="Modo oscuro"
                      >
                        <div className="toggle-slider"></div>
                      </button>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h4>Notificaciones</h4>
                    <div className="setting-item">
                      <span>{t.soundEnabled}</span>
                      <button 
                        className={`theme-toggle ${preferences.soundEnabled ? 'dark' : 'light'}`}
                        onClick={() => setPreferences(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                        role="switch"
                        aria-checked={preferences.soundEnabled}
                        aria-label="Sonido"
                      >
                        <div className="toggle-slider"></div>
                      </button>
                    </div>
                    <div className="setting-item">
                      <span>{t. notifications}</span>
                      <button 
                        className={`theme-toggle ${preferences. notifications ?  'dark' : 'light'}`}
                        onClick={() => setPreferences(prev => ({ ...prev, notifications: !prev.notifications }))}
                        role="switch"
                        aria-checked={preferences.notifications}
                        aria-label="Notificaciones"
                      >
                        <div className="toggle-slider"></div>
                      </button>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h4>Seguridad</h4>
                    <div className="setting-item">
                      <span>{t.encryption}</span>
                      <Shield size={20} className="text-green-500" />
                    </div>
                  </div>

                  <div className="settings-actions">
                    <button className="action-btn danger" onClick={() => supabase.auth.signOut()}>
                      <LogOut size={18} />
                      {t.logout}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {keyboardShortcutsOpen && (
            <div className="settings-overlay" onClick={() => setKeyboardShortcutsOpen(false)} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
              <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                  <h3 id="shortcuts-title">{t.keyboardShortcuts}</h3>
                  <button className="close-btn" onClick={() => setKeyboardShortcutsOpen(false)} aria-label="Cerrar">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="settings-content">
                  <div className="shortcuts-list">
                    <div className="shortcut-item">
                      <kbd>Ctrl</kbd> + <kbd>K</kbd>
                      <span>Buscar</span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                      <span>Enviar mensaje</span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Shift</kbd> + <kbd>Enter</kbd>
                      <span>Nueva línea</span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Esc</kbd>
                      <span>Cerrar modal</span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Ctrl</kbd> + <kbd>M</kbd>
                      <span>Silenciar micrófono</span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd>
                      <span>Toggle video</span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>
                      <span>Compartir pantalla</span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>
                      <span>Grabar llamada</span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Alt</kbd> + <kbd>1</kbd>
                      <span>Ver chats</span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Alt</kbd> + <kbd>2</kbd>
                      <span>Ver contactos</span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Ctrl</kbd> + <kbd>/</kbd>
                      <span>Mostrar atajos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {incomingCall && (
            <div className="incoming-call-overlay" role="dialog" aria-modal="true" aria-labelledby="incoming-call-title">
              <div className="incoming-call-modal">
                <div className="caller-info">
                  <div className="caller-avatar">
                    {incomingCall.fromUser?. avatar_url ? (
                      <img 
                        src={incomingCall.fromUser.avatar_url} 
                        alt={`Avatar de ${incomingCall.  fromUser.username}`}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="avatar-fallback">
                        {incomingCall.fromUser?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="caller-details">
                    <h3 id="incoming-call-title">{incomingCall.  fromUser?.username || 'Usuario'}</h3>
                    <p>{t.incomingCall}</p>
                  </div>
                </div>
                <div className="call-actions">
                  <button 
                    className="call-action accept"
                    onClick={() => handleAcceptIncomingCall(incomingCall. from, incomingCall.callId, incomingCall.callType)}
                    aria-label="Aceptar llamada"
                  >
                    <Phone size={24} />
                    <span>{t.accept}</span>
                  </button>
                  <button 
                    className="call-action reject"
                    onClick={handleRejectIncomingCall}
                    aria-label="Rechazar llamada"
                  >
                    <PhoneOff size={24} />
                    <span>{t.reject}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <CustomCallModal
            open={callModalOpen && callState. callStatus !== 'idle'}
            onOpenChange={setCallModalOpen}
            otherUser={{
              id: activeUser?.id || callState.targetUserId || '',
              full_name: activeUser?.username || 'Usuario',
              avatar_url: activeUser?.avatar_url || ''
            }}
            callType={callState.callType === 'voice' ? 'audio' : 'video'}
            isInitiator={true}
            localStream={localStream}
            remoteStream={remoteStream}
            callStatus={getCallStatusForModal()}
            onEndCall={handleCallEnd}
            onToggleMic={toggleMic}
            onToggleVideo={toggleVideo}
            isMicMuted={isMicMuted}
            isVideoOff={isVideoOff}
          />
        </div>
      </ErrorBoundary>
    </>
  );
};

export default Chat;
