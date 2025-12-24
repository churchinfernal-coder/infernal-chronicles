import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Palette, Pipette, Copy, Check } from 'lucide-react';
import { DesignEditorTooltip } from './DesignEditorTooltip';

interface AdvancedColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export function AdvancedColorPicker({ color, onChange, label = 'Color' }: AdvancedColorPickerProps) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [alpha, setAlpha] = useState(100);
  const [hexInput, setHexInput] = useState(color);
  const [rgbInput, setRgbInput] = useState({ r: 0, g: 0, b: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Parse the current color to HSL
    const parsed = parseColor(color);
    if (parsed) {
      setHue(parsed.h);
      setSaturation(parsed.s);
      setLightness(parsed.l);
      setAlpha(parsed.a * 100);
      setHexInput(color);
      
      const rgb = hslToRgb(parsed.h, parsed.s, parsed.l);
      setRgbInput(rgb);
    }
  }, [color]);

  const parseColor = (colorString: string): { h: number; s: number; l: number; a: number } | null => {
    // Basic hex to HSL conversion
    let hex = colorString.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      a: 1
    };
  };

  const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    const rgb = hslToRgb(h, s, l);
    return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)}`;
  };

  const updateColor = (newHue?: number, newSat?: number, newLight?: number, newAlpha?: number) => {
    const h = newHue ?? hue;
    const s = newSat ?? saturation;
    const l = newLight ?? lightness;
    const a = newAlpha ?? alpha;

    const hex = hslToHex(h, s, l);
    const rgb = hslToRgb(h, s, l);
    
    setHue(h);
    setSaturation(s);
    setLightness(l);
    setAlpha(a);
    setHexInput(hex);
    setRgbInput(rgb);
    
    // Return RGBA or HEX based on alpha
    if (a < 100) {
      onChange(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(a / 100).toFixed(2)})`);
    } else {
      onChange(hex);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Palette className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="hsl" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hsl" className="text-xs">HSL</TabsTrigger>
            <TabsTrigger value="rgb" className="text-xs">RGB</TabsTrigger>
            <TabsTrigger value="hex" className="text-xs">HEX</TabsTrigger>
          </TabsList>

          <TabsContent value="hsl" className="space-y-3 mt-4">
            {/* Hue */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Hue</Label>
                <span className="text-xs text-muted-foreground">{hue}°</span>
              </div>
              <Slider
                value={[hue]}
                onValueChange={([value]) => updateColor(value)}
                min={0}
                max={360}
                step={1}
                className="py-2"
                style={{
                  background: `linear-gradient(to right, 
                    hsl(0, 100%, 50%),
                    hsl(60, 100%, 50%),
                    hsl(120, 100%, 50%),
                    hsl(180, 100%, 50%),
                    hsl(240, 100%, 50%),
                    hsl(300, 100%, 50%),
                    hsl(360, 100%, 50%)
                  )`
                }}
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Saturation</Label>
                <span className="text-xs text-muted-foreground">{saturation}%</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={([value]) => updateColor(undefined, value)}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Lightness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Lightness</Label>
                <span className="text-xs text-muted-foreground">{lightness}%</span>
              </div>
              <Slider
                value={[lightness]}
                onValueChange={([value]) => updateColor(undefined, undefined, value)}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Alpha */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Opacity</Label>
                <span className="text-xs text-muted-foreground">{alpha}%</span>
              </div>
              <Slider
                value={[alpha]}
                onValueChange={([value]) => updateColor(undefined, undefined, undefined, value)}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>
          </TabsContent>

          <TabsContent value="rgb" className="space-y-3 mt-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">R</Label>
                <Input
                  type="number"
                  value={rgbInput.r}
                  onChange={(e) => {
                    const r = parseInt(e.target.value) || 0;
                    setRgbInput({ ...rgbInput, r });
                  }}
                  min={0}
                  max={255}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">G</Label>
                <Input
                  type="number"
                  value={rgbInput.g}
                  onChange={(e) => {
                    const g = parseInt(e.target.value) || 0;
                    setRgbInput({ ...rgbInput, g });
                  }}
                  min={0}
                  max={255}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">B</Label>
                <Input
                  type="number"
                  value={rgbInput.b}
                  onChange={(e) => {
                    const b = parseInt(e.target.value) || 0;
                    setRgbInput({ ...rgbInput, b });
                  }}
                  min={0}
                  max={255}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hex" className="space-y-3 mt-4">
            <div className="flex gap-2">
              <Input
                value={hexInput}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    onChange(e.target.value);
                  }
                }}
                className="h-8 text-xs font-mono"
                placeholder="#000000"
              />
              <DesignEditorTooltip content={copied ? "Copied!" : "Copy hex code"}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(hexInput)}
                  className="h-8 px-2"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </DesignEditorTooltip>
            </div>
          </TabsContent>
        </Tabs>

        {/* Color Preview */}
        <div className="space-y-2">
          <Label className="text-xs">Preview</Label>
          <div 
            className="w-full h-20 rounded-md border"
            style={{ backgroundColor: hexInput }}
          />
        </div>

        {/* Color Presets */}
        <div className="space-y-2">
          <Label className="text-xs">Quick Colors</Label>
          <div className="grid grid-cols-8 gap-1">
            {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map((preset) => (
              <button
                key={preset}
                onClick={() => onChange(preset)}
                className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                style={{ backgroundColor: preset }}
                aria-label={`Select color ${preset}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
