import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function PremiumTokenGenerator() {
  const [tokens, setTokens] = useState<string[]>([]);
  const [newToken, setNewToken] = useState("");

  const generateToken = () => {
    if (!newToken) return toast.error("Token required");
    setTokens([...tokens, newToken]);
    setNewToken("");
    toast.success("Token generated");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Premium Token Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Enter token value"
          value={newToken}
          onChange={e => setNewToken(e.target.value)}
        />
        <Button onClick={generateToken}>Generate Token</Button>
        <ul>
          {tokens.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
