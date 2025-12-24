import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateInstructionsParams {
  feature_name: string;
  category: string;
  feature_path?: string | null;
  code_context?: string | null;
}

interface Instruction {
  id: string;
  feature_name: string;
  category: string;
  feature_path: string | null;
  code_context: string | null;
  instructions: string;
  created_at: string;
}

export const useInstructionGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const generateInstructions = async (params: GenerateInstructionsParams) => {
    setLoading(true);
    
    try {
      console.log('Generating instructions for:', params.feature_name);
      
      const { data, error } = await supabase.functions.invoke('ai-generate-feature-instructions', {
        body: params,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data || !data.instructions) {
        throw new Error('No instructions returned');
      }

      console.log('Instructions generated successfully');
      
      toast({
        title: "Success",
        description: `Instructions for "${params.feature_name}" generated`,
      });

      return data.instructions;
    } catch (error: any) {
      console.error('Generation failed:', error);
      
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate instructions",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadAllInstructions = async (): Promise<Instruction[]> => {
    try {
      const { data, error } = await supabase
        .from('ai_instructions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error: any) {
      console.error('Failed to load instructions:', error);
      toast({
        title: "Error",
        description: "Failed to load instructions",
        variant: "destructive",
      });
      return [];
    }
  };

  return {
    loading,
    generateInstructions,
    loadAllInstructions,
  };
};