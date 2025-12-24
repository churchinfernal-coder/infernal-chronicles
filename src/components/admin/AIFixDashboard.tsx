import { useAIFixEngine } from "@/hooks/useAIFixEngine";
import { useMonetization } from "@/hooks/useMonetization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, TrendingUp, FileCheck } from "lucide-react";

export default function AIFixDashboard() {
  const { stats, loading } = useAIFixEngine();
  const { usageSummary, loading: usageLoading } = useMonetization();

  if (loading || usageLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">AI Fix Engine Dashboard</h2>
        <p className="text-muted-foreground text-sm">
          Venice MVP Integration: Real-time error detection, automated fixes, version control, and feedback loops
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              Total Fixes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All detected issues</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.applied}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully deployed</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.failed}</div>
            <p className="text-xs text-muted-foreground mt-1">Verification failed</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {stats.avgSuccessRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.verificationCompleteness.toFixed(0)}% verified
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Venice MVP Terms Mapping</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Badge variant="outline" className="mr-2">Error Detection</Badge>
            <p className="text-sm text-muted-foreground">
              → <code>ai_engine_errors</code> table captures all runtime, syntax, and logical errors
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="mr-2">Automated Fixes</Badge>
            <p className="text-sm text-muted-foreground">
              → <code>ai_engine_fixes</code> stores AI-generated solutions with script references
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="mr-2">Version Control</Badge>
            <p className="text-sm text-muted-foreground">
              → <code>ai_deployments</code> tracks rollback points and git commits
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="outline" className="mr-2">Feedback Loop</Badge>
            <p className="text-sm text-muted-foreground">
              → <code>verification_log</code> field captures success/failure metrics
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage & Monetization Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💰 Usage & Tier Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Today's Usage</p>
              <p className="text-2xl font-bold">{usageSummary?.today_credits_used || 0}</p>
              <p className="text-xs text-muted-foreground">credits</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{usageSummary?.month_credits_used || 0}</p>
              <p className="text-xs text-muted-foreground">credits</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Usage</p>
              <p className="text-2xl font-bold">{usageSummary?.total_credits_used || 0}</p>
              <p className="text-xs text-muted-foreground">credits</p>
            </div>
          </div>

          {/* Tier Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Current Tier: <Badge>{usageSummary?.tier_name || 'Free'}</Badge></p>
              <p className="text-sm text-muted-foreground">
                {usageSummary?.month_credits_used || 0} / {usageSummary?.tier_limit || 1000} credits
              </p>
            </div>
            <Progress 
              value={((usageSummary?.month_credits_used || 0) / (usageSummary?.tier_limit || 1000)) * 100} 
            />
          </div>

          {/* Module Breakdown */}
          {usageSummary?.usage_by_module && usageSummary.usage_by_module.length > 0 && (
            <div className="space-y-2">
              <p className="font-semibold">Usage by Module</p>
              <div className="space-y-1">
                {usageSummary.usage_by_module.map((item) => (
                  <div key={item.module} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.module}</span>
                    <span className="font-semibold">{item.credits} credits</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upgrade Options */}
          {(usageSummary?.month_credits_used || 0) >= (usageSummary?.tier_limit || 1000) * 0.8 && (
            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg">
              <p className="text-sm font-semibold text-orange-400">⚠️ Approaching Tier Limit</p>
              <p className="text-xs text-muted-foreground mt-1">
                You've used {Math.round(((usageSummary?.month_credits_used || 0) / (usageSummary?.tier_limit || 1000)) * 100)}% of your monthly credits.
              </p>
              <Button size="sm" className="mt-2 bg-orange-600 hover:bg-orange-700">
                Upgrade Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
