import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Download, FileImage } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ExportPanelProps {
  onExport: (format: string, quality: number, filename: string) => void;
}

export function ExportPanel({ onExport }: ExportPanelProps) {
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(100);
  const [filename, setFilename] = useState("design");

  const formats = [
    { value: "png", label: "PNG", description: "Best for transparent images" },
    { value: "jpeg", label: "JPEG", description: "Best for photos" },
    { value: "webp", label: "WEBP", description: "Modern, smaller file size" },
    { value: "svg", label: "SVG", description: "Vector format (scalable)" },
    { value: "gif", label: "GIF", description: "For simple animations" },
  ];

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileImage className="w-4 h-4" />
          Export Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filename Input */}
        <div className="space-y-2">
          <Label className="text-xs">Filename</Label>
          <Input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="design"
          />
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label className="text-xs">Export Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formats.map((fmt) => (
                <SelectItem key={fmt.value} value={fmt.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{fmt.label}</span>
                    <span className="text-xs text-muted-foreground">{fmt.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quality Slider (for JPEG, WEBP) */}
        {(format === "jpeg" || format === "webp") && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Quality</Label>
              <span className="text-xs text-muted-foreground">{quality}%</span>
            </div>
            <Slider
              value={[quality]}
              onValueChange={(v) => setQuality(v[0])}
              min={1}
              max={100}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Higher quality = larger file size
            </p>
          </div>
        )}

        {/* Format Information */}
        <div className="bg-muted/50 p-3 rounded-md space-y-1">
          <p className="text-xs font-medium">Format Details:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            {format === "png" && (
              <>
                <li>Supports transparency</li>
                <li>Lossless compression</li>
                <li>Best for graphics with sharp edges</li>
              </>
            )}
            {format === "jpeg" && (
              <>
                <li>No transparency support</li>
                <li>Lossy compression</li>
                <li>Smaller file sizes for photos</li>
              </>
            )}
            {format === "webp" && (
              <>
                <li>Supports transparency</li>
                <li>Better compression than PNG/JPEG</li>
                <li>Modern browser support</li>
              </>
            )}
            {format === "svg" && (
              <>
                <li>Vector format (infinite scaling)</li>
                <li>Best for logos and icons</li>
                <li>Limited support for complex effects</li>
              </>
            )}
            {format === "gif" && (
              <>
                <li>Supports transparency</li>
                <li>Limited to 256 colors</li>
                <li>Good for simple graphics</li>
              </>
            )}
          </ul>
        </div>

        {/* Export Button */}
        <Button 
          onClick={() => onExport(format, quality, filename)}
          className="w-full"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Export as {format.toUpperCase()}
        </Button>

        {/* Quick Export Options */}
        <div className="space-y-2">
          <Label className="text-xs">Quick Export</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("png", 100, filename)}
            >
              PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("jpeg", 90, filename)}
            >
              JPEG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("webp", 90, filename)}
            >
              WEBP
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("svg", 100, filename)}
            >
              SVG
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
