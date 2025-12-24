import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateResponseParams {
  question: string;
  tone?: string;
  category?: string;
  spirit_persona?: string;
}

interface OuijaAIResponse {
  response_text: string;
  response_id: string;
  category: string;
  tone: string;
  spirit_persona?: string;
  rarity: string;
  tags: string[];
}

export const useOuijaAI = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResponse, setLastResponse] = useState<OuijaAIResponse | null>(null);

  const generateResponse = async (params: GenerateResponseParams): Promise<OuijaAIResponse | null> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ouija-ai-generate', {
        body: params
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No response from AI');
      }

      setLastResponse(data);
      return data;
    } catch (error: any) {
      console.error('Error generating Ouija response:', error);
      toast.error(error.message || 'Failed to generate response');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSession = async (
    roomId: string,
    question: string,
    responseData: OuijaAIResponse
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('ouija_sessions').insert({
        room_id: roomId,
        user_id: user.id,
        question,
        response_id: responseData.response_id,
        response_text: responseData.response_text,
        tone: responseData.tone,
        category: responseData.category,
        spirit_persona: responseData.spirit_persona,
        session_metadata: {
          rarity: responseData.rarity,
          tags: responseData.tags
        }
      });

      if (error) throw error;

      console.log('Session saved successfully');
    } catch (error: any) {
      console.error('Error saving session:', error);
      toast.error('Failed to save session');
    }
  };

  const submitFeedback = async (
    sessionId: string,
    responseId: string,
    accuracyRating: number,
    mysticismRating: number,
    comment?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('ouija_feedback').insert({
        session_id: sessionId,
        user_id: user.id,
        response_id: responseId,
        accuracy_rating: accuracyRating,
        mysticism_rating: mysticismRating,
        comment
      });

      if (error) throw error;

      toast.success('Feedback submitted');
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  return {
    generateResponse,
    saveSession,
    submitFeedback,
    isGenerating,
    lastResponse
  };
};
