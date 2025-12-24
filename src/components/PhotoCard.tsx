import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, Check, X, Maximize2 } from "lucide-react";
import type { Photo } from "@/pages/PicturePalace";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PhotoCardProps {
  photo: Photo;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onDelete: () => void;
  onUpdate:  (title: string) => void;
  currentUserId?:  string;
}

export const PhotoCard = ({
  photo,
  isExpanded,
  onExpand,
  onCollapse,
  onDelete,
  onUpdate,
  currentUserId,
}: PhotoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(photo.title || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUserId && photo.user_id === currentUserId;

  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const img = imgRef.current;
          if (img && img.dataset.src) {
            img.src = img. dataset.src;
            observer. disconnect();
          }
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSaveTitle = () => {
    if (title.trim()) {
      onUpdate(title.trim());
    }
    setIsEditing(false);
  };

  return (
    <>
      <Card
        ref={cardRef}
        className={`group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border transition-all duration-500 ease-out hover:shadow-crimson hover:scale-[1.02] hover:z-10 ${isExpanded ? "fixed inset-8 z-50 scale-100" : ""}`}
        style={{ aspectRatio:  isExpanded ? "auto" :  `${photo.width}/${photo.height}` }}
      >
        {!isLoaded && <div className="absolute inset-0 bg-muted/20 animate-pulse" />}
        <img
          ref={imgRef}
          data-src={photo.url}
          alt={photo.title || "Gallery photo"}
          className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? "opacity-100" : "opacity-0"} ${isExpanded ? "object-contain" : "object-cover"}`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          <div className="absolute top-4 right-4 flex gap-2">
            {!isExpanded && (
              <Button size="icon" variant="secondary" className="bg-card/80 backdrop-blur-sm hover:bg-primary hover: text-primary-foreground" onClick={onExpand}>
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}
            {isExpanded && (
              <Button size="icon" variant="secondary" className="bg-card/80 backdrop-blur-sm" onClick={onCollapse}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            {isOwner && isEditing ? (
              <div className="flex gap-2">
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="bg-card/90 backdrop-blur-sm border-primary/50" 
                  placeholder="Enter title..." 
                  autoFocus 
                  onKeyDown={(e) => { 
                    if (e.key === "Enter") handleSaveTitle(); 
                    if (e.key === "Escape") setIsEditing(false); 
                  }} 
                />
                <Button size="icon" variant="secondary" className="bg-primary hover:bg-primary/80" onClick={handleSaveTitle}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary" onClick={() => { setTitle(photo.title || ""); setIsEditing(false); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground truncate">{photo. title || "Untitled"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {photo.username && <span className="mr-2">by {photo.username}</span>}
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {isOwner && !isEditing && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="flex-1 bg-card/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-3 h-3 mr-2" />
                  Rename
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="flex-1 bg-card/90 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Banish
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Banish this soul?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.  The image will be permanently removed from the Picture Palace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
              Banish Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};