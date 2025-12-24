import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, Video, X } from "lucide-react";
import { toast } from "sonner";

interface CovenPostComposerProps {
  covenId: string;
  parentPostId?: string;
  onPostCreated: () => void;
  onCancel?: () => void;
}

export function CovenPostComposer({
  covenId,
  parentPostId,
  onPostCreated,
  onCancel,
}: CovenPostComposerProps) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "coven_only">("coven_only");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "video") => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB per file
    const MAX_FILES = 10;

    if (mediaFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach((file) => {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} is too large. Max 50MB per file.`);
        return;
      }

      const fileType = file.type.startsWith("video/") ? "video" : "photo";
      if (fileType !== type) {
        toast.error(`Please select ${type === "photo" ? "images" : "videos"} only`);
        return;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    });

    setMediaFiles([...mediaFiles, ...validFiles]);
    setMediaPreviews([...mediaPreviews, ...previews]);
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  };

  const clearAllMedia = () => {
    mediaPreviews.forEach((url) => URL.revokeObjectURL(url));
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Content required");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const mediaUrls: string[] = [];
      let uploadedMediaType = null;

      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${covenId}/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("post-media")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("post-media")
            .getPublicUrl(fileName);

          mediaUrls.push(publicUrl);
        }

        uploadedMediaType = mediaFiles[0].type.startsWith("video/") ? "video" : "photo";
      }

      const { error } = await supabase.from("coven_posts").insert({
        coven_id: covenId,
        user_id: user.id,
        parent_post_id: parentPostId || null,
        content,
        visibility,
        media_url: mediaUrls.length > 0 ? mediaUrls.join(",") : null,
        media_type: uploadedMediaType,
      });

      if (error) throw error;

      toast.success("Posted");
      setContent("");
      setVisibility("coven_only");
      clearAllMedia();
      onPostCreated();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-card mb-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentPostId ? "Write a reply..." : "Share with the coven..."}
        className="min-h-[100px] mb-3"
        disabled={isSubmitting}
      />

      {mediaPreviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {mediaPreviews.map((preview, index) => (
            <div key={index} className="relative group">
              <button
                onClick={() => removeMedia(index)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="h-3 w-3" />
              </button>
              {mediaFiles[index].type.startsWith("video/") ? (
                <video src={preview} className="h-32 w-full object-cover rounded-lg" />
              ) : (
                <img src={preview} alt={`Preview ${index + 1}`} className="h-32 w-full object-cover rounded-lg" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <Label htmlFor="photo-upload" className="cursor-pointer">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent">
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm">Photo</span>
          </div>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleMediaSelect(e, "photo")}
            disabled={isSubmitting}
          />
        </Label>

        <Label htmlFor="video-upload" className="cursor-pointer">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent">
            <Video className="h-4 w-4" />
            <span className="text-sm">Video</span>
          </div>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => handleMediaSelect(e, "video")}
            disabled={isSubmitting}
          />
        </Label>

        {!parentPostId && (
          <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coven_only">Coven Only</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
