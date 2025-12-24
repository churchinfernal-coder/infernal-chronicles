import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ZoomIn, ZoomOut, Maximize2, Hand, Grid3X3, Ruler } from "lucide-react";
import { useState } from "react";
import { Canvas as FabricCanvas } from "fabric";

interface CanvasControlsProps {
  fabricCanvas: FabricCanvas | null;
  onCanvasSizeChange: (width: number, height: number) => void;
}

const PRESET_SIZES = [
  { label: "Custom", width: 0, height: 0 },
  { label: "Instagram Post (1:1)", width: 1080, height: 1080 },
  { label: "Instagram Story (9:16)", width: 1080, height: 1920 },
  { label: "Facebook Post", width: 1200, height: 630 },
  { label: "Twitter Header", width: 1500, height: 500 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
  { label: "A4 Print (300 DPI)", width: 2480, height: 3508 },
  { label: "HD (1920x1080)", width: 1920, height: 1080 },
  { label: "4K (3840x2160)", width: 3840, height: 2160 },
];

export const CanvasControls = ({ fabricCanvas, onCanvasSizeChange }: CanvasControlsProps) => {
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(800);

  const handleZoomIn = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.min(zoom + 10, 400);
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom / 100);
    fabricCanvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.max(zoom - 10, 10);
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom / 100);
    fabricCanvas.renderAll();
  };

  const handleFitToScreen = () => {
    if (!fabricCanvas) return;
    
    const canvasContainer = fabricCanvas.wrapperEl?.parentElement;
    if (!canvasContainer) return;

    const containerWidth = canvasContainer.clientWidth;
    const containerHeight = canvasContainer.clientHeight;
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();

    const scaleX = containerWidth / canvasWidth;
    const scaleY = containerHeight / canvasHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9;

    const newZoom = Math.round(scale * 100);
    setZoom(newZoom);
    fabricCanvas.setZoom(scale);
    fabricCanvas.renderAll();
  };

  const handleResetView = () => {
    if (!fabricCanvas) return;
    setZoom(100);
    fabricCanvas.setZoom(1);
    fabricCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    fabricCanvas.renderAll();
  };

  const handlePanToggle = () => {
    if (!fabricCanvas) return;
    const newPanning = !isPanning;
    setIsPanning(newPanning);
    
    if (newPanning) {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = "grab";
      
      let isDragging = false;
      let lastPosX = 0;
      let lastPosY = 0;

      fabricCanvas.on("mouse:down", function(opt) {
        const evt = opt.e as MouseEvent;
        if (newPanning) {
          isDragging = true;
          fabricCanvas.defaultCursor = "grabbing";
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
      });

      fabricCanvas.on("mouse:move", function(opt) {
        const evt = opt.e as MouseEvent;
        if (isDragging && newPanning) {
          const vpt = fabricCanvas.viewportTransform;
          if (vpt) {
            vpt[4] += evt.clientX - lastPosX;
            vpt[5] += evt.clientY - lastPosY;
            fabricCanvas.requestRenderAll();
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
          }
        }
      });

      fabricCanvas.on("mouse:up", function() {
        if (newPanning) {
          fabricCanvas.defaultCursor = "grab";
          isDragging = false;
        }
      });
    } else {
      fabricCanvas.selection = true;
      fabricCanvas.defaultCursor = "default";
      fabricCanvas.off("mouse:down");
      fabricCanvas.off("mouse:move");
      fabricCanvas.off("mouse:up");
    }
  };

  const handlePresetChange = (value: string) => {
    const preset = PRESET_SIZES.find(p => p.label === value);
    if (preset && preset.width > 0) {
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
      onCanvasSizeChange(preset.width, preset.height);
    }
  };

  const handleCustomSizeApply = () => {
    onCanvasSizeChange(customWidth, customHeight);
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm border-border/50">
      <CardContent className="p-4 space-y-4">
        {/* Zoom Controls */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Zoom ({zoom}%)</Label>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              className="flex-shrink-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Slider
              value={[zoom]}
              onValueChange={(val) => {
                setZoom(val[0]);
                if (fabricCanvas) {
                  fabricCanvas.setZoom(val[0] / 100);
                  fabricCanvas.renderAll();
                }
              }}
              min={10}
              max={400}
              step={5}
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              className="flex-shrink-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Controls */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleFitToScreen}
            className="w-full"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Fit Screen
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetView}
            className="w-full"
          >
            Reset View
          </Button>
        </div>

        {/* Pan Tool */}
        <Button
          size="sm"
          variant={isPanning ? "default" : "outline"}
          onClick={handlePanToggle}
          className="w-full"
        >
          <Hand className="h-4 w-4 mr-2" />
          {isPanning ? "Pan Active" : "Pan Tool"}
        </Button>

        {/* Canvas Size Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Canvas Size</Label>
          <Select onValueChange={handlePresetChange}>
            <SelectTrigger className="w-full text-xs">
              <SelectValue placeholder="Select preset..." />
            </SelectTrigger>
            <SelectContent>
              {PRESET_SIZES.map((preset) => (
                <SelectItem key={preset.label} value={preset.label} className="text-xs">
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Size */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Width (px)</Label>
            <Input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
              className="text-xs h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height (px)</Label>
            <Input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
              className="text-xs h-8"
            />
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleCustomSizeApply}
          className="w-full"
        >
          Apply Size
        </Button>

        {/* Grid & Rulers */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant={showGrid ? "default" : "outline"}
            onClick={() => setShowGrid(!showGrid)}
            className="w-full"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            {showGrid ? "Hide Grid" : "Show Grid"}
          </Button>
          <Button
            size="sm"
            variant={showRulers ? "default" : "outline"}
            onClick={() => setShowRulers(!showRulers)}
            className="w-full"
          >
            <Ruler className="h-4 w-4 mr-2" />
            {showRulers ? "Hide Rulers" : "Show Rulers"}
          </Button>
          <Button
            size="sm"
            variant={snapToGrid ? "default" : "outline"}
            onClick={() => setSnapToGrid(!snapToGrid)}
            className="w-full"
          >
            Snap to Grid
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
