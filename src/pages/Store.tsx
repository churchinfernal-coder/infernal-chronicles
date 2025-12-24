import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeImage } from "@/components/BadgeImage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Lock, Crown, Sparkles } from "lucide-react";

// Import badge images
import infernalCrown from "@/assets/badges/infernal-crown.png";
import shadowKeeper from "@/assets/badges/shadow-keeper.png";
import crimsonSeal from "@/assets/badges/crimson-seal.png";
import voidWalker from "@/assets/badges/void-walker.png";
import firstWhisper from "@/assets/badges/first-whisper.png";
import darkHerald from "@/assets/badges/dark-herald.png";
import shadowScribe from "@/assets/badges/shadow-scribe.png";
import covenFounder from "@/assets/badges/coven-founder.png";
import socialDemon from "@/assets/badges/social-demon.png";
import infernalInfluencer from "@/assets/badges/infernal-influencer.png";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  item_type: "badge" | "skin";
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  price_cents: number | null;
  stripe_price_id: string | null;
  preview_data: any;
  required_prime_level: number;
  image_url: string | null;
}

interface ActivityBadge {
  id: string;
  name: string;
  description: string;
  rarity: string;
  criteria: any;
  image_url: string | null;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
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
  "First Whisper": firstWhisper,
  "Dark Herald": darkHerald,
  "Shadow Scribe": shadowScribe,
  "Coven Founder": covenFounder,
  "Social Demon": socialDemon,
  "Infernal Influencer": infernalInfluencer,
};

export default function Store() {
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [activityBadges, setActivityBadges] = useState<ActivityBadge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [primeLevel, setPrimeLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const [profileRes, itemsRes, badgesRes, inventoryRes, userBadgesRes] = await Promise.all([
      supabase.from("profiles").select("prime_level").eq("user_id", user.id).single(),
      supabase.from("store_items").select("*").eq("is_active", true),
      supabase.from("activity_badges").select("*"),
      supabase.from("user_inventory").select("item_id").eq("user_id", user.id),
      supabase.from("user_activity_badges").select("badge_id, earned_at").eq("user_id", user.id),
    ]);

    if (profileRes.data) setPrimeLevel(profileRes.data.prime_level ?? 0);
    if (itemsRes.data) setStoreItems(itemsRes.data);
    if (badgesRes.data) setActivityBadges(badgesRes.data);
    if (inventoryRes.data) setInventory(inventoryRes.data.map(i => i.item_id));
    if (userBadgesRes.data) setUserBadges(userBadgesRes.data);
    setLoading(false);
  };

  const handlePurchase = async (item: StoreItem) => {
    if (primeLevel < item.required_prime_level) {
      toast.error(`Prime Level ${item.required_prime_level} required`);
      return;
    }

    if (inventory.includes(item.id)) {
      toast.error("You already own this item");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-store-checkout", {
        body: { itemId: item.id },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-2xl text-primary animate-pulse">Loading Prime Store...</div>
      </div>
    );
  }

  if (primeLevel < 7) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <Lock className="w-24 h-24 mx-auto mb-6 text-muted-foreground" />
        <h1 className="text-4xl font-bold mb-4">Prime Store Locked</h1>
        <p className="text-xl text-muted-foreground mb-4">
          Reach Prime Level 7 to unlock the Infernal Prime Store
        </p>
        <p className="text-lg">Current Prime Level: <span className="text-primary font-bold">{primeLevel}</span></p>
      </div>
    );
  }

  const skins = storeItems.filter(i => i.item_type === "skin");
  const paidBadges = storeItems.filter(i => i.item_type === "badge");

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            Infernal Prime Store
          </h1>
          <p className="text-muted-foreground mt-1">
            Prime Level {primeLevel} • {inventory.length} items owned
          </p>
        </div>
      </div>

      <Tabs defaultValue="skins" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="skins">Profile Skins</TabsTrigger>
          <TabsTrigger value="badges">Premium Badges</TabsTrigger>
          <TabsTrigger value="earned">Earned Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="skins" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skins.map((item) => (
              <Card key={item.id} className="relative overflow-hidden">
                <div 
                  className="h-32 w-full" 
                  style={item.preview_data?.background ? { background: item.preview_data.background } : {}}
                />
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <Badge className={rarityColors[item.rarity]}>
                      {item.rarity}
                    </Badge>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {item.price_cents ? formatPrice(item.price_cents) : "Free"}
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={inventory.includes(item.id) || primeLevel < item.required_prime_level}
                      size="sm"
                    >
                      {inventory.includes(item.id) ? "Owned" : 
                       primeLevel < item.required_prime_level ? `Level ${item.required_prime_level}` : 
                       "Purchase"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paidBadges.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-center mb-2">
                    <BadgeImage 
                      src={badgeImages[item.name]} 
                      alt={item.name} 
                      className={`badge-img h-24 w-24 transition-transform duration-300 ${
                        item.name === "Infernal Crown" ? "badge-fire-animation" :
                        item.name === "Shadow Keeper" ? "badge-electric-animation" :
                        item.name === "Void Walker" ? "badge-walk-animation" :
                        item.name === "Crimson Seal" ? "badge-spin-animation" :
                        "badge-glow-animation"
                      }`} 
                    />
                  </div>
                  <CardTitle className="text-center text-lg">{item.name}</CardTitle>
                  <div className="flex justify-center">
                    <Badge className={rarityColors[item.rarity]}>{item.rarity}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-center text-muted-foreground mb-4">
                    {item.description}
                  </p>
                  <div className="text-center">
                    <div className="text-xl font-bold mb-2">
                      {item.price_cents ? formatPrice(item.price_cents) : "Free"}
                    </div>
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={inventory.includes(item.id)}
                      size="sm"
                      className="w-full"
                    >
                      {inventory.includes(item.id) ? "Owned" : "Purchase"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="earned" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activityBadges.map((badge) => {
              const earned = userBadges.find(ub => ub.badge_id === badge.id);
              return (
                <Card key={badge.id} className={earned ? "border-primary" : "opacity-60"}>
                  <CardHeader>
                    <div className="flex items-center justify-center mb-2">
                      <BadgeImage 
                        src={badgeImages[badge.name]} 
                        alt={badge.name} 
                        className={`badge-img h-24 w-24 transition-all duration-300 ${!earned ? "opacity-40 grayscale" : ""} ${
                          badge.name === "Infernal Crown" ? "badge-fire-animation" :
                          badge.name === "Shadow Keeper" ? "badge-electric-animation" :
                          badge.name === "Void Walker" ? "badge-walk-animation" :
                          badge.name === "Crimson Seal" ? "badge-spin-animation" :
                          "badge-glow-animation"
                        }`}
                      />
                    </div>
                    <CardTitle className="text-center">{badge.name}</CardTitle>
                    <div className="flex justify-center">
                      <Badge className={rarityColors[badge.rarity as keyof typeof rarityColors]}>
                        {badge.rarity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-center text-muted-foreground mb-2">
                      {badge.description}
                    </p>
                    {earned ? (
                      <div className="flex items-center justify-center gap-1 text-sm text-primary">
                        <Sparkles className="h-4 w-4" />
                        <span>Earned!</span>
                      </div>
                    ) : (
                      <p className="text-xs text-center text-muted-foreground">
                        {badge.criteria.type}: {badge.criteria.threshold}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
