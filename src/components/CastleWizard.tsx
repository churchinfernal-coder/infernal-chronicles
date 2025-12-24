import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InfernalIdentitySelect } from "@/components/InfernalIdentitySelect";
import { InterestsSelect } from "@/components/InterestsSelect";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Flame, Skull, Moon, Eye, ChevronRight, ChevronLeft, Crown, Ghost } from "lucide-react";
import { InfernalGlobeIntro } from "@/components/InfernalGlobeIntro";

interface CastleWizardProps {
  userId: string;
  onComplete: () => void;
}

export function CastleWizard({ userId, onComplete }: CastleWizardProps) {
  const [step, setStep] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    infernal_nickname: "",
    bio: "",
    mood_status: "",
    infernal_identity: "",
    interests: [] as string[],
    avatar_url: "",
    header_image_url: ""
  });

  const moods = [
    { value: "Brooding", icon: Moon, color: "text-blue-400", glow: "shadow-[0_0_20px_rgba(59,130,246,0.6)]" },
    { value: "Summoning", icon: Flame, color: "text-red-400", glow: "shadow-[0_0_20px_rgba(220,20,60,0.6)]" },
    { value: "In Ritual", icon: Eye, color: "text-purple-400", glow: "shadow-[0_0_20px_rgba(147,51,234,0.6)]" },
    { value: "Possessed", icon: Skull, color: "text-gray-400", glow: "shadow-[0_0_20px_rgba(156,163,175,0.6)]" },
    { value: "Ascending", icon: Crown, color: "text-yellow-400", glow: "shadow-[0_0_20px_rgba(234,179,8,0.6)]" }
  ];

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("user_id", userId);

      if (error) throw error;
      
      toast.success("Your castle has been established!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const nextStep = () => setStep(Math.min(step + 1, 4));
  const prevStep = () => setStep(Math.max(step - 1, 0));

  if (!showWizard) {
    return <InfernalGlobeIntro onEnter={() => setShowWizard(true)} />;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black animate-fade-in">
      {/* Floating particles */}
      <div className="wizard-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="wizard-particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${10 + Math.random() * 5}s`
          }} />
        ))}
      </div>

      <div className="min-h-screen p-6 flex items-center justify-center relative">
        <div className="max-w-2xl w-full rounded-lg border-2 border-primary/30 shadow-[0_0_60px_rgba(220,20,60,0.4)] animate-scale-in" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
          <div className="border-b border-primary/30" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="flex items-center gap-4">
                <div className="horror-avatar-container">
                  <Skull className="w-12 h-12 text-primary drop-shadow-[0_0_20px_rgba(220,20,60,0.8)]" />
                  <div className="horror-avatar-ring" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-serif horror-text-glow font-semibold leading-none tracking-tight">
                    Forge Your Dominion
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 font-serif italic">
                    Ritual {step + 1} of 5
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      i <= step 
                        ? "horror-progress-active" 
                        : "bg-muted/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="horror-icon-container mb-4">
                    <Flame className="h-12 w-12 mx-auto text-primary animate-pulse" />
                    <div className="horror-icon-glow" />
                  </div>
                  <h3 className="text-2xl font-serif horror-text-glow">Declare Your Identity</h3>
                  <p className="text-sm text-muted-foreground mt-2 font-serif italic">
                    The void demands your true name
                  </p>
                </div>
                
                <div>
                  <Label className="text-foreground font-serif">Mortal Name</Label>
                  <Input
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    placeholder="The name whispered by mortals..."
                    className="horror-input"
                  />
                </div>

                <div>
                  <Label className="text-foreground font-serif">Infernal Title</Label>
                  <Input
                    value={profile.infernal_nickname}
                    onChange={(e) => setProfile({ ...profile, infernal_nickname: e.target.value })}
                    placeholder="Your name in the darkness..."
                    className="horror-input"
                  />
                </div>

                <div>
                  <Label className="text-foreground font-serif">Dark Covenant</Label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Inscribe your path through shadow and flame..."
                    rows={4}
                    className="horror-input"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Mood Selection */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="horror-icon-container mb-4">
                    <Ghost className="h-12 w-12 mx-auto text-primary animate-pulse" />
                    <div className="horror-icon-glow" />
                  </div>
                  <h3 className="text-2xl font-serif horror-text-glow">Channel Your Essence</h3>
                  <p className="text-sm text-muted-foreground mt-2 font-serif italic">
                    What infernal state grips your soul?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {moods.map((mood) => {
                    const Icon = mood.icon;
                    return (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setProfile({ ...profile, mood_status: mood.value })}
                        className={`horror-mood-card ${
                          profile.mood_status === mood.value ? "horror-mood-active" : ""
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3 relative z-10">
                          <div className={`relative ${mood.color}`}>
                            <Icon className={`h-14 w-14 ${
                              profile.mood_status === mood.value 
                                ? "animate-pulse drop-shadow-[0_0_20px_currentColor]" 
                                : "group-hover:scale-110 transition-transform"
                            }`} />
                          </div>
                          <span className={`font-serif text-lg ${
                            profile.mood_status === mood.value ? "horror-text-blood font-bold" : "text-foreground"
                          }`}>
                            {mood.value}
                          </span>
                        </div>
                        {profile.mood_status === mood.value && (
                          <>
                            <div className="horror-mood-glow" />
                            <div className="absolute inset-0 rounded-lg bg-primary/5 animate-pulse pointer-events-none" />
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Identity Selection */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="horror-icon-container mb-4">
                    <Skull className="h-12 w-12 mx-auto text-primary animate-pulse" />
                    <div className="horror-icon-glow" />
                  </div>
                  <h3 className="text-2xl font-serif horror-text-glow">Embrace Your Darkness</h3>
                  <p className="text-sm text-muted-foreground mt-2 font-serif italic">
                    Which cursed path calls to you?
                  </p>
                </div>

                <InfernalIdentitySelect
                  value={profile.infernal_identity}
                  onChange={(identity) => setProfile({ ...profile, infernal_identity: identity })}
                />
              </div>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="horror-icon-container mb-4">
                    <Eye className="h-12 w-12 mx-auto text-primary animate-pulse" />
                    <div className="horror-icon-glow" />
                  </div>
                  <h3 className="text-2xl font-serif horror-text-glow">Claim Your Powers</h3>
                  <p className="text-sm text-muted-foreground mt-2 font-serif italic">
                    Select the forbidden knowledge you seek
                  </p>
                </div>

                <InterestsSelect
                  value={profile.interests}
                  onChange={(interests) => setProfile({ ...profile, interests })}
                />
              </div>
            )}

            {/* Step 4: Avatar & Banner */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="horror-icon-container mb-4">
                    <Crown className="h-12 w-12 mx-auto text-primary animate-pulse" />
                    <div className="horror-icon-glow" />
                  </div>
                  <h3 className="text-2xl font-serif horror-text-glow">Consecrate Your Sigils</h3>
                  <p className="text-sm text-muted-foreground mt-2 font-serif italic">
                    Mark your domain with blood and gold
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Profile Avatar</Label>
                    <ImageUpload
                      userId={userId}
                      bucket="profile-images"
                      currentImageUrl={profile.avatar_url}
                      onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
                      label="Avatar"
                    />
                  </div>

                  <div>
                    <Label>Castle Banner</Label>
                    <ImageUpload
                      userId={userId}
                      bucket="header-images"
                      currentImageUrl={profile.header_image_url}
                      onUploadComplete={(url) => setProfile({ ...profile, header_image_url: url })}
                      label="Banner"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-primary/20">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={step === 0}
                className="border-primary/30"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {step < 4 ? (
                <Button
                  onClick={nextStep}
                  className="bg-primary hover:bg-primary/90"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Flame className="mr-2 h-4 w-4" />
                  Establish Castle
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
