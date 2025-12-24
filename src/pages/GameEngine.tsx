import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Plus, Crown, Lock, Play, Wand2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MazeDemo, PacmanDemo, SpaceShooterDemo } from "@/components/games/demos/Demos";

export default function GameEngine() {
  const navigate = useNavigate();
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myGames, setMyGames] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [newGame, setNewGame] = useState({ title: "", description: "", genre: "Action" });
  const [aiPrompt, setAiPrompt] = useState({ gameId: "", prompt: "", genre: "", gameType: "platformer" });
  const GAME_TYPES = [
    { value: "maze", label: "Maze Game", description: "Procedural mazes with pathfinding" },
    { value: "crossword", label: "Crossword Puzzle", description: "Word puzzles with categories" },
    { value: "pacman", label: "Pac-Man Style", description: "Chase ghosts, collect pellets" },
    { value: "galactica", label: "Space Shooter", description: "Galaga-style arcade shooter" },
    { value: "sudoku", label: "Sudoku", description: "Number grid logic puzzle" },
    { value: "wordsearch", label: "Word Search", description: "Find words in a grid" },
    { value: "platformer", label: "Platformer", description: "Side-scrolling jump and run" },
    { value: "shooter", label: "Shooter", description: "Action shooting gameplay" },
    { value: "racing", label: "Racing", description: "Fast-paced racing" },
    { value: "towerdefense", label: "Tower Defense", description: "Defend against waves" },
    { value: "puzzle", label: "Puzzle", description: "General puzzle mechanics" },
    { value: "memory", label: "Memory Match", description: "Card matching" },
    { value: "strategy", label: "Strategy", description: "Tactical decision-making" },
    { value: "adventure", label: "Adventure", description: "Exploration and story" },
    { value: "simulation", label: "Simulation", description: "Management or life sim" },
  ];
  useEffect(() => {
    checkAccess();
    loadMyGames();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setHasPremiumAccess(false);
        setLoading(false);
        return;
      }

      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setHasPremiumAccess(!!adminRole);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasPremiumAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMyGames = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('game_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMyGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  const handleCreateNew = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateGame = async () => {
    if (!newGame.title.trim()) {
      toast.error("Game title is required");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }
      const { data, error } = await supabase
        .from('game_projects')
        .insert({
          user_id: user.id,
          title: newGame.title,
          description: newGame.description,
          genre: newGame.genre,
          game_type: 'custom',
          is_published: false,
        })
        .select()
        .single();
      if (error) throw error;
      setMyGames((prev) => [data, ...prev]);
      setCreateDialogOpen(false);
      setNewGame({ title: "", description: "", genre: "Action" });
      toast.success("Game created");
      navigate(`/game-engine/editor/${data.id}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to create game");
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.gameId || !aiPrompt.prompt.trim()) {
      toast.error("Select a game and enter a prompt");
      return;
    }
    try {
      setAiGenerating(true);
      const { data, error } = await supabase.functions.invoke('ai-game-generator', {
        body: aiPrompt,
      });
      if (error) throw error;

      // Persist suggestion to the selected game so it appears immediately
      await supabase
        .from('game_projects')
        .update({
          logic: data?.suggestion,
          assets: data?.suggestion?.assets_needed ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', aiPrompt.gameId);

      await loadMyGames();
      toast.success("AI structure generated and applied to the game.");
      setAiDialogOpen(false);
      setAiPrompt({ gameId: "", prompt: "", genre: "", gameType: "platformer" });
    } catch (e) {
      console.error(e);
      toast.error("AI generation failed");
    } finally {
      setAiGenerating(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-destructive/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destructive"></div>
      </div>
    );
  }

  if (!hasPremiumAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/10 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-8 bg-card/95 backdrop-blur border-destructive/20">
          <div className="text-center space-y-6">
            <div className="mx-auto p-6 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-full w-fit">
              <Lock className="h-16 w-16 text-destructive" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Premium Access Required
            </h1>
            <p className="text-lg text-muted-foreground">
              Gaming Creation AI Engine is a sovereign premium feature
            </p>
            <div className="space-y-4 text-left bg-destructive/5 p-6 rounded-lg border border-destructive/10">
              <h3 className="font-semibold text-destructive flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Premium Features:
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• AI-assisted game creation</li>
                <li>• Multiple game types (Platformer, RPG, Puzzle, Visual Novel)</li>
                <li>• Asset injection & management</li>
                <li>• Real-time preview</li>
                <li>• Export as HTML5 games</li>
                <li>• Publish to public gallery</li>
                <li>• Download as ZIP packages</li>
                <li>• Unlimited game projects</li>
              </ul>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-destructive to-destructive/80 hover:opacity-90"
            >
              <Crown className="h-5 w-5 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/10">
      {/* Header */}
      <div className="border-b border-destructive/20 bg-gradient-to-r from-destructive/10 via-background to-destructive/10 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-destructive to-destructive/60 rounded-lg">
                <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8 text-destructive-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-destructive via-destructive/80 to-destructive bg-clip-text text-transparent">
                  Gaming Creation AI Engine
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1">
                  Sovereign game development platform
                </p>
              </div>
            </div>
            <Button
              onClick={handleCreateNew}
              size="lg"
              className="bg-gradient-to-r from-destructive to-destructive/80 hover:opacity-90 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Game
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <Tabs defaultValue="playground" className="space-y-8">
          <TabsList>
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="gaming">Gaming Hub</TabsTrigger>
            <TabsTrigger value="mygames">My Games</TabsTrigger>
          </TabsList>

          <TabsContent value="playground">
            <Card className="bg-gradient-to-br from-destructive/10 to-background border-destructive/20">
              <CardHeader className="border-b border-destructive/20">
                <CardTitle className="text-destructive flex items-center gap-2">
                  <Play className="h-6 w-6" />
                  Demo Playground - Try Before You Create
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Experience our hybrid procedural game engine with these playable demos
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-background border-destructive/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Maze Explorer</CardTitle>
                      <p className="text-xs text-muted-foreground">Procedural maze generation with pathfinding</p>
                    </CardHeader>
                    <CardContent>
                      <MazeDemo />
                    </CardContent>
                  </Card>
                  <Card className="bg-background border-destructive/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Pac-Man Style</CardTitle>
                      <p className="text-xs text-muted-foreground">Classic arcade chase with AI ghosts</p>
                    </CardHeader>
                    <CardContent>
                      <PacmanDemo />
                    </CardContent>
                  </Card>
                  <Card className="bg-background border-destructive/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Space Shooter</CardTitle>
                      <p className="text-xs text-muted-foreground">Galaga-inspired arcade shooter</p>
                    </CardHeader>
                    <CardContent>
                      <SpaceShooterDemo />
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gaming">
            <Card className="bg-gradient-to-br from-destructive/10 to-background border-destructive/20">
              <CardHeader className="border-b border-destructive/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <Gamepad2 className="h-6 w-6" />
                    Gaming Hub - AI-Powered Creation
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-destructive/20" onClick={loadMyGames}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-destructive/20">
                          <Wand2 className="h-4 w-4 mr-2" /> AI Generate
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card">
                        <DialogHeader>
                          <DialogTitle>AI Game Generator</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label>Select Game</Label>
                            <Select value={aiPrompt.gameId} onValueChange={(v) => setAiPrompt({ ...aiPrompt, gameId: v })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a game..." />
                              </SelectTrigger>
                              <SelectContent>
                                {myGames.map((g) => (
                                  <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Game Type</Label>
                            <Select value={aiPrompt.gameType} onValueChange={(v) => setAiPrompt({ ...aiPrompt, gameType: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {GAME_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    <div className="flex flex-col items-start">
                                      <span className="font-semibold">{t.label}</span>
                                      <span className="text-xs text-muted-foreground">{t.description}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Genre (optional)</Label>
                            <Input value={aiPrompt.genre} onChange={(e) => setAiPrompt({ ...aiPrompt, genre: e.target.value })} placeholder="e.g., Action, Puzzle" />
                          </div>
                          <div className="space-y-2">
                            <Label>Prompt *</Label>
                            <Textarea rows={6} value={aiPrompt.prompt} onChange={(e) => setAiPrompt({ ...aiPrompt, prompt: e.target.value })} placeholder="Describe the structure: levels, enemies, powerups, difficulty..." />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAiDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleAIGenerate} disabled={aiGenerating}>{aiGenerating ? 'Generating...' : 'Generate'}</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-gradient-to-r from-destructive to-destructive/80">
                          <Plus className="h-4 w-4 mr-2" /> Create Game
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card">
                        <DialogHeader>
                          <DialogTitle>Create New Game</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input value={newGame.title} onChange={(e) => setNewGame({ ...newGame, title: e.target.value })} placeholder="Enter game title" />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea rows={4} value={newGame.description} onChange={(e) => setNewGame({ ...newGame, description: e.target.value })} placeholder="Describe your game" />
                          </div>
                          <div className="space-y-2">
                            <Label>Genre *</Label>
                            <Select value={newGame.genre} onValueChange={(v) => setNewGame({ ...newGame, genre: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['Action','Adventure','Puzzle','RPG','Strategy','Simulation','Horror','Platformer'].map((g) => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleCreateGame}>Create</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {GAME_TYPES.map((type) => (
                    <Card key={type.value} className="bg-background border-destructive/20 hover:border-destructive/40 transition-colors cursor-pointer">
                      <CardContent className="p-4 text-center space-y-2">
                        <Gamepad2 className="h-8 w-8 mx-auto text-destructive" />
                        <h4 className="text-sm font-semibold">{type.label}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{type.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mygames">
            {myGames.length === 0 ? (
              <div className="text-center py-16">
                <Gamepad2 className="h-24 w-24 mx-auto text-muted-foreground/40 mb-6" />
                <h2 className="text-2xl font-semibold mb-2">No games yet</h2>
                <p className="text-muted-foreground mb-6">
                  Create your first sovereign game with AI assistance
                </p>
                <Button
                  onClick={handleCreateNew}
                  size="lg"
                  className="bg-gradient-to-r from-destructive to-destructive/80"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start Creating
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myGames.map((game) => (
                  <Card
                    key={game.id}
                    className="p-6 hover:border-destructive/40 transition-all cursor-pointer bg-card/50 backdrop-blur"
                    onClick={() => navigate(`/game-engine/editor/${game.id}`)}
                  >
                    {game.thumbnail_url ? (
                      <img
                        src={game.thumbnail_url}
                        alt={game.title}
                        className="w-full aspect-video object-cover rounded mb-4 border border-border"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-gradient-to-br from-destructive/20 to-destructive/5 rounded mb-4 flex items-center justify-center">
                        <Gamepad2 className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg mb-2 text-foreground">
                      {game.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {game.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{game.genre}</span>
                      <span>
                        {game.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
