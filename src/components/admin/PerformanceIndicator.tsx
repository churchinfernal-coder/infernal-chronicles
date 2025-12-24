import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export function PerformanceIndicator() {
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measurePerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      
      // Calculate FPS every second
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;

        // Memory usage (if available)
        const perf = performance as any;
        if (perf.memory) {
          const usedMemory = perf.memory.usedJSHeapSize / 1048576; // Convert to MB
          setMemoryUsage(Math.round(usedMemory));
        }
      }

      animationFrameId = requestAnimationFrame(measurePerformance);
    };

    animationFrameId = requestAnimationFrame(measurePerformance);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const getFpsColor = () => {
    if (fps >= 55) return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (fps >= 30) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
    return "bg-red-500/10 text-red-700 dark:text-red-400";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2 items-center">
      <Badge variant="outline" className={getFpsColor()}>
        <Activity className="w-3 h-3 mr-1" />
        {fps} FPS
      </Badge>
      {memoryUsage > 0 && (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
          {memoryUsage} MB
        </Badge>
      )}
    </div>
  );
}
