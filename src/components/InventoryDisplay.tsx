import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeImage } from "@/components/BadgeImage";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

// Import badge images
import infernalCrown from "@/assets/badges/infernal-crown.png";
import shadowKeeper from "@/assets/badges/shadow-keeper.png";
import crimsonSeal from "@/assets/badges/crimson-seal.png";
import voidWalker from "@/assets/badges/void-walker.png";

interface InventoryItem {
  id: string;
  item_id: string;
  store_items: {
    id: string;
    name: string;
    description: string;
    item_type: "badge" | "skin";
    rarity: string;
    preview_data: any;
    image_url: string | null;
  };
}

interface EquippedItem {
  item_id: string;
  item_type: string;
}

const rarityColors = {
  common: "bg-gray-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-orange-500",
  mythic: "bg-red-500",
};

const badgeImages: Record<string, string> = {
  "Infernal Crown": infernalCrown,
  "Shadow Keeper": shadowKeeper,
  "Crimson Seal": crimsonSeal,
  "Void Walker": voidWalker,
};

const getBadgeAnimation = (name: string) => {
  if (name === "Infernal Crown") return "badge-fire-animation";
  if (name === "Shadow Keeper") return "badge-electric-animation";
  if (name === "Void Walker") return "badge-walk-animation";
  if (name === "Crimson Seal") return "badge-spin-animation";
  return "badge-glow-animation";
};

export function InventoryDisplay({ userId }: { userId: string }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equipped, setEquipped] = useState<EquippedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, [userId]);

  const fetchInventory = async () => {
    const [invRes, equippedRes] = await Promise.all([
      supabase
        .from("user_inventory")
        .select("id, item_id, store_items(*)")
        .eq("user_id", userId),
      supabase
        .from("user_equipped_items")
        .select("item_id, item_type")
        .eq("user_id", userId),
    ]);

    if (invRes.data) setInventory(invRes.data as any);
    if (equippedRes.data) setEquipped(equippedRes.data);
    setLoading(false);
  };

  const handleEquip = async (itemId: string, itemType: "badge" | "skin") => {
    const { error } = await supabase
      .from("user_equipped_items")
      .upsert(
        { user_id: userId, item_id: itemId, item_type: itemType as "badge" | "skin" },
        { onConflict: "user_id,item_type" }
      );

    if (error) {
      toast.error("Failed to equip item");
    } else {
      toast.success("Item equipped!");
      fetchInventory();
    }
  };

  const handleUnequip = async (itemType: "badge" | "skin") => {
    const { error } = await supabase
      .from("user_equipped_items")
      .delete()
      .eq("user_id", userId)
      .eq("item_type", itemType as "badge" | "skin");

    if (error) {
      toast.error("Failed to unequip item");
    } else {
      toast.success("Item unequipped!");
      fetchInventory();
    }
  };

  const isEquipped = (itemId: string) => equipped.some((e) => e.item_id === itemId);

  if (loading) return <div className="text-center py-4">Loading inventory...</div>;

  if (inventory.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No items in your inventory yet.</p>
          <p className="text-sm mt-2">Visit the Prime Store to purchase items!</p>
        </CardContent>
      </Card>
    );
  }

  const skins = inventory.filter((i) => i.store_items.item_type === "skin");
  const badges = inventory.filter((i) => i.store_items.item_type === "badge");

  return (
    <div className="space-y-6">
      {skins.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Profile Skins</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skins.map((item) => (
              <Card key={item.id} className={isEquipped(item.item_id) ? "border-primary" : ""}>
                <div
                  className="h-24 w-full rounded-t-lg"
                  style={
                    item.store_items.preview_data?.background
                      ? { background: item.store_items.preview_data.background }
                      : {}
                  }
                />
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{item.store_items.name}</CardTitle>
                    <Badge className={rarityColors[item.store_items.rarity as keyof typeof rarityColors]}>
                      {item.store_items.rarity}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() =>
                      isEquipped(item.item_id)
                        ? handleUnequip("skin")
                        : handleEquip(item.item_id, "skin")
                    }
                    size="sm"
                    variant={isEquipped(item.item_id) ? "secondary" : "default"}
                    className="w-full"
                  >
                    {isEquipped(item.item_id) ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Equipped
                      </>
                    ) : (
                      "Equip"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {badges.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((item) => (
              <Card key={item.id} className={isEquipped(item.item_id) ? "border-primary" : ""}>
                <CardHeader className="text-center">
                  <BadgeImage 
                    src={badgeImages[item.store_items.name]} 
                    alt={item.store_items.name}
                    className={`badge-img h-20 w-20 mx-auto mb-2 ${getBadgeAnimation(item.store_items.name)}`}
                  />
                  <CardTitle className="text-sm">{item.store_items.name}</CardTitle>
                  <Badge className={rarityColors[item.store_items.rarity as keyof typeof rarityColors]}>
                    {item.store_items.rarity}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() =>
                      isEquipped(item.item_id)
                        ? handleUnequip("badge")
                        : handleEquip(item.item_id, "badge")
                    }
                    size="sm"
                    variant={isEquipped(item.item_id) ? "secondary" : "default"}
                    className="w-full"
                  >
                    {isEquipped(item.item_id) ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        On
                      </>
                    ) : (
                      "Equip"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
