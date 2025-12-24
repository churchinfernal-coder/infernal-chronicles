import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MousePointer2,
  Square,
  Circle,
  Type,
  Paintbrush,
  Eraser,
  Move,
  ZoomIn,
  ZoomOut,
  Upload,
  Download,
  Save,
  FolderOpen,
  Trash2,
  Undo,
  Redo,
  Crop,
  Lasso,
} from "lucide-react";

interface DesignEditorToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onUploadImage: (file: File) => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  fillColor: string;
  strokeColor: string;
  onFillColorChange: (color: string) => void;
  onStrokeColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
}

export function DesignEditorToolbar({
  activeTool,
  onToolChange,
  onUploadImage,
  onExport,
  onSave,
  onLoad,
  onClear,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  fillColor,
  strokeColor,
  onFillColorChange,
  onStrokeColorChange,
  brushSize,
  onBrushSizeChange,
}: DesignEditorToolbarProps) {
  const tools = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "move", icon: Move, label: "Move" },
    { id: "marquee", icon: Square, label: "Rectangle Marquee" },
    { id: "lasso", icon: Lasso, label: "Lasso Select" },
    { id: "crop", icon: Crop, label: "Crop" },
    { id: "rectangle", icon: Square, label: "Rectangle Shape" },
    { id: "circle", icon: Circle, label: "Circle Shape" },
    { id: "text", icon: Type, label: "Text" },
  ];

  return (
    <div className="flex items-center gap-2 p-4 bg-background border-b">
      {/* File Operations */}
      <div className="flex gap-1">
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onUploadImage(e.target.files[0])}
          className="hidden"
          id="upload-image"
        />
        <label htmlFor="upload-image">
          <Button variant="outline" size="sm" asChild>
            <span><Upload className="h-4 w-4" /></span>
          </Button>
        </label>
        <Button variant="outline" size="sm" onClick={onLoad}>
          <FolderOpen className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* History */}
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={onUndo}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onRedo}>
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Tools */}
      <div className="flex gap-1">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Colors */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fill-color" className="text-xs">Fill</Label>
          <div className="flex items-center gap-1">
            <Input
              id="fill-color"
              type="color"
              value={fillColor}
              onChange={(e) => onFillColorChange(e.target.value)}
              className="w-12 h-8 p-1 cursor-pointer"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="stroke-color" className="text-xs">Stroke</Label>
          <Input
            id="stroke-color"
            type="color"
            value={strokeColor}
            onChange={(e) => onStrokeColorChange(e.target.value)}
            className="w-12 h-8 p-1 cursor-pointer"
          />
        </div>
      </div>

      {/* Brush Size */}
      {(activeTool === "brush" || activeTool === "eraser") && (
        <>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center gap-2">
            <Label htmlFor="brush-size" className="text-xs">Size</Label>
            <Input
              id="brush-size"
              type="number"
              min="1"
              max="100"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              className="w-16"
            />
          </div>
        </>
      )}

      <Separator orientation="vertical" className="h-8" />

      {/* Zoom */}
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      <Button variant="destructive" size="sm" onClick={onClear}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
