import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Layers, Eye, EyeOff, Lock, Unlock, Trash2, 
  MoveUp, MoveDown, Plus, Pencil
} from "lucide-react";
import { toast } from "sonner";

interface Layer {
  id: string;
  layer_name: string;
  layer_order: number;
  is_visible: boolean;
  is_locked: boolean;
  opacity: number;
  blend_mode: string;
}

interface FrameCanvasProps {
  currentFrameUrl?: string;
  previousFrameUrl?: string;
  layers: Layer[];
  onLayerToggleVisible: (layerId: string) => void;
  onLayerToggleLock: (layerId: string) => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  onLayerReorder: (layerId: string, direction: 'up' | 'down') => void;
  onLayerDelete: (layerId: string) => void;
  onAddLayer: () => void;
  showOnionSkin: boolean;
  onionSkinOpacity: number;
  onOnionSkinOpacityChange: (opacity: number) => void;
}

export function FrameCanvas({
  currentFrameUrl,
  previousFrameUrl,
  layers,
  onLayerToggleVisible,
  onLayerToggleLock,
  onLayerOpacityChange,
  onLayerReorder,
  onLayerDelete,
  onAddLayer,
  showOnionSkin,
  onionSkinOpacity,
  onOnionSkinOpacityChange
}: FrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw onion skin (previous frame)
    if (showOnionSkin && previousFrameUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.globalAlpha = onionSkinOpacity / 100;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        // Draw current frame on top
        drawCurrentFrame();
      };
      img.src = previousFrameUrl;
    } else {
      drawCurrentFrame();
    }

    function drawCurrentFrame() {
      if (currentFrameUrl && ctx) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Draw grid
          drawGrid(ctx);
        };
        img.src = currentFrameUrl;
      } else if (ctx) {
        // Draw empty canvas with grid
        drawGrid(ctx);
      }
    }

    function drawGrid(context: CanvasRenderingContext2D) {
      const gridSize = 50;
      context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      context.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
      }
    }
  }, [currentFrameUrl, previousFrameUrl, showOnionSkin, onionSkinOpacity]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
      {/* Canvas Area */}
      <Card className="p-4 bg-black/50">
        <div className="relative rounded-lg overflow-hidden bg-black border border-border">
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="w-full h-auto"
            style={{ maxHeight: '600px', objectFit: 'contain' }}
          />
          
          {/* Canvas Overlay Info */}
          <div className="absolute top-4 left-4 space-y-2">
            <div className="bg-black/80 px-3 py-1.5 rounded text-xs text-white">
              1920 × 1080px
            </div>
            {showOnionSkin && previousFrameUrl && (
              <div className="bg-yellow-500/80 px-3 py-1.5 rounded text-xs text-black font-medium">
                🧅 Onion Skin Active ({onionSkinOpacity}%)
              </div>
            )}
          </div>

          {/* Empty State */}
          {!currentFrameUrl && !previousFrameUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Pencil className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No frame content</p>
                <p className="text-sm text-muted-foreground">Add assets or generate imagery</p>
              </div>
            </div>
          )}
        </div>

        {/* Onion Skin Control */}
        {previousFrameUrl && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Onion Skin Opacity</Label>
              <span className="text-sm text-muted-foreground">{onionSkinOpacity}%</span>
            </div>
            <Slider
              value={[onionSkinOpacity]}
              onValueChange={(v) => onOnionSkinOpacityChange(v[0])}
              min={0}
              max={100}
              step={5}
            />
          </div>
        )}
      </Card>

      {/* Layer Panel */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Layers</h3>
          </div>
          <Button size="sm" onClick={onAddLayer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Layer
          </Button>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {layers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No layers</p>
            </div>
          ) : (
            layers
              .sort((a, b) => b.layer_order - a.layer_order)
              .map((layer, index) => (
                <div
                  key={layer.id}
                  className={`border rounded-lg p-3 space-y-2 transition-colors ${
                    selectedLayer === layer.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedLayer(layer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">{layer.layer_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerToggleVisible(layer.id);
                        }}
                      >
                        {layer.is_visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerToggleLock(layer.id);
                        }}
                      >
                        {layer.is_locked ? (
                          <Lock className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Unlock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Opacity</Label>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[layer.opacity * 100]}
                      onValueChange={(v) => onLayerOpacityChange(layer.id, v[0] / 100)}
                      min={0}
                      max={100}
                      step={5}
                      disabled={layer.is_locked}
                    />
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerReorder(layer.id, 'up');
                      }}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerReorder(layer.id, 'down');
                      }}
                      disabled={index === layers.length - 1}
                    >
                      <MoveDown className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this layer?')) {
                          onLayerDelete(layer.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </Card>
    </div>
  );
}
