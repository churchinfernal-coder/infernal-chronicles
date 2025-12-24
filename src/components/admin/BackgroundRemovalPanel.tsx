import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { removeBackground, loadImage } from "@/lib/aiBackgroundRemoval";
import { Scissors, Upload, Loader2, Download } from "lucide-react";

interface BackgroundRemovalPanelProps {
  onImageProcessed?: (imageBlob: Blob) => void;
}

export const BackgroundRemovalPanel = ({ onImageProcessed }: BackgroundRemovalPanelProps) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResultImage(null);

    try {
      const img = await loadImage(file);
      const resultBlob = await removeBackground(img, (prog) => setProgress(prog));
      
      const url = URL.createObjectURL(resultBlob);
      setResultImage(url);
      
      onImageProcessed?.(resultBlob);
      toast.success('Background removed successfully!');
    } catch (error: any) {
      console.error('Background removal error:', error);
      toast.error(error.message || 'Failed to remove background');
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'background-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Scissors className="w-5 h-5 text-primary" />
          AI Background Removal
        </CardTitle>
        <CardDescription>
          Automatically remove backgrounds using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <label htmlFor="bg-removal-upload">
            <Button
              asChild
              disabled={processing}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <span className="cursor-pointer">
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </>
                )}
              </span>
            </Button>
          </label>
          <input
            id="bg-removal-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={processing}
          />

          {processing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                {progress < 30 ? 'Loading AI model...' :
                 progress < 50 ? 'Preparing image...' :
                 progress < 70 ? 'Processing...' :
                 progress < 90 ? 'Applying mask...' :
                 'Finishing up...'}
              </p>
            </div>
          )}

          {resultImage && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-border bg-background/50">
                <img
                  src={resultImage}
                  alt="Background removed"
                  className="w-full h-auto"
                  style={{
                    backgroundImage: 'repeating-conic-gradient(#80808020 0% 25%, transparent 0% 50%) 50% / 20px 20px'
                  }}
                />
              </div>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Result
              </Button>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-md bg-muted/50">
          <p className="font-medium">Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Works best with clear subject-background separation</li>
            <li>Processing happens in your browser (privacy-first)</li>
            <li>Supports WebGPU for faster processing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
