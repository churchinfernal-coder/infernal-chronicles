import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, Filter, Users, Image as ImageIcon, X, Loader2, SlidersHorizontal
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  visibility: string;
  media_url?: string;
  media_type?: string;
  media_files?: string;
  created_at: string;
  profiles?:  {
    username: string;
    avatar_url: string;
  };
}

interface SearchResult {
  posts: Post[];
  users: any[];
  covens: any[];
  media: Post[];
}

const POSTS_PER_PAGE = 20;

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "posts" | "users" | "covens" | "media">("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "trending">("recent");
  const [filters, setFilters] = useState({
    postType: [] as string[],
    dateRange: "all" as "all" | "today" | "week" | "month" | "year",
    hasMedia: false,
    verifiedOnly: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchPosts(true);
    const unsubscribe = subscribeToNewPosts();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchPosts(true);
  }, [filters, sortBy]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !searchResults) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, searchResults, page]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(user. id);
  };

  const fetchPosts = async (reset:  boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
        setPosts([]);
      }

      const currentPage = reset ? 0 : page;

      // Optimized query with JOIN
      let query = supabase
        . from("posts")
        .select(`
          *,
          profiles! inner(username, avatar_url)
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending:  false })
        .range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1);

      if (filters.postType.length > 0) {
        query = query. in("post_type", filters.postType);
      }

      if (filters.hasMedia) {
        query = query.or("media_url. not. is. null,media_files.not.is.null");
      }

      if (filters. dateRange !== "all") {
        const now = new Date();
        let since = new Date();
        
        switch (filters.dateRange) {
          case "today": 
            since. setHours(0, 0, 0, 0);
            break;
          case "week": 
            since.setDate(now. getDate() - 7);
            break;
          case "month":
            since.setMonth(now.getMonth() - 1);
            break;
          case "year":
            since.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        query = query.gte("created_at", since. toISOString());
      }

      const { data:  postsData, error:  postsError } = await query;

      if (postsError) throw postsError;

      const newPosts = (postsData || []) as Post[];
      
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ... newPosts]);
      }

      setHasMore(newPosts.length === POSTS_PER_PAGE);
      
    } catch (error:  any) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setPage(prev => prev + 1);
    await fetchPosts(false);
  };

  const subscribeToNewPosts = () => {
    const channel = supabase
      .channel("public-posts-feed")
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "posts",
          filter: "visibility=eq.public"
        },
        async (payload) => {
          // Fetch the new post with profile
          const { data: newPost } = await supabase
            . from("posts")
            .select(`
              *,
              profiles! inner(username, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single();

          if (newPost) {
            setPosts(prev => [newPost as Post, ...prev]);
            toast.success("New post appeared!", { duration: 2000 });
          }
        }
      )
      .subscribe();

    return () => {
      supabase. removeChannel(channel);
    };
  };

  const handlePostUpdated = () => {
    fetchPosts(true);
    toast.success("Post updated successfully");
  };

  const handlePostDeleted = (deletedId?:  string) => {
    if (deletedId) {
      setPosts(prev => prev.filter(p => p.id !== deletedId));
    } else {
      fetchPosts(true);
    }
    toast.success("Post deleted successfully");
  };

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      const searchTerm = `%${query}%`;

      // Search posts with profiles
      const { data: postsData } = await supabase
        . from("posts")
        .select(`
          *,
          profiles!inner(username, avatar_url)
        `)
        .eq("visibility", "public")
        .or(`content.ilike.${searchTerm},post_type.ilike.${searchTerm}`)
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: usersData } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.${searchTerm},bio.ilike.${searchTerm}`)
        .limit(10);

      const { data: covensData } = await supabase
        .from("covens")
        .select("*")
        .or(`name.ilike.${searchTerm},description. ilike.${searchTerm}`)
        .limit(10);

      // Search media posts
      const { data: mediaData } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!inner(username, avatar_url)
        `)
        .eq("visibility", "public")
        .or("media_url.not.is. null,media_files.not. is.null")
        .or(`content.ilike.${searchTerm}`)
        .order("created_at", { ascending: false })
        .limit(20);

      setSearchResults({
        posts:  (postsData || []) as Post[],
        users:  usersData || [],
        covens: covensData || [],
        media: (mediaData || []) as Post[],
      });
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error("Search failed");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setActiveTab("all");
  };

  const clearAllFilters = () => {
    setFilters({
      postType: [],
      dateRange: "all",
      hasMedia: false,
      verifiedOnly: false,
    });
    setSortBy("recent");
  };

  const hasActiveFilters = 
    filters.postType.length > 0 || 
    filters.dateRange !== "all" || 
    filters.hasMedia || 
    filters.verifiedOnly ||
    sortBy !== "recent";

  const filteredPosts = useMemo(() => {
    return searchResults ? searchResults.posts : posts;
  }, [searchResults, posts]);

  if (loading && page === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-4 md: py-6 px-3 sm:px-4 space-y-4">
        {[... Array(3)].map((_, i) => (
          <div key={i} className="bg-black/50 backdrop-blur-xl border border-primary/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-4 md:py-6 px-3 sm:px-4 space-y-4 md:space-y-6 pb-20 md:ml-64 lg:ml-72">
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border border-primary/20 rounded-lg p-3 md:p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts, users, covens, media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-primary/30"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            className="shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="bg-background/50 rounded-lg p-4 space-y-4 border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium block">Sort By</label>
                <Select value={sortBy} onValueChange={(v:  any) => setSortBy(v)}>
                  <SelectTrigger className="w-full bg-background/50 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium block">Date Range</label>
                <Select 
                  value={filters.dateRange} 
                  onValueChange={(v: any) => setFilters(prev => ({ ...prev, dateRange: v }))}
                >
                  <SelectTrigger className="w-full bg-background/50 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium block">Post Types</label>
              <div className="flex flex-wrap gap-2">
                {["scream", "whisper", "incantation"]. map((type) => (
                  <Button
                    key={type}
                    variant={filters.postType.includes(type) ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        postType: prev.postType.includes(type)
                          ? prev.postType.filter(t => t !== type)
                          :  [...prev.postType, type]
                      }));
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.hasMedia ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setFilters(prev => ({ ...prev, hasMedia: !prev.hasMedia }))}
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                Media Only
              </Button>
            </div>
          </div>
        )}

        {searchResults && (
          <Tabs value={activeTab} onValueChange={(v:  any) => setActiveTab(v)} className="w-full">
            <TabsList className="w-full grid grid-cols-5 bg-background/50">
              <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
              <TabsTrigger value="posts" className="text-xs px-2">Posts</TabsTrigger>
              <TabsTrigger value="users" className="text-xs px-2">Users</TabsTrigger>
              <TabsTrigger value="covens" className="text-xs px-2">Covens</TabsTrigger>
              <TabsTrigger value="media" className="text-xs px-2">Media</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {hasActiveFilters && ! showFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Active: </span>
            {sortBy !== "recent" && (
              <Badge variant="secondary" className="text-xs">{sortBy}</Badge>
            )}
            {filters.postType.map(type => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    postType: prev.postType.filter(t => t !== type)
                  }))}
                />
              </Badge>
            ))}
            {filters.dateRange !== "all" && (
              <Badge variant="secondary" className="text-xs">
                {filters.dateRange}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, dateRange: "all" }))}
                />
              </Badge>
            )}
            {filters.hasMedia && (
              <Badge variant="secondary" className="text-xs">
                Media
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, hasMedia: false }))}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {! searchResults && (
        <CreatePost 
          onPostCreated={() => {
            fetchPosts(true);
            toast.success("Posted successfully");
          }} 
        />
      )}

      {searchResults && searchLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
          <p>Searching... </p>
        </div>
      )}

      {searchResults && !searchLoading && (
        <div className="space-y-4">
          {activeTab === "all" && (
            <>
              {searchResults.posts.slice(0, 5).map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={currentUserId}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={() => handlePostDeleted(post. id)}
                />
              ))}
              {searchResults.users.slice(0, 3).map((user) => (
                <div 
                  key={user.user_id} 
                  className="bg-black/50 backdrop-blur-xl border border-primary/20 rounded-lg p-4 cursor-pointer hover:border-primary/40 transition-all"
                  onClick={() => navigate(`/profile?user=${user.username}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url} alt={user.username} />
                      <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                        {user.username?. charAt(0)?. toUpperCase() || "👤"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{user.username || "Anonymous"}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{user.bio || "No bio"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === "posts" && searchResults.posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUserId}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={() => handlePostDeleted(post.id)}
            />
          ))}

          {activeTab === "users" && searchResults.users.map((user) => (
            <div 
              key={user.user_id} 
              className="bg-black/50 backdrop-blur-xl border border-primary/20 rounded-lg p-4 cursor-pointer hover:border-primary/40 transition-all"
              onClick={() => navigate(`/profile?user=${user.username}`)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url} alt={user.username} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                    {user.username?.charAt(0)?.toUpperCase() || "👤"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{user.username || "Anonymous"}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{user.bio || "No bio"}</p>
                </div>
              </div>
            </div>
          ))}

          {activeTab === "covens" && searchResults.covens. map((coven) => (
            <div 
              key={coven.id} 
              className="bg-black/50 backdrop-blur-xl border border-primary/20 rounded-lg p-4 cursor-pointer hover: border-primary/40 transition-all"
              onClick={() => navigate(`/covens/${coven.id}`)}
            >
              <h3 className="font-semibold">{coven.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{coven.description}</p>
            </div>
          ))}

          {activeTab === "media" && searchResults.media.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUserId}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={() => handlePostDeleted(post.id)}
            />
          ))}
        </div>
      )}

      {! searchResults && (
        <>
          <div className="space-y-3 md:space-y-4">
            {filteredPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUserId={currentUserId}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={() => handlePostDeleted(post.id)}
              />
            ))}
            
            {filteredPosts.length === 0 && ! loading && (
              <div className="text-center py-12 text-muted-foreground">
                No posts match your filters. 
              </div>
            )}
          </div>

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="flex justify-center py-4">
            {loadingMore && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="animate-spin h-6 w-6" />
                <p className="text-sm">Loading more posts...</p>
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-sm text-muted-foreground">You've reached the end</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}