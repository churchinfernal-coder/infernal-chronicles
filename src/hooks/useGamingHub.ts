import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface GameAsset {
  id: string;
  game_id: string;
  asset_path: string;
  asset_type: string;
  resolution: string;
  format: string;
  verified_by: string | null;
  created_at: string;
}

export interface Game {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  genre: string;
  game_type: string;
  thumbnail_url: string | null;
  is_published: boolean;
  publish_date: string | null;
  play_count: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
  };
}

export type GameStatus = 'draft' | 'published' | 'archived';

export const useGamingHub = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [assets, setAssets] = useState<Record<string, GameAsset[]>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<GameStatus | 'all'>('all');
  const seededRef = useRef(false);

  // Hydrate games from database
  const loadGames = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('game_projects')
        .select(`
          *,
          profiles(username)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter === 'draft') {
        query = query.eq('is_published', false).is('publish_date', null);
      } else if (statusFilter === 'published') {
        query = query.eq('is_published', true);
      } else if (statusFilter === 'archived') {
        query = query.eq('is_published', false).not('publish_date', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      setGames((data as any) || []);
    } catch (error: any) {
      console.error('Error loading games:', error);
      toast({
        title: 'Error loading games',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Hydrate assets for a specific game
  const loadGameAssets = async (gameId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('game_assets')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAssets((prev) => ({
        ...prev,
        [gameId]: (data as any) || [],
      }));
    } catch (error: any) {
      console.error('Error loading assets:', error);
      toast({
        title: 'Error loading assets',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Seed three playable demos for the current user (idempotent)
  const ensureDemoGames = async () => {
    try {
      if (seededRef.current) return;
      seededRef.current = true;
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      const titles = ['Maze Demo', 'Pacman Demo', 'Space Shooter Demo'];
      const { data: existing } = await supabase
        .from('game_projects')
        .select('id,title')
        .in('title', titles)
        .eq('user_id', uid);

      const existingTitles = new Set((existing || []).map((g: any) => g.title));
      const inserts = [] as any[];

      if (!existingTitles.has('Maze Demo'))
        inserts.push({
          user_id: uid,
          title: 'Maze Demo',
          description: 'Reach the exit in a generated labyrinth.',
          genre: 'Puzzle',
          game_type: 'maze',
          is_published: true,
          canvas_data: { type: 'maze', difficulty: 'easy' },
          logic: { winCondition: 'reach_exit' },
        });
      if (!existingTitles.has('Pacman Demo'))
        inserts.push({
          user_id: uid,
          title: 'Pacman Demo',
          description: 'Collect pellets and avoid ghosts.',
          genre: 'Arcade',
          game_type: 'pacman',
          is_published: true,
          canvas_data: { type: 'pacman', ghosts: 3 },
          logic: { scoreOnPellet: 10 },
        });
      if (!existingTitles.has('Space Shooter Demo'))
        inserts.push({
          user_id: uid,
          title: 'Space Shooter Demo',
          description: 'Arcade shooter against alien waves.',
          genre: 'Shooter',
          game_type: 'galactica',
          is_published: true,
          canvas_data: { type: 'space_shooter' },
          logic: { scoreOnKill: 50 },
        });

      if (inserts.length) {
        const { error } = await supabase.from('game_projects').insert(inserts);
        if (error) throw error;
      }
    } catch (e) {
      console.warn('Demo seed skipped:', e);
    }
  };

  // Mutate game status
  const mutateGameStatus = async (gameId: string, newStatus: GameStatus) => {
    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      switch (newStatus) {
        case 'published':
          updates.is_published = true;
          updates.publish_date = new Date().toISOString();
          break;
        case 'draft':
          updates.is_published = false;
          updates.publish_date = null;
          break;
        case 'archived':
          updates.is_published = false;
          // Keep publish_date to indicate it was archived
          if (!games.find((g) => g.id === gameId)?.publish_date) {
            updates.publish_date = new Date().toISOString();
          }
          break;
      }

      const { error } = await supabase
        .from('game_projects')
        .update(updates)
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Game status changed to ${newStatus}`,
      });

      await loadGames();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Create new game (Venice MVP: deployment)
  const createGame = async (gameData: {
    title: string;
    description: string;
    genre: string;
  }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('game_projects')
        .insert({
          user_id: user.id,
          title: gameData.title,
          description: gameData.description,
          genre: gameData.genre,
          game_type: 'custom',
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Game created',
        description: `${gameData.title} has been created successfully`,
      });

      await loadGames();
      return data;
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast({
        title: 'Error creating game',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Rollback logic (Venice MVP: version control)
  const rollbackGameVersion = async (gameId: string, versionData: any) => {
    try {
      const { error } = await supabase
        .from('game_projects')
        .update({
          canvas_data: versionData.canvas_data,
          assets: versionData.assets,
          logic: versionData.logic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', gameId);

      if (error) throw error;

      toast({
        title: 'Version restored',
        description: 'Game has been rolled back to previous version',
      });

      await loadGames();
    } catch (error: any) {
      console.error('Error rolling back:', error);
      toast({
        title: 'Error rolling back',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Performance monitoring (Venice MVP)
  const logPerformanceMetric = async (gameId: string, metric: string, value: number) => {
    try {
      await supabase.from('ai_performance_metrics').insert({
        module_name: `game_${gameId}`,
        metric_type: metric,
        value: value,
        unit: 'ms',
        metadata: { game_id: gameId },
      });
    } catch (error: any) {
      console.error('Error logging performance:', error);
    }
  };

  // Feedback loop (Venice MVP)
  const submitFeedback = async (gameId: string, feedbackData: {
    rating: number;
    comment: string;
  }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Store in ai_user_feedback as a game-related feedback
      await supabase.from('ai_user_feedback').insert({
        user_id: user.id,
        module_name: `game_${gameId}`,
        error_description: `Rating: ${feedbackData.rating}/5 - ${feedbackData.comment}`,
        severity: 'info',
        status: 'pending',
      });

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback!',
      });
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Error submitting feedback',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // AI Game Generation (Venice MVP: AI-powered creation)
  const generateGameWithAI = async (params: {
    gameId: string;
    prompt: string;
    genre: string;
    gameType: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-game-generator', {
        body: params,
      });

      if (error) throw error;

      const suggestion = (data as any)?.suggestion;

      // Persist suggestion into the selected game's record for immediate visibility
      await supabase
        .from('game_projects')
        .update({
          logic: suggestion,
          assets: suggestion?.assets_needed ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.gameId);

      // Refresh local state
      await loadGames();

      toast({
        title: 'AI Generation Complete',
        description: 'Applied to your game. Open the editor to review.',
      });

      return suggestion;
    } catch (error: any) {
      console.error('Error generating game:', error);
      toast({
        title: 'Error generating game',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    ensureDemoGames().then(() => loadGames());
  }, [statusFilter]);

  return {
    games,
    assets,
    loading,
    statusFilter,
    setStatusFilter,
    loadGames,
    loadGameAssets,
    mutateGameStatus,
    createGame,
    rollbackGameVersion,
    logPerformanceMetric,
    submitFeedback,
    generateGameWithAI,
  };
};
