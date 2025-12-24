import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Database } from "lucide-react";

export default function DatabaseInspector() {
  const [sql, setSql] = useState("SELECT * FROM profiles LIMIT 10;");
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

  const runCustom = () => execute({ sql });

  const runQuick = (qa: string) => execute({ quickAction: qa });

  return (
    <div className="space-y-4">
      <div>
        <Label>SQL Query</Label>
        <textarea
          className="w-full min-h-[140px] p-3 border rounded-md font-mono text-sm bg-background"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="SELECT * FROM profiles LIMIT 10;"
        />
      </div>
      <Button onClick={runCustom} disabled={loading}>
        <Database className="h-4 w-4 mr-2" />
        {loading ? "Executing..." : "Execute Query"}
      </Button>

      <div className="pt-6 border-t">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start" onClick={() => runQuick("view_all_tables")}>
            View All Tables
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => runQuick("view_active_sessions")}>
            View Active Sessions
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => runQuick("view_recent_queries")}>
            View Recent Queries
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => runQuick("database_statistics")}>
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
