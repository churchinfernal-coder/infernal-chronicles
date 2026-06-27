import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnlineUser {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

interface OnlineUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onStartChat: (userId: string) => void;
}

export function OnlineUsersDialog({ open, onOpenChange, userId, onStartChat }: OnlineUsersDialogProps) {
  const { toast } = useToast();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchOnlineUsers();
    }
  }, [open, userId]);

  const fetchOnlineUsers = async () => {
    setLoading(true);
    try {
      // Get online user IDs
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('user_id')
        .eq('is_online', true)
        .neq('user_id', userId);

      if (!presenceData || presenceData.length === 0) {
        setOnlineUsers([]);
        setLoading(false);
        return;
      }

      const userIds = presenceData.map(p => p.user_id);

      // Get user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email')
        .in('id', userIds);

      setOnlineUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    try {
      console.log('Starting chat from online users with:', targetUserId);
      
      // Safety check: prevent chatting with yourself
      if (userId === targetUserId) {
        toast({
          title: 'Error',
          description: 'No puedes chatear contigo mismo',
          variant: 'destructive'
        });
        return;
      }

      // Check if chat already exists
      const { data: existingChat, error: searchError } = await supabase
        .from('private_chats')
        .select('id')
        .or(`and(user_1.eq.${userId},user_2.eq.${targetUserId}),and(user_1.eq.${targetUserId},user_2.eq.${userId})`)
        .maybeSingle();

      if (searchError) {
        console.error('Error searching for existing chat:', searchError);
        throw searchError;
      }

      if (existingChat) {
        console.log('Existing chat found:', existingChat.id);
        onStartChat(existingChat.id);
        onOpenChange(false);
        return;
      }

      // Create new chat - ensure user_1 < user_2 for constraint
      const [user1, user2] = userId < targetUserId ? [userId, targetUserId] : [targetUserId, userId];
      
      console.log('Creating new chat from online users:', { user1, user2 });
      
      const { data: newChat, error } = await supabase
        .from('private_chats')
        .insert({
          user_1: user1,
          user_2: user2,
          encryption_key: crypto.randomUUID()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        throw error;
      }

      if (newChat) {
        console.log('New chat created from online users:', newChat.id);
        toast({
          title: 'Chat iniciado',
          description: 'Se ha creado la conversación',
        });
        onStartChat(newChat.id);
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error in handleStartChat:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo iniciar el chat',
        variant: 'destructive',
      });
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    try {
      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('status')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'pending') {
          toast({
            title: 'Solicitud pendiente',
            description: 'Ya existe una solicitud de amistad pendiente',
          });
        } else if (existing.status === 'accepted') {
          toast({
            title: 'Ya son amigos',
            description: 'Ya están conectados como amigos',
          });
        }
        return;
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Solicitud enviada',
        description: 'Tu solicitud de amistad ha sido enviada',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message.includes('Friend limit') 
          ? 'Has alcanzado el límite de amigos'
          : 'No se pudo enviar la solicitud',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Usuarios en línea ({onlineUsers.length})</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay otros usuarios en línea</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {onlineUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.email?.split('@')[0]}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartChat(user.id)}
                    title="Enviar mensaje"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendFriendRequest(user.id)}
                    title="Agregar amigo"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
