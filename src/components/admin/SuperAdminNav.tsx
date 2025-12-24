import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Star,
  Clock,
  ChevronDown,
  ChevronRight,
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  Shield,
  Settings,
  Database,
  Film,
  Layout,
  Palette,
  FileText,
  Flag,
  Gamepad2,
  Globe,
  Lock,
  Wrench,
  DollarSign,
  Key
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  badge?: number;
  children?: NavItem[];
  keywords?: string[];
}

interface SuperAdminNavProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  items: NavItem[];
}

export function SuperAdminNav({ activeTab, onTabChange, items }: SuperAdminNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["main"]));
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentItems, setRecentItems] = useState<string[]>([]);

  // Breadcrumb trail
  const breadcrumbs = useMemo(() => {
    const trail: NavItem[] = [];
    const findItem = (items: NavItem[], target: string, path: NavItem[] = []): NavItem[] | null => {
      for (const item of items) {
        const currentPath = [...path, item];
        if (item.value === target) return currentPath;
        if (item.children) {
          const result = findItem(item.children, target, currentPath);
          if (result) return result;
        }
      }
      return null;
    };
    return findItem(items, activeTab) || [];
  }, [activeTab, items]);

  // Filtered items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    
    const query = searchQuery.toLowerCase();
    const filterRecursive = (items: NavItem[]): NavItem[] => {
      return items.filter(item => {
        const matches = 
          item.label.toLowerCase().includes(query) ||
          item.keywords?.some(k => k.toLowerCase().includes(query));
        
        if (item.children) {
          const filteredChildren = filterRecursive(item.children);
          return matches || filteredChildren.length > 0;
        }
        return matches;
      }).map(item => {
        if (item.children) {
          return { ...item, children: filterRecursive(item.children) };
        }
        return item;
      });
    };
    
    return filterRecursive(items);
  }, [items, searchQuery]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleItemClick = (value: string) => {
    onTabChange(value);
    setRecentItems(prev => {
      const filtered = prev.filter(v => v !== value);
      return [value, ...filtered].slice(0, 5);
    });
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const Icon = item.icon;
    const isExpanded = expandedSections.has(item.id);
    const isActive = activeTab === item.value;
    const isFavorite = favorites.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="w-full">
        <div
          className={cn(
            "group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all",
            "hover:bg-red-900/20",
            isActive && "bg-red-600 text-white",
            !isActive && "text-red-300/80",
            level > 0 && "ml-4"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.id);
            } else {
              handleItemClick(item.value);
            }
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(item.id);
              }}
              className="p-0 hover:bg-transparent"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          
          <Icon className="h-4 w-4 shrink-0" />
          
          <span className="flex-1 text-sm font-medium truncate">
            {item.label}
          </span>
          
          {item.badge && (
            <Badge variant="destructive" className="text-xs">
              {item.badge}
            </Badge>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
            className={cn(
              "p-0 opacity-0 group-hover:opacity-100 transition-opacity",
              isFavorite && "opacity-100"
            )}
          >
            <Star
              className={cn(
                "h-4 w-4",
                isFavorite && "fill-yellow-500 text-yellow-500"
              )}
            />
          </button>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black/50 border-r border-red-900/30">
      {/* Search */}
      <div className="p-4 border-b border-red-900/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
          <Input
            placeholder="Search navigation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-red-950/20 border-red-900/30 text-red-100 placeholder:text-red-400/50"
          />
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="px-4 py-2 border-b border-red-900/30">
          <div className="flex items-center gap-1 text-xs text-red-400/70">
            {breadcrumbs.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-1">
                {idx > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={cn(idx === breadcrumbs.length - 1 && "text-red-400 font-medium")}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Favorites Section */}
          {favorites.size > 0 && !searchQuery && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 text-xs font-semibold text-red-400/70 uppercase tracking-wider">
                <Star className="h-3 w-3" />
                Favorites
              </div>
              {items.map(item => {
                if (favorites.has(item.id)) {
                  return renderNavItem(item, 0);
                }
                return null;
              })}
            </div>
          )}

          {/* Recent Section */}
          {recentItems.length > 0 && !searchQuery && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2 text-xs font-semibold text-red-400/70 uppercase tracking-wider">
                <Clock className="h-3 w-3" />
                Recent
              </div>
              {recentItems.map(value => {
                const findItemByValue = (items: NavItem[]): NavItem | null => {
                  for (const item of items) {
                    if (item.value === value) return item;
                    if (item.children) {
                      const found = findItemByValue(item.children);
                      if (found) return found;
                    }
                  }
                  return null;
                };
                const item = findItemByValue(items);
                return item ? renderNavItem(item, 0) : null;
              })}
            </div>
          )}

          {/* All Navigation Items */}
          <div className="space-y-2">
            {filteredItems.map(item => renderNavItem(item, 0))}
          </div>
        </div>
      </ScrollArea>

      {/* Help Section */}
      <div className="p-4 border-t border-red-900/30">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-red-900/30 text-red-400 hover:bg-red-900/20"
          size="sm"
        >
          <Shield className="h-4 w-4" />
          Documentation
        </Button>
      </div>
    </div>
  );
}

// Export navigation structure
export const superAdminNavItems: NavItem[] = [
  {
    id: "content",
    label: "Content Management",
    icon: FileText,
    value: "content",
    keywords: ["posts", "articles", "content", "moderation"],
    children: [
      { id: "posts", label: "Posts & Articles", icon: FileText, value: "posts", keywords: ["posts", "articles"] },
      { id: "moderation", label: "Moderation Queue", icon: Flag, value: "moderation", keywords: ["moderation", "reports"] },
      { id: "reports", label: "Reports & Flags", icon: Flag, value: "reports", keywords: ["reports", "flags", "abuse"] },
    ]
  },
  {
    id: "users",
    label: "User Management",
    icon: Users,
    value: "users",
    keywords: ["users", "members", "accounts"],
    children: [
      { id: "all-users", label: "All Users", icon: Users, value: "users-list", keywords: ["users", "list"] },
      { id: "roles", label: "Roles & Permissions", icon: Shield, value: "roles", keywords: ["roles", "permissions", "access"] },
    ]
  },
  {
    id: "social",
    label: "Social Features",
    icon: MessageSquare,
    value: "social",
    keywords: ["chat", "covens", "friends"],
    children: [
      { id: "covens", label: "Covens", icon: Users, value: "covens", keywords: ["covens", "groups"] },
      { id: "chat", label: "Infernal Chat", icon: MessageSquare, value: "chat", keywords: ["chat", "messages"] },
      { id: "allies", label: "Allies & Friends", icon: Users, value: "allies", keywords: ["friends", "allies"] },
    ]
  },
  {
    id: "mystical",
    label: "Mystical Tools",
    icon: BookOpen,
    value: "mystical",
    keywords: ["tarot", "runes", "ouija", "calendar"],
    children: [
      { id: "tarot", label: "Tarot & Runes", icon: BookOpen, value: "tarot", keywords: ["tarot", "runes"] },
      { id: "ouija", label: "Ouija Chamber", icon: MessageSquare, value: "ouija", keywords: ["ouija", "spirit"] },
      { id: "calendar", label: "Ritual Calendar", icon: Calendar, value: "calendar", keywords: ["calendar", "ritual", "events"] },
      { id: "library", label: "Occult Library", icon: BookOpen, value: "library", keywords: ["library", "books"] },
       { id: "featured-slider", label: "Featured Books Slider", icon: Star, value: "featured-slider", keywords: ["slider", "featured", "books"] },
       { id: "hallucination-audit", label: "Hallucination Audit", icon: Shield, value: "hallucination-audit", keywords: ["hallucination", "audit", "monitoring"] },
    ]
  },
  {
    id: "creative",
    label: "Creative Tools",
    icon: Palette,
    value: "creative",
    keywords: ["game", "cinematic", "book", "frame", "animation", "gaming", "hub"],
    children: [
      { id: "gaming-hub", label: "Gaming Hub", icon: Gamepad2, value: "gaming-hub", keywords: ["gaming", "hub", "venice", "deployment", "rollback"] },
      { id: "game", label: "Game Engine", icon: Gamepad2, value: "game-engine", keywords: ["game", "engine"] },
      { id: "cinematic", label: "Cinematic Engine", icon: Film, value: "cinematic", keywords: ["cinematic", "video"] },
      { id: "cinematic-frame", label: "Frame Editor", icon: Film, value: "cinematic-frame-editor", keywords: ["frame", "timeline", "24fps", "animation"] },
      { id: "frame-manager", label: "Frame Manager", icon: Film, value: "frame-manager", keywords: ["frame", "manager", "24fps", "timeline"] },
      { id: "infernal-animation", label: "Infernal Animation", icon: Film, value: "infernal-animation", keywords: ["infernal", "entity", "animation", "24fps"] },
      { id: "book", label: "Book Writing", icon: BookOpen, value: "book-writing", keywords: ["book", "writing"] },
    ]
  },
  {
    id: "commerce",
    label: "Commerce",
    icon: Lock,
    value: "commerce",
    keywords: ["store", "products", "payments", "premium", "stripe", "paypal"],
    children: [
      { id: "premium-services", label: "Premium Services", icon: DollarSign, value: "premium-services", keywords: ["premium", "pricing", "stripe", "paypal", "subscription"] },
      { id: "premium-tokens", label: "Token Generator", icon: Key, value: "premium-tokens", keywords: ["tokens", "generator", "ouija", "tarot", "rune", "testing", "backend"] },
      { id: "store", label: "Prime Store", icon: Lock, value: "store", keywords: ["store", "shop"] },
      { id: "access-keys", label: "Access Keys", icon: Lock, value: "access-keys", keywords: ["keys", "access"] },
      { id: "animations", label: "Animation Sessions", icon: Film, value: "animations", keywords: ["animations", "sessions"] },
    ]
  },
  {
    id: "system",
    label: "System & Config",
    icon: Settings,
    value: "system",
    keywords: ["settings", "config", "seo", "audit", "modules", "ai"],
    children: [
      { id: "site-config", label: "Site Configuration", icon: Settings, value: "site-config", keywords: ["config", "settings"] },
      { id: "seo", label: "SEO Management", icon: Globe, value: "seo", keywords: ["seo", "search"] },
      { id: "site-audit", label: "Site Audit Dashboard", icon: Shield, value: "site-audit", keywords: ["audit", "security", "ai", "repair"] },
      { id: "ai-repair", label: "AI Repair Engine", icon: Wrench, value: "ai-repair", keywords: ["ai", "repair", "fix", "engine"] },
      { id: "ai-fix-dashboard", label: "AI Fix Dashboard", icon: Wrench, value: "ai-fix-dashboard", keywords: ["ai", "fix", "dashboard", "venice"] },
      { id: "ai-fix-list", label: "AI Fixes & Rollback", icon: Wrench, value: "ai-fixes", keywords: ["ai", "fix", "rollback", "applied"] },
      { id: "ai-assets", label: "AI Asset Viewer", icon: Database, value: "ai-assets", keywords: ["ai", "assets", "visual", "script", "rollback"] },
      { id: "modules", label: "Module Registry", icon: Database, value: "modules", keywords: ["modules", "registry", "components"] },
      { id: "headers", label: "Headers & Footers", icon: Layout, value: "headers", keywords: ["header", "footer"] },
      { id: "database", label: "Database Inspector", icon: Database, value: "database", keywords: ["database", "sql"] },
      { id: "schema", label: "Schema Forensics", icon: Database, value: "schema", keywords: ["schema", "forensics", "ai"] },
      { id: "security", label: "Security Audit", icon: Shield, value: "security", keywords: ["security", "rls", "policies"] },
      { id: "errors", label: "Error Analysis", icon: Flag, value: "errors", keywords: ["errors", "ai", "repair"] },
      { id: "performance", label: "Performance Metrics", icon: Settings, value: "performance", keywords: ["performance", "metrics"] },
      { id: "modules-inventory", label: "Module Inventory", icon: Database, value: "modules-inventory", keywords: ["modules", "inventory"] },
      { id: "history", label: "Audit History", icon: Clock, value: "history", keywords: ["history", "audit"] },
      { id: "actions", label: "Action Items", icon: Flag, value: "actions", keywords: ["actions", "tasks", "ai"] },
      { id: "system-audit", label: "System Audit", icon: Database, value: "system-audit", keywords: ["system", "audit", "forensic", "inventory"] },
      { id: "integration-report", label: "Integration Report", icon: FileText, value: "integration-report", keywords: ["integration", "report", "status", "modules"] },
      { id: "feature-instructions", label: "Feature Instructions", icon: BookOpen, value: "feature-instructions", keywords: ["instructions", "help", "guide", "ai"] },
    ]
  },
];
