import { useState } from "react";
import { useAIAssets } from "@/hooks/useAIAssets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, FileCode, Image, Video, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AIAssetViewer() {
  const { assets, loading } = useAIAssets();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const filteredAssets = assets.filter(asset => 
    asset.asset_path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.module_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssetIcon = (type: string | null) => {
    if (!type) return <FileCode className="w-4 h-4" />;
    if (type.includes('image')) return <Image className="w-4 h-4" />;
    if (type.includes('video')) return <Video className="w-4 h-4" />;
    return <FileCode className="w-4 h-4" />;
  };

  const getAssetTypeBadge = (type: string | null) => {
    if (!type) return <Badge variant="secondary">Unknown</Badge>;
    if (type === 'script') return <Badge variant="default" className="bg-blue-500">Script</Badge>;
    if (type === 'rollback') return <Badge variant="default" className="bg-orange-500">Rollback</Badge>;
    if (type === 'visual') return <Badge variant="default" className="bg-purple-500">Visual</Badge>;
    return <Badge variant="secondary">{type}</Badge>;
  };

  const handleDownload = (asset: any) => {
    if (!asset.asset_path) {
      toast.error('No asset path available');
      return;
    }
    // Trigger download
    window.open(asset.asset_path, '_blank');
  };

  const handlePreview = (asset: any) => {
    setSelectedAsset(asset);
    setPreviewOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center p-12">Loading assets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by path, type, or module..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Badge variant="outline" className="ml-auto">
          {filteredAssets.length} Assets
        </Badge>
      </div>

      <div className="grid gap-3">
        {filteredAssets.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              No assets found matching your criteria
            </CardContent>
          </Card>
        ) : (
          filteredAssets.map((asset) => (
            <Card key={asset.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getAssetIcon(asset.asset_type)}
                      {getAssetTypeBadge(asset.asset_type)}
                      {asset.verified_by && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg break-all">
                      {asset.asset_path || 'No path'}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    {asset.asset_path && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(asset)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(asset)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fix ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                    {asset.fix_id ? asset.fix_id.slice(0, 8) : 'N/A'}
                  </code>
                </div>
                <div>
                  <p className="text-muted-foreground">Module</p>
                  <p className="font-semibold mt-1">{asset.module_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Resolution</p>
                  <p className="font-semibold mt-1">{asset.resolution || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Format</p>
                  <p className="font-semibold mt-1">{asset.format || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Verified By</p>
                  <p className="font-semibold mt-1">{asset.verified_by || 'Not verified'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-semibold mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(asset.created_at), 'MMM d, HH:mm')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedAsset && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Asset Preview
                {getAssetTypeBadge(selectedAsset.asset_type)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Asset Path</p>
                <code className="block bg-muted p-3 rounded text-xs overflow-x-auto">
                  {selectedAsset.asset_path}
                </code>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-1">Type</p>
                  <p className="text-sm text-muted-foreground">{selectedAsset.asset_type || 'Unknown'}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Format</p>
                  <p className="text-sm text-muted-foreground">{selectedAsset.format || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Resolution</p>
                  <p className="text-sm text-muted-foreground">{selectedAsset.resolution || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Verified By</p>
                  <p className="text-sm text-muted-foreground">{selectedAsset.verified_by || 'Not verified'}</p>
                </div>
              </div>

              {selectedAsset.fix_id && (
                <div>
                  <p className="font-semibold mb-1">Fix ID</p>
                  <code className="block bg-muted p-3 rounded text-xs">
                    {selectedAsset.fix_id}
                  </code>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Created: {format(new Date(selectedAsset.created_at), 'PPpp')}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
