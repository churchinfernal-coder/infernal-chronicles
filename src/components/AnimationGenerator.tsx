import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useAnimationEngine } from '@/hooks/useAnimationEngine';
import { toast } from 'sonner';

interface AnimationGeneratorProps {
  onGenerated?: (sessionId: string, frames: any[]) => void;
}

export default function AnimationGenerator({ onGenerated }: AnimationGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [background, setBackground] = useState('ritual_chamber');
  const [lighting, setLighting] = useState('dramatic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [frameCount, setFrameCount] = useState(12);
  
  const { generateAnimation, loading, progress, frames, sessionId } = useAnimationEngine();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    try {
      const result = await generateAnimation({
        prompt,
        background,
        lighting,
        aspectRatio,
        frameCount,
      });

      if (result && onGenerated) {
        onGenerated(result.sessionId, result.frames);
      }
    } catch (error) {
      console.error('Generation error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your animation..."
              className="min-h-[100px]"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Background</label>
              <Select value={background} onValueChange={setBackground} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ritual_chamber">Ritual Chamber</SelectItem>
                  <SelectItem value="infernal_throne">Infernal Throne</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Lighting</label>
              <Select value={lighting} onValueChange={setLighting} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                  <SelectItem value="ethereal">Ethereal</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="crimson">Crimson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Aspect Ratio</label>
              <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 Square</SelectItem>
                  <SelectItem value="16:9">16:9 Landscape</SelectItem>
                  <SelectItem value="9:16">9:16 Portrait</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Frame Count</label>
              <Select value={frameCount.toString()} onValueChange={(v) => setFrameCount(parseInt(v))} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 Frames</SelectItem>
                  <SelectItem value="12">12 Frames</SelectItem>
                  <SelectItem value="16">16 Frames</SelectItem>
                  <SelectItem value="24">24 Frames</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? 'Generating...' : 'Generate Animation'}
          </Button>

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Generating frame {Math.ceil((progress / 100) * frameCount)} of {frameCount}
              </p>
            </div>
          )}
        </div>
      </Card>

      {frames.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Generated Frames</h3>
          <div className="grid grid-cols-4 gap-4">
            {frames.map((frame, i) => (
              <div key={i} className="relative aspect-square">
                <img 
                  src={frame} 
                  alt={`Frame ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-border"
                />
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
          {sessionId && (
            <p className="text-xs text-muted-foreground mt-4">Session ID: {sessionId}</p>
          )}
        </Card>
      )}
    </div>
  );
}
