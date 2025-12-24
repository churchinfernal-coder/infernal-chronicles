import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  generateKeyPair,
  exportKeyPair,
  storePrivateKey,
  hasEncryptionKeys,
  retrievePrivateKey,
  importPrivateKey,
} from "@/lib/encryption";

export function EncryptionSetup() {
  const [isSetup, setIsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkEncryptionStatus();
  }, []);

  const checkEncryptionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has keys in database
      const { data: keyData } = await supabase
        .from("user_encryption_keys")
        .select("public_key")
        .eq("user_id", user.id)
        .maybeSingle();

      // Check if user has private key stored locally
      const hasLocalKey = hasEncryptionKeys();

      setIsSetup(!!keyData && hasLocalKey);
    } catch (error: any) {
      console.error("Error checking encryption status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const setupEncryption = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Generate new key pair
      const keyPair = await generateKeyPair();
      const exportedKeys = await exportKeyPair(keyPair);

      // Store private key locally
      storePrivateKey(exportedKeys.privateKey);

      // Store public key in database
      const { error } = await supabase
        .from("user_encryption_keys")
        .upsert({
          user_id: user.id,
          public_key: exportedKeys.publicKey,
        });

      if (error) throw error;

      setIsSetup(true);
      toast.success("End-to-end encryption enabled! Your messages are now secure.");
    } catch (error: any) {
      console.error("Error setting up encryption:", error);
      toast.error("Failed to set up encryption: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testDecryption = async () => {
    try {
      const privateKeyStr = retrievePrivateKey();
      if (!privateKeyStr) {
        toast.error("No private key found");
        return;
      }

      await importPrivateKey(privateKeyStr);
      toast.success("Encryption keys are working correctly!");
    } catch (error: any) {
      console.error("Error testing decryption:", error);
      toast.error("Error with encryption keys: " + error.message);
    }
  };

  if (isChecking) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (isSetup) {
    return (
      <Alert className="bg-green-500/10 border-green-500/20">
        <Shield className="h-4 w-4 text-green-500" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-green-500">End-to-end encryption is enabled</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={testDecryption}
          >
            Test Keys
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Enable End-to-End Encryption
        </CardTitle>
        <CardDescription>
          Secure your messages with end-to-end encryption. Only you and your conversation partner can read the messages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Important:</strong> Your encryption keys will be generated and stored securely. 
              Keep your device secure - if you lose your keys, encrypted messages cannot be recovered.
            </AlertDescription>
          </Alert>
          <Button
            onClick={setupEncryption}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up encryption...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Enable Encryption
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
