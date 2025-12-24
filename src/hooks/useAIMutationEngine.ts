import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIMutation {
  id: string;
  mode: string;
  input: string;
  output: string;
  tags: string[];
  cost: number;
  created_at: string;
  user_id: string;
  status: 'success' | 'failed' | 'rolled_back';
  rollback_count: number;
  metadata: any;
}

export interface AIMutationSeed {
  id: string;
  mode: string;
  seed_prompt: string;
  usage_count: number;
}

export interface AIMutationStats {
  total: number;
  success: number;
  failed: number;
  rolled_back: number;
  cost: number;
}

export const useAIMutationEngine = (userId?: string) => {
  const [mutations, setMutations] = useState<AIMutation[]>([]);
  const [stats, setStats] = useState<AIMutationStats>({
    total: 0,
    success: 0,
    failed: 0,
    rolled_back: 0,
    cost: 0,
  });
  const [seeds, setSeeds] = useState<AIMutationSeed[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMutations();
    loadSeeds();
    // Auto-refresh every 30s
    const interval = setInterval(() => {
      loadMutations();
      loadSeeds();
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadMutations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_mutation_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setMutations(data || []);
    calculateStats(data || []);
    setLoading(false);
  };

  const loadSeeds = async () => {
    const { data, error } = await supabase
      .from('mutation_seeds')
      .select('*');
    if (error) toast.error(error.message);
    setSeeds(data || []);
  };

  const calculateStats = (data: AIMutation[]) => {
    const total = data.length;
    const success = data.filter(m => m.status === 'success').length;
    const failed = data.filter(m => m.status === 'failed').length;
    const rolled_back = data.filter(m => m.status === 'rolled_back').length;
    const cost = data.reduce((sum, m) => sum + (m.cost || 0), 0);
    setStats({ total, success, failed, rolled_back, cost });
  };

  // CRUD
  const createMutation = async (mutation: Partial<AIMutation>) => {
    const { data, error } = await supabase
      .from('ai_mutation_logs')
      .insert([mutation]);
    if (error) toast.error(error.message);
    await loadMutations();
    return data && data[0] ? data[0] : null;
  };

  const updateMutation = async (id: string, updates: Partial<AIMutation>) => {
    const { error } = await supabase
      .from('ai_mutation_logs')
      .update(updates)
      .eq('id', id);
    if (error) toast.error(error.message);
    await loadMutations();
  };

  const deleteMutation = async (id: string) => {
    const { error } = await supabase
      .from('ai_mutation_logs')
      .delete()
      .eq('id', id);
    if (error) toast.error(error.message);
    await loadMutations();
  };

  // Rollback
  const rollbackMutation = async (id: string) => {
    const { error } = await supabase
      .from('ai_rollback_queue')
      .insert([{ mutation_id: id, requested_at: new Date().toISOString() }]);
    if (error) toast.error(error.message);
    await updateMutation(id, { status: 'rolled_back', rollback_count: 1 });
  };

  // Command Prompt Controlled
  const runCommand = async (command: string, args: any) => {
    // Example: mutate, rollback, stats
    if (command === 'mutate') {
      return await createMutation(args);
    }
    if (command === 'rollback') {
      return await rollbackMutation(args.id);
    }
    if (command === 'stats') {
      return stats;
    }
    toast.error('Unknown command');
  };

  // Learning
  const logOutcome = async (id: string, accepted: boolean) => {
    await updateMutation(id, { metadata: { accepted } });
  };

  // Reasoning
  const flagForReview = async (id: string, reason: string) => {
    await updateMutation(id, { metadata: { flagged: true, reason } });
  };

  // Seeded Logic
  const useSeed = async (mode: string) => {
    const seed = seeds.find(s => s.mode === mode);
    if (!seed) toast.error('No seed found for mode');
    // Only update if usage_count exists on AIMutationSeed
    if (seed && typeof seed.usage_count === 'number') {
      await updateMutation(seed.id, { metadata: { usage_count: seed.usage_count + 1 } });
    }
    return seed;
  };

  return {
    mutations,
    stats,
    seeds,
    loading,
    createMutation,
    updateMutation,
    deleteMutation,
    rollbackMutation,
    runCommand,
    logOutcome,
    flagForReview,
    useSeed,
    loadMutations,
    loadSeeds,
  };
};
