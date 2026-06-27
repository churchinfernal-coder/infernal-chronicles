import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Film, Image, Loader2, Play, Square, Upload, Save, Clapperboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CinematicEngine() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<"image" | "animation">("image");
  const [style, setStyle] = useState("cinematic_realism");
  const [background, setBackground] = useState("pure_black");
  const [lighting, setLighting] = useState("dramatic");
  const [pose, setPose] = useState("");
  const [expression, setExpression] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [frameCount, setFrameCount] = useState(12);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Enter a prompt to generate");
      return;
    }

    setGenerating(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-cinematic-generate", {
        body: {
          prompt,
          type,
          style,
          background,
          lighting,
          pose: type === "animation" ? pose : undefined,
          expression: type === "animation" ? expression : undefined,
          frameCount: type === "animation" ? frameCount : undefined,
          aspectRatio,
        },
      });

      if (error) throw error;

      setResult(data);
      toast.success(type === "animation" ? "Animation generated" : "Image generated");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const playAnimation = () => {
    if (!result?.frames) return;
    
    setPlaying(true);
    let frame = 0;
    
    const interval = setInterval(() => {
      frame++;
      if (frame >= result.frames.length) {
        frame = 0;
        setPlaying(false);
        clearInterval(interval);
      }
      setCurrentFrame(frame);
    }, 100); // 10 FPS
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const downloadAllFrames = () => {
    if (!result?.frames) return;
    
    result.frames.forEach((frame: string, index: number) => {
      setTimeout(() => {
        downloadImage(frame, `frame_${String(index + 1).padStart(4, "0")}.png`);
      }, index * 500);
    });
    
    toast.success(`Downloading ${result.frames.length} frames...`);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('design-editor')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('design-editor')
        .getPublicUrl(fileName);

      setResult({
        type: 'image',
        imageUrl: publicUrl,
        uploaded: true
      });

      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveToLibrary = async () => {
    if (!result) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (result.type === 'image') {
        const { error } = await supabase
          .from('ai_generated_images')
          .insert({
            user_id: user.id,
            prompt: result.uploaded ? 'Uploaded image' : prompt,
            image_url: result.imageUrl,
            style: result.uploaded ? 'uploaded' : style,
            width: 1024,
            height: 1024
          });

        if (error) throw error;
        
        // Mark as saved
        setResult({ ...result, saved: true });
        toast.success('Image saved to library successfully!');
      } else if (result.type === 'animation' && result.sessionId) {
        toast.success('Animation already saved to sessions');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save to library');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">🩸 Cinematic Image + Animation Engine</h1>
          <p className="text-muted-foreground mt-2">
            Sovereign photorealism and animation. Crimson-on-black. Full fidelity.
          </p>
        </div>
        <Button onClick={() => navigate('/super-admin?tab=frame-manager')} variant="secondary">
          <Clapperboard className="mr-2 h-4 w-4" />
          Open Frame Manager
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Control Panel */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              Control Panel
            </CardTitle>
            <CardDescription>Configure your sovereign visual asset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={type} onValueChange={(v) => setType(v as "image" | "animation")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="animation" className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Animation
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="A sovereign occultist with crimson robes..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Background</Label>
                <Select value={background} onValueChange={setBackground}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pure_black">Pure Black</SelectItem>
                    <SelectItem value="ritual_chamber">Ritual Chamber</SelectItem>
                    <SelectItem value="forest">Dark Forest</SelectItem>
                    <SelectItem value="throne_room">Throne Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Lighting</Label>
                <Select value={lighting} onValueChange={setLighting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                    <SelectItem value="ritual">Ritual Candlelight</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="throne">Throne Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">Square (1:1)</SelectItem>
                  <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                  <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                  <SelectItem value="4:3">Classic (4:3)</SelectItem>
                  <SelectItem value="3:4">Tall (3:4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === "animation" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pose/Movement</Label>
                    <Select value={pose} onValueChange={setPose}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="idle">Idle</SelectItem>
                        <SelectItem value="walk">Walk</SelectItem>
                        <SelectItem value="cast">Spellcast</SelectItem>
                        <SelectItem value="gesture">Gesture</SelectItem>
                        <SelectItem value="summon">Summon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Expression</Label>
                    <Select value={expression} onValueChange={setExpression}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expression" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="blink">Blink</SelectItem>
                        <SelectItem value="smirk">Smirk</SelectItem>
                        <SelectItem value="gaze">Gaze Shift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Frame Count: {frameCount}</Label>
                  <Slider
                    value={[frameCount]}
                    onValueChange={(v) => setFrameCount(v[0])}
                    min={4}
                    max={24}
                    step={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    More frames = smoother animation but longer generation time
                  </p>
                </div>
              </>
            )}

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {type === "animation" ? <Film className="mr-2 h-4 w-4" /> : <Image className="mr-2 h-4 w-4" />}
                  Generate {type === "animation" ? "Animation" : "Image"}
                </>
              )}
            </Button>

            {type === "image" && (
              <div className="space-y-2">
                <Label htmlFor="upload" className="text-sm text-muted-foreground">
                  Or upload existing image
                </Label>
                <div className="relative">
                  <Input
                    id="upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {result
                ? type === "animation"
                  ? `${result.frames?.length || 0} frames generated`
                  : "Image ready"
                : "Generate to see results"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generating && (
              <div className="flex items-center justify-center h-96 bg-black/50 rounded-lg">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground">
                    {type === "animation" ? "Generating animation frames..." : "Generating image..."}
                  </p>
                </div>
              </div>
            )}

            {!generating && result && result.type === "image" && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <img
                    src={result.imageUrl}
                    alt="Generated"
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadImage(result.imageUrl, "sovereign_image.png")}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    onClick={saveToLibrary}
                    variant={result.saved ? "outline" : "secondary"}
                    className="flex-1"
                    disabled={result.saved}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {result.saved ? 'Saved ✓' : 'Save to Library'}
                  </Button>
                </div>
                {result.uploaded && (
                  <p className="text-xs text-center text-muted-foreground">
                    Uploaded image ready to save or download
                  </p>
                )}
                {result.saved && (
                  <p className="text-xs text-center text-green-500">
                    Image saved to your library successfully
                  </p>
                )}
              </div>
            )}

            {!generating && result && result.type === "animation" && result.frames && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <img
                    src={result.frames[currentFrame] || result.frames[0]}
                    alt={`Frame ${currentFrame + 1}`}
                    className="w-full h-auto"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/80 rounded px-3 py-2 text-sm text-white">
                    Frame {currentFrame + 1} / {result.frames.length}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!playing ? (
                    <Button onClick={playAnimation} className="flex-1">
                      <Play className="mr-2 h-4 w-4" />
                      Play
                    </Button>
                  ) : (
                    <Button onClick={() => setPlaying(false)} variant="secondary" className="flex-1">
                      <Square className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadAllFrames} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download Frames
                  </Button>
                  <Button
                    onClick={saveToLibrary}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Saved to Sessions
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Frames download individually. Compile with external tools for video.
                </p>
              </div>
            )}

            {!generating && !result && (
              <div className="flex items-center justify-center h-96 border-2 border-dashed border-border rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configure settings and generate</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-card/50">
        <CardHeader>
          <CardTitle className="text-primary">🩸 Sovereign Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">✓ Photorealistic fidelity</p>
              <p className="text-muted-foreground">8K detail, anatomical accuracy</p>
            </div>
            <div>
              <p className="font-semibold">✓ Cinematic lighting</p>
              <p className="text-muted-foreground">Professional grade shadows & depth</p>
            </div>
            <div>
              <p className="font-semibold">✓ Brand consistency</p>
              <p className="text-muted-foreground">Crimson-on-black, infernal mysticism</p>
            </div>
            <div>
              <p className="font-semibold">✓ Animation support</p>
              <p className="text-muted-foreground">Frame-by-frame, smooth transitions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
