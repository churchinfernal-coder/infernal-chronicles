import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  X, 
  Loader2, 
  MessageCircle, 
  Zap, 
  Skull, 
  EyeOff,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface CreatePostProps {
  onPostCreated: () => void;
}

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
  uploading: boolean;
  progress:  number;
  url?: string;
}

const MAX_IMAGES = 10;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const RATE_LIMIT_POSTS = 10;
const RATE_LIMIT_WINDOW_HOURS = 1;

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"whisper" | "scream" | "incantation">("whisper");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ count: number; remaining: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initializeComponent = async () => {
      await fetchUserData();
      await checkRateLimit();
    };
    initializeComponent();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user: currentUser }, error:  authError } = await supabase. auth.getUser();
      if (authError || !currentUser) {
        console.error("Auth error:", authError);
        return;
      }

      setUser(currentUser);
      
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        return;
      }
      
      setProfile(profileData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const checkRateLimit = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data, error } = await (supabase as any).from("post_rate_limits")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Rate limit check error:", error);
        return;
      }

      if (data) {
        const windowStart = new Date(data.window_start);
        const now = new Date();
        const hoursPassed = (now. getTime() - windowStart.getTime()) / (1000 * 60 * 60);

        if (hoursPassed >= RATE_LIMIT_WINDOW_HOURS) {
          setRateLimitInfo({ count: 0, remaining: RATE_LIMIT_POSTS });
        } else {
          setRateLimitInfo({ 
            count: data.post_count || 0, 
            remaining:  Math.max(0, RATE_LIMIT_POSTS - (data.post_count || 0)) 
          });
        }
      } else {
        setRateLimitInfo({ count: 0, remaining:  RATE_LIMIT_POSTS });
      }
    } catch (error) {
      console.error("Error checking rate limit:", error);
      setRateLimitInfo({ count: 0, remaining: RATE_LIMIT_POSTS });
    }
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "video") => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (type === "video") {
      if (mediaFiles.length > 0) {
        toast.error("Remove existing media before adding video");
        return;
      }
      if (files.length > 1) {
        toast.error("Only 1 video allowed");
        return;
      }
      if (files[0].size > MAX_VIDEO_SIZE) {
        toast.error("Video must be under 50MB");
        return;
      }
    } else {
      const hasVideo = mediaFiles.some(m => m.type === 'video');
      if (hasVideo) {
        toast.error("Cannot mix photos and videos");
        return;
      }
      if (mediaFiles.length + files.length > MAX_IMAGES) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed`);
        return;
      }
      const oversized = files.find(f => f.size > MAX_IMAGE_SIZE);
      if (oversized) {
        toast.error(`Image ${oversized.name} exceeds 10MB`);
        return;
      }
    }

    try {
      const newMedia:  MediaFile[] = await Promise.all(
        files. map(async (file) => {
          const preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader. onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
          });

          return {
            file,
            preview,
            type:  file.type. startsWith("image/") ? 'image' : 'video',
            uploading: false,
            progress: 0
          };
        })
      );

      setMediaFiles(prev => [...prev, ...newMedia]);
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    } catch (error) {
      console.error("Error processing media files:", error);
      toast.error("Failed to process media files");
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => {
      const updated = [...prev];
      const revoked = updated[index];
      if (revoked && revoked.preview) {
        URL.revokeObjectURL(revoked.preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadMedia = async (media: MediaFile, index: number): Promise<string> => {
    const fileExt = media.file.name. split(". ").pop() || "tmp";
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    setMediaFiles(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index].uploading = true;
        updated[index].progress = 0;
      }
      return updated;
    });

    const progressInterval = setInterval(() => {
      setMediaFiles(prev => {
        const updated = [...prev];
        if (updated[index] && updated[index].progress < 90) {
          updated[index]. progress += 10;
        }
        return updated;
      });
    }, 500);

    try {
      const { data, error } = await supabase. storage
        .from("media")
        .upload(fileName, media.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: media.file.type
        });

      clearInterval(progressInterval);

      if (error) {
        if (error.message.includes('Payload too large') || error.message.includes('413')) {
          throw new Error('File too large.  Compress your video and try again.');
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      setMediaFiles(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].uploading = false;
          updated[index].progress = 100;
          updated[index].url = publicUrl;
        }
        return updated;
      });

      return publicUrl;
    } catch (err) {
      clearInterval(progressInterval);
      setMediaFiles(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].uploading = false;
        }
        return updated;
      });
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error("Please add content or media");
      return;
    }

    if (! user) {
      toast.error("Please log in");
      return;
    }

    try {
      const { data: canPost } = await (supabase as any).rpc('check_post_rate_limit', {
        p_user_id: user.id
      });

      if (!canPost) {
        toast.error(`Rate limit reached. Maximum ${RATE_LIMIT_POSTS} posts per ${RATE_LIMIT_WINDOW_HOURS} hour. `);
        return;
      }
    } catch (error) {
      console.error("Rate limit check error:", error);
      toast.error("Failed to verify rate limit");
      return;
    }

    setUploading(true);

    try {
      const uploadedMediaData:  Array<{ url: string; type: 'image' | 'video'; duration?:  number }> = [];

      for (let i = 0; i < mediaFiles.length; i++) {
        const media = mediaFiles[i];
        
        if (media.type === 'video' && media.file.size > MAX_VIDEO_SIZE) {
          toast.error(`Video is too large. Maximum 50MB. `);
          setUploading(false);
          return;
        }

        if (media.type === 'image' && media.file.size > MAX_IMAGE_SIZE) {
          toast.error(`Image ${i + 1} is too large.  Maximum 10MB.`);
          setUploading(false);
          return;
        }

        try {
          const url = await uploadMedia(media, i);
          uploadedMediaData. push({
            url,
            type:  media.type,
            duration: media.type === 'video' ? 0 : undefined
          });
        } catch (uploadError:  any) {
          console.error(`Failed to upload file ${i + 1}:`, uploadError);
          toast.error(`Failed to upload ${media.type} ${i + 1}:  ${uploadError.message}`);
          setUploading(false);
          return;
        }
      }

      let finalContent = content. trim();
      
      if (isAnonymous) {
        finalContent = JSON.stringify({
          text: content. trim(),
          anonymous: true
        });
      }

      const postData:  any = {
        user_id:  user.id,
        content: finalContent,
        post_type: postType,
        post_section: "feed",
        visibility: "public",
        privacy: "public",
        media_files: uploadedMediaData. length > 0 ? uploadedMediaData : null,
        media_url: uploadedMediaData[0]?.url || null,
        media_type: uploadedMediaData[0]?.type || null
      };

      const { error:  postError } = await (supabase as any)
        .from("posts")
        .insert(postData);

      if (postError) throw postError;

      toast.success(isAnonymous ? "Posted anonymously!" : "Post created!");
      
      setContent("");
      setMediaFiles([]);
      setPostType("whisper");
      setIsAnonymous(false);
      
      await checkRateLimit();
      onPostCreated();

    } catch (error:  any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setUploading(false);
    }
  };

  const isVideoPost = mediaFiles.some(m => m.type === 'video');
  const canAddMore = ! isVideoPost && mediaFiles.length < MAX_IMAGES;

  return (
    <div className="bg-black/50 backdrop-blur-xl border border-primary/20 rounded-lg p-4 space-y-4">
      {rateLimitInfo && rateLimitInfo.remaining <= 2 && rateLimitInfo.remaining > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{rateLimitInfo.remaining} posts remaining this hour</span>
        </div>
      )}

      {rateLimitInfo && rateLimitInfo.remaining === 0 && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Rate limit reached. Try again after 1 hour.</span>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          {isAnonymous ?  (
            <AvatarFallback className="bg-muted text-muted-foreground">
              <EyeOff className="h-5 w-5" />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage src={profile?. avatar_url || ""} alt={profile?.username || "User"} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {profile?.username?. charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </>
          )}
        </Avatar>

        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-center justify-between bg-background/30 rounded-lg p-2 border border-primary/10">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="anonymous-mode" className="text-sm cursor-pointer">
                Post Anonymously
              </Label>
            </div>
            <Switch
              id="anonymous-mode"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              disabled={uploading}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPostType("whisper")}
              disabled={uploading}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all",
                postType === "whisper"
                  ? "border-blue-500 bg-blue-500/20 text-blue-400"
                  : "border-border hover:border-primary/50"
              )}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Whisper</span>
            </button>

            <button
              onClick={() => setPostType("scream")}
              disabled={uploading}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all",
                postType === "scream"
                  ? "border-red-500 bg-red-500/20 text-red-400"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Zap className="h-4 w-4" />
              <span className="text-xs font-medium">Scream</span>
            </button>

            <button
              onClick={() => setPostType("incantation")}
              disabled={uploading}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 transition-all",
                postType === "incantation"
                  ? "border-purple-500 bg-purple-500/20 text-purple-400"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Skull className="h-4 w-4" />
              <span className="text-xs font-medium">Incantation</span>
            </button>
          </div>

          <Textarea
            placeholder={isAnonymous ? "Share anonymously..." : "What's on your mind?"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={uploading}
            className="min-h-[100px] bg-background/50 border-primary/30 resize-none"
            maxLength={5000}
          />

          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group border border-primary/20">
                  {media.type === "image" ?  (
                    <img 
                      src={media.preview} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <video 
                      src={media.preview} 
                      className="w-full h-full object-cover" 
                      muted
                      playsInline
                    />
                  )}
                  
                  {media.uploading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 p-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <Progress value={media.progress} className="w-full h-1" />
                      <span className="text-xs text-white">{media.progress}%</span>
                    </div>
                  )}

                  {!uploading && (
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 p-1 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                onChange={(e) => handleMediaSelect(e, "photo")}
                className="hidden"
                id="photo-upload"
                disabled={uploading || isVideoPost}
              />
              <label htmlFor="photo-upload">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  disabled={uploading || isVideoPost || !canAddMore}
                  asChild
                >
                  <span className="cursor-pointer">
                    <ImageIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      Photo {mediaFiles.length > 0 && `(${mediaFiles.length}/${MAX_IMAGES})`}
                    </span>
                  </span>
                </Button>
              </label>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={(e) => handleMediaSelect(e, "video")}
                className="hidden"
                id="video-upload"
                disabled={uploading || mediaFiles.length > 0}
              />
              <label htmlFor="video-upload">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  disabled={uploading || mediaFiles.length > 0}
                  asChild
                >
                  <span className="cursor-pointer">
                    <VideoIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Video</span>
                  </span>
                </Button>
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setContent("");
                  setMediaFiles([]);
                  setPostType("whisper");
                  setIsAnonymous(false);
                }}
                disabled={uploading}
              >
                Clear
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading || (! content.trim() && mediaFiles.length === 0) || (rateLimitInfo?.remaining === 0)}
                size="sm"
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting... 
                  </>
                ) : (
                  <>
                    {isAnonymous && <EyeOff className="h-4 w-4" />}
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}