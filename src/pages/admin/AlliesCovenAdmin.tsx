import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, UserX, Users } from "lucide-react";

export default function AlliesCovenAdmin() {
  const [friendships, setFriendships] = useState<any[]>([]);
  const [covens, setCovens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [friendshipsRes, covensRes] = await Promise.all([
      supabase.from("friendships").select(`
        *,
        profiles!friendships_user_id_fkey(username),
        friend_profiles:profiles!friendships_friend_id_fkey(username)
      `).order("created_at", { ascending: false }),
      supabase.from("covens").select(`
        *,
        profiles(username),
        coven_members(count)
      `).order("created_at", { ascending: false })
    ]);

    if (friendshipsRes.data) setFriendships(friendshipsRes.data);
    if (covensRes.data) setCovens(covensRes.data);
    setLoading(false);
  };

  const deleteFriendship = async (id: string) => {
    if (!confirm("Delete this friendship?")) return;
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      return;
    }
    toast({ title: "Friendship deleted" });
    fetchData();
  };

  const updateFriendshipStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("friendships").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      return;
    }
    toast({ title: "Status updated" });
    fetchData();
  };

  const deleteCoven = async (id: string) => {
    if (!confirm("Delete this coven?")) return;
    const { error } = await supabase.from("covens").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      return;
    }
    toast({ title: "Coven deleted" });
    fetchData();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friendships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {friendships.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <div className="font-medium">
                  {(f.profiles as any)?.username} → {(f.friend_profiles as any)?.username}
                </div>
                <Badge variant="outline">{f.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateFriendshipStatus(f.id, "accepted")}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateFriendshipStatus(f.id, "pending")}>
                  Pending
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteFriendship(f.id)}>
                  <UserX className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Covens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {covens.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted-foreground">
                  Created by: {(c.profiles as any)?.username} | 
                  Members: {(c.coven_members as any)?.[0]?.count || 0}
                </div>
                {c.is_private && <Badge>Private</Badge>}
              </div>
              <Button size="sm" variant="destructive" onClick={() => deleteCoven(c.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
