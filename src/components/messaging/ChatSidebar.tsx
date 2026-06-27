// src/components/messaging/ChatSidebar.tsx
// Chat sidebar component with contacts and chats list
// Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-11-19 19:41:34
// Current User's Login: mexivanzamexivanza

import React, { useState } from 'react';
import { MessageCircle, User, Search, X, Phone, Video } from 'lucide-react';

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

interface PrivateChat {
  id: string;
  user_1: string;
  user_2: string;
  last_message_at: string;
  last_message?: string;
}

interface ChatSidebarProps {
  authUser: any;
  activeView: 'chats' | 'contacts';
  setActiveView: (view: 'chats' | 'contacts') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'all' | 'unread';
  setActiveTab: (tab: 'all' | 'unread') => void;
  activeChatId: string | null;
  filteredChats: PrivateChat[];
  enterpriseUsers: Profile[] | undefined;
  enterpriseFriends: Profile[] | undefined;
  onlineUsers: Set<string>;
  onChatSelect: (chatId: string) => void;
  onStartChat: (userId: string) => void;
  onStartVoiceCall: (userId: string) => void;
  onStartVideoCall: (userId: string) => void;
  formatTimestamp: (timestamp: string) => string;
  checkCallPermissions: (user: Profile) => { canVoiceCall: boolean; canVideoCall: boolean; canChat: boolean };
  translations: any;
  isMobile: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  authUser,
  activeView,
  setActiveView,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  activeChatId,
  filteredChats,
  enterpriseUsers,
  enterpriseFriends,
  onlineUsers,
  onChatSelect,
  onStartChat,
  onStartVoiceCall,
  onStartVideoCall,
  formatTimestamp,
  checkCallPermissions,
  translations,
  isMobile
}) => {
  const renderContactsList = () => {
    const friendIds = new Set(enterpriseFriends?.map((f: any) => f.id) || []);
    const otherUsers = enterpriseUsers?.filter(u => !friendIds.has(u.id)) || [];
    const filteredFriends = enterpriseFriends || [];
    const filteredOtherUsers = otherUsers;

    if (searchQuery.trim() && filteredFriends.length === 0 && filteredOtherUsers.length === 0) {
      return (
        <div className="empty-state">
          <Search size={48} />
          <p>{translations.noResults}</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#9ca3af' }}>
            "{searchQuery}"
          </p>
        </div>
      );
    }

    return (
      <div className="contacts-list">
        {filteredFriends.length > 0 && (
          <>
            <div className="contacts-section-header">
              <User size={16} />
              <span>{translations.friends} ({filteredFriends.length})</span>
            </div>
            {filteredFriends.map(user => {
              const isOnline = onlineUsers.has(user.id) || user.is_online;
              const { canVoiceCall, canVideoCall, canChat } = checkCallPermissions(user);

              return (
                <div key={user.id} className="contact-item friend">
                  <div className="contact-avatar">
                    <div className="avatar-fallback">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                  </div>
                  <div className="contact-details">
                    <div className="contact-name">{user.username}</div>
                    <div className="contact-email">{user.email}</div>
                    <div className={`contact-status ${isOnline ? 'online' : 'offline'}`}>
                      {isOnline ? `${translations.online} • ${translations.available}` : translations.offline}
                    </div>
                  </div>
                  <div className="contact-actions">
                    <button
                      className={`action-btn chat-btn ${!canChat ? 'disabled' : ''}`}
                      onClick={() => onStartChat(user.id)}
                      disabled={!canChat}
                      title={translations.startChat}
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      className={`action-btn call-btn ${!canVoiceCall ? 'disabled' : ''}`}
                      onClick={() => onStartVoiceCall(user.id)}
                      disabled={!canVoiceCall}
                      title="Llamar"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      className={`action-btn video-btn ${!canVideoCall ? 'disabled' : ''}`}
                      onClick={() => onStartVideoCall(user.id)}
                      disabled={!canVideoCall}
                      title="Videollamar"
                    >
                      <Video size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {filteredOtherUsers.length > 0 && (
          <>
            <div className="contacts-section-header">
              <User size={16} />
              <span>{translations.suggestedContacts} ({filteredOtherUsers.length})</span>
            </div>
            {filteredOtherUsers.map(user => {
              const isOnline = onlineUsers.has(user.id) || user.is_online;
              const { canVoiceCall, canVideoCall, canChat } = checkCallPermissions(user);

              return (
                <div key={user.id} className="contact-item">
                  <div className="contact-avatar">
                    <div className="avatar-fallback">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                  </div>
                  <div className="contact-details">
                    <div className="contact-name">{user.username}</div>
                    <div className="contact-email">{user.email}</div>
                    <div className={`contact-status ${isOnline ? 'online' : 'offline'}`}>
                      {isOnline ? `${translations.online} • ${translations.available}` : translations.offline}
                    </div>
                  </div>
                  <div className="contact-actions">
                    <button
                      className={`action-btn chat-btn ${!canChat ? 'disabled' : ''}`}
                      onClick={() => onStartChat(user.id)}
                      disabled={!canChat}
                      title={translations.startChat}
                    >
                      <MessageCircle size={16} />
                    </button>
                    <button
                      className={`action-btn call-btn ${!canVoiceCall ? 'disabled' : ''}`}
                      onClick={() => onStartVoiceCall(user.id)}
                      disabled={!canVoiceCall}
                      title="Llamar"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      className={`action-btn video-btn ${!canVideoCall ? 'disabled' : ''}`}
                      onClick={() => onStartVideoCall(user.id)}
                      disabled={!canVideoCall}
                      title="Videollamar"
                    >
                      <Video size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {!searchQuery.trim() && filteredFriends.length === 0 && filteredOtherUsers.length === 0 && (
          <div className="empty-state">
            <User size={48} />
            <p>{translations.noContacts}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`chats-sidebar ${isMobile ? 'mobile' : ''}`}>
      <div className="sidebar-header">
        <div className="user-profile">
          <div className="user-avatar">
            <div className="avatar-fallback">
              {authUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="online-indicator"></div>
          </div>
          <div className="user-info">
            <div className="user-name">{authUser?.email || 'Usuario'}</div>
            <div className="user-status">{translations.available}</div>
          </div>
        </div>

        <div className="view-tabs">
          <button
            className={`view-tab ${activeView === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveView('chats')}
          >
            <MessageCircle size={18} />
            <span>{translations.all}</span>
          </button>
          <button
            className={`view-tab ${activeView === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveView('contacts')}
          >
            <User size={18} />
            <span>{translations.suggestedContacts}</span>
          </button>
        </div>
      </div>

      <div className="search-section">
        <div className="search-input-container">
          <Search size={18} />
          <input
            type="text"
            placeholder={activeView === 'chats' ? translations.searchChats : translations.searchContacts}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {activeView === 'chats' && (
        <div className="chats-tabs">
          <button
            className={`chats-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {translations.all}
          </button>
          <button
            className={`chats-tab ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            {translations.unread}
          </button>
        </div>
      )}

      <div className="chats-list">
        {activeView === 'chats' ? (
          filteredChats.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={48} />
              <p>{searchQuery ? translations.noResults : translations.noChats}</p>
            </div>
          ) : (
            filteredChats.map(chat => {
              const otherUserId = chat.user_1 === authUser?.id ? chat.user_2 : chat.user_1;
              const otherUser = enterpriseUsers?.find(u => u.id === otherUserId);
              const displayName = otherUser?.username || 'Usuario';
              const isOnline = onlineUsers.has(otherUserId) || otherUser?.is_online;

              return (
                <div
                  key={chat.id}
                  className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => onChatSelect(chat.id)}
                >
                  <div className="chat-avatar">
                    <div className="avatar-fallback">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                  </div>
                  <div className="chat-details">
                    <div className="chat-header">
                      <span className="chat-name">{displayName}</span>
                      <span className="chat-time">{formatTimestamp(chat.last_message_at)}</span>
                    </div>
                    <div className="chat-preview">
                      {chat.last_message || 'Chat iniciado'}
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          renderContactsList()
        )}
      </div>
    </aside>
  );
};