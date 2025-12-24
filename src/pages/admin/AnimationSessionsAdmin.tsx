import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AnimationSession {
  id: string;
  user_id: string;
  prompt: string;
  frame_count: number;
  frames: any;
  status: string;
  generation_params: any;
  created_at: string;
  profiles?: {
    username: string;
  };
}

export default function AnimationSessionsAdmin() {
  const [sessions, setSessions] = useState<AnimationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<AnimationSession | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      navigate('/');
      return;
    }

    loadSessions();
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('animation_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (sessionsError) throw sessionsError;

      // Fetch user profiles separately
      const userIds = [...new Set(sessionsData?.map(s => s.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const enrichedSessions = sessionsData?.map(session => ({
        ...session,
        profiles: profilesMap.get(session.user_id)
      })) || [];

      setSessions(enrichedSessions as any);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load animation sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Delete this animation session?')) return;

    try {
      const { error } = await supabase
        .from('animation_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Session deleted');
      loadSessions();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const downloadFrames = (session: AnimationSession) => {
    const framesArray = Array.isArray(session.frames) ? session.frames : [];
    framesArray.forEach((frame, index) => {
      const link = document.createElement('a');
      link.href = frame;
      link.download = `${session.id}_frame_${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    toast.success('Download started');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500';
      case 'processing': return 'bg-yellow-500/20 text-yellow-500';
      case 'failed': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Animation Sessions</h1>
          <p className="text-muted-foreground">Manage all generated animations</p>
        </div>
        <Button onClick={loadSessions}>Refresh</Button>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {session.profiles?.username || 'Unknown User'}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-medium mb-1">{session.prompt}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{session.frame_count} frames</span>
                    <span>{Array.isArray(session.frames) ? session.frames.length : 0} generated</span>
                    {session.generation_params && (
                      <>
                        <span>BG: {session.generation_params.background}</span>
                        <span>Light: {session.generation_params.lighting}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedSession(session)}
                    disabled={!Array.isArray(session.frames) || session.frames.length === 0}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadFrames(session)}
                    disabled={!Array.isArray(session.frames) || session.frames.length === 0}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(session.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {sessions.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No animation sessions yet</p>
            </Card>
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Animation Preview</DialogTitle>
            <DialogDescription>{selectedSession?.prompt}</DialogDescription>
          </DialogHeader>
          {selectedSession && Array.isArray(selectedSession.frames) && (
            <div className="grid grid-cols-4 gap-4 max-h-[60vh] overflow-auto">
              {selectedSession.frames.map((frame, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={frame} 
                    alt={`Frame ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
