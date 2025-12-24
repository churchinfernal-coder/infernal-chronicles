import { useRef, useState, useEffect } from "react";

interface PlanchetteProps {
  position: { x: number; y: number }; // percentage of board
  onMove: (x: number, y: number) => void;
  boardRef: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
}

export const Planchette = ({ position, onMove, boardRef, disabled = false }: PlanchetteProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !boardRef.current) return;

      const rect = boardRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;

      // Keep within bounds
      const clampedX = Math.max(5, Math.min(95, x));
      const clampedY = Math.max(5, Math.min(95, y));

      onMove(clampedX, clampedY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, boardRef, onMove]);

  return (
    <div
      className={`absolute w-20 h-20 transition-transform select-none ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Heart-shaped planchette with vintage look */}
      <div className="relative w-full h-full">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-destructive/40 rounded-full blur-xl animate-pulse" />
        
        {/* Main body - triangle/heart shape */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          {/* Outer glow */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Heart/teardrop shape */}
          <path
            d="M 50 20 Q 30 20 20 35 Q 20 50 50 80 Q 80 50 80 35 Q 70 20 50 20 Z"
            fill="url(#planchette-gradient)"
            stroke="#8b0000"
            strokeWidth="2"
            filter="url(#glow)"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="planchette-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#4a1a1a", stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: "#1a0a0a", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#000000", stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Center viewing hole */}
          <circle cx="50" cy="45" r="8" fill="#000" stroke="#8b0000" strokeWidth="1.5" />
          <circle cx="50" cy="45" r="5" fill="rgba(139, 0, 0, 0.3)" />
        </svg>
      </div>
    </div>
  );
};
