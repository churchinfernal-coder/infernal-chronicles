import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { upscaleImage } from '@/lib/imageUpscaler';
import { DesignEditorTooltip } from './DesignEditorTooltip';

interface ImageUpscalerPanelProps {
  selectedImage: any | null;
  onUpscaleComplete: (upscaledImage: string) => void;
}

export function ImageUpscalerPanel({ selectedImage, onUpscaleComplete }: ImageUpscalerPanelProps) {
  const [scale, setScale] = useState<2 | 3 | 4>(2);
  const [method, setMethod] = useState<'bicubic' | 'lanczos' | 'ai-enhanced'>('bicubic');
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleUpscale = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsUpscaling(true);
    toast('Upscaling image...');

    try {
      // Get the image source from the Fabric object
      const imageSrc = selectedImage.getSrc();
      
      const result = await upscaleImage(imageSrc, {
        scale,
        method,
        quality: 95
      });

      setPreview(result.upscaledImage);
      onUpscaleComplete(result.upscaledImage);
      
      toast.success(
        `Image upscaled ${scale}x (${result.originalWidth}x${result.originalHeight} → ${result.upscaledWidth}x${result.upscaledHeight})${
          result.aiAnalysis ? '\nAI: ' + result.aiAnalysis : ''
        }`
      );
    } catch (error: any) {
      console.error('Upscale error:', error);
      toast.error(`Failed to upscale image: ${error.message}`);
    } finally {
      setIsUpscaling(false);
    }
  };

  const downloadUpscaled = () => {
    if (!preview) return;

    const link = document.createElement('a');
    link.href = preview;
    link.download = `upscaled-${scale}x-${Date.now()}.png`;
    link.click();
    toast.success('Download started');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wand2 className="h-4 w-4" />
          Image Upscaler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedImage && (
          <p className="text-xs text-muted-foreground">
            Select an image on the canvas to upscale it
          </p>
        )}

        {selectedImage && (
          <>
            {/* Scale Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Upscale Factor</Label>
                <span className="text-xs text-muted-foreground">{scale}x</span>
              </div>
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value as 2 | 3 | 4)}
                min={2}
                max={4}
                step={1}
                className="py-2"
                disabled={isUpscaling}
              />
              <p className="text-xs text-muted-foreground">
                2x = Double size, 3x = Triple size, 4x = Quadruple size
              </p>
            </div>

            {/* Method Selection */}
            <div className="space-y-2">
              <Label className="text-xs">Upscaling Method</Label>
              <Select 
                value={method} 
                onValueChange={(value: any) => setMethod(value)}
                disabled={isUpscaling}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bicubic" className="text-xs">
                    Bicubic (Fast)
                  </SelectItem>
                  <SelectItem value="lanczos" className="text-xs">
                    Lanczos (Balanced)
                  </SelectItem>
                  <SelectItem value="ai-enhanced" className="text-xs">
                    AI Enhanced (Best Quality)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {method === 'bicubic' && 'Fast upscaling with good quality'}
                {method === 'lanczos' && 'Better quality, slightly slower'}
                {method === 'ai-enhanced' && 'Best quality using AI analysis'}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <DesignEditorTooltip content={`Upscale image by ${scale}x using ${method}`}>
                <Button
                  onClick={handleUpscale}
                  disabled={isUpscaling}
                  className="w-full"
                  size="sm"
                >
                  {isUpscaling ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Upscaling...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3 w-3 mr-2" />
                      Upscale Image
                    </>
                  )}
                </Button>
              </DesignEditorTooltip>

              {preview && (
                <Button
                  onClick={downloadUpscaled}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download Upscaled
                </Button>
              )}
            </div>

            {/* Preview */}
            {preview && (
              <div className="space-y-2">
                <Label className="text-xs">Preview</Label>
                <div className="border rounded-md p-2 bg-muted/50 max-h-40 overflow-auto">
                  <img 
                    src={preview} 
                    alt="Upscaled preview" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
