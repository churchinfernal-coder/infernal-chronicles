import { useState, useMemo } from "react";
import { PhotoCard } from "@/components/PhotoCard";
import type { Photo } from "@/pages/PicturePalace";

interface PhotoGridProps {
  photos: Photo[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, title:  string) => void;
  currentUserId?:  string;
}

export const PhotoGrid = ({ photos, onDelete, onUpdate, currentUserId }:  PhotoGridProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Masonry layout with varying sizes
  const columns = useMemo(() => {
    const cols: Photo[][] = [[], [], []];
    photos.forEach((photo, index) => {
      const colIndex = index % 3;
      cols[colIndex].push(photo);
    });
    return cols;
  }, [photos]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {columns. map((column, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-4">
          {column.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              isExpanded={expandedId === photo.id}
              onExpand={() => setExpandedId(photo.id)}
              onCollapse={() => setExpandedId(null)}
              onDelete={() => onDelete(photo.id)}
              onUpdate={(title) => onUpdate(photo.id, title)}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
