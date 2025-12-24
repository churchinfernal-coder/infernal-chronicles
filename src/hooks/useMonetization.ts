import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UsageSummary {
  total_credits_used: number;
  today_credits_used: number;
  month_credits_used: number;
  tier_limit: number;
  tier_name: string;
  usage_by_module: { module: string; credits: number }[];
}

export const useMonetization = () => {
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsageSummary();
  }, []);

  const loadUsageSummary = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get usage logs
      const { data: logs, error } = await (supabase as any)
        .from('ai_usage_log')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const total = logs?.reduce((sum: number, log: any) => sum + (log.credits_used || 0), 0) || 0;
      const today = logs?.filter((log: any) => new Date(log.timestamp) >= todayStart)
        .reduce((sum: number, log: any) => sum + (log.credits_used || 0), 0) || 0;
      const month = logs?.filter((log: any) => new Date(log.timestamp) >= monthStart)
        .reduce((sum: number, log: any) => sum + (log.credits_used || 0), 0) || 0;

      // Calculate usage by module
      const moduleMap: { [key: string]: number } = {};
      logs?.forEach((log: any) => {
        const module = log.module_name || 'Unknown';
        moduleMap[module] = (moduleMap[module] || 0) + (log.credits_used || 0);
      });

      const usageByModule = Object.entries(moduleMap).map(([module, credits]) => ({
        module,
        credits: credits as number,
      }));

      setUsageSummary({
        total_credits_used: total,
        today_credits_used: today,
        month_credits_used: month,
        tier_limit: 1000, // Default tier limit, should be fetched from subscription
        tier_name: 'Free',
        usage_by_module: usageByModule,
      });
    } catch (error: any) {
      console.error('Error loading usage summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const logUsage = async (module_name: string, action: string, credits_used: number = 1, metadata?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from('ai_usage_log')
        .insert({
          user_id: user.id,
          module_name,
          action,
          credits_used,
          metadata: metadata || {},
        });

      if (error) throw error;

      // Refresh summary
      await loadUsageSummary();
    } catch (error: any) {
      console.error('Error logging usage:', error);
    }
  };

  const checkTierAccess = (requiredTier: string): boolean => {
    // Basic tier checking logic
    const tierHierarchy = ['free', 'basic', 'premium', 'enterprise'];
    const currentIndex = tierHierarchy.indexOf(usageSummary?.tier_name.toLowerCase() || 'free');
    const requiredIndex = tierHierarchy.indexOf(requiredTier.toLowerCase());
    return currentIndex >= requiredIndex;
  };

  return {
    usageSummary,
    loading,
    loadUsageSummary,
    logUsage,
    checkTierAccess,
  };
};
