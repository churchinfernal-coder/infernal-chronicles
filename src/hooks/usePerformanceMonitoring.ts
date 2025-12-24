// MONITORING DISABLED - Sovereignty mode active
// Performance tracking removed to prevent external calls

export const usePerformanceMonitoring = (moduleName: string) => {
  // No-op hook - monitoring disabled
  const logMetric = async (
    metricType: string,
    value: number,
    unit: string,
    metadata?: any
  ) => {
    // Local console only - no external calls
    console.debug(`[${moduleName}] Metric: ${metricType} = ${value}${unit}`, metadata);
  };

  const measureOperation = async <T,>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    console.debug(`[${moduleName}] Starting operation: ${operationName}`);
    const result = await operation();
    console.debug(`[${moduleName}] Completed operation: ${operationName}`);
    return result;
  };

  return { logMetric, measureOperation };
};
