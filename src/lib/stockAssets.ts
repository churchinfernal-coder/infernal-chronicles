const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 'demo';

export interface StockImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
  };
  description: string | null;
  alt_description: string | null;
}

export async function searchStockImages(query: string, page: number = 1): Promise<StockImage[]> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=30&client_id=${UNSPLASH_ACCESS_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch stock images');
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Stock image search error:', error);
    return [];
  }
}

export async function getRandomStockImages(count: number = 30): Promise<StockImage[]> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?count=${count}&client_id=${UNSPLASH_ACCESS_KEY}`
    );

    if (!response. ok) {
      throw new Error('Failed to fetch random stock images');
    }

    return await response.json();
  } catch (error) {
    console.error('Random stock images error:', error);
    return [];
  }
}

export function trackDownload(downloadLocation: string) {
  // Unsplash requires tracking downloads
  if (UNSPLASH_ACCESS_KEY !== 'demo') {
    fetch(downloadLocation);
  }
}