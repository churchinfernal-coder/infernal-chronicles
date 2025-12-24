import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Save, Search } from "lucide-react";

export default function MyCastleAdmin() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, [searchTerm]);

  const fetchProfiles = async () => {
    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data } = await query;
    
    let filteredData = data || [];
    if (searchTerm) {
      filteredData = filteredData.filter(p => 
        p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.infernal_nickname?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filteredData) setProfiles(filteredData);
    setLoading(false);
  };

  const startEdit = (profile: any) => {
    setEditingProfile(profile.id);
    setEditState({
      ...editState,
      [profile.id]: { ...profile }
    });
  };

  const saveEdit = async (profileId: string) => {
    const state = editState[profileId];
    const { error } = await supabase
      .from("profiles")
      .update({
        username: state.username,
        infernal_nickname: state.infernal_nickname,
        bio: state.bio,
        avatar_url: state.avatar_url,
        header_image_url: state.header_image_url,
        location: state.location,
        zodiac_sign: state.zodiac_sign,
        relationship_status: state.relationship_status,
        career_focus: state.career_focus,
        mood_status: state.mood_status,
        allow_contact_requests: state.allow_contact_requests,
      })
      .eq("id", profileId);

    if (error) {
      toast({ title: "Error", variant: "destructive" });
      return;
    }
    toast({ title: "Profile updated" });
    setEditingProfile(null);
    fetchProfiles();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search by username or nickname..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={fetchProfiles}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {profiles.map((profile) => (
        <Card key={profile.id}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle>@{profile.username}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {editingProfile === profile.id ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={editState[profile.id]?.username || ""}
                    onChange={(e) => setEditState({
                      ...editState,
                      [profile.id]: { ...editState[profile.id], username: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Infernal Nickname</label>
                  <Input
                    value={editState[profile.id]?.infernal_nickname || ""}
                    onChange={(e) => setEditState({
                      ...editState,
                      [profile.id]: { ...editState[profile.id], infernal_nickname: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <Textarea
                    value={editState[profile.id]?.bio || ""}
                    onChange={(e) => setEditState({
                      ...editState,
                      [profile.id]: { ...editState[profile.id], bio: e.target.value }
                    })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Avatar URL</label>
                  <Input
                    value={editState[profile.id]?.avatar_url || ""}
                    onChange={(e) => setEditState({
                      ...editState,
                      [profile.id]: { ...editState[profile.id], avatar_url: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Header Image URL</label>
                  <Input
                    value={editState[profile.id]?.header_image_url || ""}
                    onChange={(e) => setEditState({
                      ...editState,
                      [profile.id]: { ...editState[profile.id], header_image_url: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      value={editState[profile.id]?.location || ""}
                      onChange={(e) => setEditState({
                        ...editState,
                        [profile.id]: { ...editState[profile.id], location: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Zodiac Sign</label>
                    <Input
                      value={editState[profile.id]?.zodiac_sign || ""}
                      onChange={(e) => setEditState({
                        ...editState,
                        [profile.id]: { ...editState[profile.id], zodiac_sign: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Relationship Status</label>
                    <Input
                      value={editState[profile.id]?.relationship_status || ""}
                      onChange={(e) => setEditState({
                        ...editState,
                        [profile.id]: { ...editState[profile.id], relationship_status: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Career Focus</label>
                    <Input
                      value={editState[profile.id]?.career_focus || ""}
                      onChange={(e) => setEditState({
                        ...editState,
                        [profile.id]: { ...editState[profile.id], career_focus: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Mood Status</label>
                  <Input
                    value={editState[profile.id]?.mood_status || ""}
                    onChange={(e) => setEditState({
                      ...editState,
                      [profile.id]: { ...editState[profile.id], mood_status: e.target.value }
                    })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveEdit(profile.id)}>
                    <Save className="w-4 h-4 mr-2" />Save All Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingProfile(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="space-y-2 text-sm">
                  <p><strong>Infernal Nickname:</strong> {profile.infernal_nickname || "N/A"}</p>
                  <p><strong>Bio:</strong> {profile.bio || "N/A"}</p>
                  <p><strong>Location:</strong> {profile.location || "N/A"}</p>
                  <p><strong>Zodiac:</strong> {profile.zodiac_sign || "N/A"}</p>
                  <p><strong>Mood:</strong> {profile.mood_status || "N/A"}</p>
                </div>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => startEdit(profile)}>
                  Edit Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
