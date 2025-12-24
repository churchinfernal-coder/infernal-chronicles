import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Heart, 
  Crown,
  Flame,
  Moon,
  Sparkles,
  LogOut
} from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    posts: 0,
    friends: 0,
    covens: 0,
    primeLevel: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [profile, setProfile] = useState<{
    username: string | null;
    avatar_url: string | null;
    mood_status: string | null;
    prime_level: number;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ??  null);
        setLoading(false);
      }
    );

    supabase.auth.getSession(). then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (! loading && ! user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    const { data: profileData } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setProfile(profileData);

    const [postsCount, friendsCount, covensCount] = await Promise.all([
      (supabase as any). from("posts").select("id", { count: "exact" }).eq("user_id", user.id),
      (supabase as any).from("friendships").select("id", { count: "exact" }).eq("user_id", user.id). eq("status", "accepted"),
      (supabase as any).from("coven_members").select("id", { count: "exact" }).eq("user_id", user.id)
    ]);

    setStats({
      posts: postsCount.count || 0,
      friends: friendsCount.count || 0,
      covens: covensCount.count || 0,
      primeLevel: (profileData as any)?.prime_level || 0
    });

    const { data: recentPosts } = await (supabase as any)
      .from("posts")
      .select(`
        id,
        content,
        created_at,
        post_type,
        profiles! posts_user_id_fkey(username, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    setRecentActivity(recentPosts || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast. success("👋 You've escaped the darkness...  for now");
    navigate("/auth");
  };

  const parseActivityContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return parsed.text || parsed.chant || parsed.title || content;
    } catch {
      return content;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-2xl font-gothic text-primary animate-pulse">⏳ Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20 md:ml-64 lg:ml-72">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-14 md:h-16 shrink-0 items-center gap-2 md:gap-4 border-b border-primary/20 bg-card/95 backdrop-blur px-3 md:px-6">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Moon className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-primary shrink-0" />
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-gothic text-primary truncate">
            Devil's Dashboard
          </h1>
        </div>
        <Button 
          onClick={handleSignOut} 
          variant="outline" 
          size="sm"
          className="font-decorative text-xs md:text-sm shrink-0"
        >
          <LogOut className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
          <span className="hidden md:inline">Exit</span>
        </Button>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8">
        {/* Welcome Section */}
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 md:mb-2 truncate">
            Welcome back, {profile?.username || user.email}
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base line-clamp-2">
            {profile?.mood_status || "The darkness awaits your presence... "}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          <Card className="border-primary/20 hover:border-primary/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Total Posts</CardTitle>
              <Flame className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{stats.posts}</div>
              <p className="text-xs text-muted-foreground line-clamp-1">Whispers from the void</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Dark Allies</CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{stats.friends}</div>
              <p className="text-xs text-muted-foreground line-clamp-1">Souls bound to yours</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Covens</CardTitle>
              <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{stats. covens}</div>
              <p className="text-xs text-muted-foreground line-clamp-1">Dark circles joined</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/60 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Prime Level</CardTitle>
              <Crown className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{stats.primeLevel}</div>
              <p className="text-xs text-muted-foreground line-clamp-1">Ascension progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-primary/20">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <ScrollArea className="h-[300px] md:h-[400px] lg:h-[500px] pr-2 md:pr-4">
                <div className="space-y-3 md:space-y-4">
                  {recentActivity. map((activity) => {
                    const displayContent = parseActivityContent(activity. content);

                    return (
                      <div 
                        key={activity.id}
                        className="flex gap-2 md:gap-4 p-3 md:p-4 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors cursor-pointer"
                        onClick={() => navigate("/feed")}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 md:mb-2 flex-wrap">
                            <span className="font-semibold text-sm md:text-base truncate">
                              {activity. profiles?.username || "Anonymous"}
                            </span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {activity.post_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto shrink-0">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                            {displayContent}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {recentActivity.length === 0 && (
                    <div className="text-center py-8 md:py-12 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
                      <p className="text-sm md:text-base">No recent activity</p>
                      <p className="text-xs md:text-sm">Start creating posts to see activity here</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-primary/20">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 md:space-y-3 p-4 pt-0 md:p-6 md:pt-0">
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs md:text-sm" 
                size="sm"
                onClick={() => navigate("/feed")}
              >
                <Flame className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                Create Post
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs md:text-sm" 
                size="sm"
                onClick={() => navigate("/chat")}
              >
                <MessageSquare className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                Send Message
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs md:text-sm" 
                size="sm"
                onClick={() => navigate("/friends")}
              >
                <Users className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                Find Allies
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs md:text-sm" 
                size="sm"
                onClick={() => navigate("/covens")}
              >
                <Sparkles className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                Join Coven
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs md:text-sm" 
                size="sm"
                onClick={() => navigate("/store")}
              >
                <Crown className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                Prime Store
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs md:text-sm" 
                size="sm"
                onClick={() => navigate("/profile")}
              >
                <Heart className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                My Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
