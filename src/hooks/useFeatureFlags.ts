import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlag {
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  coming_soon: boolean;
  config: Record<string, unknown>;
}

/**
 * Reads all feature flags once and returns a lookup + helpers. Flags are
 * publicly readable; enforcement of paid/gated access still happens in RLS and
 * edge functions — flags only control feature visibility/availability.
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("feature_flags").select("*");
      if (!active) return;
      const map: Record<string, FeatureFlag> = {};
      for (const f of (data ?? []) as FeatureFlag[]) map[f.key] = f;
      setFlags(map);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return {
    flags,
    loading,
    isEnabled: (key: string) => flags[key]?.enabled ?? true,
    isComingSoon: (key: string) => flags[key]?.coming_soon ?? false,
  };
}

/** Convenience hook for a single flag. Defaults to enabled while loading. */
export function useFeatureFlag(key: string) {
  const { flags, loading } = useFeatureFlags();
  return {
    loading,
    enabled: flags[key]?.enabled ?? true,
    comingSoon: flags[key]?.coming_soon ?? false,
    flag: flags[key],
  };
}
