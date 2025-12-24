/**
 * Lazy Image Loader
 * Implements progressive loading and intersection observer for optimal performance
 */

interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
  onLoad?: (img: HTMLImageElement) => void;
  onError?: (img: HTMLImageElement, error: Event) => void;
}

class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private loadedImages = new WeakSet<HTMLImageElement>();
  private loadingImages = new WeakMap<HTMLImageElement, Promise<void>>();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.initObserver();
    }
  }

  /**
   * Initialize Intersection Observer
   */
  private initObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );
  }

  /**
   * Load image with error handling and callbacks
   */
  private async loadImage(img: HTMLImageElement): Promise<void> {
    if (this.loadedImages.has(img)) return;

    // Check if already loading
    const existingPromise = this.loadingImages.get(img);
    if (existingPromise) return existingPromise;

    const loadPromise = new Promise<void>((resolve, reject) => {
      const dataSrc = img.getAttribute('data-src');
      const dataSrcset = img.getAttribute('data-srcset');

      if (!dataSrc && !dataSrcset) {
        resolve();
        return;
      }

      const tempImg = new Image();

      tempImg.onload = () => {
        if (dataSrc) img.src = dataSrc;
        if (dataSrcset) img.srcset = dataSrcset;
        
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        img.classList.add('lazy-loaded');
        
        this.loadedImages.add(img);
        this.loadingImages.delete(img);
        
        const onLoad = img.getAttribute('data-onload');
        if (onLoad) {
          try {
            const fn = new Function('img', onLoad);
            fn(img);
          } catch (error) {
            console.error('Error executing onload callback:', error);
          }
        }
        
        resolve();
      };

      tempImg.onerror = (error) => {
        img.classList.add('lazy-error');
        this.loadingImages.delete(img);
        
        const onError = img.getAttribute('data-onerror');
        if (onError) {
          try {
            const fn = new Function('img', 'error', onError);
            fn(img, error);
          } catch (err) {
            console.error('Error executing onerror callback:', err);
          }
        }
        
        reject(error);
      };

      if (dataSrc) tempImg.src = dataSrc;
      if (dataSrcset) tempImg.srcset = dataSrcset;
    });

    this.loadingImages.set(img, loadPromise);
    return loadPromise;
  }

  /**
   * Observe image for lazy loading
   */
  observe(img: HTMLImageElement, options?: LazyLoadOptions): void {
    if (this.loadedImages.has(img)) return;

    // Set placeholder if provided
    if (options?.placeholder && !img.src) {
      img.src = options.placeholder;
    }

    // Add loading class
    img.classList.add('lazy-loading');

    if (this.observer) {
      this.observer.observe(img);
    } else {
      // Fallback: load immediately if IntersectionObserver not supported
      this.loadImage(img);
    }
  }

  /**
   * Unobserve image
   */
  unobserve(img: HTMLImageElement): void {
    this.observer?.unobserve(img);
    this.loadingImages.delete(img);
  }

  /**
   * Preload images that will be needed soon
   */
  async preload(urls: string[]): Promise<void[]> {
    const promises = urls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
    });

    return Promise.all(promises);
  }

  /**
   * Disconnect observer
   */
  disconnect(): void {
    this.observer?.disconnect();
    // WeakMap doesn't need manual cleanup
  }

  /**
   * Get loading status
   */
  isLoaded(img: HTMLImageElement): boolean {
    return this.loadedImages.has(img);
  }

  isLoading(img: HTMLImageElement): boolean {
    return this.loadingImages.has(img);
  }
}

// Singleton instance
export const lazyImageLoader = new LazyImageLoader();

/**
 * React hook for lazy loading images
 */
export function useLazyImage(
  ref: React.RefObject<HTMLImageElement>,
  options?: LazyLoadOptions
) {
  React.useEffect(() => {
    const img = ref.current;
    if (!img) return;

    lazyImageLoader.observe(img, options);

    return () => {
      lazyImageLoader.unobserve(img);
    };
  }, [ref, options]);
}

// Export for React import
import React from 'react';
