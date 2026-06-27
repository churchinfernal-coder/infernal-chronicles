import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DesignEditor } from "@/components/admin/DesignEditor";
import AIImageGenerator from "@/components/admin/AIImageGenerator";  // ✅ default import
import { WickedWorksInstructions } from "@/components/WickedWorksInstructions";
import { WickedWorksShowcase } from "@/components/WickedWorksShowcase";
import WickedWorksPaywall from "@/pages/wicked-works/WickedWorksPaywall";
import { Wand2, Palette, HelpCircle, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function WickedWorks() {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremiumAccess();
  }, []);

  const checkPremiumAccess = async () => {
    try {
      setLoading(true);

      // ✅ FIX #1: Proper auth check with navigation
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error:', authError);
        navigate('/auth');
        return;
      }

      // ✅ FIX #2: Check subscription with proper error handling
      const { data: subscription, error: subError } = await (supabase as any)
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();  // ← Use maybeSingle instead of single

      if (subError) {
        console.error('Subscription fetch error:', subError);
        throw subError;
      }

      if (subscription) {
        setHasPremiumAccess(true);
        setLoading(false);
        return;
      }

      // ✅ FIX #3: Check admin role as fallback
      const { data:  adminRole, error: adminError } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();  // ← Use maybeSingle instead of single

      if (adminError) {
        console.error('Admin check error:', adminError);
        throw adminError;
      }

      if (adminRole?. role === 'admin') {
        setHasPremiumAccess(true);
      } else {
        setHasPremiumAccess(false);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking premium access:', error);
      // ✅ FIX #4: User feedback on error
      toast.error('Failed to load access level.  Please try again.');
      setHasPremiumAccess(false);
      setLoading(false);
    }
  };

  // ✅ FIX #5: Proper Stripe redirect
  const handleUpgrade = () => {
    window.location.href = `/checkout?product=prod_wicked_works_premium&feature=wicked_works`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading Wicked Works...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background/95 to-primary/5 pb-20 md:ml-64 lg:ml-72">
      {/* Header */}
      <div className="border-b border-border/50 bg-linear-to-r from-primary/10 via-accent/10 to-primary/10 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="p-2 sm:p-2.5 md:p-3 bg-linear-to-br from-primary to-accent rounded-lg flex-shrink-0">
                <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md: text-3xl lg:text-4xl xl:text-5xl font-bold bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent truncate">
                  Wicked Works
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg mt-0.5 sm:mt-1 truncate">
                  Design Studio & AI Generator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={() => setShowInstructions(true)}
                variant="outline"
                size="sm"
                className="border-primary/20 hover:border-primary/40 flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm: w-4 sm:mr-2" />
                <span className="hidden sm:inline">Instructions</span>
                <span className="sm:hidden">Help</span>
              </Button>
              {! hasPremiumAccess && (
                <Button
                  onClick={handleUpgrade}
                  size="sm"
                  className="bg-linear-to-r from-primary to-accent hover:opacity-90 text-primary-foreground flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Upgrade</span>
                  <span className="sm:hidden">Pro</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 lg:py-8">
        {!hasPremiumAccess ?  (
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <WickedWorksShowcase />
            <WickedWorksPaywall onUpgrade={handleUpgrade} />
          </div>
        ) : (
          <Tabs defaultValue="design" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4 md:mb-6 lg:mb-8 bg-card/50 backdrop-blur-sm border border-border/50 p-1 sm:p-1.5 md:p-2">
              <TabsTrigger
                value="design"
                className="data-[state=active]: bg-linear-to-r data-[state=active]:from-primary data-[state=active]: to-accent data-[state=active]:text-primary-foreground flex items-center justify-center gap-1 sm: gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
              >
                <Palette className="h-3 w-3 sm:h-3. 5 sm:w-3.5 md:h-4 md:w-4" />
                <span className="hidden xs:inline">Design Editor</span>
                <span className="xs: hidden">Design</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai-generator"
                className="data-[state=active]:bg-linear-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-primary-foreground flex items-center justify-center gap-1 sm: gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
              >
                <Wand2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                <span className="hidden xs: inline">AI Generator</span>
                <span className="xs:hidden">AI</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="mt-0 focus-visible: outline-none focus-visible:ring-0">
              <div className="w-full overflow-hidden">
                <DesignEditor />
              </div>
            </TabsContent>

            <TabsContent value="ai-generator" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="w-full overflow-hidden">
                <AIImageGenerator />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <WickedWorksInstructions
        open={showInstructions}
        onOpenChange={setShowInstructions}
      />
    </div>
  );
}