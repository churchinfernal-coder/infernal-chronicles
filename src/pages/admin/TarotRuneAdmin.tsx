import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Trash2, RefreshCw, Sparkles } from "lucide-react";

export default function TarotRuneAdmin() {
  const [tarotSessions, setTarotSessions] = useState<any[]>([]);
  const [runeCastings, setRuneCastings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [tarotRes, runeRes] = await Promise.all([
      supabase
        .from("tarot_sessions")
        .select("*, profiles(username)")
        .order("started_at", { ascending: false })
        .limit(50),
      supabase
        .from("rune_castings")
        .select("*, profiles(username)")
        .order("started_at", { ascending: false })
        .limit(50)
    ]);

    if (tarotRes.data) setTarotSessions(tarotRes.data);
    if (runeRes.data) setRuneCastings(runeRes.data);
    setLoading(false);
  };

  const deleteTarotSession = async (sessionId: string) => {
    if (!confirm("Delete this tarot session?")) return;

    const { error } = await supabase
      .from("tarot_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      toast.error("Failed to delete session");
      return;
    }

    toast.success("Tarot session deleted");
    fetchData();
  };

  const deleteRuneCasting = async (castingId: string) => {
    if (!confirm("Delete this rune casting?")) return;

    const { error } = await supabase
      .from("rune_castings")
      .delete()
      .eq("id", castingId);

    if (error) {
      toast.error("Failed to delete casting");
      return;
    }

    toast.success("Rune casting deleted");
    fetchData();
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
              <Sparkles className="h-5 w-5" />
              Tarot & Rune Management
            </CardTitle>
            <CardDescription>
              View and manage tarot sessions and rune castings
            </CardDescription>
          </div>
          <Button size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tarot">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tarot">
              Tarot Sessions ({tarotSessions.length})
            </TabsTrigger>
            <TabsTrigger value="runes">
              Rune Castings ({runeCastings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tarot" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Spread Type</TableHead>
                  <TableHead>Spirit Tone</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarotSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {(session.profiles as any)?.username || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{session.spread_type || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{session.spirit_tone || "neutral"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(session.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {session.completed_at ? (
                        <Badge variant="default">Completed</Badge>
                      ) : (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTarotSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {tarotSessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No tarot sessions found
              </div>
            )}
          </TabsContent>

          <TabsContent value="runes" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Spread Type</TableHead>
                  <TableHead>Spirit Tone</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runeCastings.map((casting) => (
                  <TableRow key={casting.id}>
                    <TableCell className="font-medium">
                      {(casting.profiles as any)?.username || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{casting.spread_type || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{casting.spirit_tone || "neutral"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(casting.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {casting.completed_at ? (
                        <Badge variant="default">Completed</Badge>
                      ) : (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteRuneCasting(casting.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {runeCastings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No rune castings found
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
