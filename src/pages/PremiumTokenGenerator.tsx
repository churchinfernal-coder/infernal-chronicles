import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Shield, Key, Copy, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function PremiumTokenGenerator() {
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Verify superadmin access on mount
  useState(() => {
    verifyAccess();
  });

  const verifyAccess = async () => {
    setVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAuthorized(false);
        return;
      }

      const { data: roleData } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "superadmin")
        .single();

      setIsAuthorized(!! roleData);
    } catch (error) {
      console.error("Authorization check failed:", error);
      setIsAuthorized(false);
    } finally {
      setVerifying(false);
    }
  };

  const generateToken = async () => {
    if (!userId. trim()) {
      toast.error("Please enter a user ID");
      return;
    }

    setLoading(true);
    setToken("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated.  Please sign in.");
      }

      // Verify superadmin role
      const { data: roleData, error: roleError } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "superadmin")
        .single();

      if (roleError || !roleData) {
        throw new Error("Superadmin access required.  Unauthorized.");
      }

      // Check if target user exists
      const { data: targetUser, error: userError } = await (supabase as any)
        .from("profiles")
        .select("user_id, username")
        .eq("user_id", userId)
        .single();

      if (userError || !targetUser) {
        throw new Error("Target user not found. Please check the user ID.");
      }

      // Generate premium token via RPC
      const { data:  tokenData, error: tokenError } = await (supabase as any)
        .rpc("generate_premium_token", { 
          target_user_id:  userId. trim() 
        });

      if (tokenError) {
        throw new Error(tokenError.message || "Failed to generate token");
      }

      if (!tokenData || !tokenData.token) {
        throw new Error("Token generation failed - no token returned");
      }

      setToken(tokenData.token);
      
      toast.success("Premium Token Generated!", {
        description: `Token created for user: ${targetUser.username || userId}`,
        duration: 5000,
      });

    } catch (err: any) {
      console.error("Token generation error:", err);
      toast.error("Token Generation Failed", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      toast.success("Token copied to clipboard!");
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unauthorized state
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <CardTitle className="text-destructive">Access Denied</CardTitle>
            </div>
            <CardDescription>
              Superadmin privileges required to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <Shield className="w-4 h-4" />
              <AlertDescription>
                You do not have permission to generate premium tokens.  This action requires superadmin role.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-primary/20">
        <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Premium Token Generator</CardTitle>
              <CardDescription className="text-base">
                Superadmin tool to grant premium access to users
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Info Banner */}
          <Alert className="border-primary/30 bg-primary/5">
            <Key className="w-4 h-4 text-primary" />
            <AlertDescription>
              Premium tokens grant users unlimited access to mystical features including tarot readings, rune casting, and ouija sessions. 
            </AlertDescription>
          </Alert>

          {/* User ID Input */}
          <div className="space-y-3">
            <Label htmlFor="userId" className="text-base font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Target User ID
            </Label>
            <Input
              id="userId"
              placeholder="Enter user UUID (e.g., 7c78d569-6125-4b63-879a-f6805599161d)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="h-12 font-mono text-sm bg-background border-primary/30 focus:border-primary"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter the UUID of the user you want to grant premium access to
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateToken}
            disabled={loading || ! userId.trim()}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Token... 
              </>
            ) : (
              <>
                <Key className="mr-2 h-5 w-5" />
                Generate Premium Token
              </>
            )}
          </Button>

          {/* Token Display */}
          {token && (
            <div className="space-y-3 animate-in fade-in-50 slide-in-from-top-2 duration-500">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Generated Token
                </Label>
                <Button
                  onClick={copyToken}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>

              <div className="relative">
                <div className="p-4 bg-black border-2 border-green-500/30 rounded-lg shadow-lg shadow-green-500/10">
                  <code className="text-green-400 font-mono text-sm break-all block">
                    {token}
                  </code>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>

              <Alert className="border-green-500/30 bg-green-500/5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Token successfully generated! Share this token with the user to activate their premium access.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}