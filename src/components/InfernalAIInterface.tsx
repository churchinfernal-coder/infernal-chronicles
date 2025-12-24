import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame, Zap, Brain, Settings, MessageSquare, Sparkles, Lock, Crown, Clock, Image } from "lucide-react";
import { Link } from "react-router-dom";

const InfernalAIInterface = () => {
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2048]);
  const [topP, setTopP] = useState([0.9]);
  const [streaming, setStreaming] = useState(true);
  const [contextWindow, setContextWindow] = useState(true);
  const [autoComplete, setAutoComplete] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [userRole] = useState("acolyte");

  const handleMutation = () => {
    setIsMutating(true);
    setTimeout(() => setIsMutating(false), 800);
  };

  const roleConfig = {
    acolyte: { label: "Acolyte", color: "text-muted-foreground" },
    infernal: { label: "Infernal Tier", color: "text-gold" },
    superadmin: { label: "Superadmin", color: "text-primary" },
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        {/* Animated background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-12 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Flame className="h-12 w-12 text-primary animate-glow" />
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                    INFERNAL AI
                  </h1>
                  <p className="text-muted-foreground">Advanced Neural Interface</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`border-2 px-4 py-2 ${roleConfig[userRole].color}`}>
                  <Crown className="h-4 w-4 mr-2" />
                  {roleConfig[userRole].label}
                </Badge>
                {userRole === "acolyte" && (
                  <Button 
                    className="bg-gradient-to-r from-gold to-premium hover:shadow-gold transition-all"
                    style={{ backgroundSize: "200% auto" }}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                )}
                <Badge variant="outline" className="border-primary text-primary px-4 py-2">
                  <Zap className="h-4 w-4 mr-2" />
                  ONLINE
                </Badge>
                <Link to="/palace">
                  <Button variant="outline" className="border-gold/50 hover:bg-gold/10 hover:border-gold transition-all">
                    <Image className="h-4 w-4 mr-2" />
                    Picture Palace
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chat Area */}
            <div className="lg:col-span-2 space-y-6">
              <Card className={`p-6 border-primary/20 bg-card/50 backdrop-blur-sm shadow-crimson animate-slide-up ${isMutating ? 'animate-mutation-pulse border-primary' : ''}`}>
                <Tabs defaultValue="chat" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
                    <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col gap-1">
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-xs">Whisper to the Engine</span>
                    </TabsTrigger>
                    <TabsTrigger value="generate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col gap-1">
                      <Sparkles className="h-5 w-5" />
                      <span className="text-xs">Summon Archetype</span>
                    </TabsTrigger>
                    <TabsTrigger value="analyze" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col gap-1">
                      <Brain className="h-5 w-5" />
                      <span className="text-xs">Dissect Mutation</span>
                    </TabsTrigger>
                  </TabsList>
                  {/* ...existing code for TabsContent... */}
                </Tabs>
              </Card>
            </div>
            {/* ...existing code for Settings Panel and Stats Card... */}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default InfernalAIInterface;
