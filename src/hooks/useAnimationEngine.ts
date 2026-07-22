import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerationOptions {
  prompt: string;
  background: string;
  lighting: string;
  aspectRatio: string;
  frameCount: number;
  sourceProjectId?: string;
}

export function useAnimationEngine() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const generateAnimation = async (options: GenerationOptions) => {
    setLoading(true);
    setProgress(0);
    setFrames([]);
    setSessionId(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create session record
      const { data: session, error: sessionError } = await supabase
        .from('animation_sessions')
        .insert({
          user_id: user.id,
          prompt: options.prompt,
          frame_count: options.frameCount,
          status: 'processing',
          generation_params: {
            background: options.background,
            lighting: options.lighting,
            aspectRatio: options.aspectRatio,
            sourceProjectId: options.sourceProjectId || null,
          }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // Generate animation frames
      const { data, error } = await supabase.functions.invoke('ai-cinematic-generate', {
        body: {
          prompt: options.prompt,
          type: 'animation',
          background: options.background,
          lighting: options.lighting,
          aspectRatio: options.aspectRatio,
          frameCount: options.frameCount,
          sourceProjectId: options.sourceProjectId || undefined,
        }
      });

      if (error) throw error;

      const generatedFrames = data.frames || [];
      setFrames(generatedFrames);

      // Update session with results
      await supabase
        .from('animation_sessions')
        .update({
          frames: generatedFrames,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      toast.success(`Animation generated with ${generatedFrames.length} frames`);

      return {
        sessionId: session.id,
        frames: generatedFrames,
      };

    } catch (error: any) {
      console.error('Animation generation error:', error);
      toast.error(error.message || 'Failed to generate animation');

      // Update session status to failed if we have a session
      if (sessionId) {
        await supabase
          .from('animation_sessions')
          .update({ status: 'failed' })
          .eq('id', sessionId);
      }

      throw error;
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  return {
    generateAnimation,
    loading,
    progress,
    frames,
    sessionId,
  };
}
