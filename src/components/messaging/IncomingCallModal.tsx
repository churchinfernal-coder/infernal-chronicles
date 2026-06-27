import React from 'react';
import { Phone } from 'lucide-react';

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

interface IncomingCall {
  from: string;
  callId: string;
  callType: 'audio' | 'video';
  fromUser?: Profile;
}

interface IncomingCallModalProps {
  incomingCall: IncomingCall | null;
  onAccept: (from: string, callId: string, callType: 'audio' | 'video') => void;
  onReject: () => void;
  translations: {
    incomingCall: string;
    accept: string;
    reject: string;
  };
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  incomingCall,
  onAccept,
  onReject,
  translations
}) => {
  if (!incomingCall) return null;

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-modal">
        <div className="caller-info">
          <div className="caller-avatar">
            <div className="avatar-fallback">
              {incomingCall.fromUser?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div className="caller-details">
            <h3>{incomingCall.fromUser?.username || 'Usuario'}</h3>
            <p>
              {translations.incomingCall}{' '}
              {incomingCall.callType === 'audio' ? 'de voz' : 'de video'}
            </p>
          </div>
        </div>
        <div className="call-actions">
          <button
            className="call-action accept"
            onClick={() => onAccept(incomingCall.from, incomingCall.callId, incomingCall.callType)}
          >
            <Phone size={24} />
            <span>{translations.accept}</span>
          </button>
          <button className="call-action reject" onClick={onReject}>
            <Phone size={24} />
            <span>{translations.reject}</span>
          </button>
        </div>
      </div>
    </div>
  );
};