import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UserPlus, 
  Users, 
  Clock, 
  Search, 
  X, 
  Loader2, 
  AlertCircle, 
  UserX,
  Send,
  Sparkles,
  Skull,
  Crown,
  Shield,
  Swords,
  Flame,
  Filter,
  SortAsc,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  user_id: string;
  username: string | null;
  avatar_url:  string | null;
  bio:  string | null;
  created_at?:  string;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function Allies() {
  const [allies, setAllies] = useState<(Friendship & { profile?:  Profile })[]>([]);
  const [pending, setPending] = useState<(Friendship & { profile?: Profile })[]>([]);
  const [sentRequests, setSentRequests] = useState<(Friendship & { profile?: Profile })[]>([]);
  const [suggested, setSuggested] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Action loading states
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  
  // Confirmation dialogs
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedFriendshipId, setSelectedFriendshipId] = useState<string | null>(null);
  
  // NEW: Advanced features
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'oldest'>('recent');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchCategory, setSearchCategory] = useState<'all' | 'username' | 'bio'>('all');
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadAllData();
    }
  }, [currentUserId]);

  // NEW: Advanced debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setShowSearchDropdown(false);
        return;
      }

      setSearching(true);
      setShowSearchDropdown(true);

      try {
        if (! currentUserId) return;

        // Get existing connections to exclude
        const { data: existingConnections } = await (supabase as any)
          .from("friendships")
          .select("friend_id, user_id");

        const excludeIds = new Set([currentUserId]);
        existingConnections?.forEach((conn:  any) => {
          excludeIds.add(conn.friend_id);
          excludeIds.add(conn. user_id);
        });

        const excludeArray = Array.from(excludeIds);

        // Advanced search based on category
        let queryBuilder = (supabase as any)
          .from("profiles")
          .select("user_id, username, avatar_url, bio, created_at")
          .not("user_id", "in", `(${excludeArray.join(",")})`)
          .not("username", "is", null);

        if (searchCategory === 'username') {
          queryBuilder = queryBuilder.ilike("username", `%${query}%`);
        } else if (searchCategory === 'bio') {
          queryBuilder = queryBuilder.ilike("bio", `%${query}%`);
        } else {
          // Search all fields
          queryBuilder = queryBuilder.or(
            `username.ilike.%${query}%,bio.ilike.%${query}%`
          );
        }

        const { data, error } = await queryBuilder. limit(20);

        if (error) throw error;

        setSearchResults(data || []);
      } catch (error:  any) {
        console.error("Advanced search error:", error);
        toast.error("Search failed");
      } finally {
        setSearching(false);
      }
    }, 300),
    [currentUserId, searchCategory]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const checkAuth = async () => {
    try {
      const { data:  { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user.id);
    } catch (error) {
      console.error("Auth check failed:", error);
      setError("Authentication failed");
      navigate("/auth");
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchAllies(),
        fetchPending(),
        fetchSentRequests(),
        fetchSuggested()
      ]);
    } catch (err) {
      console.error("Load data error:", err);
      setError("Failed to load data.  Please refresh.");
    } finally {
      setLoading(false);
    }
    subscribeToChanges();
  };

  const subscribeToChanges = () => {
    if (! currentUserId) return;

    const channel = supabase
      .channel('friendships_changes')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'friendships'
        },
        (payload) => {
          console.log('Friendship change detected:', payload);
          fetchAllies();
          fetchPending();
          fetchSentRequests();
          fetchSuggested();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscribed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription failed');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchAllies = async () => {
    if (!currentUserId) return;

    try {
      const { data:  friendships, error:  friendError } = await (supabase as any)
        .from("friendships")
        .select("id, user_id, friend_id, status, created_at")
        .eq("user_id", currentUserId)
        .eq("status", "accepted")
        .order("created_at", { ascending: false });

      if (friendError) throw friendError;

      if (! friendships || friendships.length === 0) {
        setAllies([]);
        return;
      }

      const friendIds = friendships.map(f => f.friend_id);
      const { data: profiles, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("user_id, username, avatar_url, bio, created_at")
        .in("user_id", friendIds);

      if (profileError) throw profileError;

      const alliesWithProfiles = friendships.map(f => ({
        ...f,
        profile: profiles?. find(p => p.user_id === f.friend_id)
      })).filter(f => f.profile?. username);

      setAllies(alliesWithProfiles);
    } catch (error) {
      console.error("Fetch allies exception:", error);
      toast.error("Failed to load allies");
    }
  };

  const fetchPending = async () => {
    if (!currentUserId) return;

    try {
      const { data: friendships, error: friendError } = await (supabase as any)
        .from("friendships")
        .select("id, user_id, friend_id, status, created_at")
        .eq("friend_id", currentUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (friendError) throw friendError;

      if (!friendships || friendships.length === 0) {
        setPending([]);
        return;
      }

      const userIds = friendships.map(f => f.user_id);
      const { data: profiles, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("user_id, username, avatar_url, bio, created_at")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      const pendingWithProfiles = friendships.map(f => ({
        ...f,
        profile: profiles?.find(p => p.user_id === f. user_id)
      })).filter(f => f.profile?.username);

      setPending(pendingWithProfiles);
    } catch (error) {
      console.error("Fetch pending exception:", error);
      toast.error("Failed to load pending requests");
    }
  };

  const fetchSentRequests = async () => {
    if (!currentUserId) return;

    try {
      const { data:  friendships, error: friendError } = await (supabase as any)
        .from("friendships")
        .select("id, user_id, friend_id, status, created_at")
        .eq("user_id", currentUserId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (friendError) throw friendError;

      if (!friendships || friendships.length === 0) {
        setSentRequests([]);
        return;
      }

      const friendIds = friendships.map(f => f.friend_id);
      const { data: profiles, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("user_id, username, avatar_url, bio, created_at")
        .in("user_id", friendIds);

      if (profileError) throw profileError;

      const sentWithProfiles = friendships.map(f => ({
        ...f,
        profile: profiles?.find(p => p.user_id === f.friend_id)
      })).filter(f => f.profile?.username);

      setSentRequests(sentWithProfiles);
    } catch (error) {
      console.error("Fetch sent requests exception:", error);
      toast.error("Failed to load sent requests");
    }
  };

  const fetchSuggested = async () => {
    if (!currentUserId) return;

    try {
      const { data: existingConnections, error: connError } = await (supabase as any)
        .from("friendships")
        .select("friend_id, user_id");

      if (connError) throw connError;

      const excludeIds = new Set([currentUserId]);
      existingConnections?. forEach((conn: any) => {
        excludeIds.add(conn.friend_id);
        excludeIds.add(conn. user_id);
      });

      const excludeArray = Array. from(excludeIds);

      let queryBuilder = (supabase as any)
        .from("profiles")
        .select("user_id, username, avatar_url, bio, created_at")
        .not("username", "is", null)
        .limit(12);

      if (excludeArray.length > 0) {
        queryBuilder = queryBuilder.not("user_id", "in", `(${excludeArray.join(",")})`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      setSuggested(data || []);
    } catch (error) {
      console.error("Fetch suggested exception:", error);
      toast.error("Failed to load suggestions");
    }
  };

  const handleSearch = async (signal?:  AbortSignal) => {
    if (! searchQuery.trim() || ! currentUserId) return;

    setSearching(true);
    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("user_id, username, avatar_url, bio, created_at")
        .ilike("username", `%${searchQuery}%`)
        .neq("user_id", currentUserId)
        .not("username", "is", null)
        .limit(20)
        .abortSignal(signal);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error:  any) {
      if (error.name !== 'AbortError') {
        console.error("Search exception:", error);
        toast.error("Search failed");
      }
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (targetUserId: string) => {
  if (!currentUserId || ! targetUserId) {
    toast. error("Invalid user");
    return;
  }

  setSendingId(targetUserId);
  
  try {
    // FIXED: Removed all spaces in the . or() query
    const { data:  existing, error:  checkError } = await (supabase as any)
      .from("friendships")
      .select("id, status, user_id, friend_id")
      .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`);

    if (checkError) {
      console.error("Check friendship error:", checkError);
      throw checkError;
    }

    if (existing && existing.length > 0) {
      const friendship = existing[0];
      
      if (friendship.status === 'pending') {
        if (friendship.user_id === currentUserId) {
          toast.error("🗡️ Friend request already sent");
        } else {
          toast.error("⚔️ This user already sent you a request - check Pending tab");
        }
      } else if (friendship.status === 'accepted') {
        toast.error("🏰 You're already allies with this user");
      } else {
        toast.error("💀 A friendship request already exists");
      }
      return;
    }

    const { error: insertError } = await (supabase as any)
      .from("friendships")
      .insert({
        user_id: currentUserId,
        friend_id:  targetUserId,
        status:  "pending",
      });

    if (insertError) {
      console.error("Insert friendship error:", insertError);
      
      if (insertError.code === "23505") {
        toast.error("Friend request already sent");
      } else {
        throw insertError;
      }
      return;
    }

    toast.success("⚔️ Ally request sent to the shadow realm");
    await Promise.all([
      fetchSentRequests(),
      fetchSuggested()
    ]);
    setSearchResults([]);
    setSearchQuery("");
    setShowSearchDropdown(false);
    
  } catch (error:  any) {
    console.error("Send request exception:", error);
    toast.error(error.message || "Failed to send request");
  } finally {
    setSendingId(null);
  }
};

  const acceptRequest = async (friendshipId: string) => {
    setAcceptingId(friendshipId);
    try {
      const { data: friendship, error: fetchError } = await (supabase as any)
        .from("friendships")
        .select("user_id, friend_id")
        .eq("id", friendshipId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await (supabase as any)
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (updateError) throw updateError;

      const { error: reciprocalError } = await (supabase as any)
        .from("friendships")
        .insert({
          user_id: friendship.friend_id,
          friend_id: friendship.user_id,
          status: "accepted"
        });

      if (reciprocalError && reciprocalError.code !== "23505") {
        console.error("Reciprocal friendship creation failed:", reciprocalError);
      }

      toast.success("🏰 Alliance formed!  Welcome your new ally");
      await Promise. all([
        fetchAllies(),
        fetchPending()
      ]);
    } catch (error) {
      console.error("Accept exception:", error);
      toast.error("Failed to accept request");
    } finally {
      setAcceptingId(null);
    }
  };

  const rejectRequest = async (friendshipId:  string) => {
    setRejectingId(friendshipId);
    try {
      const { error } = await (supabase as any)
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast.success("🗡️ Request cast into the void");
      await Promise.all([
        fetchPending(),
        fetchSuggested()
      ]);
    } catch (error) {
      console.error("Reject exception:", error);
      toast.error("Failed to reject request");
    } finally {
      setRejectingId(null);
      setShowRejectDialog(false);
      setSelectedFriendshipId(null);
    }
  };

  const cancelRequest = async (friendshipId:  string) => {
    setCancelingId(friendshipId);
    try {
      const { error } = await (supabase as any)
        .from("friendships")
        .delete()
        .eq("id", friendshipId)
        .eq("user_id", currentUserId);

      if (error) throw error;

      toast.success("💀 Request cancelled");
      await Promise.all([
        fetchSentRequests(),
        fetchSuggested()
      ]);
    } catch (error) {
      console.error("Cancel exception:", error);
      toast.error("Failed to cancel request");
    } finally {
      setCancelingId(null);
    }
  };

  const removeAlly = async (friendshipId:  string) => {
    setRemovingId(friendshipId);
    try {
      const { error } = await (supabase as any)
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast.success("💔 Alliance severed");
      await Promise.all([
        fetchAllies(),
        fetchSuggested()
      ]);
    } catch (error) {
      console.error("Remove exception:", error);
      toast.error("Failed to remove ally");
    } finally {
      setRemovingId(null);
      setShowRemoveDialog(false);
      setSelectedFriendshipId(null);
    }
  };

  const goToProfile = (username: string | null | undefined) => {
    if (!username) {
      toast.error("User profile not available");
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      toast.error("Invalid username");
      return;
    }

    navigate(`/profile/${username}`);
  };

  // Sort allies
  const sortedAllies = [... allies].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.profile?.username || '').localeCompare(b.profile?.username || '');
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Check if user is veteran
  const isVeteran = (createdAt?:  string) => {
    if (!createdAt) return false;
    const oneYearAgo = new Date();
    oneYearAgo. setFullYear(oneYearAgo.getFullYear() - 1);
    return new Date(createdAt) < oneYearAgo;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pb-20 md:pb-0 md:ml-64 lg:ml-72 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 text-red-500 animate-spin mx-auto" />
          <p className="text-gray-400 font-serif italic">Summoning your dark allies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pb-20 md:pb-0 md:ml-64 lg:ml-72">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Gothic Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-purple-600/10 to-red-600/10 blur-3xl" />
          <div className="relative space-y-2 text-center py-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Swords className="w-8 h-8 text-red-500 animate-pulse" />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-serif bg-gradient-to-r from-red-500 via-purple-500 to-red-500 bg-clip-text text-transparent" 
                  style={{ backgroundSize: '200% 200%', animation: 'gradient 3s ease infinite' }}>
                Dark Allies
              </h1>
              <Shield className="w-8 h-8 text-purple-500 animate-pulse" />
            </div>
            <p className="text-gray-400 text-lg italic font-serif">
              Forge alliances in the shadow realm
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-900/50 bg-red-950/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Search Card */}
        <Card className="border-2 border-red-900/30 bg-gradient-to-br from-gray-900 via-black to-gray-900 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-pulse" />
          
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <span className="bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
                  Find Allies
                </span>
              </CardTitle>
              
              {/* Search Category Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-red-900/50">
                    <Filter className="h-4 w-4 mr-2" />
                    {searchCategory === 'all' ? 'All' : searchCategory === 'username' ? 'Username' : 'Bio'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-red-900/50">
                  <DropdownMenuLabel>Search In</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSearchCategory('all')}>
                    <Search className="h-4 w-4 mr-2" />
                    All Fields
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSearchCategory('username')}>
                    <Users className="h-4 w-4 mr-2" />
                    Username Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSearchCategory('bio')}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Bio Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500 z-10" />
              <Input
                placeholder="Search by username or bio...  (min 2 characters)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowSearchDropdown(true)}
                className="pl-12 pr-12 h-14 text-lg border-2 border-red-900/50 focus:border-red-600 bg-black/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 z-10"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-red-500" />
                </Button>
              )}
              {searching && (
                <Loader2 className="absolute right-14 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-purple-500 z-10" />
              )}
            </div>

            {/* Live Search Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <Card className="border-2 border-red-900/50 bg-gradient-to-b from-gray-900 to-black shadow-2xl">
                <ScrollArea className="h-full max-h-[400px]">
                  <div className="p-2 space-y-1">
                    {searchResults.map((profile) => (
                      <div
                        key={profile.user_id}
                        className="flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-red-900/20 hover:to-purple-900/20 transition-all rounded-lg border border-transparent hover:border-red-900/30 group cursor-pointer"
                      >
                        <div 
                          className="flex items-center gap-4 flex-1 min-w-0"
                          onClick={() => goToProfile(profile.username)}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-red-600/30 blur-lg rounded-full group-hover:bg-purple-600/50 transition-all" />
                            <Avatar className="h-14 w-14 border-2 border-red-900/50 relative">
                              <AvatarImage src={profile.avatar_url || ""} />
                              <AvatarFallback className="bg-gradient-to-br from-red-900 to-purple-900 text-white font-bold text-lg">
                                {profile.username?. charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white truncate text-lg">
                                @{profile.username}
                              </p>
                              {isVeteran(profile.created_at) && (
                                <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                            {profile.bio && (
                              <p className="text-xs text-gray-500 truncate mt-1 italic">
                                "{profile.bio}"
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendRequest(profile.user_id);
                          }}
                          disabled={sendingId === profile.user_id}
                          className="flex-shrink-0 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 border border-red-500/50 shadow-lg shadow-red-900/50"
                        >
                          {sendingId === profile.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}

            {/* No Results */}
            {showSearchDropdown && searchQuery. length >= 2 && searchResults.length === 0 && ! searching && (
              <Card className="border-2 border-red-900/50 bg-gradient-to-b from-gray-900 to-black p-8 text-center">
                <Skull className="w-16 h-16 text-gray-700 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-400 text-lg font-semibold">No souls found in the void</p>
                <p className="text-sm text-gray-600 mt-2">
                  Try searching with different keywords
                </p>
              </Card>
            )}

            {/* Search Tips */}
            {searchQuery. length === 0 && (
              <div className="grid grid-cols-1 md: grid-cols-3 gap-3 text-sm pt-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <Skull className="w-4 h-4 text-red-500" />
                  <span>Min 2 characters</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Live suggestions</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Filter className="w-4 h-4 text-red-500" />
                  <span>Filter by category</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="allies" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto bg-gray-900 border-2 border-red-900/30 p-1">
            <TabsTrigger 
              value="allies" 
              className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]: to-purple-600 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Allies ({allies.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Clock className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Pending ({pending.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sent" 
              className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Send className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Sent ({sentRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="suggested" 
              className="flex-col sm:flex-row gap-1 sm:gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-xs sm: text-sm">Find</span>
            </TabsTrigger>
          </TabsList>

          {/* Allies Tab */}
          <TabsContent value="allies" className="mt-6">
            {allies.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-400">
                  <TrendingUp className="inline h-4 w-4 mr-1" />
                  {allies.length} Dark Allies
                </p>
                
                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-red-900/50">
                      <SortAsc className="h-4 w-4 mr-2" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-900 border-red-900/50">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy('recent')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Most Recent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                      <Crown className="h-4 w-4 mr-2" />
                      Oldest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('name')}>
                      <Users className="h-4 w-4 mr-2" />
                      Alphabetical
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {allies.length === 0 ?  (
              <Card className="border-2 border-red-900/30 bg-gradient-to-br from-gray-900 to-black">
                <CardContent className="py-16 text-center">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-lg font-semibold mb-2 text-gray-400">No allies yet</p>
                  <p className="text-sm text-gray-600">Search and send requests to build your dark network</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedAllies.map((friendship) => {
                  const profile = friendship.profile;
                  if (!profile?. username) return null;

                  return (
                    <Card key={friendship.id} className="border-2 border-red-900/30 bg-gradient-to-br from-gray-900 to-black hover:border-red-600/50 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-red-600/30 blur-xl rounded-full group-hover:bg-purple-600/50 transition-all" />
                            <Avatar
                              className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity border-4 border-red-900/50 relative"
                              onClick={() => goToProfile(profile.username)}
                            >
                              <AvatarImage src={profile.avatar_url || ""} />
                              <AvatarFallback className="bg-gradient-to-br from-red-900 to-purple-900 text-white text-2xl font-bold">
                                {profile.username[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            {isVeteran(profile.created_at) && (
                              <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full p-1.5 border-2 border-black">
                                <Crown className="w-4 h-4 text-black" />
                              </div>
                            )}
                          </div>
                          
                          <div 
                            className="w-full cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => goToProfile(profile.username)}
                          >
                            <p className="font-semibold truncate text-base text-white">{profile.username}</p>
                            {profile.bio && (
                              <p className="text-xs text-gray-500 line-clamp-2 mt-1 italic">"{profile.bio}"</p>
                            )}
                          </div>
                          
                          <Badge className="bg-green-900/30 text-green-400 border-green-700/50">
                            <Shield className="w-3 h-3 mr-1" />
                            Allied
                          </Badge>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFriendshipId(friendship.id);
                              setShowRemoveDialog(true);
                            }}
                            disabled={removingId === friendship.id}
                            className="w-full text-red-400 border-red-900/50 hover:bg-red-900/20"
                          >
                            {removingId === friendship.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Remove
                              </>
                            )}
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
          <TabsContent value="pending" className="mt-6">
            {pending.length === 0 ? (
              <Card className="border-2 border-red-900/30 bg-gradient-to-br from-gray-900 to-black">
                <CardContent className="py-16 text-center">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-lg font-semibold text-gray-400">No pending requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pending.map((friendship) => {
                  const profile = friendship.profile;
                  if (!profile?.username) return null;

                  return (
                    <Card key={friendship. id} className="border-2 border-purple-900/30 bg-gradient-to-br from-gray-900 to-black hover:border-purple-600/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div 
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80"
                            onClick={() => goToProfile(profile.username)}
                          >
                            <div className="relative">
                              <div className="absolute inset-0 bg-purple-600/30 blur-lg rounded-full animate-pulse" />
                              <Avatar className="h-14 w-14 shrink-0 border-2 border-purple-900/50 relative">
                                <AvatarImage src={profile.avatar_url || ""} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-900 to-pink-900 text-white text-lg font-bold">
                                  {profile.username[0]?. toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold truncate text-base text-white">{profile.username}</p>
                                {isVeteran(profile.created_at) && (
                                  <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                              <Badge variant="outline" className="mt-1 bg-purple-900/20 text-purple-400 border-purple-700/50 animate-pulse">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Wants to be allies
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto shrink-0">
                            <Button
                              size="sm"
                              onClick={() => acceptRequest(friendship.id)}
                              disabled={acceptingId === friendship.id}
                              className="flex-1 sm:flex-initial bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            >
                              {acceptingId === friendship.id ?  (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedFriendshipId(friendship.id);
                                setShowRejectDialog(true);
                              }}
                              disabled={rejectingId === friendship.id}
                              className="flex-1 sm:flex-initial text-red-400 border-red-900/50 hover:bg-red-900/20"
                            >
                              {rejectingId === friendship.id ?  (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserX className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Sent Tab */}
          <TabsContent value="sent" className="mt-6">
            {sentRequests.length === 0 ? (
              <Card className="border-2 border-red-900/30 bg-gradient-to-br from-gray-900 to-black">
                <CardContent className="py-16 text-center">
                  <Send className="h-16 w-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-lg font-semibold text-gray-400">No sent requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((friendship) => {
                  const profile = friendship.profile;
                  if (!profile?.username) return null;

                  return (
                    <Card key={friendship. id} className="border-2 border-yellow-900/30 bg-gradient-to-br from-gray-900 to-black hover:border-yellow-600/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div 
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80"
                            onClick={() => goToProfile(profile.username)}
                          >
                            <Avatar className="h-14 w-14 shrink-0 border-2 border-yellow-900/50">
                              <AvatarImage src={profile.avatar_url || ""} />
                              <AvatarFallback className="bg-gradient-to-br from-yellow-900 to-orange-900 text-white text-lg font-bold">
                                {profile.username[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold truncate text-base text-white">{profile. username}</p>
                                {isVeteran(profile.created_at) && (
                                  <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                              <Badge variant="outline" className="mt-1 bg-yellow-900/20 text-yellow-400 border-yellow-700/50">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Pending
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelRequest(friendship.id)}
                            disabled={cancelingId === friendship.id}
                            className="w-full sm:w-auto shrink-0 border-yellow-800/50 hover:bg-yellow-900/20"
                          >
                            {cancelingId === friendship.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </>
                            )}
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
          <TabsContent value="suggested" className="mt-6">
            {suggested.length === 0 ? (
              <Card className="border-2 border-red-900/30 bg-gradient-to-br from-gray-900 to-black">
                <CardContent className="py-16 text-center">
                  <UserPlus className="h-16 w-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-lg font-semibold text-gray-400">No suggestions available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm: grid-cols-2 lg: grid-cols-3 xl: grid-cols-4 gap-4">
                {suggested.map((profile) => {
                  if (!profile. username) return null;

                  return (
                    <Card key={profile.user_id} className="border-2 border-red-900/30 bg-gradient-to-br from-gray-900 to-black hover:border-red-600/50 transition-all group">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-red-600/20 blur-lg rounded-full group-hover:bg-red-600/40 transition-all" />
                            <Avatar
                              className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity border-4 border-red-900/50 relative"
                              onClick={() => goToProfile(profile.username)}
                            >
                              <AvatarImage src={profile.avatar_url || ""} />
                              <AvatarFallback className="bg-gradient-to-br from-red-900 to-purple-900 text-white text-2xl font-bold">
                                {profile.username[0]?. toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            {isVeteran(profile.created_at) && (
                              <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full p-1.5 border-2 border-black">
                                <Crown className="w-4 h-4 text-black" />
                              </div>
                            )}
                          </div>
                          
                          <div 
                            className="w-full cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => goToProfile(profile.username)}
                          >
                            <p className="font-semibold truncate text-base text-white">{profile.username}</p>
                            {profile.bio && (
                              <p className="text-xs text-gray-500 line-clamp-2 mt-1 italic">"{profile.bio}"</p>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendRequest(profile.user_id);
                            }}
                            disabled={sendingId === profile.user_id}
                            className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700"
                          >
                            {sendingId === profile.user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Ally
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Remove Ally Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="max-w-md mx-4 bg-gray-900 border-2 border-red-900/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <Skull className="w-5 h-5" />
              Sever Alliance? 
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to remove this ally? The bond will be broken and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setSelectedFriendshipId(null)} className="w-full sm:w-auto border-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFriendshipId && removeAlly(selectedFriendshipId)}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
            >
              <UserX className="w-4 h-4 mr-2" />
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Request Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="max-w-md mx-4 bg-gray-900 border-2 border-red-900/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <Flame className="w-5 h-5" />
              Cast Request Into Void?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to reject this ally request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setSelectedFriendshipId(null)} className="w-full sm:w-auto border-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFriendshipId && rejectRequest(selectedFriendshipId)}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
            >
              <UserX className="w-4 h-4 mr-2" />
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position:  0% 50%; }
          50% { background-position:  100% 50%; }
        }
      `}</style>
    </div>
  );
}