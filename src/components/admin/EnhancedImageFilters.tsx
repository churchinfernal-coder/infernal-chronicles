import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter, RotateCcw } from 'lucide-react';
import { DesignEditorTooltip } from './DesignEditorTooltip';

interface EnhancedImageFiltersProps {
  onApplyFilter: (filterType: string, value: number) => void;
  onResetFilters: () => void;
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

export function EnhancedImageFilters({ onApplyFilter, onResetFilters, externalFilterValues }: EnhancedImageFiltersProps) {
  const [brightness, setBrightness] = React.useState(0);
  const [contrast, setContrast] = React.useState(0);
  const [saturation, setSaturation] = React.useState(0);
  const [hue, setHue] = React.useState(0);
  const [blur, setBlur] = React.useState(0);
  const [sepia, setSepia] = React.useState(0);
  const [grayscale, setGrayscale] = React.useState(0);
  const [invert, setInvert] = React.useState(0);
  const [temperature, setTemperature] = React.useState(0);
  const [tint, setTint] = React.useState(0);
  const [vignette, setVignette] = React.useState(0);
  const [sharpen, setSharpen] = React.useState(0);

  // Apply external filter values when they change
  React.useEffect(() => {
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
      if (externalFilterValues.sepia !== undefined) {
        setSepia(externalFilterValues.sepia);
        onApplyFilter('sepia', externalFilterValues.sepia);
      }
      if (externalFilterValues.temperature !== undefined) {
        setTemperature(externalFilterValues.temperature);
        onApplyFilter('temperature', externalFilterValues.temperature);
      }
      if (externalFilterValues.tint !== undefined) {
        setTint(externalFilterValues.tint);
        onApplyFilter('tint', externalFilterValues.tint);
      }
    }
  }, [externalFilterValues]);

  const handleReset = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setHue(0);
    setBlur(0);
    setSepia(0);
    setGrayscale(0);
    setInvert(0);
    setTemperature(0);
    setTint(0);
    setVignette(0);
    setSharpen(0);
    onResetFilters();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Image Filters
          </span>
          <DesignEditorTooltip content="Reset all filters to default">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </DesignEditorTooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
            <TabsTrigger value="color" className="text-xs">Color</TabsTrigger>
            <TabsTrigger value="effects" className="text-xs">Effects</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Brightness</Label>
                <span className="text-xs text-muted-foreground">{brightness}</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={([value]) => {
                  setBrightness(value);
                  onApplyFilter('brightness', value);
                }}
                min={-100}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Contrast</Label>
                <span className="text-xs text-muted-foreground">{contrast}</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={([value]) => {
                  setContrast(value);
                  onApplyFilter('contrast', value);
                }}
                min={-100}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Saturation</Label>
                <span className="text-xs text-muted-foreground">{saturation}</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={([value]) => {
                  setSaturation(value);
                  onApplyFilter('saturation', value);
                }}
                min={-100}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Blur */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Blur</Label>
                <span className="text-xs text-muted-foreground">{blur}px</span>
              </div>
              <Slider
                value={[blur]}
                onValueChange={([value]) => {
                  setBlur(value);
                  onApplyFilter('blur', value);
                }}
                min={0}
                max={20}
                step={0.5}
                className="py-2"
              />
            </div>
          </TabsContent>

          <TabsContent value="color" className="space-y-4 mt-4">
            {/* Hue Rotation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Hue Rotation</Label>
                <span className="text-xs text-muted-foreground">{hue}°</span>
              </div>
              <Slider
                value={[hue]}
                onValueChange={([value]) => {
                  setHue(value);
                  onApplyFilter('hue', value);
                }}
                min={0}
                max={360}
                step={1}
                className="py-2"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Temperature</Label>
                <span className="text-xs text-muted-foreground">{temperature}</span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={([value]) => {
                  setTemperature(value);
                  onApplyFilter('temperature', value);
                }}
                min={-100}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Tint */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tint</Label>
                <span className="text-xs text-muted-foreground">{tint}</span>
              </div>
              <Slider
                value={[tint]}
                onValueChange={([value]) => {
                  setTint(value);
                  onApplyFilter('tint', value);
                }}
                min={-100}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Sepia */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Sepia</Label>
                <span className="text-xs text-muted-foreground">{sepia}%</span>
              </div>
              <Slider
                value={[sepia]}
                onValueChange={([value]) => {
                  setSepia(value);
                  onApplyFilter('sepia', value);
                }}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Grayscale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Grayscale</Label>
                <span className="text-xs text-muted-foreground">{grayscale}%</span>
              </div>
              <Slider
                value={[grayscale]}
                onValueChange={([value]) => {
                  setGrayscale(value);
                  onApplyFilter('grayscale', value);
                }}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>
          </TabsContent>

          <TabsContent value="effects" className="space-y-4 mt-4">
            {/* Invert */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Invert</Label>
                <span className="text-xs text-muted-foreground">{invert}%</span>
              </div>
              <Slider
                value={[invert]}
                onValueChange={([value]) => {
                  setInvert(value);
                  onApplyFilter('invert', value);
                }}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Vignette */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Vignette</Label>
                <span className="text-xs text-muted-foreground">{vignette}%</span>
              </div>
              <Slider
                value={[vignette]}
                onValueChange={([value]) => {
                  setVignette(value);
                  onApplyFilter('vignette', value);
                }}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Sharpen */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Sharpen</Label>
                <span className="text-xs text-muted-foreground">{sharpen}</span>
              </div>
              <Slider
                value={[sharpen]}
                onValueChange={([value]) => {
                  setSharpen(value);
                  onApplyFilter('sharpen', value);
                }}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            {/* Preset Filters */}
            <div className="space-y-2">
              <Label className="text-xs">Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Vintage preset
                    setSepia(40);
                    setContrast(-10);
                    setVignette(30);
                    onApplyFilter('preset', 1);
                  }}
                  className="text-xs"
                >
                  Vintage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Black & White preset
                    setGrayscale(100);
                    setContrast(20);
                    onApplyFilter('preset', 2);
                  }}
                  className="text-xs"
                >
                  B&W
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Warm preset
                    setTemperature(30);
                    setSaturation(10);
                    onApplyFilter('preset', 3);
                  }}
                  className="text-xs"
                >
                  Warm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Cool preset
                    setTemperature(-30);
                    setTint(-10);
                    onApplyFilter('preset', 4);
                  }}
                  className="text-xs"
                >
                  Cool
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
