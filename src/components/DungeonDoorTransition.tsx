import { useState, useEffect, useRef } from "react";
import { Flame } from "lucide-react";
import dungeonDoor1 from "@/assets/dungeon-door-1.mp4";

interface DungeonDoorTransitionProps {
  onComplete: () => void;
  destination?: string;
}

export function DungeonDoorTransition({ onComplete, destination = "Castle" }: DungeonDoorTransitionProps) {
  const [stage, setStage] = useState<"initial" | "playing" | "entering">("initial");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setTimeout(() => setStage("playing"), 300);
  }, []);

  const handleVideoEnd = () => {
    setStage("entering");
    setTimeout(onComplete, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {stage === "playing" && (
        <video
          ref={videoRef}
          src={dungeonDoor1}
          className="w-full h-full object-cover"
          onEnded={handleVideoEnd}
          autoPlay
          playsInline
        />
      )}

      {stage === "entering" && (
        <div className="text-center">
          <h2 className="text-4xl font-serif text-foreground mb-4">
            Entering {destination}
          </h2>
          <Flame className="h-8 w-8 text-primary mx-auto animate-pulse" />
        </div>
      )}
    </div>
  );
}
