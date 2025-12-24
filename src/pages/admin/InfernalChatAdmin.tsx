import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Trash2, MessageSquare } from "lucide-react";

export default function InfernalChatAdmin() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select(`
        *,
        conversation_participants(
          user_id,
          profiles(username)
        )
      `)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (data) {
      setConversations(data);
      data.forEach(conv => fetchMessages(conv.id));
    }
    setLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("messages")
      .select(`
        *,
        profiles(username)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setMessages(prev => ({ ...prev, [conversationId]: data }));
    }
  };

  const deleteMessage = async (messageId: string, conversationId: string) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      return;
    }
    toast({ title: "Message deleted" });
    fetchMessages(conversationId);
  };

  const purgeConversation = async (conversationId: string) => {
    if (!confirm("Delete entire conversation and all messages?")) return;
    const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      return;
    }
    toast({ title: "Conversation purged" });
    fetchConversations();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {conversations.map((conv) => (
        <Card key={conv.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversation
              </CardTitle>
              <Button size="sm" variant="destructive" onClick={() => purgeConversation(conv.id)}>
                Purge All
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Participants: {conv.conversation_participants?.map((p: any) => p.profiles?.username).join(", ")}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {messages[conv.id]?.map((msg) => (
              <div key={msg.id} className="flex justify-between items-start p-3 border rounded">
                <div className="flex-1">
                  <div className="font-medium text-sm">{(msg.profiles as any)?.username}</div>
                  <div className="text-sm">{msg.content}</div>
                  {msg.media_url && <div className="text-xs text-muted-foreground">📎 Media attached</div>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteMessage(msg.id, conv.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
