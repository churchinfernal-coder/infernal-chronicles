/**
 * Image Cache Utility
 * Implements multi-layer caching (memory + IndexedDB) for processed images
 */

interface CachedImage {
  data: string;
  timestamp: number;
  operations: string;
  size: number;
}

class ImageCache {
  private memoryCache: Map<string, CachedImage> = new Map();
  private dbName = 'ImageProcessingCache';
  private storeName = 'processedImages';
  private maxMemoryCacheSizeMB = 50;
  private maxCacheAgeDays = 7;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Generate cache key from image source and operations
   */
  private generateKey(source: string | File, operations: any): string {
    const sourceKey = typeof source === 'string' 
      ? source.substring(0, 100) // Use first 100 chars of URL
      : `${source.name}_${source.size}_${source.lastModified}`;
    
    const opsKey = JSON.stringify(operations);
    return `${sourceKey}_${opsKey}`;
  }

  /**
   * Get total size of memory cache in MB
   */
  private getMemoryCacheSizeMB(): number {
    let totalSize = 0;
    this.memoryCache.forEach(item => totalSize += item.size);
    return totalSize / (1024 * 1024);
  }

  /**
   * Evict oldest items from memory cache if size exceeds limit
   */
  private evictMemoryCache(): void {
    if (this.getMemoryCacheSizeMB() <= this.maxMemoryCacheSizeMB) return;

    // Sort by timestamp and remove oldest
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    while (this.getMemoryCacheSizeMB() > this.maxMemoryCacheSizeMB && entries.length > 0) {
      const [key] = entries.shift()!;
      this.memoryCache.delete(key);
    }
  }

  /**
   * Get cached image from memory or IndexedDB
   */
  async get(source: string | File, operations: any): Promise<string | null> {
    const key = this.generateKey(source, operations);

    // Check memory cache first
    const memCached = this.memoryCache.get(key);
    if (memCached) {
      // Check if not expired
      const ageMs = Date.now() - memCached.timestamp;
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays <= this.maxCacheAgeDays) {
        return memCached.data;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // Check IndexedDB
    try {
      const dbCached = await this.getFromDB(key);
      if (dbCached) {
        const ageMs = Date.now() - dbCached.timestamp;
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays <= this.maxCacheAgeDays) {
          // Restore to memory cache
          this.memoryCache.set(key, dbCached);
          this.evictMemoryCache();
          return dbCached.data;
        } else {
          await this.deleteFromDB(key);
        }
      }
    } catch (error) {
      console.warn('IndexedDB cache read failed:', error);
    }

    return null;
  }

  /**
   * Store processed image in cache
   */
  async set(source: string | File, operations: any, data: string): Promise<void> {
    const key = this.generateKey(source, operations);
    
    // Estimate size (base64 is ~4/3 of binary size)
    const size = data.length * 0.75;
    
    const cached: CachedImage = {
      data,
      timestamp: Date.now(),
      operations: JSON.stringify(operations),
      size
    };

    // Store in memory cache
    this.memoryCache.set(key, cached);
    this.evictMemoryCache();

    // Store in IndexedDB asynchronously
    try {
      await this.setInDB(key, cached);
    } catch (error) {
      console.warn('IndexedDB cache write failed:', error);
    }
  }

  /**
   * Get from IndexedDB
   */
  private async getFromDB(key: string): Promise<CachedImage | null> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Set in IndexedDB
   */
  private async setInDB(key: string, value: CachedImage): Promise<void> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete from IndexedDB
   */
  private async deleteFromDB(key: string): Promise<void> {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cache (memory and IndexedDB)
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memoryCacheSizeMB: number;
    memoryCacheItems: number;
    dbCacheItems: number;
  }> {
    if (!this.db) await this.initDB();
    
    const dbCount = await new Promise<number>((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return {
      memoryCacheSizeMB: this.getMemoryCacheSizeMB(),
      memoryCacheItems: this.memoryCache.size,
      dbCacheItems: dbCount
    };
  }
}

// Singleton instance
export const imageCache = new ImageCache();
