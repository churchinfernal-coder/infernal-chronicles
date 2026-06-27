import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";

const FEATURE_CATEGORIES = [
  "Social",
  "Mystical",
  "Commerce",
  "System",
  "Content",
  "Analytics",
  "Security",
  "Moderation"
];

export const FeatureInstructionGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [featureName, setFeatureName] = useState("");
  const [featureCategory, setFeatureCategory] = useState("");
  const [featurePath, setFeaturePath] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");

  const handleGenerate = async () => {
    if (!featureName || !featureCategory) {
      toast({
        title: "Missing Information",
        description: "Please provide feature name and category",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'ai-generate-feature-instructions',
        {
          body: {
            feature_name: featureName,
            category: featureCategory,
            feature_path: featurePath || null,
            code_context: codeSnippet || null
          }
        }
      );

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (!data || !data.instructions) {
        throw new Error('No instructions returned from AI');
      }

      console.log('Instructions generated successfully:', data);

      toast({
        title: "Instructions Generated",
        description: `AI-powered instructions saved for "${featureName}"`,
      });

      // Reset form
      setFeatureName("");
      setFeaturePath("");
      setCodeSnippet("");
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate instructions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Instruction Generator
        </CardTitle>
        <CardDescription>
          Generate comprehensive instruction tabs for any SuperAdmin feature
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="featureName">Feature Name *</Label>
          <Input
            id="featureName"
            placeholder="e.g., User Management, Content Moderation"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="featureCategory">Category *</Label>
          <Select value={featureCategory} onValueChange={setFeatureCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {FEATURE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="featurePath">Feature Path (Optional)</Label>
          <Input
            id="featurePath"
            placeholder="e.g., /admin/users, /superadmin/moderation"
            value={featurePath}
            onChange={(e) => setFeaturePath(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="codeSnippet">Code Context (Optional)</Label>
          <Textarea
            id="codeSnippet"
            placeholder="Paste relevant code snippet to help AI understand the feature better..."
            className="min-h-[120px] font-mono text-sm"
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Instructions...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Instructions
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
