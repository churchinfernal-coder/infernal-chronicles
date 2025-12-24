import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OuijaEngineOptions {
  spiritType?: string;
  roomId?: string;
  userId?: string;
}

export const useOuijaEngine = (options: OuijaEngineOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const { toast } = useToast();

  const askSpirit = async (question: string) => {
    if (!question.trim()) {
      toast({
        title: "Empty question",
        description: "Please ask a question",
        variant: "destructive"
      });
      return null;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ouija-spirit-response', {
        body: { 
          question,
          spiritType: options.spiritType || 'the_whisperer',
          previousQuestions,
          roomId: options.roomId,
          userId: options.userId
        }
      });

      if (error) throw error;

      // Add to previous questions for context
      setPreviousQuestions(prev => [...prev, question].slice(-5));

      return {
        response: data.response,
        source: data.source,
        responseId: data.responseId
      };

    } catch (error: any) {
      console.error('Ouija engine error:', error);
      toast({
        title: "Spirit connection failed",
        description: error.message || "The spirits could not be reached",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    setPreviousQuestions([]);
  };

  return {
    askSpirit,
    isLoading,
    resetSession,
    questionCount: previousQuestions.length
  };
};
