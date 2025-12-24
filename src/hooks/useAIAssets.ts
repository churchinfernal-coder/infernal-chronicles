import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIAsset {
  id: string;
  fix_id: string | null;
  asset_path: string | null;
  asset_type: string | null;
  resolution: string | null;
  format: string | null;
  verified_by: string | null;
  module_name: string | null;
  created_at: string;
}

export const useAIAssets = () => {
  const [assets, setAssets] = useState<AIAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAssets();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAssets, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('ai_asset_wiring')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAssets((data as AIAsset[]) || []);
    } catch (error: any) {
      console.error('Error loading AI assets:', error);
      toast.error('Failed to load AI assets');
    } finally {
      setLoading(false);
    }
  };

  return {
    assets,
    loading,
    loadAssets,
  };
};
