import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  badge?: number;
  keywords?: string[];
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

interface SuperAdminNavProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  sections: NavSection[];
  className?: string;
}

export function SuperAdminNav({ activeTab, onTabChange, sections, className }: SuperAdminNavProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const section of sections) state[section.id] = true;
    return state;
  });

  const filteredSections = useMemo(() => {
    if (!query.trim()) return sections;

    const q = query.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          return (
            item.label.toLowerCase().includes(q) ||
            item.value.toLowerCase().includes(q) ||
            item.keywords?.some((k) => k.toLowerCase().includes(q))
          );
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, query]);

  const toggleSection = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={cn("relative z-20 isolate h-full min-h-0 bg-background border-r border-border", className)}>
      <div className="p-3 border-b border-border/60">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search admin tools"
            className="pl-9 h-9"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-58px)]">
        <div className="p-2 space-y-3">
          {filteredSections.map((section) => {
            const isOpen = expanded[section.id] ?? true;

            return (
              <section key={section.id} className="rounded-md border border-border overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full h-10 px-3 flex items-center justify-between text-left hover:bg-accent/60 transition-colors"
                >
                  <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                    {section.label}
                  </span>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {isOpen && (
                  <div className="p-2 space-y-1 bg-background">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = item.value === activeTab;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onTabChange(item.value)}
                          className={cn(
                            "w-full h-9 px-2.5 rounded-md flex items-center gap-2 text-sm transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground/90 hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate flex-1 text-left">{item.label}</span>
                          {item.badge ? (
                            <Badge variant={active ? "secondary" : "outline"} className="h-5 min-w-5 px-1.5 text-[10px]">
                              {item.badge}
                            </Badge>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {!filteredSections.length && (
            <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No admin tools match this search.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
