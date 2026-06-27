import { useState, useEffect, useRef } from "react";
import { Flame, Loader2, AlertCircle, Camera } from "lucide-react";
import { PhotoGrid } from "@/components/PhotoGrid";
import { PhotoUpload } from "@/components/PhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export interface Photo {
  id:  string;
  url: string;
  title? :  string;
  createdAt: string;
  width:  number;
  height: number;
  saved? :  boolean;
  user_id? :  string;
  username?:  string;
  avatar_url?:  string;
}

interface RateLimit {
  id: string;
  user_id: string;
  upload_count: number;
  window_start: string;
  created_at: string;
}

export default function PicturePalace() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [souls, setSouls] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadLimit] = useState(10);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    checkAuthAndLoadPhotos();
    const unsubscribe = subscribeToPhotos();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const checkAuthAndLoadPhotos = async () => {
    setLoading(true);
    try {
      const { data:   { user }, error } = await supabase. auth.getUser();

      if (error || !user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access Picture Palace",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setCurrentUserId(user.id);
      await loadPhotos();
      await checkRateLimit(user.id);
    } catch (error) {
      console.error("Authentication check failed:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .order("created_at", { ascending:  false });

      if (error) {
        console.error("Error loading photos:", error);
        toast({
          title: "Error",
          description: "Failed to load photos",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        const loadedPhotos:  Photo[] = data
          .filter((p:  any) => p.url && p.id) // Filter out invalid entries
          .map((p:  any) => ({
            id: p.id,
            url: p.url,
            title: p.title || undefined,
            createdAt: p.created_at,
            width: p.width || 600,
            height: p.height || 400,
            user_id: p.user_id,
          }));
        
        console.log("Loaded photos:", loadedPhotos); // Debug log
        setPhotos(loadedPhotos);
        setSouls(loadedPhotos.length);
      } else {
        setPhotos([]);
        setSouls(0);
      }
    } catch (error) {
      console.error("Failed to load photos:", error);
      toast({
        title: "Error",
        description:  "An error occurred while loading photos",
        variant: "destructive",
      });
    }
  };

  const subscribeToPhotos = () => {
    const channel = supabase
      .channel('gallery-photos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_photos'
        },
        () => {
          loadPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const checkRateLimit = async (userId:   string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("gallery_rate_limits")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Rate limit check error:", error);
        return;
      }

      if (data) {
        const rateLimit = data as RateLimit;
        const windowStart = new Date(rateLimit.window_start);
        const now = new Date();
        const hoursPassed = (now.getTime() - windowStart.getTime()) / (1000 * 60 * 60);

        if (hoursPassed >= 24) {
          await (supabase as any)
            .from("gallery_rate_limits")
            .update({ upload_count: 0, window_start: now. toISOString() })
            .eq("user_id", userId);
          setUploadCount(0);
        } else {
          setUploadCount(rateLimit.upload_count);
        }
      } else {
        await (supabase as any)
          .from("gallery_rate_limits")
          .insert({
            user_id: userId,
            upload_count: 0,
            window_start: new Date().toISOString()
          });
        setUploadCount(0);
      }
    } catch (error) {
      console.error("Rate limit check failed:", error);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!currentUserId) {
      toast({
        title:   "Session Expired",
        description: "Please log in again",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (uploadCount >= uploadLimit) {
      toast({
        title: "Upload Limit Reached",
        description: `You can only upload ${uploadLimit} photos per 24 hours.  Try again later.`,
        variant: "destructive",
      });
      return;
    }

    const remainingUploads = uploadLimit - uploadCount;
    if (files.length > remainingUploads) {
      toast({
        title: "Too Many Files",
        description: `You can only upload ${remainingUploads} more photo(s) today.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadedPhotos:   Photo[] = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast({
            title:  "Invalid File",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          });
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title:  "File Too Large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split(". ").pop()?.toLowerCase();
        const fileName = `${currentUserId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, file, {
            cacheControl:   '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}:  ${uploadError.message}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("gallery")
          .getPublicUrl(fileName);

        const { data: dbData, error: dbError } = await (supabase as any)
          .from("gallery_photos")
          .insert({
            user_id: currentUserId,
            url: publicUrl,
            title: file.name. replace(/\.[^/.]+$/, ""),
            width: 600,
            height: 400,
          })
          .select()
          .single();

        if (dbError) {
          console.error("Database error:", dbError);
          toast({
            title: "Save Failed",
            description: `Failed to save ${file.name}: ${dbError.message}`,
            variant: "destructive",
          });
          continue;
        }

        if (dbData) {
          uploadedPhotos.push({
            id: dbData.id,
            url: dbData.url,
            title: dbData. title || undefined,
            createdAt:   dbData.created_at,
            width: dbData.width || 600,
            height:  dbData.height || 400,
            user_id: currentUserId,
          });
        }
      }

      if (uploadedPhotos.length > 0) {
        await (supabase as any)
          .from("gallery_rate_limits")
          .update({ upload_count: uploadCount + uploadedPhotos.length })
          .eq("user_id", currentUserId);

        setUploadCount(prev => prev + uploadedPhotos.length);

        toast({
          title: "Upload Successful",
          description: `${uploadedPhotos.length} photo(s) uploaded`,
        });

        await loadPhotos();
      }
    } catch (error:  any) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Error",
        description: error?. message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;

    if (!currentUserId) {
      toast({
        title: "Session Expired",
        description: "Please log in again",
        variant:   "destructive",
      });
      navigate("/auth");
      return;
    }

    if (photo.user_id !== currentUserId) {
      toast({
        title: "Permission Denied",
        description: "You can only delete your own photos",
        variant: "destructive",
      });
      return;
    }

    // OPTIMISTIC UPDATE:  Remove from UI immediately
    setPhotos(prevPhotos => prevPhotos.filter(p => p.id !== id));
    setSouls(prev => prev - 1);

    try {
      // Extract the file path from the URL
      const urlParts = photo.url.split('/gallery/');
      
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        console.log("Photo URL:", photo.url);
        console.log("Attempting to delete file path:", filePath);
        
        // Delete from storage first and CHECK for errors
        const { data: storageData, error: storageError } = await supabase.storage
          . from("gallery")
          .remove([filePath]);

        if (storageError) {
          console.error("Storage delete error:", storageError);
          // Rollback optimistic update
          await loadPhotos();
          toast({
            title: "Delete Failed",
            description: `Failed to delete file from storage: ${storageError.message}`,
            variant: "destructive",
          });
          return;
        }

        console.log("Storage deletion successful:", storageData);
      }

      // Only delete from database if storage deletion succeeded
      const { error: dbError } = await supabase
        .from("gallery_photos")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUserId);

      if (dbError) {
        console.error("Database delete error:", dbError);
        // Rollback optimistic update
        await loadPhotos();
        toast({
          title: "Delete Failed",
          description: "Failed to delete photo record",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Photo Deleted",
        description: "Photo and file removed completely",
      });

      // Confirm deletion with fresh data from database
      await loadPhotos();
    } catch (error:  any) {
      console.error("Delete failed:", error);
      // Rollback optimistic update on error
      await loadPhotos();
      toast({
        title:   "Error",
        description: error?.message || "Failed to delete photo",
        variant:   "destructive",
      });
    }
  };

  const handleUpdate = async (id: string, title:  string) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;

    if (!currentUserId) {
      toast({
        title: "Session Expired",
        description:  "Please log in again",
        variant:  "destructive",
      });
      navigate("/auth");
      return;
    }

    if (photo.user_id !== currentUserId) {
      toast({
        title: "Permission Denied",
        description: "You can only edit your own photos",
        variant:   "destructive",
      });
      return;
    }

    try {
      const result = await (supabase as any)
        .from("gallery_photos")
        .update({ title })
        .eq("id", id)
        .eq("user_id", currentUserId);

      if (result.error) {
        console.error("Update error:", result.error);
        toast({
          title: "Update Failed",
          description: "Failed to update photo title",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Title Updated",
        description: "Photo title updated successfully",
      });

      await loadPhotos();
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        title: "Error",
        description: "Failed to update photo title",
        variant:   "destructive",
      });
    }
  };

  const handleCameraClick = () => {
    if (uploadCount >= uploadLimit) {
      toast({
        title: "Upload Limit Reached",
        description: `You can only upload ${uploadLimit} photos per 24 hours.`,
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleUpload(files);
    }
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (! currentUserId) {
    return null;
  }

  const remainingUploads = uploadLimit - uploadCount;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-secondary/20 pt-16">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
      />

      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Flame className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight truncate">
                  Picture Palace
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Community photo gallery
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <Button
                onClick={handleCameraClick}
                disabled={uploading || uploadCount >= uploadLimit}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 md:gap-2 text-xs sm:text-sm"
              >
                <Camera className="h-3. 5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden xs:inline">Camera</span>
              </Button>

              <PhotoUpload 
                onUpload={handleUpload} 
                disabled={uploading || uploadCount >= uploadLimit} 
              />
              
              <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md bg-card border border-border flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm shadow-sm">
                <Flame className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
                <span className="font-semibold">{souls}</span>
                <span className="text-muted-foreground hidden xs:inline">Photos</span>
              </div>
            </div>
          </div>

          {remainingUploads <= 3 && remainingUploads > 0 && (
            <div className="mt-2 md:mt-3 p-2 md:p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-500 shrink-0" />
              <p className="text-xs md:text-sm text-amber-500 font-medium">
                {remainingUploads} upload{remainingUploads !== 1 ? 's' :  ''} remaining today
              </p>
            </div>
          )}

          {uploadCount >= uploadLimit && (
            <div className="mt-2 md:mt-3 p-2 md:p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 md:h-4 md: w-4 text-red-500 shrink-0" />
              <p className="text-xs md:text-sm text-red-500 font-medium">
                Upload limit reached.   Try again in 24 hours.
              </p>
            </div>
          )}

          {uploading && (
            <div className="mt-2 md:mt-3 p-2 md:p-3 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin text-primary" />
              <p className="text-xs md: text-sm text-primary font-medium">
                Uploading to gallery...
              </p>
            </div>
          )}
        </div>
      </div>

      <main className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 pb-20 md:pb-6">
        <div className="w-full max-w-[1600px] mx-auto">
          {photos.length === 0 ? (
            <div className="text-center py-12 md:py-20">
              <Flame className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground/50 mb-3 md:mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">No photos yet</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                Be the first to upload a photo! 
              </p>
            </div>
          ) : (
            <PhotoGrid 
              photos={photos} 
              onDelete={handleDelete} 
              onUpdate={handleUpdate}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </main>
    </div>
  );
}