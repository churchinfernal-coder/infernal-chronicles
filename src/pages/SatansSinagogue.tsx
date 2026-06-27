import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoUpload } from "@/components/VideoUpload";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  RefreshCw, Heart, Brain, Share2, UserPlus, UserMinus, Swords, Skull, Cross, Bug,
  Volume2, VolumeX, Trash2, MoreVertical, TrendingUp, Bell, BellOff, Flame, Crown
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InfernalReaction } from "@/components/InfernalReaction";
import { useLanguage } from "@/contexts/LanguageContext";
import infernalWatermark from "@/assets/infernal-watermark.png";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoPost {
  id: string;
  content: string;
  media_url: string;
  post_section: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
    avatar_url:  string | null;
  };
}

interface PostComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { username: string | null; avatar_url: string | null };
}

interface TrendingUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  video_count: number;
  total_likes: number;
}

interface Notification {
  id: string;
  creator_id: string;
  video_id:  string;
  read: boolean;
  created_at: string;
  creator?:  {
    username: string;
    avatar_url: string | null;
  };
}

interface ProfileData {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now. getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

const VIDEOS_PER_PAGE = 5;

export default function SatansSinagogue() {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [discipleCounts, setDiscipleCounts] = useState<Record<string, number>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [isFollowing, setIsFollowing] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [reactionPickerOpen, setReactionPickerOpen] = useState<Record<string, boolean>>({});
  const [showInfernalReaction, setShowInfernalReaction] = useState(false);
  const [videoMuted, setVideoMuted] = useState<Record<number, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [trendingUsers, setTrendingUsers] = useState<TrendingUser[]>([]);
  const [trendingOpen, setTrendingOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const observerRefs = useRef<(IntersectionObserver | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const initializePage = async () => {
      await checkAuth();
      await fetchVideos(0);
      await fetchTrending();
    };
    initializePage();

    const unsubscribe = subscribeToNotifications();
    return () => {
      unsubscribe?. ();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase. auth.getUser();
      if (error || !user) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(user. id);
      await fetchNotifications(user.id);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("video_notifications")
        .select("id, creator_id, video_id, read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending:  false })
        .limit(20);

      if (error) {
        console.error("Notifications fetch error:", error);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const creatorIds = (data || []).map((n: any) => n.creator_id).filter(Boolean);

      if (creatorIds.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const { data: profilesData, error: profilesError } = await (supabase as any)
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", creatorIds);

      if (profilesError) {
        console.error("Profiles fetch error:", profilesError);
        throw profilesError;
      }

      const profiles = (profilesData || []) as ProfileData[];

      const notificationsWithProfiles:  Notification[] = (data || []).map((n: any) => {
        const creator = profiles.find((p) => p.user_id === n.creator_id);
        return {
          id: n.id,
          creator_id: n.creator_id,
          video_id: n.video_id,
          read: Boolean(n.read),
          created_at: n.created_at,
          creator: creator
            ? {
                username: creator. username || "Unknown",
                avatar_url:  creator.avatar_url || null
              }
            : undefined
        };
      });

      setNotifications(notificationsWithProfiles);
      setUnreadCount(notificationsWithProfiles. filter((n) => !n.read).length);
    } catch (error:  any) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const subscribeToNotifications = () => {
    if (! currentUserId) return () => {};

    try {
      const channel = supabase
        .channel('video_notifications_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'video_notifications',
            filter: `user_id=eq.${currentUserId}`
          },
          (payload) => {
            console.log('🔔 New notification:', payload);
            if (currentUserId) {
              fetchNotifications(currentUserId);
              toast.success("New video from someone you follow!");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Subscription error:", error);
      return () => {};
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("video_notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Error updating notification:", error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => {
          if (n.id === notificationId) {
            return { ...n, read: true };
          }
          return n;
        })
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error:  any) {
      console.error("Error marking notification as read:", error);
    }
  };

  const fetchTrending = async () => {
    try {
      await (supabase as any).rpc('update_trending_scores');

      const { data, error } = await (supabase as any)
        .from("trending_scores")
        .select("user_id, score, video_count, total_likes")
        .order("score", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Trending fetch error:", error);
        throw error;
      }

      const userIds = (data || []).map((t: any) => t.user_id).filter(Boolean);

      if (userIds.length === 0) {
        setTrendingUsers([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await (supabase as any)
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Profiles fetch error:", profilesError);
        throw profilesError;
      }

      const profiles = (profilesData || []) as ProfileData[];

      const trendingWithProfiles: TrendingUser[] = (data || []).map((t: any) => {
        const profile = profiles.find((p) => p.user_id === t.user_id);
        return {
          user_id:  t.user_id,
          score: t.score || 0,
          video_count: t.video_count || 0,
          total_likes:  t.total_likes || 0,
          username: profile?.username || "Unknown",
          avatar_url: profile?. avatar_url || null
        };
      });

      setTrendingUsers(trendingWithProfiles);
    } catch (error: any) {
      console.error("Error fetching trending:", error);
      setTrendingUsers([]);
    }
  };

  const fetchVideos = async (pageNum: number) => {
    const isInitial = pageNum === 0;
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const from = pageNum * VIDEOS_PER_PAGE;
      const to = from + VIDEOS_PER_PAGE - 1;

      const { data, error } = await (supabase as any)
        .from("posts")
        .select("id, content, media_url, post_section, created_at, user_id")
        .eq("media_type", "video")
        .eq("post_section", "sinagogue")
        .order("created_at", { ascending:  false })
        .range(from, to);

      if (error) {
        console.error("Videos fetch error:", error);
        throw error;
      }

      if (! data || data.length < VIDEOS_PER_PAGE) {
        setHasMore(false);
      }

      const userIds = (data || [])
        .map((p: any) => p.user_id)
        .filter(Boolean);

      if (userIds. length === 0) {
        if (isInitial) {
          setVideos([]);
        }
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await (supabase as any)
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Profiles fetch error:", profilesError);
        throw profilesError;
      }

      const videosWithProfiles:  VideoPost[] = (data || []).map((post: any) => ({
        id: post.id,
        content: post.content,
        media_url: post. media_url,
        post_section: post.post_section,
        created_at: post. created_at,
        user_id: post.user_id,
        profiles: profilesData?. find((p: any) => p.user_id === post.user_id)
      }));

      const postIds = (data || []).map((p: any) => p.id);

      // Fetch disciple counts
      const { data:  friendshipData, error: friendshipError } = await (supabase as any)
        .from("friendships")
        .select("friend_id")
        .in("friend_id", userIds)
        .eq("status", "accepted");

      if (friendshipError) {
        console.error("Friendships fetch error:", friendshipError);
        throw friendshipError;
      }

      const counts: Record<string, number> = {};
      userIds.forEach((userId: string) => {
        counts[userId] = friendshipData?.filter((f: any) => f.friend_id === userId).length || 0;
      });
      setDiscipleCounts(prev => ({ ...prev, ...counts }));

      // Fetch like counts
      const { data: reactionsData, error: reactionsError } = await (supabase as any)
        .from("post_reactions")
        .select("post_id")
        .in("post_id", postIds)
        .eq("reaction_type", "like");

      if (reactionsError) {
        console.error("Reactions fetch error:", reactionsError);
        throw reactionsError;
      }

      const likes: Record<string, number> = {};
      postIds.forEach((postId: string) => {
        likes[postId] = reactionsData?.filter((r: any) => r.post_id === postId).length || 0;
      });
      setLikeCounts(prev => ({ ...prev, ...likes }));

      // Fetch comment counts
      const { data: commentsData, error: commentsError } = await (supabase as any)
        .from("post_comments")
        .select("post_id")
        .in("post_id", postIds);

      if (commentsError) {
        console.error("Comments fetch error:", commentsError);
        throw commentsError;
      }

      const commentsCount: Record<string, number> = {};
      postIds.forEach((postId: string) => {
        commentsCount[postId] = commentsData?.filter((c: any) => c.post_id === postId).length || 0;
      });
      setCommentCounts(prev => ({ ...prev, ...commentsCount }));

      // Fetch follow status for current user
      if (currentUserId) {
        const { data: followData, error: followError } = await (supabase as any)
          .from("friendships")
          .select("friend_id")
          .eq("user_id", currentUserId)
          .in("friend_id", userIds)
          .eq("status", "accepted");

        if (followError) {
          console.error("Follow status fetch error:", followError);
          throw followError;
        }

        const following:  Record<string, boolean> = {};
        userIds.forEach((userId: string) => {
          following[userId] = followData?.some((f: any) => f.friend_id === userId) || false;
        });
        setIsFollowing(prev => ({ ...prev, ...following }));
      }

      if (isInitial) {
        setVideos(videosWithProfiles);
        const mutedState:  Record<number, boolean> = {};
        videosWithProfiles.forEach((_, index) => {
          mutedState[index] = false;
        });
        setVideoMuted(mutedState);
      } else {
        setVideos(prev => [...prev, ...videosWithProfiles]);
      }
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      toast.error(error.message || "Failed to load videos");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage);
    }
  }, [page, loadingMore, hasMore]);

  // Scroll to video by URL param
  useEffect(() => {
    if (videos.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');

    if (videoId && containerRef.current) {
      const videoIndex = videos.findIndex(v => v.id === videoId);

      if (videoIndex !== -1) {
        setTimeout(() => {
          const videoElement = containerRef.current?. children[videoIndex] as HTMLElement;
          if (videoElement) {
            videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const video = videoRefs.current[videoIndex];
            if (video) {
              video.play().catch(() => {});
            }
          }
        }, 100);
      } else {
        toast.error("Video not found");
      }
    }
  }, [videos]);

  // Infinite scroll observer for last video
  useEffect(() => {
    if (! containerRef.current || videos.length === 0) return;

    const lastVideoIndex = videos.length - 1;
    const lastVideoElement = containerRef.current. children[lastVideoIndex] as HTMLElement;

    if (! lastVideoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(lastVideoElement);

    return () => observer.disconnect();
  }, [videos, hasMore, loadingMore, loadMore]);

  // Auto-play/pause observers for videos
  useEffect(() => {
    observerRefs.current. forEach(obs => obs?. disconnect());
    observerRefs.current = [];

    videos.forEach((_, index) => {
      const videoElement = videoRefs.current[index];
      if (! videoElement) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              videoElement.play().catch(() => {});
            } else {
              videoElement.pause();
            }
          });
        },
        { threshold: 0.7 }
      );

      observer.observe(videoElement);
      observerRefs.current[index] = observer;
    });

    return () => {
      observerRefs.current.forEach(obs => obs?.disconnect());
    };
  }, [videos]);

  const toggleMute = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      video.muted = !video.muted;
      setVideoMuted(prev => ({ ...prev, [index]: video. muted }));

      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  const deleteVideo = async () => {
    if (! videoToDelete) return;

    try {
      const { error } = await (supabase as any)
        .from("posts")
        .delete()
        .eq("id", videoToDelete);

      if (error) throw error;

      setVideos(prev => prev.filter(v => v. id !== videoToDelete));
      toast.success("Video deleted successfully");
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete video");
    }
  };

  const fetchPostComments = async (postId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("post_comments")
        .select("id, content, created_at, user_id")
        .eq("post_id", postId)
        .order("created_at", { ascending:  true });

      if (error) {
        console.error("Comments fetch error:", error);
        throw error;
      }

      setComments((data as any) || []);
    } catch (e:  any) {
      console.error("Error fetching comments:", e);
      toast.error(e.message || "Failed to load comments");
    }
  };

  const openComments = async (postId: string) => {
    setActivePostId(postId);
    setCommentsOpen(true);
    await fetchPostComments(postId);
  };

  const addComment = async () => {
    try {
      if (!newComment.trim() || !activePostId) return;

      const { data:  { user }, error:  authError } = await supabase. auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("post_comments")
        .insert({
          post_id: activePostId,
          user_id: user.id,
          content: newComment. trim()
        })
        .select("id, content, created_at, user_id")
        .single();

      if (error) throw error;

      if (data) {
        setComments(prev => [...prev, data as any]);
      }
      setNewComment("");
      setCommentCounts(prev => ({
        ...prev,
        [activePostId]: (prev[activePostId] || 0) + 1,
      }));
    } catch (e: any) {
      console.error("Comment error:", e);
      toast.error(e.message || "Failed to post comment");
    }
  };

  const handleLike = async (videoId: string) => {
    try {
      const { data:  { user }, error: authError } = await supabase. auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const { error } = await (supabase as any).from("post_reactions").insert({
        post_id: videoId,
        user_id: user.id,
        reaction_type: "like",
      });

      if (error) throw error;

      setLikeCounts(prev => ({
        ...prev,
        [videoId]: (prev[videoId] || 0) + 1
      }));

      if ('vibrate' in navigator) {
        navigator.vibrate([10, 5, 10]);
      }

      toast.success("Liked");
    } catch (error: any) {
      console.error("Like error:", error);
      if (error.message. includes("duplicate")) {
        toast.error("Already liked");
      } else {
        toast.error(error.message || "Failed to like");
      }
    }
  };

  const handleReaction = async (videoId: string, reactionType: string) => {
    try {
      const { data: { user }, error: authError } = await supabase. auth.getUser();
      if (authError || !user) throw new Error("Not authenticated");

      const { error } = await (supabase as any).from("post_reactions").insert({
        post_id: videoId,
        user_id: user.id,
        reaction_type: reactionType,
      });

      if (error) throw error;

      setReactionPickerOpen(prev => ({ ...prev, [videoId]: false }));

      if (reactionType === "666") {
        setShowInfernalReaction(true);
      }

      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }

      toast. success(`Reacted with ${reactionType}`);
    } catch (error: any) {
      console.error("Reaction error:", error);
      if (error.message.includes("duplicate")) {
        toast.error("Already reacted");
      } else {
        toast.error(error. message || "Failed to react");
      }
    }
  };

  const handleFollowToggle = async (userId: string) => {
    try {
      if (! currentUserId) throw new Error("Not authenticated");

      const isCurrentlyFollowing = isFollowing[userId];

      if (isCurrentlyFollowing) {
        const { error } = await (supabase as any)
          .from("friendships")
          .delete()
          .eq("user_id", currentUserId)
          .eq("friend_id", userId);

        if (error) throw error;

        setIsFollowing(prev => ({ ...prev, [userId]: false }));
        setDiscipleCounts(prev => ({
          ...prev,
          [userId]: Math.max(0, (prev[userId] || 0) - 1)
        }));
        toast.success("Unfollowed");
      } else {
        const { error } = await (supabase as any)
          .from("friendships")
          .insert({
            user_id:  currentUserId,
            friend_id: userId,
            status:  "accepted"
          });

        if (error) throw error;

        setIsFollowing(prev => ({ ...prev, [userId]: true }));
        setDiscipleCounts(prev => ({
          ...prev,
          [userId]: (prev[userId] || 0) + 1
        }));

        if ('vibrate' in navigator) {
          navigator.vibrate([15, 10, 15]);
        }

        toast.success("Following!  You'll be notified of new videos");
      }
    } catch (error: any) {
      console.error("Follow error:", error);
      toast.error(error.message || "Failed to update follow status");
    }
  };

  const openShare = (postId: string) => {
    const url = `${window.location.origin}/satans-sinagogue? v=${postId}`;
    setShareUrl(url);
    setShareOpen(true);
  };

  const copyShareUrl = async () => {
    try {
      if (!shareUrl) return;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const retryVideo = (index: number) => {
    const video = videoRefs.current[index];
    if (video) {
      video.load();
      video.play().catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl text-primary animate-pulse">{t("reels.loadingVideos")}</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-background overflow-y-scroll snap-y snap-mandatory" ref={containerRef}>
      <button
        onClick={() => setNotificationsOpen(true)}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-background/20 backdrop-blur-md border border-white/10 hover:bg-background/30 transition-all shadow-lg"
      >
        <Bell className="h-5 w-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={() => {
          setTrendingOpen(true);
          fetchTrending();
        }}
        className="fixed top-16 right-4 z-50 p-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 backdrop-blur-md border border-white/10 hover:scale-110 transition-all shadow-lg"
      >
        <Flame className="h-5 w-5 text-white" />
      </button>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-screen px-4">
          <p className="text-muted-foreground text-xl mb-6 text-center">{t("reels.noVideos")}</p>
          <VideoUpload onUploadComplete={() => fetchVideos(0)} />
        </div>
      ) : (
        <>
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="relative w-full h-screen snap-start snap-always flex items-center justify-center"
            >
              <div className="relative w-full max-w-lg h-full group">
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                  }}
                  src={video. media_url}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loop
                  muted={videoMuted[index] === true}
                  playsInline
                  autoPlay
                  onError={() => {
                    const videoEl = videoRefs.current[index];
                    if (videoEl) {
                      videoEl. style.display = "none";
                    }
                  }}
                />

                <div className="absolute top-4 right-4 z-20 pointer-events-none">
                  <img
                    src={infernalWatermark}
                    alt="Infernal watermark"
                    className="h-12 sm:h-16 md:h-20 w-auto opacity-90"
                    style={{
                      filter: 'brightness(1.3) contrast(1.4) drop-shadow(0 4px 12px rgba(0,0,0,0.9))'
                    }}
                  />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute(index);
                  }}
                  className="absolute top-4 left-4 z-20 p-3 rounded-full bg-background/20 backdrop-blur-md border border-white/10 hover:bg-background/30 transition-all shadow-lg"
                >
                  {videoMuted[index] === true ? (
                    <VolumeX className="h-5 w-5 text-white drop-shadow-lg" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-white drop-shadow-lg" />
                  )}
                </button>

                {video.user_id === currentUserId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="absolute top-16 left-4 z-20 p-3 rounded-full bg-background/20 backdrop-blur-md border border-white/10 hover:bg-background/30 transition-all shadow-lg">
                        <MoreVertical className="h-5 w-5 text-white drop-shadow-lg" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-background/95 backdrop-blur-md">
                      <DropdownMenuItem
                        onClick={() => {
                          setVideoToDelete(video.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Video
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <div className="absolute inset-0 hidden [&:has(~video[style*='display: _none'])]:flex flex-col items-center justify-center bg-muted/20 backdrop-blur-sm px-4">
                  <p className="text-lg text-muted-foreground mb-4 text-center">{t("reels.ritualInterrupted")}</p>
                  <Button
                    onClick={() => retryVideo(index)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("reels.retry")}
                  </Button>
                </div>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (video.profiles?.username) {
                      navigate(`/studio/${video.profiles.username}`);
                    }
                  }}
                  className="absolute bottom-32 left-4 flex items-center gap-3 z-10 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-12 w-12 border-2 border-white/20">
                    <AvatarImage src={video.profiles?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary text-lg">
                      {video.profiles?.username ?  video.profiles.username. charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-base font-semibold text-white drop-shadow-lg">
                      {video.profiles?.username || t("reels.anonymous")}
                    </div>
                    <div className="text-xs text-white/80 drop-shadow-lg">
                      {discipleCounts[video.user_id] || 0} Disciples
                    </div>
                  </div>

                  {video.user_id !== currentUserId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowToggle(video.user_id);
                      }}
                      className={`ml-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg ${
                        isFollowing[video.user_id]
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'bg-gradient-to-r from-crimson/80 to-red-500/80 border-white/20 text-white hover:scale-105'
                      }`}
                    >
                      {isFollowing[video.user_id] ? (
                        <>
                          <UserMinus className="h-4 w-4 inline mr-1" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 inline mr-1" />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="absolute bottom-32 right-4 flex flex-col gap-5 z-10">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleLike(video.id)}
                      className="p-3 rounded-full bg-background/20 backdrop-blur-md border border-white/10 hover:bg-background/30 hover:scale-110 transition-all duration-200 active:scale-95 shadow-lg"
                    >
                      <Heart className="h-6 w-6 text-red-500 fill-red-500 drop-shadow-lg" />
                    </button>
                    <span className="text-xs text-white font-semibold drop-shadow-lg">
                      {likeCounts[video.id] || 0}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <Popover open={reactionPickerOpen[video.id]} onOpenChange={(open) => setReactionPickerOpen(prev => ({ ...prev, [video. id]: open }))}>
                      <PopoverTrigger asChild>
                        <button
                          className="p-3 rounded-full bg-background/20 backdrop-blur-md border border-white/10 hover:bg-background/30 hover:scale-110 transition-all duration-200 active:scale-95 shadow-lg"
                        >
                          <Brain className="h-6 w-6 text-white drop-shadow-lg" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="left" className="w-auto p-2 bg-background/95 backdrop-blur-md border-primary/30">
                        <div className="grid grid-cols-4 gap-2">
                          <button onClick={() => handleReaction(video.id, "knife")} className="p-2 hover:bg-primary/20 rounded-lg transition-all hover:scale-110 text-2xl" title="Knife">🔪</button>
                          <button onClick={() => handleReaction(video.id, "sword")} className="p-2 hover:bg-primary/20 rounded-lg transition-all hover: scale-110" title="Sword"><Swords className="h-6 w-6 text-foreground" /></button>
                          <button onClick={() => handleReaction(video.id, "666")} className="p-2 hover:bg-primary/20 rounded-lg transition-all hover: scale-110 text-2xl font-black text-primary" style={{ fontFamily: "'Cinzel', serif" }} title="666">666</button>
                          <button onClick={() => handleReaction(video.id, "skull")} className="p-2 hover:bg-primary/20 rounded-lg transition-all hover: scale-110" title="Skull"><Skull className="h-6 w-6 text-foreground" /></button>
                          <button onClick={() => handleReaction(video.id, "crossbones")} className="p-2 hover:bg-primary/20 rounded-lg transition-all hover:scale-110 text-2xl" title="Skull & Crossbones">☠️</button>
                          <button onClick={() => handleReaction(video.id, "casket")} className="p-2 hover:bg-primary/20 rounded-lg transition-all hover:scale-110 text-2xl" title="Casket">⚰️</button>
                          <button onClick={() => handleReaction(video.id, "spider")} className="p-2 hover:bg-primary/20 rounded-lg transition-all hover: scale-110" title="Spider"><Bug className="h-6 w-6 text-foreground" /></button>
                          <button onClick={() => handleReaction(video. id, "cross")} className="p-2 hover:bg-primary/20 rounded-lg transition-all hover: scale-110" title="Cross"><Cross className="h-6 w-6 text-foreground" /></button>
                        </div>
                        <div className="mt-2 pt-2 border-t border-border">
                          <button
                            onClick={() => {
                              openComments(video.id);
                              setReactionPickerOpen(prev => ({ ...prev, [video. id]: false }));
                            }}
                            className="w-full p-2 hover:bg-primary/20 rounded-lg transition-all text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
                          >
                            <Brain className="h-4 w-4" />
                            View Thoughts ({commentCounts[video.id] || 0})
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <span className="text-xs text-white font-semibold drop-shadow-lg">
                      {commentCounts[video.id] || 0}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => openShare(video.id)}
                      className="p-3 rounded-full bg-background/20 backdrop-blur-md border border-white/10 hover:bg-background/30 hover:scale-110 transition-all duration-200 active:scale-95 shadow-lg"
                    >
                      <Share2 className="h-6 w-6 text-white drop-shadow-lg" />
                    </button>
                  </div>
                </div>

                {video.content && (
                  <div className="absolute bottom-4 left-4 right-20 z-10">
                    {(() => {
                      try {
                        const metadata = JSON.parse(video.content);

                        if (metadata.title || metadata.chant || metadata.tags) {
                          return (
                            <div className="space-y-1 bg-black/30 backdrop-blur-sm rounded-lg p-3">
                              {metadata.title && metadata.title !== "" && (
                                <p className="text-white text-base font-semibold drop-shadow-lg">
                                  {metadata.title}
                                </p>
                              )}
                              {metadata.chant && metadata.chant !== "" && (
                                <p className="text-white/90 text-sm drop-shadow-lg italic">
                                  "{metadata.chant}"
                                </p>
                              )}
                              {metadata.tags && metadata.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {metadata.tags.map((tag:  string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-crimson/80 text-white px-2 py-0.5 rounded-full"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <p className="text-white text-sm drop-shadow-lg line-clamp-3 bg-black/30 backdrop-blur-sm rounded-lg p-3">
                            {video.content}
                          </p>
                        );
                      } catch {
                        return (
                          <p className="text-white text-sm drop-shadow-lg line-clamp-3 bg-black/30 backdrop-blur-sm rounded-lg p-3">
                            {video.content}
                          </p>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loadingMore && (
            <div className="flex items-center justify-center h-32">
              <div className="text-primary animate-pulse">{t("reels.loadingMore")}</div>
            </div>
          )}

          {!hasMore && videos.length > 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {t("reels.noMoreVideos")}
            </div>
          )}
        </>
      )}

      {videos.length > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <VideoUpload onUploadComplete={() => fetchVideos(0)} />
        </div>
      )}

      <Drawer open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications ({unreadCount} unread)
            </DrawerTitle>
          </DrawerHeader>

          <ScrollArea className="flex-1 px-4 py-2">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground mt-2">Follow creators to get notified of new videos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications. map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      markNotificationAsRead(notification.id);
                      navigate(`/satans-sinagogue?v=${notification.video_id}`);
                      setNotificationsOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      notification.read
                        ? 'bg-card hover:bg-card/80'
                        : 'bg-primary/10 hover:bg-primary/20 border border-primary/30'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notification.creator?. avatar_url || ""} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {notification.creator?. username?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        <span className="text-primary">{notification.creator?.username}</span> uploaded a new video
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getRelativeTimeString(new Date(notification.created_at))}
                      </p>
                    </div>
                    {! notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      <Drawer open={trendingOpen} onOpenChange={setTrendingOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Who's Trending
            </DrawerTitle>
          </DrawerHeader>

          <ScrollArea className="flex-1 px-4 py-2">
            <div className="space-y-3">
              {trendingUsers.map((user, index) => (
                <div
                  key={user.user_id}
                  onClick={() => {
                    navigate(`/studio/${user.username}`);
                    setTrendingOpen(false);
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-card/80 cursor-pointer transition-all border border-border"
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/20 text-primary text-lg">
                        {user.username. charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-1">
                        {index === 0 && <Crown className="h-3 w-3 text-white" />}
                        {index === 1 && <Flame className="h-3 w-3 text-white" />}
                        {index === 2 && <TrendingUp className="h-3 w-3 text-white" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate flex items-center gap-2">
                      #{index + 1} {user.username}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span>{user.video_count} videos</span>
                      <span>•</span>
                      <span>{user.total_likes} likes</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
                    {user.score} 🔥
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Video? </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your video. 
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteVideo}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Reel</DialogTitle>
            <DialogDescription>Choose a platform or copy the link. </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline">
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl || '')}`} target="_blank" rel="noopener noreferrer">X (Twitter)</a>
            </Button>
            <Button asChild variant="outline">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl || '')}`} target="_blank" rel="noopener noreferrer">Facebook</a>
            </Button>
            <Button asChild variant="outline">
              <a href={`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl || '')}`} target="_blank" rel="noopener noreferrer">Reddit</a>
            </Button>
            <Button asChild variant="outline">
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl || '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </Button>
            <Button asChild variant="outline">
              <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl || '')}`} target="_blank" rel="noopener noreferrer">Telegram</a>
            </Button>
          </div>
          <DialogFooter className="flex flex-wrap gap-2 justify-between">
            <Button variant="secondary" onClick={async () => {
              try {
                if (navigator.share && shareUrl) {
                  await navigator.share({ title: 'Satans Sinagogue', url: shareUrl });
                } else {
                  await copyShareUrl();
                }
              } catch (error) {
                console.error("Share error:", error);
              }
            }}>Native Share</Button>
            <Button onClick={copyShareUrl}>Copy link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Thoughts ({commentCounts[activePostId || ""] || 0})</DrawerTitle>
          </DrawerHeader>

          <ScrollArea className="flex-1 px-4 py-2">
            {comments.length === 0 ?  (
              <p className="text-center text-muted-foreground py-8">No thoughts yet. Be the first! </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 pb-3 border-b border-border/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {comment.profiles?.username ?  comment.profiles.username.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{comment.profiles?.username || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DrawerFooter className="border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 resize-none"
                rows={2}
              />
              <Button
                onClick={addComment}
                disabled={!newComment.trim()}
                className="self-end"
              >
                Post
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {showInfernalReaction && (
        <InfernalReaction onComplete={() => setShowInfernalReaction(false)} />
      )}
    </div>
  );
}