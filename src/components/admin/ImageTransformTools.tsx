import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Crop, Maximize2, RotateCw, FlipHorizontal, FlipVertical } from "lucide-react";

interface ImageTransformToolsProps {
  onCrop: () => void;
  onResize: (width: number, height: number) => void;
  onRotate: (angle: number) => void;
  onFlip: (direction: 'horizontal' | 'vertical') => void;
  currentWidth: number;
  currentHeight: number;
}

export function ImageTransformTools({
  onCrop,
  onResize,
  onRotate,
  onFlip,
  currentWidth,
  currentHeight,
}: ImageTransformToolsProps) {
  const [width, setWidth] = useState(currentWidth);
  const [height, setHeight] = useState(currentHeight);
  const [maintainAspect, setMaintainAspect] = useState(true);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (maintainAspect && currentWidth > 0) {
      setHeight(Math.round((newWidth / currentWidth) * currentHeight));
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (maintainAspect && currentHeight > 0) {
      setWidth(Math.round((newHeight / currentHeight) * currentWidth));
    }
  };

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-sm">Transform Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Crop */}
        <div>
          <Button 
            variant="outline" 
            onClick={onCrop}
            className="w-full"
          >
            <Crop className="h-4 w-4 mr-2" />
            Enable Crop Mode
          </Button>
        </div>

        {/* Resize */}
        <div className="space-y-2">
          <Label>Resize Image</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Height</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="maintain-aspect"
              checked={maintainAspect}
              onChange={(e) => setMaintainAspect(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="maintain-aspect" className="text-xs cursor-pointer">
              Maintain aspect ratio
            </Label>
          </div>
          <Button 
            variant="outline" 
            onClick={() => onResize(width, height)}
            className="w-full"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Apply Resize
          </Button>
        </div>

        {/* Rotate */}
        <div className="space-y-2">
          <Label>Rotate</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => onRotate(90)}
              size="sm"
            >
              <RotateCw className="h-4 w-4 mr-1" />
              90° CW
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onRotate(-90)}
              size="sm"
            >
              <RotateCw className="h-4 w-4 mr-1 scale-x-[-1]" />
              90° CCW
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onRotate(180)}
              size="sm"
              className="col-span-2"
            >
              180°
            </Button>
          </div>
        </div>

        {/* Flip */}
        <div className="space-y-2">
          <Label>Flip</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => onFlip('horizontal')}
              size="sm"
            >
              <FlipHorizontal className="h-4 w-4 mr-1" />
              Horizontal
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onFlip('vertical')}
              size="sm"
            >
              <FlipVertical className="h-4 w-4 mr-1" />
              Vertical
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
