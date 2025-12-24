import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileCode, Folder } from "lucide-react";

interface Module {
  name: string;
  type: 'page' | 'component' | 'hook' | 'utility';
  path: string;
  status: 'active' | 'deprecated';
}

export function ModuleInventory() {
  // Hardcoded module inventory - in production, this would be dynamically generated
  const modules: Module[] = [
    // Pages
    { name: "Chat", type: "page", path: "/chat", status: "active" },
    { name: "Dashboard", type: "page", path: "/dashboard", status: "active" },
    { name: "Profile", type: "page", path: "/profile", status: "active" },
    { name: "Covens", type: "page", path: "/covens", status: "active" },
    { name: "Feed", type: "page", path: "/feed", status: "active" },
    { name: "Friends", type: "page", path: "/friends", status: "active" },
    { name: "OccultLibrary", type: "page", path: "/occult-library", status: "active" },
    { name: "Store", type: "page", path: "/store", status: "active" },
    { name: "SuperAdmin", type: "page", path: "/admin/super", status: "active" },
    { name: "SiteAuditDashboard", type: "page", path: "/admin/super", status: "active" },
    
    // Components
    { name: "AnimationGenerator", type: "component", path: "src/components/AnimationGenerator.tsx", status: "active" },
    { name: "VoiceCallDialog", type: "component", path: "src/components/VoiceCallDialog.tsx", status: "active" },
    { name: "VideoCallDialog", type: "component", path: "src/components/VideoCallDialog.tsx", status: "active" },
    { name: "ChatMediaUpload", type: "component", path: "src/components/ChatMediaUpload.tsx", status: "active" },
    { name: "DesignEditor", type: "component", path: "src/components/admin/DesignEditor.tsx", status: "active" },
    
    // Hooks
    { name: "useAnimationEngine", type: "hook", path: "src/hooks/useAnimationEngine.ts", status: "active" },
    { name: "useOuijaEngine", type: "hook", path: "src/hooks/useOuijaEngine.ts", status: "active" },
    { name: "usePerformanceMonitoring", type: "hook", path: "src/hooks/usePerformanceMonitoring.ts", status: "active" },
    
    // Utilities
    { name: "chatEncryption", type: "utility", path: "src/lib/chatEncryption.ts", status: "active" },
    { name: "mediaEncryption", type: "utility", path: "src/lib/mediaEncryption.ts", status: "active" },
    { name: "webrtc", type: "utility", path: "src/lib/webrtc.ts", status: "active" },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return <Folder className="h-4 w-4" />;
      default:
        return <FileCode className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'page': return 'default';
      case 'component': return 'secondary';
      case 'hook': return 'outline';
      case 'utility': return 'outline';
      default: return 'default';
    }
  };

  const modulesByType = {
    page: modules.filter(m => m.type === 'page'),
    component: modules.filter(m => m.type === 'component'),
    hook: modules.filter(m => m.type === 'hook'),
    utility: modules.filter(m => m.type === 'utility'),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modulesByType.page.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Components</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modulesByType.component.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hooks</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modulesByType.hook.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilities</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modulesByType.utility.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Inventory</CardTitle>
          <CardDescription>Complete list of all application modules</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {getTypeIcon(module.type)}
                    {module.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeColor(module.type) as any}>
                      {module.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{module.path}</TableCell>
                  <TableCell>
                    <Badge variant={module.status === 'active' ? 'default' : 'secondary'}>
                      {module.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
