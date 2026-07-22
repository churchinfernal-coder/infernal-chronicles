import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database } from "lucide-react";

export default function DatabaseInspector() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ rows?: any[]; rowCount?: number; durationMs?: number; executedSql?: string; error?: string } | null>(null);

  const execute = async (payload: { sql?: string; quickAction?: string }) => {
    setLoading(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("admin-sql-exec", {
      body: payload,
    });
    setLoading(false);
    if (error || (data && data.error)) {
      toast.error(data?.error || error?.message || "Query failed");
      setResult({ error: data?.error || error?.message });
      return;
    }
    toast.success(`Executed in ${data.durationMs} ms, ${data.rowCount} rows`);
    setResult(data);
  };

  const runQuick = (qa: string) => execute({ quickAction: qa });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
        <p className="font-semibold flex items-center gap-2">
          <Database className="h-4 w-4" /> Read-only inspector
        </p>
        <p className="mt-1">
          Free-form SQL is disabled for security. Use the predefined, metadata-only
          actions below — they never expose user data.
        </p>
      </div>

      <div className="pt-2 border-t">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start" disabled={loading} onClick={() => runQuick("view_all_tables")}>
            View All Tables
          </Button>
          <Button variant="outline" className="justify-start" disabled={loading} onClick={() => runQuick("view_active_sessions")}>
            View Active Sessions
          </Button>
          <Button variant="outline" className="justify-start" disabled={loading} onClick={() => runQuick("view_recent_queries")}>
            View Recent Queries
          </Button>
          <Button variant="outline" className="justify-start" disabled={loading} onClick={() => runQuick("database_statistics")}>
            Database Statistics
          </Button>
        </div>
      </div>

      {result && (
        <div className="mt-6 space-y-2">
          <div className="text-sm text-muted-foreground">
            {result.error ? (
              <span>Error: {result.error}</span>
            ) : (
              <span>
                Rows: {result.rowCount} • Time: {result.durationMs} ms
              </span>
            )}
          </div>
          <pre className="w-full overflow-auto rounded-md border p-3 text-xs bg-background">
{JSON.stringify(result.error ? { error: result.error } : result.rows ?? [], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
