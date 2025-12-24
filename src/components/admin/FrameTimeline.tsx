import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, SkipBack, SkipForward, Plus, Trash2, 
  Star, Move, ZoomIn, ZoomOut, Grid3x3
} from "lucide-react";
import { toast } from "sonner";

interface Frame {
  id: string;
  frame_number: number;
  image_url?: string;
  is_keyframe: boolean;
  duration_frames: number;
}

interface FrameTimelineProps {
  frames: Frame[];
  currentFrame: number;
  fps: number;
  onFrameChange: (frameNum: number) => void;
  onAddFrame: (afterFrame: number) => void;
  onDeleteFrame: (frameNum: number) => void;
  onToggleKeyframe: (frameNum: number) => void;
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
}

export function FrameTimeline({
  frames,
  currentFrame,
  fps,
  onFrameChange,
  onAddFrame,
  onDeleteFrame,
  onToggleKeyframe,
  onPlay,
  onPause,
  isPlaying
}: FrameTimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current frame
  useEffect(() => {
    if (timelineRef.current && currentFrame >= 0) {
      const frameElement = timelineRef.current.querySelector(
        `[data-frame="${currentFrame}"]`
      ) as HTMLElement;
      if (frameElement) {
        frameElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentFrame]);

  const frameWidth = 80 * zoom;
  const totalFrames = frames.length;
  const totalDuration = totalFrames / fps;

  const formatTime = (frameNum: number) => {
    const seconds = frameNum / fps;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
  };

  return (
    <Card className="p-4 space-y-4 bg-background/50 backdrop-blur">
      {/* Playback Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFrameChange(0)}
            disabled={currentFrame === 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFrameChange(Math.max(0, currentFrame - 1))}
            disabled={currentFrame === 0}
          >
            <Move className="h-4 w-4 rotate-180" />
          </Button>
          
          {!isPlaying ? (
            <Button size="sm" onClick={onPlay} className="px-6">
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>
          ) : (
            <Button size="sm" onClick={onPause} variant="secondary" className="px-6">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFrameChange(Math.min(totalFrames - 1, currentFrame + 1))}
            disabled={currentFrame >= totalFrames - 1}
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFrameChange(totalFrames - 1)}
            disabled={currentFrame >= totalFrames - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Frame: <span className="font-mono font-semibold text-foreground">{currentFrame + 1}</span> / {totalFrames}
          </div>
          <div className="text-sm text-muted-foreground">
            Time: <span className="font-mono font-semibold text-foreground">{formatTime(currentFrame)}</span> / {formatTime(totalFrames - 1)}
          </div>
          <div className="text-sm text-muted-foreground">
            FPS: <span className="font-mono font-semibold text-primary">{fps}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showGrid ? "secondary" : "outline"}
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            disabled={zoom >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Frame Scrubber */}
      <div className="space-y-2">
        <Slider
          value={[currentFrame]}
          onValueChange={(v) => onFrameChange(v[0])}
          min={0}
          max={Math.max(0, totalFrames - 1)}
          step={1}
          className="w-full"
        />
      </div>

      {/* Timeline Grid */}
      <div 
        ref={timelineRef}
        className="relative overflow-x-auto border rounded-lg bg-black/20"
        style={{ height: '120px' }}
      >
        <div className="flex h-full relative" style={{ minWidth: `${totalFrames * frameWidth}px` }}>
          {/* Grid Background */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: Math.ceil(totalFrames / fps) }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-primary/20"
                  style={{ left: `${i * fps * frameWidth}px` }}
                />
              ))}
            </div>
          )}

          {/* Frame Thumbnails */}
          {frames.map((frame) => (
            <div
              key={frame.id}
              data-frame={frame.frame_number}
              className={`relative flex-shrink-0 border-r cursor-pointer transition-all ${
                frame.frame_number === currentFrame
                  ? 'bg-primary/30 border-primary ring-2 ring-primary'
                  : frame.is_keyframe
                  ? 'bg-yellow-500/20 border-yellow-500/50'
                  : 'bg-background/50 border-border hover:bg-accent/30'
              }`}
              style={{ width: `${frameWidth}px` }}
              onClick={() => onFrameChange(frame.frame_number)}
            >
              {/* Frame Number */}
              <div className="absolute top-1 left-1 text-xs font-mono bg-black/60 px-1 rounded z-10">
                {frame.frame_number + 1}
              </div>

              {/* Keyframe Star */}
              {frame.is_keyframe && (
                <div className="absolute top-1 right-1 z-10">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                </div>
              )}

              {/* Thumbnail */}
              {frame.image_url ? (
                <img
                  src={frame.image_url}
                  alt={`Frame ${frame.frame_number + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-xs">Empty</div>
                </div>
              )}

              {/* Frame Actions */}
              <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 px-2 flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleKeyframe(frame.frame_number);
                  }}
                >
                  <Star className={`h-3 w-3 ${frame.is_keyframe ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 px-2 flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddFrame(frame.frame_number);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-6 px-2 flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this frame?')) {
                      onDeleteFrame(frame.frame_number);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add Frame at End */}
          <div
            className="relative flex-shrink-0 border-r border-dashed border-primary/30 cursor-pointer hover:bg-primary/10 transition-colors flex items-center justify-center"
            style={{ width: `${frameWidth}px` }}
            onClick={() => onAddFrame(totalFrames - 1)}
          >
            <Plus className="h-8 w-8 text-primary/50" />
          </div>
        </div>
      </div>

      {/* Onion Skin Indicator */}
      {currentFrame > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary/30" />
          Onion skin: Previous frame visible at 30% opacity
        </div>
      )}
    </Card>
  );
}
