export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  account_status: string;
  is_online?: boolean;
  role?: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  created_by: string;
  last_message_at: string;
  updated_at: string;
  user1_profile?: Profile[];
  user2_profile?: Profile[];
  user_1?: string;
  user_2?: string;
  last_message?: string;
  unread_count?: number;
}

export interface PrivateMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: Profile;
  receiver_profile?: Profile;
}

export interface CallState {
  callType: 'voice' | 'video';
  callStatus: 'idle' | 'calling' | 'ringing' | 'active' | 'ended';
  targetUserId?: string;
}