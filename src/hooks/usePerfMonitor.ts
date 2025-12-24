// MONITORING DISABLED - Sovereignty mode active
// Performance tracking removed to prevent external calls
export const usePerfMonitor = (moduleName: string) => {
  // No-op hook - monitoring disabled
  const trackCustomMetric = async (metricType: string, value: number, unit: string = 'ms') => {
    // Local console only - no external calls
    console.debug(`[${moduleName}] Metric: ${metricType} = ${value}${unit}`);
  };

  return { trackCustomMetric };
};
