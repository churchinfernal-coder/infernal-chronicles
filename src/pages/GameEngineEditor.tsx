import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Play, Download, Upload, Sparkles, Image as ImageIcon, Music, Palette, Loader2 } from "lucide-react";
import { toast } from "sonner";

const supabaseUrl = "https://khugyibzsujjgtddwzpa.supabase.co";

type GameGenre = "platformer" | "rpg" | "puzzle" | "visual_novel";

export default function GameEngineEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentAssetType, setCurrentAssetType] = useState<'sprites' | 'audio' | 'backgrounds'>('sprites');
  
  const [gameData, setGameData] = useState({
    title: "",
    description: "",
    genre: "platformer" as GameGenre,
    game_type: "2d",
    canvas_data: {},
    assets: { sprites: [], audio: [], backgrounds: [] },
    logic: null,
    is_published: false,
  });

  useEffect(() => {
    if (id && id !== "new") {
      loadGameProject();
    }
  }, [id]);

  const loadGameProject = async () => {
    if (!id || id === "new") return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("game_projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      if (data) {
        setGameData({
          title: data.title,
          description: data.description || "",
          genre: data.genre as GameGenre,
          game_type: data.game_type,
          canvas_data: data.canvas_data || {},
          assets: (data.assets || { sprites: [], audio: [], backgrounds: [] }) as any,
          logic: data.logic,
          is_published: data.is_published || false,
        });
      }
    } catch (error) {
      console.error("Error loading game:", error);
      toast.error("Failed to load game project");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!gameData.title.trim()) {
      toast.error("Please enter a game title");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      if (id === "new") {
        // Create new game
        const { data, error } = await supabase
          .from("game_projects")
          .insert({
            user_id: user.id,
            title: gameData.title,
            description: gameData.description,
            genre: gameData.genre,
            game_type: gameData.game_type,
            canvas_data: gameData.canvas_data,
            assets: gameData.assets,
            logic: gameData.logic,
            is_published: false,
          })
          .select()
          .single();

        if (error) throw error;
        
        toast.success("Game project created!");
        navigate(`/game-engine/editor/${data.id}`);
      } else {
        // Update existing game
        const { error } = await supabase
          .from("game_projects")
          .update({
            title: gameData.title,
            description: gameData.description,
            genre: gameData.genre,
            game_type: gameData.game_type,
            canvas_data: gameData.canvas_data,
            assets: gameData.assets,
            logic: gameData.logic,
            is_published: gameData.is_published,
          })
          .eq("id", id);

        if (error) throw error;
        
        toast.success("Game saved!");
      }
    } catch (error) {
      console.error("Error saving game:", error);
      toast.error("Failed to save game");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id || id === "new") {
      toast.error("Please save your game first");
      return;
    }

    try {
      const { error } = await supabase
        .from("game_projects")
        .update({ is_published: !gameData.is_published })
        .eq("id", id);

      if (error) throw error;

      setGameData({ ...gameData, is_published: !gameData.is_published });
      toast.success(gameData.is_published ? "Game unpublished" : "Game published to gallery!");

      // Log publish action
      const {data: {user}} = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('game_publishes')
          .insert({
            game_id: id,
            user_id: user.id,
            action: gameData.is_published ? 'unpublish' : 'publish',
            metadata: { title: gameData.title }
          });
      }
    } catch (error) {
      console.error("Error publishing game:", error);
      toast.error("Failed to publish game");
    }
  };

  const handleAIGenerate = async () => {
    if (!id || id === "new") {
      toast.error("Please save your game first");
      return;
    }

    if (!gameData.title || !gameData.description) {
      toast.error("Please add a title and description first");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-game-generator', {
        body: {
          gameId: id,
          prompt: gameData.description,
          genre: gameData.genre,
          gameType: gameData.game_type
        }
      });

      if (error) throw error;

      if (data.success) {
        const suggestion = data.suggestion;
        // Persist suggestion immediately so it appears in listings and reloads
        await supabase
          .from('game_projects')
          .update({
            logic: suggestion,
            assets: suggestion?.assets_needed ?? gameData.assets,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        setGameData((prev) => ({ ...prev, logic: suggestion }));
        toast.success("AI suggestions generated and applied to this game.");
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast.error('Failed to generate AI suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssetUpload = async (assetType: 'sprites' | 'audio' | 'backgrounds') => {
    if (!id || id === "new") {
      toast.error("Please save your game first");
      return;
    }

    setCurrentAssetType(assetType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gameId', id!);
      formData.append('assetType', currentAssetType);

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${supabaseUrl}/functions/v1/game-asset-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${currentAssetType} uploaded successfully!`);
        loadGameProject(); // Reload to show new asset
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast.error('Failed to upload asset');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    if (!id || id === "new") {
      toast.error("Please save your game first");
      return;
    }

    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-game', {
        body: { gameId: id }
      });

      if (error) throw error;

      if (data.success) {
        // Create download
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Game exported successfully!");
      }
    } catch (error) {
      console.error('Error exporting game:', error);
      toast.error('Failed to export game');
    } finally {
      setExporting(false);
    }
  };

  const getAssetCount = (type: string) => {
    const assets = gameData.assets as any;
    return assets?.[type]?.length || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destructive"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/10">
      {/* Header */}
      <div className="border-b border-destructive/20 bg-gradient-to-r from-destructive/10 via-background to-destructive/10 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/game-engine")}
                className="text-destructive hover:text-destructive/80"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-destructive">
                {id === "new" ? "Create New Game" : "Edit Game"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                className="bg-gradient-to-r from-destructive to-destructive/80"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              {id !== "new" && (
                <Button
                  onClick={handlePublish}
                  size="sm"
                  variant={gameData.is_published ? "outline" : "default"}
                  className={gameData.is_published ? "" : "bg-gradient-to-r from-destructive to-destructive/80"}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {gameData.is_published ? "Unpublish" : "Publish"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Game Settings */}
          <Card className="p-6 bg-card/50 backdrop-blur">
            <h2 className="text-lg font-semibold mb-4 text-destructive">Game Settings</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Game Title</Label>
                <Input
                  id="title"
                  value={gameData.title}
                  onChange={(e) => setGameData({ ...gameData, title: e.target.value })}
                  placeholder="Enter game title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={gameData.description}
                  onChange={(e) => setGameData({ ...gameData, description: e.target.value })}
                  placeholder="Describe your game"
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="genre">Game Type</Label>
                <Select
                  value={gameData.genre}
                  onValueChange={(value) => setGameData({ ...gameData, genre: value as GameGenre })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platformer">Platformer</SelectItem>
                    <SelectItem value="rpg">RPG</SelectItem>
                    <SelectItem value="puzzle">Puzzle</SelectItem>
                    <SelectItem value="visual_novel">Visual Novel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full border-destructive/20 hover:bg-destructive/10"
                  onClick={handleAIGenerate}
                  disabled={generating || !gameData.title || !gameData.description}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Right Panel - Game Canvas */}
          <Card className="p-6 bg-card/50 backdrop-blur">
            <h2 className="text-lg font-semibold mb-4 text-destructive">Game Canvas</h2>
            <div className="aspect-video bg-gradient-to-br from-destructive/5 to-destructive/10 rounded-lg border-2 border-dashed border-destructive/20 flex items-center justify-center">
              <div className="text-center space-y-4 p-6">
                <Play className="h-16 w-16 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Game preview will appear here
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Configure your game settings and save to see preview
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="border-destructive/20">
                <Play className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-destructive/20"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export HTML5
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Asset Management Section */}
        <Card className="mt-6 p-6 bg-card/50 backdrop-blur">
          <h2 className="text-lg font-semibold mb-4 text-destructive">Game Assets</h2>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={currentAssetType === 'audio' ? 'audio/*' : currentAssetType === 'sprites' ? 'image/*' : 'image/*'}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-24 border-destructive/20 hover:bg-destructive/10"
              onClick={() => handleAssetUpload('sprites')}
              disabled={uploading || !id || id === "new"}
            >
              <div className="text-center">
                {uploading && currentAssetType === 'sprites' ? (
                  <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                ) : (
                  <ImageIcon className="h-6 w-6 mx-auto mb-2" />
                )}
                <p className="text-xs">Upload Sprites ({getAssetCount('sprites')})</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 border-destructive/20 hover:bg-destructive/10"
              onClick={() => handleAssetUpload('audio')}
              disabled={uploading || !id || id === "new"}
            >
              <div className="text-center">
                {uploading && currentAssetType === 'audio' ? (
                  <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                ) : (
                  <Music className="h-6 w-6 mx-auto mb-2" />
                )}
                <p className="text-xs">Upload Audio ({getAssetCount('audio')})</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 border-destructive/20 hover:bg-destructive/10"
              onClick={() => handleAssetUpload('backgrounds')}
              disabled={uploading || !id || id === "new"}
            >
              <div className="text-center">
                {uploading && currentAssetType === 'backgrounds' ? (
                  <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                ) : (
                  <Palette className="h-6 w-6 mx-auto mb-2" />
                )}
                <p className="text-xs">Upload Backgrounds ({getAssetCount('backgrounds')})</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-24 border-destructive/20 hover:bg-destructive/10"
              onClick={handleAIGenerate}
              disabled={generating || !id || id === "new"}
            >
              <div className="text-center">
                {generating ? (
                  <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                ) : (
                  <Sparkles className="h-6 w-6 mx-auto mb-2" />
                )}
                <p className="text-xs">AI Generate</p>
              </div>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
