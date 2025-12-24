import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface SelectionToolsPanelProps {
  onCropSelection: () => void;
  onDeleteSelection: () => void;
  onExtractSelection: () => void;
  onInvertSelection: () => void;
  featherRadius: number;
  onFeatherChange: (value: number) => void;
}

export function SelectionToolsPanel({
  onCropSelection,
  onDeleteSelection,
  onExtractSelection,
  onInvertSelection,
  featherRadius,
  onFeatherChange,
}: SelectionToolsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Selection Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs">Feather Radius</Label>
            <span className="text-xs">{featherRadius}px</span>
          </div>
          <Slider
            value={[featherRadius]}
            onValueChange={(v) => onFeatherChange(v[0])}
            min={0}
            max={50}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Selection Actions</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCropSelection}
            >
              Crop to Selection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExtractSelection}
            >
              Extract
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteSelection}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onInvertSelection}
            >
              Invert
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p><strong>Marquee:</strong> Click and drag to select rectangular area</p>
          <p><strong>Lasso:</strong> Draw freehand selection path</p>
          <p><strong>Tips:</strong> Hold Shift for square/constrained selection</p>
        </div>
      </CardContent>
    </Card>
  );
}
