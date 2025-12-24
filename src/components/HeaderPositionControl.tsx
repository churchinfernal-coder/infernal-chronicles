import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Maximize2 } from "lucide-react";

interface HeaderPositionControlProps {
  headerImageUrl: string;
  positionX: string;
  positionY: string;
  onPositionChange: (x: string, y: string) => void;
}

export function HeaderPositionControl({
  headerImageUrl,
  positionX,
  positionY,
  onPositionChange
}: HeaderPositionControlProps) {
  const positions = {
    x: ["left", "center", "right"],
    y: ["top", "center", "bottom"]
  };

  const getObjectPosition = () => {
    return `${positionX} ${positionY}`;
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Maximize2 className="h-5 w-5 text-primary" />
          Header Image Focus Point
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        {headerImageUrl && (
          <div className="relative">
            <Label className="text-sm text-muted-foreground mb-2 block">Preview</Label>
            <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-primary/20">
              <img 
                src={headerImageUrl} 
                alt="Header preview" 
                className="w-full h-full object-cover transition-all duration-300"
                style={{ objectPosition: getObjectPosition() }}
              />
            </div>
          </div>
        )}

        {/* Position Controls */}
        <div className="space-y-4">
          {/* Vertical Position */}
          <div>
            <Label className="text-sm font-serif mb-2 block">Vertical Focus</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={positionY === "top" ? "default" : "outline"}
                onClick={() => onPositionChange(positionX, "top")}
                className="flex-1 gap-2"
                size="sm"
              >
                <ArrowUp className="h-4 w-4" />
                Top
              </Button>
              <Button
                type="button"
                variant={positionY === "center" ? "default" : "outline"}
                onClick={() => onPositionChange(positionX, "center")}
                className="flex-1"
                size="sm"
              >
                Center
              </Button>
              <Button
                type="button"
                variant={positionY === "bottom" ? "default" : "outline"}
                onClick={() => onPositionChange(positionX, "bottom")}
                className="flex-1 gap-2"
                size="sm"
              >
                <ArrowDown className="h-4 w-4" />
                Bottom
              </Button>
            </div>
          </div>

          {/* Horizontal Position */}
          <div>
            <Label className="text-sm font-serif mb-2 block">Horizontal Focus</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={positionX === "left" ? "default" : "outline"}
                onClick={() => onPositionChange("left", positionY)}
                className="flex-1 gap-2"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Left
              </Button>
              <Button
                type="button"
                variant={positionX === "center" ? "default" : "outline"}
                onClick={() => onPositionChange("center", positionY)}
                className="flex-1"
                size="sm"
              >
                Center
              </Button>
              <Button
                type="button"
                variant={positionX === "right" ? "default" : "outline"}
                onClick={() => onPositionChange("right", positionY)}
                className="flex-1 gap-2"
                size="sm"
              >
                <ArrowRight className="h-4 w-4" />
                Right
              </Button>
            </div>
          </div>
        </div>

        {/* Current Position Display */}
        <div className="text-center text-sm text-muted-foreground font-serif">
          Current Position: <span className="text-primary font-semibold capitalize">{positionX} {positionY}</span>
        </div>
      </CardContent>
    </Card>
  );
}
