import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FriendRequestsPanelProps {
  userId: string;
}

interface SimpleFriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string | null;
  requester_name: string;
  requester_username: string;
  requester_avatar: string;
}

export const FriendRequestsPanel = ({ userId }: FriendRequestsPanelProps) => {
  const [friendRequests, setFriendRequests] = useState<SimpleFriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchFriendRequests = async () => {
    try {
      setLoading(true);

      // Fetch friendships first
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (friendshipsError) {
        console.error('Error fetching friend requests:', friendshipsError);
        toast({
          title: 'Error',
          description: 'Failed to load friend requests',
          variant: 'destructive',
        });
        setFriendRequests([]);
        return;
      }

      if (!friendships || friendships.length === 0) {
        setFriendRequests([]);
        return;
      }

      // Get all user IDs
      const userIds = friendships.map(f => f.user_id);

      // Fetch all profiles in one query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map of user profiles for quick lookup
      const profilesMap = new Map(
        (profiles || []).map(profile => [profile.id, profile])
      );

      // Transform data
      const requestsWithUsers: SimpleFriendRequest[] = friendships.map((friendship) => {
        const profile = profilesMap.get(friendship.user_id);
        
        return {
          id: friendship.id,
          user_id: friendship.user_id,
          friend_id: friendship.friend_id,
          status: friendship.status,
          created_at: friendship.created_at,
          requester_name: profile?.full_name || 'Unknown User',
          requester_username: profile?.username || 'user',
          requester_avatar: profile?.avatar_url || ''
        };
      });

      setFriendRequests(requestsWithUsers);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      setFriendRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Friend request accepted',
      });
      
      await fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const declineFriendRequest = async (requestId: string) => {
    setProcessingIds(prev => new Set(prev).add(requestId));
    
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Declined',
        description: 'Friend request declined',
      });
      
      await fetchFriendRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline friend request',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFriendRequests();
    }
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Friend Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Friend Requests ({friendRequests.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {friendRequests.length === 0 ? (
          <p className="text-muted-foreground">No pending friend requests</p>
        ) : (
          <div className="space-y-4">
            {friendRequests.map((request) => {
              const isProcessing = processingIds.has(request.id);
              
              return (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={request.requester_avatar} />
                      <AvatarFallback>
                        {request.requester_name[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.requester_name}</p>
                      <p className="text-sm text-muted-foreground">
                        @{request.requester_username}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => acceptFriendRequest(request.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineFriendRequest(request.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-1" />
                      )}
                      Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};