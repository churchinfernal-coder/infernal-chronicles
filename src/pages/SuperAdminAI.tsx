import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Brain,
  Code2,
  Rocket,
  Shield,
  TrendingUp,
  ArrowLeft,
  Play,
  Lightbulb,
  Map,
  FileText,
  Send,
  Eye,
  Loader2,
  CircleDashed
} from "lucide-react";
import { toast } from "sonner";
import { AIApprovalDialog } from "@/components/admin/AIApprovalDialog";
import { useAIEngine } from "@/hooks/useAIEngine";

export default function SuperAdminAI() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [errors, setErrors] = useState<any[]>([]);
  const [fixes, setFixes] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [systemMap, setSystemMap] = useState<any>(null);
  const [selectedError, setSelectedError] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedModification, setSelectedModification] = useState<any>(null);
  const [deploying, setDeploying] = useState(false);

  const aiEngine = useAIEngine();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const isAdmin = adminRole?.role === 'admin' || adminRole?.role === 'super_admin'; // Handle both admin and super_admin

      setHasAccess(isAdmin);

      if (isAdmin) {
        await loadAllData();
      } else {
        toast.error('Access Denied: You do not have the required permissions.');
        navigate('/admin'); // Redirect to a general admin page if no super access
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
      toast.error('Failed to verify access.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [
        errorsResult,
        fixesResult,
        instructionsResult,
        deploysResult,
        feedbackResult
      ] = await Promise.all([
        aiEngine.scanErrors(),
        aiEngine.getAllFixes(),
        aiEngine.getAllInstructions(),
        aiEngine.getAllDeployments(),
        aiEngine.getAllFeedback()
      ]);

      console.log('Loaded data:', {
        errors: errorsResult.data?.length || 0,
        fixes: fixesResult.data?.length || 0,
        instructions: instructionsResult.data?.length || 0,
        deployments: deploysResult.data?.length || 0,
        feedback: feedbackResult.data?.length || 0
      });

      setErrors(errorsResult.data || []);
      setFixes(fixesResult.data || []);
      setInstructions(instructionsResult.data || []);
      setDeployments(deploysResult.data || []);
      setFeedback(feedbackResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load AI engine data');
    }
  };

  const handleAnalyzeError = async (errorLog: any) => {
    if (!confirm('This action will use AI credits (analysis). Proceed?')) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-error-analyzer', {
        body: { errorLog }
      });

      if (error) throw error;

      toast.success('AI analysis complete');
      await loadAllData();
      setSelectedError(data.analysis);
    } catch (error) {
      console.error('Error analyzing:', error);
      toast.error('AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePreviewFix = (modification: any) => {
    setSelectedModification(modification);
    setApprovalDialogOpen(true);
  };

  const handleApproveDeploy = async () => {
    if (!selectedModification) return;
    if (!confirm('This will run deployment tests and may use credits. Proceed?')) return;

    setDeploying(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-deploy-fix', {
        body: {
          modificationId: selectedModification.id,
          adminApproved: true
        }
      });

      if (error) throw error;

      toast.success(`✅ Deployed successfully! ${data.tests_passed} tests passed`);
      setApprovalDialogOpen(false);
      setSelectedModification(null);
      await loadAllData();
    } catch (error: any) {
      toast.error(`❌ Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const handleRejectFix = async (modificationId: string) => {
    try {
      // Logic to log the rejection to a database
      console.log(`Modification ${modificationId} rejected by admin.`);
      toast.success('Modification rejected');
      setApprovalDialogOpen(false);
      setSelectedModification(null);
    } catch (error) {
      console.error('Error rejecting fix:', error);
      toast.error('Failed to reject modification.');
    }
  };

  const getSuggestions = async (type: 'enhancement' | 'fix' | 'optimize' | 'security', context?: any) => {
    if (!confirm('This will call AI suggestions and use credits. Proceed?')) return;
    setSuggesting(true);
    try {
      console.log('Calling ai-suggest-edits with:', { type, context });

      const { data, error } = await supabase.functions.invoke('ai-suggest-edits', {
        body: { type, context }
      });

      console.log('ai-suggest-edits response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to invoke AI suggestion function');
      }

      if (!data) {
        throw new Error('No response data from AI suggestion function');
      }

      if (!data.success) {
        throw new Error(data.error || 'AI suggestion function returned error');
      }

      if (!data.suggestion) {
        throw new Error('No suggestion in response data');
      }

      setSuggestions(prev => [...prev, {
        type,
        suggestion: data.suggestion,
        timestamp: new Date().toISOString(),
        context
      }]);

      if (data.systemMap) {
        setSystemMap(data.systemMap);
      }

      toast.success(`${type.toUpperCase()} analysis complete`);
    } catch (error: any) {
      console.error('Suggestion error:', error);
      toast.error(`Suggestion failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSuggesting(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('ai_user_feedback')
        .insert({
          user_id: user?.id,
          error_description: feedbackText,
          severity: 'medium',
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Feedback submitted");
      setFeedbackText("");
      await loadAllData();
    } catch (error: any) {
      toast.error(`Submission failed: ${error.message}`);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-500 border-red-500';
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500';
      case 'low': return 'bg-blue-500/20 text-blue-500 border-blue-500';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fixed':
      case 'deployed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'analyzing':
      case 'pending':
        return <CircleDashed className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'failed':
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <Shield className="h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Brain className="mr-3 h-8 w-8" />
        SuperAdmin AI Dashboard
      </h1>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Errors & Fixes</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="system-map">System Map</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{errors.filter(e => e.status !== 'fixed').length}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-500">{errors.filter(e => e.severity === 'critical').length}</span> critical
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Fixes</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fixes.length}</div>
                <p className="text-xs text-muted-foreground">
                  AI-generated fixes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Deployments</CardTitle>
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deployments.filter(d => d.status === 'pending').length}</div>
                <p className="text-xs text-muted-foreground">
                  Waiting for approval
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Feedback</CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{feedback.length}</div>
                <p className="text-xs text-muted-foreground">
                  New and pending feedback
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">AI Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button onClick={() => getSuggestions('optimize')} disabled={suggesting}>
                {suggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
                Suggest Optimizations
              </Button>
              <Button onClick={() => getSuggestions('security')} disabled={suggesting}>
                {suggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                Suggest Security Fixes
              </Button>
              <Button onClick={() => getSuggestions('fix')} disabled={suggesting}>
                {suggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Code2 className="mr-2 h-4 w-4" />}
                Suggest Code Fixes
              </Button>
              <Button onClick={() => getSuggestions('enhancement')} disabled={suggesting}>
                {suggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                Suggest Enhancements
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {errors.length === 0 ? (
                  <p className="text-muted-foreground">No errors found.</p>
                ) : (
                  errors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border-b last:border-b-0">
                      <div>
                        <div className="flex items-center">
                          <AlertTriangle className={`h-4 w-4 mr-2 ${getSeverityColor(error.severity)}`} />
                          <span className="font-semibold">{error.message}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{error.timestamp}</p>
                      </div>
                      <Button onClick={() => handleAnalyzeError(error)} size="sm" disabled={analyzing}>
                        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                        <span className="ml-2">Analyze</span>
                      </Button>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>AI Fixes (Pending Approval)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {fixes.length === 0 ? (
                  <p className="text-muted-foreground">No AI fixes pending approval.</p>
                ) : (
                  fixes.map((fix, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border-b last:border-b-0">
                      <div>
                        <div className="font-semibold">Fix for {fix.related_error_id}</div>
                        <p className="text-sm text-muted-foreground mt-1">{fix.summary}</p>
                      </div>
                      <Button onClick={() => handlePreviewFix(fix)} size="sm">
                        <Eye className="h-4 w-4" />
                        <span className="ml-2">Preview & Approve</span>
                      </Button>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle>AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {suggestions.length === 0 ? (
                  <p className="text-muted-foreground">No suggestions found. Use the buttons on the overview tab to generate some.</p>
                ) : (
                  suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border-b last:border-b-0">
                      <div className="flex items-center">
                        <Badge variant="secondary" className="mr-2">{suggestion.type}</Badge>
                        <span className="text-sm text-muted-foreground">{new Date(suggestion.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 text-sm">{suggestion.suggestion}</p>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Textarea
                  placeholder="Enter feedback for the AI engine..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                />
                <Button onClick={submitFeedback} className="mt-2" disabled={!feedbackText.trim()}>
                  <Send className="mr-2 h-4 w-4" /> Submit Feedback
                </Button>
              </div>
              <ScrollArea className="h-[350px] pr-4">
                {feedback.length === 0 ? (
                  <p className="text-muted-foreground">No user feedback submitted yet.</p>
                ) : (
                  feedback.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border-b last:border-b-0">
                      <div>
                        <p className="font-semibold">{item.error_description}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Severity: <Badge className={getSeverityColor(item.severity)}>{item.severity}</Badge>
                        </p>
                      </div>
                      <div>
                        {getStatusIcon(item.status)}
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system-map">
          <Card>
            <CardHeader>
              <CardTitle>AI System Map</CardTitle>
            </CardHeader>
            <CardContent>
              {systemMap ? (
                <pre className="p-4 bg-muted rounded-md overflow-auto max-h-[600px] text-xs">
                  {JSON.stringify(systemMap, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">System map not yet generated. Run an AI action to see it here.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AIApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        modification={selectedModification}
        onApprove={handleApproveDeploy}
        onReject={() => handleRejectFix(selectedModification?.id)}
        deploying={deploying}
      />
    </div>
  );
}
