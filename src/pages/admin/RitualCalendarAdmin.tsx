import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, Save, Plus, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Ritual {
  id: string;
  title: string;
  description: string | null;
  ritual_type: string;
  scheduled_date: string;
  location: string | null;
  is_public: boolean;
  user_id: string;
  coven_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
  } | null;
}

interface EditState {
  title: string;
  description: string;
  ritual_type: string;
  scheduled_date: string;
  location: string;
  is_public: boolean;
}

export default function RitualCalendarAdmin() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRitual, setEditingRitual] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, EditState>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRitual, setNewRitual] = useState<EditState>({
    title: "",
    description: "",
    ritual_type: "meditation",
    scheduled_date: new Date().toISOString().slice(0, 16),
    location: "",
    is_public: true
  });

  useEffect(() => {
    fetchRituals();
  }, []);

  const fetchRituals = async () => {
    const { data, error } = await supabase
      .from("rituals")
      .select(`
        *,
        profiles(username)
      `)
      .order("scheduled_date", { ascending: false });

    if (error) {
      toast({ title: "Error fetching rituals", description: error.message, variant: "destructive" });
      return;
    }
    setRituals(data as any || []);
    setLoading(false);
  };

  const logEdit = async (ritualId: string, editType: string, oldValue: any, newValue: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("admin_post_edits").insert({
      post_id: ritualId,
      admin_user_id: user.id,
      edit_type: `ritual_${editType}`,
      old_value: oldValue,
      new_value: newValue,
    });
  };

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("rituals").insert({
      ...newRitual,
      user_id: user.id
    });

    if (error) {
      toast({ title: "Error creating ritual", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Ritual created successfully" });
    setShowCreateDialog(false);
    setNewRitual({
      title: "",
      description: "",
      ritual_type: "meditation",
      scheduled_date: new Date().toISOString().slice(0, 16),
      location: "",
      is_public: true
    });
    fetchRituals();
  };

  const handleSaveEdit = async (ritual: Ritual) => {
    const state = editState[ritual.id];
    if (!state) return;

    const updates: any = {
      title: state.title,
      description: state.description,
      ritual_type: state.ritual_type,
      scheduled_date: state.scheduled_date,
      location: state.location,
      is_public: state.is_public,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("rituals")
      .update(updates)
      .eq("id", ritual.id);

    if (error) {
      toast({ title: "Error updating ritual", variant: "destructive" });
      return;
    }

    await logEdit(ritual.id, "edit", {
      title: ritual.title,
      ritual_type: ritual.ritual_type,
      is_public: ritual.is_public
    }, updates);

    toast({ title: "Ritual updated successfully" });
    setEditingRitual(null);
    fetchRituals();
  };

  const startEdit = (ritual: Ritual) => {
    setEditingRitual(ritual.id);
    setEditState({
      ...editState,
      [ritual.id]: {
        title: ritual.title,
        description: ritual.description || "",
        ritual_type: ritual.ritual_type,
        scheduled_date: ritual.scheduled_date.slice(0, 16),
        location: ritual.location || "",
        is_public: ritual.is_public
      }
    });
  };

  const handleDelete = async (ritualId: string) => {
    if (!confirm("Are you sure you want to delete this ritual?")) return;

    const { error } = await supabase.from("rituals").delete().eq("id", ritualId);

    if (error) {
      toast({ title: "Error deleting ritual", variant: "destructive" });
      return;
    }

    toast({ title: "Ritual deleted" });
    fetchRituals();
  };

  if (loading) return <div className="p-8">Loading rituals...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Ritual Calendar Admin
        </h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Ritual
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ritual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newRitual.title}
                  onChange={(e) => setNewRitual({ ...newRitual, title: e.target.value })}
                  placeholder="Ritual title..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newRitual.description}
                  onChange={(e) => setNewRitual({ ...newRitual, description: e.target.value })}
                  placeholder="Ritual description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={newRitual.ritual_type}
                    onValueChange={(value) => setNewRitual({ ...newRitual, ritual_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meditation">Meditation</SelectItem>
                      <SelectItem value="ceremony">Ceremony</SelectItem>
                      <SelectItem value="sabbat">Sabbat</SelectItem>
                      <SelectItem value="esbat">Esbat</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Scheduled Date</label>
                  <Input
                    type="datetime-local"
                    value={newRitual.scheduled_date}
                    onChange={(e) => setNewRitual({ ...newRitual, scheduled_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={newRitual.location}
                  onChange={(e) => setNewRitual({ ...newRitual, location: e.target.value })}
                  placeholder="Location..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newRitual.is_public}
                  onChange={(e) => setNewRitual({ ...newRitual, is_public: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium">Public Event</label>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Ritual</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {rituals.map((ritual) => (
          <Card key={ritual.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{ritual.title}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{ritual.ritual_type}</Badge>
                    <Badge variant={ritual.is_public ? "default" : "secondary"}>
                      {ritual.is_public ? "Public" : "Private"}
                    </Badge>
                    <Badge variant="outline">
                      {new Date(ritual.scheduled_date).toLocaleDateString()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    By: @{ritual.profiles?.username || "Unknown"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(ritual.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingRitual === ritual.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={editState[ritual.id]?.title || ""}
                      onChange={(e) => setEditState({
                        ...editState,
                        [ritual.id]: { ...editState[ritual.id], title: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={editState[ritual.id]?.description || ""}
                      onChange={(e) => setEditState({
                        ...editState,
                        [ritual.id]: { ...editState[ritual.id], description: e.target.value }
                      })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select
                        value={editState[ritual.id]?.ritual_type || "meditation"}
                        onValueChange={(value) => setEditState({
                          ...editState,
                          [ritual.id]: { ...editState[ritual.id], ritual_type: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meditation">Meditation</SelectItem>
                          <SelectItem value="ceremony">Ceremony</SelectItem>
                          <SelectItem value="sabbat">Sabbat</SelectItem>
                          <SelectItem value="esbat">Esbat</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Scheduled Date</label>
                      <Input
                        type="datetime-local"
                        value={editState[ritual.id]?.scheduled_date || ""}
                        onChange={(e) => setEditState({
                          ...editState,
                          [ritual.id]: { ...editState[ritual.id], scheduled_date: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      value={editState[ritual.id]?.location || ""}
                      onChange={(e) => setEditState({
                        ...editState,
                        [ritual.id]: { ...editState[ritual.id], location: e.target.value }
                      })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editState[ritual.id]?.is_public || false}
                      onChange={(e) => setEditState({
                        ...editState,
                        [ritual.id]: { ...editState[ritual.id], is_public: e.target.checked }
                      })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-medium">Public Event</label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSaveEdit(ritual)}>
                      <Save className="w-4 h-4 mr-2" />Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingRitual(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="whitespace-pre-wrap mb-2">{ritual.description}</p>
                  {ritual.location && (
                    <p className="text-sm text-muted-foreground mb-2">
                      📍 {ritual.location}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(ritual)}
                  >
                    Edit Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
