import styles from '@/components/messaging/chat-layout.module.css';
import { ChatHeader } from '@/components/messaging/ChatHeader';
import { isUserOnline } from '@/lib/call-utils';

export function Chat() {
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="w-96 flex flex-col border-r border-slate-700 bg-slate-800">
        {/* ... your sidebar content */}
      </div>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {/* ✅ WIRED: ChatHeader with call functionality */}
        <ChatHeader 
          contactUser={selectedContact}
          isOnline={selectedContact ? isUserOnline(selectedContact) : false}
        />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* ... your messages */}
        </div>

        {/* Input Area */}
        <div className="h-20 border-t border-slate-700 p-4 bg-slate-800/50">
          {/* ... your message input */}
        </div>
      </div>
    </div>
  );
}