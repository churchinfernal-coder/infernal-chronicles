import React, { useState } from 'react';
import { Phone, Video, X } from 'lucide-react';
import { useCallManager } from '@/hooks/useCallManager';
import { Profile } from '@/lib/call-types';

interface ChatHeaderProps {
    contactUser: Profile | null;
    isOnline: boolean;
}

export function ChatHeader({ contactUser, isOnline }: ChatHeaderProps) {
    const { isCalling, isCallActive, initiateAudioCall, initiateVideoCall, endCall, error } = useCallManager();
    const [showError, setShowError] = useState(false);

    if (!contactUser) {
        return (
            <div className="h-16 border-b border-slate-700 px-6 py-4 flex items-center justify-center bg-slate-800/50">
                <p className="text-slate-400">Select a conversation</p>
            </div>
        );
    }

    const handleAudioCall = async () => {
        try {
            await initiateAudioCall(contactUser);
        } catch (err) {
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
        }
    };

    const handleVideoCall = async () => {
        try {
            await initiateVideoCall(contactUser);
        } catch (err) {
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
        }
    };

    const handleEndCall = async () => {
        await endCall();
    };

    return (
        <div className="h-16 border-b border-slate-700 px-6 py-4 flex items-center justify-between gap-4 bg-slate-800/50">
            {/* User Info Section */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-red-600/30 flex-shrink-0 flex items-center justify-center">
                    {contactUser.avatar_url ? (
                        <img
                            src={contactUser.avatar_url}
                            alt={contactUser.username}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-sm font-semibold">
                            {contactUser.username?.[0].toUpperCase()}
                        </span>
                    )}
                </div>

                {/* Name and Status */}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-white">
                        {contactUser.username}
                    </p>
                    <p className={`text-xs ${isOnline ? 'text-green-400' : 'text-slate-400'}`}>
                        {isCallActive ? (
                            <span className="text-blue-400 font-semibold">📞 In Call</span>
                        ) : isCalling ? (
                            <span className="text-blue-400 font-semibold">📞 Calling...</span>
                        ) : isOnline ? (
                            'Online'
                        ) : (
                            'Offline'
                        )}
                    </p>
                </div>
            </div>

            {/* Call Actions */}
            <div className="flex items-center gap-2 flex-none">
                {/* Error Message */}
                {showError && error && (
                    <div className="absolute top-20 right-6 bg-red-600/80 text-white text-xs px-3 py-1 rounded animate-pulse">
                        {error}
                    </div>
                )}

                {/* Audio Call Button */}
                <button
                    onClick={handleAudioCall}
                    disabled={isCalling || isCallActive}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Start audio call"
                    aria-label="Start audio call"
                >
                    <Phone size={18} />
                </button>

                {/* Video Call Button */}
                <button
                    onClick={handleVideoCall}
                    disabled={isCalling || isCallActive}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Start video call"
                    aria-label="Start video call"
                >
                    <Video size={18} />
                </button>

                {/* End Call Button (visible during active call) */}
                {isCallActive && (
                    <button
                        onClick={handleEndCall}
                        className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-colors animate-pulse"
                        title="End call"
                        aria-label="End call"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default ChatHeader;