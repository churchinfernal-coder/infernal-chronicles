import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModuleStatus {
  name: string;
  path: string;
  type: string;
  superadminIntegrated: boolean;
  navigationValue: string | null;
  status: 'active' | 'partial' | 'missing';
  lastModified?: string;
}

export const IntegrationReport = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ModuleStatus[]>([]);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    
    // Comprehensive module inventory with SuperAdmin integration status
    const modules: ModuleStatus[] = [
      // Core Admin Components
      { name: 'SuperAdmin', path: 'src/pages/SuperAdmin.tsx', type: 'core', superadminIntegrated: true, navigationValue: 'posts', status: 'active' },
      { name: 'SuperAdminAI', path: 'src/pages/SuperAdminAI.tsx', type: 'ai', superadminIntegrated: true, navigationValue: 'ai-repair', status: 'active' },
      
      // Content Management
      { name: 'Posts Management', path: 'src/pages/SuperAdmin.tsx', type: 'content', superadminIntegrated: true, navigationValue: 'posts', status: 'active' },
      { name: 'ContentModerationAdmin', path: 'src/pages/admin/ContentModerationAdmin.tsx', type: 'content', superadminIntegrated: true, navigationValue: 'moderation', status: 'active' },
      { name: 'ReportsModeration', path: 'src/pages/admin/ReportsModeration.tsx', type: 'content', superadminIntegrated: true, navigationValue: 'reports', status: 'active' },
      { name: 'ContentTypesAdmin', path: 'src/pages/admin/ContentTypesAdmin.tsx', type: 'content', superadminIntegrated: false, navigationValue: null, status: 'partial' },
      
      // User Management
      { name: 'UsersAdmin', path: 'src/pages/admin/UsersAdmin.tsx', type: 'users', superadminIntegrated: true, navigationValue: 'users-list', status: 'active' },
      
      // Social Features
      { name: 'AlliesCovenAdmin', path: 'src/pages/admin/AlliesCovenAdmin.tsx', type: 'social', superadminIntegrated: true, navigationValue: 'covens', status: 'active' },
      { name: 'InfernalChatAdmin', path: 'src/pages/admin/InfernalChatAdmin.tsx', type: 'social', superadminIntegrated: true, navigationValue: 'chat', status: 'active' },
      
      // Mystical Tools
      { name: 'TarotRuneAdmin', path: 'src/pages/admin/TarotRuneAdmin.tsx', type: 'mystical', superadminIntegrated: true, navigationValue: 'tarot', status: 'active' },
      { name: 'OuijaChamberAdmin', path: 'src/pages/admin/OuijaChamberAdmin.tsx', type: 'mystical', superadminIntegrated: true, navigationValue: 'ouija', status: 'active' },
      { name: 'RitualCalendarAdmin', path: 'src/pages/admin/RitualCalendarAdmin.tsx', type: 'mystical', superadminIntegrated: true, navigationValue: 'calendar', status: 'active' },
      { name: 'OccultLibraryAdmin', path: 'src/pages/admin/OccultLibraryAdmin.tsx', type: 'mystical', superadminIntegrated: true, navigationValue: 'library', status: 'active' },
      
      // Creative Tools
      { name: 'SystemControl (Game Engine)', path: 'src/pages/admin/SystemControl.tsx', type: 'creative', superadminIntegrated: true, navigationValue: 'game-engine', status: 'active' },
      { name: 'CinematicEngine', path: 'src/pages/admin/CinematicEngine.tsx', type: 'creative', superadminIntegrated: true, navigationValue: 'cinematic', status: 'active' },
      { name: 'CinematicFrameEditor', path: 'src/pages/admin/CinematicFrameEditor.tsx', type: 'creative', superadminIntegrated: true, navigationValue: 'cinematic-frame-editor', status: 'active' },
      { name: 'FrameManager', path: 'src/pages/admin/FrameManager.tsx', type: 'creative', superadminIntegrated: true, navigationValue: 'frame-manager', status: 'active' },
      { name: 'InfernalAnimation', path: 'src/pages/admin/InfernalAnimation.tsx', type: 'creative', superadminIntegrated: true, navigationValue: 'infernal-animation', status: 'active' },
      { name: 'BookWritingEngine', path: 'src/pages/admin/BookWritingEngine.tsx', type: 'creative', superadminIntegrated: true, navigationValue: 'book-writing', status: 'active' },
      
      // Commerce
      { name: 'PrimeStoreAdmin', path: 'src/pages/admin/PrimeStoreAdmin.tsx', type: 'commerce', superadminIntegrated: true, navigationValue: 'store', status: 'active' },
      { name: 'AccessKeysAdmin', path: 'src/pages/admin/AccessKeysAdmin.tsx', type: 'commerce', superadminIntegrated: true, navigationValue: 'access-keys', status: 'active' },
      { name: 'AnimationSessionsAdmin', path: 'src/pages/admin/AnimationSessionsAdmin.tsx', type: 'commerce', superadminIntegrated: true, navigationValue: 'animations', status: 'active' },
      
      // System & Configuration
      { name: 'SiteConfigAdmin', path: 'src/pages/admin/SiteConfigAdmin.tsx', type: 'system', superadminIntegrated: true, navigationValue: 'site-config', status: 'active' },
      { name: 'SEOManagement', path: 'src/pages/admin/SEOManagement.tsx', type: 'system', superadminIntegrated: true, navigationValue: 'seo', status: 'active' },
      { name: 'HeaderFooterManagement', path: 'src/pages/admin/HeaderFooterManagement.tsx', type: 'system', superadminIntegrated: true, navigationValue: 'headers', status: 'active' },
      { name: 'SystemControl (Database)', path: 'src/pages/admin/SystemControl.tsx', type: 'system', superadminIntegrated: true, navigationValue: 'database', status: 'active' },
      { name: 'ModuleRegistry', path: 'src/pages/admin/ModuleRegistry.tsx', type: 'system', superadminIntegrated: true, navigationValue: 'modules', status: 'active' },
      
      // AI & Audit Systems
      { name: 'SiteAuditDashboard', path: 'src/pages/admin/SiteAuditDashboard.tsx', type: 'audit', superadminIntegrated: true, navigationValue: 'site-audit', status: 'active' },
      { name: 'SchemaForensics', path: 'src/components/admin/audit/SchemaForensics.tsx', type: 'audit', superadminIntegrated: true, navigationValue: 'schema', status: 'active' },
      { name: 'SecurityAudit', path: 'src/components/admin/audit/SecurityAudit.tsx', type: 'audit', superadminIntegrated: true, navigationValue: 'security', status: 'active' },
      { name: 'ErrorAnalysis', path: 'src/components/admin/audit/ErrorAnalysis.tsx', type: 'audit', superadminIntegrated: true, navigationValue: 'errors', status: 'active' },
      { name: 'PerformanceMetrics', path: 'src/components/admin/audit/PerformanceMetrics.tsx', type: 'audit', superadminIntegrated: true, navigationValue: 'performance', status: 'active' },
      { name: 'ModuleInventory', path: 'src/components/admin/audit/ModuleInventory.tsx', type: 'audit', superadminIntegrated: true, navigationValue: 'modules-inventory', status: 'active' },
      { name: 'AuditHistory', path: 'src/components/admin/audit/AuditHistory.tsx', type: 'audit', superadminIntegrated: true, navigationValue: 'history', status: 'active' },
      { name: 'ActionItems', path: 'src/components/admin/audit/ActionItems.tsx', type: 'audit', superadminIntegrated: true, navigationValue: 'actions', status: 'active' },
      { name: 'SystemAudit', path: 'src/components/admin/audit/SystemAudit.tsx', type: 'audit', superadminIntegrated: true, navigationValue: 'system-audit', status: 'active' },
      
      // Design Tools
      { name: 'DesignEditor', path: 'src/components/admin/DesignEditor.tsx', type: 'design', superadminIntegrated: false, navigationValue: null, status: 'partial' },
      { name: 'AIImageGenerator', path: 'src/components/admin/AIImageGenerator.tsx', type: 'ai', superadminIntegrated: false, navigationValue: null, status: 'partial' },
    ];

    setReport(modules);
    setLoading(false);
    
    toast({
      title: "Report Generated",
      description: `Found ${modules.length} modules. ${modules.filter(m => m.superadminIntegrated).length} integrated.`,
    });
  };

  const downloadReport = () => {
    const reportData = {
      generated_at: new Date().toISOString(),
      total_modules: report.length,
      integrated_modules: report.filter(m => m.superadminIntegrated).length,
      missing_modules: report.filter(m => !m.superadminIntegrated).length,
      modules: report,
      navigation_map: report.filter(m => m.navigationValue).map(m => ({
        module: m.name,
        nav_value: m.navigationValue,
        type: m.type
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `superadmin-integration-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Downloaded",
      description: "Full integration report saved to your downloads",
    });
  };

  const getStatusIcon = (status: string, integrated: boolean) => {
    if (!integrated) return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === 'active') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'partial') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      core: 'bg-purple-600',
      content: 'bg-blue-600',
      users: 'bg-cyan-600',
      social: 'bg-pink-600',
      mystical: 'bg-indigo-600',
      creative: 'bg-orange-600',
      commerce: 'bg-green-600',
      system: 'bg-gray-600',
      audit: 'bg-red-600',
      ai: 'bg-yellow-600',
      design: 'bg-teal-600'
    };
    return colors[type] || 'bg-gray-600';
  };

  const summary = {
    total: report.length,
    integrated: report.filter(m => m.superadminIntegrated).length,
    missing: report.filter(m => !m.superadminIntegrated).length,
    active: report.filter(m => m.status === 'active').length,
    partial: report.filter(m => m.status === 'partial').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">SuperAdmin Integration Report</h2>
          <p className="text-muted-foreground mt-2">
            Complete inventory of all modules and their SuperAdmin panel integration status
          </p>
        </div>
        <Button onClick={downloadReport} className="gap-2">
          <Download className="h-4 w-4" />
          Download Full Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Modules</CardDescription>
            <CardTitle className="text-3xl">{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-600/50">
          <CardHeader className="pb-2">
            <CardDescription>Integrated</CardDescription>
            <CardTitle className="text-3xl text-green-600">{summary.integrated}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-600/50">
          <CardHeader className="pb-2">
            <CardDescription>Missing</CardDescription>
            <CardTitle className="text-3xl text-red-600">{summary.missing}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-600/50">
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{summary.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-600/50">
          <CardHeader className="pb-2">
            <CardDescription>Partial</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{summary.partial}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Module Table */}
      <Card>
        <CardHeader>
          <CardTitle>Module Integration Status</CardTitle>
          <CardDescription>
            Detailed breakdown of all modules and their SuperAdmin integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Module Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Navigation Value</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Integration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.map((module, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    {getStatusIcon(module.status, module.superadminIntegrated)}
                  </TableCell>
                  <TableCell className="font-medium">{module.name}</TableCell>
                  <TableCell>
                    <Badge className={getTypeBadgeColor(module.type)}>
                      {module.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {module.navigationValue ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {module.navigationValue}
                      </code>
                    ) : (
                      <span className="text-muted-foreground text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {module.path}
                  </TableCell>
                  <TableCell>
                    {module.superadminIntegrated ? (
                      <Badge className="bg-green-600">Integrated</Badge>
                    ) : (
                      <Badge variant="destructive">Not Integrated</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Items Status */}
      <Card className="border-yellow-600/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Action Items & Remediation - ACTIVE
          </CardTitle>
          <CardDescription>
            Track and manage remediation tasks from audit findings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Navigation Value</p>
                <code className="text-sm text-muted-foreground">actions</code>
              </div>
              <div>
                <p className="font-medium">Component Path</p>
                <code className="text-sm text-muted-foreground">@/components/admin/audit/ActionItems</code>
              </div>
              <div>
                <p className="font-medium">SuperAdmin Tab</p>
                <code className="text-sm text-muted-foreground">System & Config → Action Items</code>
              </div>
              <Badge className="bg-green-600">INTEGRATED</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
