import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdvancedBrushPanelProps {
  activeTool: string;
  brushSize: number;
  brushHardness: number;
  brushOpacity: number;
  onBrushSizeChange: (size: number) => void;
  onBrushHardnessChange: (hardness: number) => void;
  onBrushOpacityChange: (opacity: number) => void;
  onToolActivate: (tool: 'brush' | 'eraser' | 'clone' | 'healing') => void;
  cloneSourceX?: number;
  cloneSourceY?: number;
  onSetCloneSource: () => void;
}

export function AdvancedBrushPanel({
  activeTool,
  brushSize,
  brushHardness,
  brushOpacity,
  onBrushSizeChange,
  onBrushHardnessChange,
  onBrushOpacityChange,
  onToolActivate,
  cloneSourceX,
  cloneSourceY,
  onSetCloneSource,
}: AdvancedBrushPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Advanced Brush Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTool} onValueChange={(v) => onToolActivate(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="brush">Brush</TabsTrigger>
            <TabsTrigger value="eraser">Eraser</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-2 mt-2">
            <TabsTrigger value="clone">Clone</TabsTrigger>
            <TabsTrigger value="healing">Healing</TabsTrigger>
          </TabsList>

          {/* Brush Settings */}
          <TabsContent value="brush" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Brush Size</Label>
                <span className="text-xs">{brushSize}px</span>
              </div>
              <Slider
                value={[brushSize]}
                onValueChange={(v) => onBrushSizeChange(v[0])}
                min={1}
                max={200}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Hardness</Label>
                <span className="text-xs">{brushHardness}%</span>
              </div>
              <Slider
                value={[brushHardness]}
                onValueChange={(v) => onBrushHardnessChange(v[0])}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                0% = Soft edges, 100% = Hard edges
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs">{brushOpacity}%</span>
              </div>
              <Slider
                value={[brushOpacity]}
                onValueChange={(v) => onBrushOpacityChange(v[0])}
                min={1}
                max={100}
                step={1}
              />
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Click and drag to paint on the canvas
              </p>
            </div>
          </TabsContent>

          {/* Eraser Settings */}
          <TabsContent value="eraser" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Eraser Size</Label>
                <span className="text-xs">{brushSize}px</span>
              </div>
              <Slider
                value={[brushSize]}
                onValueChange={(v) => onBrushSizeChange(v[0])}
                min={1}
                max={200}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Hardness</Label>
                <span className="text-xs">{brushHardness}%</span>
              </div>
              <Slider
                value={[brushHardness]}
                onValueChange={(v) => onBrushHardnessChange(v[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs">{brushOpacity}%</span>
              </div>
              <Slider
                value={[brushOpacity]}
                onValueChange={(v) => onBrushOpacityChange(v[0])}
                min={1}
                max={100}
                step={1}
              />
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Click and drag to erase parts of the image
              </p>
            </div>
          </TabsContent>

          {/* Clone Stamp Settings */}
          <TabsContent value="clone" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Clone Brush Size</Label>
                <span className="text-xs">{brushSize}px</span>
              </div>
              <Slider
                value={[brushSize]}
                onValueChange={(v) => onBrushSizeChange(v[0])}
                min={10}
                max={200}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs">{brushOpacity}%</span>
              </div>
              <Slider
                value={[brushOpacity]}
                onValueChange={(v) => onBrushOpacityChange(v[0])}
                min={1}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Clone Source</Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onSetCloneSource}
              >
                Set Clone Source (Alt+Click)
              </Button>
              {cloneSourceX !== undefined && cloneSourceY !== undefined && (
                <p className="text-xs text-green-600">
                  Source set at: ({Math.round(cloneSourceX)}, {Math.round(cloneSourceY)})
                </p>
              )}
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
              <p><strong>1.</strong> Alt+Click to set clone source</p>
              <p><strong>2.</strong> Click and drag to paint cloned pixels</p>
              <p>The source point moves relative to your brush</p>
            </div>
          </TabsContent>

          {/* Healing Brush Settings */}
          <TabsContent value="healing" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Healing Brush Size</Label>
                <span className="text-xs">{brushSize}px</span>
              </div>
              <Slider
                value={[brushSize]}
                onValueChange={(v) => onBrushSizeChange(v[0])}
                min={10}
                max={150}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Blend Strength</Label>
                <span className="text-xs">{brushOpacity}%</span>
              </div>
              <Slider
                value={[brushOpacity]}
                onValueChange={(v) => onBrushOpacityChange(v[0])}
                min={1}
                max={100}
                step={1}
              />
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
              <p><strong>Use:</strong> Click and drag over blemishes or imperfections</p>
              <p>The tool automatically samples nearby pixels and blends them</p>
              <p><strong>Best for:</strong> Removing spots, wrinkles, and small defects</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
