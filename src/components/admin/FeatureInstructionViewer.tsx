import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, ThumbsUp, ThumbsDown, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Instruction {
  id: string;
  feature_name: string;
  category: string;
  feature_path: string | null;
  instructions: string;
  created_at: string;
}

interface ParsedInstructions {
  overview?: string;
  steps?: string[];
  parameters?: Array<{ name: string; description: string; type: string; required: boolean }>;
  bestPractices?: string[];
  commonIssues?: Array<{ issue: string; solution: string }>;
  examples?: Array<{ title: string; description: string; code?: string }>;
  relatedFeatures?: string[];
  keywords?: string[];
}

export const FeatureInstructionViewer = () => {
  const { toast } = useToast();
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [filteredInstructions, setFilteredInstructions] = useState<Instruction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null);
  const [parsedContent, setParsedContent] = useState<ParsedInstructions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstructions();
  }, []);

  useEffect(() => {
    filterInstructions();
  }, [searchQuery, instructions]);

  useEffect(() => {
    if (selectedInstruction) {
      try {
        const parsed = JSON.parse(selectedInstruction.instructions);
        setParsedContent(parsed);
      } catch {
        setParsedContent({ overview: selectedInstruction.instructions });
      }
    }
  }, [selectedInstruction]);

  const loadInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_instructions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setInstructions(data || []);
      if (data && data.length > 0) {
        setSelectedInstruction(data[0]);
      }
    } catch (error: any) {
      console.error('Error loading instructions:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterInstructions = () => {
    if (!searchQuery) {
      setFilteredInstructions(instructions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = instructions.filter(inst =>
      inst.feature_name.toLowerCase().includes(query) ||
      inst.category.toLowerCase().includes(query) ||
      (inst.feature_path?.toLowerCase().includes(query))
    );
    setFilteredInstructions(filtered);
  };

  const submitFeedback = async (helpful: boolean) => {
    if (!selectedInstruction) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please log in to submit feedback",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('instruction_feedback')
        .insert({
          instruction_id: selectedInstruction.id,
          user_id: user.id,
          helpful
        });

      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you!",
      });
    } catch (error: any) {
      console.error('Feedback error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Instructions
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredInstructions.map((inst) => (
              <div
                key={inst.id}
                className={`p-4 cursor-pointer border-b hover:bg-accent transition-colors ${
                  selectedInstruction?.id === inst.id ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedInstruction(inst)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{inst.feature_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{inst.feature_path}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {inst.category}
                  </Badge>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        {selectedInstruction ? (
          <>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedInstruction.feature_name}</CardTitle>
                  <CardDescription className="mt-2">
                    {selectedInstruction.feature_path}
                  </CardDescription>
                </div>
                <Badge>{selectedInstruction.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="steps">Steps</TabsTrigger>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Overview</h3>
                    <p className="text-sm text-muted-foreground">
                      {parsedContent.overview || 'No overview available'}
                    </p>
                  </div>

                  {parsedContent.bestPractices && parsedContent.bestPractices.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Best Practices</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {parsedContent.bestPractices.map((practice, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{practice}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="steps">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Steps</h3>
                    <ol className="list-decimal list-inside space-y-2">
                      {parsedContent.steps?.map((step, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{step}</li>
                      )) || <li className="text-sm text-muted-foreground">No steps available</li>}
                    </ol>
                  </div>
                </TabsContent>

                <TabsContent value="parameters">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Parameters</h3>
                    {parsedContent.parameters?.map((param, i) => (
                      <div key={i} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {param.name}
                          </code>
                          <Badge variant="outline" className="text-xs">{param.type}</Badge>
                          {param.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{param.description}</p>
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No parameters available</p>}
                  </div>
                </TabsContent>

                <TabsContent value="examples">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Examples</h3>
                    {parsedContent.examples?.map((example, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-1">{example.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{example.description}</p>
                        {example.code && (
                          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                            <code>{example.code}</code>
                          </pre>
                        )}
                      </div>
                    )) || <p className="text-sm text-muted-foreground">No examples available</p>}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Was this helpful?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => submitFeedback(true)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Yes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => submitFeedback(false)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    No
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full p-8 text-muted-foreground">
            Select a feature
          </div>
        )}
      </Card>
    </div>
  );
};