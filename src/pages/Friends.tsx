import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, Clock, Search, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Profile {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profiles?: Profile;
}

export default function Allies() {
  const [allies, setAllies] = useState<Friendship[]>([]);
  const [pending, setPending] = useState<Friendship[]>([]);
  const [suggested, setSuggested] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadAllData();
    }
  }, [currentUserId]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim(). length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase. auth.getUser();
      if (error || !user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/auth");
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAllies(),
      fetchPending(),
      fetchSuggested()
    ]);
    setLoading(false);
    subscribeToChanges();
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('friendships_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friendships' },
        () => {
          fetchAllies();
          fetchPending();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchAllies = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await (supabase as any)
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          profiles:friend_id (user_id, username, avatar_url, bio)
        `)
        .eq("user_id", currentUserId)
        .eq("status", "accepted")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching allies:", error);
        toast.error("Failed to load allies");
      } else {
        console.log("Allies data:", data);
        setAllies(data || []);
      }
    } catch (error) {
      console.error("Fetch allies exception:", error);
    }
  };

  const fetchPending = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await (supabase as any)
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          profiles:user_id (user_id, username, avatar_url, bio)
        `)
        .eq("friend_id", currentUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching pending:", error);
      } else {
        console.log("Pending data:", data);
        setPending(data || []);
      }
    } catch (error) {
      console.error("Fetch pending exception:", error);
    }
  };

  const fetchSuggested = async () => {
    if (!currentUserId) return;

    try {
      // Get all existing connections
      const { data: existingConnections } = await (supabase as any)
        .from("friendships")
        .select("friend_id, user_id")
        .or(`user_id.eq.${currentUserId},friend_id.eq. ${currentUserId}`);

      const excludeIds = new Set([currentUserId]);
      existingConnections?.forEach((conn: any) => {
        excludeIds.add(conn.friend_id);
        excludeIds.add(conn. user_id);
      });

      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("user_id, username, avatar_url, bio")
        .not("user_id", "in", `(${Array.from(excludeIds).join(",")})`)
        .limit(12);

      if (! error && data) {
        console.log("Suggested data:", data);
        setSuggested(data);
      }
    } catch (error) {
      console.error("Fetch suggested exception:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || ! currentUserId) return;

    setSearching(true);
    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("user_id, username, avatar_url, bio")
        .ilike("username", `%${searchQuery}%`)
        .neq("user_id", currentUserId)
        .limit(20);

      if (error) {
        console.error("Search error:", error);
        toast. error("Search failed");
      } else {
        console.log("Search results:", data);
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error("Search exception:", error);
      toast.error("Search failed");
    }
    setSearching(false);
  };

  const sendRequest = async (targetUserId: string) => {
    if (!currentUserId || ! targetUserId) {
      toast.error("Invalid user");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from("friendships")
        .insert({
          user_id: currentUserId,
          friend_id: targetUserId,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Request already sent");
        } else {
          console.error("Send request error:", error);
          toast.error("Failed to send request");
        }
      } else {
        toast.success("Ally request sent");
        fetchSuggested();
        setSearchResults([]);
        setSearchQuery("");
      }
    } catch (error) {
      console.error("Send request exception:", error);
      toast.error("Failed to send request");
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) {
        console.error("Accept error:", error);
        toast.error("Failed to accept request");
      } else {
        toast.success("Ally request accepted");
        fetchAllies();
        fetchPending();
      }
    } catch (error) {
      console.error("Accept exception:", error);
      toast.error("Failed to accept request");
    }
  };

  const removeAlly = async (friendshipId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("friendships")
        .delete()
        . eq("id", friendshipId);

      if (error) {
        console.error("Remove error:", error);
        toast.error("Failed to remove ally");
      } else {
        toast.success("Ally removed");
        fetchAllies();
        fetchSuggested();
      }
    } catch (error) {
      console.error("Remove exception:", error);
      toast.error("Failed to remove ally");
    }
  };

  const goToProfile = (userId: string | undefined) => {
    if (! userId) {
      toast.error("User profile not available");
      console.error("Attempted to navigate with undefined userId");
      return;
    }
    console.log("Navigating to profile:", userId);
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:ml-64 lg:ml-72 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:ml-64 lg:ml-72">
      <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">Dark Allies</h1>

        {/* Search Card */}
        <Card className="mb-4 md:mb-6 border-primary/20">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Search className="h-4 w-4 md:h-5 md:w-5" />
              Find Allies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="relative">
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <ScrollArea className="h-[300px] mt-4">
                <div className="space-y-2">
                  {searchResults.map((profile) => (
                    <Card key={profile.user_id} className="border-border hover:border-primary/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div 
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => goToProfile(profile.user_id)}
                          >
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={profile. avatar_url || ""} />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {profile.username?.[0]?.toUpperCase() || "? "}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate text-sm hover:text-primary transition-colors">
                                {profile.username || "Unknown"}
                              </p>
                              {profile.bio && (
                                <p className="text-xs text-muted-foreground truncate">{profile.bio}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendRequest(profile. user_id);
                            }}
                            className="bg-primary hover:bg-primary/90 shrink-0"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="allies" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1">
            <TabsTrigger value="allies" className="text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Allies</span> ({allies.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Pending</span> ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="suggested" className="text-xs sm:text-sm">
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Suggested</span>
            </TabsTrigger>
          </TabsList>

          {/* Allies Tab */}
          <TabsContent value="allies" className="mt-4">
            {allies.length === 0 ?  (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">No allies yet</p>
                  <p className="text-sm text-muted-foreground">Search and send requests to build your network</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {allies.map((friendship) => {
                  const profile = friendship.profiles;
                  if (!profile) return null;
                  
                  return (
                    <Card key={friendship.id} className="border-border hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center gap-3">
                          <Avatar 
                            className="h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => goToProfile(profile.user_id)}
                          >
                            <AvatarImage src={profile.avatar_url || ""} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xl">
                              {profile.username?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div 
                            className="flex-1 min-w-0 w-full cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => goToProfile(profile.user_id)}
                          >
                            <p className="font-semibold truncate hover:text-primary transition-colors">
                              {profile.username || "Unknown"}
                            </p>
                            {profile.bio && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {profile. bio}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAlly(friendship.id);
                            }}
                            className="w-full text-destructive hover:bg-destructive/10"
                          >
                            Remove Ally
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="mt-4">
            {pending.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No pending requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pending.map((friendship) => {
                  const profile = friendship.profiles;
                  if (!profile) return null;

                  return (
                    <Card key={friendship.id} className="border-border hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div 
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => goToProfile(profile. user_id)}
                          >
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarImage src={profile.avatar_url || ""} />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {profile.username?.[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate hover:text-primary transition-colors">
                                {profile.username || "Unknown"}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                Wants to be allies
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              acceptRequest(friendship.id);
                            }}
                            className="bg-primary hover:bg-primary/90 shrink-0"
                          >
                            Accept
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Suggested Tab */}
          <TabsContent value="suggested" className="mt-4">
            {suggested.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-12 text-center">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No suggestions available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {suggested.map((profile) => (
                  <Card key={profile.user_id} className="border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center gap-3">
                        <Avatar 
                          className="h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => goToProfile(profile.user_id)}
                        >
                          <AvatarImage src={profile.avatar_url || ""} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xl">
                            {profile.username?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className="flex-1 min-w-0 w-full cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => goToProfile(profile.user_id)}
                        >
                          <p className="font-semibold truncate hover:text-primary transition-colors">
                            {profile.username || "Unknown"}
                          </p>
                          {profile.bio && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {profile. bio}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendRequest(profile.user_id);
                          }}
                          className="w-full bg-primary hover:bg-primary/90"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Ally
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}