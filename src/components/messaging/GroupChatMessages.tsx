import React from 'react';

export interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  media_url: string | null;
  encrypted: boolean;
  media_encrypted: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

export interface GroupChatMessagesProps {
  messages: GroupMessage[];
  currentUserId: string;
  groupPrivacy: string;
  groupId: string;
}

export const GroupChatMessages: React.FC<GroupChatMessagesProps> = ({
  messages,
  currentUserId,
  groupPrivacy,
  groupId,
}) => {
  // Implement your UI here
  return (
    <div>
      {/* Example rendering logic */}
      {messages.map((msg) => (
        <div key={msg.id}>
          <img src={msg.profiles.avatar_url} alt={msg.profiles.full_name} width={32} height={32} />
          <strong>{msg.profiles.full_name}</strong>: {msg.content}
        </div>
      ))}
    </div>
  );
};