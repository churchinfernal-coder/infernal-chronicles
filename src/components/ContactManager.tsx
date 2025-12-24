import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, UserX, Search, Users, Ban, Sparkles, MessageCircle } from "lucide-react";

interface ContactManagerProps {
  onStartConversation: (userId: string) => void;
}

interface Friend {
  id: string;
  friend_id: string;
  status: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
}

interface SuggestedContact {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  shared_covens: number;
  shared_sigil: boolean;
}

interface BlockedUser {
  id: string;
  blocked_user_id: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export function ContactManager({ onStartConversation }: ContactManagerProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [suggested, setSuggested] = useState<SuggestedContact[]>([]);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentUser();
    fetchFriends();
    fetchSuggested();
    fetchBlocked();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get friendships
      const { data, error } = await supabase
        .from("friendships")
        .select("id, friend_id, status")
        .eq("user_id", user.id);

      if (error) throw error;

      // Get friend profiles
      const friendIds = data?.map(f => f.friend_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", friendIds);

      const friendsWithProfiles = data?.map(friend => ({
        ...friend,
        profiles: profiles?.find(p => p.user_id === friend.friend_id)
      })) || [];

      setFriends(friendsWithProfiles.filter(f => f.status === "accepted"));
      setPendingRequests(friendsWithProfiles.filter(f => f.status === "pending"));
    } catch (error: any) {
      console.error("Failed to fetch friends:", error);
    }
  };

  const fetchSuggested = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("get_suggested_contacts", {
        _requesting_user_id: user.id
      });

      if (error) throw error;
      setSuggested(data || []);
    } catch (error: any) {
      console.error("Failed to fetch suggested contacts:", error);
    }
  };

  const fetchBlocked = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("blocked_users")
        .select("id, blocked_user_id");

      if (error) throw error;

      const blockedIds = data?.map(b => b.blocked_user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", blockedIds);

      const blockedWithProfiles = data?.map(block => ({
        ...block,
        profiles: profiles?.find(p => p.user_id === block.blocked_user_id)
      })) || [];

      setBlocked(blockedWithProfiles);
    } catch (error: any) {
      console.error("Failed to fetch blocked users:", error);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!currentUser) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("friendships").insert({
        user_id: currentUser.id,
        friend_id: friendId,
        status: "pending"
      });

      if (error) throw error;
      
      toast.success("Friend request sent");
      fetchFriends();
      fetchSuggested();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) throw error;
      
      toast.success("Friend request accepted");
      fetchFriends();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;
      
      toast.success("Friend removed");
      fetchFriends();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const blockUser = async (userId: string) => {
    if (!currentUser) return;
    setLoading(true);

    try {
      const { error } = await supabase.from("blocked_users").insert({
        user_id: currentUser.id,
        blocked_user_id: userId
      });

      if (error) throw error;
      
      toast.success("User blocked");
      fetchBlocked();
      fetchFriends();
      fetchSuggested();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (blockId: string) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("id", blockId);

      if (error) throw error;
      
      toast.success("User unblocked");
      fetchBlocked();
      fetchSuggested();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(f => 
    f.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Contacts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Infernal Contacts</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="suggested">
              Suggested ({suggested.length})
            </TabsTrigger>
            <TabsTrigger value="blocked">
              Blocked ({blocked.length})
            </TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[400px]">
              {filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No contacts yet. Check suggested contacts!
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50">
                      <Avatar>
                        <AvatarImage src={friend.profiles?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {friend.profiles?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {friend.profiles?.username || "Unknown"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => onStartConversation(friend.friend_id)}
                          variant="ghost"
                          size="sm"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => removeFriend(friend.id)}
                          variant="ghost"
                          size="sm"
                          disabled={loading}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests">
            <ScrollArea className="h-[450px]">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <Avatar>
                        <AvatarImage src={request.profiles?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {request.profiles?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">
                          {request.profiles?.username || "Unknown"}
                        </div>
                        <Badge variant="secondary" className="mt-1">Pending</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptFriendRequest(request.id)}
                          size="sm"
                          disabled={loading}
                        >
                          Accept
                        </Button>
                        <Button
                          onClick={() => removeFriend(request.id)}
                          variant="outline"
                          size="sm"
                          disabled={loading}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Suggested Tab */}
          <TabsContent value="suggested">
            <ScrollArea className="h-[450px]">
              {suggested.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No suggested contacts. Join covens or select a sigil!
                </div>
              ) : (
                <div className="space-y-2">
                  {suggested.map((contact) => (
                    <div key={contact.user_id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50">
                      <Avatar>
                        <AvatarImage src={contact.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {contact.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {contact.username || "Unknown"}
                        </div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {contact.shared_covens > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {contact.shared_covens} shared coven{contact.shared_covens > 1 ? "s" : ""}
                            </Badge>
                          )}
                          {contact.shared_sigil && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Sparkles className="h-3 w-3" />
                              Same sigil
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => sendFriendRequest(contact.user_id)}
                          size="sm"
                          disabled={loading}
                          className="gap-1"
                        >
                          <UserPlus className="h-4 w-4" />
                          Add
                        </Button>
                        <Button
                          onClick={() => blockUser(contact.user_id)}
                          variant="ghost"
                          size="sm"
                          disabled={loading}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Blocked Tab */}
          <TabsContent value="blocked">
            <ScrollArea className="h-[450px]">
              {blocked.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No blocked users
                </div>
              ) : (
                <div className="space-y-2">
                  {blocked.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <Avatar>
                        <AvatarImage src={user.profiles?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {user.profiles?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">
                          {user.profiles?.username || "Unknown"}
                        </div>
                      </div>
                      <Button
                        onClick={() => unblockUser(user.id)}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                      >
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
