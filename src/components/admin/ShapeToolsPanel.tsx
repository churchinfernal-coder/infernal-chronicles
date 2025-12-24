import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Square, Circle, Pentagon, Star, Triangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShapeToolsPanelProps {
  onAddShape: (shapeType: string, options: ShapeOptions) => void;
  fillColor: string;
  strokeColor: string;
  onFillColorChange: (color: string) => void;
  onStrokeColorChange: (color: string) => void;
}

interface ShapeOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  radius?: number;
  sides?: number;
  opacity?: number;
}

export function ShapeToolsPanel({ 
  onAddShape, 
  fillColor, 
  strokeColor, 
  onFillColorChange, 
  onStrokeColorChange 
}: ShapeToolsPanelProps) {
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shapeWidth, setShapeWidth] = useState(200);
  const [shapeHeight, setShapeHeight] = useState(150);
  const [radius, setRadius] = useState(75);
  const [polygonSides, setPolygonSides] = useState(6);
  const [opacity, setOpacity] = useState(100);

  const shapes = [
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
    { type: 'ellipse', icon: Circle, label: 'Ellipse' },
    { type: 'polygon', icon: Pentagon, label: 'Polygon' },
    { type: 'triangle', icon: Triangle, label: 'Triangle' },
    { type: 'star', icon: Star, label: 'Star' },
  ];

  const handleAddShape = (shapeType: string) => {
    const options: ShapeOptions = {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      opacity: opacity / 100,
    };

    switch (shapeType) {
      case 'rectangle':
        options.width = shapeWidth;
        options.height = shapeHeight;
        break;
      case 'circle':
        options.radius = radius;
        break;
      case 'ellipse':
        options.width = shapeWidth;
        options.height = shapeHeight;
        break;
      case 'polygon':
      case 'triangle':
      case 'star':
        options.radius = radius;
        options.sides = shapeType === 'triangle' ? 3 : polygonSides;
        break;
    }

    onAddShape(shapeType, options);
  };

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-sm">Shape Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="shapes">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shapes">Shapes</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="shapes" className="space-y-4 mt-4">
            {/* Shape Selection */}
            <div className="space-y-2">
              <Label className="text-xs">Add Shape</Label>
              <div className="grid grid-cols-3 gap-2">
                {shapes.map((shape) => {
                  const Icon = shape.icon;
                  return (
                    <Button
                      key={shape.type}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddShape(shape.type)}
                      className="flex flex-col gap-1 h-auto py-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{shape.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold">Dimensions</Label>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Width</Label>
                  <span className="text-xs">{shapeWidth}px</span>
                </div>
                <Slider
                  value={[shapeWidth]}
                  onValueChange={(v) => setShapeWidth(v[0])}
                  min={10}
                  max={500}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Height</Label>
                  <span className="text-xs">{shapeHeight}px</span>
                </div>
                <Slider
                  value={[shapeHeight]}
                  onValueChange={(v) => setShapeHeight(v[0])}
                  min={10}
                  max={500}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Radius</Label>
                  <span className="text-xs">{radius}px</span>
                </div>
                <Slider
                  value={[radius]}
                  onValueChange={(v) => setRadius(v[0])}
                  min={10}
                  max={250}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Polygon Sides</Label>
                  <span className="text-xs">{polygonSides}</span>
                </div>
                <Slider
                  value={[polygonSides]}
                  onValueChange={(v) => setPolygonSides(v[0])}
                  min={3}
                  max={12}
                  step={1}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            {/* Fill Color */}
            <div className="space-y-2">
              <Label className="text-xs">Fill Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={fillColor}
                  onChange={(e) => onFillColorChange(e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={fillColor}
                  onChange={(e) => onFillColorChange(e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Stroke Color */}
            <div className="space-y-2">
              <Label className="text-xs">Stroke Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange(e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => onStrokeColorChange(e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Stroke Width</Label>
                <span className="text-xs">{strokeWidth}px</span>
              </div>
              <Slider
                value={[strokeWidth]}
                onValueChange={(v) => setStrokeWidth(v[0])}
                min={0}
                max={20}
                step={1}
              />
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs">{opacity}%</span>
              </div>
              <Slider
                value={[opacity]}
                onValueChange={(v) => setOpacity(v[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <Label className="text-xs">Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onFillColorChange("#000000");
                    onStrokeColorChange("#000000");
                  }}
                >
                  Black
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onFillColorChange("#ffffff");
                    onStrokeColorChange("#000000");
                  }}
                >
                  White
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onFillColorChange("#ff0000");
                    onStrokeColorChange("#8b0000");
                  }}
                >
                  Red
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onFillColorChange("#0000ff");
                    onStrokeColorChange("#000080");
                  }}
                >
                  Blue
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onFillColorChange("transparent");
                    onStrokeColorChange("#000000");
                    setStrokeWidth(3);
                  }}
                >
                  Outline Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onFillColorChange("#ffd700");
                    onStrokeColorChange("#ff8c00");
                  }}
                >
                  Gold
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
