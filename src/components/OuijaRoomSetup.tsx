import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

interface OuijaRoomSetupProps {
  onRoomCreated:  (room: any) => void;
  userId: string;
}

export const OuijaRoomSetup = ({ onRoomCreated, userId }: OuijaRoomSetupProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [tokenCode, setTokenCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSpirit, setSelectedSpirit] = useState("the_whisperer");

  const SPIRIT_TYPES = [
    { value: "the_whisperer", label: t("ouija.spirits.the_whisperer"), desc: t("ouija.spirits. the_whisperer_desc"), sigil: "👁️‍🗨️" },
    { value: "the_archivist", label: t("ouija.spirits.the_archivist"), desc: t("ouija.spirits.the_archivist_desc"), sigil: "📜" },
    { value:  "the_trickster", label: t("ouija.spirits.the_trickster"), desc: t("ouija.spirits.the_trickster_desc"), sigil: "🃏" },
    { value:  "the_watcher", label: t("ouija.spirits.the_watcher"), desc: t("ouija.spirits.the_watcher_desc"), sigil: "👁️" },
  ];

  useEffect(() => {
    checkAdminStatus();
  }, [userId]);

  const checkAdminStatus = async () => {
    const { data } = await (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (data) {
      setIsAdmin(true);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const createRoom = async () => {
    if (!isAdmin && !tokenCode. trim()) {
      toast({
        title: t("ouija. tokenRequired"),
        description: t("ouija.tokenRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let tokenId = null;

      // Admin bypass - create a temporary token
      if (isAdmin && ! tokenCode.trim()) {
        const adminTokenCode = `ADMIN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const { data: adminToken } = await (supabase as any)
          .from("ouija_tokens")
          .insert({
            user_id: userId,
            token_code: adminTokenCode,
            is_used: true,
            used_at: new Date().toISOString(),
          })
          .select()
          .single();
        
        tokenId = adminToken?. id || null;
      } else {
        // Check if token exists and is unused
        const { data: tokenData, error: tokenError } = await (supabase as any)
          .from("ouija_tokens")
          .select("*")
          .eq("token_code", tokenCode)
          .eq("user_id", userId)
          .eq("is_used", false)
          .single();

        if (tokenError || !tokenData) {
          toast({
            title: t("ouija.invalidToken"),
            description: t("ouija.invalidTokenDesc"),
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Mark token as used
        await (supabase as any)
          .from("ouija_tokens")
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq("id", tokenData.id);

        tokenId = tokenData.id;
      }

      // Create room
      const inviteCode = generateInviteCode();
      const { data: roomData, error: roomError } = await (supabase as any)
        .from("ouija_rooms")
        .insert({
          host_user_id: userId,
          token_id: tokenId,
          invite_code: inviteCode,
          spirit_type:  selectedSpirit,
        })
        .select()
        .single();

      if (roomError || !roomData) {
        toast({
          title: t("ouija.error"),
          description: t("ouija.errorDesc"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Add host as first participant
      await (supabase as any)
        .from("ouija_participants")
        .insert({
          room_id: roomData.id,
          user_id: userId,
          turn_order: 1,
        });

      // Set host as first turn
      await (supabase as any)
        .from("ouija_rooms")
        .update({ current_turn_user_id:  userId })
        .eq("id", roomData.id);

      toast({
        title: t("ouija.roomCreated"),
        description: `${t("ouija.shareInvite")} ${inviteCode}`,
      });

      onRoomCreated({ ...roomData, current_turn_user_id: userId });
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: t("ouija. error"),
        description: t("ouija.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const purchaseToken = async () => {
    // Generate a token for testing (in production, this would be via payment)
    const newTokenCode = `TOKEN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const { error } = await (supabase as any)
      .from("ouija_tokens")
      .insert({
        user_id: userId,
        token_code: newTokenCode,
      });

    if (! error) {
      toast({
        title: t("ouija. tokenPurchased"),
        description: `${t("ouija.yourToken")} ${newTokenCode}`,
      });
      setTokenCode(newTokenCode);
    }
  };

  return (
    <>
      {/* FORCE SOLID DROPDOWN BACKGROUND */}
      <style>{`
        [data-radix-popper-content-wrapper] {
          background: #000000 !important;
        }
        
        [role="listbox"] {
          background: #000000 !important;
          backdrop-filter: none !important;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <h1 className="text-4xl font-bold text-primary">{t("ouija.title")}</h1>
        <p className="text-muted-foreground text-center max-w-md">
          {t("ouija.subtitle")}
        </p>

        <Card className="p-6 w-full max-w-md bg-card/50 backdrop-blur">
          <h2 className="text-xl font-semibold mb-4">{t("ouija.createRoom")}</h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-2">{t("ouija.summonSpirit")}</Label>
              <Select value={selectedSpirit} onValueChange={setSelectedSpirit}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  className="bg-black border-2 border-destructive/40 shadow-2xl z-50"
                  style={{ 
                    backgroundColor: '#000000',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none'
                  }}
                >
                  {SPIRIT_TYPES. map((spirit) => (
                    <SelectItem key={spirit. value} value={spirit.value}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{spirit.sigil}</span>
                        <div>
                          <div className="font-medium">{spirit.label}</div>
                          <div className="text-xs text-muted-foreground">{spirit.desc}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                {t("ouija. tokenCode")} {isAdmin && <span className="text-primary">{t("ouija.adminOptional")}</span>}
              </label>
              <Input
                value={tokenCode}
                onChange={(e) => setTokenCode(e.target.value)}
                placeholder={t("ouija.enterToken")}
                className="bg-background"
              />
            </div>

            <Button
              onClick={createRoom}
              disabled={loading}
              className="w-full"
            >
              {loading ?  t("ouija.creating") : t("ouija.createSeance")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t("action.cancel")}</span>
              </div>
            </div>

            <Button
              onClick={purchaseToken}
              variant="outline"
              className="w-full"
            >
              {t("ouija.purchaseToken")}
            </Button>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground text-center max-w-md">
          {t("ouija.tokenInfo")}
        </p>
      </div>
    </>
  );
};