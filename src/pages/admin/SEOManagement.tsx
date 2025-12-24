import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, Plus, Edit, Trash2, BarChart, Image, Link2, 
  FileText, Settings, TrendingUp, AlertCircle, CheckCircle 
} from "lucide-react";

interface SEOMetadata {
  id: string;
  content_type: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  seo_score: number;
  readability_score: number;
  updated_at: string;
}

interface SEOKeyword {
  id: string;
  keyword: string;
  search_volume: number | null;
  competition_level: string | null;
  current_ranking: number | null;
  target_ranking: number | null;
}

interface SEORedirect {
  id: string;
  source_path: string;
  target_path: string;
  redirect_type: number;
  is_active: boolean;
  hit_count: number;
}

export default function SEOManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // State for different SEO data
  const [metadata, setMetadata] = useState<SEOMetadata[]>([]);
  const [keywords, setKeywords] = useState<SEOKeyword[]>([]);
  const [redirects, setRedirects] = useState<SEORedirect[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [metaRes, keyRes, redirectRes] = await Promise.all([
        supabase.from("seo_metadata").select("*").order("updated_at", { ascending: false }),
        supabase.from("seo_keywords").select("*").order("keyword"),
        supabase.from("seo_redirects").select("*").order("created_at", { ascending: false })
      ]);

      if (metaRes.data) setMetadata(metaRes.data);
      if (keyRes.data) setKeywords(keyRes.data);
      if (redirectRes.data) setRedirects(redirectRes.data);
    } catch (error) {
      console.error("Error loading SEO data:", error);
      toast({
        title: "Error",
        description: "Failed to load SEO data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-success">Good</Badge>;
    if (score >= 60) return <Badge className="bg-warning">Needs Improvement</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">SEO Management Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive SEO control center for Infernal Social</p>
          </div>
          <Button onClick={() => navigate("/super-admin")}>
            Back to Admin
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 mb-6">
            <TabsTrigger value="overview">
              <BarChart className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="metadata">
              <FileText className="mr-2 h-4 w-4" />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="keywords">
              <TrendingUp className="mr-2 h-4 w-4" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="images">
              <Image className="mr-2 h-4 w-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="redirects">
              <Link2 className="mr-2 h-4 w-4" />
              Redirects
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Pages Optimized</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{metadata.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Content with SEO metadata</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Tracked Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{keywords.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Active keyword monitoring</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Active Redirects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{redirects.filter(r => r.is_active).length}</div>
                  <p className="text-xs text-muted-foreground mt-1">URL redirects in place</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>SEO Health Overview</CardTitle>
                <CardDescription>Performance summary across all optimized content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span>High Performing Content</span>
                    </div>
                    <Badge className="bg-success">{metadata.filter(m => m.seo_score >= 80).length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <span>Needs Improvement</span>
                    </div>
                    <Badge className="bg-warning">{metadata.filter(m => m.seo_score >= 60 && m.seo_score < 80).length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <span>Poor Performance</span>
                    </div>
                    <Badge variant="destructive">{metadata.filter(m => m.seo_score < 60).length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Page Metadata Management</CardTitle>
                    <CardDescription>Manage meta titles, descriptions, and structured data</CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Metadata
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by slug, title, or keyword..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slug</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Meta Title</TableHead>
                      <TableHead>Focus Keyword</TableHead>
                      <TableHead>SEO Score</TableHead>
                      <TableHead>Readability</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metadata
                      .filter(item => 
                        searchQuery === "" ||
                        item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.meta_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.focus_keyword?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.slug}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.content_type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{item.meta_title || "—"}</TableCell>
                          <TableCell>{item.focus_keyword || "—"}</TableCell>
                          <TableCell>
                            <span className={getScoreColor(item.seo_score)}>{item.seo_score}</span>
                          </TableCell>
                          <TableCell>
                            {getScoreBadge(item.readability_score)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Keyword Tracking</CardTitle>
                    <CardDescription>Monitor keyword performance and rankings</CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Track Keyword
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Search Volume</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Current Rank</TableHead>
                      <TableHead>Target Rank</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keywords.map((keyword) => (
                      <TableRow key={keyword.id}>
                        <TableCell className="font-medium">{keyword.keyword}</TableCell>
                        <TableCell>{keyword.search_volume?.toLocaleString() || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            keyword.competition_level === "low" ? "outline" :
                            keyword.competition_level === "medium" ? "secondary" :
                            "destructive"
                          }>
                            {keyword.competition_level || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>{keyword.current_ranking || "—"}</TableCell>
                        <TableCell>{keyword.target_ranking || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Image SEO Optimization</CardTitle>
                <CardDescription>Manage alt text, titles, and captions for all images</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Image SEO management coming soon</p>
                  <p className="text-sm">Bulk edit alt text, titles, and optimize image compression</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redirects Tab */}
          <TabsContent value="redirects">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>URL Redirects</CardTitle>
                    <CardDescription>Manage 301, 302, and other HTTP redirects</CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Redirect
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Path</TableHead>
                      <TableHead>Target Path</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Hits</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redirects.map((redirect) => (
                      <TableRow key={redirect.id}>
                        <TableCell className="font-mono text-sm">{redirect.source_path}</TableCell>
                        <TableCell className="font-mono text-sm">{redirect.target_path}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{redirect.redirect_type}</Badge>
                        </TableCell>
                        <TableCell>{redirect.hit_count}</TableCell>
                        <TableCell>
                          {redirect.is_active ? (
                            <Badge className="bg-success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Global SEO Settings</CardTitle>
                <CardDescription>Configure site-wide SEO preferences and defaults</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input id="siteName" placeholder="Infernal Social" />
                  </div>
                  <div>
                    <Label htmlFor="siteDescription">Default Meta Description</Label>
                    <Textarea id="siteDescription" placeholder="Enter default site description..." />
                  </div>
                  <div>
                    <Label htmlFor="defaultOgImage">Default Open Graph Image</Label>
                    <Input id="defaultOgImage" placeholder="https://..." />
                  </div>
                  <Button>Save Global Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
