import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Sparkles, Wand2, Save, Trash2, Image as ImageIcon, User, Camera, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const styles = [
  { value: 'default', label: 'Default' },
  { value: 'realistic_human', label: '👤 Photorealistic Human' },
  { value: 'cinematic_human', label: '🎬 Cinematic Portrait' },
  { value: 'portrait', label: '📸 Professional Portrait' },
  { value: 'statue', label: '🗿 Classical Statue' },
  { value: 'avatar', label: '🎮 Avatar/Character' },
  { value: 'cartoon', label: '🎨 Cartoon' },
  { value: 'cloth', label: '🧵 Cloth/Fabric' },
  { value: 'fabric', label: '👕 Textile Pattern' },
  { value: 'realistic', label: '📷 Photorealistic' },
  { value: 'impressionist', label: '🖼️ Impressionist' },
  { value: 'abstract', label: '🌀 Abstract' },
  { value: 'cyberpunk', label: '🌃 Cyberpunk' },
  { value: 'fantasy', label: '✨ Fantasy' },
  { value: 'minimalist', label: '⬜ Minimalist' },
  { value: 'vintage', label: '📻 Vintage' },
];

const colorSchemes = [
  { value: 'default', label: 'Default' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'monochrome', label: 'Monochrome' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'neon', label: 'Neon' },
];

const compositions = [
  { value: 'default', label: 'Default' },
  { value: 'rule_of_thirds', label: 'Rule of Thirds' },
  { value: 'symmetry', label: 'Symmetrical' },
  { value: 'centered', label: 'Centered' },
  { value: 'dynamic', label: 'Dynamic' },
  { value: 'minimal', label: 'Minimal' },
];

const effectsOptions = [
  { id: 'blur', label: 'Soft Blur' },
  { id: 'sharpen', label: 'Sharpen' },
  { id: 'glow', label: 'Glow' },
  { id: 'grain', label: 'Film Grain' },
  { id: 'bokeh', label: 'Bokeh' },
];

const detailLevels = ['low', 'medium', 'high', 'ultra'];

const expressions = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'happy', label: 'Happy/Smiling' },
  { value: 'sad', label: 'Sad' },
  { value: 'angry', label: 'Angry' },
  { value: 'surprised', label: 'Surprised' },
  { value: 'confident', label: 'Confident' },
  { value: 'contemplative', label: 'Contemplative' },
  { value: 'serene', label: 'Serene' },
];

interface GeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  style: string;
  created_at: string;
}

interface HumanFeatures {
  eyeColor: string;
  hairStyle: string;
  skinTone: string;
  age: string;
  expression: string;
  clothing: string;
  background: string;
}

export default function AIImageGenerator() {
  // Admin feature toggles
  const [adminMode, setAdminMode] = useState(false);
  const [distillationEnabled, setDistillationEnabled] = useState(false);
  const [quantizationEnabled, setQuantizationEnabled] = useState(false);
  const [cachingEnabled, setCachingEnabled] = useState(true);
  const [batchingEnabled, setBatchingEnabled] = useState(false);
  const [driftDetected, setDriftDetected] = useState(false);
  const [canaryMode, setCanaryMode] = useState(false);
  const [rollbackEnabled, setRollbackEnabled] = useState(false);
  const [adversarialRobustness, setAdversarialRobustness] = useState(false);
  const [observabilityLog, setObservabilityLog] = useState<string[]>([]);

  // Detect admin role using Supabase session and has_role RPC
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' });
        setAdminMode(data === true);
      }
    })();
  }, []);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('default');
  const [colorScheme, setColorScheme] = useState('default');
  const [composition, setComposition] = useState('default');
  const [effects, setEffects] = useState<string[]>([]);
  const [detailLevel, setDetailLevel] = useState<number>(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  
  // Human feature controls
  const [humanFeatures, setHumanFeatures] = useState<HumanFeatures>({
    eyeColor: '',
    hairStyle: '',
    skinTone: '',
    age: '',
    expression: 'neutral',
    clothing: '',
    background: ''
  });
  
  const [useAdvancedHuman, setUseAdvancedHuman] = useState(false);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setIsLoadingGallery(true);
    let start = 0;
    if (window && window.performance) {
      start = performance.now();
    }
    try {
      const { data, error } = await supabase
        .from('ai_generated_images')
        .select('id,prompt,image_url,style,created_at') // minimal payload
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setGallery(data || []);
      if (window && window.performance) {
        const end = performance.now();
        console.debug(`[AIImageGenerator] Gallery load latency: ${end - start}ms`);
      }
    } catch (error: any) {
      console.error('Gallery load error:', error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleEffectToggle = (effectId: string) => {
    setEffects(prev =>
      prev.includes(effectId)
        ? prev.filter(e => e !== effectId)
        : [...prev, effectId]
    );
  };

  const handleGenerate = async (saveToDb = false) => {
    if (!prompt.trim() && !useAdvancedHuman) {
      toast.error('Please enter a prompt or use advanced human controls');
      return;
    }

    setIsGenerating(true);
    try {
      // Build enhanced prompt with human features
      let finalPrompt = prompt;
      if (useAdvancedHuman && (style === 'realistic_human' || style === 'cinematic_human' || style === 'portrait')) {
        const featureParts = [];
        if (humanFeatures.age) featureParts.push(`${humanFeatures.age} years old`);
        if (humanFeatures.eyeColor) featureParts.push(`${humanFeatures.eyeColor} eyes`);
        if (humanFeatures.hairStyle) featureParts.push(`${humanFeatures.hairStyle} hair`);
        if (humanFeatures.skinTone) featureParts.push(`${humanFeatures.skinTone} skin tone`);
        if (humanFeatures.expression && humanFeatures.expression !== 'neutral') {
          featureParts.push(`${humanFeatures.expression} expression`);
        }
        if (humanFeatures.clothing) featureParts.push(`wearing ${humanFeatures.clothing}`);
        if (humanFeatures.background) featureParts.push(`in ${humanFeatures.background}`);
        if (featureParts.length > 0) {
          finalPrompt = `A human ${featureParts.join(', ')}. ${prompt}`.trim();
        }
      }

      const { data, error } = await supabase.functions.invoke('ai-image-generator', {
        body: {
          prompt: finalPrompt,
          style,
          colorScheme,
          composition,
          effects,
          detailLevel: detailLevels[detailLevel],
          width: 1024,
          height: 1024,
          saveToDatabase: saveToDb,
          sourceImage: sourceImage || undefined
        }
      });

      // Hallucination monitoring: validate output
      let hallucinationDetected = false;
      if (data?.imageUrl) {
        // Check for suspicious output (empty, placeholder, or known bad patterns)
        if (
          typeof data.imageUrl !== 'string' ||
          data.imageUrl.trim() === '' ||
          data.imageUrl.includes('placeholder') ||
          data.imageUrl.match(/(error|fail|notfound|default)/i)
        ) {
          hallucinationDetected = true;
        }
      } else {
        hallucinationDetected = true;
      }

      if (error) {
        console.error('Function invocation error:', error);
        toast.error('Failed to generate image. Please try again.');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (hallucinationDetected) {
        toast.error('Possible hallucination detected: Output is invalid or suspicious.');
        // Log locally for audit
        console.error('[AIImageGenerator] Hallucination detected:', data);
        // Optionally, do not set image
        setGeneratedImage(null);
        setEnhancedPrompt(data?.prompt || '');
        return;
      }

      setGeneratedImage(data.imageUrl);
      setEnhancedPrompt(data.prompt);
      toast.success(saveToDb ? 'Image generated and saved!' : 'Image generated successfully!');
      if (saveToDb) {
        loadGallery();
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded!');
  };

  const handleDeleteFromGallery = async (id: string) => {
    // Optimistic UI: remove from gallery immediately
    setGallery((prev) => prev.filter((img) => img.id !== id));
    toast.success('Image deleted');
    // Track latency locally
    if (window && window.performance) {
      const start = performance.now();
      supabase
        .from('ai_generated_images')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            toast.error('Failed to delete image');
            // Optionally restore image if error
            loadGallery();
          }
          const end = performance.now();
          console.debug(`[AIImageGenerator] Delete latency: ${end - start}ms`);
        });
    } else {
      supabase
        .from('ai_generated_images')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            toast.error('Failed to delete image');
            loadGallery();
          }
        });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSourceImage(result);
      toast.success('Image uploaded! Now enter a prompt to recreate it with new design.');
    };
    reader.readAsDataURL(file);
  };

  const handleClearSourceImage = () => {
    setSourceImage(null);
    toast.info('Source image cleared');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Admin Controls - visible only to admins */}
      {adminMode && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Admin Model Controls</CardTitle>
            <CardDescription>Advanced model and deployment features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-4">
              <Checkbox id="distillation" checked={distillationEnabled} onCheckedChange={checked => setDistillationEnabled(checked === true)} />
              <label htmlFor="distillation">Distillation</label>
              <Checkbox id="quantization" checked={quantizationEnabled} onCheckedChange={checked => setQuantizationEnabled(checked === true)} />
              <label htmlFor="quantization">Quantization</label>
              <Checkbox id="caching" checked={cachingEnabled} onCheckedChange={checked => setCachingEnabled(checked === true)} />
              <label htmlFor="caching">Caching</label>
              <Checkbox id="batching" checked={batchingEnabled} onCheckedChange={checked => setBatchingEnabled(checked === true)} />
              <label htmlFor="batching">Batching</label>
              <Checkbox id="canary" checked={canaryMode} onCheckedChange={checked => setCanaryMode(checked === true)} />
              <label htmlFor="canary">Canary Deployments</label>
              <Checkbox id="rollback" checked={rollbackEnabled} onCheckedChange={checked => setRollbackEnabled(checked === true)} />
              <label htmlFor="rollback">Rollback</label>
              <Checkbox id="adversarial" checked={adversarialRobustness} onCheckedChange={checked => setAdversarialRobustness(checked === true)} />
              <label htmlFor="adversarial">Adversarial Robustness</label>
            </div>
            <div className="mt-2">
              <Label>Drift Detection:</Label>
              <span className={driftDetected ? "text-red-600 font-bold ml-2" : "text-green-600 font-bold ml-2"}>{driftDetected ? "Drift Detected" : "Stable"}</span>
            </div>
            <div className="mt-2">
              <Label>Observability Log:</Label>
              <pre className="bg-muted p-2 rounded text-xs max-h-32 overflow-auto">{observabilityLog.join('\n')}</pre>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wand2 className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Wicked Works AI Image Generator
          </h1>
        </div>
        <p className="text-muted-foreground">Transform text prompts into stunning images with AI</p>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="generator">Generate</TabsTrigger>
          <TabsTrigger value="human">Human Controls</TabsTrigger>
          <TabsTrigger value="gallery">Gallery ({gallery.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Prompt & Settings
                  </CardTitle>
                  <CardDescription>Describe the image you want to create</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">Image Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="A mystical wizard casting spells in a dark forest..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Source Image (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="source-image-upload"
                      />
                      <label htmlFor="source-image-upload" className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          asChild
                        >
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            {sourceImage ? 'Change Source Image' : 'Upload Source Image'}
                          </span>
                        </Button>
                      </label>
                      {sourceImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleClearSourceImage}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {sourceImage && (
                      <div className="relative aspect-video rounded-lg overflow-hidden border">
                        <img
                          src={sourceImage}
                          alt="Source"
                          className="w-full h-full object-contain bg-muted"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload an existing image to recreate it with AI in a new style or design
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="style">Style & Subject</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger id="style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {styles.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="colorScheme">Color Scheme</Label>
                      <Select value={colorScheme} onValueChange={setColorScheme}>
                        <SelectTrigger id="colorScheme">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colorSchemes.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="composition">Composition</Label>
                    <Select value={composition} onValueChange={setComposition}>
                      <SelectTrigger id="composition">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {compositions.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-3 block">Detail Level: {detailLevels[detailLevel].toUpperCase()}</Label>
                    <Slider
                      value={[detailLevel]}
                      onValueChange={(value) => setDetailLevel(value[0])}
                      min={0}
                      max={3}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                      <span>Ultra</span>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Artistic Effects</Label>
                    <div className="space-y-2">
                      {effectsOptions.map(effect => (
                        <div key={effect.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={effect.id}
                            checked={effects.includes(effect.id)}
                            onCheckedChange={() => handleEffectToggle(effect.id)}
                          />
                          <label htmlFor={effect.id} className="text-sm font-medium cursor-pointer">
                            {effect.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleGenerate(false)}
                      disabled={isGenerating}
                      className="flex-1"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleGenerate(true)}
                      disabled={isGenerating}
                      variant="outline"
                      size="lg"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Generate & Save
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {enhancedPrompt && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Enhanced Prompt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{enhancedPrompt}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Preview Panel */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Your generated image will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedImage ? (
                    <div className="space-y-4">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border">
                        <img
                          src={generatedImage}
                          alt="Generated"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <Button onClick={handleDownload} className="w-full" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Image
                      </Button>
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
                      <div className="text-center space-y-2">
                        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">No image generated yet</p>
                        <p className="text-sm text-muted-foreground">Enter a prompt and click Generate</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="human">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Realistic Human Controls
                </CardTitle>
                <CardDescription>
                  Fine-tune facial features, expressions, and appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 pb-4 border-b">
                  <Checkbox
                    id="useAdvanced"
                    checked={useAdvancedHuman}
                    onCheckedChange={(checked) => setUseAdvancedHuman(checked as boolean)}
                  />
                  <label htmlFor="useAdvanced" className="text-sm font-medium cursor-pointer">
                    Enable Advanced Human Controls
                  </label>
                </div>

                {useAdvancedHuman && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="eyeColor">Eye Color</Label>
                        <Input
                          id="eyeColor"
                          placeholder="e.g., blue, brown, green"
                          value={humanFeatures.eyeColor}
                          onChange={(e) => setHumanFeatures({...humanFeatures, eyeColor: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hairStyle">Hair Style</Label>
                        <Input
                          id="hairStyle"
                          placeholder="e.g., long curly, short straight"
                          value={humanFeatures.hairStyle}
                          onChange={(e) => setHumanFeatures({...humanFeatures, hairStyle: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="skinTone">Skin Tone</Label>
                        <Input
                          id="skinTone"
                          placeholder="e.g., fair, olive, dark"
                          value={humanFeatures.skinTone}
                          onChange={(e) => setHumanFeatures({...humanFeatures, skinTone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          placeholder="e.g., 25, elderly, young"
                          value={humanFeatures.age}
                          onChange={(e) => setHumanFeatures({...humanFeatures, age: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="expression">Facial Expression</Label>
                      <Select
                        value={humanFeatures.expression}
                        onValueChange={(val) => setHumanFeatures({...humanFeatures, expression: val})}
                      >
                        <SelectTrigger id="expression">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {expressions.map(exp => (
                            <SelectItem key={exp.value} value={exp.value}>
                              {exp.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="clothing">Clothing & Attire</Label>
                      <Input
                        id="clothing"
                        placeholder="e.g., formal suit, casual jeans and t-shirt"
                        value={humanFeatures.clothing}
                        onChange={(e) => setHumanFeatures({...humanFeatures, clothing: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="background">Background/Environment</Label>
                      <Input
                        id="background"
                        placeholder="e.g., modern office, outdoor park, studio"
                        value={humanFeatures.background}
                        onChange={(e) => setHumanFeatures({...humanFeatures, background: e.target.value})}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <Label className="mb-2 block text-sm text-muted-foreground">
                        💡 Tip: For best results with human portraits, select "Photorealistic Human" or "Professional Portrait" style in the main generator tab
                      </Label>
                    </div>
                  </>
                )}

                {!useAdvancedHuman && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Enable advanced controls to customize human features</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview Tips</CardTitle>
                <CardDescription>Best practices for realistic humans</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 bg-muted/50 rounded">
                  <strong className="text-primary">Style Selection:</strong>
                  <p className="text-muted-foreground mt-1">Use "Photorealistic Human" or "Cinematic Portrait" styles for best human results</p>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <strong className="text-primary">Detail Level:</strong>
                  <p className="text-muted-foreground mt-1">Set detail to "High" or "Ultra" for facial features and skin texture</p>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <strong className="text-primary">Prompting:</strong>
                  <p className="text-muted-foreground mt-1">Be specific: "30 year old woman with green eyes" works better than "person"</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded border border-amber-500/20">
                  <strong className="text-amber-600 dark:text-amber-400">⚠️ Video Creation:</strong>
                  <p className="text-muted-foreground mt-1">Video creation is currently unavailable</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Image Gallery
                  </CardTitle>
                  <CardDescription>Your saved AI-generated images</CardDescription>
                </div>
                <Button onClick={loadGallery} variant="outline" size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingGallery ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : gallery.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No images in gallery yet</p>
                  <p className="text-sm text-muted-foreground">Generate and save images to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gallery.map((img) => (
                    <Card key={img.id} className="overflow-hidden group relative">
                      <div className="aspect-square relative">
                        <img
                          src={img.image_url}
                          alt={img.prompt}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = img.image_url;
                              link.download = `${img.id}.png`;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteFromGallery(img.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(img.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
