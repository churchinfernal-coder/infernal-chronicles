import { useState } from "react";
import { useAIFixEngine } from "@/hooks/useAIFixEngine";
import { useMonetization } from "@/hooks/useMonetization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, Play, Undo2, FileCode, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AIFixList() {
  const { fixes, loading, applyingFix, applyFix, rollbackFix } = useAIFixEngine();
  const { logUsage, checkTierAccess } = useMonetization();
  const [filter, setFilter] = useState<'all' | 'applied' | 'pending' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFix, setSelectedFix] = useState<any>(null);

  const filteredFixes = fixes.filter(fix => {
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'applied' && fix.applied && fix.verified !== false) ||
      (filter === 'pending' && !fix.applied) ||
      (filter === 'failed' && fix.verified === false);
    
    const matchesSearch = 
      fix.fix_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fix.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (fix: any) => {
    if (fix.applied && fix.verified === false) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="w-3 h-3" /> Failed
      </Badge>;
    }
    if (fix.applied) {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle2 className="w-3 h-3" /> Applied
      </Badge>;
    }
    return <Badge variant="secondary" className="flex items-center gap-1">
      <Clock className="w-3 h-3" /> Pending
    </Badge>;
  };

  if (loading) {
    return <div className="flex justify-center items-center p-12">Loading fixes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search fixes by ID or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({fixes.length})</TabsTrigger>
          <TabsTrigger value="applied">
            Applied ({fixes.filter(f => f.applied && f.verified !== false).length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({fixes.filter(f => !f.applied).length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed ({fixes.filter(f => f.verified === false).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 space-y-3">
          {filteredFixes.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center text-muted-foreground">
                No fixes found matching your criteria
              </CardContent>
            </Card>
          ) : (
            filteredFixes.map((fix) => (
              <Card key={fix.id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(fix)}
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {fix.id.slice(0, 8)}
                        </code>
                      </div>
                      <CardTitle className="text-lg">{fix.fix_description}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {!fix.applied && (
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!checkTierAccess('basic')) {
                              toast.error('Upgrade to Basic tier to apply fixes');
                              return;
                            }
                            await applyFix(fix.id);
                            await logUsage('ai_fix_engine', 'apply_fix', 5);
                          }}
                          disabled={applyingFix === fix.id}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Apply (5 credits)
                        </Button>
                      )}
                      {fix.applied && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rollbackFix(fix.id)}
                        >
                          <Undo2 className="w-4 h-4 mr-1" />
                          Rollback
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedFix(fix)}
                      >
                        <FileCode className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Script Reference</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                      {fix.script_reference || 'N/A'}
                    </code>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-semibold mt-1">{(fix.success_rate || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-semibold mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(fix.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Verification</p>
                    <p className="font-semibold mt-1">
                      {fix.verification_log ? 'Complete' : 'Pending'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {selectedFix && (
        <Dialog open={!!selectedFix} onOpenChange={() => setSelectedFix(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Fix Details
                {getStatusBadge(selectedFix)}
              </DialogTitle>
              <DialogDescription>
                <code className="text-xs">{selectedFix.id}</code>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{selectedFix.fix_description}</p>
              </div>
              
              {selectedFix.script_reference && (
                <div>
                  <p className="font-semibold mb-1">Script Reference</p>
                  <code className="block bg-muted p-3 rounded text-xs overflow-x-auto">
                    /fixes/rollback/{selectedFix.id}.js
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stored as: {selectedFix.script_reference}
                  </p>
                </div>
              )}

              {selectedFix.verification_log && (
                <div>
                  <p className="font-semibold mb-1">Verification Log</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {selectedFix.verification_log}
                  </pre>
                </div>
              )}

              {selectedFix.metadata && (
                <div>
                  <p className="font-semibold mb-1">Metadata</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedFix.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-semibold">
                    {format(new Date(selectedFix.created_at), 'PPpp')}
                  </p>
                </div>
                {selectedFix.applied_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Applied At</p>
                    <p className="font-semibold">
                      {format(new Date(selectedFix.applied_at), 'PPpp')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
