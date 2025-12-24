import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flame, Skull, Eye, Crown, Zap } from "lucide-react";

interface AvatarConfig {
  baseColor: string;
  horns: string | null;
  eyes: string | null;
  piercing: string | null;
  tattoo: string | null;
  cloak: string | null;
}

interface AvatarBuilderProps {
  userId: string;
  initialConfig?: AvatarConfig;
  onSave?: () => void;
}

const defaultConfig: AvatarConfig = {
  baseColor: "#1a1a1a",
  horns: null,
  eyes: null,
  piercing: null,
  tattoo: null,
  cloak: null,
};

export function AvatarBuilder({ userId, initialConfig, onSave }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig || defaultConfig);
  const [isSaving, setIsSaving] = useState(false);

  const hornOptions = [
    { id: "none", name: "None", icon: "⭕" },
    { id: "demon", name: "Demon Horns", icon: "😈" },
    { id: "ram", name: "Ram Horns", icon: "🐏" },
    { id: "crown", name: "Bone Crown", icon: "👑" },
  ];

  const eyeOptions = [
    { id: "none", name: "None", icon: "⭕" },
    { id: "red", name: "Crimson Glow", icon: "🔴", color: "#dc143c" },
    { id: "purple", name: "Void Eyes", icon: "🟣", color: "#9333ea" },
    { id: "green", name: "Toxic Gaze", icon: "🟢", color: "#22c55e" },
    { id: "white", name: "Spectral", icon: "⚪", color: "#ffffff" },
  ];

  const piercingOptions = [
    { id: "none", name: "None", icon: "⭕" },
    { id: "septum", name: "Septum Ring", icon: "💍" },
    { id: "bridge", name: "Bridge Bar", icon: "📏" },
    { id: "snake-bites", name: "Snake Bites", icon: "🐍" },
  ];

  const tattooOptions = [
    { id: "none", name: "None", icon: "⭕" },
    { id: "pentagram", name: "Pentagram", icon: "⭐" },
    { id: "sigil", name: "Demonic Sigil", icon: "🔯" },
    { id: "runes", name: "Dark Runes", icon: "ᚱᚢᚾ" },
    { id: "skull", name: "Skull Mark", icon: "💀" },
  ];

  const cloakOptions = [
    { id: "none", name: "None", icon: "⭕" },
    { id: "black", name: "Shadow Cloak", color: "#000000" },
    { id: "crimson", name: "Blood Cloak", color: "#8b0000" },
    { id: "purple", name: "Void Cloak", color: "#4b0082" },
  ];

  const baseColors = [
    { id: "pale", name: "Pale", color: "#f5f5dc" },
    { id: "dark", name: "Dark", color: "#1a1a1a" },
    { id: "gray", name: "Ashen", color: "#808080" },
    { id: "green", name: "Corpse", color: "#9acd32" },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const avatarData = JSON.stringify(config);
      
      const { error } = await supabase
        .from("profiles")
        .update({ bio: avatarData })
        .eq("user_id", userId);

      if (error) throw error;
      
      toast.success("Avatar saved to your castle!");
      onSave?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Preview */}
      <Card className="border-primary/30 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-64 h-64 mx-auto bg-gradient-to-b from-card to-background rounded-full border-2 border-primary/50 overflow-hidden shadow-[0_0_30px_rgba(220,20,60,0.3)]">
            {/* Base Face */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: config.baseColor }}
            />
            
            {/* Cloak */}
            {config.cloak && config.cloak !== "none" && (
              <div 
                className="absolute inset-0 opacity-20"
                style={{ 
                  background: `radial-gradient(circle at top, ${cloakOptions.find(c => c.id === config.cloak)?.color || "#000"} 0%, transparent 70%)`
                }}
              />
            )}

            {/* Horns */}
            {config.horns && config.horns !== "none" && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-6xl animate-pulse">
                {hornOptions.find(h => h.id === config.horns)?.icon}
              </div>
            )}

            {/* Eyes */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-8">
              {config.eyes && config.eyes !== "none" ? (
                <>
                  <div 
                    className="w-8 h-8 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: eyeOptions.find(e => e.id === config.eyes)?.color || "#fff",
                      boxShadow: `0 0 20px ${eyeOptions.find(e => e.id === config.eyes)?.color || "#fff"}`
                    }}
                  />
                  <div 
                    className="w-8 h-8 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: eyeOptions.find(e => e.id === config.eyes)?.color || "#fff",
                      boxShadow: `0 0 20px ${eyeOptions.find(e => e.id === config.eyes)?.color || "#fff"}`
                    }}
                  />
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                </>
              )}
            </div>

            {/* Piercing */}
            {config.piercing && config.piercing !== "none" && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-3xl">
                {piercingOptions.find(p => p.id === config.piercing)?.icon}
              </div>
            )}

            {/* Tattoo */}
            {config.tattoo && config.tattoo !== "none" && (
              <div className="absolute bottom-8 right-8 text-4xl opacity-60 animate-pulse">
                {tattooOptions.find(t => t.id === config.tattoo)?.icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customization Options */}
      <Card className="border-primary/30 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skull className="h-5 w-5 text-primary" />
            Customize
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="base" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="base">Base</TabsTrigger>
              <TabsTrigger value="face">Face</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] pr-4">
              {/* Base Color */}
              <TabsContent value="base" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">Skin Tone</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {baseColors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setConfig({ ...config, baseColor: color.color })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          config.baseColor === color.color
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div 
                          className="w-full h-12 rounded mb-2"
                          style={{ backgroundColor: color.color }}
                        />
                        <span className="text-sm">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">Horns</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {hornOptions.map((horn) => (
                      <button
                        key={horn.id}
                        onClick={() => setConfig({ ...config, horns: horn.id })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          config.horns === horn.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-3xl mb-2">{horn.icon}</div>
                        <span className="text-sm">{horn.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Face Features */}
              <TabsContent value="face" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">Eyes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {eyeOptions.map((eye) => (
                      <button
                        key={eye.id}
                        onClick={() => setConfig({ ...config, eyes: eye.id })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          config.eyes === eye.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-3xl mb-2">{eye.icon}</div>
                        <span className="text-sm">{eye.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">Piercings</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {piercingOptions.map((piercing) => (
                      <button
                        key={piercing.id}
                        onClick={() => setConfig({ ...config, piercing: piercing.id })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          config.piercing === piercing.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-3xl mb-2">{piercing.icon}</div>
                        <span className="text-sm">{piercing.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Style */}
              <TabsContent value="style" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">Tattoos</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {tattooOptions.map((tattoo) => (
                      <button
                        key={tattoo.id}
                        onClick={() => setConfig({ ...config, tattoo: tattoo.id })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          config.tattoo === tattoo.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-3xl mb-2">{tattoo.icon}</div>
                        <span className="text-sm">{tattoo.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">Cloak</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {cloakOptions.map((cloak) => (
                      <button
                        key={cloak.id}
                        onClick={() => setConfig({ ...config, cloak: cloak.id })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          config.cloak === cloak.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {cloak.color && (
                          <div 
                            className="w-full h-12 rounded mb-2"
                            style={{ backgroundColor: cloak.color }}
                          />
                        )}
                        <span className="text-sm">{cloak.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Flame className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Avatar"}
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
