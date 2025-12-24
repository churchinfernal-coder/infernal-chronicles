import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, History, Download } from "lucide-react";

interface AuditRecord {
  id: string;
  audit_date: string;
  audit_type: string;
  findings_count: number;
  critical_issues: number;
  status: string;
  performed_by: string;
  summary: string;
}

export function AuditHistory() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [audits, setAudits] = useState<AuditRecord[]>([]);

  useEffect(() => {
    loadAuditHistory();
  }, []);

  const loadAuditHistory = async () => {
    try {
      // Mock data for MVP - in production, this would come from a database table
      const mockAudits: AuditRecord[] = [
        {
          id: "1",
          audit_date: new Date().toISOString(),
          audit_type: "Full Site Audit",
          findings_count: 12,
          critical_issues: 2,
          status: "completed",
          performed_by: "System",
          summary: "Comprehensive audit of all site modules and security"
        },
        {
          id: "2",
          audit_date: new Date(Date.now() - 86400000).toISOString(),
          audit_type: "Security Scan",
          findings_count: 5,
          critical_issues: 0,
          status: "completed",
          performed_by: "Admin",
          summary: "Security vulnerability assessment"
        },
        {
          id: "3",
          audit_date: new Date(Date.now() - 172800000).toISOString(),
          audit_type: "Performance Audit",
          findings_count: 8,
          critical_issues: 1,
          status: "completed",
          performed_by: "System",
          summary: "Performance metrics and optimization recommendations"
        }
      ];

      setAudits(mockAudits);
    } catch (error) {
      console.error("Error loading audit history:", error);
      toast({
        title: "Error",
        description: "Failed to load audit history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAudit = (auditId: string) => {
    toast({
      title: "Export Started",
      description: "Generating audit report...",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Audit History
        </CardTitle>
        <CardDescription>
          Complete log of all past audits and their findings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Findings</TableHead>
              <TableHead>Critical</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell className="text-xs">
                  {new Date(audit.audit_date).toLocaleString()}
                </TableCell>
                <TableCell>{audit.audit_type}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{audit.findings_count}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={audit.critical_issues > 0 ? "destructive" : "default"}>
                    {audit.critical_issues}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="default">{audit.status}</Badge>
                </TableCell>
                <TableCell className="text-xs">{audit.performed_by}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportAudit(audit.id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
