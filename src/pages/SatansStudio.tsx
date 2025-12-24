import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, Play, User, ArrowLeft, Grid3x3, List, Eye, Heart, MessageCircle, Users, Calendar,
  Video as VideoIcon, Share2, UserPlus, UserCheck, Plus, Edit, Trash2, MoreVertical, Save, X, Upload
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VideoUpload } from "@/components/VideoUpload";

interface Video {
  id: string;
  content: string;
  media_url: string;
  thumbnail_url?: string;
  created_at: string;
  user_id: string;
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
}

interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  video_count: number;
  total_views: number;
  total_likes: number;
  disciples_count: number;
  allies_count: number;
  created_at: string;
}

interface VideoMetadata {
  title: string;
  chant: string;
  tags: string[];
}

export default function SatansStudio() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // CRUD State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [editMetadata, setEditMetadata] = useState<VideoMetadata>({ title: "", chant: "", tags: [] });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStudioData();

    const videosChannel = supabase
      .channel('studio_videos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `media_type=eq.video` }, () => {
        console.log('🎬 Video change detected');
        loadStudioData();
      })
      .subscribe();

    const reactionsChannel = supabase
      .channel('studio_reactions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions' }, () => {
        console. log('❤️ Reaction change detected');
        loadStudioData();
      })
      .subscribe();

    const friendshipsChannel = supabase
      .channel('studio_friendships_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        console.log('👥 Friendship change detected');
        loadStudioData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(videosChannel);
      supabase. removeChannel(reactionsChannel);
      supabase.removeChannel(friendshipsChannel);
    };
  }, [username]);

  const loadStudioData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?. id || null);

      if (! username) {
        toast.error("Username not provided");
        navigate("/satans-sinagogue");
        return;
      }

      const { data: profileData, error: profileError } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (profileError || !profileData) {
        toast.error("Creator not found");
        navigate("/satans-sinagogue");
        return;
      }

      const userId = profileData.user_id || profileData.id;

      const { data: videosData } = await (supabase as any)
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .eq("media_type", "video")
        .order("created_at", { ascending: false });

      const videoIds = (videosData || []).map((v: any) => v.id);
      const { data: likesData } = await (supabase as any)
        .from("post_reactions")
        . select("post_id")
        .in("post_id", videoIds)
        .eq("reaction_type", "like");

      const { data: commentsData } = await (supabase as any)
        .from("post_comments")
        .select("post_id")
        .in("post_id", videoIds);

      const videoList = (videosData || []).map((video: any) => ({
        ... video,
        likes_count: likesData?.filter((l: any) => l.post_id === video.id). length || 0,
        comments_count: commentsData?.filter((c: any) => c. post_id === video.id). length || 0,
        views_count: Math.floor(Math.random() * 10000)
      }));

      const totalViews = videoList.reduce((sum: number, v: any) => sum + (v.views_count || 0), 0);
      const totalLikes = videoList.reduce((sum: number, v: any) => sum + (v.likes_count || 0), 0);

      const { count: disciplesCount } = await (supabase as any)
        .from("friendships")
        .select("*", { count: 'exact', head: true })
        .eq("friend_id", userId)
        .eq("status", "accepted");

      const { count: alliesCount } = await (supabase as any)
        .from("friendships")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", userId)
        . eq("status", "accepted");

      if (user?. id && user.id !== userId) {
        const { data: followData } = await (supabase as any)
          .from("friendships")
          .select("id")
          .eq("user_id", user.id)
          .eq("friend_id", userId)
          .maybeSingle();
        
        setIsFollowing(!! followData);
      }

      setProfile({
        id: userId,
        username: profileData.username,
        full_name: profileData. full_name,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        video_count: videoList.length,
        total_views: totalViews,
        total_likes: totalLikes,
        disciples_count: disciplesCount || 0,
        allies_count: alliesCount || 0,
        created_at: profileData.created_at
      });
      setVideos(videoList);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      navigate("/satans-sinagogue");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || !profile) {
      toast.error("Please log in to follow");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await (supabase as any)
          .from("friendships")
          .delete()
          .eq("user_id", currentUserId)
          .eq("friend_id", profile.id);

        if (error) throw error;
        setIsFollowing(false);
        toast.success("Unfollowed");
        setProfile(prev => prev ? {... prev, disciples_count: prev. disciples_count - 1} : null);
      } else {
        const { error } = await (supabase as any)
          .from("friendships")
          .insert({
            user_id: currentUserId,
            friend_id: profile.id,
            status: "accepted"
          });

        if (error) throw error;
        setIsFollowing(true);
        toast.success("Following!");
        setProfile(prev => prev ? {...prev, disciples_count: prev.disciples_count + 1} : null);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);
    
    try {
      const metadata = JSON.parse(video.content);
      if (metadata.title || metadata.chant || metadata.tags) {
        setEditMetadata({
          title: metadata.title || "",
          chant: metadata.chant || "",
          tags: metadata.tags || []
        });
      } else {
        setEditMetadata({ title: video.content, chant: "", tags: [] });
      }
    } catch {
      setEditMetadata({ title: video.content, chant: "", tags: [] });
    }
    
    setEditDialogOpen(true);
  };

  const handleSaveVideo = async () => {
    if (!editingVideo) return;

    setSaving(true);
    try {
      const content = JSON.stringify(editMetadata);

      const { error } = await (supabase as any)
        .from("posts")
        . update({ content })
        .eq("id", editingVideo.id);

      if (error) throw error;

      toast.success("Video updated successfully!");
      setEditDialogOpen(false);
      setEditingVideo(null);
      loadStudioData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update video");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;

    try {
      const { error } = await (supabase as any)
        .from("posts")
        .delete()
        .eq("id", videoToDelete);

      if (error) throw error;

      toast.success("Video deleted successfully!");
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
      loadStudioData();
    } catch (error: any) {
      console.error(error);
      toast.error(error. message || "Failed to delete video");
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !editMetadata.tags.includes(tagInput.trim())) {
      setEditMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput. trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setEditMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/satans-sinagogue? v=${videoId}`);
  };

  const handleViewProfile = () => {
    if (profile) {
    navigate(`/profile/${profile.username}`);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000). toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const parseVideoContent = (content: string) => {
    try {
      const metadata = JSON.parse(content);
      if (metadata.title || metadata.chant || metadata.tags) {
        return metadata. title || "Untitled Video";
      }
      return content;
    } catch {
      return content;
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-background md:ml-64 lg:ml-72">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading studio... </p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwnStudio = currentUserId === profile. id;

  return (
    <div className="w-full min-h-screen bg-background md:ml-64 lg:ml-72">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-3 max-w-[1400px]">
          <Button variant="ghost" size="sm" onClick={() => navigate("/satans-sinagogue")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sinagogue
          </Button>
        </div>
      </div>

      <div className="border-b border-border bg-gradient-to-b from-card/50 to-background backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-[1400px]">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full blur-lg opacity-50 animate-pulse"></div>
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-primary/30 relative z-10">
                <AvatarImage src={profile.avatar_url} alt={profile.username} />
                <AvatarFallback className="bg-primary/10 text-primary text-4xl md:text-5xl font-bold">
                  {profile.username.charAt(0). toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {profile.full_name || profile. username}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground flex items-center gap-2 justify-center">
                <User className="h-4 w-4" />
                @{profile.username}
              </p>
            </div>
            
            {profile.bio && (
              <p className="text-sm md:text-base text-foreground/80 max-w-2xl px-4">
                {profile.bio}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-3xl mt-4">
              <Card className="bg-card/50 border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="p-4 text-center">
                  <VideoIcon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-primary">{profile.video_count}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Videos</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="p-4 text-center">
                  <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-blue-500">{formatNumber(profile.total_views)}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Views</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="p-4 text-center">
                  <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-red-500">{formatNumber(profile.total_likes)}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Likes</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-primary/20 hover:border-primary/40 transition-all">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-green-500">{formatNumber(profile. disciples_count)}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Disciples</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              {! isOwnStudio && (
                <Button onClick={handleFollowToggle} disabled={followLoading} className={isFollowing ? "bg-primary/20 hover:bg-primary/30" : ""} size="lg">
                  {followLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isFollowing ? <UserCheck className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
              
              <Button onClick={handleViewProfile} variant="outline" size="lg">
                <User className="h-4 w-4 mr-2" />
                View Full Profile
              </Button>

              <Button variant="outline" size="lg">
                <Share2 className="h-4 w-4 mr-2" />
                Share Studio
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Calendar className="h-3 w-3" />
              <span>Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-[1400px]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              Videos by {profile.username}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile.video_count} videos • {formatNumber(profile. total_views)} total views
            </p>
          </div>
          
          <div className="flex gap-2">
            {isOwnStudio && (
              <VideoUpload onUploadComplete={loadStudioData} />
            )}
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded transition-all ${viewMode === "grid" ?  "bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted border border-border"}`} title="Grid view">
              <Grid3x3 className="h-5 w-5" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted border border-border"}`} title="List view">
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        <Separator className="mb-6" />

        {videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-muted/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Play className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
              No videos yet
            </h3>
            <p className="text-muted-foreground mb-4">
              {isOwnStudio ? "Upload your first video to get started" : "This creator hasn't uploaded any videos yet"}
            </p>
            {isOwnStudio && <VideoUpload onUploadComplete={loadStudioData} />}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "grid grid-cols-1 gap-4"}>
            {videos.map((video) => (
              <div key={video.id} className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                <div onClick={() => handleVideoClick(video. id)} className="cursor-pointer">
                  <div className={`relative ${viewMode === "grid" ? "aspect-[9/16]" : "aspect-video"} bg-muted`}>
                    {video.thumbnail_url ?  (
                      <img src={video.thumbnail_url} alt={parseVideoContent(video.content)} className="w-full h-full object-cover" />
                    ) : (
                      <video src={video.media_url} className="w-full h-full object-cover" preload="metadata" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-primary rounded-full p-4">
                        <Play className="h-8 w-8 text-white" fill="white" />
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <Eye className="h-3 w-3 text-white" />
                      <span className="text-xs text-white font-medium">{formatNumber(video.views_count || 0)}</span>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-sm text-foreground line-clamp-2 font-medium mb-2">
                      {parseVideoContent(video.content)}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{formatNumber(video.likes_count || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{formatNumber(video. comments_count || 0)}</span>
                        </div>
                      </div>
                      <span>{new Date(video.created_at). toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {isOwnStudio && (
                  <div className="absolute top-2 left-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-full bg-black/80 backdrop-blur-sm hover:bg-black/90 transition-all">
                          <MoreVertical className="h-4 w-4 text-white" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-background/95 backdrop-blur-md">
                        <DropdownMenuItem onClick={() => handleEditVideo(video)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Video
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setVideoToDelete(video. id); setDeleteDialogOpen(true); }} className="text-red-500">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Video
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* EDIT VIDEO DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>Update your video details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={editMetadata.title}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
              />
            </div>

            <div>
              <Label htmlFor="chant">Chant/Description</Label>
              <Textarea
                id="chant"
                value={editMetadata.chant}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, chant: e. target.value }))}
                placeholder="Enter a chant or description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e. target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Add a tag and press Enter"
                />
                <Button type="button" onClick={addTag} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editMetadata.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveVideo} disabled={saving || !editMetadata.title. trim()}>
              {saving ?  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Video? </DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete your video.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteVideo}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}