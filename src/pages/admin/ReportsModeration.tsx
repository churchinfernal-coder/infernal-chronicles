import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";

export default function ReportsModeration() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingReport, setResolvingReport] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("reports")
        .select(`
          *,
          reporter:profiles!reports_reporter_user_id_fkey(username),
          reviewer:profiles!reports_reviewed_by_fkey(username)
        `)
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch reports");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (
    reportId: string,
    newStatus: "reviewing" | "resolved" | "dismissed"
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates: any = {
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };

      if (resolvingReport === reportId && resolutionNotes.trim()) {
        updates.resolution_notes = resolutionNotes;
      }

      const { error } = await supabase
        .from("reports")
        .update(updates)
        .eq("id", reportId);

      if (error) throw error;

      toast.success(`Report ${newStatus}`);
      setResolvingReport(null);
      setResolutionNotes("");
      fetchReports();
    } catch (error: any) {
      toast.error("Failed to update report");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-900/30 text-yellow-400 border-yellow-600/50";
      case "reviewing": return "bg-blue-900/30 text-blue-400 border-blue-600/50";
      case "resolved": return "bg-green-900/30 text-green-400 border-green-600/50";
      case "dismissed": return "bg-gray-900/30 text-gray-400 border-gray-600/50";
      default: return "";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "post": return "bg-red-900/30 text-red-400";
      case "user": return "bg-purple-900/30 text-purple-400";
      case "comment": return "bg-orange-900/30 text-orange-400";
      case "reel": return "bg-pink-900/30 text-pink-400";
      case "coven": return "bg-indigo-900/30 text-indigo-400";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-[hsl(var(--primary))]">
          Reports & Moderation
        </h1>
        <p className="text-muted-foreground">Review and manage user reports</p>

        <div className="mt-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No reports found</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getTypeColor(report.reported_type)}>
                        {report.reported_type}
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      Reported by: {report.reporter?.username || "Unknown"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Reason:</h3>
                  <p className="text-muted-foreground">{report.reason}</p>
                </div>

                {report.additional_info && (
                  <div>
                    <h3 className="font-semibold mb-2">Additional Info:</h3>
                    <p className="text-muted-foreground">{report.additional_info}</p>
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Reported ID:</strong> {report.reported_id}
                  </p>
                  {report.reviewed_by && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Reviewed by:</strong> {report.reviewer?.username || "Unknown"}
                    </p>
                  )}
                  {report.resolution_notes && (
                    <div className="mt-2">
                      <h3 className="font-semibold mb-1">Resolution Notes:</h3>
                      <p className="text-muted-foreground text-sm">
                        {report.resolution_notes}
                      </p>
                    </div>
                  )}
                </div>

                {resolvingReport === report.id && (
                  <div className="border-t border-border pt-4">
                    <Label className="mb-2 block">Resolution Notes:</Label>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Enter resolution notes..."
                      className="mb-3"
                    />
                  </div>
                )}

                {report.status === "pending" || report.status === "reviewing" ? (
                  <div className="flex gap-2 flex-wrap">
                    {resolvingReport !== report.id ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => updateReportStatus(report.id, "reviewing")}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Start Review
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setResolvingReport(report.id)}
                        >
                          Add Notes
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => updateReportStatus(report.id, "resolved")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Resolve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateReportStatus(report.id, "dismissed")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Dismiss
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setResolvingReport(null);
                            setResolutionNotes("");
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="w-fit">
                    {report.status === "resolved" ? "✓ Resolved" : "✗ Dismissed"}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
