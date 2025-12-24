import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Square, Circle, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CameraCapture({ open, onOpenChange }: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const logAction = async (actionType: string, status: string, reason?: string, path?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("camera_logs").insert({
        user_id: user.id,
        action_type: actionType,
        status,
        reason,
        path
      });
    } catch (err) {
      console.error("Error logging camera action:", err);
    }
  };

  const startCamera = async () => {
    try {
      await logAction("open", "info", "User opened camera");
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setPermissionDenied(false);
        await logAction("permission_granted", "success");
        toast.success("Camera access granted");
      }
    } catch (err: any) {
      console.error("Camera permission error:", err);
      setPermissionDenied(true);
      
      const reason = err?.name === "NotAllowedError"
        ? "Camera permission denied. Enable permissions in browser site settings."
        : err?.name === "NotFoundError"
        ? "No camera device found."
        : `Unknown error: ${err?.message || "Unknown"}`;

      await logAction("permission_denied", "error", reason);
      toast.error(reason);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsRecording(false);
  };

  const takeSnapshot = async () => {
    if (!videoRef.current || !streamRef.current) return;

    try {
      await logAction("capture_snapshot", "info", "Snapshot initiated");

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      ctx.drawImage(videoRef.current, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          await logAction("capture_snapshot", "error", "Failed to create snapshot blob");
          toast.error("Failed to capture snapshot");
          return;
        }

        await uploadMedia(blob, "snapshot");
      }, "image/jpeg", 0.9);
    } catch (err: any) {
      console.error("Snapshot error:", err);
      await logAction("capture_snapshot", "error", err?.message || "Unknown snapshot error");
      toast.error("Failed to take snapshot");
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) return;

    try {
      await logAction("record_start", "info", "Recording started");
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm;codecs=vp9"
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        await uploadMedia(blob, "recording");
        await logAction("record_stop", "success", "Recording stopped");
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.success("Recording started");
    } catch (err: any) {
      console.error("Recording error:", err);
      await logAction("record_start", "error", err?.message || "Unknown recording error");
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      toast.info("Recording stopped, uploading...");
    }
  };

  const uploadMedia = async (blob: Blob, type: "snapshot" | "recording") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await logAction(`upload_${type}`, "error", "User not authenticated");
        toast.error("You must be logged in to upload media");
        return;
      }

      const timestamp = Date.now();
      const ext = type === "snapshot" ? "jpg" : "webm";
      const fileName = `${user.id}/${type}_${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("camera-media")
        .upload(fileName, blob, {
          contentType: type === "snapshot" ? "image/jpeg" : "video/webm",
          upsert: false
        });

      if (uploadError) {
        await logAction(`upload_${type}`, "error", uploadError.message);
        toast.error(`Upload failed: ${uploadError.message}`);
        return;
      }

      await logAction(`upload_${type}`, "success", undefined, fileName);
      toast.success(`${type === "snapshot" ? "Snapshot" : "Recording"} uploaded successfully!`);
    } catch (err: any) {
      console.error("Upload error:", err);
      await logAction(`upload_${type}`, "error", err?.message || "Unknown upload error");
      toast.error("Failed to upload media");
    }
  };

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Camera Capture</DialogTitle>
          <DialogDescription>
            Take snapshots or record short clips
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isStreaming && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Camera className="h-16 w-16 text-muted-foreground" />
              {permissionDenied ? (
                <>
                  <p className="text-sm text-destructive">Camera permission denied. Enable permissions in browser site settings and retry.</p>
                  <Button onClick={startCamera}>
                    Retry Camera Access
                  </Button>
                </>
              ) : (
                <Button onClick={startCamera}>
                  Activate Camera
                </Button>
              )}
            </div>
          )}

          {isStreaming && (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
                    <Circle className="h-3 w-3 fill-current" />
                    <span className="text-sm font-medium">REC</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={takeSnapshot}
                  disabled={isRecording}
                  className="rounded-full"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Snapshot
                </Button>

                {!isRecording ? (
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={startRecording}
                    className="rounded-full"
                  >
                    <Circle className="h-5 w-5 mr-2" />
                    Record
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={stopRecording}
                    className="rounded-full"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleClose}
                  className="rounded-full"
                >
                  <X className="h-5 w-5 mr-2" />
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
