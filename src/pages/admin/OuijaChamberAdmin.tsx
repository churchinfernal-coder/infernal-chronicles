import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Download, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface OuijaResponse {
  id: string;
  response_text: string;
  category: string;
  tone: string;
  tags: string[];
  rarity: string;
  spirit_persona: string | null;
  approved: boolean;
  use_count: number;
  average_rating: number;
  source: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

interface SessionItem {
  id: string;
  created_at: string;
  is_ai_generated: boolean;
  spirit_type: string;
  question: string;
  response_text: string;
  mood_rating: number | null;
  created_by: string | null;
  created_by_username?: string;
}

const OuijaChamberAdmin = () => {
  const [responses, setResponses] = useState<OuijaResponse[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [newResponse, setNewResponse] = useState({
    response_text: '',
    category: 'Prophecy',
    tone: 'cryptic',
    tags: '',
    rarity: 'common',
    spirit_persona: '',
    source: 'Manual',
    approved: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchResponses();
    fetchSessions();
  }, []);

  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('ouija_responses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching responses:', error);
      return;
    }

    setResponses(data || []);
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('ouija_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    const sessionRows = (data || []) as SessionItem[];
    const userIds = Array.from(new Set(sessionRows.map((s) => s.created_by).filter(Boolean))) as string[];

    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      if (profileError) {
        console.warn('Error fetching session usernames:', profileError);
      } else {
        profileMap = Object.fromEntries((profileRows || []).map((p: any) => [p.user_id, p.username]));
      }
    }

    setSessions(
      sessionRows.map((session) => ({
        ...session,
        created_by_username: session.created_by ? profileMap[session.created_by] || 'Unknown' : 'Unknown',
      }))
    );
  };

  const addResponse = async () => {
    const { error } = await supabase
      .from('ouija_responses')
      .insert({
        ...newResponse,
        tags: newResponse.tags.split(',').map(t => t.trim()).filter(t => t)
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Response added" });
    setNewResponse({
      response_text: '',
      category: 'Prophecy',
      tone: 'cryptic',
      tags: '',
      rarity: 'common',
      spirit_persona: '',
      source: 'Manual',
      approved: true
    });
    fetchResponses();
  };

  const deleteResponse = async (id: string) => {
    if (!confirm('Delete this response?')) return;

    const { error } = await supabase
      .from('ouija_responses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Response deleted" });
    fetchResponses();
  };

  const exportResponses = () => {
    const json = JSON.stringify(responses, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ouija-responses-${Date.now()}.json`;
    a.click();
  };

  const importResponses = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const imported = JSON.parse(text);

    for (const resp of imported) {
      await supabase.from('ouija_responses').insert(resp);
    }

    toast({ title: "Success", description: `Imported ${imported.length} responses` });
    fetchResponses();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Ouija Chamber Control
          </h1>
          <p className="text-muted-foreground">Manage spirit responses and session logs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportResponses} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <label>
              <Upload className="mr-2 h-4 w-4" />
              Import
              <input type="file" accept=".json" className="hidden" onChange={importResponses} />
            </label>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="responses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="responses">Response Library</TabsTrigger>
          <TabsTrigger value="add">Add Response</TabsTrigger>
          <TabsTrigger value="sessions">Session Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-4">
          {responses.map((resp) => (
            <Card key={resp.id} className="border-primary/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{resp.response_text}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{resp.category}</Badge>
                      <Badge variant="outline">{resp.tone}</Badge>
                      <Badge variant={resp.rarity === 'cursed' ? 'destructive' : 'secondary'}>
                        {resp.rarity}
                      </Badge>
                      {resp.source === 'AI' && !resp.approved && <Badge variant="destructive">Pending Approval</Badge>}
                      {resp.approved && <Badge variant="default">Approved</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteResponse(resp.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {resp.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                {resp.spirit_persona && (
                  <p className="text-sm text-muted-foreground mt-2">Spirit: {resp.spirit_persona}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Add New Response</CardTitle>
              <CardDescription>Expand the spirit response library</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Response Text</Label>
                <Textarea
                  value={newResponse.response_text}
                  onChange={(e) => setNewResponse({ ...newResponse, response_text: e.target.value })}
                  placeholder="The spirits whisper..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newResponse.category} onValueChange={(v) => setNewResponse({ ...newResponse, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prophecy">Prophecy</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="love">Love</SelectItem>
                      <SelectItem value="death">Death</SelectItem>
                      <SelectItem value="ritual">Ritual</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                      <SelectItem value="future">Future</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tone</Label>
                  <Select value={newResponse.tone} onValueChange={(v) => setNewResponse({ ...newResponse, tone: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cryptic">Cryptic</SelectItem>
                      <SelectItem value="poetic">Poetic</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="hostile">Hostile</SelectItem>
                      <SelectItem value="divine">Divine</SelectItem>
                      <SelectItem value="infernal">Infernal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={newResponse.tags}
                  onChange={(e) => setNewResponse({ ...newResponse, tags: e.target.value })}
                  placeholder="fire, prophecy, danger"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rarity</Label>
                  <Select value={newResponse.rarity} onValueChange={(v) => setNewResponse({ ...newResponse, rarity: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                      <SelectItem value="cursed">Cursed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Spirit Persona</Label>
                  <Input
                    value={newResponse.spirit_persona}
                    onChange={(e) => setNewResponse({ ...newResponse, spirit_persona: e.target.value })}
                    placeholder="The Whisperer, Duke Vassago..."
                  />
                </div>
              </div>

              <Button onClick={addResponse} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Response
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="border-primary/20">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">{session.created_by_username || 'Unknown'}</CardTitle>
                    <CardDescription>{new Date(session.created_at).toLocaleString()}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={session.is_ai_generated ? 'default' : 'secondary'}>
                      {session.is_ai_generated ? 'AI' : 'Library'}
                    </Badge>
                    <Badge variant="outline">{session.spirit_type}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm"><strong>Q:</strong> {session.question}</p>
                <p className="text-sm text-muted-foreground"><strong>A:</strong> {session.response_text}</p>
                {session.mood_rating && (
                  <p className="text-xs text-muted-foreground">Rating: {session.mood_rating}/5</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OuijaChamberAdmin;
