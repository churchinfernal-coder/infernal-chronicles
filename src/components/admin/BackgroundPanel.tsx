import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BackgroundPanelProps {
  onSetBackground: (type: string, value: string) => void;
}

export function BackgroundPanel({ onSetBackground }: BackgroundPanelProps) {
  const gradients = [
    { name: 'Sunset', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Ocean', value: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)' },
    { name: 'Fire', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Forest', value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
    { name: 'Night', value: 'linear-gradient(135deg, #000000 0%, #434343 100%)' },
    { name: 'Dawn', value: 'linear-gradient(135deg, #F4D03F 0%, #16A085 100%)' },
  ];

  const patterns = [
    { name: 'Dots', value: 'radial-gradient(circle, #000 1px, transparent 1px)', size: '20px 20px' },
    { name: 'Grid', value: 'linear-gradient(#ddd 1px, transparent 1px), linear-gradient(90deg, #ddd 1px, transparent 1px)', size: '20px 20px' },
    { name: 'Diagonal', value: 'repeating-linear-gradient(45deg, #f0f0f0 0px, #f0f0f0 10px, #e0e0e0 10px, #e0e0e0 20px)', size: 'auto' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Background</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="solid">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="solid">Solid</TabsTrigger>
            <TabsTrigger value="gradient">Gradient</TabsTrigger>
            <TabsTrigger value="pattern">Pattern</TabsTrigger>
          </TabsList>

          <TabsContent value="solid" className="space-y-2 mt-3">
            <Label className="text-xs">Color</Label>
            <Input
              type="color"
              onChange={(e) => onSetBackground('solid', e.target.value)}
              className="w-full h-10 cursor-pointer"
            />
            <div className="grid grid-cols-4 gap-2 mt-2">
              {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map((color) => (
                <button
                  key={color}
                  className="w-full aspect-square rounded border-2 hover:border-primary"
                  style={{ backgroundColor: color }}
                  onClick={() => onSetBackground('solid', color)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gradient" className="space-y-2 mt-3">
            <div className="grid grid-cols-2 gap-2">
              {gradients.map((gradient) => (
                <Button
                  key={gradient.name}
                  variant="outline"
                  className="h-20 p-0 overflow-hidden"
                  onClick={() => onSetBackground('gradient', gradient.value)}
                >
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-semibold text-xs"
                    style={{ background: gradient.value }}
                  >
                    {gradient.name}
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pattern" className="space-y-2 mt-3">
            <div className="space-y-2">
              {patterns.map((pattern) => (
                <Button
                  key={pattern.name}
                  variant="outline"
                  className="w-full h-16 p-0 overflow-hidden"
                  onClick={() => onSetBackground('pattern', pattern.value)}
                >
                  <div
                    className="w-full h-full flex items-center justify-center font-semibold text-xs"
                    style={{
                      backgroundImage: pattern.value,
                      backgroundSize: pattern.size,
                    }}
                  >
                    {pattern.name}
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
