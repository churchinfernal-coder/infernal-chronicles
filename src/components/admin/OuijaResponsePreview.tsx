import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useOuijaAI } from '@/hooks/useOuijaAI';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const OuijaResponsePreview = () => {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [testQuestion, setTestQuestion] = useState('What does my future hold?');
  const [testTone, setTestTone] = useState('cryptic');
  const [testCategory, setTestCategory] = useState('Prophecy');
  const [testSpirit, setTestSpirit] = useState('');
  const { generateResponse, isGenerating, lastResponse } = useOuijaAI();

  useEffect(() => {
    generatePreviewDataset();
  }, []);

  const generatePreviewDataset = async () => {
    const sampleQuestions = [
      { q: "Will I find love?", tone: "poetic", cat: "Love", spirit: "Astaroth" },
      { q: "What awaits me in the shadows?", tone: "hostile", cat: "Warning", spirit: "Belial" },
      { q: "Show me my destiny", tone: "divine", cat: "Prophecy", spirit: "Vassago" },
      { q: "Is death near?", tone: "cryptic", cat: "Death", spirit: "" },
      { q: "What ritual must I perform?", tone: "infernal", cat: "Ritual", spirit: "Paimon" }
    ];

    const previews = [];
    for (const sample of sampleQuestions) {
      const response = await generateResponse({
        question: sample.q,
        tone: sample.tone,
        category: sample.cat,
        spirit_persona: sample.spirit
      });
      if (response) {
        previews.push({
          question: sample.q,
          ...response
        });
      }
    }
    setPreviewData(previews);
  };

  const testGeneration = async () => {
    const response = await generateResponse({
      question: testQuestion,
      tone: testTone,
      category: testCategory,
      spirit_persona: testSpirit || undefined
    });
    if (response) {
      setPreviewData([{ question: testQuestion, ...response }, ...previewData]);
    }
  };

  const approveResponse = async (responseId: string) => {
    const { error } = await supabase
      .from('ouija_responses')
      .update({ approved: true })
      .eq('id', responseId);

    if (error) {
      toast.error('Failed to approve');
    } else {
      toast.success('Response approved!');
      setPreviewData(prev => prev.filter(p => p.response_id !== responseId));
    }
  };

  const rejectResponse = async (responseId: string) => {
    const { error } = await supabase
      .from('ouija_responses')
      .delete()
      .eq('id', responseId);

    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Response rejected');
      setPreviewData(prev => prev.filter(p => p.response_id !== responseId));
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Response Preview & Testing
        </CardTitle>
        <CardDescription>
          Preview AI-generated mystical responses and test the generation engine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview">
          <TabsList className="w-full">
            <TabsTrigger value="preview">Sample Responses</TabsTrigger>
            <TabsTrigger value="test">Test Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {previewData.length} responses generated
              </p>
              <Button onClick={generatePreviewDataset} variant="outline" size="sm" disabled={isGenerating}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate All
              </Button>
            </div>

            <div className="grid gap-4">
              {previewData.map((item, idx) => (
                <Card key={idx} className="border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-2">
                          "{item.question}"
                        </p>
                        <CardTitle className="text-base leading-relaxed text-primary">
                          {item.response_text}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => approveResponse(item.response_id)}>
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => rejectResponse(item.response_id)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{item.category}</Badge>
                      <Badge variant="outline">{item.tone}</Badge>
                      <Badge variant={item.rarity === 'cursed' ? 'destructive' : 'secondary'}>
                        {item.rarity}
                      </Badge>
                      {item.spirit_persona && (
                        <Badge className="bg-purple-500/20 text-purple-300">
                          {item.spirit_persona}
                        </Badge>
                      )}
                      {item.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label>Test Question</Label>
                <Input
                  value={testQuestion}
                  onChange={(e) => setTestQuestion(e.target.value)}
                  placeholder="Ask the spirits..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tone</Label>
                  <Select value={testTone} onValueChange={setTestTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cryptic">Cryptic</SelectItem>
                      <SelectItem value="poetic">Poetic</SelectItem>
                      <SelectItem value="hostile">Hostile</SelectItem>
                      <SelectItem value="divine">Divine</SelectItem>
                      <SelectItem value="infernal">Infernal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Category</Label>
                  <Select value={testCategory} onValueChange={setTestCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prophecy">Prophecy</SelectItem>
                      <SelectItem value="Warning">Warning</SelectItem>
                      <SelectItem value="Love">Love</SelectItem>
                      <SelectItem value="Death">Death</SelectItem>
                      <SelectItem value="Ritual">Ritual</SelectItem>
                      <SelectItem value="Past">Past</SelectItem>
                      <SelectItem value="Future">Future</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Spirit Persona (Optional)</Label>
                <Input
                  value={testSpirit}
                  onChange={(e) => setTestSpirit(e.target.value)}
                  placeholder="e.g., Duke Vassago, Lady Astaroth"
                />
              </div>

              <Button onClick={testGeneration} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Channeling spirits...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Response
                  </>
                )}
              </Button>

              {lastResponse && (
                <Card className="bg-primary/5 border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-primary text-base">
                      {lastResponse.response_text}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap">
                      <Badge>{lastResponse.category}</Badge>
                      <Badge>{lastResponse.tone}</Badge>
                      <Badge variant="secondary">{lastResponse.rarity}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
