import React from "react";
import { Twitter, ExternalLink } from "lucide-react";

const prefetchMap: Record<string, () => Promise<any>> = {
  "/about": () => import("../pages/AboutUs"),
  "/join": () => import("../pages/JoinNow"),
  "/guidelines": () => import("../pages/CommunityGuidelines"),
  "/privacy": () => import("../pages/PrivacyPolicy"),
  "/terms": () => import("../pages/Terms"),
  "/disclaimer": () => import("../pages/Disclaimer"),
};

function prefetchRoute(route: string) {
  const loader = prefetchMap[route];
  if (loader) loader().catch(() => {});
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] border-t border-neutral-800 text-sm text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg: px-8 py-6 md:py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <div className="text-base font-semibold text-crimson-300">
              👹 Infernal Social
            </div>
            <div className="text-xs text-muted-foreground">
              © {year} Infernal Social. All rights reserved.
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/infernalsocial"
              target="_blank"
              rel="noopener noreferrer"
              className="text-crimson-300 hover:text-crimson-400 p-2 rounded-lg hover:bg-crimson-300/10 transition-colors"
              aria-label="Infernal Social on Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>

            <a
              href="/sitemap.xml"
              className="text-muted-foreground hover:text-crimson-300 inline-flex items-center gap-1.5 text-xs hover:underline"
              aria-label="Sitemap"
            >
              Sitemap <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Footer Links */}
        <nav aria-label="Footer Navigation" className="border-t border-neutral-800 pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-x-6 gap-y-3">
            <a
              href="/about"
              onMouseEnter={() => prefetchRoute("/about")}
              onFocus={() => prefetchRoute("/about")}
              className="text-crimson-300 hover: text-crimson-400 hover:underline text-xs md: text-sm transition-colors"
            >
              About
            </a>

            <a
              href="/join"
              onMouseEnter={() => prefetchRoute("/join")}
              onFocus={() => prefetchRoute("/join")}
              className="text-crimson-300 hover:text-crimson-400 hover:underline text-xs md:text-sm transition-colors"
            >
              Join
            </a>

            <a
              href="/guidelines"
              onMouseEnter={() => prefetchRoute("/guidelines")}
              onFocus={() => prefetchRoute("/guidelines")}
              className="text-crimson-300 hover:text-crimson-400 hover: underline text-xs md:text-sm transition-colors"
            >
              Community Guidelines
            </a>

            <a
              href="/privacy"
              onMouseEnter={() => prefetchRoute("/privacy")}
              onFocus={() => prefetchRoute("/privacy")}
              className="text-crimson-300 hover:text-crimson-400 hover:underline text-xs md:text-sm transition-colors"
            >
              Privacy
            </a>

            <a
              href="/terms"
              onMouseEnter={() => prefetchRoute("/terms")}
              onFocus={() => prefetchRoute("/terms")}
              className="text-crimson-300 hover:text-crimson-400 hover:underline text-xs md:text-sm transition-colors"
            >
              Terms
            </a>

            <a
              href="/disclaimer"
              onMouseEnter={() => prefetchRoute("/disclaimer")}
              onFocus={() => prefetchRoute("/disclaimer")}
              className="text-crimson-300 hover:text-crimson-400 hover:underline text-xs md:text-sm transition-colors"
            >
              Disclaimer
            </a>
          </div>
        </nav>
      </div>
    </footer>
  );
}