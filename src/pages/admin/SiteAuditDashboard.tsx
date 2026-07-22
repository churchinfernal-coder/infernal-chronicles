import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Database, AlertTriangle, Activity, FileCode, History as HistoryIcon, CheckSquare } from "lucide-react";
import { SchemaForensics } from "@/components/admin/audit/SchemaForensics";
import { SecurityAudit } from "@/components/admin/audit/SecurityAudit";
import { ErrorAnalysis } from "@/components/admin/audit/ErrorAnalysis";
import { PerformanceMetrics } from "@/components/admin/audit/PerformanceMetrics";
import { ModuleInventory } from "@/components/admin/audit/ModuleInventory";
import { AuditHistory } from "@/components/admin/audit/AuditHistory";
import { ActionItems } from "@/components/admin/audit/ActionItems";
import { VideoMemoryDashboard } from "@/components/admin/audit/VideoMemoryDashboard";

export default function SiteAuditDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [auditSummary, setAuditSummary] = useState({
    totalErrors: 0,
    criticalErrors: 0,
    securityIssues: 0,
    performanceScore: 0,
    lastAuditDate: null as string | null
  });

  useEffect(() => {
    checkAdminAccess();
    loadAuditSummary();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Access Denied",
        description: "You must be logged in as an admin",
        variant: "destructive"
      });
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast({
        title: "Access Denied",
        description: "Super Admin access required",
        variant: "destructive"
      });
    }
  };

  const loadAuditSummary = async () => {
    try {
      // Get error counts
      const { count: totalErrors } = await supabase
        .from("ai_error_logs")
        .select("*", { count: "exact", head: true });

      const { count: criticalErrors } = await supabase
        .from("ai_error_logs")
        .select("*", { count: "exact", head: true })
        .eq("severity", "critical");

      // Get performance metrics average
      const { data: perfData } = await supabase
        .from("ai_performance_metrics")
        .select("value")
        .limit(100);

      const avgPerf = perfData?.reduce((acc, m) => acc + Number(m.value), 0) / (perfData?.length || 1);

      setAuditSummary({
        totalErrors: totalErrors || 0,
        criticalErrors: criticalErrors || 0,
        securityIssues: 0, // Will be calculated by security audit
        performanceScore: Math.round(avgPerf || 0),
        lastAuditDate: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error loading audit summary:", error);
      toast({
        title: "Error",
        description: "Failed to load audit summary",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Site Audit & Forensics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive system analysis and monitoring
          </p>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditSummary.totalErrors}</div>
            <p className="text-xs text-muted-foreground">
              {auditSummary.criticalErrors} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Issues</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditSummary.securityIssues}</div>
            <p className="text-xs text-muted-foreground">
              Active vulnerabilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditSummary.performanceScore}</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Audit</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditSummary.lastAuditDate 
                ? new Date(auditSummary.lastAuditDate).toLocaleDateString()
                : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">
              Last complete scan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Tabs */}
      <Tabs defaultValue="schema" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="schema">
            <Database className="h-4 w-4 mr-2" />
            Schema
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Errors
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Activity className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="modules">
            <FileCode className="h-4 w-4 mr-2" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="history">
            <HistoryIcon className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="actions">
            <CheckSquare className="h-4 w-4 mr-2" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="video-memory">
            <Activity className="h-4 w-4 mr-2" />
            Video Memory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schema">
          <SchemaForensics />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAudit onIssuesFound={(count) => 
            setAuditSummary(prev => ({ ...prev, securityIssues: count }))
          } />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorAnalysis />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetrics />
        </TabsContent>

        <TabsContent value="modules">
          <ModuleInventory />
        </TabsContent>

        <TabsContent value="history">
          <AuditHistory />
        </TabsContent>

        <TabsContent value="actions">
          <ActionItems />
        </TabsContent>

        <TabsContent value="video-memory">
          <VideoMemoryDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
