import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import webRTCService from '@/lib/webRTC-Service';
import { isUserAvailable } from '@/lib/call-utils';
import { Profile } from '@/lib/call-types';

interface UseCallManagerReturn {
  isCallActive: boolean;
  isCalling: boolean;
  currentCallId: string | null;
  initiateAudioCall: (targetUser: Profile) => Promise<void>;
  initiateVideoCall: (targetUser: Profile) => Promise<void>;
  endCall: () => Promise<void>;
  error: string | null;
}

export function useCallManager(): UseCallManagerReturn {
  const { user: currentUser } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Initialize WebRTC service
  useEffect(() => {
    webRTCService.ensureInitialized().catch((err) => {
      console.error('❌ Failed to initialize WebRTC service:', err);
      setError('Failed to initialize call service');
    });
  }, []);

  // ✅ Listen for incoming calls
  useEffect(() => {
    const handleIncomingCall = (from: string, callId: string, callType: 'audio' | 'video') => {
      console.log(`📞 Incoming ${callType} call from ${from}`);
      setCurrentCallId(callId);
      setIsCallActive(true);
      
      // Show notification to user
      if (Notification.permission === 'granted') {
        new Notification('Incoming Call', {
          body: `${from} is calling you...`,
          icon: '/icons/phone.png',
        });
      }
    };

    webRTCService.onCallRequest = handleIncomingCall;

    return () => {
      webRTCService.onCallRequest = null;
    };
  }, []);

  // ✅ Listen for call state changes
  useEffect(() => {
    const handleCallStateChange = (state: string, callId?: string) => {
      console.log(`🔌 Call state changed: ${state}`);
      
      if (state === 'connected' && callId) {
        setIsCallActive(true);
        setIsCalling(false);
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setIsCallActive(false);
        setIsCalling(false);
        setCurrentCallId(null);
      }
    };

    webRTCService.onCallStateChange = handleCallStateChange;

    return () => {
      webRTCService.onCallStateChange = null;
    };
  }, []);

  // ✅ Initiate audio call
  const initiateAudioCall = useCallback(
    async (targetUser: Profile) => {
      if (!currentUser) {
        setError('Not authenticated');
        return;
      }

      if (!isUserAvailable(targetUser)) {
        setError(`${targetUser.username} account is not available`);
        return;
      }

      try {
        setError(null);
        setIsCalling(true);

        console.log(`📞 Starting audio call with ${targetUser.username}...`);
        const { callId } = await webRTCService.initiateCall(targetUser.id, 'audio');
        
        setCurrentCallId(callId);
        console.log(`✅ Audio call initiated: ${callId}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initiate audio call';
        setError(message);
        setIsCalling(false);
        console.error('❌ Audio call error:', err);
      }
    },
    [currentUser]
  );

  // ✅ Initiate video call
  const initiateVideoCall = useCallback(
    async (targetUser: Profile) => {
      if (!currentUser) {
        setError('Not authenticated');
        return;
      }

      if (!isUserAvailable(targetUser)) {
        setError(`${targetUser.username} account is not available`);
        return;
      }

      try {
        setError(null);
        setIsCalling(true);

        console.log(`📹 Starting video call with ${targetUser.username}...`);
        const { callId } = await webRTCService.initiateCall(targetUser.id, 'video');
        
        setCurrentCallId(callId);
        console.log(`✅ Video call initiated: ${callId}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initiate video call';
        setError(message);
        setIsCalling(false);
        console.error('❌ Video call error:', err);
      }
    },
    [currentUser]
  );

  // ✅ End call
  const endCall = useCallback(async () => {
    try {
      if (currentCallId) {
        console.log(`🔚 Ending call: ${currentCallId}`);
        await webRTCService.endCall(currentCallId);
        setCurrentCallId(null);
        setIsCallActive(false);
        setIsCalling(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end call';
      setError(message);
      console.error('❌ End call error:', err);
    }
  }, [currentCallId]);

  return {
    isCallActive,
    isCalling,
    currentCallId,
    initiateAudioCall,
    initiateVideoCall,
    endCall,
    error,
  };
}