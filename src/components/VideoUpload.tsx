import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Play, Pause, Droplet, Flame, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoUploadProps {
  onUploadComplete?:  () => void;
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showBloodOverlay, setShowBloodOverlay] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    chant: "",
    category: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch follower count when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      fetchFollowerCount();
    }
  }, [dialogOpen]);

  const fetchFollowerCount = async () => {
    try {
      const { data: { user } } = await supabase. auth.getUser();
      if (! user) return;

      const { data, error } = await (supabase as any).rpc('get_video_follower_count', {
  user_id_param: user. id
});

      if (!error && data !== null) {
        setFollowerCount(data);
      }
    } catch (error) {
      console.error('Error fetching follower count:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (! file) return;

    if (! file.type.startsWith("video/")) {
      toast.error(t("upload.error.notVideo"));
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error(t("upload.error.tooLarge"));
      return;
    }

    setVideoFile(file);
    const preview = URL.createObjectURL(file);
    setVideoPreview(preview);
    
    // Get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.floor(video.duration);
      setVideoDuration(duration);
      
      // Check duration limits
      const maxDuration = followerCount >= 6000 ? 300 : 60; // 5 min or 1 min
      if (duration > maxDuration) {
        if (followerCount < 6000) {
          toast.error(t("upload.error.needLegions"));
          setVideoFile(null);
          setVideoPreview("");
        } else {
          toast.error(t("upload.error.max5min"));
          setVideoFile(null);
          setVideoPreview("");
        }
      }
    };
    video. src = preview;
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef. current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData. tags.filter((t) => t !== tag),
    });
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast.error("Please select a video");
      return;
    }

    if (!formData.title. trim()) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload video
      const fileExt = videoFile.name.split(". ").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error:  uploadError } = await supabase.storage
        .from("post-media")
        .upload(filePath, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("post-media")
        .getPublicUrl(filePath);

      // Create post with metadata and duration
      const { error: insertError } = await (supabase as any).from("posts").insert({
        user_id: user.id,
        content: JSON.stringify({
          title: formData.title,
          chant: formData.chant,
          tags: formData.tags,
        }),
        media_url: publicUrl,
        media_type:  "video",
        post_type: "scream",
        post_section: "sinagogue",
        video_duration: videoDuration,
        privacy: "public",
        visibility: "public",
      });

      if (insertError) throw insertError;

      toast.success("🔥 Your cursed video has been unleashed");
      setDialogOpen(false);
      resetForm();
      onUploadComplete?.();
    } catch (error:  any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setVideoFile(null);
    setVideoPreview("");
    setIsPlaying(false);
    setFormData({ title: "", chant: "", category: "", tags: [] });
    setTagInput("");
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const videoCategories = [
    { value:  "lust-romance", label: "🔥 Lust - Romance & Erotica", sin: "Lust" },
    { value: "lust-fashion", label: "🔥 Lust - Fashion & Beauty", sin: "Lust" },
    { value: "lust-dance", label: "🔥 Lust - Dance & Performance", sin: "Lust" },
    { value: "lust-music", label: "🔥 Lust - Music Videos", sin: "Lust" },
    { value: "lust-subculture", label: "🔥 Lust - Subculture Aesthetics", sin: "Lust" },
    
    { value: "gluttony-food", label: "🍷 Gluttony - Food & Cooking", sin: "Gluttony" },
    { value: "gluttony-travel", label: "🍷 Gluttony - Travel & Luxury", sin: "Gluttony" },
    { value: "gluttony-lifestyle", label: "🍷 Gluttony - Lifestyle Vlogs", sin: "Gluttony" },
    { value:  "gluttony-challenges", label: "🍷 Gluttony - Challenges & Over-the-Top", sin: "Gluttony" },
    { value: "gluttony-asmr", label: "🍷 Gluttony - ASMR / Sensory Overload", sin: "Gluttony" },
    
    { value: "greed-business", label: "💰 Greed - Business & Finance", sin: "Greed" },
    { value: "greed-tech", label: "💰 Greed - Tech Reviews & Unboxings", sin: "Greed" },
    { value:  "greed-gaming", label: "💰 Greed - Gaming Loot/Pay-to-Win", sin: "Greed" },
    { value: "greed-collectibles", label: "💰 Greed - Collectibles & Mods", sin: "Greed" },
    { value: "greed-store", label: "💰 Greed - Prime Store / Monetized Streams", sin: "Greed" },
    
    { value:  "sloth-chill", label: "🛌 Sloth - Chill Vlogs", sin: "Sloth" },
    { value: "sloth-relaxation", label: "🛌 Sloth - Relaxation / Meditation / ASMR", sin: "Sloth" },
    { value: "sloth-podcasts", label: "🛌 Sloth - Longform Podcasts", sin: "Sloth" },
    { value: "sloth-ambient", label: "🛌 Sloth - Ambient / Lo-Fi Streams", sin: "Sloth" },
    { value: "sloth-background", label: "🛌 Sloth - Background Content", sin: "Sloth" },
    
    { value:  "wrath-action", label: "⚔️ Wrath - Action & War Films", sin: "Wrath" },
    { value: "wrath-horror", label: "⚔️ Wrath - Horror & Thrillers", sin: "Wrath" },
    { value:  "wrath-martial", label: "⚔️ Wrath - Martial Arts & Combat Sports", sin: "Wrath" },
    { value: "wrath-esports", label: "⚔️ Wrath - Esports & Competitive Gaming", sin: "Wrath" },
    { value:  "wrath-debates", label: "⚔️ Wrath - Debates & Heated Commentary", sin: "Wrath" },
    
    { value: "envy-celebrity", label: "👁️ Envy - Celebrity News & Gossip", sin: "Envy" },
    { value: "envy-reactions", label: "👁️ Envy - Reaction Videos", sin: "Envy" },
    { value: "envy-reviews", label: "👁️ Envy - Reviews & Comparisons", sin: "Envy" },
    { value: "envy-hauls", label: "👁️ Envy - Fashion Hauls / What I Bought", sin: "Envy" },
    { value: "envy-social", label: "👁️ Envy - Social Media Highlights", sin: "Envy" },
    
    { value: "pride-documentaries", label: "👑 Pride - Documentaries & Biographies", sin: "Pride" },
    { value: "pride-educational", label: "👑 Pride - Educational / Explainers", sin: "Pride" },
    { value: "pride-tutorials", label: "👑 Pride - Tutorials & How-Tos", sin: "Pride" },
    { value: "pride-art", label: "👑 Pride - Art & Design Showcases", sin: "Pride" },
    { value: "pride-projects", label: "👑 Pride - Personal Projects / DIY Builds", sin: "Pride" },
  ];

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/50">
          <Upload className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-primary/30 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-serif flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              {t("upload.title")}
            </DialogTitle>
            <LanguageSwitcher />
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Follower Count & Legion Status */}
          <Alert className="bg-primary/10 border-primary/30">
            <Users className="h-4 w-4 text-primary" />
            <AlertDescription className="ml-2">
              <span className="font-semibold">{followerCount. toLocaleString()}</span> {t("upload.disciples")}
              {followerCount >= 6000 ?  (
                <span className="ml-2 text-primary">✓ {t("upload.legionUnlocked")}</span>
              ) : (
                <span className="ml-2 text-muted-foreground">
                  ({(6000 - followerCount).toLocaleString()} {t("upload.toLegion")})
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Video Upload Area */}
          {!videoPreview ?  (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-primary/30 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-all bg-linear-to-br from-black to-primary/5"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-lg font-medium mb-2">{t("upload.uploadText")}</p>
              <p className="text-sm text-muted-foreground">
                {t("upload.clickOrDrag")}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {followerCount >= 6000 ?  t("upload.maxSize5min") : t("upload.maxSize60sec")}
              </p>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-black border-2 border-primary/50">
              {/* Video Preview */}
              <div className="relative aspect-9/16 max-h-96">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                />

                {/* Blood Drip Overlay */}
                {showBloodOverlay && (
                  <div className="absolute inset-0 pointer-events-none">
                    <style>{`
                      @keyframes blood-drip {
                        0% {
                          transform: translateY(-100%);
                          opacity: 0. 8;
                        }
                        100% {
                          transform:  translateY(100vh);
                          opacity: 0;
                        }
                      }
                      .blood-drop {
                        position: absolute;
                        width: 3px;
                        height: 20px;
                        background:  linear-gradient(to bottom, transparent, #dc143c);
                        animation: blood-drip 3s linear infinite;
                      }
                    `}</style>
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="blood-drop"
                        style={{
                          left: `${10 + i * 12}%`,
                          animationDelay: `${i * 0.4}s`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Ambient Vignette */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                {/* Play/Pause Button */}
                <button
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-all group"
                >
                  {isPlaying ? (
                    <Pause className="h-16 w-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <Play className="h-16 w-16 text-white" />
                  )}
                </button>
              </div>

              {/* Controls */}
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="bg-black/60 hover:bg-black/80 backdrop-blur-sm"
                  onClick={() => setShowBloodOverlay(! showBloodOverlay)}
                >
                  <Droplet className={showBloodOverlay ? "text-primary" : "text-white/50"} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="bg-black/60 hover:bg-black/80 backdrop-blur-sm"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview("");
                    setIsPlaying(false);
                  }}
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <Label>{t("upload.titleLabel")} *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e. target.value })}
              placeholder={t("upload.titlePlaceholder")}
              className="border-primary/30"
            />
          </div>

          {/* Category */}
          <div>
            <Label>{t("upload.categoryLabel")}</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="border-primary/30">
                <SelectValue placeholder={t("upload.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {videoCategories. map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Description */}
          <div>
            <Label>{t("upload. descriptionLabel")}</Label>
            <Textarea
              value={formData.chant}
              onChange={(e) => setFormData({ ...formData, chant: e.target.value })}
              placeholder={t("upload.descriptionPlaceholder")}
              rows={3}
              className="border-primary/30 font-serif"
            />
          </div>

          {/* Tags */}
          <div>
            <Label>{t("upload.tagsLabel")}</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder={t("upload.tagsPlaceholder")}
                className="border-primary/30"
              />
              <Button type="button" onClick={addTag} variant="outline">
                {t("upload.addButton")}
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags. map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-primary/20 hover:bg-primary/30 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!videoFile || !formData.title.trim() || uploading}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Flame className="mr-2 h-5 w-5" />
            {uploading ? t("upload. uploading") : t("upload.unleashButton")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}