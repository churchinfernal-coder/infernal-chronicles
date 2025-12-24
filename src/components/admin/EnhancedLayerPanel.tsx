import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy, ArrowUp, ArrowDown, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode?: string;
  zIndex: number;
  isGroup?: boolean;
  children?: Layer[];
}

interface EnhancedLayerPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  fabricCanvas: FabricCanvas | null;
  onLayerSelect: (layerId: string) => void;
  onLayerVisibilityToggle: (layerId: string) => void;
  onLayerLockToggle: (layerId: string) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerDuplicate: (layerId: string) => void;
  onLayerReorder: (layerId: string, direction: "up" | "down") => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  onLayerBlendModeChange: (layerId: string, blendMode: string) => void;
  onLayerRename: (layerId: string, newName: string) => void;
}

const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
];

export const EnhancedLayerPanel = ({
  layers,
  activeLayerId,
  fabricCanvas,
  onLayerSelect,
  onLayerVisibilityToggle,
  onLayerLockToggle,
  onLayerDelete,
  onLayerDuplicate,
  onLayerReorder,
  onLayerOpacityChange,
  onLayerBlendModeChange,
  onLayerRename,
}: EnhancedLayerPanelProps) => {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleNameEditStart = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const handleNameEditEnd = (layerId: string) => {
    if (editingName.trim()) {
      onLayerRename(layerId, editingName.trim());
    }
    setEditingLayerId(null);
  };

  const toggleGroupExpand = (layerId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedGroups(newExpanded);
  };

  const renderLayer = (layer: Layer, depth: number = 0) => {
    const isActive = layer.id === activeLayerId;
    const isEditing = layer.id === editingLayerId;
    const isExpanded = expandedGroups.has(layer.id);

    return (
      <div key={layer.id}>
        <div
          className={`
            flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer
            transition-colors hover:bg-accent/50
            ${isActive ? "bg-accent" : ""}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onLayerSelect(layer.id)}
        >
          {/* Group Toggle */}
          {layer.isGroup && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleGroupExpand(layer.id);
              }}
            >
              {isExpanded ? (
                <FolderOpen className="h-3 w-3" />
              ) : (
                <Folder className="h-3 w-3" />
              )}
            </Button>
          )}

          {/* Visibility Toggle */}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onLayerVisibilityToggle(layer.id);
            }}
          >
            {layer.visible ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>

          {/* Lock Toggle */}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onLayerLockToggle(layer.id);
            }}
          >
            {layer.locked ? (
              <Lock className="h-3 w-3 text-destructive" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
          </Button>

          {/* Layer Name */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleNameEditEnd(layer.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameEditEnd(layer.id);
                  if (e.key === "Escape") setEditingLayerId(null);
                }}
                className="h-6 text-xs px-2"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className="text-xs truncate"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleNameEditStart(layer);
                }}
              >
                {layer.name}
                <span className="text-muted-foreground ml-1">({layer.type})</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onLayerDuplicate(layer.id);
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onLayerDelete(layer.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Z-Index Controls */}
          <div className="flex flex-col">
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onLayerReorder(layer.id, "up");
              }}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onLayerReorder(layer.id, "down");
              }}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Layer Properties (shown when active) */}
        {isActive && (
          <div className="px-4 py-2 space-y-2 bg-accent/20 border-l-2 border-primary">
            {/* Opacity */}
            <div className="space-y-1">
              <Label className="text-xs">Opacity: {Math.round(layer.opacity * 100)}%</Label>
              <Slider
                value={[layer.opacity * 100]}
                onValueChange={(val) => onLayerOpacityChange(layer.id, val[0] / 100)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Blend Mode */}
            <div className="space-y-1">
              <Label className="text-xs">Blend Mode</Label>
              <Select
                value={layer.blendMode || "normal"}
                onValueChange={(value) => onLayerBlendModeChange(layer.id, value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLEND_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode} className="text-xs capitalize">
                      {mode.replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Child Layers (for groups) */}
        {layer.isGroup && isExpanded && layer.children && (
          <div>
            {layer.children.map((child) => renderLayer(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-card/95 backdrop-blur-sm border-border/50">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-semibold">Layers</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-2">
          <div className="space-y-1 group">
            {layers.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                No layers yet
              </div>
            ) : (
              layers.map((layer) => renderLayer(layer))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
