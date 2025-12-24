import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Flame, Skull, Eye, Moon, Star, Hexagon, Pentagon, Circle,
  Square, Triangle, Sparkles, Zap, Save, Share2, RotateCw,
  Eraser, Plus, Minus, Layers, Wand2, Minus as LineIcon, Home, Book, Users
} from "lucide-react";

interface SigilLayer {
  id: string;
  type: "symbol" | "text" | "shape" | "seal";
  content: any;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
  color: string;
  x2?: number;
  y2?: number;
  lineWidth?: number;
}

interface AdvancedSigilCreatorProps {
  userId: string;
  onSave?: () => void;
}

const OCCULT_SYMBOLS = [
  { id: "pentagram", icon: "⛤", name: "Pentagram" },
  { id: "pentacle", icon: "⛧", name: "Inverted Pentagram" },
  { id: "hexagram", icon: "✡", name: "Hexagram" },
  { id: "leviathan", icon: "☿", name: "Leviathan Cross" },
  { id: "cross", icon: "☩", name: "Jerusalem Cross" },
  { id: "ankh", icon: "☥", name: "Ankh" },
  { id: "skull", icon: "☠", name: "Skull & Crossbones" },
  { id: "eye", icon: "👁", name: "All-Seeing Eye" },
  { id: "infinity", icon: "∞", name: "Infinity" },
  { id: "omega", icon: "Ω", name: "Omega" },
  { id: "alpha", icon: "Α", name: "Alpha" },
  { id: "chi-rho", icon: "☧", name: "Chi Rho" },
];

const ALCHEMY_SYMBOLS = [
  { id: "fire", icon: "🜂", name: "Fire" },
  { id: "water", icon: "🜄", name: "Water" },
  { id: "air", icon: "🜁", name: "Air" },
  { id: "earth", icon: "🜃", name: "Earth" },
  { id: "gold", icon: "☉", name: "Gold/Sun" },
  { id: "silver", icon: "☽", name: "Silver/Moon" },
  { id: "mercury-metal", icon: "☿", name: "Mercury" },
  { id: "copper", icon: "♀", name: "Copper/Venus" },
  { id: "iron", icon: "♂", name: "Iron/Mars" },
  { id: "tin", icon: "♃", name: "Tin/Jupiter" },
  { id: "lead", icon: "♄", name: "Lead/Saturn" },
  { id: "sulfur", icon: "🜍", name: "Sulfur" },
  { id: "salt", icon: "🜔", name: "Salt" },
  { id: "antimony", icon: "♁", name: "Antimony" },
];

const ZODIAC_SYMBOLS = [
  { id: "aries", icon: "♈", name: "Aries" },
  { id: "taurus", icon: "♉", name: "Taurus" },
  { id: "gemini", icon: "♊", name: "Gemini" },
  { id: "cancer", icon: "♋", name: "Cancer" },
  { id: "leo", icon: "♌", name: "Leo" },
  { id: "virgo", icon: "♍", name: "Virgo" },
  { id: "libra", icon: "♎", name: "Libra" },
  { id: "scorpio", icon: "♏", name: "Scorpio" },
  { id: "sagittarius", icon: "♐", name: "Sagittarius" },
  { id: "capricorn", icon: "♑", name: "Capricorn" },
  { id: "aquarius", icon: "♒", name: "Aquarius" },
  { id: "pisces", icon: "♓", name: "Pisces" },
];

const MASONIC_SYMBOLS = [
  { id: "square-compass", icon: "☤", name: "Square & Compass" },
  { id: "all-seeing", icon: "👁", name: "All-Seeing Eye" },
  { id: "pillars", icon: "⌂", name: "Twin Pillars" },
  { id: "level", icon: "⚖", name: "Level" },
  { id: "gavel", icon: "🔨", name: "Gavel" },
  { id: "trowel", icon: "⚒", name: "Trowel" },
  { id: "sun", icon: "☉", name: "Blazing Sun" },
  { id: "moon", icon: "☽", name: "Crescent Moon" },
  { id: "star", icon: "⭐", name: "Blazing Star" },
];

const MOON_PHASES = [
  { id: "new", icon: "🌑", name: "New Moon" },
  { id: "waxing-crescent", icon: "🌒", name: "Waxing Crescent" },
  { id: "first-quarter", icon: "🌓", name: "First Quarter" },
  { id: "waxing-gibbous", icon: "🌔", name: "Waxing Gibbous" },
  { id: "full", icon: "🌕", name: "Full Moon" },
  { id: "waning-gibbous", icon: "🌖", name: "Waning Gibbous" },
  { id: "last-quarter", icon: "🌗", name: "Last Quarter" },
  { id: "waning-crescent", icon: "🌘", name: "Waning Crescent" },
];

export function AdvancedSigilCreator({ userId, onSave }: AdvancedSigilCreatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<SigilLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#000000");
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    renderCanvas();
  }, [layers, bgColor, selectedLayer]);

  useEffect(() => {
    generatePreviewSigil();
  }, []);

  const generatePreviewSigil = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-sigil-preview');
      if (error) throw error;
      if (data?.imageUrl) {
        setPreviewImage(data.imageUrl);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    layers.forEach(layer => {
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.translate(layer.x, layer.y);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.scale(layer.scale, layer.scale);

      if (selectedLayer === layer.id) {
        ctx.strokeStyle = "#dc143c";
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-50, -50, 100, 100);
        ctx.setLineDash([]);
      }

      if (layer.type === "symbol" || layer.type === "seal") {
        ctx.font = `${60}px serif`;
        ctx.fillStyle = layer.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(layer.content, 0, 0);
      } else if (layer.type === "shape") {
        ctx.fillStyle = layer.color;
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.lineWidth || 2;

        switch (layer.content) {
          case "line":
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const endX = layer.x2 ? layer.x2 - layer.x : 60;
            const endY = layer.y2 ? layer.y2 - layer.y : 0;
            ctx.lineTo(endX, endY);
            ctx.stroke();
            break;
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case "triangle":
            ctx.beginPath();
            ctx.moveTo(0, -40);
            ctx.lineTo(-35, 35);
            ctx.lineTo(35, 35);
            ctx.closePath();
            ctx.stroke();
            break;
          case "square":
            ctx.strokeRect(-35, -35, 70, 70);
            break;
          case "pentagon":
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
              const px = 40 * Math.cos(angle);
              const py = 40 * Math.sin(angle);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
            break;
          case "hexagon":
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
              const px = 40 * Math.cos(angle);
              const py = 40 * Math.sin(angle);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
            break;
          case "pentagram":
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
              const px = 40 * Math.cos(angle);
              const py = 40 * Math.sin(angle);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
            break;
          case "hexagram":
            ctx.beginPath();
            ctx.moveTo(0, -40);
            ctx.lineTo(-35, 20);
            ctx.lineTo(35, 20);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 40);
            ctx.lineTo(-35, -20);
            ctx.lineTo(35, -20);
            ctx.closePath();
            ctx.stroke();
            break;
        }
      }

      ctx.restore();
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const dx = x - layer.x;
      const dy = y - layer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 50 * layer.scale) {
        setSelectedLayer(layer.id);
        return;
      }
    }

    setSelectedLayer(null);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedLayer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    setIsDragging(true);
    setDragStart({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedLayer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const dx = currentX - dragStart.x;
    const dy = currentY - dragStart.y;

    const layer = layers.find(l => l.id === selectedLayer);
    if (layer) {
      updateLayer(selectedLayer, {
        x: layer.x + dx,
        y: layer.y + dy
      });
    }

    setDragStart({ x: currentX, y: currentY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addSymbol = (symbol: string) => {
    const newLayer: SigilLayer = {
      id: Date.now().toString(),
      type: "symbol",
      content: symbol,
      x: 250,
      y: 250,
      rotation: 0,
      scale: 1,
      opacity: 1,
      color: "#dc143c",
    };
    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
  };


  const addShape = (shape: string) => {
    const newLayer: SigilLayer = {
      id: Date.now().toString(),
      type: "shape",
      content: shape,
      x: 250,
      y: 250,
      rotation: 0,
      scale: 1,
      opacity: 1,
      color: "#dc143c",
      ...(shape === "line" && { x2: 310, y2: 250, lineWidth: 2 })
    };
    setLayers([...layers, newLayer]);
    setSelectedLayer(newLayer.id);
  };

  const updateLayer = (id: string, updates: Partial<SigilLayer>) => {
    setLayers(layers.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedLayer === id) setSelectedLayer(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/png"
        );
      });

      const fileName = `sigil-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(`${userId}/${fileName}`, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("profile-images")
        .getPublicUrl(`${userId}/${fileName}`);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      toast.success("Sigil saved as your avatar!");
      onSave?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const shareToMyCastle = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/png"
        );
      });

      const fileName = `sigil-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("dungeon-media")
        .upload(`${userId}/${fileName}`, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("dungeon-media")
        .getPublicUrl(`${userId}/${fileName}`);

      // Get or create default album
      let { data: albums, error: albumError } = await supabase
        .from("dungeon_albums")
        .select("id")
        .eq("user_id", userId)
        .eq("chamber_type", "photo_album")
        .limit(1);

      if (albumError) throw albumError;

      let albumId: string;
      if (albums && albums.length > 0) {
        albumId = albums[0].id;
      } else {
        const { data: newAlbum, error: createError } = await supabase
          .from("dungeon_albums")
          .insert({
            user_id: userId,
            title: "Spell Collection",
            description: "My magical sigils and spells",
            chamber_type: "photo_album",
            privacy_level: "private"
          })
          .select()
          .single();

        if (createError) throw createError;
        albumId = newAlbum.id;
      }

      // Add media to album
      const { error: mediaError } = await supabase
        .from("dungeon_media")
        .insert({
          album_id: albumId,
          user_id: userId,
          media_url: publicUrl,
          media_type: "image",
          caption: "Spell Sigil"
        });

      if (mediaError) throw mediaError;

      toast.success("Spell shared to My Castle!");
      setShowShareMenu(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const shareToDevilsDiary = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/png"
        );
      });

      const fileName = `sigil-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(`${userId}/${fileName}`, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("post-media")
        .getPublicUrl(`${userId}/${fileName}`);

      // Create post
      const { error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          content: "New spell sigil creation ✨",
          media_url: publicUrl,
          media_type: "image"
        });

      if (postError) throw postError;

      toast.success("Spell shared to Devil's Diary!");
      setShowShareMenu(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const shareToCovens = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/png"
        );
      });

      const fileName = `sigil-${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(`${userId}/${fileName}`, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("post-media")
        .getPublicUrl(`${userId}/${fileName}`);

      // Get user's covens
      const { data: covens, error: covenError } = await supabase
        .from("coven_members")
        .select("coven_id")
        .eq("user_id", userId)
        .limit(1);

      if (covenError) throw covenError;

      if (!covens || covens.length === 0) {
        toast.error("You're not a member of any covens yet");
        return;
      }

      // Share to first coven
      const { error: postError } = await supabase
        .from("coven_posts")
        .insert({
          user_id: userId,
          coven_id: covens[0].coven_id,
          content: "New spell sigil creation ✨",
          media_url: publicUrl,
          media_type: "image",
          visibility: "coven_only"
        });

      if (postError) throw postError;

      toast.success("Spell shared to Covens!");
      setShowShareMenu(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const selectedLayerData = layers.find(l => l.id === selectedLayer);

  const loadPreviewExample = () => {
    const exampleLayers: SigilLayer[] = [
      { id: '1', type: 'shape', content: 'hexagram', x: 250, y: 250, rotation: 0, scale: 2.5, opacity: 0.3, color: '#dc143c' },
      { id: '2', type: 'shape', content: 'pentagram', x: 250, y: 250, rotation: 0, scale: 2, opacity: 0.5, color: '#9333ea' },
      { id: '3', type: 'symbol', content: '⛧', x: 250, y: 250, rotation: 0, scale: 1.5, opacity: 0.8, color: '#dc143c' },
      { id: '4', type: 'symbol', content: 'Α', x: 200, y: 180, rotation: 0, scale: 0.8, opacity: 1, color: '#ffffff' },
      { id: '5', type: 'symbol', content: 'Ω', x: 300, y: 180, rotation: 0, scale: 0.8, opacity: 1, color: '#ffffff' },
      { id: '6', type: 'symbol', content: 'א', x: 200, y: 320, rotation: 0, scale: 0.8, opacity: 1, color: '#ffffff' },
      { id: '7', type: 'symbol', content: 'ת', x: 300, y: 320, rotation: 0, scale: 0.8, opacity: 1, color: '#ffffff' },
      { id: '8', type: 'shape', content: 'circle', x: 250, y: 250, rotation: 0, scale: 3, opacity: 0.6, color: '#22c55e' },
      { id: '9', type: 'symbol', content: '☿', x: 250, y: 150, rotation: 0, scale: 1, opacity: 1, color: '#eab308' },
      { id: '10', type: 'symbol', content: '👁', x: 250, y: 250, rotation: 0, scale: 0.7, opacity: 1, color: '#ffffff' },
    ];
    setLayers(exampleLayers);
    setShowPreview(false);
    toast.success("Loaded example spell!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Spell Casting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showPreview && layers.length === 0 && (
              <div className="mb-4 p-4 border-2 border-primary/30 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Advanced Spell Preview
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create complex sigils by layering symbols, shapes, Greek & Hebrew letters. Combine sacred geometry with occult symbols for powerful spell work.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={loadPreviewExample} variant="outline" className="border-primary/50">
                        <Wand2 className="mr-2 h-3 w-3" />
                        Load Example
                      </Button>
                      <Button size="sm" onClick={() => setShowPreview(false)} variant="ghost">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  <div className="w-24 h-24 border border-primary/30 rounded bg-black flex items-center justify-center overflow-hidden">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">⛧</div>
                        <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-50">☿</div>
                        <div className="absolute inset-0 flex items-center justify-center text-xs opacity-70 text-primary">Αω</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="relative border-2 border-primary/30 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                className="w-full h-auto bg-black cursor-move"
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {selectedLayer && (
                <div className="absolute top-2 left-2 bg-primary/90 text-white px-2 py-1 rounded text-xs">
                  Click and drag to move • Use controls to adjust
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save as Master Magician"}
              </Button>
              <div className="relative">
                <Button onClick={() => setShowShareMenu(!showShareMenu)} variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                {showShareMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-primary/30 rounded-lg shadow-lg z-50">
                    <button
                      onClick={shareToMyCastle}
                      className="w-full px-4 py-2 text-left hover:bg-primary/10 flex items-center gap-2 rounded-t-lg"
                    >
                      <Home className="h-4 w-4" />
                      My Castle
                    </button>
                    <button
                      onClick={shareToDevilsDiary}
                      className="w-full px-4 py-2 text-left hover:bg-primary/10 flex items-center gap-2"
                    >
                      <Book className="h-4 w-4" />
                      Devil's Diary
                    </button>
                    <button
                      onClick={shareToCovens}
                      className="w-full px-4 py-2 text-left hover:bg-primary/10 flex items-center gap-2 rounded-b-lg"
                    >
                      <Users className="h-4 w-4" />
                      Covens
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Background Color</Label>
              <div className="flex gap-2 mt-2">
                {["#000000", "#1a0000", "#0a0a1a", "#1a1a1a", "#ffffff"].map(color => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className={`w-12 h-12 rounded border-2 ${
                      bgColor === color ? "border-primary" : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-primary" />
              Add Gates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="occult">
              <TabsList className="flex w-full max-w-full flex-wrap gap-2 overflow-x-auto text-xs">
                <TabsTrigger className="shrink-0 min-w-max" value="occult">Occult</TabsTrigger>
                <TabsTrigger className="shrink-0 min-w-max" value="alchemy">Alchemy</TabsTrigger>
                <TabsTrigger className="shrink-0 min-w-max" value="zodiac">Zodiac</TabsTrigger>
                <TabsTrigger className="shrink-0 min-w-max" value="masonic">Masonic</TabsTrigger>
                <TabsTrigger className="shrink-0 min-w-max" value="moons">Moons</TabsTrigger>
                <TabsTrigger className="shrink-0 min-w-max" value="geometry">Geometry</TabsTrigger>
                <TabsTrigger className="shrink-0 min-w-max" value="greek">Greek</TabsTrigger>
                <TabsTrigger className="shrink-0 min-w-max" value="hebrew">Hebrew</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[300px] mt-4">
                <TabsContent value="occult" className="grid grid-cols-3 gap-2">
                  {OCCULT_SYMBOLS.map(symbol => (
                    <button
                      key={symbol.id}
                      onClick={() => addSymbol(symbol.icon)}
                      className="p-3 border border-primary/30 rounded hover:bg-primary/10 transition-colors flex flex-col items-center gap-1"
                      title={symbol.name}
                    >
                      <div className="text-2xl">{symbol.icon}</div>
                      <span className="text-xs text-center">{symbol.name}</span>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="alchemy" className="grid grid-cols-3 gap-2">
                  {ALCHEMY_SYMBOLS.map(symbol => (
                    <button
                      key={symbol.id}
                      onClick={() => addSymbol(symbol.icon)}
                      className="p-3 border border-primary/30 rounded hover:bg-primary/10 transition-colors flex flex-col items-center gap-1"
                      title={symbol.name}
                    >
                      <div className="text-2xl">{symbol.icon}</div>
                      <span className="text-xs text-center">{symbol.name}</span>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="zodiac" className="grid grid-cols-3 gap-2">
                  {ZODIAC_SYMBOLS.map(symbol => (
                    <button
                      key={symbol.id}
                      onClick={() => addSymbol(symbol.icon)}
                      className="p-3 border border-primary/30 rounded hover:bg-primary/10 transition-colors flex flex-col items-center gap-1"
                      title={symbol.name}
                    >
                      <div className="text-2xl">{symbol.icon}</div>
                      <span className="text-xs text-center">{symbol.name}</span>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="masonic" className="grid grid-cols-3 gap-2">
                  {MASONIC_SYMBOLS.map(symbol => (
                    <button
                      key={symbol.id}
                      onClick={() => addSymbol(symbol.icon)}
                      className="p-3 border border-primary/30 rounded hover:bg-primary/10 transition-colors flex flex-col items-center gap-1"
                      title={symbol.name}
                    >
                      <div className="text-2xl">{symbol.icon}</div>
                      <span className="text-xs text-center">{symbol.name}</span>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="moons" className="grid grid-cols-3 gap-2">
                  {MOON_PHASES.map(moon => (
                    <button
                      key={moon.id}
                      onClick={() => addSymbol(moon.icon)}
                      className="p-3 border border-primary/30 rounded hover:bg-primary/10 transition-colors flex flex-col items-center gap-1"
                      title={moon.name}
                    >
                      <div className="text-2xl">{moon.icon}</div>
                      <span className="text-xs text-center">{moon.name}</span>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="geometry" className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Line", shape: "line" },
                    { name: "Small Circle", size: 20 },
                    { name: "Medium Circle", size: 35 },
                    { name: "Large Circle", size: 50 },
                    { name: "Triangle", shape: "triangle" },
                    { name: "Square", shape: "square" },
                    { name: "Pentagon", shape: "pentagon" },
                    { name: "Hexagon", shape: "hexagon" },
                    { name: "Star", shape: "pentagram" },
                    { name: "Hexagram", shape: "hexagram" },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => addShape(item.shape || "circle")}
                      className="p-3 border border-primary/30 rounded hover:bg-primary/10 transition-colors flex flex-col items-center gap-1"
                    >
                      {item.shape === "line" && <LineIcon className="h-6 w-6" />}
                      {item.shape === "triangle" && <Triangle className="h-6 w-6" />}
                      {item.shape === "square" && <Square className="h-6 w-6" />}
                      {item.shape === "pentagon" && <Pentagon className="h-6 w-6" />}
                      {item.shape === "hexagon" && <Hexagon className="h-6 w-6" />}
                      {item.shape === "pentagram" && <Star className="h-6 w-6" />}
                      {item.shape === "hexagram" && <Hexagon className="h-6 w-6" />}
                      {!item.shape && (
                        <Circle 
                          className="h-6 w-6" 
                          style={{ 
                            width: item.size ? `${item.size}px` : '24px',
                            height: item.size ? `${item.size}px` : '24px'
                          }} 
                        />
                      )}
                      <span className="text-xs">{item.name}</span>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="greek" className="grid grid-cols-6 gap-2">
                  {['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω', 'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'].map((char) => (
                    <button
                      key={char}
                      onClick={() => addSymbol(char)}
                      className="p-2 border border-primary/30 rounded hover:bg-primary/10 transition-colors text-lg font-bold"
                    >
                      {char}
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="hebrew" className="grid grid-cols-6 gap-2">
                  {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת', 'ך', 'ם', 'ן', 'ף', 'ץ'].map((char) => (
                    <button
                      key={char}
                      onClick={() => addSymbol(char)}
                      className="p-2 border border-primary/30 rounded hover:bg-primary/10 transition-colors text-lg font-bold"
                    >
                      {char}
                    </button>
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>

        {selectedLayerData && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Layer Properties
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteLayer(selectedLayerData.id)}
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>X: {selectedLayerData.x.toFixed(0)}</Label>
                  <Slider
                    value={[selectedLayerData.x]}
                    onValueChange={([v]) => updateLayer(selectedLayerData.id, { x: v })}
                    min={0}
                    max={500}
                    step={1}
                  />
                </div>

                <div>
                  <Label>Y: {selectedLayerData.y.toFixed(0)}</Label>
                  <Slider
                    value={[selectedLayerData.y]}
                    onValueChange={([v]) => updateLayer(selectedLayerData.id, { y: v })}
                    min={0}
                    max={500}
                    step={1}
                  />
                </div>
              </div>

              <div>
                <Label>Rotation: {selectedLayerData.rotation}°</Label>
                <Slider
                  value={[selectedLayerData.rotation]}
                  onValueChange={([v]) => updateLayer(selectedLayerData.id, { rotation: v })}
                  min={0}
                  max={360}
                  step={1}
                />
              </div>

              <div>
                <Label>Scale: {selectedLayerData.scale.toFixed(2)}</Label>
                <Slider
                  value={[selectedLayerData.scale]}
                  onValueChange={([v]) => updateLayer(selectedLayerData.id, { scale: v })}
                  min={0.1}
                  max={3}
                  step={0.1}
                />
              </div>

              <div>
                <Label>Opacity: {(selectedLayerData.opacity * 100).toFixed(0)}%</Label>
                <Slider
                  value={[selectedLayerData.opacity]}
                  onValueChange={([v]) => updateLayer(selectedLayerData.id, { opacity: v })}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {["#dc143c", "#9333ea", "#ffffff", "#22c55e", "#eab308", "#ec4899"].map(color => (
                    <button
                      key={color}
                      onClick={() => updateLayer(selectedLayerData.id, { color })}
                      className={`w-8 h-8 rounded border-2 ${
                        selectedLayerData.color === color ? "border-primary" : "border-border"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-primary" />
              Layers ({layers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {layers.map((layer, index) => (
                  <button
                    key={layer.id}
                    onClick={() => setSelectedLayer(layer.id)}
                    className={`w-full p-2 text-left border rounded ${
                      selectedLayer === layer.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {layer.type} {index + 1}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLayer(layer.id);
                        }}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Eraser className="h-3 w-3" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
