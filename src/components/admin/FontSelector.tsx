import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Type, RefreshCw } from 'lucide-react';
import { DesignEditorTooltip } from './DesignEditorTooltip';

// Popular Google Fonts categorized
const GOOGLE_FONTS = {
  'Serif': [
    'Playfair Display',
    'Merriweather',
    'Lora',
    'PT Serif',
    'Crimson Text',
    'Libre Baskerville'
  ],
  'Sans Serif': [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Raleway',
    'Nunito',
    'Work Sans'
  ],
  'Display': [
    'Bebas Neue',
    'Righteous',
    'Permanent Marker',
    'Russo One',
    'Anton',
    'Pacifico'
  ],
  'Monospace': [
    'Fira Code',
    'Source Code Pro',
    'JetBrains Mono',
    'IBM Plex Mono'
  ]
};

interface FontSelectorProps {
  selectedFont?: string;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  lineHeight?: number;
  onFontChange: (font: string) => void;
  onFontSizeChange: (size: number) => void;
  onFontWeightChange: (weight: number) => void;
  onLetterSpacingChange: (spacing: number) => void;
  onLineHeightChange: (height: number) => void;
}

export function FontSelector({
  selectedFont = 'Inter',
  fontSize = 16,
  fontWeight = 400,
  letterSpacing = 0,
  lineHeight = 1.5,
  onFontChange,
  onFontSizeChange,
  onFontWeightChange,
  onLetterSpacingChange,
  onLineHeightChange
}: FontSelectorProps) {
  const [category, setCategory] = useState<string>('Sans Serif');
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(['Inter']));

  const loadFont = async (fontFamily: string) => {
    if (loadedFonts.has(fontFamily)) return;

    try {
      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
      
      // Check if font link already exists
      const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontUrl;
        document.head.appendChild(link);
        
        await new Promise((resolve) => {
          link.onload = resolve;
        });
      }
      
      setLoadedFonts(prev => new Set([...prev, fontFamily]));
    } catch (error) {
      console.error('Failed to load font:', error);
    }
  };

  const handleFontSelect = async (font: string) => {
    await loadFont(font);
    onFontChange(font);
  };

  const resetToDefaults = () => {
    onFontChange('Inter');
    onFontSizeChange(16);
    onFontWeightChange(400);
    onLetterSpacingChange(0);
    onLineHeightChange(1.5);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Font Properties
          </span>
          <DesignEditorTooltip content="Reset all font settings to defaults">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="h-7 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </DesignEditorTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Font Category */}
        <div className="space-y-2">
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(GOOGLE_FONTS).map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <Label className="text-xs">Font Family</Label>
          <Select value={selectedFont} onValueChange={handleFontSelect}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {GOOGLE_FONTS[category as keyof typeof GOOGLE_FONTS]?.map((font) => (
                <SelectItem 
                  key={font} 
                  value={font}
                  className="text-xs"
                  style={{ fontFamily: loadedFonts.has(font) ? font : 'inherit' }}
                >
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Font Size</Label>
            <span className="text-xs text-muted-foreground">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={([value]) => onFontSizeChange(value)}
            min={8}
            max={200}
            step={1}
            className="py-2"
          />
        </div>

        {/* Font Weight */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Font Weight</Label>
            <span className="text-xs text-muted-foreground">{fontWeight}</span>
          </div>
          <Slider
            value={[fontWeight]}
            onValueChange={([value]) => onFontWeightChange(value)}
            min={100}
            max={900}
            step={100}
            className="py-2"
          />
        </div>

        {/* Letter Spacing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Letter Spacing</Label>
            <span className="text-xs text-muted-foreground">{letterSpacing}px</span>
          </div>
          <Slider
            value={[letterSpacing]}
            onValueChange={([value]) => onLetterSpacingChange(value)}
            min={-5}
            max={20}
            step={0.5}
            className="py-2"
          />
        </div>

        {/* Line Height */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Line Height</Label>
            <span className="text-xs text-muted-foreground">{lineHeight.toFixed(2)}</span>
          </div>
          <Slider
            value={[lineHeight]}
            onValueChange={([value]) => onLineHeightChange(value)}
            min={0.5}
            max={3}
            step={0.1}
            className="py-2"
          />
        </div>

        {/* Preview */}
        <div className="border rounded-md p-3 bg-muted/50">
          <p
            className="text-xs text-muted-foreground mb-2"
          >
            Preview:
          </p>
          <p
            style={{
              fontFamily: selectedFont,
              fontSize: `${fontSize}px`,
              fontWeight,
              letterSpacing: `${letterSpacing}px`,
              lineHeight
            }}
          >
            The quick brown fox jumps over the lazy dog
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
