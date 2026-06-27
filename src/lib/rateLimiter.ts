import { supabase } from '@/integrations/supabase/client';

export async function checkAIGenerationLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const oneHourAgo = new Date(Date. now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('ai_generation_logs')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo);

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: false, remaining: 0 };
  }

  const count = data?. length || 0;
  const remaining = Math.max(0, 100 - count);

  return {
    allowed: count < 100,
    remaining
  };
}

export async function logAIGeneration(userId: string, promptUsed: string) {
  await supabase. from('ai_generation_logs').insert({
    user_id: userId,
    prompt:  promptUsed,
    created_at: new Date().toISOString()
  });
}