import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Flag } from "lucide-react";

interface FeatureFlagRow {
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  coming_soon: boolean;
}

export default function FeatureFlagsAdmin() {
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("feature_flags")
      .select("key, label, description, enabled, coming_soon")
      .order("label");
    if (error) toast.error("Failed to load feature flags");
    setFlags((data as FeatureFlagRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (key: string, patch: Partial<FeatureFlagRow>) => {
    setSaving(key);
    // Optimistic update.
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
    const { error } = await supabase.from("feature_flags").update(patch).eq("key", key);
    setSaving(null);
    if (error) {
      toast.error(`Update failed: ${error.message}`);
      load(); // revert to server truth
      return;
    }
    toast.success("Feature updated");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-crimson" />
        <h2 className="text-xl font-bold">Feature Overlays</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Toggle any feature on or off site-wide. Disabling shows the feature as unavailable
        to users. Paid/entitlement rules are still enforced server-side.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {flags.map((f) => (
          <Card key={f.key} className="border-crimson/20">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="truncate">{f.label}</span>
                    {f.coming_soon && (
                      <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">{f.key}</CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {saving === f.key && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Switch
                    checked={f.enabled}
                    onCheckedChange={(v) => update(f.key, { enabled: v })}
                    aria-label={`Toggle ${f.label}`}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground line-clamp-2">{f.description}</p>
                <label className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 ml-2">
                  <Switch
                    checked={f.coming_soon}
                    onCheckedChange={(v) => update(f.key, { coming_soon: v })}
                    aria-label={`Toggle coming soon for ${f.label}`}
                  />
                  Coming soon
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
