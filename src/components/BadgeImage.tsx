import React, { useEffect, useRef, useState } from "react";

interface BadgeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  threshold?: number; // 0-255, values above become transparent
}

// Converts near-white pixels to transparent so white square backgrounds disappear
export const BadgeImage: React.FC<BadgeImageProps> = ({
  src,
  alt,
  className,
  title,
  threshold = 245,
  ...rest
}) => {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Avoid reprocessing if same src
    hasProcessedRef.current = false;
    setProcessedSrc(null);
  }, [src]);

  useEffect(() => {
    if (!src || hasProcessedRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // safe for local assets
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // If pixel is near white, fade it out based on distance from white
          if (r >= threshold && g >= threshold && b >= threshold) {
            // linear fade for smoother edges
            const avg = (r + g + b) / 3;
            const fade = Math.min(1, (avg - threshold) / (255 - threshold));
            data[i + 3] = Math.max(0, data[i + 3] * (1 - fade));
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const url = canvas.toDataURL("image/png");
        setProcessedSrc(url);
        hasProcessedRef.current = true;
      } catch (e) {
        // fallback to original src on any error
        setProcessedSrc(null);
      }
    };
    img.onerror = () => setProcessedSrc(null);
    img.src = src;
  }, [src, threshold]);

  return (
    <img
      src={processedSrc || src}
      alt={alt}
      title={title}
      className={className}
      {...rest}
    />
  );
};

export default BadgeImage;
