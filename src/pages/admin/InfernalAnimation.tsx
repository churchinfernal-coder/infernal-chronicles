import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Play, Image as ImageIcon } from "lucide-react";

export default function InfernalAnimation() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const ANIMATION_PROMPT = `Create a full-body animation of a realistic infernal entity seated in a meditative pose. The figure has a humanoid muscular body, goat-like head with large curved horns, and wings extended behind. The body is covered in glowing tattoos and runes that pulse subtly. Animate the following:

- Breathing motion: chest rises and falls slowly
- Wing twitch: slight movement of wings every few seconds
- Eye glow: eyes pulse with red light in sync with runes
- Finger movement: subtle flexing of fingers resting on knees
- Background: ritual circle glows and rotates slowly
- Lighting: dramatic, focused on face, chest, and wings
- Camera: slow 360° pan around the seated figure
- Frame count: 24 frames minimum for smooth loop
- Aspect ratio: square (1:1)
- Style: photorealistic, cinematic, crimson-on-black palette
- No stylization, no cartoon logic, no compression

Output must be uncompressed PNG sequence or sovereign MP4. No watermark. No external dependencies. Asset must be deployable into \`/assets/animations/infernal-seated/\`.
`;

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setFrames([]);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to generate animations");
        return;
      }

      // Create animation session
      const { data: session, error: sessionError } = await supabase
        .from('animation_sessions')
        .insert({
          user_id: user.id,
          prompt: ANIMATION_PROMPT,
          frame_count: 24,
          status: 'pending',
          generation_params: {
            type: 'animation',
            style: 'cinematic_realism',
            background: 'pure_black',
            lighting: 'dramatic',
            pose: 'meditative',
            aspectRatio: '1:1'
          }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // Generate animation frames
      const { data, error } = await supabase.functions.invoke('ai-cinematic-generate', {
        body: {
          prompt: ANIMATION_PROMPT,
          type: 'animation',
          style: 'cinematic_realism',
          background: 'pure_black',
          lighting: 'dramatic',
          pose: 'walk',
          expression: '',
          frameCount: 24,
          aspectRatio: '1:1'
        }
      });

      if (error) throw error;

      if (data && data.frames) {
        setFrames(data.frames);
        
        // Update session with frames
        await supabase
          .from('animation_sessions')
          .update({
            frames: data.frames,
            status: 'completed'
          })
          .eq('id', session.id);

        toast.success(`Animation generated! ${data.frames.length} frames ready`);
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate animation');
      
      if (sessionId) {
        await supabase
          .from('animation_sessions')
          .update({ status: 'failed' })
          .eq('id', sessionId);
      }
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  };

  const downloadFrames = () => {
    frames.forEach((frame, index) => {
      const link = document.createElement('a');
      link.href = frame;
      link.download = `infernal-seated-${String(index + 1).padStart(3, '0')}.png`;
      link.click();
    });
    toast.success('Downloading all frames as PNG sequence');
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <ImageIcon className="h-8 w-8 text-primary" />
            Infernal Entity Animation Generator
          </CardTitle>
          <CardDescription>
            Generate 24-frame photorealistic animation of seated infernal entity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Display */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Animation Specifications:</h3>
            <pre className="text-xs whitespace-pre-wrap font-mono">{ANIMATION_PROMPT}</pre>
          </div>

          {/* Generation Controls */}
          <div className="flex gap-4">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
              className="flex-1"
            >
              {isGenerating ? (
                <>Generating... {Math.round(progress)}%</>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Generate 24 Frames
                </>
              )}
            </Button>

            {frames.length > 0 && (
              <Button 
                onClick={downloadFrames}
                variant="outline"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Download PNG Sequence
              </Button>
            )}
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Generating frames... This may take several minutes.
              </p>
            </div>
          )}

          {/* Frame Preview Grid */}
          {frames.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Generated Frames ({frames.length}/24)
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {frames.map((frame, index) => (
                  <div 
                    key={index}
                    className="aspect-square border border-primary/20 rounded overflow-hidden relative group"
                  >
                    <img 
                      src={frame} 
                      alt={`Frame ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-mono">
                        #{String(index + 1).padStart(3, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2 text-sm">Deployment Instructions:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Click "Generate 24 Frames" to start animation generation</li>
              <li>Wait for all frames to complete (approx. 2-3 minutes)</li>
              <li>Download PNG sequence using the download button</li>
              <li>Frames will be named: infernal-seated-001.png through infernal-seated-024.png</li>
              <li>Deploy to <code className="bg-muted px-1 rounded">/public/assets/animations/infernal-seated/</code></li>
              <li>Use in your app or convert to MP4 using ffmpeg</li>
            </ol>
          </div>

          {/* API Key Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>⚠️ API Key Required:</strong> Make sure you've added <code>OPENAI_API_KEY</code> to your Supabase secrets.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
