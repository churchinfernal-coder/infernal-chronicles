import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageFiltersProps {
  onApplyFilter: (filterType: string, value?: number | any) => void;
  externalFilterValues?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
    blur?: number;
    sepia?: number;
    temperature?: number;
    tint?: number;
  };
}

export function ImageFilters({ onApplyFilter, externalFilterValues }: ImageFiltersProps) {
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);
  const [lightness, setLightness] = useState(0);
  const [blur, setBlur] = useState(0);
  
  // Levels adjustment
  const [inputShadows, setInputShadows] = useState(0);
  const [inputMidtones, setInputMidtones] = useState(128);
  const [inputHighlights, setInputHighlights] = useState(255);
  const [outputShadows, setOutputShadows] = useState(0);
  const [outputHighlights, setOutputHighlights] = useState(255);

  // Apply external filter values from AI when they change
  useEffect(() => {
    if (externalFilterValues) {
      if (externalFilterValues.brightness !== undefined) {
        setBrightness(externalFilterValues.brightness);
        onApplyFilter('brightness', externalFilterValues.brightness);
      }
      if (externalFilterValues.contrast !== undefined) {
        setContrast(externalFilterValues.contrast);
        onApplyFilter('contrast', externalFilterValues.contrast);
      }
      if (externalFilterValues.saturation !== undefined) {
        setSaturation(externalFilterValues.saturation);
        onApplyFilter('saturation', externalFilterValues.saturation);
      }
      if (externalFilterValues.hue !== undefined) {
        setHue(externalFilterValues.hue);
        onApplyFilter('hue', externalFilterValues.hue);
      }
      if (externalFilterValues.blur !== undefined) {
        setBlur(externalFilterValues.blur);
        onApplyFilter('blur', externalFilterValues.blur);
      }
    }
  }, [externalFilterValues]);

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-sm">Adjustments & Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="adjust">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="adjust">Adjust</TabsTrigger>
            <TabsTrigger value="levels">Levels</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
          </TabsList>

          <TabsContent value="adjust" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Brightness</Label>
                <span className="text-xs">{brightness}</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={(v) => setBrightness(v[0])}
                min={-100}
                max={100}
                step={1}
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onApplyFilter('brightness', brightness)}
                className="w-full"
              >
                Apply Brightness
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Contrast</Label>
                <span className="text-xs">{contrast}</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={(v) => setContrast(v[0])}
                min={-100}
                max={100}
                step={1}
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onApplyFilter('contrast', contrast)}
                className="w-full"
              >
                Apply Contrast
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Saturation</Label>
                <span className="text-xs">{saturation}</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={(v) => setSaturation(v[0])}
                min={-100}
                max={100}
                step={1}
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onApplyFilter('saturation', saturation)}
                className="w-full"
              >
                Apply Saturation
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Hue</Label>
                <span className="text-xs">{hue}°</span>
              </div>
              <Slider
                value={[hue]}
                onValueChange={(v) => setHue(v[0])}
                min={-180}
                max={180}
                step={1}
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onApplyFilter('hue', hue)}
                className="w-full"
              >
                Apply Hue
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Lightness</Label>
                <span className="text-xs">{lightness}</span>
              </div>
              <Slider
                value={[lightness]}
                onValueChange={(v) => setLightness(v[0])}
                min={-100}
                max={100}
                step={1}
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onApplyFilter('lightness', lightness)}
                className="w-full"
              >
                Apply Lightness
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Blur</Label>
                <span className="text-xs">{blur}px</span>
              </div>
              <Slider
                value={[blur]}
                onValueChange={(v) => setBlur(v[0])}
                min={0}
                max={20}
                step={1}
              />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onApplyFilter('blur', blur)}
                className="w-full"
              >
                Apply Blur
              </Button>
            </div>

            <Button 
              variant="secondary" 
              onClick={() => {
                setBrightness(0);
                setContrast(0);
                setSaturation(0);
                setHue(0);
                setLightness(0);
                setBlur(0);
                onApplyFilter('reset');
              }}
              className="w-full"
            >
              Reset All
            </Button>
          </TabsContent>

          <TabsContent value="levels" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label className="text-xs font-semibold">Input Levels</Label>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Shadows</Label>
                  <span className="text-xs">{inputShadows}</span>
                </div>
                <Slider
                  value={[inputShadows]}
                  onValueChange={(v) => setInputShadows(v[0])}
                  min={0}
                  max={255}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Midtones</Label>
                  <span className="text-xs">{inputMidtones}</span>
                </div>
                <Slider
                  value={[inputMidtones]}
                  onValueChange={(v) => setInputMidtones(v[0])}
                  min={0}
                  max={255}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Highlights</Label>
                  <span className="text-xs">{inputHighlights}</span>
                </div>
                <Slider
                  value={[inputHighlights]}
                  onValueChange={(v) => setInputHighlights(v[0])}
                  min={0}
                  max={255}
                  step={1}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold">Output Levels</Label>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Shadows</Label>
                  <span className="text-xs">{outputShadows}</span>
                </div>
                <Slider
                  value={[outputShadows]}
                  onValueChange={(v) => setOutputShadows(v[0])}
                  min={0}
                  max={255}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs">Highlights</Label>
                  <span className="text-xs">{outputHighlights}</span>
                </div>
                <Slider
                  value={[outputHighlights]}
                  onValueChange={(v) => setOutputHighlights(v[0])}
                  min={0}
                  max={255}
                  step={1}
                />
              </div>
            </div>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onApplyFilter('levels', {
                inputShadows,
                inputMidtones,
                inputHighlights,
                outputShadows,
                outputHighlights
              })}
              className="w-full"
            >
              Apply Levels
            </Button>

            <Button 
              variant="secondary" 
              onClick={() => {
                setInputShadows(0);
                setInputMidtones(128);
                setInputHighlights(255);
                setOutputShadows(0);
                setOutputHighlights(255);
                onApplyFilter('reset');
              }}
              className="w-full"
            >
              Reset Levels
            </Button>
          </TabsContent>

          <TabsContent value="filters" className="space-y-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => onApplyFilter('grayscale')}
              className="w-full"
            >
              Grayscale
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onApplyFilter('sepia')}
              className="w-full"
            >
              Sepia
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onApplyFilter('invert')}
              className="w-full"
            >
              Invert
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onApplyFilter('sharpen')}
              className="w-full"
            >
              Sharpen
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onApplyFilter('emboss')}
              className="w-full"
            >
              Emboss
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onApplyFilter('edgeDetect')}
              className="w-full"
            >
              Edge Detect
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
