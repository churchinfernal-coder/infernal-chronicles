import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Sparkles, Palette, Wand2, Check } from "lucide-react";

interface WickedWorksPaywallProps {
  onUpgrade: () => void;
}

export const WickedWorksPaywall = ({ onUpgrade }: WickedWorksPaywallProps) => {
  return (
    <div className="min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center p-3 sm:p-6">
      <Card className="max-w-2xl w-full bg-gradient-to-br from-card/95 via-card to-card/95 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="mx-auto p-3 sm:p-4 bg-gradient-to-br from-primary to-accent rounded-full w-fit">
            <Crown className="h-8 w-8 sm:h-12 sm:w-12 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Premium Feature
          </CardTitle>
          <CardDescription className="text-sm sm:text-base md:text-lg">
            Unlock the full power of Wicked Works with a premium subscription
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 text-primary">
                <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                <h3 className="font-semibold text-sm sm:text-base">Design Editor</h3>
              </div>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Professional design canvas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Advanced filters & effects</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>AI background removal</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Image upscaling up to 4x</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Layer management</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 rounded-lg bg-accent/5 border border-accent/10">
              <div className="flex items-center gap-2 text-accent">
                <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <h3 className="font-semibold text-sm sm:text-base">AI Image Generator</h3>
              </div>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Text-to-image generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Multiple art styles</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Human portrait controls</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Custom composition</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Save to personal gallery</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-2 sm:pt-4">
            <Button
              onClick={onUpgrade}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground px-6 sm:px-8 w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Upgrade to Premium
            </Button>
            <p className="text-xs text-muted-foreground mt-2 sm:mt-3">
              Get instant access to all premium features
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
