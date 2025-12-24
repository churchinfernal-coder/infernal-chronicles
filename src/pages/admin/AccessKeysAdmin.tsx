import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AccessKeysAdmin = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [tarotKeys, setTarotKeys] = useState<any[]>([]);
  const [runeKeys, setRuneKeys] = useState<any[]>([]);
  const [ouijaTokens, setOuijaTokens] = useState<any[]>([]);

  useEffect(() => {
    fetchAllKeys();
  }, []);

  const fetchAllKeys = async () => {
    const [tarot, rune, ouija] = await Promise.all([
      supabase.from('tarot_reading_keys').select('*, profiles!tarot_reading_keys_user_id_fkey(username)').order('created_at', { ascending: false }).limit(50),
      supabase.from('rune_casting_keys').select('*, profiles!rune_casting_keys_user_id_fkey(username)').order('created_at', { ascending: false }).limit(50),
      supabase.from('ouija_tokens').select('*, profiles!ouija_tokens_user_id_fkey(username)').order('created_at', { ascending: false }).limit(50)
    ]);

    if (tarot.data) setTarotKeys(tarot.data);
    if (rune.data) setRuneKeys(rune.data);
    if (ouija.data) setOuijaTokens(ouija.data);
  };

  const generateKey = async (type: 'tarot' | 'rune' | 'ouija') => {
    if (!userId.trim()) {
      toast({ title: "Error", description: "Enter a user ID", variant: "destructive" });
      return;
    }

    setGenerating(true);
    const keyCode = `${type.toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    let error;
    if (type === 'tarot') {
      const result = await supabase
        .from('tarot_reading_keys')
        .insert({ key_code: keyCode, user_id: userId });
      error = result.error;
    } else if (type === 'rune') {
      const result = await supabase
        .from('rune_casting_keys')
        .insert({ key_code: keyCode, user_id: userId });
      error = result.error;
    } else {
      const result = await supabase
        .from('ouija_tokens')
        .insert({ token_code: keyCode, user_id: userId });
      error = result.error;
    }

    setGenerating(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${type} access key generated: ${keyCode}` });
      setUserId("");
      fetchAllKeys();
    }
  };

  const KeyTable = ({ keys, type }: { keys: any[], type: string }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Used</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => (
          <TableRow key={key.id}>
            <TableCell className="font-mono text-xs">{key.key_code || key.token_code}</TableCell>
            <TableCell>{key.profiles?.username || 'Unknown'}</TableCell>
            <TableCell>
              <span className={key.is_used ? "text-red-500" : "text-green-500"}>
                {key.is_used ? "Used" : "Available"}
              </span>
            </TableCell>
            <TableCell className="text-xs">{new Date(key.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-xs">{key.used_at ? new Date(key.used_at).toLocaleDateString() : '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Access Key Management</h1>
        <p className="text-muted-foreground">Generate and manage access keys for divination modules</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate New Access Key</CardTitle>
          <CardDescription>Create access keys for Tarot, Rune Casting, or Ouija Chamber</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="Enter user UUID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => generateKey('tarot')} disabled={generating}>
              Generate Tarot Key
            </Button>
            <Button onClick={() => generateKey('rune')} disabled={generating}>
              Generate Rune Key
            </Button>
            <Button onClick={() => generateKey('ouija')} disabled={generating}>
              Generate Ouija Token
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tarot">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tarot">Tarot Keys ({tarotKeys.length})</TabsTrigger>
          <TabsTrigger value="rune">Rune Keys ({runeKeys.length})</TabsTrigger>
          <TabsTrigger value="ouija">Ouija Tokens ({ouijaTokens.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tarot">
          <Card>
            <CardHeader>
              <CardTitle>Tarot Reading Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyTable keys={tarotKeys} type="tarot" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rune">
          <Card>
            <CardHeader>
              <CardTitle>Rune Casting Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyTable keys={runeKeys} type="rune" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ouija">
          <Card>
            <CardHeader>
              <CardTitle>Ouija Chamber Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyTable keys={ouijaTokens} type="ouija" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccessKeysAdmin;
