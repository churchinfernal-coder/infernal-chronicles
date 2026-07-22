import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gamepad2, Plus, Eye, RefreshCw, Calendar, User, Tag, Wand2, Play } from 'lucide-react';
import { useGamingHub, GameStatus } from '@/hooks/useGamingHub';
import { toast } from '@/hooks/use-toast';
import { MazeDemo, PacmanDemo, SpaceShooterDemo } from '@/components/games/demos/Demos';

const GENRES = ['Action', 'Adventure', 'Puzzle', 'RPG', 'Strategy', 'Simulation', 'Horror', 'Platformer'];

const GAME_TYPES = [
  { value: 'maze', label: 'Maze Game', description: 'Procedurally generated mazes with custom themes' },
  { value: 'crossword', label: 'Crossword Puzzle', description: 'Word puzzles with custom categories' },
  { value: 'pacman', label: 'Pac-Man Style', description: 'Maze chase game with ghosts and power-ups' },
  { value: 'galactica', label: 'Space Shooter', description: 'Galactica-inspired space combat' },
  { value: 'sudoku', label: 'Sudoku', description: 'Number puzzle with varying difficulty' },
  { value: 'wordsearch', label: 'Word Search', description: 'Find hidden words in a grid' },
  { value: 'platformer', label: 'Platformer', description: 'Side-scrolling jump and run game' },
  { value: 'shooter', label: 'Shooter', description: 'Action shooting game' },
  { value: 'racing', label: 'Racing', description: 'Vehicle racing game' },
  { value: 'towerdefense', label: 'Tower Defense', description: 'Strategic defense game' },
  { value: 'puzzle', label: 'Puzzle', description: 'General puzzle game' },
  { value: 'memory', label: 'Memory Match', description: 'Card matching game' },
  { value: 'strategy', label: 'Strategy', description: 'Turn-based or real-time strategy' },
  { value: 'adventure', label: 'Adventure', description: 'Story-driven exploration game' },
  { value: 'simulation', label: 'Simulation', description: 'Life or management simulation' },
];

export default function GamingHub() {
  const {
    games,
    assets,
    loading,
    statusFilter,
    setStatusFilter,
    loadGames,
    loadGameAssets,
    mutateGameStatus,
    createGame,
    generateGameWithAI,
  } = useGamingHub();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [newGame, setNewGame] = useState({
    title: '',
    description: '',
    genre: 'Action',
  });
  const [aiPrompt, setAiPrompt] = useState({
    gameId: '',
    prompt: '',
    genre: '',
    gameType: 'maze',
  });

  const handleCreateGame = async () => {
    if (!newGame.title.trim()) {
      toast({
        title: 'Validation error',
        description: 'Game title is required',
        variant: 'destructive',
      });
      return;
    }

    const result = await createGame(newGame);
    if (result) {
      setCreateDialogOpen(false);
      setNewGame({ title: '', description: '', genre: 'Action' });
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.gameId || !aiPrompt.prompt.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please select a game and enter an AI prompt',
        variant: 'destructive',
      });
      return;
    }

    setAiGenerating(true);
    const result = await generateGameWithAI(aiPrompt);
    setAiGenerating(false);
    
    if (result) {
      setAiDialogOpen(false);
      setAiPrompt({ gameId: '', prompt: '', genre: '', gameType: 'maze' });
    }
  };

  const handleViewAssets = async (gameId: string) => {
    setSelectedGameId(gameId);
    await loadGameAssets(gameId);
    setAssetDialogOpen(true);
  };

  const getGameStatus = (game: any): GameStatus => {
    if (game.is_published) return 'published';
    if (game.publish_date) return 'archived';
    return 'draft';
  };

  const getStatusColor = (status: GameStatus) => {
    switch (status) {
      case 'published':
        return 'bg-green-600';
      case 'draft':
        return 'bg-yellow-600';
      case 'archived':
        return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Playground Section */}
      <Card className="bg-gradient-to-br from-red-950/30 to-black border-red-900/50">
        <CardHeader className="border-b border-red-900/30">
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Play className="h-6 w-6" />
            Demo Playground - Test Before You Create
          </CardTitle>
          <p className="text-sm text-red-400/70 mt-1">Try these playable demos to experience our game engine capabilities</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-black border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-300 text-lg">Maze Explorer</CardTitle>
                <p className="text-xs text-red-400/60">Procedural maze generation with pathfinding</p>
              </CardHeader>
              <CardContent>
                <MazeDemo />
              </CardContent>
            </Card>
            <Card className="bg-black border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-300 text-lg">Pac-Man Style</CardTitle>
                <p className="text-xs text-red-400/60">Classic arcade chase with AI ghosts</p>
              </CardHeader>
              <CardContent>
                <PacmanDemo />
              </CardContent>
            </Card>
            <Card className="bg-black border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-300 text-lg">Space Shooter</CardTitle>
                <p className="text-xs text-red-400/60">Galactica-inspired arcade shooter</p>
              </CardHeader>
              <CardContent>
                <SpaceShooterDemo />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Game Types Gallery */}
      <Card className="bg-red-950/20 border-red-900/30">
        <CardHeader className="border-b border-red-900/30">
          <CardTitle className="text-red-400">15 AI-Powered Game Types</CardTitle>
          <p className="text-sm text-red-400/70">Select from these templates when using AI Generate</p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {GAME_TYPES.map((type) => (
              <Card key={type.value} className="bg-black border-red-900/50 hover:border-red-600 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center space-y-2">
                  <Gamepad2 className="h-8 w-8 mx-auto text-red-400" />
                  <h4 className="text-sm font-semibold text-red-300">{type.label}</h4>
                  <p className="text-xs text-red-400/50 line-clamp-2">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-red-950/20 border-red-900/30">
        <CardHeader className="border-b border-red-900/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <Gamepad2 className="h-6 w-6" />
                Gaming Hub - AI-Powered Game Creation
              </CardTitle>
              <p className="text-sm text-red-400/70 mt-1">Venice MVP: Deployment, Version Control, Feedback Loop, Performance Monitoring</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadGames}
                className="border-red-900/50 text-red-400 hover:bg-red-900/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              {/* AI Generator Dialog */}
              <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-red-900/50 text-red-400 hover:bg-red-900/20">
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Generate
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black border-red-900/50 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-red-400">AI Game Generator</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-4 py-4 pr-4">
                      <div className="space-y-2">
                        <Label className="text-red-300">Select Game to Enhance</Label>
                        <Select
                          value={aiPrompt.gameId}
                          onValueChange={(value) => setAiPrompt({ ...aiPrompt, gameId: value })}
                        >
                          <SelectTrigger className="bg-red-950/20 border-red-900/50 text-red-100">
                            <SelectValue placeholder="Choose a game..." />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-red-900/50">
                            {games.map((game) => (
                              <SelectItem key={game.id} value={game.id} className="text-red-300">
                                {game.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-red-300">Game Type</Label>
                        <Select
                          value={aiPrompt.gameType}
                          onValueChange={(value) => setAiPrompt({ ...aiPrompt, gameType: value })}
                        >
                          <SelectTrigger className="bg-red-950/20 border-red-900/50 text-red-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-red-900/50 max-h-[300px]">
                            {GAME_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value} className="text-red-300">
                                <div className="flex flex-col items-start">
                                  <span className="font-semibold">{type.label}</span>
                                  <span className="text-xs text-red-400/60">{type.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-red-300">Genre (Optional)</Label>
                        <Input
                          placeholder="e.g., Action, Puzzle, Adventure"
                          value={aiPrompt.genre}
                          onChange={(e) => setAiPrompt({ ...aiPrompt, genre: e.target.value })}
                          className="bg-red-950/20 border-red-900/50 text-red-100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-red-300">AI Prompt *</Label>
                        <Textarea
                          placeholder="Example: Generate a Pac-Man styled game with a futuristic theme. Medium maze with 3 ghosts, 2 power-ups, 5-minute time limit, and custom scoring system based on pellets collected."
                          value={aiPrompt.prompt}
                          onChange={(e) => setAiPrompt({ ...aiPrompt, prompt: e.target.value })}
                          rows={8}
                          className="bg-red-950/20 border-red-900/50 text-red-100"
                        />
                      </div>

                      <div className="bg-red-950/30 border border-red-900/30 p-4 rounded-lg space-y-2">
                        <h4 className="text-sm font-semibold text-red-400">Example Prompts:</h4>
                        <ul className="text-xs text-red-300/70 space-y-1 list-disc list-inside">
                          <li>Create a maze with easy difficulty, forest theme, hidden treasures, and 10-minute time limit</li>
                          <li>Generate a crossword puzzle with tech category, 15x15 grid, medium difficulty</li>
                          <li>Build a space shooter with 5 enemy types, power-ups, boss battles, and resource management</li>
                          <li>Design a tower defense game with 10 levels, multiple tower types, and upgrade system</li>
                        </ul>
                      </div>
                    </div>
                  </ScrollArea>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setAiDialogOpen(false)}
                      className="border-red-900/50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAIGenerate} 
                      disabled={aiGenerating}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {aiGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Game
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black border-red-900/50">
                  <DialogHeader>
                    <DialogTitle className="text-red-400">Create New Game</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-red-300">
                        Title *
                      </Label>
                      <Input
                        id="title"
                        value={newGame.title}
                        onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
                        placeholder="Enter game title..."
                        className="bg-red-950/20 border-red-900/50 text-red-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-red-300">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={newGame.description}
                        onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                        placeholder="Enter game description..."
                        rows={4}
                        className="bg-red-950/20 border-red-900/50 text-red-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genre" className="text-red-300">
                        Genre *
                      </Label>
                      <Select value={newGame.genre} onValueChange={(value) => setNewGame({ ...newGame, genre: value })}>
                        <SelectTrigger className="bg-red-950/20 border-red-900/50 text-red-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-red-900/50">
                          {GENRES.map((genre) => (
                            <SelectItem key={genre} value={genre} className="text-red-300">
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="border-red-900/50">
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGame} className="bg-red-600 hover:bg-red-700">
                      Create Game
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Status Filter Tabs */}
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as GameStatus | 'all')} className="mb-6">
            <TabsList className="bg-red-950/20 border border-red-900/30">
              <TabsTrigger value="all" className="data-[state=active]:bg-red-600">
                All Games ({games.length})
              </TabsTrigger>
              <TabsTrigger value="draft" className="data-[state=active]:bg-yellow-600">
                Draft ({games.filter((g) => getGameStatus(g) === 'draft').length})
              </TabsTrigger>
              <TabsTrigger value="published" className="data-[state=active]:bg-green-600">
                Published ({games.filter((g) => getGameStatus(g) === 'published').length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="data-[state=active]:bg-gray-600">
                Archived ({games.filter((g) => getGameStatus(g) === 'archived').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="text-center py-12 text-red-400">Loading games...</div>
          ) : games.length === 0 ? (
            <div className="text-center py-12 text-red-400/70">
              No games found. Create your first game to get started!
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {games.map((game) => {
                  const status = getGameStatus(game);
                  return (
                    <Card key={game.id} className="bg-black border-red-900/50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-red-300">{game.title}</h3>
                              <Badge className={getStatusColor(status)}>{status}</Badge>
                              <Badge variant="outline" className="border-red-700 text-red-400">
                                <Tag className="h-3 w-3 mr-1" />
                                {game.genre}
                              </Badge>
                            </div>

                            {game.description && (
                              <p className="text-sm text-red-300/70 line-clamp-2">{game.description}</p>
                            )}

                            <div className="flex items-center gap-6 text-xs text-red-400/50">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {game.created_by_username || 'Unknown'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(game.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Gamepad2 className="h-3 w-3" />
                                {game.play_count || 0} plays
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewAssets(game.id)}
                              className="border-red-900/50 text-red-400 hover:bg-red-900/20"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Assets
                            </Button>
                            <Select value={status} onValueChange={(value) => mutateGameStatus(game.id, value as GameStatus)}>
                              <SelectTrigger className="bg-red-950/20 border-red-900/50 text-red-100 w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-black border-red-900/50">
                                <SelectItem value="draft" className="text-yellow-400">
                                  Draft
                                </SelectItem>
                                <SelectItem value="published" className="text-green-400">
                                  Published
                                </SelectItem>
                                <SelectItem value="archived" className="text-gray-400">
                                  Archived
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Asset Viewer Dialog */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent className="bg-black border-red-900/50 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-red-400">Game Assets - Venice MVP Tracking</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            {selectedGameId && assets[selectedGameId]?.length > 0 ? (
              <div className="space-y-3">
                {assets[selectedGameId].map((asset) => (
                  <Card key={asset.id} className="bg-red-950/20 border-red-900/30">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-red-400/70">Path:</span>
                          <p className="text-red-300 font-mono text-xs truncate">{asset.asset_path}</p>
                        </div>
                        <div>
                          <span className="text-red-400/70">Type:</span>
                          <p className="text-red-300">{asset.asset_type}</p>
                        </div>
                        <div>
                          <span className="text-red-400/70">Resolution:</span>
                          <p className="text-red-300">{asset.resolution || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-red-400/70">Format:</span>
                          <p className="text-red-300">{asset.format || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-red-400/70">Verified By:</span>
                          <p className="text-red-300">{asset.verified_by || 'Not verified'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-red-400/70">No assets found for this game.</div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
