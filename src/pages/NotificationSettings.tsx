import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Bell, Heart, MessageCircle, UserPlus, Users, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NotificationPreferences {
  friend_requests: boolean;
  friend_accepts: boolean;
  post_reactions: boolean;
  comments: boolean;
  mentions: boolean;
  coven_invites: boolean;
  messages: boolean;
  premium_notifications: boolean;
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    friend_requests: true,
    friend_accepts: true,
    post_reactions: true,
    comments:  true,
    mentions: true,
    coven_invites:  true,
    messages: true,
    premium_notifications: true,
  });

  useEffect(() => {
    checkAuth();
    loadPreferences();
  }, []);

  const checkAuth = async () => {
    const { data:  { user }, error } = await supabase. auth.getUser();
    if (error || !user) {
      navigate("/auth");
    }
  };

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase. auth.getUser();
      if (! user) return;

      // Check if user_preferences table exists and has notification settings
      const { data, error } = await (supabase as any)
        .from("user_preferences")
        .select("notification_preferences")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.log("No existing preferences, using defaults");
      } else if (data?. notification_preferences) {
        setPreferences({ ...preferences, ...data.notification_preferences });
      }
    } catch (error) {
      console.error("Load preferences error:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upsert preferences
      const { error } = await (supabase as any)
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          notification_preferences: preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict:  "user_id"
        });

      if (error) throw error;

      toast. success("Notification preferences saved");
    } catch (error:  any) {
      console.error("Save preferences error:", error);
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:ml-64 lg:ml-72 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:ml-64 lg: ml-72">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">Manage how you receive notifications</p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Friend Notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-500" />
                Friend Notifications
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="friend_requests">Friend Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone sends you a friend request
                  </p>
                </div>
                <Switch
                  id="friend_requests"
                  checked={preferences.friend_requests}
                  onCheckedChange={() => togglePreference("friend_requests")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="friend_accepts">Friend Accepts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone accepts your friend request
                  </p>
                </div>
                <Switch
                  id="friend_accepts"
                  checked={preferences.friend_accepts}
                  onCheckedChange={() => togglePreference("friend_accepts")}
                />
              </div>
            </div>

            <Separator />

            {/* Post Notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                Post Notifications
              </h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="post_reactions">Reactions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone reacts to your posts
                  </p>
                </div>
                <Switch
                  id="post_reactions"
                  checked={preferences.post_reactions}
                  onCheckedChange={() => togglePreference("post_reactions")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comments">Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone comments on your posts
                  </p>
                </div>
                <Switch
                  id="comments"
                  checked={preferences.comments}
                  onCheckedChange={() => togglePreference("comments")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mentions">Mentions</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone mentions you in a post
                  </p>
                </div>
                <Switch
                  id="mentions"
                  checked={preferences.mentions}
                  onCheckedChange={() => togglePreference("mentions")}
                />
              </div>
            </div>

            <Separator />

            {/* Community Notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Community Notifications
              </h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="coven_invites">Coven Invites</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you're invited to join a coven
                  </p>
                </div>
                <Switch
                  id="coven_invites"
                  checked={preferences.coven_invites}
                  onCheckedChange={() => togglePreference("coven_invites")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="messages">Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you receive new messages
                  </p>
                </div>
                <Switch
                  id="messages"
                  checked={preferences.messages}
                  onCheckedChange={() => togglePreference("messages")}
                />
              </div>
            </div>

            <Separator />

            {/* Premium Notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Premium Notifications
              </h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="premium_notifications">Premium Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about premium features and subscription updates
                  </p>
                </div>
                <Switch
                  id="premium_notifications"
                  checked={preferences.premium_notifications}
                  onCheckedChange={() => togglePreference("premium_notifications")}
                />
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={savePreferences} 
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}