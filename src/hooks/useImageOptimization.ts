import { useState, useCallback, useRef, useEffect } from 'react';
import { processImage, ImageProcessingOptions, ProcessedImageResult } from '@/lib/imageProcessing';
import { imageCache } from '@/lib/imageCache';

interface UseImageOptimizationOptions {
  autoOptimize?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

interface UseImageOptimizationReturn {
  processedImage: string | null;
  isProcessing: boolean;
  error: string | null;
  metadata: ProcessedImageResult['metadata'] | null;
  fromCache: boolean;
  optimize: (source: string | File, options?: ImageProcessingOptions) => Promise<void>;
  reset: () => void;
  getCacheStats: () => Promise<any>;
  clearCache: () => Promise<void>;
}

/**
 * Hook for optimized image processing with caching
 */
export function useImageOptimization(
  defaultOptions?: UseImageOptimizationOptions
): UseImageOptimizationReturn {
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ProcessedImageResult['metadata'] | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const optimize = useCallback(async (
    source: string | File,
    options?: ImageProcessingOptions
  ) => {
    // Abort previous request if still processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsProcessing(true);
    setError(null);
    setFromCache(false);

    try {
      const mergedOptions: ImageProcessingOptions = {
        resize: {
          width: defaultOptions?.maxWidth,
          height: defaultOptions?.maxHeight,
          fit: 'contain'
        },
        quality: defaultOptions?.quality || 85,
        format: defaultOptions?.format || 'webp',
        ...options
      };

      const result = await processImage(source, mergedOptions);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setProcessedImage(result.processedImage);
      setMetadata(result.metadata);
      setFromCache(result.fromCache || false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to process image');
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [defaultOptions]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setProcessedImage(null);
    setMetadata(null);
    setError(null);
    setFromCache(false);
  }, []);

  const getCacheStats = useCallback(async () => {
    return await imageCache.getStats();
  }, []);

  const clearCache = useCallback(async () => {
    await imageCache.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    processedImage,
    isProcessing,
    error,
    metadata,
    fromCache,
    optimize,
    reset,
    getCacheStats,
    clearCache
  };
}
