import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  MessageSquare, 
  Crown,
  Flame,
  Moon,
  Sparkles,
  Wand2,
  Calendar,
  Library,
  Palette,
  TrendingUp,
  Plus,
  ArrowRight,
  Zap
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
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
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
    if (!loading && ! user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    const { data: profileData } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    const [postsCount, friendsCount, covensCount] = await Promise.all([
      (supabase as any).from("posts").select("id", { count: "exact" }).eq("user_id", user.id),
      (supabase as any).from("friendships").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "accepted"),
      (supabase as any).from("coven_members").select("id", { count: "exact" }).eq("user_id", user.id)
    ]);

    setStats({
      posts: postsCount.count || 0,
      friends:  friendsCount.count || 0,
      covens: covensCount.count || 0,
      primeLevel: profileData?. prime_level || 0
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
      .order("created_at", { ascending:  false })
      .limit(5);

    setRecentActivity(recentPosts || []);
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
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading your castle...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const premiumFeatures = [
    { name:  "Ouija Chamber", path: "/ouija-room", icon: Moon, color: "text-purple-400" },
    { name: "Tarot Reading", path: "/tarot-reading", icon: Wand2, color: "text-pink-400" },
    { name: "Rune Casting", path: "/rune-casting", icon: Sparkles, color:  "text-blue-400" },
    { name: "Solomon's Chamber", path: "/solomons-chamber", icon: Crown, color: "text-yellow-400" },
    { name:  "Ritual Calendar", path: "/ritual-calendar", icon: Calendar, color: "text-green-400" },
    { name: "Occult Library", path: "/occult-library", icon: Library, color: "text-red-400" },
    { name: "Wicked Works", path: "/wicked-works", icon: Palette, color: "text-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:ml-64 lg:ml-72">
      {/* Clean Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Devil's Den</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Your command center</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <Crown className="h-3 w-3" />
                <span className="text-xs">Level {stats.primeLevel}</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg: px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Welcome back, {profile?. username || "Dark One"}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  {profile?.mood_status || "The darkness awaits your command"}
                </p>
              </div>
              <Button 
                size="lg" 
                className="gap-2 shrink-0"
                onClick={() => navigate("/feed")}
              >
                <Plus className="h-4 w-4" />
                Create Post
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/feed")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Posts</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.posts}</div>
              <p className="text-xs text-muted-foreground mt-1">Total whispers</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/allies")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Allies</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.friends}</div>
              <p className="text-xs text-muted-foreground mt-1">Connected souls</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/covens")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Covens</CardTitle>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.covens}</div>
              <p className="text-xs text-muted-foreground mt-1">Circles joined</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/profile")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Prime Level</CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.primeLevel}</div>
              <p className="text-xs text-muted-foreground mt-1">Current rank</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity - Takes 2 columns on large screens */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="mt-1">Latest from your network</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/feed")}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => {
                    const displayContent = parseActivityContent(activity.content);
                    return (
                      <div key={activity.id}>
                        <div 
                          className="flex gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => navigate("/feed")}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm">
                                {activity.profiles?.username || "Anonymous"}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {activity.post_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {new Date(activity.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {displayContent}
                            </p>
                          </div>
                        </div>
                        {index < recentActivity.length - 1 && <Separator className="mt-4" />}
                      </div>
                    );
                  })}

                  {recentActivity.length === 0 && (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/feed")}>
                        Start Exploring
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Premium Features - Takes 1 column on large screens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Premium Features
              </CardTitle>
              <CardDescription>Unlock mystical powers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {premiumFeatures.map((feature) => {
                  const Icon = feature. icon;
                  return (
                    <Button
                      key={feature.path}
                      variant="outline"
                      className="w-full justify-start h-auto py-3 hover:bg-primary/5"
                      onClick={() => navigate(feature.path)}
                    >
                      <Icon className={`h-4 w-4 mr-3 shrink-0 ${feature.color}`} />
                      <span className="text-sm font-medium">{feature.name}</span>
                      <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                    </Button>
                  );
                })}
              </div>

              <Separator className="my-4" />

              {/* Quick Links */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/chat")}
                >
                  <MessageSquare className="h-4 w-4 mr-3" />
                  Send Message
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/allies")}
                >
                  <Users className="h-4 w-4 mr-3" />
                  Find Allies
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;