import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIFix {
  id: string;
  error_id: string | null;
  fix_description: string;
  script_reference: string | null;
  created_at: string;
  applied: boolean;
  applied_at: string | null;
  verified: boolean;
  verification_log: string | null;
  success_rate: number;
  metadata: any;
}

export interface AIFixStats {
  total: number;
  applied: number;
  pending: number;
  failed: number;
  avgSuccessRate: number;
  verificationCompleteness: number;
}

let globalEngineInitialized = false;

export const useAIFixEngine = () => {
  const [fixes, setFixes] = useState<AIFix[]>([]);
  const [stats, setStats] = useState<AIFixStats>({
    total: 0,
    applied: 0,
    pending: 0,
    failed: 0,
    avgSuccessRate: 0,
    verificationCompleteness: 0,
  });
  const [loading, setLoading] = useState(false);
  const [applyingFix, setApplyingFix] = useState<string | null>(null);

  useEffect(() => {
    if (!globalEngineInitialized) {
      globalEngineInitialized = true;
      loadFixes();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadFixes, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const loadFixes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_engine_fixes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const fixesData = data || [];
      setFixes(fixesData);
      calculateStats(fixesData);
    } catch (error: any) {
      console.error('Error loading AI fixes:', error);
      toast.error('Failed to load AI fixes');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (fixesData: AIFix[]) => {
    const total = fixesData.length;
    const applied = fixesData.filter(f => f.applied).length;
    const failed = fixesData.filter(f => f.verified === false && f.applied).length;
    const pending = total - applied;
    
    const avgSuccessRate = fixesData.length > 0
      ? fixesData.reduce((sum, f) => sum + (f.success_rate || 0), 0) / fixesData.length
      : 0;
    
    const withVerification = fixesData.filter(f => f.verification_log).length;
    const verificationCompleteness = total > 0 ? (withVerification / total) * 100 : 0;

    setStats({
      total,
      applied,
      pending,
      failed,
      avgSuccessRate,
      verificationCompleteness,
    });
  };

  const applyFix = async (fixId: string) => {
    try {
      setApplyingFix(fixId);
      
      const { error } = await supabase
        .from('ai_engine_fixes')
        .update({
          applied: true,
          applied_at: new Date().toISOString(),
          verification_log: 'Fix applied manually via dashboard',
        })
        .eq('id', fixId);

      if (error) throw error;

      toast.success('Fix applied successfully');
      await loadFixes();
    } catch (error: any) {
      console.error('Error applying fix:', error);
      toast.error('Failed to apply fix');
    } finally {
      setApplyingFix(null);
    }
  };

  const rollbackFix = async (fixId: string) => {
    try {
      const { error } = await supabase
        .from('ai_engine_fixes')
        .update({
          applied: false,
          applied_at: null,
          verification_log: `Rolled back at ${new Date().toISOString()}`,
        })
        .eq('id', fixId);

      if (error) throw error;

      toast.success('Fix rolled back successfully');
      await loadFixes();
    } catch (error: any) {
      console.error('Error rolling back fix:', error);
      toast.error('Failed to rollback fix');
    }
  };

  const updateVerificationLog = async (fixId: string, log: string) => {
    try {
      const { error } = await supabase
        .from('ai_engine_fixes')
        .update({
          verification_log: log,
          verified: true,
        })
        .eq('id', fixId);

      if (error) throw error;

      toast.success('Verification log updated');
      await loadFixes();
    } catch (error: any) {
      console.error('Error updating verification log:', error);
      toast.error('Failed to update verification log');
    }
  };

  return {
    fixes,
    stats,
    loading,
    applyingFix,
    loadFixes,
    applyFix,
    rollbackFix,
    updateVerificationLog,
  };
};
