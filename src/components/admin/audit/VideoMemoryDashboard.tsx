import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, BarChart3, Clock3, Database, Sparkles } from "lucide-react";

type MotifStat = {
  symbol: string;
  style: string;
  narrative_theme: string;
  frequency: number;
  avg_weight: number;
  max_recurrence: number;
  avg_emergence: number;
  last_reinforced_at: string;
};

type TimelineRow = {
  day: string;
  writes: number;
  avg_critic_score: number;
  avg_weight: number;
  avg_emergence: number;
};

type AuditSummary = {
  total_reads: number;
  total_writes: number;
  total_critic: number;
  total_change_events: number;
  last_event: string | null;
};

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export function VideoMemoryDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projectScopeId, setProjectScopeId] = useState(NIL_UUID);
  const [motifs, setMotifs] = useState<MotifStat[]>([]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [projectScopeId]);

  const topMotifs = useMemo(() => motifs.slice(0, 8), [motifs]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [{ data: motifRows, error: motifErr }, { data: timelineRows, error: timelineErr }, { data: summaryRows, error: summaryErr }] = await Promise.all([
        supabase.rpc("video_memory_motif_stats", {
          _project_filter: projectScopeId,
          _limit_count: 30,
        }),
        supabase.rpc("video_memory_evolution_timeline", {
          _project_filter: projectScopeId,
          _days_back: 30,
        }),
        supabase.rpc("video_memory_audit_summary", {
          _project_filter: projectScopeId,
        }),
      ]);

      if (motifErr) throw motifErr;
      if (timelineErr) throw timelineErr;
      if (summaryErr) throw summaryErr;

      setMotifs((motifRows || []) as MotifStat[]);
      setTimeline((timelineRows || []) as TimelineRow[]);
      setSummary((summaryRows?.[0] || null) as AuditSummary | null);
    } catch (error: any) {
      console.error("video memory dashboard error", error);
      toast({
        title: "Dashboard Error",
        description: error.message || "Failed to load video memory dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Video Memory Observability
          </CardTitle>
          <CardDescription>
            Motif recurrence, adaptive evolution, and audit telemetry for autonomous cinematic memory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Scope ID</label>
            <Input value={projectScopeId} onChange={(e) => setProjectScopeId(e.target.value.trim() || NIL_UUID)} />
          </div>
          <div className="text-xs text-muted-foreground">
            Use the NIL UUID for global scope. Change the scope to inspect project-level motif drift and recurrence.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" /> Reads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_reads || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Writes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_writes || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Critic Passes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_critic || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Clock3 className="h-4 w-4" /> Last Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">{summary?.last_event ? new Date(summary.last_event).toLocaleString() : "-"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Motifs</CardTitle>
          <CardDescription>Highest weighted motifs with recurrence and emergence scores.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading motif metrics...</div>
          ) : topMotifs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No motif stats yet.</div>
          ) : (
            <div className="space-y-3">
              {topMotifs.map((row) => (
                <div key={`${row.symbol}-${row.style}-${row.narrative_theme}`} className="flex flex-wrap items-center gap-2 rounded border p-3">
                  <Badge variant="secondary">{row.symbol}</Badge>
                  <Badge variant="outline">{row.style}</Badge>
                  <Badge variant="outline">{row.narrative_theme}</Badge>
                  <span className="text-xs text-muted-foreground">freq {row.frequency}</span>
                  <span className="text-xs text-muted-foreground">weight {Number(row.avg_weight || 0).toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">recurrence {row.max_recurrence}</span>
                  <span className="text-xs text-muted-foreground">emergence {Number(row.avg_emergence || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolution Timeline (30d)</CardTitle>
          <CardDescription>Daily writes, critic quality trend, weight trend, and emergence trend.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading timeline...</div>
          ) : timeline.length === 0 ? (
            <div className="text-sm text-muted-foreground">No timeline data yet.</div>
          ) : (
            <div className="space-y-2">
              {timeline.slice(0, 12).map((row) => (
                <div key={row.day} className="grid grid-cols-5 gap-2 text-xs rounded border p-2">
                  <span>{row.day}</span>
                  <span>writes {row.writes}</span>
                  <span>critic {Number(row.avg_critic_score || 0).toFixed(1)}</span>
                  <span>weight {Number(row.avg_weight || 0).toFixed(2)}</span>
                  <span>emergence {Number(row.avg_emergence || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}