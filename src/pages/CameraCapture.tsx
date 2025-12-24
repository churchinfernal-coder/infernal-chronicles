import { useState, useRef, useEffect } from "react";
import { Camera, X, RotateCw, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && ! capturedImage) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedImage]);

  const startCamera = async () => {
    setLoading(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal:  1080 }
        },
        audio: false
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err:  any) {
      console.error("Camera error:", err);
      setError(err.message || "Failed to access camera");
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (! videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video. videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (! blob) return;

      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage(imageUrl);
      stopCamera();
    }, "image/jpeg", 0.95);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    setCapturedImage(null);
  };

  const retakePhoto = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (!capturedImage || !canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;

      const file = new File(
        [blob],
        `camera-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      onCapture(file);
      handleClose();
    }, "image/jpeg", 0.95);
  };

  const handleClose = () => {
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setError(null);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        variant="outline"
        size="default"
        className="gap-2"
      >
        <Camera className="h-4 w-4" />
        Camera
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Take Photo
            </DialogTitle>
          </DialogHeader>

          <div className="relative bg-black aspect-video w-full flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center text-white">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
                  <p>Starting camera...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center text-white px-4">
                  <X className="h-12 w-12 mx-auto mb-2 text-red-500" />
                  <p className="mb-4">{error}</p>
                  <Button onClick={startCamera} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {capturedImage ?  (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="p-4 flex items-center justify-between gap-3 bg-background">
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>

            {capturedImage ?  (
              <>
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1"
                >
                  Retake
                </Button>
                <Button
                  onClick={confirmPhoto}
                  className="flex-1 gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Use Photo
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={switchCamera}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  disabled={loading || !!error}
                >
                  <RotateCw className="h-5 w-5" />
                </Button>
                <Button
                  onClick={capturePhoto}
                  disabled={loading || !!error}
                  size="lg"
                  className="flex-1"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Capture
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}