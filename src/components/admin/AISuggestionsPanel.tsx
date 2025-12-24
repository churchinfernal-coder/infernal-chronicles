import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Sparkles, 
  Palette, 
  Type, 
  Layout, 
  TrendingUp, 
  Eye, 
  Shield,
  Loader2
} from "lucide-react";

interface AISuggestionsPanelProps {
  canvasContext?: any;
  onApplySuggestion?: (suggestion: any) => void;
  onApplyFilterValues?: (filters: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
    blur?: number;
    sepia?: number;
    temperature?: number;
    tint?: number;
  }) => void;
}

export const AISuggestionsPanel = ({ canvasContext, onApplySuggestion, onApplyFilterValues }: AISuggestionsPanelProps) => {
  const [suggestions, setSuggestions] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('layout');
  const [parsedFilters, setParsedFilters] = useState<any>(null);

  const getSuggestions = async (type: string) => {
    setLoading(true);
    try {
      const context = {
        canvasSize: canvasContext?.canvasSize || { width: 800, height: 600 },
        objectCount: canvasContext?.objects?.length || 0,
        hasText: canvasContext?.objects?.some((obj: any) => obj.type === 'text') || false,
        hasImages: canvasContext?.objects?.some((obj: any) => obj.type === 'image') || false,
        colors: canvasContext?.colors || []
      };

      const { data, error } = await supabase.functions.invoke('ai-design-suggestions', {
        body: { type, context }
      });

      if (error) throw error;

      setSuggestions(data.suggestions);
      
      // Parse suggestions for filter values
      if (type === 'color-palette' || type === 'enhancement') {
        try {
          // Extract numeric values from AI suggestions
          const filterValues: any = {};
          const brightMatch = data.suggestions.match(/brightness[:\s]+(-?\d+)/i);
          const contrastMatch = data.suggestions.match(/contrast[:\s]+(-?\d+)/i);
          const saturationMatch = data.suggestions.match(/saturation[:\s]+(-?\d+)/i);
          const hueMatch = data.suggestions.match(/hue[:\s]+(-?\d+)/i);
          const tempMatch = data.suggestions.match(/temperature[:\s]+(-?\d+)/i);
          
          if (brightMatch) filterValues.brightness = parseInt(brightMatch[1]);
          if (contrastMatch) filterValues.contrast = parseInt(contrastMatch[1]);
          if (saturationMatch) filterValues.saturation = parseInt(saturationMatch[1]);
          if (hueMatch) filterValues.hue = parseInt(hueMatch[1]);
          if (tempMatch) filterValues.temperature = parseInt(tempMatch[1]);
          
          if (Object.keys(filterValues).length > 0) {
            setParsedFilters(filterValues);
          }
        } catch (e) {
          console.error('Error parsing filter values:', e);
        }
      }
      
      toast.success('AI suggestions generated!');
    } catch (error: any) {
      console.error('Error getting AI suggestions:', error);
      toast.error(error.message || 'Failed to get AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const applyParsedFilters = () => {
    if (parsedFilters && onApplyFilterValues) {
      onApplyFilterValues(parsedFilters);
      toast.success('Filter values applied to sliders!');
    } else {
      toast.error('No filter values to apply');
    }
  };

  const suggestionTypes = [
    { 
      id: 'layout', 
      label: 'Layout', 
      icon: Layout,
      description: 'Smart layout recommendations'
    },
    { 
      id: 'color-palette', 
      label: 'Colors', 
      icon: Palette,
      description: 'Harmonious color palettes'
    },
    { 
      id: 'typography', 
      label: 'Typography', 
      icon: Type,
      description: 'Font pairing suggestions'
    },
    { 
      id: 'trend-analysis', 
      label: 'Trends', 
      icon: TrendingUp,
      description: 'Current design trends'
    },
    { 
      id: 'accessibility', 
      label: 'Accessibility', 
      icon: Eye,
      description: 'WCAG compliance check'
    },
    { 
      id: 'brand-consistency', 
      label: 'Brand', 
      icon: Shield,
      description: 'Brand consistency check'
    }
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Design Intelligence
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 gap-1 bg-muted/50">
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="color-palette">Colors</TabsTrigger>
            <TabsTrigger value="typography">Type</TabsTrigger>
          </TabsList>
          <TabsList className="grid grid-cols-3 gap-1 bg-muted/50 mt-2">
            <TabsTrigger value="trend-analysis">Trends</TabsTrigger>
            <TabsTrigger value="accessibility">A11y</TabsTrigger>
            <TabsTrigger value="brand-consistency">Brand</TabsTrigger>
          </TabsList>

          {suggestionTypes.map(({ id, label, icon: Icon, description }) => (
            <TabsContent key={id} value={id} className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{label}</h3>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                <Button
                  onClick={() => getSuggestions(id)}
                  disabled={loading}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Suggestions
                    </>
                  )}
                </Button>
              </div>

              {suggestions && (
                <>
                  <ScrollArea className="h-[250px] rounded-md border border-border bg-background/50 p-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-xs text-foreground">
                        {suggestions}
                      </pre>
                    </div>
                  </ScrollArea>
                  
                  {parsedFilters && (
                    <div className="mt-3 p-3 bg-primary/10 rounded-md border border-primary/20">
                      <p className="text-xs font-medium mb-2 text-foreground">Auto-detected filter values:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-3">
                        {Object.entries(parsedFilters).map(([key, value]) => (
                          <div key={key}>
                            <span className="capitalize">{key}</span>: <span className="font-semibold text-primary">{value as number}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        onClick={applyParsedFilters}
                        size="sm"
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        Apply to Sliders
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
