import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ImagePlus } from "lucide-react";

export const DungeonLink = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      onClick={() => navigate("/my-dungeon")}
      className="gap-2"
    >
      <ImagePlus className="w-4 h-4" />
      My Dungeon
    </Button>
  );
};
