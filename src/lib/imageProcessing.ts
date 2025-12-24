import { supabase } from "@/integrations/supabase/client";
import { imageCache } from "./imageCache";

export interface ImageProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill';
  };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  };
}

export interface ProcessedImageResult {
  processedImage: string;
  metadata: {
    originalWidth: number;
    originalHeight: number;
    processedWidth: number;
    processedHeight: number;
    format: string;
    size: number;
  };
  fromCache?: boolean;
}

/**
 * Process an image using server-side processing for optimal performance
 * Handles large images efficiently with resize, format conversion, and filters
 * Implements multi-layer caching for faster repeated operations
 */
export async function processImage(
  imageSource: string | File,
  operations: ImageProcessingOptions
): Promise<ProcessedImageResult> {
  try {
    // Check cache first
    const cached = await imageCache.get(imageSource, operations);
    if (cached) {
      // Parse cached result
      try {
        const result = JSON.parse(cached);
        return { ...result, fromCache: true };
      } catch {
        // If cache is corrupted, proceed with processing
      }
    }
    let payload: { imageUrl?: string; imageData?: string; operations: ImageProcessingOptions };

    if (typeof imageSource === 'string') {
      // URL-based processing
      payload = {
        imageUrl: imageSource,
        operations
      };
    } else {
      // File-based processing - convert to base64
      const base64 = await fileToBase64(imageSource);
      payload = {
        imageData: base64,
        operations
      };
    }

    const { data, error } = await supabase.functions.invoke('process-image', {
      body: payload
    });

    if (error) throw error;
    if (!data) throw new Error('No data returned from image processing');

    const result = data as ProcessedImageResult;
    
    // Cache the result
    await imageCache.set(imageSource, operations, JSON.stringify(result));

    return result;
  } catch (error: any) {
    console.error('Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Optimize an image for web display
 * Automatically resizes to reasonable dimensions and compresses
 */
export async function optimizeImageForWeb(
  imageSource: string | File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 85
): Promise<ProcessedImageResult> {
  return processImage(imageSource, {
    resize: {
      width: maxWidth,
      height: maxHeight,
      fit: 'contain'
    },
    quality,
    format: 'webp'
  });
}

/**
 * Create a thumbnail from an image
 */
export async function createThumbnail(
  imageSource: string | File,
  size: number = 200
): Promise<ProcessedImageResult> {
  return processImage(imageSource, {
    resize: {
      width: size,
      height: size,
      fit: 'cover'
    },
    quality: 80,
    format: 'webp'
  });
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Batch process multiple images
 */
export async function batchProcessImages(
  images: (string | File)[],
  operations: ImageProcessingOptions
): Promise<ProcessedImageResult[]> {
  const promises = images.map(image => processImage(image, operations));
  return Promise.all(promises);
}
