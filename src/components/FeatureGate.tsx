import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Sparkles } from "lucide-react";

interface FeatureGateProps {
  /** feature_flags.key controlling this feature */
  flagKey: string;
  children: React.ReactNode;
}

/**
 * Route/section guard driven by DB feature flags. When a feature is disabled it
 * shows an "unavailable / coming soon" overlay instead of the feature. Admins
 * and superadmins bypass the overlay so they can preview disabled features.
 *
 * This is a UX overlay only — real entitlement/paid access is enforced
 * server-side (RLS + edge functions). It never grants access it shouldn't.
 */
export function FeatureGate({ flagKey, children }: FeatureGateProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "enabled" | "blocked">("loading");
  const [comingSoon, setComingSoon] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const [{ data: flag }, { data: { session } }] = await Promise.all([
        supabase
          .from("feature_flags")
          .select("enabled, coming_soon")
          .eq("key", flagKey)
          .maybeSingle(),
        supabase.auth.getSession(),
      ]);
      if (!active) return;

      // Missing flag defaults to enabled (fail-open for UX, not for data access).
      const enabled = flag ? (flag as any).enabled : true;
      setComingSoon(flag ? Boolean((flag as any).coming_soon) : false);

      if (enabled) {
        setState("enabled");
        return;
      }

      // Admin bypass so staff can preview disabled features.
      let isAdmin = false;
      if (session?.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        isAdmin = (roles ?? []).some(
          (r: { role: string }) => r.role === "admin" || r.role === "superadmin"
        );
      }
      if (!active) return;
      setState(isAdmin ? "enabled" : "blocked");
    })();

    return () => {
      active = false;
    };
  }, [flagKey]);

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-4 rounded-lg border border-crimson/30 bg-crimson/5 p-8">
          {comingSoon ? (
            <Sparkles className="h-12 w-12 mx-auto text-crimson" />
          ) : (
            <Lock className="h-12 w-12 mx-auto text-crimson" />
          )}
          <h1 className="text-2xl font-bold text-crimson">
            {comingSoon ? "Coming Soon" : "Feature Unavailable"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {comingSoon
              ? "This feature is being prepared and will be available soon."
              : "This feature is currently disabled. Please check back later."}
          </p>
          <Button onClick={() => navigate("/dashboard")} className="bg-crimson hover:bg-crimson/80">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default FeatureGate;
