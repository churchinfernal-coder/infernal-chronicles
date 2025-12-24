import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Trash2, Plus, RefreshCw, Package } from "lucide-react";

export default function PrimeStoreAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    content_type: "feature",
    required_prime_level: 0,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("locked_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setItems(data);
    setLoading(false);
  };

  const handleCreateItem = async () => {
    if (!newItem.title) {
      toast.error("Title is required");
      return;
    }

    const { error } = await supabase.from("locked_content").insert({
      title: newItem.title,
      description: newItem.description,
      content_type: newItem.content_type,
      required_prime_level: newItem.required_prime_level,
    });

    if (error) {
      toast.error("Failed to create item");
      return;
    }

    toast.success("Item created successfully");
    setCreateDialogOpen(false);
    setNewItem({ title: "", description: "", content_type: "feature", required_prime_level: 0 });
    fetchItems();
  };

  const startEdit = (item: any) => {
    setEditingItem(item.id);
    setEditState({
      ...editState,
      [item.id]: { ...item }
    });
  };

  const saveEdit = async (itemId: string) => {
    const state = editState[itemId];
    const { error } = await supabase
      .from("locked_content")
      .update({
        title: state.title,
        description: state.description,
        content_type: state.content_type,
        required_prime_level: parseInt(state.required_prime_level),
      })
      .eq("id", itemId);

    if (error) {
      toast.error("Failed to update item");
      return;
    }
    toast.success("Item updated");
    setEditingItem(null);
    fetchItems();
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("Delete this item permanently?")) return;
    const { error } = await supabase.from("locked_content").delete().eq("id", itemId);
    if (error) {
      toast.error("Failed to delete item");
      return;
    }
    toast.success("Item deleted");
    fetchItems();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Prime Store Management
            </CardTitle>
            <CardDescription>
              Create, edit, and delete premium store items
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Store Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      placeholder="Item title"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Item description"
                    />
                  </div>
                  <div>
                    <Label>Content Type</Label>
                    <Input
                      value={newItem.content_type}
                      onChange={(e) => setNewItem({ ...newItem, content_type: e.target.value })}
                      placeholder="feature, content, etc."
                    />
                  </div>
                  <div>
                    <Label>Required Prime Level</Label>
                    <Input
                      type="number"
                      value={newItem.required_prime_level}
                      onChange={(e) => setNewItem({ ...newItem, required_prime_level: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateItem}>Create Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={fetchItems} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Prime Level</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {editingItem === item.id ? (
                    <Input
                      value={editState[item.id]?.title || ""}
                      onChange={(e) => setEditState({
                        ...editState,
                        [item.id]: { ...editState[item.id], title: e.target.value }
                      })}
                    />
                  ) : (
                    <div>
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingItem === item.id ? (
                    <Input
                      value={editState[item.id]?.content_type || ""}
                      onChange={(e) => setEditState({
                        ...editState,
                        [item.id]: { ...editState[item.id], content_type: e.target.value }
                      })}
                    />
                  ) : (
                    <Badge variant="outline">{item.content_type}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editingItem === item.id ? (
                    <Input
                      type="number"
                      value={editState[item.id]?.required_prime_level || 0}
                      onChange={(e) => setEditState({
                        ...editState,
                        [item.id]: { ...editState[item.id], required_prime_level: e.target.value }
                      })}
                    />
                  ) : (
                    <Badge>{item.required_prime_level}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {editingItem === item.id ? (
                      <>
                        <Button size="sm" onClick={() => saveEdit(item.id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No store items yet. Click "Add Item" to create one.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
