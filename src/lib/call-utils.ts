import { Profile, CallPermissions, Language } from './call-types';

/**
 * Check if user has permission to call/chat with target user
 */
export const checkCallPermissions = (
  targetUser: Profile,
  authUserId?: string
): CallPermissions => {
  if (!authUserId) {
    console.warn('⚠️ [RBAC] No authUser for permission check');
    return { canVoiceCall: false, canVideoCall: false, canChat: false };
  }

  const targetRole = targetUser.role || 'user';
  const targetStatus = targetUser.account_status;

  const canVoiceCall = targetStatus === 'active' && targetRole !== 'restricted';
  const canVideoCall = targetStatus === 'active' && targetRole !== 'restricted';
  const canChat = targetStatus === 'active' && targetRole !== 'banned';

  console.log('🔒 [RBAC] Permissions for', targetUser.username, ':', { 
    canVoiceCall, 
    canVideoCall, 
    canChat 
  });

  return { canVoiceCall, canVideoCall, canChat };
};

/**
 * Check if user is available for calls
 * ✅ FIXED: Calls can be initiated regardless of online status
 * As a missed call with real-time notification
 */
export const isUserAvailable = (user: Profile): boolean => {
  // Only check account status, not online status
  // Calls should work as missed calls if user is offline
  const hasPermission = user.account_status !== 'banned' && user.account_status !== 'suspended';
  const isOnline = user.is_online === true;
  
  console.log('👤 [AVAILABILITY] User', user.username, '- Online:', isOnline, '- Has permission:', hasPermission);
  
  // Return true if user has permission (online or offline)
  // UI will show "User is currently offline" instead of "User not available"
  return hasPermission;
};

/**
 * Check if user is currently online (for UI display)
 */
export const isUserOnline = (user: Profile): boolean => {
  return user.is_online === true;
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: string, language: Language): string => {
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
};

/**
 * Map database row to Profile object
 */
export const mapToProfile = (data: any): Profile => ({
  id: data.id || '',
  username: data.username || data.full_name || data.email?.split('@')[0] || 'Usuario',
  full_name: data.full_name || data.username || 'Usuario',
  email: data.email || '',
  avatar_url: data.avatar_url || null,
  account_status: data.account_status || 'active',
  is_online: data.is_online ?? false,
  role: data.role || 'user'
});

/**
 * Generate unique call ID
 */
export const generateCallId = (userId: string): string => {
  return `call-${Date.now()}-${userId.substring(0, 8)}`;
};

/**
 * Enable all media tracks
 */
export const enableAllTracks = (stream: MediaStream, trackKind?: 'audio' | 'video'): void => {
  const tracks = trackKind 
    ? (trackKind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks())
    : stream.getTracks();
  
  tracks.forEach(track => {
    track.enabled = true;
    console.log(`✅ [MEDIA] Enabled ${track.kind} track`);
  });
};

/**
 * Stop all media tracks
 */
export const stopAllTracks = (stream: MediaStream | null): void => {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    track.stop();
    console.log(`🛑 [MEDIA] Stopped ${track.kind} track`);
  });
};

/**
 * Get display name from profile
 */
export const getDisplayName = (profile: Profile | undefined): string => {
  return profile?.username || profile?.full_name || 'Usuario';
};