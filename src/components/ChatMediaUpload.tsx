import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Image, Video, Music, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

interface ChatMediaUploadProps {
  onMediaSelect: (file: File, type: "image" | "video" | "audio" | "file") => void;
  onClearMedia: () => void;
  selectedMedia: { file: File; type: string; preview: string } | null;
}

export function ChatMediaUpload({ onMediaSelect, onClearMedia, selectedMedia }: ChatMediaUploadProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "audio" | "file") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 50MB");
      return;
    }

    onMediaSelect(file, type);
  };

  if (selectedMedia) {
    return (
      <div className="relative p-2 bg-muted/20 rounded-lg border border-border">
        <Button
          onClick={onClearMedia}
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
        <div className="pr-8">
          {selectedMedia.type === "image" && (
            <img src={selectedMedia.preview} alt="Preview" className="max-h-24 rounded" />
          )}
          {selectedMedia.type === "video" && (
            <video src={selectedMedia.preview} className="max-h-24 rounded" />
          )}
          {selectedMedia.type === "audio" && (
            <div className="flex items-center gap-2 p-2">
              <Music className="h-4 w-4 text-primary" />
              <span className="text-sm truncate">{selectedMedia.file.name}</span>
            </div>
          )}
          {selectedMedia.type === "file" && (
            <div className="flex items-center gap-2 p-2">
              <Paperclip className="h-4 w-4 text-primary" />
              <span className="text-sm truncate">{selectedMedia.file.name}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "image")}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => imageInputRef.current?.click()}
        className="h-8 w-8 p-0"
      >
        <Image className="h-4 w-4" />
      </Button>

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileChange(e, "video")}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => videoInputRef.current?.click()}
        className="h-8 w-8 p-0"
      >
        <Video className="h-4 w-4" />
      </Button>

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => handleFileChange(e, "audio")}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => audioInputRef.current?.click()}
        className="h-8 w-8 p-0"
      >
        <Music className="h-4 w-4" />
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => handleFileChange(e, "file")}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="h-8 w-8 p-0"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </div>
  );
}
