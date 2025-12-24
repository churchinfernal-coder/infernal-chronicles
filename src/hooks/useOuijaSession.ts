import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOuijaSession = () => {
  const { toast } = useToast();

  const logSession = async (sessionData: {
    userId: string;
    roomId: string;
    question: string;
    responseId?: string;
    responseText: string;
    spiritType: string;
    isAiGenerated?: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('ouija_sessions')
        .insert({
          user_id: sessionData.userId,
          room_id: sessionData.roomId,
          question: sessionData.question,
          response_id: sessionData.responseId || null,
          response_text: sessionData.responseText,
          spirit_type: sessionData.spiritType,
          is_ai_generated: sessionData.isAiGenerated || false
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to log session:', error);
    }
  };

  const submitFeedback = async (sessionId: string, rating: number, feedbackText?: string, flagged = false, flagReason?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ouija_feedback')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          rating,
          feedback_text: feedbackText,
          flagged,
          flag_reason: flagReason
        });

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback"
      });

    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: "Failed to submit feedback",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getSessions = async (userId: string, limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('ouija_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  };

  return {
    logSession,
    submitFeedback,
    getSessions
  };
};
