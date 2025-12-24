// MONITORING DISABLED - Sovereignty mode active
// External error tracking removed to prevent data leakage
export const useErrorMonitor = (componentName: string) => {
  // No-op hook - monitoring disabled
  const logError = async (details: any) => {
    // Local console only - no external calls
    console.error(`[${componentName}] Error logged locally:`, details);
  };

  return { logError };
};
