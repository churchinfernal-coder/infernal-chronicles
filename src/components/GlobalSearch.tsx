import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, User, FileText, Users, Video, MapPin, Filter, X, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface SearchResults {
  users: any[];
  posts: any[];
  videos: any[];
  covens: any[];
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "username" | "email" | "location">("all");
  const [sortBy, setSortBy] = useState<"relevance" | "recent" | "popular">("relevance");
  const [searchResults, setSearchResults] = useState<SearchResults>({
    users: [],
    posts: [],
    videos: [],
    covens: [],
  });
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Save search to recent searches
  const saveRecentSearch = useCallback((query: string) => {
    if (! query. trim()) return;
    
    const updated = [query, ...recentSearches. filter(s => s !== query)]. slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  }, [recentSearches]);

  // Debounced search
  useEffect(() => {
    if (! searchQuery.trim()) {
      setSearchResults({ users: [], posts: [], videos: [], covens: [] });
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType, sortBy]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const searchTerm = `%${searchQuery}%`;

      // Search users based on search type
      let usersQuery = supabase
        . from("profiles")
        .select("user_id, username, avatar_url, bio, location, created_at")
        .limit(20);

      if (searchType === "username" || searchType === "all") {
        usersQuery = usersQuery.or(`username.ilike.${searchTerm},bio.ilike.${searchTerm}`);
      }
      if (searchType === "location") {
        usersQuery = usersQuery.ilike("location", searchTerm);
      }

      // Apply sorting
      if (sortBy === "recent") {
        usersQuery = usersQuery.order("created_at", { ascending: false });
      }
      
      const { data: users, error: usersError } = await usersQuery;
      if (usersError) console.error("Users search error:", usersError);

      // Search posts in Devil's Diary
      let postsQuery = supabase
        .from("posts")
        .select(`
          id,
          content,
          created_at,
          media_type,
          media_url,
          profiles!posts_user_id_fkey(username, avatar_url, user_id)
        `)
        .ilike("content", searchTerm)
        .eq("visibility", "public")
        .neq("media_type", "video")
        .limit(20);

      if (sortBy === "recent") {
        postsQuery = postsQuery. order("created_at", { ascending: false });
      }

      const { data: posts, error: postsError } = await postsQuery;
      if (postsError) console.error("Posts search error:", postsError);

      // Search videos by keyword
      let videosQuery = supabase
        .from("posts")
        .select(`
          id,
          content,
          created_at,
          media_url,
          video_duration,
          profiles!posts_user_id_fkey(username, avatar_url, user_id)
        `)
        .eq("media_type", "video")
        .ilike("content", searchTerm)
        .limit(20);

      if (sortBy === "recent") {
        videosQuery = videosQuery.order("created_at", { ascending: false });
      }

      const { data: videos, error: videosError } = await videosQuery;
      if (videosError) console.error("Videos search error:", videosError);

      // Search covens
      const { data: covens, error: covensError } = await supabase
        .from("covens")
        .select("id, name, description, is_private, created_at, member_count")
        .or(`name.ilike.${searchTerm},description.ilike. ${searchTerm}`)
        .eq("is_private", false)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (covensError) console.error("Covens search error:", covensError);

      setSearchResults({
        users: users || [],
        posts: posts || [],
        videos: videos || [],
        covens: covens || [],
      });

      saveRecentSearch(searchQuery);
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e. key === "Enter") {
      performSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults({ users: [], posts: [], videos: [], covens: [] });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const totalResults = useMemo(
    () =>
      searchResults.users.length +
      searchResults.posts. length +
      searchResults.videos.length +
      searchResults. covens.length,
    [searchResults]
  );

  return (
    <>
      {/* Mobile: Compact button */}
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground border-primary/30 bg-background/50 md:hidden h-9 px-3"
        onClick={() => setIsOpen(true)}
      >
        <Search className="h-4 w-4 mr-2 shrink-0" />
        <span className="text-xs truncate">Search...</span>
      </Button>

      {/* Desktop: Full search input */}
      <div className="relative hidden md:block w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          type="search"
          placeholder="Search posts, users, covens, videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 bg-background/50 border-primary/30 h-9 text-sm"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 z-10"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              {t("search.title") || "Search"}
              {totalResults > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalResults} {totalResults === 1 ? "result" : "results"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Search Controls */}
          <div className="px-6 py-4 space-y-3 border-b bg-muted/20">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("search.placeholder") || "Search anything..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e. target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 pr-10 border-primary/30 h-10"
                  autoFocus
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button 
                onClick={performSearch} 
                disabled={searching || !searchQuery.trim()} 
                className="bg-primary hover:bg-primary/90 h-10"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {t("search.search") || "Search"}
                  </>
                )}
              </Button>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm whitespace-nowrap">{t("search.filterBy") || "Filter"}:</Label>
                <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                  <SelectTrigger className="w-40 h-8 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("search.all") || "All"}</SelectItem>
                    <SelectItem value="username">{t("search. username") || "Username"}</SelectItem>
                    <SelectItem value="location">{t("search.location") || "Location"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm whitespace-nowrap">Sort:</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40 h-8 border-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recent Searches */}
            {! searchQuery && recentSearches.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Recent:</span>
                {recentSearches.map((search, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setSearchQuery(search)}
                  >
                    {search}
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={clearRecentSearches}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Results Tabs */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="mx-6 mt-4 grid w-auto grid-cols-4 bg-muted/50">
              <TabsTrigger value="users" className="text-xs md:text-sm">
                <User className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{t("search.users") || "Users"}</span>
                <span className="sm:hidden">Users</span>
                <Badge variant="secondary" className="ml-1 h-5 text-xs">
                  {searchResults.users.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="posts" className="text-xs md:text-sm">
                <FileText className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{t("search.posts") || "Posts"}</span>
                <span className="sm:hidden">Posts</span>
                <Badge variant="secondary" className="ml-1 h-5 text-xs">
                  {searchResults.posts.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="videos" className="text-xs md:text-sm">
                <Video className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{t("search.videos") || "Videos"}</span>
                <span className="sm:hidden">Videos</span>
                <Badge variant="secondary" className="ml-1 h-5 text-xs">
                  {searchResults.videos.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="covens" className="text-xs md:text-sm">
                <Users className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{t("search.covens") || "Covens"}</span>
                <span className="sm:hidden">Covens</span>
                <Badge variant="secondary" className="ml-1 h-5 text-xs">
                  {searchResults.covens.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="flex-1 overflow-auto px-6 pb-6 mt-4">
              {searching ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="flex items-center gap-4 py-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults. users.map((user: any) => (
                    <Card
                      key={user.user_id}
                      className="cursor-pointer hover:bg-accent/50 transition-all hover:border-primary/30"
                      onClick={() => {
                        navigate(`/profile? user=${user.user_id}`);
                        setIsOpen(false);
                      }}
                    >
                      <CardContent className="flex items-center gap-4 py-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-primary/20 text-primary text-lg">
                            {user.username?. charAt(0)?.toUpperCase() || "? "}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{user.username}</h3>
                          {user.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {user.location}
                            </div>
                          )}
                          {user.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {searchResults.users.length === 0 && searchQuery && ! searching && (
                    <div className="text-center py-12 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t("search.noUsers") || "No users found"}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts" className="flex-1 overflow-auto px-6 pb-6 mt-4">
              {searching ?  (
                <div className="space-y-3">
                  {[...Array(3)]. map((_, i) => (
                    <Card key={i}>
                      <CardContent className="py-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.posts.map((post: any) => (
                    <Card
                      key={post.id}
                      className="cursor-pointer hover:bg-accent/50 transition-all hover:border-primary/30"
                      onClick={() => {
                        navigate("/feed");
                        setIsOpen(false);
                      }}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={post.profiles?.avatar_url} />
                            <AvatarFallback className="text-xs bg-primary/20">
                              {post.profiles?.username?.charAt(0)?. toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold">
                            {post.profiles?. username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            · {new Date(post.created_at). toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-3">{post.content}</p>
                        {post.media_url && post.media_type === "photo" && (
                          <img 
                            src={post. media_url} 
                            alt="Post media" 
                            className="mt-3 rounded-md max-h-48 w-full object-cover"
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {searchResults.posts. length === 0 && searchQuery && !searching && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t("search.noPosts") || "No posts found"}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="flex-1 overflow-auto px-6 pb-6 mt-4">
              {searching ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="py-4">
                        <div className="flex gap-3">
                          <Skeleton className="w-32 h-20 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.videos.map((video: any) => (
                    <Card
                      key={video.id}
                      className="cursor-pointer hover:bg-accent/50 transition-all hover:border-primary/30"
                      onClick={() => {
                        navigate(`/profile? user=${video.profiles?.user_id}`);
                        setIsOpen(false);
                      }}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                            {video.media_url ?  (
                              <video src={video.media_url} className="w-full h-full object-cover" />
                            ) : (
                              <Video className="absolute inset-0 m-auto h-8 w-8 text-primary" />
                            )}
                            {video.video_duration && (
                              <Badge className="absolute bottom-1 right-1 text-xs">
                                {Math.floor(video.video_duration / 60)}:{(video.video_duration % 60).toString().padStart(2, '0')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={video.profiles?.avatar_url} />
                                <AvatarFallback className="text-xs bg-primary/20">
                                  {video.profiles?.username?. charAt(0)?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-semibold truncate">
                                {video. profiles?.username}
                              </span>
                            </div>
                            <p className="text-sm line-clamp-2">{video.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {searchResults.videos.length === 0 && searchQuery && !searching && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t("search.noVideos") || "No videos found"}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Covens Tab */}
            <TabsContent value="covens" className="flex-1 overflow-auto px-6 pb-6 mt-4">
              {searching ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="py-4 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.covens.map((coven: any) => (
                    <Card
                      key={coven.id}
                      className="cursor-pointer hover:bg-accent/50 transition-all hover:border-primary/30"
                      onClick={() => {
                        navigate("/covens");
                        setIsOpen(false);
                      }}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1 flex items-center gap-2">
                              {coven.name}
                              {coven.member_count && (
                                <Badge variant="secondary" className="text-xs">
                                  {coven.member_count} members
                                </Badge>
                              )}
                            </h3>
                            {coven.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {coven.description}
                              </p>
                            )}
                          </div>
                          {coven.is_private && (
                            <Badge variant="outline">Private</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {searchResults.covens.length === 0 && searchQuery && !searching && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t("search.noCovens") || "No covens found"}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}