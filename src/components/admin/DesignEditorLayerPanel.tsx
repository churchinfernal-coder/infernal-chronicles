import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Lock, Unlock, Trash2, ChevronUp, ChevronDown, Plus, Copy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode?: string;
  fill?: number;
}

interface DesignEditorLayerPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onLayerSelect: (id: string) => void;
  onLayerToggleVisible: (id: string) => void;
  onLayerToggleLock: (id: string) => void;
  onLayerDelete: (id: string) => void;
  onLayerOpacityChange: (id: string, opacity: number) => void;
  onLayerBlendModeChange: (id: string, mode: string) => void;
  onLayerFillChange: (id: string, fill: number) => void;
  onLayerMove: (id: string, direction: 'up' | 'down') => void;
  onLayerDuplicate: (id: string) => void;
  onAddLayer: () => void;
}

export function DesignEditorLayerPanel({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerToggleVisible,
  onLayerToggleLock,
  onLayerDelete,
  onLayerOpacityChange,
  onLayerBlendModeChange,
  onLayerFillChange,
  onLayerMove,
  onLayerDuplicate,
  onAddLayer,
}: DesignEditorLayerPanelProps) {
  const blendModes = [
    'source-over',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
  ];

  const getBlendModeLabel = (mode: string) => {
    if (mode === 'source-over') return 'Normal';
    return mode.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="w-80 border-l bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Layers</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddLayer}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4 space-y-2">
          {layers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No layers yet
            </div>
          ) : (
            layers.map((layer, index) => (
              <div
                key={layer.id}
                className={`rounded border transition-all ${
                  activeLayerId === layer.id
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "hover:bg-muted/50 border-border"
                }`}
              >
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => onLayerSelect(layer.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium truncate flex-1">
                      {layer.name}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerToggleVisible(layer.id);
                        }}
                      >
                        {layer.visible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerToggleLock(layer.id);
                        }}
                      >
                        {layer.locked ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          <Unlock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{layer.type}</span>
                </div>

                {activeLayerId === layer.id && (
                  <div className="px-3 pb-3 space-y-3 border-t pt-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Blend Mode</Label>
                      <Select
                        value={layer.blendMode || 'source-over'}
                        onValueChange={(value) => onLayerBlendModeChange(layer.id, value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {blendModes.map((mode) => (
                            <SelectItem key={mode} value={mode} className="text-xs">
                              {getBlendModeLabel(mode)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-xs">Opacity</Label>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(layer.opacity * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[layer.opacity * 100]}
                        onValueChange={(value) => {
                          onLayerOpacityChange(layer.id, value[0] / 100);
                        }}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <Label className="text-xs">Fill</Label>
                        <span className="text-xs text-muted-foreground">
                          {Math.round((layer.fill ?? 1) * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[(layer.fill ?? 1) * 100]}
                        onValueChange={(value) => {
                          onLayerFillChange(layer.id, value[0] / 100);
                        }}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="flex gap-1 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerMove(layer.id, 'up');
                        }}
                        disabled={index === layers.length - 1}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerMove(layer.id, 'down');
                        }}
                        disabled={index === 0}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerDuplicate(layer.id);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1 h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerDelete(layer.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
