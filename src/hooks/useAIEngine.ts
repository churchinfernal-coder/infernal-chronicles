import { supabase } from "@/integrations/supabase/client";

export function useAIEngine() {
  // ===== ERROR OPERATIONS =====
  const scanErrors = async () => {
    const { data, error } = await supabase
      .from('ai_error_logs')
      .select('*')
      .order('timestamp', { ascending: false });
    return { data, error };
  };

  const createError = async (payload: {
    module_name: string;
    error_type: string;
    error_message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    stack_trace?: string;
    status?: string;
    metadata?: Record<string, any>;
  }) => {
    const { data, error } = await supabase
      .from('ai_error_logs')
      .insert([payload])
      .select()
      .single();
    return { data, error };
  };

  const updateErrorStatus = async (errorId: string, status: string) => {
    const { data, error } = await supabase
      .from('ai_error_logs')
      .update({ status })
      .eq('id', errorId)
      .select()
      .single();
    return { data, error };
  };

  const deleteError = async (errorId: string) => {
    const { error } = await supabase
      .from('ai_error_logs')
      .delete()
      .eq('id', errorId);
    return { error };
  };

  // ===== FIX OPERATIONS =====
  const getAllFixes = async () => {
    const { data, error } = await supabase
      .from('ai_engine_fixes')
      .select('*, ai_engine_errors(*)')
      .order('created_at', { ascending: false });
    return { data, error };
  };

  const suggestFix = async (errorId: string) => {
    const { data, error } = await supabase
      .from('ai_engine_fixes')
      .select('*')
      .eq('error_id', errorId)
      .order('created_at', { ascending: false });
    return { data, error };
  };

  const applyFix = async (fixId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-apply-fix', {
        body: { fixId }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { data: null, error };
      }

      if (!data || !data.success) {
        console.error('Function returned error:', data);
        return { 
          data: null, 
          error: { message: data?.error || 'Unknown error from function' } 
        };
      }

      return { data: data.data, error: null };
    } catch (err) {
      console.error('Exception calling ai-apply-fix:', err);
      return { 
        data: null, 
        error: { message: err instanceof Error ? err.message : 'Unknown error' } 
      };
    }
  };

  const createFix = async (payload: {
    error_id: string;
    fix_description: string;
    script_reference?: string;
  }) => {
    const { data, error } = await supabase
      .from('ai_engine_fixes')
      .insert([payload])
      .select()
      .single();
    return { data, error };
  };

  const deleteFix = async (fixId: string) => {
    const { error } = await supabase
      .from('ai_engine_fixes')
      .delete()
      .eq('id', fixId);
    return { error };
  };

  const getAppliedFixes = async () => {
    const { data, error } = await supabase
      .from('ai_engine_fixes')
      .select('*, ai_engine_errors(*)')
      .eq('applied', true)
      .order('applied_at', { ascending: false });
    return { data, error };
  };

  // ===== INSTRUCTION OPERATIONS =====
  const getAllInstructions = async () => {
    const { data, error } = await supabase
      .from('ai_engine_instructions')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  };

  const generateInstructions = async (payload: {
    feature_name: string;
    category: string;
    feature_path?: string;
    code_context?: string;
    instructions: string;
  }) => {
    const { data, error } = await supabase
      .from('ai_engine_instructions')
      .insert([payload])
      .select()
      .single();
    return { data, error };
  };

  const updateInstruction = async (id: string, payload: Partial<{
    feature_name: string;
    category: string;
    feature_path: string;
    code_context: string;
    instructions: string;
  }>) => {
    const { data, error } = await supabase
      .from('ai_engine_instructions')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  };

  const deleteInstruction = async (id: string) => {
    const { error } = await supabase
      .from('ai_engine_instructions')
      .delete()
      .eq('id', id);
    return { error };
  };

  // ===== DEPLOYMENT OPERATIONS =====
  const getAllDeployments = async () => {
    const { data, error } = await supabase
      .from('ai_deployments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    return { data, error };
  };

  const createDeployment = async (payload: {
    modification_id?: string;
    deployment_type: string;
    status: string;
    deployment_log?: Record<string, any>;
  }) => {
    const { data, error } = await supabase
      .from('ai_deployments')
      .insert([payload])
      .select()
      .single();
    return { data, error };
  };

  const updateDeployment = async (id: string, payload: {
    status?: string;
    deployment_log?: Record<string, any>;
    deployed_at?: string;
  }) => {
    const { data, error } = await supabase
      .from('ai_deployments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  };

  // ===== PERFORMANCE OPERATIONS =====
  const getPerformanceMetrics = async (limit = 100) => {
    const { data, error } = await supabase
      .from('ai_performance_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    return { data, error };
  };

  const getMetricsByType = async (metricType: string, limit = 50) => {
    const { data, error } = await supabase
      .from('ai_performance_metrics')
      .select('*')
      .eq('metric_type', metricType)
      .order('timestamp', { ascending: false })
      .limit(limit);
    return { data, error };
  };

  const getMetricsByModule = async (moduleName: string, limit = 50) => {
    const { data, error } = await supabase
      .from('ai_performance_metrics')
      .select('*')
      .eq('module_name', moduleName)
      .order('timestamp', { ascending: false })
      .limit(limit);
    return { data, error };
  };

  // ===== FEEDBACK OPERATIONS =====
  const getAllFeedback = async () => {
    const { data, error } = await supabase
      .from('ai_user_feedback')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  };

  const createFeedback = async (payload: {
    user_id: string;
    error_description: string;
    severity: string;
    module_name?: string;
    screenshot_url?: string;
  }) => {
    const { data, error } = await supabase
      .from('ai_user_feedback')
      .insert([payload])
      .select()
      .single();
    return { data, error };
  };

  const updateFeedbackStatus = async (id: string, status: string, aiAnalysis?: Record<string, any>) => {
    const updateData: any = { status };
    if (aiAnalysis) {
      updateData.ai_analysis = aiAnalysis;
    }
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('ai_user_feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  };

  return {
    // Errors
    scanErrors,
    createError,
    updateErrorStatus,
    deleteError,
    
    // Fixes
    getAllFixes,
    suggestFix,
    applyFix,
    createFix,
    deleteFix,
    getAppliedFixes,
    
    // Instructions
    getAllInstructions,
    generateInstructions,
    updateInstruction,
    deleteInstruction,
    
    // Deployments
    getAllDeployments,
    createDeployment,
    updateDeployment,
    
    // Performance
    getPerformanceMetrics,
    getMetricsByType,
    getMetricsByModule,
    
    // Feedback
    getAllFeedback,
    createFeedback,
    updateFeedbackStatus
  };
}
