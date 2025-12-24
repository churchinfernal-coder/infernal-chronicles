import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { UserPlus, UserX, Flame, Users } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  friend_id: string;
  status: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
    infernal_identity: string | null;
  };
}

interface SuggestedContact {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  shared_covens: number;
  shared_sigil: boolean;
}

export function ContactsManager({ onSelectContact }: { onSelectContact?: (friendId: string) => void }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Contact[]>([]);
  const [suggestedContacts, setSuggestedContacts] = useState<SuggestedContact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchCurrentUser();
    fetchContacts();
    fetchSuggestedContacts();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          friend_id,
          status,
          profiles!friendships_friend_id_fkey(username, avatar_url, infernal_identity)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const accepted = (data || []).filter(c => c.status === "accepted");
      const pending = (data || []).filter(c => c.status === "pending");

      setContacts(accepted as any);
      setPendingRequests(pending as any);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchSuggestedContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("get_suggested_contacts", {
        _requesting_user_id: user.id,
      });

      if (error) throw error;
      setSuggestedContacts((data || []) as SuggestedContact[]);
    } catch (error: any) {
      console.error("Failed to fetch suggested contacts:", error);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("friendships").insert({
        user_id: user.id,
        friend_id: friendId,
        status: "pending",
      });

      if (error) throw error;
      toast.success("Friend request sent");
      fetchSuggestedContacts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) throw error;
      toast.success("Friend request accepted");
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const removeContact = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;
      toast.success("Contact removed");
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const blockUser = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove friendship if exists
      await supabase
        .from("friendships")
        .delete()
        .or(`user_id.eq.${user.id},friend_id.eq.${userId}`);

      // Add to blocked list
      const { error } = await supabase
        .from("blocked_users")
        .insert({
          user_id: user.id,
          blocked_user_id: userId,
        });

      if (error) throw error;
      toast.success("User blocked");
      fetchContacts();
      fetchSuggestedContacts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Contacts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Infernal Contacts
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
            <TabsTrigger value="requests">Requests ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="suggested">Suggested ({suggestedContacts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4">
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredContacts.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No contacts yet
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.profiles?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {contact.profiles?.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{contact.profiles?.username || "Unknown"}</div>
                          {contact.profiles?.infernal_identity && (
                            <div className="text-xs text-muted-foreground">
                              {contact.profiles.infernal_identity}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <DialogClose asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onSelectContact?.(contact.friend_id)}
                          >
                            Chat
                          </Button>
                        </DialogClose>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeContact(contact.id)}
                        >
                          Remove
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => blockUser(contact.friend_id)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="requests">
            <ScrollArea className="h-[450px]">
              <div className="space-y-2">
                {pendingRequests.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No pending requests
                  </div>
                ) : (
                  pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={request.profiles?.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {request.profiles?.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{request.profiles?.username || "Unknown"}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => acceptFriendRequest(request.id)}>
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeContact(request.id)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="suggested">
            <ScrollArea className="h-[450px]">
              <div className="space-y-2">
                {suggestedContacts.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No suggestions available
                  </div>
                ) : (
                  suggestedContacts.map((suggestion) => (
                    <div
                      key={suggestion.user_id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={suggestion.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {suggestion.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{suggestion.username || "Unknown"}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {suggestion.shared_covens > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {suggestion.shared_covens} shared coven{suggestion.shared_covens > 1 ? "s" : ""}
                              </span>
                            )}
                            {suggestion.shared_sigil && (
                              <span className="flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                Same sigil
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sendFriendRequest(suggestion.user_id)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
