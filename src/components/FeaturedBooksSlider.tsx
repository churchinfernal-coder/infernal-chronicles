import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";

interface FeaturedBook {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_image_url: string | null;
  amazon_url: string | null;
  price_cents: number;
  category: string;
  featured: boolean;
}

export default function FeaturedBooksSlider() {
  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);
  const navigate = useNavigate();
  const [autoplayPlugin] = useState(() => Autoplay({ delay: 4000, stopOnInteraction: true }));

  useEffect(() => {
    fetchFeaturedBooks();

    const channel = supabase
      .channel('featured_books_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'occult_library_books'
        },
        () => fetchFeaturedBooks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFeaturedBooks = async () => {
    // FIXED: Removed . order() - it was trying to order by non-existent column
    const { data, error } = await (supabase as any)
      .from("occult_library_books")
      .select("*")
      .eq("featured", true);

    if (! error && data) {
      console.log(`✅ Loaded ${data.length} featured books`);
      setFeaturedBooks(data);
    } else if (error) {
      console. error('❌ Error loading featured books:', error);
    }
  };

  if (featuredBooks.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-crimson/10 to-crimson/5 border-y border-crimson/20 py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-crimson fill-crimson" />
          <h2 className="text-xl font-bold text-crimson">Featured Books</h2>
          <Badge variant="outline" className="ml-auto">{featuredBooks.length} Featured</Badge>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[autoplayPlugin]}
          className="w-full"
        >
          <CarouselContent>
            {featuredBooks.map((book) => (
              <CarouselItem key={book.id} className="md:basis-1/2 lg:basis-1/3">
                <Card className="bg-background/90 border-crimson/30 hover:border-crimson/60 transition-all h-full">
                  <CardContent className="p-4 flex gap-4">
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="w-24 h-32 object-cover rounded border border-crimson/20"
                      />
                    ) : (
                      <div className="w-24 h-32 bg-crimson/10 rounded border border-crimson/20 flex items-center justify-center">
                        <Star className="h-8 w-8 text-crimson/40" />
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-bold text-crimson line-clamp-2 mb-1">
                          {book.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          by {book.author}
                        </p>
                        <Badge variant="outline" className="text-xs mb-2">
                          {book.category}
                        </Badge>
                        <p className="text-xs text-foreground/80 line-clamp-2">
                          {book.description}
                        </p>
                      </div>

                      <div className="space-y-2 mt-3">
                        {book.amazon_url ? (
                          <Button
                            size="sm"
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => window.open(book.amazon_url!, '_blank')}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Buy on Amazon
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-crimson/40"
                            onClick={() => navigate(`/occult-library`)}
                          >
                            ${(book.price_cents / 100).toFixed(2)} - View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="border-crimson/40" />
          <CarouselNext className="border-crimson/40" />
        </Carousel>
      </div>
    </div>
  );
}