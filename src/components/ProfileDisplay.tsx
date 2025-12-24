import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BadgeImage } from "@/components/BadgeImage";

interface EquippedSkin {
  store_items: {
    preview_data: {
      background: string;
      border?: string;
      texture?: string;
    };
  };
}

export function ProfileSkinDisplay({ userId, className = "" }: { userId: string; className?: string }) {
  const [equippedSkin, setEquippedSkin] = useState<EquippedSkin | null>(null);

  useEffect(() => {
    fetchEquippedSkin();
  }, [userId]);

  const fetchEquippedSkin = async () => {
    const { data } = await supabase
      .from("user_equipped_items")
      .select("store_items(preview_data)")
      .eq("user_id", userId)
      .eq("item_type", "skin")
      .maybeSingle();

    if (data) setEquippedSkin(data as EquippedSkin);
  };

  if (!equippedSkin || !equippedSkin.store_items?.preview_data) {
    return null;
  }

  const { background, border } = equippedSkin.store_items.preview_data;

  return (
    <div 
      className={`absolute inset-0 -z-10 rounded-lg ${className}`}
      style={{
        background,
        border: border || "none",
        opacity: 0.15,
      }}
    />
  );
}

export function ProfileBadgeDisplay({ userId }: { userId: string }) {
  const [equippedBadge, setEquippedBadge] = useState<string | null>(null);

  useEffect(() => {
    fetchEquippedBadge();
  }, [userId]);

  const fetchEquippedBadge = async () => {
    const { data } = await supabase
      .from("user_equipped_items")
      .select("store_items(name)")
      .eq("user_id", userId)
      .eq("item_type", "badge")
      .maybeSingle();

    if (data) {
      setEquippedBadge((data as any).store_items?.name);
    }
  };

  // Import badges dynamically
  const badgeImages: Record<string, string> = {
    "Infernal Crown": "/src/assets/badges/infernal-crown.png",
    "Shadow Keeper": "/src/assets/badges/shadow-keeper.png",
    "Crimson Seal": "/src/assets/badges/crimson-seal.png",
    "Void Walker": "/src/assets/badges/void-walker.png",
    "First Whisper": "/src/assets/badges/first-whisper.png",
    "Dark Herald": "/src/assets/badges/dark-herald.png",
    "Shadow Scribe": "/src/assets/badges/shadow-scribe.png",
    "Coven Founder": "/src/assets/badges/coven-founder.png",
    "Social Demon": "/src/assets/badges/social-demon.png",
    "Infernal Influencer": "/src/assets/badges/infernal-influencer.png",
  };

  if (!equippedBadge || !badgeImages[equippedBadge]) {
    return null;
  }

  return (
    <div className="absolute top-2 right-2 z-10">
      <BadgeImage 
        src={badgeImages[equippedBadge]} 
        alt={equippedBadge}
        className={`badge-img h-12 w-12 transition-transform duration-300 ${
          equippedBadge === "Infernal Crown" ? "badge-fire-animation" :
          equippedBadge === "Shadow Keeper" ? "badge-electric-animation" :
          equippedBadge === "Void Walker" ? "badge-walk-animation" :
          equippedBadge === "Crimson Seal" ? "badge-spin-animation" :
          "badge-glow-animation"
        }`}
        title={equippedBadge}
      />
    </div>
  );
}
