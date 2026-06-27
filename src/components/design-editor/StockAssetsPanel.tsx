import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { searchStockImages, getRandomStockImages, trackDownload, StockImage } from '@/lib/stockAssets';
import { toast } from 'sonner';

interface StockAssetsPanelProps {
  onImageSelect: (imageUrl: string) => void;
}

export function StockAssetsPanel({ onImageSelect }: StockAssetsPanelProps) {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<StockImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadRandomImages();
  }, []);

  const loadRandomImages = async () => {
    setLoading(true);
    try {
      const results = await getRandomStockImages(30);
      setImages(results);
    } catch (error) {
      toast.error('Failed to load stock images');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      loadRandomImages();
      return;
    }

    setLoading(true);
    setPage(1);
    try {
      const results = await searchStockImages(query, 1);
      setImages(results);
      if (results.length === 0) {
        toast.info('No results found');
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image: StockImage) => {
    trackDownload(image.urls.full);
    onImageSelect(image.urls. regular);
    toast.success(`Added image by ${image.user.name}`);
  };

  const loadMore = async () => {
    if (! query.trim()) return;
    
    setLoading(true);
    const nextPage = page + 1;
    try {
      const results = await searchStockImages(query, nextPage);
      setImages(prev => [...prev, ...results]);
      setPage(nextPage);
    } catch (error) {
      toast.error('Failed to load more');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Stock Assets
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Free stock photos from Unsplash
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="Search stock photos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} size="sm" disabled={loading}>
            {loading ?  <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[500px]">
        {loading && images.length === 0 ?  (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-purple-500 transition-all"
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image. urls.small}
                  alt={image. alt_description || 'Stock photo'}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">by {image.user.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && query && (
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="w-full mt-4"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Load More
          </Button>
        )}
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        Photos by <a href="https://unsplash.com" target="_blank" rel="noopener" className="underline">Unsplash</a>
      </p>
    </div>
  );
}