import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileCode, Clock, Database, AlertCircle } from "lucide-react";

interface ModuleLog {
  id: string;
  module_name: string;
  action_type: string;
  admin_user_id: string;
  metadata: any;
  created_at: string;
}

export default function ModuleRegistry() {
  const [moduleLogs, setModuleLogs] = useState<ModuleLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModuleLogs();
  }, []);

  const fetchModuleLogs = async () => {
    const { data, error } = await supabase
      .from("module_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching module logs:", error);
      toast.error("Failed to load module logs");
      return;
    }

    setModuleLogs((data || []) as ModuleLog[]);
    setLoading(false);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-500";
      case "update": return "bg-blue-500";
      case "delete": return "bg-red-500";
      case "rollback": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) return <div className="p-8">Loading module registry...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Module Registry & Audit Trail
          </CardTitle>
          <CardDescription>
            Complete forensic tracking of all module changes and deployments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moduleLogs.map((log) => (
              <Card key={log.id} className="border-l-4" style={{
                borderLeftColor: `hsl(var(--${log.action_type === 'create' ? 'primary' : log.action_type === 'delete' ? 'destructive' : 'secondary'}))`
              }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-mono">
                        {log.module_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getActionColor(log.action_type)}>
                          {log.action_type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {log.metadata && (
                  <CardContent className="pt-0">
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </CardContent>
                )}
              </Card>
            ))}

            {moduleLogs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No module changes logged yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
