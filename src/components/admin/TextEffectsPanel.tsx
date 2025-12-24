import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TextEffectsPanelProps {
  onUpdateText: (options: TextOptions) => void;
  onAddText?: () => void;
}

interface TextOptions {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: string;
  textTransform?: string;
  shadow?: boolean;
  stroke?: boolean;
  strokeWidth?: number;
  textContent?: string;
}

export function TextEffectsPanel({ onUpdateText, onAddText }: TextEffectsPanelProps) {
  const [fontSize, setFontSize] = useState(32);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [textContent, setTextContent] = useState("");

  const fonts = [
    { name: 'Arial', family: 'Arial, sans-serif' },
    { name: 'Helvetica', family: 'Helvetica, sans-serif' },
    { name: 'Times New Roman', family: 'Times New Roman, serif' },
    { name: 'Georgia', family: 'Georgia, serif' },
    { name: 'Courier New', family: 'Courier New, monospace' },
    { name: 'Verdana', family: 'Verdana, sans-serif' },
    { name: 'Impact', family: 'Impact, sans-serif' },
    { name: 'Comic Sans MS', family: 'Comic Sans MS, cursive' },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Open Sans', family: 'Open Sans, sans-serif' },
    { name: 'Lora', family: 'Lora, serif' },
    { name: 'Raleway', family: 'Raleway, sans-serif' },
    { name: 'Merriweather', family: 'Merriweather, serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' },
    { name: 'Oswald', family: 'Oswald, sans-serif' },
    { name: 'Playfair Display', family: 'Playfair Display, serif' },
    { name: 'Dancing Script', family: 'Dancing Script, cursive' },
    { name: 'Pacifico', family: 'Pacifico, cursive' },
    { name: 'Bebas Neue', family: 'Bebas Neue, cursive' },
    { name: 'Anton', family: 'Anton, sans-serif' },
    { name: 'Roboto Mono', family: 'Roboto Mono, monospace' },
    { name: 'Cinzel', family: 'Cinzel, serif' },
  ];

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-sm">Text Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            {/* Add Text Button */}
            {onAddText && (
              <Button onClick={onAddText} className="w-full" variant="default">
                Add New Text Layer
              </Button>
            )}

            {/* Edit Text Content */}
            <div className="space-y-2">
              <Label className="text-xs">Edit Text</Label>
              <Input
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter text content..."
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onUpdateText({ textContent })}
              >
                Update Content
              </Button>
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <Label className="text-xs">Font Family</Label>
              <ScrollArea className="h-48">
                <Select onValueChange={(value) => onUpdateText({ fontFamily: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {fonts.map((font) => (
                      <SelectItem key={font.name} value={font.family} style={{ fontFamily: font.family }}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ScrollArea>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Font Size</Label>
                <span className="text-xs">{fontSize}px</span>
              </div>
              <Slider
                value={[fontSize]}
                onValueChange={(v) => {
                  setFontSize(v[0]);
                  onUpdateText({ fontSize: v[0] });
                }}
                min={8}
                max={200}
                step={1}
              />
            </div>

            {/* Text Align */}
            <div className="space-y-2">
              <Label className="text-xs">Alignment</Label>
              <div className="grid grid-cols-4 gap-1">
                {['left', 'center', 'right', 'justify'].map((align) => (
                  <Button
                    key={align}
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateText({ textAlign: align })}
                  >
                    {align.charAt(0).toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Line Height</Label>
                <span className="text-xs">{lineHeight.toFixed(1)}</span>
              </div>
              <Slider
                value={[lineHeight]}
                onValueChange={(v) => {
                  setLineHeight(v[0]);
                  onUpdateText({ lineHeight: v[0] });
                }}
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>

            {/* Letter Spacing */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Letter Spacing</Label>
                <span className="text-xs">{letterSpacing}px</span>
              </div>
              <Slider
                value={[letterSpacing]}
                onValueChange={(v) => {
                  setLetterSpacing(v[0]);
                  onUpdateText({ letterSpacing: v[0] });
                }}
                min={-5}
                max={20}
                step={1}
              />
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            {/* Font Weight */}
            <div className="space-y-2">
              <Label className="text-xs">Font Weight</Label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'Light', value: '300' },
                  { label: 'Regular', value: 'normal' },
                  { label: 'Medium', value: '500' },
                  { label: 'Semibold', value: '600' },
                  { label: 'Bold', value: 'bold' },
                  { label: 'Black', value: '900' },
                ].map((weight) => (
                  <Button
                    key={weight.value}
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateText({ fontWeight: weight.value })}
                    className="text-xs"
                  >
                    {weight.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Font Style */}
            <div className="space-y-2">
              <Label className="text-xs">Font Style</Label>
              <div className="grid grid-cols-3 gap-1">
                {['normal', 'italic', 'oblique'].map((style) => (
                  <Button
                    key={style}
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateText({ fontStyle: style })}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Text Decoration */}
            <div className="space-y-2">
              <Label className="text-xs">Text Decoration</Label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'None', value: 'none' },
                  { label: 'Underline', value: 'underline' },
                  { label: 'Overline', value: 'overline' },
                  { label: 'Line-through', value: 'line-through' },
                ].map((decoration) => (
                  <Button
                    key={decoration.value}
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateText({ textDecoration: decoration.value })}
                    className="text-xs"
                  >
                    {decoration.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Text Transform */}
            <div className="space-y-2">
              <Label className="text-xs">Text Transform</Label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'None', value: 'none' },
                  { label: 'Uppercase', value: 'uppercase' },
                  { label: 'Lowercase', value: 'lowercase' },
                  { label: 'Capitalize', value: 'capitalize' },
                ].map((transform) => (
                  <Button
                    key={transform.value}
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateText({ textTransform: transform.value })}
                    className="text-xs"
                  >
                    {transform.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Effects */}
            <div className="space-y-2">
              <Label className="text-xs">Effects</Label>
              <div className="space-y-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onUpdateText({ shadow: true })}
                >
                  Add Shadow
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onUpdateText({ stroke: true, strokeWidth })}
                  >
                    Add Stroke
                  </Button>
                  <Input
                    type="number"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-16"
                    min={1}
                    max={10}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
