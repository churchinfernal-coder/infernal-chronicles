import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Music, RefreshCw } from "lucide-react";

interface MessageMediaProps {
  mediaUrl: string;
  mediaType: "image" | "video" | "audio" | "file";
  fileName?: string;
}

export function MessageMedia({ mediaUrl, mediaType, fileName }: MessageMediaProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleRetry = () => {
    setError(false);
    setLoading(true);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = mediaUrl;
    link.download = fileName || "download";
    link.click();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 bg-muted/20 rounded-lg border border-border">
        <FileText className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Media failed to load</p>
        <Button onClick={handleRetry} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      </div>
    );
  }

  switch (mediaType) {
    case "image":
      return (
        <div className="relative max-w-sm">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
            </div>
          )}
          <img
            src={mediaUrl}
            alt="Shared media"
            className="rounded-lg max-h-64 w-auto"
            onLoad={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
          />
        </div>
      );

    case "video":
      return (
        <div className="max-w-sm">
          <video
            src={mediaUrl}
            controls
            className="rounded-lg max-h-64 w-full"
            onLoadedData={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
          />
        </div>
      );

    case "audio":
      return (
        <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border min-w-[280px]">
          <Music className="h-5 w-5 text-primary" />
          <audio
            src={mediaUrl}
            controls
            className="flex-1"
            onLoadedData={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
          />
        </div>
      );

    case "file":
      return (
        <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border min-w-[280px]">
          <FileText className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName || "File"}</p>
            <p className="text-xs text-muted-foreground">Tap to download</p>
          </div>
          <Button onClick={handleDownload} variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );

    default:
      return null;
  }
}
