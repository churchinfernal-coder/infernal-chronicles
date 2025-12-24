import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gamepad2, Play, Search, TrendingUp } from "lucide-react";

export default function GameGallery() {
  const navigate = useNavigate();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");

  useEffect(() => {
    loadPublishedGames();
  }, []);

  const loadPublishedGames = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('game_projects')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('is_published', true)
        .order('play_count', { ascending: false })
        .order('publish_date', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === "all" || game.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const handlePlayGame = (gameId: string) => {
    navigate(`/game-engine/play/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/10">
      {/* Header */}
      <div className="border-b border-destructive/20 bg-gradient-to-r from-destructive/10 via-background to-destructive/10 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-6">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-destructive to-destructive/60 rounded-lg">
              <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8 text-destructive-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-destructive via-destructive/80 to-destructive bg-clip-text text-transparent">
                Game Gallery
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1">
                Play sovereign games created by the community
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="platformer">Platformer</SelectItem>
                <SelectItem value="rpg">RPG</SelectItem>
                <SelectItem value="puzzle">Puzzle</SelectItem>
                <SelectItem value="visual_novel">Visual Novel</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-destructive"></div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16">
            <Gamepad2 className="h-24 w-24 mx-auto text-muted-foreground/40 mb-6" />
            <h2 className="text-2xl font-semibold mb-2">No games found</h2>
            <p className="text-muted-foreground">
              {searchTerm || selectedGenre !== "all" 
                ? "Try adjusting your filters"
                : "Be the first to publish a game!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGames.map((game) => (
              <Card
                key={game.id}
                className="overflow-hidden hover:border-destructive/40 transition-all bg-card/50 backdrop-blur group"
              >
                <div className="relative">
                  {game.thumbnail_url ? (
                    <img
                      src={game.thumbnail_url}
                      alt={game.title}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center">
                      <Gamepad2 className="h-16 w-16 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      onClick={() => handlePlayGame(game.id)}
                      size="lg"
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Play Now
                    </Button>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{game.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {game.description || "No description"}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{game.play_count || 0} plays</span>
                    </div>
                    <span className="capitalize">{game.genre}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
