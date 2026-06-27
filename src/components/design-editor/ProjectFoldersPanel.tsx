import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, FolderPlus, File, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProjectFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at:  string;
}

interface ProjectFoldersPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderSelect: (folderId: string | null) => void;
}

export function ProjectFoldersPanel({ open, onOpenChange, onFolderSelect }: ProjectFoldersPanelProps) {
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadFolders();
    }
  }, [open]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const { data:  { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('design_project_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error:  any) {
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName. trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('design_project_folders')
        .insert({
          user_id: user.id,
          name: newFolderName. trim(),
          parent_folder_id: selectedFolder,
        });

      if (error) throw error;

      toast.success('Folder created');
      setNewFolderName('');
      loadFolders();
    } catch (error: any) {
      toast.error('Failed to create folder');
    }
  };

  const deleteFolder = async (folderId:  string) => {
    if (!confirm('Delete this folder?  Projects inside will be moved to root.')) return;

    try {
      const { error } = await supabase
        .from('design_project_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      toast. success('Folder deleted');
      loadFolders();
    } catch (error: any) {
      toast.error('Failed to delete folder');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Organize Projects</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="New folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
            />
            <Button onClick={createFolder} size="sm">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              <Button
                variant={selectedFolder === null ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedFolder(null);
                  onFolderSelect(null);
                }}
              >
                <Folder className="h-4 w-4 mr-2" />
                All Projects
              </Button>

              {folders.map((folder) => (
                <div key={folder.id} className="flex items-center gap-2">
                  <Button
                    variant={selectedFolder === folder.id ? 'default' : 'ghost'}
                    className="flex-1 justify-start"
                    onClick={() => {
                      setSelectedFolder(folder.id);
                      onFolderSelect(folder.id);
                    }}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    {folder.name}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFolder(folder.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}