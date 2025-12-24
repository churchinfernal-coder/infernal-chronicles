// MONITORING DISABLED - Sovereignty mode active
// External error tracking removed to prevent data leakage
export const useErrorDetection = (moduleName: string) => {
  // No-op hook - monitoring disabled
  const logError = async (error: Error, context?: any) => {
    // Local console only - no external calls
    console.error(`[${moduleName}] Error logged locally:`, error, context);
  };

  return { logError };
};
