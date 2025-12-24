import React from "react";
import { Twitter, ExternalLink } from "lucide-react";

/**
 * Footer.tsx
 *
 * Fixed TypeScript error "Cannot find namespace 'JSX'":
 * - Removed the explicit return type annotation (JSX.Element) from the function signature.
 *   Some TS setups (or missing @types/react) cause `JSX` namespace errors when you use that annotation.
 * - If you'd rather keep a return type, ensure your tsconfig includes the proper JSX setting
 *   (e.g. "jsx": "react-jsx") and install @types/react for classic React typings.
 *
 * Place at: src/components/Footer.tsx
 */

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-xs text-crimson-300 font-semibold">Infernal Social</div>
          <div className="text-xs">© {year} Infernal Social. All rights reserved.</div>
        </div>

        <nav aria-label="Footer" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex gap-3 flex-wrap">
            <a
              href="/about"
              onMouseEnter={() => prefetchRoute("/about")}
              onFocus={() => prefetchRoute("/about")}
              className="text-crimson-300 hover:underline"
            >
              About
            </a>

            <a
              href="/join"
              onMouseEnter={() => prefetchRoute("/join")}
              onFocus={() => prefetchRoute("/join")}
              className="text-crimson-300 hover:underline"
            >
              Join
            </a>

            <a
              href="/guidelines"
              onMouseEnter={() => prefetchRoute("/guidelines")}
              onFocus={() => prefetchRoute("/guidelines")}
              className="text-crimson-300 hover:underline"
            >
              Community Guidelines
            </a>

            <a
              href="/privacy"
              onMouseEnter={() => prefetchRoute("/privacy")}
              onFocus={() => prefetchRoute("/privacy")}
              className="text-crimson-300 hover:underline"
            >
              Privacy
            </a>

            <a
              href="/terms"
              onMouseEnter={() => prefetchRoute("/terms")}
              onFocus={() => prefetchRoute("/terms")}
              className="text-crimson-300 hover:underline"
            >
              Terms
            </a>

            <a
              href="/disclaimer"
              onMouseEnter={() => prefetchRoute("/disclaimer")}
              onFocus={() => prefetchRoute("/disclaimer")}
              className="text-crimson-300 hover:underline"
            >
              Disclaimer
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://twitter.com/infernalsocial"
              target="_blank"
              rel="noopener noreferrer"
              className="text-crimson-300 hover:text-crimson-400 p-1 rounded"
              aria-label="Infernal Social on Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>

            <a
              href="/sitemap.xml"
              className="text-muted-foreground hover:text-crimson-300 inline-flex items-center gap-1"
              aria-label="Sitemap"
            >
              Sitemap <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </nav>
      </div>
    </footer>
  );
}