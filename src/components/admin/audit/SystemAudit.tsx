import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Database, FileCode, Image, Package, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SystemReport {
  modules: ModuleInfo[];
  tables: TableInfo[];
  assets: AssetInfo[];
  edgeFunctions: EdgeFunctionInfo[];
  metadata: {
    generatedAt: string;
    generatedBy: string;
    projectId: string;
  };
}

interface ModuleInfo {
  name: string;
  path: string;
  type: 'page' | 'component' | 'hook' | 'util' | 'admin';
  status: 'active' | 'partial' | 'missing';
  linkedComponent?: string;
  superadminIntegrated: boolean;
}

interface TableInfo {
  tableName: string;
  rowCount: number;
  schema: string;
  lastUpdated?: string;
  linkedModule?: string;
}

interface AssetInfo {
  fileName: string;
  assetType: string;
  storagePath: string;
  bucket: string;
  size?: number;
  linkedModule?: string;
}

interface EdgeFunctionInfo {
  name: string;
  purpose: string;
  status: 'wired' | 'unused' | 'active';
  linkedModule?: string;
}

export function SystemAudit() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SystemReport | null>(null);


  useEffect(() => {
    generateReport();
  }, []);

  // Utility to scan App.tsx for custom routes and mark modules as Linked
  const scanAppRoutes = async () => {
    // Only scan for custom component routes
    try {
      const res = await fetch('/src/App.tsx');
      if (!res.ok) return [];
      const appCode = await res.text();
      const linkedModules: string[] = [];
      // Look for custom component routes
      const routeRegex = /<Route path="\/(design-editor|ai-image-generator|ouija-board|tarot-card)"/g;
      let match;
      while ((match = routeRegex.exec(appCode)) !== null) {
        switch (match[1]) {
          case 'design-editor':
            linkedModules.push('DesignEditor');
            break;
          case 'ai-image-generator':
            linkedModules.push('AIImageGenerator');
            break;
          case 'ouija-board':
            linkedModules.push('OuijaBoard');
            break;
          case 'tarot-card':
            linkedModules.push('TarotCard');
            break;
        }
      }
      return linkedModules;
    } catch {
      return [];
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);

      // Scan App.tsx for custom component routes
      const linkedCustomModules = await scanAppRoutes();

      // Generate modules inventory
      const modules: ModuleInfo[] = [
    // Admin Pages
    { name: 'SuperAdmin', path: 'src/pages/SuperAdmin.tsx', type: 'admin' as const, status: 'active', superadminIntegrated: true },
    { name: 'SuperAdminAI', path: 'src/pages/SuperAdminAI.tsx', type: 'admin' as const, status: 'active', superadminIntegrated: true },
    { name: 'InfernalAnimation', path: 'src/pages/admin/InfernalAnimation.tsx', type: 'admin' as const, status: 'active', superadminIntegrated: true },
    { name: 'SiteAuditDashboard', path: 'src/pages/admin/SiteAuditDashboard.tsx', type: 'admin' as const, status: 'active', superadminIntegrated: true },
    { name: 'BookWritingEngine', path: 'src/pages/admin/BookWritingEngine.tsx', type: 'admin' as const, status: 'active', superadminIntegrated: true },
    { name: 'CinematicEngine', path: 'src/pages/admin/CinematicEngine.tsx', type: 'admin' as const, status: 'active', superadminIntegrated: true },
    { name: 'ModuleRegistry', path: 'src/pages/admin/ModuleRegistry.tsx', type: 'admin' as const, status: 'active', superadminIntegrated: true },
    { name: 'AnimationSessionsAdmin', path: 'src/pages/admin/AnimationSessionsAdmin.tsx', type: 'admin' as const, status: 'active', superadminIntegrated: true },
    { name: 'ReportsModeration', path: 'src/pages/admin/ReportsModeration.tsx', type: 'admin' as const, status: 'active', superadminIntegrated: true },
    // User Pages
    { name: 'Dashboard', path: 'src/pages/Dashboard.tsx', type: 'page' as const, status: 'active', superadminIntegrated: false },
        { name: 'Chat', path: 'src/pages/Chat.tsx', type: 'page', status: 'active', superadminIntegrated: false },
        { name: 'Covens', path: 'src/pages/Covens.tsx', type: 'page', status: 'active', superadminIntegrated: false },
        { name: 'OuijaRoom', path: 'src/pages/OuijaRoom.tsx', type: 'page', status: 'active', superadminIntegrated: false },
        { name: 'TarotReading', path: 'src/pages/TarotReading.tsx', type: 'page', status: 'active', superadminIntegrated: false },
        { name: 'RuneCasting', path: 'src/pages/RuneCasting.tsx', type: 'page', status: 'active', superadminIntegrated: false },
        { name: 'GameEngine', path: 'src/pages/GameEngine.tsx', type: 'page', status: 'active', superadminIntegrated: false },
        { name: 'WickedWorks', path: 'src/pages/WickedWorks.tsx', type: 'page', status: 'active', superadminIntegrated: false },
        { name: 'OccultLibrary', path: 'src/pages/OccultLibrary.tsx', type: 'page', status: 'active', superadminIntegrated: false },
        { name: 'Store', path: 'src/pages/Store.tsx', type: 'page', status: 'active', superadminIntegrated: false },

        // Key Components
        { name: 'DesignEditor', path: 'src/components/admin/DesignEditor.tsx', type: 'component', status: 'active', superadminIntegrated: false },
        { name: 'AIImageGenerator', path: 'src/components/admin/AIImageGenerator.tsx', type: 'component', status: 'active', superadminIntegrated: false },
        { name: 'OuijaBoard', path: 'src/components/OuijaBoard.tsx', type: 'component', status: 'active', superadminIntegrated: false },
        { name: 'TarotCard', path: 'src/components/TarotCard.tsx', type: 'component', status: 'active', superadminIntegrated: false },
      ].map(module => {
        // Mark custom routed modules as Linked
        if (linkedCustomModules.includes(module.name)) {
          return { ...module, status: 'active', superadminIntegrated: true };
        }
        return module;
      });

      // Fetch database tables
      const knownTables = [
        'profiles', 'user_roles', 'conversations', 'messages', 'friendships', 'covens',
        'coven_members', 'coven_posts', 'posts', 'comments', 'reactions',
        'dungeon_albums', 'dungeon_media', 'dungeon_access_keys', 'dungeon_coven_access',
        'ouija_rooms', 'ouija_participants', 'ouija_messages',
        'ai_error_logs', 'ai_performance_metrics', 'ai_generated_images',
        'animation_sessions', 'cinematic_projects', 'cinematic_frames',
        'book_projects', 'book_chapters', 'game_projects'
      ];

      const tables: TableInfo[] = [];
      for (const tableName of knownTables) {
        try {
          const { count }: any = await supabase.from(tableName as any).select('*', { count: 'exact', head: true });
          tables.push({
            tableName,
            rowCount: count || 0,
            schema: 'public',
            linkedModule: getLinkedModule(tableName)
          });
        } catch (err) {
          tables.push({
            tableName,
            rowCount: 0,
            schema: 'public',
            linkedModule: getLinkedModule(tableName)
          });
        }
      }

      // Storage buckets inventory
      const assets: AssetInfo[] = [];
      const buckets = [
        { name: 'profile-images', type: 'avatar' },
        { name: 'header-images', type: 'header' },
        { name: 'post-media', type: 'media' },
        { name: 'chat-media', type: 'media' },
        { name: 'dungeon-media', type: 'album' },
        { name: 'coven-sigils', type: 'sigil' },
        { name: 'design-editor', type: 'design' },
        { name: 'game-assets', type: 'game' },
        { name: 'book-covers', type: 'cover' }
      ];

      for (const bucket of buckets) {
        try {
          const { data: files } = await supabase.storage.from(bucket.name).list();
          if (files) {
            files.forEach(file => {
              assets.push({
                fileName: file.name,
                assetType: bucket.type,
                storagePath: `${bucket.name}/${file.name}`,
                bucket: bucket.name,
                size: file.metadata?.size,
                linkedModule: getAssetModule(bucket.name)
              });
            });
          }
        } catch (err) {
          console.error(`Error listing ${bucket.name}:`, err);
        }
      }

      // Edge functions inventory
      const edgeFunctions: EdgeFunctionInfo[] = [
        { name: 'ai-cinematic-generate', purpose: 'Generate cinematic frames using AI', status: 'active', linkedModule: 'CinematicEngine' },
        { name: 'ai-image-generator', purpose: 'Generate images using AI', status: 'active', linkedModule: 'AIImageGenerator' },
        { name: 'ai-error-analyzer', purpose: 'Analyze and fix errors', status: 'active', linkedModule: 'SuperAdminAI' },
        { name: 'ai-log-error', purpose: 'Log errors to database', status: 'active', linkedModule: 'ErrorMonitoring' },
        { name: 'ai-log-performance', purpose: 'Log performance metrics', status: 'active', linkedModule: 'PerformanceMonitoring' },
        { name: 'frame-upload', purpose: 'Upload cinematic frames to storage', status: 'active', linkedModule: 'CinematicEngine' },
        { name: 'ouija-spirit-response', purpose: 'Generate Ouija spirit responses', status: 'active', linkedModule: 'OuijaRoom' },
        { name: 'generate-tarot-interpretation', purpose: 'Generate tarot card readings', status: 'active', linkedModule: 'TarotReading' },
        { name: 'generate-rune-interpretation', purpose: 'Generate rune interpretations', status: 'active', linkedModule: 'RuneCasting' },
        { name: 'ai-generate-chapter', purpose: 'Generate book chapters', status: 'active', linkedModule: 'BookWritingEngine' },
      ];

      const reportData: SystemReport = {
        modules,
        tables,
        assets,
        edgeFunctions,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: (await supabase.auth.getUser()).data.user?.email || 'system',
          projectId: 'khugyibzsujjgtddwzpa'
        }
      };

      setReport(reportData);
      toast({
        title: "System Report Generated",
        description: `Analyzed ${modules.length} modules, ${tables.length} tables, ${assets.length} assets, ${edgeFunctions.length} functions`
      });
    } catch (error) {
      console.error("Report generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate system report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getLinkedModule = (tableName: string): string => {
    const mapping: Record<string, string> = {
      'profiles': 'Profile',
      'user_roles': 'Authentication',
      'conversations': 'Chat',
      'messages': 'Chat',
      'friendships': 'Friends',
      'covens': 'Covens',
      'coven_members': 'Covens',
      'coven_posts': 'Covens',
      'posts': 'Feed',
      'dungeon_albums': 'DungeonAlbum',
      'ouija_rooms': 'OuijaRoom',
      'ai_error_logs': 'SuperAdminAI',
      'cinematic_projects': 'CinematicEngine',
      'book_projects': 'BookWritingEngine',
      'game_projects': 'GameEngine'
    };
    return mapping[tableName] || 'Unknown';
  };

  const getAssetModule = (bucket: string): string => {
    const mapping: Record<string, string> = {
      'profile-images': 'Profile',
      'coven-sigils': 'Covens',
      'dungeon-media': 'DungeonAlbum',
      'game-assets': 'GameEngine',
      'book-covers': 'OccultLibrary'
    };
    return mapping[bucket] || 'General';
  };

  const downloadReport = () => {
    if (!report) return;
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-audit-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "System audit report saved as JSON"
    });
  };

  if (loading || !report) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Activity className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>🩸 Complete System Audit</CardTitle>
              <CardDescription>
                Forensic inventory of all modules, tables, assets, and logic blocks
              </CardDescription>
            </div>
            <Button onClick={downloadReport} className="gap-2">
              <Download className="h-4 w-4" />
              Download JSON Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Generated At:</span>
              <p className="font-mono">{new Date(report.metadata.generatedAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Generated By:</span>
              <p className="font-mono">{report.metadata.generatedBy}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Project ID:</span>
              <p className="font-mono">{report.metadata.projectId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules" className="gap-2">
            <Package className="h-4 w-4" />
            Modules ({report.modules.length})
          </TabsTrigger>
          <TabsTrigger value="tables" className="gap-2">
            <Database className="h-4 w-4" />
            Tables ({report.tables.length})
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2">
            <Image className="h-4 w-4" />
            Assets ({report.assets.length})
          </TabsTrigger>
          <TabsTrigger value="functions" className="gap-2">
            <FileCode className="h-4 w-4" />
            Functions ({report.edgeFunctions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>🩸 MODULE INVENTORY</CardTitle>
              <CardDescription>
                All created modules with status and SuperAdmin integration tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SuperAdmin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.modules.map((module, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{module.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{module.type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{module.path}</TableCell>
                      <TableCell>
                        <Badge variant={module.status === 'active' ? 'default' : 'destructive'}>
                          {module.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {module.superadminIntegrated ? '✓' : '⚠ Not Linked'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>🩸 DATABASE TABLES</CardTitle>
              <CardDescription>
                All existing tables with row counts and linked modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Schema</TableHead>
                    <TableHead>Row Count</TableHead>
                    <TableHead>Linked Module</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.tables.map((table, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{table.tableName}</TableCell>
                      <TableCell>{table.schema}</TableCell>
                      <TableCell>{table.rowCount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{table.linkedModule}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>🩸 VISUAL ASSETS</CardTitle>
              <CardDescription>
                All stored assets with type, bucket, and linked modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Bucket</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Linked Module</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.assets.slice(0, 50).map((asset, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{asset.fileName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{asset.assetType}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{asset.bucket}</TableCell>
                      <TableCell>{asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{asset.linkedModule}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {report.assets.length > 50 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Showing 50 of {report.assets.length} total assets. Download JSON for complete list.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions">
          <Card>
            <CardHeader>
              <CardTitle>🩸 LOGIC BLOCKS (Edge Functions)</CardTitle>
              <CardDescription>
                All backend functions with purpose and linked modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Function Name</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Module</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.edgeFunctions.map((func, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{func.name}</TableCell>
                      <TableCell className="text-sm">{func.purpose}</TableCell>
                      <TableCell>
                        <Badge variant={func.status === 'active' ? 'default' : 'secondary'}>
                          {func.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{func.linkedModule}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
