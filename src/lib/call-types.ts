export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  account_status: string;
  is_online?: boolean;
  role?: string;
  full_name?: string;
}

export interface PrivateChat {
  id: string;
  user_1: string;
  user_2: string;
  last_message_at: string;
  created_at: string;
  last_message?: string;
  user1_profile?: Profile;
  user2_profile?: Profile;
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

export interface AuditLog {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  changes?: any;
}

export interface CallState {
  callType: 'voice' | 'video';
  callStatus: 'idle' | 'calling' | 'ringing' | 'active' | 'ended';
  targetUserId?: string;
  callId?: string;
}

export interface IncomingCall {
  from: string;
  callId: string;
  callType: 'audio' | 'video';
  fromUser?: Profile;
}

export interface CallPermissions {
  canVoiceCall: boolean;
  canVideoCall: boolean;
  canChat: boolean;
}

export type Language = 'es' | 'en';

export interface Translations {
  es: TranslationStrings;
  en: TranslationStrings;
}

export interface TranslationStrings {
  online: string;
  offline: string;
  available: string;
  searchChats: string;
  searchContacts: string;
  all: string;
  unread: string;
  welcome: string;
  welcomeDesc: string;
  writeMessage: string;
  calling: string;
  suggestedContacts: string;
  friends: string;
  settings: string;
  darkMode: string;
  language: string;
  encryption: string;
  logout: string;
  noChats: string;
  noFriends: string;
  noContacts: string;
  startChat: string;
  loadingFriends: string;
  loadingContacts: string;
  noResults: string;
  accept: string;
  reject: string;
  incomingCall: string;
}