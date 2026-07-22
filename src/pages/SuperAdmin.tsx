import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Trash2, Save, Flag, Star, Edit, RefreshCw, Shield as ShieldIcon, Users, Settings, Palette, 
  Image, Book, Film, Calendar, MessageSquare, Ghost, Sparkles, Store, Castle, FileText, 
  Activity, Key, Library, Package, Zap, AlertTriangle, BarChart, Search, Lock, CheckSquare, 
  Wrench, Crown, Coins, Gamepad2, Loader2, LogOut, X, Menu
} from "lucide-react";
import { SuperAdminNav, type NavItem, type NavSection } from "@/components/admin/SuperAdminNav";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import RitualCalendarAdmin from "./admin/RitualCalendarAdmin";
import AlliesCovenAdmin from "./admin/AlliesCovenAdmin";
import InfernalChatAdmin from "./admin/InfernalChatAdmin";
import OuijaChamberAdmin from "./admin/OuijaChamberAdmin";
import TarotRuneAdmin from "./admin/TarotRuneAdmin";
import PrimeStoreAdmin from "./admin/PrimeStoreAdmin";
import MyCastleAdmin from "./admin/MyCastleAdmin";
import SiteConfigAdmin from "./admin/SiteConfigAdmin";
import ContentTypesAdmin from "./admin/ContentTypesAdmin";
import SystemControl from "./admin/SystemControl";
import UsersAdmin from "./admin/UsersAdmin";
import ContentModerationAdmin from "./admin/ContentModerationAdmin";
import { DesignEditor } from "@/components/admin/DesignEditor";
import AIImageGenerator from "@/components/admin/AIImageGenerator";
import BookWritingEngine from "./admin/BookWritingEngine";
import CinematicEngine from "./admin/CinematicEngine";
import CinematicFrameEditor from "./admin/CinematicFrameEditor";
import FrameManager from "./admin/FrameManager";
import InfernalAnimation from "./admin/InfernalAnimation";
import FeaturedBooksSliderAdmin from "./admin/FeaturedBooksSliderAdmin";
import HeaderFooterManagement from "./admin/HeaderFooterManagement";
import SEOManagement from "./admin/SEOManagement";
import { SchemaForensics } from "@/components/admin/audit/SchemaForensics";
import { SecurityAudit } from "@/components/admin/audit/SecurityAudit";
import { ErrorAnalysis } from "@/components/admin/audit/ErrorAnalysis";
import { PerformanceMetrics } from "@/components/admin/audit/PerformanceMetrics";
import { ModuleInventory } from "@/components/admin/audit/ModuleInventory";
import { AuditHistory } from "@/components/admin/audit/AuditHistory";
import { ActionItems } from "@/components/admin/audit/ActionItems";
import { SystemAudit } from "@/components/admin/audit/SystemAudit";
import { IntegrationReport } from "@/components/admin/audit/IntegrationReport";
import FeatureInstructions from "./admin/FeatureInstructions";
import AccessKeysAdmin from "./admin/AccessKeysAdmin";
import OccultLibraryAdmin from "./admin/OccultLibraryAdmin";
import ModuleRegistry from "./admin/ModuleRegistry";
import AnimationSessionsAdmin from "./admin/AnimationSessionsAdmin";
import ReportsModeration from "./admin/ReportsModeration";
import SiteAuditDashboard from "./admin/SiteAuditDashboard";
import SuperAdminAI from "./SuperAdminAI";
import PremiumServicesAdmin from "@/pages/admin/PremiumServicesAdmin";
import FeatureFlagsAdmin from "@/pages/admin/FeatureFlagsAdmin";
import AIFixDashboard from "@/components/admin/AIFixDashboard";
import AIFixList from "@/components/admin/AIFixList";
import AIAssetViewer from "@/components/admin/AIAssetViewer";
import GamingHub from "./admin/GamingHub";
import PremiumTokenGenerator from "@/pages/admin/PremiumTokenGenerator";
import BookApprovalAdmin from "./admin/BookApprovalAdmin";

interface Post {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  visibility: string;
  post_type: string;
  media_url:   string | null;
  media_type:   string | null;
  featured:   boolean;
  flagged_for_review:  boolean;
  profiles: {
    username: string;
  } | null;
  title? :  string;
  chant?:  string;
  tags?:  string[];
}

interface EditState {
  content: string;
  visibility: string;
  post_type: string;
  media_url: string;
}

interface Annotation {
  id: string;
  annotation:   string;
  created_at: string;
  admin_user_id: string;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, EditState>>({});
  const [filterUser, setFilterUser] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [annotationText, setAnnotationText] = useState<Record<string, string>>({});
  const [annotations, setAnnotations] = useState<Record<string, Annotation[]>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  const navItems:  NavItem[] = [
    { id: "posts", value: "posts", label: "Content Moderation", icon: ShieldIcon },
    { id:   "users", value: "users", label: "Users", icon:  Users },
    { id: "site-config", value: "site-config", label: "Site Config", icon: Settings },
    { id: "system-control", value: "system-control", label: "System Control", icon: Activity },
    { id: "design-editor", value: "design-editor", label: "Design Editor", icon:   Palette },
    { id: "ai-image-generator", value:   "ai-image-generator", label: "AI Image Generator", icon:   Image },
    { id:  "book-writing-engine", value:   "book-writing-engine", label: "Book Writing Engine", icon:  Book },
    { id: "book-approval-admin", value: "book-approval-admin", label: "Book Approval", icon: ShieldIcon },
    { id:  "cinematic-engine", value:  "cinematic-engine", label:  "Cinematic Engine", icon:  Film },
    { id: "cinematic-frame-editor", value: "cinematic-frame-editor", label: "Cinematic Frame Editor", icon: Film },
    { id: "frame-manager", value: "frame-manager", label: "Frame Manager", icon: Film },
    { id: "infernal-animation", value: "infernal-animation", label: "Infernal Animation", icon:   Zap },
    { id:   "animation-sessions-admin", value:  "animation-sessions-admin", label: "Animation Sessions", icon:  Zap },
    { id: "featured-books-slider-admin", value: "featured-books-slider-admin", label: "Featured Books Slider", icon: Book },
    { id: "header-footer-management", value: "header-footer-management", label:   "Header/Footer Management", icon:   FileText },
    { id:   "seo-management", value:   "seo-management", label:  "SEO Management", icon:  Search },
    { id: "occult-library-admin", value:   "occult-library-admin", label:  "Occult Library", icon:  Library },
    { id: "content-types-admin", value:  "content-types-admin", label:   "Content Types", icon: FileText },
    { id: "ritual-calendar-admin", value: "ritual-calendar-admin", label:   "Ritual Calendar", icon:  Calendar },
    { id: "allies-coven-admin", value: "allies-coven-admin", label:  "Allies & Coven", icon: Users },
    { id: "infernal-chat-admin", value:  "infernal-chat-admin", label:  "Infernal Chat", icon:  MessageSquare },
    { id: "ouija-chamber-admin", value:   "ouija-chamber-admin", label:  "Ouija Chamber", icon:  Ghost },
    { id: "tarot-rune-admin", value:  "tarot-rune-admin", label: "Tarot & Rune", icon: Sparkles },
    { id: "prime-store-admin", value:   "prime-store-admin", label:  "Prime Store", icon: Store },
    { id: "premium-services-admin", value:  "premium-services-admin", label:   "Premium Services", icon: Crown },
    { id: "feature-flags", value: "feature-flags", label: "Feature Overlays", icon: Flag },
    { id: "premium-token-generator", value: "premium-token-generator", label:  "Premium Token Generator", icon:  Coins },
    { id: "my-castle-admin", value: "my-castle-admin", label:   "My Castle", icon: Castle },
    { id: "gaming-hub", value: "gaming-hub", label:  "Gaming Hub", icon: Gamepad2 },
    { id: "schema-forensics", value: "schema-forensics", label: "Schema Forensics", icon: Search },
    { id: "security-audit", value: "security-audit", label: "Security Audit", icon: Lock },
    { id: "error-analysis", value: "error-analysis", label: "Error Analysis", icon: AlertTriangle },
    { id: "performance-metrics", value: "performance-metrics", label: "Performance Metrics", icon:   BarChart },
    { id: "module-inventory", value:   "module-inventory", label:  "Module Inventory", icon: Package },
    { id: "audit-history", value: "audit-history", label: "Audit History", icon: FileText },
    { id: "action-items", value: "action-items", label: "Action Items", icon: CheckSquare },
    { id:   "system-audit", value:  "system-audit", label:  "System Audit", icon: Activity },
    { id:  "integration-report", value: "integration-report", label: "Integration Report", icon:   Wrench },
    { id:   "site-audit-dashboard", value:  "site-audit-dashboard", label:  "Site Audit Dashboard", icon:  BarChart },
    { id: "feature-instructions", value: "feature-instructions", label: "Feature Instructions", icon: Book },
    { id: "access-keys-admin", value: "access-keys-admin", label:  "Access Keys", icon: Key },
    { id: "module-registry", value: "module-registry", label: "Module Registry", icon: Package },
    { id: "reports-moderation", value: "reports-moderation", label: "Reports Moderation", icon: Flag },
    { id: "super-admin-ai", value: "super-admin-ai", label:   "Super Admin AI", icon:   Sparkles },
    { id:   "ai-fix-dashboard", value:  "ai-fix-dashboard", label:  "AI Fix Dashboard", icon:  Wrench },
    { id:   "ai-fix-list", value: "ai-fix-list", label:  "AI Fix List", icon:  CheckSquare },
    { id:   "ai-asset-viewer", value: "ai-asset-viewer", label:  "AI Asset Viewer", icon:  Image },
  ];

  const buildSectionItems = (ids: string[]): NavItem[] =>
    ids.map((id) => navItems.find((item) => item.id === id)).filter((item): item is NavItem => Boolean(item));

  const navSections: NavSection[] = [
    {
      id: "content",
      label: "Content & Moderation",
      items: buildSectionItems([
        "posts",
        "users",
        "content-types-admin",
        "reports-moderation",
        "site-config",
        "system-control",
      ]),
    },
    {
      id: "books",
      label: "Books & Library",
      items: buildSectionItems([
        "book-writing-engine",
        "book-approval-admin",
        "occult-library-admin",
        "featured-books-slider-admin",
      ]),
    },
    {
      id: "creative",
      label: "Creative Studio",
      items: buildSectionItems([
        "design-editor",
        "ai-image-generator",
        "cinematic-engine",
        "cinematic-frame-editor",
        "frame-manager",
        "infernal-animation",
        "animation-sessions-admin",
        "header-footer-management",
        "seo-management",
      ]),
    },
    {
      id: "community",
      label: "Community & Features",
      items: buildSectionItems([
        "ritual-calendar-admin",
        "allies-coven-admin",
        "infernal-chat-admin",
        "ouija-chamber-admin",
        "tarot-rune-admin",
        "gaming-hub",
        "my-castle-admin",
      ]),
    },
    {
      id: "monetization",
      label: "Monetization",
      items: buildSectionItems([
        "prime-store-admin",
        "premium-services-admin",
        "feature-flags",
        "premium-token-generator",
        "access-keys-admin",
      ]),
    },
    {
      id: "audit",
      label: "Audit & Security",
      items: buildSectionItems([
        "schema-forensics",
        "security-audit",
        "error-analysis",
        "performance-metrics",
        "module-inventory",
        "audit-history",
        "action-items",
        "system-audit",
        "integration-report",
        "site-audit-dashboard",
        "module-registry",
      ]),
    },
    {
      id: "ai",
      label: "AI Operations",
      items: buildSectionItems([
        "feature-instructions",
        "super-admin-ai",
        "ai-fix-dashboard",
        "ai-fix-list",
        "ai-asset-viewer",
      ]),
    },
  ];

  const hasVisibleNavItems = navSections.some((section) => section.items.length > 0);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchPosts();
    }
  }, [isAdmin, filterUser, filterType, filterVisibility]);

  const checkAdminAccess = async () => {
    setAuthChecking(true);
    try {
      const { data:  { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("❌ No user logged in");
        toast.error("Please log in to access admin panel");
        navigate("/auth");
        return;
      }

      setCurrentUser(user);

      console.log("🔍 Checking superadmin access for:", user.email, user.id);

      const { data:   allRoles, error:   rolesError } = await (supabase as any)
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);

      console.log("📋 Database query result:", { allRoles, rolesError });

      if (rolesError) {
        console.error("❌ Database error:", rolesError);
        toast.error("Database error:  " + rolesError.message);
        navigate("/dashboard");
        return;
      }

      if (! allRoles || allRoles. length === 0) {
        console.log("❌ No roles found for user");
        toast.error("Access Denied - No roles assigned to your account");
        navigate("/dashboard");
        return;
      }

      console.log("📋 All roles found:", allRoles. map((r: any) => r.role).join(", "));

      const hasSuperAdmin = allRoles.some((r: any) => r.role === "superadmin");
      const hasAdmin = allRoles.some((r: any) => r.role === "admin");

      console.log("👑 Has superadmin? ", hasSuperAdmin);
      console.log("🛡️ Has admin?", hasAdmin);

      if (!hasSuperAdmin && !hasAdmin) {
        console.log("❌ User does not have required role");
        toast.error("Access Denied - Admin or Superadmin role required.  Your roles:  " + allRoles.map((r: any) => r.role).join(", "));
        navigate("/dashboard");
        return;
      }

      console.log("✅ Access granted!");
      setIsAdmin(true);
      
      if (hasSuperAdmin) {
        toast.success("🔥 Welcome Superadmin!");
      } else {
        toast.success("🛡️ Welcome Admin!");
      }
    } catch (error:   any) {
      console.error("💥 Fatal error:", error);
      toast.error("System error: " + error.message);
      navigate("/auth");
    } finally {
      setAuthChecking(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from("posts")
        .select(`
          *,
          profiles(username)
        `)
        .order("created_at", { ascending:   false });

      if (filterType !== "all") {
        query = query.eq("post_type", filterType);
      }
      if (filterVisibility !== "all") {
        query = query.eq("visibility", filterVisibility);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching posts:", error);
        toast.error("Error fetching posts: " + error.message);
        return;
      }

      let filteredData = data || [];

      if (filterUser && filteredData.length > 0) {
        filteredData = filteredData.filter((post: any) => {
          const username = post.profiles?.username;
          return username?. toLowerCase().includes(filterUser.toLowerCase());
        });
      }

      setPosts(filteredData);

      if (filteredData) {
        filteredData.forEach((post: any) => fetchAnnotations(post.id));
      }
    } catch (error:  any) {
      console.error("Fetch error:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnotations = async (postId: string) => {
    const { data } = await (supabase as any)
      .from("admin_annotations")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (data) {
      setAnnotations(prev => ({ ...prev, [postId]: data }));
    }
  };

  const logEdit = async (postId: string, editType: string, oldValue: any, newValue: any) => {
    try {
      const { data:   { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any).from("admin_post_edits").insert({
        post_id: postId,
        admin_user_id: user.id,
        edit_type: editType,
        old_value:  oldValue,
        new_value: newValue,
      });
    } catch (error) {
      console.error("Log edit error:", error);
    }
  };

  const handleSaveEdit = async (post: Post) => {
    const state = editState[post.id];
    if (!state) return;

    const updates:   any = {
      content: state.content,
      visibility: state.visibility,
      post_type: state. post_type,
      updated_at: new Date().toISOString()
    };

    if (state.media_url !== post.media_url) {
      updates.media_url = state.media_url || null;
      updates.media_type = state. media_url ? "image" : null;
    }

    const { error } = await (supabase as any)
      .from("posts")
      .update(updates)
      .eq("id", post.id);

    if (error) {
      toast.error("Error updating post");
      return;
    }

    await logEdit(post.id, "full_edit", {
      content: post.content,
      visibility: post.visibility,
      post_type: post.post_type,
      media_url: post.media_url
    }, updates);

    setEditingPost(null);
    toast.success("Post updated successfully");
    fetchPosts();
  };

  const handleDeletePost = async (postId: string) => {
    if (! confirm("Are you sure you want to delete this post?")) return;

    try {
      await (supabase as any).from("post_reactions").delete().eq("post_id", postId);
      await (supabase as any).from("comments").delete().eq("post_id", postId);
      await (supabase as any).from("admin_annotations").delete().eq("post_id", postId);

      const { error } = await (supabase as any).from("posts").delete().eq("id", postId);

      if (error) throw error;

      toast.success("Post deleted successfully");
      fetchPosts();
    } catch (error:   any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete post:  " + error.message);
    }
  };

  const handleToggleFeatured = async (post: Post) => {
    try {
      const { error } = await (supabase as any)
        .from("posts")
        .update({ featured: !post.featured })
        .eq("id", post.id);

      if (error) throw error;

      toast.success(post.featured ? "Removed from featured" : "Added to featured");
      fetchPosts();
    } catch (error:  any) {
      toast.error("Failed to toggle featured status");
    }
  };

  const handleToggleFlagged = async (post: Post) => {
    try {
      const { error } = await (supabase as any)
        .from("posts")
        .update({ flagged_for_review: !post.flagged_for_review })
        .eq("id", post.id);

      if (error) throw error;

      toast.success(post.flagged_for_review ?  "Flag removed" : "Post flagged");
      fetchPosts();
    } catch (error:   any) {
      toast.error("Failed to toggle flag status");
    }
  };

  const handleAddAnnotation = async (postId: string) => {
    const annotation = annotationText[postId]?.trim();
    if (!annotation) return;

    try {
      const { error } = await (supabase as any)
        .from("admin_annotations")
        .insert({
          post_id: postId,
          admin_user_id: currentUser?. id,
          annotation: annotation
        });

      if (error) throw error;

      setAnnotationText(prev => ({ ...prev, [postId]: "" }));
      toast.success("Annotation added");
      fetchAnnotations(postId);
    } catch (error: any) {
      toast.error("Failed to add annotation");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "posts":
        return <ContentModerationAdmin />;
      case "users":  
        return <UsersAdmin />;
      case "site-config":  
        return <SiteConfigAdmin />;
      case "design-editor": 
        return <DesignEditor />;
      case "ai-image-generator":
        return <AIImageGenerator />;
      case "book-writing-engine": 
        return <BookWritingEngine />;
      case "book-approval-admin":
        return <BookApprovalAdmin />;
      case "cinematic-engine": 
        return <CinematicEngine />;
      case "cinematic-frame-editor":  
        return <CinematicFrameEditor />;
      case "frame-manager":
        return <FrameManager />;
      case "infernal-animation":  
        return <InfernalAnimation />;
      case "featured-books-slider-admin":  
        return <FeaturedBooksSliderAdmin />;
      case "header-footer-management":
        return <HeaderFooterManagement />;
      case "seo-management":
        return <SEOManagement />;
      case "schema-forensics":
        return <SchemaForensics />;
      case "security-audit":  
        return <SecurityAudit />;
      case "error-analysis":
        return <ErrorAnalysis />;
      case "performance-metrics":
        return <PerformanceMetrics />;
      case "module-inventory": 
        return <ModuleInventory />;
      case "audit-history":  
        return <AuditHistory />;
      case "action-items":
        return <ActionItems />;
      case "system-audit":
        return <SystemAudit />;
      case "integration-report":
        return <IntegrationReport />;
      case "feature-instructions":
        return <FeatureInstructions />;
      case "access-keys-admin":
        return <AccessKeysAdmin />;
      case "occult-library-admin":
        return <OccultLibraryAdmin />;
      case "module-registry": 
        return <ModuleRegistry />;
      case "animation-sessions-admin":
        return <AnimationSessionsAdmin />;
      case "reports-moderation":
        return <ReportsModeration />;
      case "site-audit-dashboard":
        return <SiteAuditDashboard />;
      case "super-admin-ai":
        return <SuperAdminAI />;
      case "premium-services-admin":
        return <PremiumServicesAdmin />;
      case "feature-flags":
        return <FeatureFlagsAdmin />;
      case "ai-fix-dashboard":
        return <AIFixDashboard />;
      case "ai-fix-list":  
        return <AIFixList />;
      case "ai-asset-viewer":
        return <AIAssetViewer />;
      case "gaming-hub":
        return <GamingHub />;
      case "premium-token-generator":
        return <PremiumTokenGenerator />;
      case "ritual-calendar-admin":
        return <RitualCalendarAdmin />;
      case "allies-coven-admin":
        return <AlliesCovenAdmin />;
      case "infernal-chat-admin":
        return <InfernalChatAdmin />;
      case "ouija-chamber-admin":
        return <OuijaChamberAdmin />;
      case "tarot-rune-admin":
        return <TarotRuneAdmin />;
      case "prime-store-admin":
        return <PrimeStoreAdmin />;
      case "my-castle-admin":
        return <MyCastleAdmin />;
      case "content-types-admin":
        return <ContentTypesAdmin />;
      case "system-control":  
        return <SystemControl />;
      default:
        return (
          <div className="p-8 text-center text-muted-foreground">
            <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Select an admin panel from the navigation</p>
          </div>
        );
    }
  };

  if (authChecking) {
    return (
      <div className="fixed inset-0 z-70 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (! isAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60 bg-black text-white overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="border-b border-zinc-900 shrink-0 bg-black relative z-30">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                <Menu className="h-4 w-4" />
                <span>Menu</span>
                <span className="sr-only">Open admin menu</span>
              </Button>
              <ShieldIcon className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Super Admin Panel</h1>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:flex bg-primary/10 text-primary border-primary/30 max-w-[260px] truncate">
                <Crown className="h-3 w-3 mr-1" />
                {currentUser?.email}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                <X className="h-4 w-4 mr-2" />
                Exit
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex overflow-hidden">
          <aside
            className={`relative z-20 shrink-0 min-h-0 border-r border-zinc-900 bg-black overflow-hidden ${
              sidebarOpen ? "w-[88vw] max-w-[360px] md:w-80" : "hidden"
            }`}
          >
            {hasVisibleNavItems ? (
              <div className="h-full min-h-0">
                <SuperAdminNav activeTab={activeTab} sections={navSections} onTabChange={setActiveTab} />
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">
                Navigation sections are unavailable.
              </div>
            )}
          </aside>

          <main className="relative z-10 flex-1 min-w-0 overflow-auto px-3 py-4 md:px-6 md:py-6 bg-black">
            {!hasVisibleNavItems ? (
              <div className="mb-4 rounded-md border border-destructive/40 bg-black px-4 py-3 text-sm text-destructive">
                Navigation sections failed to load. Use the Menu button to access admin tools.
              </div>
            ) : null}
            {renderActiveTab()}
          </main>
        </div>
      </div>
    </div>
  );
}