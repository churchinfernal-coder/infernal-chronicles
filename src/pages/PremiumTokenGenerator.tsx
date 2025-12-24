import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function PremiumTokenGenerator() {
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const generateToken = async () => {
    setLoading(true);
    try {
      // Only superadmin can generate premium tokens
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "superadmin")
        .single();
      if (!roleData) throw new Error("Superadmin access required");

      // Generate a premium token for the specified user
      const { data, error } = await supabase.rpc("generate_premium_token", { target_user_id: userId });
      if (error) throw error;
      setToken(data?.token || "");
      toast.success("Premium token generated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-12">
      <CardHeader>
        <CardTitle>Superadmin Premium Token Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Enter user ID to grant premium access"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          className="mb-4"
        />
        <Button onClick={generateToken} loading={loading} className="bg-gold-600 text-black">
          Generate Premium Token
        </Button>
        {token && (
          <div className="mt-4 p-2 bg-black text-gold-400 rounded">Token: {token}</div>
        )}
      </CardContent>
    </Card>
  );
}
