import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Zap, Skull, MessageCircle, MoreVertical, Edit, Trash2, EyeOff, X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PostThoughts } from "@/components/PostThoughts";
import { InfernalReaction } from "@/components/InfernalReaction";
import { FloatingSixSixSix } from "@/components/FloatingSixSixSix";
import { LazyImage } from "@/components/LazyImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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

interface MediaFile {
  url: string;
  type: 'image' | 'video';
  duration?:  number | null;
}

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content:  string;
    created_at:  string;
    post_type?:  string;
    media_url?: string | null;
    media_type?:  string | null;
    media_files?: string | null;
    profiles?: {
      username:  string | null;
      avatar_url:  string | null;
    };
  };
  currentUserId?:  string;
  onPostUpdated?: () => void;
  onPostDeleted?: () => void;
  reactionsCount?: number;
  commentsCount?: number;
}

const reactionEmojis = [
  { emoji: "🩸", type: "blood", label: "Blood" },
  { emoji: "🕷️", type: "spider", label: "Spider" },
  { emoji: "🔥", type: "fire", label: "Fire" },
  { emoji: "😈", type: "demon", label: "Demon" },
  { emoji: "🪦", type: "grave", label: "Grave" },
  { emoji: "666", type: "666", label:  "666" },
];

const postTypeStyles = {
  whisper: {
    icon: MessageCircle,
    bgClass: "bg-black/50 backdrop-blur-xl",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-400",
    label: "Whisper"
  },
  scream: {
    icon:  Zap,
    bgClass: "bg-black/50 backdrop-blur-xl",
    borderClass: "border-red-500/30",
    textClass: "text-red-400",
    label: "Scream"
  },
  incantation: {
    icon:  Skull,
    bgClass: "bg-black/50 backdrop-blur-xl",
    borderClass: "border-purple-500/30",
    textClass: "text-purple-400",
    label: "Incantation"
  },
};

const parsePostContent = (content: string) => {
  try {
    const parsed = JSON. parse(content);
    return {
      title: parsed.title || "",
      chant: parsed.text || parsed.chant || content,
      tags: parsed.tags || [],
      images: parsed.images || [],
      anonymous: parsed.anonymous || false
    };
  } catch {
    return {
      title: "",
      chant: content,
      tags: [],
      images: [],
      anonymous: false
    };
  }
};

const parseMediaFiles = (mediaFiles: string | null | undefined | any): MediaFile[] => {
  if (!mediaFiles) return [];
  
  // If it's already an array (Supabase auto-parsed it)
  if (Array.isArray(mediaFiles)) {
    return mediaFiles;
  }
  
  // If it's an object (sometimes Supabase returns JSONB as object)
  if (typeof mediaFiles === 'object') {
    return Array.isArray(mediaFiles) ? mediaFiles : [];
  }
  
  // If it's a string, parse it
  try {
    const parsed = JSON. parse(mediaFiles);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function PostCard({ post, currentUserId, onPostUpdated, onPostDeleted }: PostCardProps) {
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [pulsingReaction, setPulsingReaction] = useState<string | null>(null);
  const [pitchforkCount, setPitchforkCount] = useState(0);
  const [hasPitchforked, setHasPitchforked] = useState(false);
  const [isPitchforkPulsing, setIsPitchforkPulsing] = useState(false);
  const [showInfernalReaction, setShowInfernalReaction] = useState(false);
  const [triggerSixSixSix, setTriggerSixSixSix] = useState(false);
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const postType = (post.post_type || "whisper") as keyof typeof postTypeStyles;
  const typeStyle = postTypeStyles[postType];
  const TypeIcon = typeStyle.icon;

  const { title, chant, tags, images:  legacyImages, anonymous } = parsePostContent(post.content);
  
  const mediaFiles = parseMediaFiles(post.media_files);
  
  const allMediaFiles:  MediaFile[] = [
    ...mediaFiles,
    ...legacyImages. map((url:  string) => ({ url, type: 'image' as const }))
  ];
  
  if (allMediaFiles.length === 0 && post.media_url) {
    allMediaFiles.push({
      url: post.media_url,
      type: post.media_type === 'video' ? 'video' : 'image'
    });
  }

  const imageFiles = allMediaFiles.filter(m => m.type === 'image');
  const videoFiles = allMediaFiles.filter(m => m.type === 'video');
  
  const isOwner = currentUserId && post.user_id === currentUserId;

  useEffect(() => {
    fetchReactions();
    fetchPitchforks();
    const unsubscribe = subscribeToReactions();
    return () => unsubscribe();
  }, [post.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (! showImageModal) return;
      
      if (e.key === "Escape") {
        setShowImageModal(false);
      } else if (e.key === "ArrowLeft") {
        handleModalPrevImage();
      } else if (e.key === "ArrowRight") {
        handleModalNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showImageModal, modalImageIndex, imageFiles. length]);

  const subscribeToReactions = () => {
    const channel = supabase
      .channel(`post-reactions-${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_reactions",
          filter: `post_id=eq.${post.id}`,
        },
        (payload:  any) => {
          fetchReactions();
          
          if (payload.eventType === 'INSERT' && payload.new?. reaction_type === '666') {
            setShowInfernalReaction(true);
            setTriggerSixSixSix(true);
            setTimeout(() => setTriggerSixSixSix(false), 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase. removeChannel(channel);
    };
  };

  const fetchReactions = async () => {
    const { data:  { user } } = await supabase.auth.getUser();
    
    const { data:  allReactions } = await supabase
      .from("post_reactions")
      .select("reaction_type, user_id")
      .eq("post_id", post.id);

    if (allReactions) {
      const counts:  Record<string, number> = {};
      (allReactions as Array<{ reaction_type: string; user_id: string }>).forEach((r) => {
        counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
      });
      setReactions(counts);

      if (user) {
        const userReact = (allReactions as Array<{ reaction_type: string; user_id: string }>).find((r) => r.user_id === user.id);
        setUserReaction(userReact?. reaction_type || null);
      }
    }
  };

  const fetchPitchforks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: pitchforks } = await supabase
      .from("post_reactions")
      .select("user_id")
      .eq("post_id", post.id)
      .eq("reaction_type", "pitchfork");

    if (pitchforks) {
      setPitchforkCount(pitchforks.length);
      
      if (user) {
        const userPitchfork = (pitchforks as Array<{ user_id: string }>).find((r) => r.user_id === user.id);
        setHasPitchforked(!! userPitchfork);
      }
    }
  };

  const handlePitchfork = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      setIsPitchforkPulsing(true);
      setTimeout(() => setIsPitchforkPulsing(false), 600);

      if (hasPitchforked) {
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .eq("reaction_type", "pitchfork");

        if (error) throw error;
        setHasPitchforked(false);
        setPitchforkCount(prev => prev - 1);
      } else {
        const { error } = await supabase. from("post_reactions").insert({
          post_id: post. id,
          user_id:  user.id,
          reaction_type: "pitchfork",
        } as any);

        if (error) throw error;
        setHasPitchforked(true);
        setPitchforkCount(prev => prev + 1);
      }
    } catch (error:  any) {
      toast.error(error.message);
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    const hours = Math.floor(seconds / 3600);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const handleReaction = async (reactionType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (reactionType === "666") {
        setShowInfernalReaction(true);
      } else {
        setPulsingReaction(reactionType);
        setTimeout(() => setPulsingReaction(null), 600);
      }

      if (userReaction === reactionType) {
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) throw error;
        setUserReaction(null);
      } else {
        if (userReaction) {
          await supabase
            .from("post_reactions")
            .delete()
            .eq("post_id", post.id)
            .eq("user_id", user.id);
        }

        const { error } = await supabase.from("post_reactions").insert({
          post_id: post.id,
          user_id: user.id,
          reaction_type: reactionType,
        } as any);

        if (error) throw error;
        setUserReaction(reactionType);
      }

      fetchReactions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditClick = () => {
    setEditContent(chant);
    setShowEditDialog(true);
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      let updatedContent = editContent;
      
      if (title || tags.length > 0 || legacyImages.length > 0 || anonymous) {
        updatedContent = JSON.stringify({
          title,
          text: editContent,
          tags,
          images: legacyImages,
          anonymous
        });
      }

      const { error } = await (supabase as any)
        .from("posts")
        .update({ content: updatedContent })
        .eq("id", post.id)
        .eq("user_id", currentUserId! );

      if (error) throw error;

      toast.success("Post updated successfully");
      setShowEditDialog(false);
      onPostUpdated?.();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update post");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", post.id);

      await supabase
        .from("comments")
        .delete()
        .eq("post_id", post.id);

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("user_id", currentUserId!);

      if (error) throw error;

      toast.success("Post deleted successfully");
      setShowDeleteDialog(false);
      onPostDeleted?.();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const openImageModal = (startIndex: number) => {
    setModalImageIndex(startIndex);
    setShowImageModal(true);
  };

  const handleModalNextImage = () => {
    setModalImageIndex((prev) => (prev + 1) % imageFiles.length);
  };

  const handleModalPrevImage = () => {
    setModalImageIndex((prev) => (prev - 1 + imageFiles.length) % imageFiles.length);
  };

  return (
    <>
      <div className={`${typeStyle.bgClass} border ${typeStyle.borderClass} rounded-lg p-4 hover:border-primary/50 transition-all shadow-lg relative overflow-hidden`}>
        <div className="relative flex gap-3">
          {anonymous ?  (
            <Avatar>
              <AvatarFallback className="bg-muted text-muted-foreground">
                <EyeOff className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar>
              <AvatarImage src={post.profiles?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {post.profiles?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-foreground truncate">
                {anonymous ? "Anonymous" : (post.profiles?.username || "Anonymous")}
              </span>
              <span className="text-sm text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {timeAgo(post.created_at)}
              </span>
              <span className="text-sm text-muted-foreground">·</span>
              <div className={`flex items-center gap-1 text-sm ${typeStyle.textClass}`}>
                <TypeIcon className="h-3 w-3" />
                {typeStyle.label}
              </div>

              {isOwner && ! anonymous && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEditClick}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {title && <h3 className="font-semibold mb-2 text-lg">{title}</h3>}
            <p className="text-foreground mb-2 leading-relaxed whitespace-pre-wrap break-words">{chant}</p>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag:  string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {imageFiles.length > 0 && (
              <div className="mb-4 space-y-3">
                <div 
                  className="relative overflow-hidden rounded-xl border border-primary/20 group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
                  onClick={() => openImageModal(currentImageIndex)}
                >
                  <LazyImage
                    src={imageFiles[currentImageIndex].url}
                    alt={`Image ${currentImageIndex + 1}`}
                    className="w-full h-auto max-h-[600px] object-contain bg-gradient-to-br from-black/40 to-primary/10 transition-all duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover: opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-sm rounded-full p-4">
                      <ZoomIn className="h-10 w-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  {imageFiles.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold shadow-xl border border-white/20">
                      {currentImageIndex + 1} / {imageFiles.length}
                    </div>
                  )}
                </div>

                {imageFiles.length > 1 && (
                  <div className="relative px-1">
                    <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-primary/60 scrollbar-track-primary/10 hover:scrollbar-thumb-primary">
                      {imageFiles.map((mediaFile, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative shrink-0 snap-center w-24 h-24 rounded-xl overflow-hidden border-3 transition-all duration-300 ${
                            currentImageIndex === index
                              ? "border-primary scale-110 shadow-2xl shadow-primary/60 ring-4 ring-primary/30"
                              : "border-border/40 hover:border-primary/60 hover:scale-105 shadow-md"
                          }`}
                        >
                          <img
                            src={mediaFile. url}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300"
                            loading="lazy"
                          />
                          {currentImageIndex === index && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
                              <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              </div>
                            </>
                          )}
                          <div className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {index + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {videoFiles.map((videoFile, index) => (
              <div key={index} className="mb-4 rounded-xl overflow-hidden border-2 border-primary/20 shadow-xl">
                <video 
                  src={videoFile. url} 
                  controls 
                  autoPlay 
                  loop 
                  muted
                  playsInline
                  className="w-full h-auto max-h-[600px] bg-black"
                />
              </div>
            ))}
            
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {reactionEmojis.map((reaction) => {
                const count = reactions[reaction. type] || 0;
                const isActive = userReaction === reaction.type;
                const isPulsing = pulsingReaction === reaction.type;
                const is666 = reaction.type === "666";
                
                return (
                  <button
                    key={reaction.type}
                    onClick={() => handleReaction(reaction.type)}
                    className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full border-2 transition-all ${
                      isActive 
                        ? "border-primary bg-primary/20 scale-110" 
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    } ${isPulsing ? "animate-pulse" : ""} ${is666 ? "border-red-500/50 hover:border-red-500" : ""}`}
                    title={reaction.label}
                  >
                    <span 
                      className={`${is666 ? "text-base font-black" : "text-lg"} ${isPulsing ? "animate-bounce" : ""}`}
                      style={is666 ? {
                        fontFamily: "'Cinzel', serif",
                        color: '#ff0000',
                        textShadow: '0 0 10px rgba(255, 0, 0, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.8)'
                      } : undefined}
                    >
                      {reaction.emoji}
                    </span>
                    {count > 0 && (
                      <span className="text-sm font-medium">{count}</span>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-border/50 flex-wrap">
              <button
                onClick={handlePitchfork}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
                  hasPitchforked
                    ? "border-primary bg-primary/20 scale-105 shadow-lg shadow-primary/50"
                    : "border-border hover:border-primary/50 hover:bg-primary/5"
                } ${isPitchforkPulsing ? "animate-pulse" : ""}`}
              >
                {hasPitchforked && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping pointer-events-none" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 blur-xl animate-pulse pointer-events-none" />
                  </>
                )}
                
                <span 
                  className={`relative text-2xl transition-transform duration-300 ${
                    hasPitchforked ?  "scale-110" : "group-hover:scale-110"
                  } ${isPitchforkPulsing ? "animate-bounce" :  ""}`}
                >
                  🔱
                </span>
                
                <span className={`relative font-bold transition-colors ${
                  hasPitchforked ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}>
                  {pitchforkCount}
                </span>

                <span className={`relative text-sm font-medium transition-colors ${
                  hasPitchforked ?  "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`}>
                  {pitchforkCount === 1 ? "Pitchfork" : "Pitchforks"}
                </span>
              </button>
              
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>

            <PostThoughts postId={post.id} />
          </div>
        </div>

        {showInfernalReaction && (
          <InfernalReaction onComplete={() => setShowInfernalReaction(false)} />
        )}
        
        <FloatingSixSixSix trigger={triggerSixSixSix} />
      </div>

      {showImageModal && imageFiles.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {imageFiles.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModalPrevImage();
                }}
                className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleModalNextImage();
                }}
                className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            </>
          )}

          <div 
            className="max-w-7xl max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageFiles[modalImageIndex].url}
              alt={`Image ${modalImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>

          {imageFiles.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-white text-sm">
              {modalImageIndex + 1} / {imageFiles.length}
            </div>
          )}
        </div>
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription>
              Make changes to your post content. 
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit your post..."
            className="min-h-[200px]"
            maxLength={5000}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePost} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.  This will permanently delete your post and all its reactions and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." :  "Delete Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}