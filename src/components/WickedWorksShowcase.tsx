import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ShowcaseImage {
  id: string;
  image_url: string;
  prompt: string;
  style: string;
}

export const WickedWorksShowcase = () => {
  const [images, setImages] = useState<ShowcaseImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShowcaseImages();
  }, []);

  const loadShowcaseImages = async () => {
    try {
      setLoading(true);
      
      // Get admin users
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (!adminRoles || adminRoles.length === 0) {
        setImages([]);
        return;
      }

      const adminUserIds = adminRoles.map(r => r.user_id);

      // Get AI images created by admins
      const { data, error } = await supabase
        .from('ai_generated_images')
        .select('id, image_url, prompt, style')
        .in('user_id', adminUserIds)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;

      setImages(data || []);
    } catch (error) {
      console.error('Error loading showcase images:', error);
      toast.error('Failed to load showcase gallery');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No showcase images available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Showcase Gallery
        </CardTitle>
        <p className="text-sm sm:text-base text-muted-foreground">
          Explore what's possible with Wicked Works AI
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300"
            >
              <img
                src={image.image_url}
                alt={image.prompt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs text-foreground/90 line-clamp-2">{image.prompt}</p>
                  <p className="text-[10px] sm:text-xs text-primary/80 mt-0.5 sm:mt-1 capitalize">{image.style.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
