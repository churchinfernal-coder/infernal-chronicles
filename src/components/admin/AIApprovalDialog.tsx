import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, Code2, FileText, Play, X } from "lucide-react";

interface AIApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  modification: any;
  onApprove: () => void;
  onReject: () => void;
  isDeploying: boolean;
}

export function AIApprovalDialog({
  open,
  onClose,
  modification,
  onApprove,
  onReject,
  isDeploying
}: AIApprovalDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!modification) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-black via-[#1a0000] to-black border-[#DC143C]/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#DC143C] flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            ADMIN APPROVAL REQUIRED
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Review and approve AI-generated code modification before deployment
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid grid-cols-4 bg-black/50 border border-[#DC143C]/20">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="code">Code Diff</TabsTrigger>
            <TabsTrigger value="reasoning">AI Reasoning</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/30 rounded border border-[#DC143C]/20">
                  <p className="text-gray-400 text-sm mb-2">Module</p>
                  <p className="text-[#DC143C] font-mono font-semibold">{modification.module_path}</p>
                </div>
                <div className="p-4 bg-black/30 rounded border border-[#DC143C]/20">
                  <p className="text-gray-400 text-sm mb-2">Type</p>
                  <Badge className="bg-[#DC143C]/20 text-[#DC143C]">
                    {modification.modification_type}
                  </Badge>
                </div>
                <div className="p-4 bg-black/30 rounded border border-[#DC143C]/20">
                  <p className="text-gray-400 text-sm mb-2">Created</p>
                  <p className="text-white text-sm">{new Date(modification.created_at).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-black/30 rounded border border-[#DC143C]/20">
                  <p className="text-gray-400 text-sm mb-2">Status</p>
                  <Badge variant={modification.applied ? "default" : "outline"}>
                    {modification.applied ? 'APPLIED' : 'PENDING'}
                  </Badge>
                </div>
              </div>

              {modification.error_log_id && (
                <div className="p-4 bg-yellow-500/10 rounded border border-yellow-500/20">
                  <p className="text-yellow-500 font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Linked Error
                  </p>
                  <p className="text-gray-300 text-sm mt-2">
                    This modification was generated in response to error log: {modification.error_log_id}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-500/10 p-4 rounded border border-red-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <X className="h-4 w-4 text-red-500" />
                    <p className="text-red-500 font-semibold">ORIGINAL CODE</p>
                  </div>
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-[400px] overflow-auto">
                    {modification.original_code}
                  </pre>
                </div>
                <div className="bg-green-500/10 p-4 rounded border border-green-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <p className="text-green-500 font-semibold">MODIFIED CODE</p>
                  </div>
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-[400px] overflow-auto">
                    {modification.modified_code}
                  </pre>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reasoning" className="space-y-4">
              <div className="p-4 bg-black/30 rounded border border-[#DC143C]/20">
                <p className="text-[#DC143C] font-semibold mb-3 flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  AI Analysis & Reasoning
                </p>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">
                  {modification.ai_reasoning || 'No reasoning provided'}
                </p>
              </div>

              {modification.diff_data && (
                <div className="p-4 bg-black/30 rounded border border-[#DC143C]/20">
                  <p className="text-[#DC143C] font-semibold mb-3">Diff Metadata</p>
                  <pre className="text-xs text-gray-300 overflow-auto max-h-[200px]">
                    {JSON.stringify(modification.diff_data, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tests" className="space-y-4">
              <div className="p-4 bg-black/30 rounded border border-[#DC143C]/20">
                <p className="text-[#DC143C] font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Automated Tests Will Run
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Unit tests for module logic
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    UI rendering validation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Database query integrity checks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Security vulnerability scan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Performance regression tests
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-500/10 rounded border border-yellow-500/20">
                <p className="text-yellow-500 font-semibold mb-2">⚠️ Deployment Impact</p>
                <p className="text-gray-300 text-sm">
                  Approving this modification will trigger automated tests and deploy to production.
                  Rollback points will be created automatically.
                </p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button
            onClick={onReject}
            variant="outline"
            className="border-red-500/50 text-red-500 hover:bg-red-500/10"
            disabled={isDeploying}
          >
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={onApprove}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isDeploying}
          >
            {isDeploying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deploying...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Approve & Deploy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
