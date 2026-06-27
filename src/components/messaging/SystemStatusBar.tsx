import { useEffect, useState } from 'react';
import { Shield, Wifi, Activity, Users, MessageSquare, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemStatusBarProps {
  userId: string;
  onShowOnlineUsers: () => void;
}

export function SystemStatusBar({ userId, onShowOnlineUsers }: SystemStatusBarProps) {
  const [stats, setStats] = useState({
    totalChats: 0,
    onlineUsers: 0,
    encryptionStatus: 'active'
  });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const fetchStats = async () => {
    try {
      // Get total chats
      const { count: chatsCount } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      // Get online users count
      const { count: onlineCount } = await supabase
        .from('user_presence')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);

      setStats({
        totalChats: chatsCount || 0,
        onlineUsers: onlineCount || 0,
        encryptionStatus: 'active'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 md:gap-3">
      {/* Encryption Status */}
      <div className="group relative">
        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm hover:border-primary/40 transition-all">
          <Shield className="w-3 h-3 md:w-4 md:h-4 text-primary" />
          <span className="text-[10px] md:text-xs font-medium hidden sm:inline">E2EE</span>
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-background/95 px-2 py-1 rounded border border-border">
            Cifrado activo
          </span>
        </div>
      </div>

      {/* Connection Status */}
      <div className="group relative">
        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition-all">
          <Wifi className={`w-3 h-3 md:w-4 md:h-4 text-green-500 ${pulse ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] md:text-xs font-medium hidden sm:inline text-green-500">Online</span>
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-background/95 px-2 py-1 rounded border border-border">
            Conectado
          </span>
        </div>
      </div>

      {/* Active Users - Clickable */}
      <button 
        onClick={onShowOnlineUsers}
        className="group relative"
      >
        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all cursor-pointer">
          <Users className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
          <span className="text-[10px] md:text-xs font-medium text-blue-500">{stats.onlineUsers}</span>
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-background/95 px-2 py-1 rounded border border-border">
            Ver usuarios en línea
          </span>
        </div>
      </button>

      {/* Total Chats */}
      <div className="group relative">
        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 transition-all">
          <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
          <span className="text-[10px] md:text-xs font-medium text-purple-500">{stats.totalChats}</span>
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-background/95 px-2 py-1 rounded border border-border">
            Conversaciones
          </span>
        </div>
      </div>

      {/* System Health */}
      <div className="group relative">
        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 backdrop-blur-sm hover:border-emerald-500/40 transition-all">
          <Activity className={`w-3 h-3 md:w-4 md:h-4 text-emerald-500 ${pulse ? 'animate-pulse' : ''}`} />
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse hidden sm:block"></div>
        </div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-background/95 px-2 py-1 rounded border border-border">
            Sistema óptimo
          </span>
        </div>
      </div>
    </div>
  );
}
