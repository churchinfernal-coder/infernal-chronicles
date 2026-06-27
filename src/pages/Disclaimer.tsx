import React, { useEffect, useState } from "react";
import { FileText, Printer, Mail, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

/**
 * Disclaimer.tsx
 *
 * Enterprise-grade, type-safe Disclaimer page.
 * - Attempts to fetch /api/disclaimer; falls back to built-in copy.
 * - SEO: sets document.title and meta description (guarded for SSR).
 * - Accessibility: semantic headings, keyboard-friendly controls.
 * - Utilities: print, download plaintext, copy contact email.
 *
 * Drop into src/pages/Disclaimer.tsx
 */

/* ---------------- Types ---------------- */
type DisclaimerPayload = {
  last_updated?: string;
  summary?: string;
  liability?: string;
  professional_advice?: string;
  third_party_links?: string;
  user_responsibility?: string;
  contact_email?: string;
  domain?: string;
};

/* ---------------- Fallback ---------------- */
const FALLBACK: DisclaimerPayload = {
  last_updated: new Date().toISOString().split("T")[0],
  summary:
    "The information provided on Infernal Social is for general informational purposes only. Use of the service is subject to our Terms, Privacy Policy, and Community Guidelines.",
  liability:
    "Infernal Social is not liable for user-generated content. While we take steps to moderate and respond to reports, we cannot guarantee the accuracy, completeness, or appropriateness of content posted by users.",
  professional_advice:
    "Nothing on this site constitutes professional advice (legal, medical, financial, or otherwise). For professional concerns, consult a licensed professional in your jurisdiction.",
  third_party_links:
    "Links to third-party websites are provided for convenience. We do not endorse or assume responsibility for external sites and their content.",
  user_responsibility:
    "Users are responsible for their own conduct and compliance with applicable laws. Exercise caution when interacting with others and never share sensitive personal information with untrusted parties.",
  contact_email: "legal@infernal.social",
  domain: "https://infernal.social",
};

/* ---------------- Component ---------------- */
export default function Disclaimer() {
  const [disclaimer, setDisclaimer] = useState<DisclaimerPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const d = disclaimer ?? FALLBACK;

  // Set SEO metadata (guarded)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const title = "Disclaimer • Infernal Social";
    document.title = title;

    const desc = String(d.summary ?? FALLBACK.summary ?? "");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }

    // JSON-LD
    const ldId = "infernal-disclaimer-jsonld";
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: "Infernal Social - Disclaimer",
      description: desc,
      datePublished: d.last_updated ?? FALLBACK.last_updated,
      publisher: {
        "@type": "Organization",
        name: "Infernal Social",
        url: d.domain ?? FALLBACK.domain,
      },
    };
    const payload = JSON.stringify(jsonLd);
    let existing = document.getElementById(ldId) as HTMLScriptElement | null;
    if (existing) existing.textContent = payload;
    else {
      existing = document.createElement("script");
      existing.id = ldId;
      existing.type = "application/ld+json";
      existing.textContent = payload;
      document.head.appendChild(existing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disclaimer]);

  // Fetch remote disclaimer if available
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchDisclaimer() {
      setLoading(true);
      try {
        const res = await fetch("/api/disclaimer", { signal: controller.signal });
        if (!res.ok) throw new Error("no remote disclaimer");
        const json = (await res.json()) as DisclaimerPayload;
        if (mounted && json) setDisclaimer(json);
      } catch {
        if (mounted) setDisclaimer(FALLBACK);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDisclaimer();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // Utilities
  const copyContactEmail = async () => {
    const email = String(d.contact_email ?? FALLBACK.contact_email ?? "");
    const mailto = `mailto:${email}`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(mailto);
      } else if (typeof document !== "undefined") {
        const input = document.createElement("input");
        input.value = mailto;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      toast.success("Contact email copied to clipboard");
    } catch {
      toast.error("Unable to copy contact email");
    }
  };

  const printDisclaimer = () => {
    try {
      if (typeof window !== "undefined" && window.print) window.print();
      else toast.error("Print not supported in this environment");
    } catch {
      toast.error("Unable to open print dialog");
    }
  };

  const downloadDisclaimer = () => {
    try {
      const text = generatePlainTextDisclaimer(d);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "infernal_social_disclaimer.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Disclaimer downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <main className="min-h-screen bg-black text-slate-100 antialiased p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="rounded-full h-12 w-12 flex items-center justify-center bg-[#170000] border border-crimson-700">
            <AlertCircle className="h-6 w-6 text-crimson-400" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">Disclaimer</h1>
            <p className="text-sm text-muted-foreground mt-1">{d.summary}</p>
            <div className="mt-2 text-xs text-muted-foreground">Last updated: {String(d.last_updated ?? FALLBACK.last_updated)}</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={copyContactEmail} title="Copy contact email">
              <Mail className="h-4 w-4 text-crimson-300" /> Contact
            </Button>
            <Button variant="ghost" onClick={downloadDisclaimer} title="Download disclaimer">
              <FileText className="h-4 w-4 text-crimson-300" /> Download
            </Button>
            <Button variant="ghost" onClick={printDisclaimer} title="Print disclaimer">
              <Printer className="h-4 w-4 text-crimson-300" /> Print
            </Button>
          </div>
        </header>

        <ScrollArea className="rounded-lg bg-neutral-900/60 p-6 border border-neutral-800">
          <section aria-labelledby="liability" className="mb-6">
            <h2 id="liability" className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-crimson-400" /> Liability
            </h2>
            <p className="text-sm text-muted-foreground mt-2">{String(d.liability ?? FALLBACK.liability ?? "")}</p>
          </section>

          <section aria-labelledby="professional" className="mb-6">
            <h3 id="professional" className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-crimson-400" /> Professional advice
            </h3>
            <p className="text-sm text-muted-foreground mt-2">{String(d.professional_advice ?? FALLBACK.professional_advice ?? "")}</p>
          </section>

          <section aria-labelledby="thirdparty" className="mb-6">
            <h3 id="thirdparty" className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-crimson-400" /> Third-party links
            </h3>
            <p className="text-sm text-muted-foreground mt-2">{String(d.third_party_links ?? FALLBACK.third_party_links ?? "")}</p>
          </section>

          <section aria-labelledby="responsibility" className="mb-6">
            <h3 id="responsibility" className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-crimson-400" /> User responsibility
            </h3>
            <p className="text-sm text-muted-foreground mt-2">{String(d.user_responsibility ?? FALLBACK.user_responsibility ?? "")}</p>
          </section>
        </ScrollArea>

        <footer className="mt-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            Contact:{" "}
            <a className="text-crimson-300 hover:underline" href={`mailto:${String(d.contact_email ?? FALLBACK.contact_email ?? "")}`}>
              {String(d.contact_email ?? FALLBACK.contact_email ?? "")}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={copyContactEmail}>
              <Mail className="h-4 w-4" /> Copy contact
            </Button>
            <Button variant="ghost" onClick={downloadDisclaimer}>
              <FileText className="h-4 w-4" /> Download
            </Button>
            <Button variant="ghost" onClick={printDisclaimer}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* ---------------- Helpers ---------------- */
function generatePlainTextDisclaimer(g: DisclaimerPayload) {
  const lines: string[] = [];
  lines.push("Infernal Social — Disclaimer");
  lines.push(`Last updated: ${g.last_updated ?? FALLBACK.last_updated}`);
  lines.push("");
  lines.push("Summary:");
  lines.push(g.summary ?? FALLBACK.summary ?? "");
  lines.push("");
  lines.push("Liability:");
  lines.push(g.liability ?? FALLBACK.liability ?? "");
  lines.push("");
  lines.push("Professional advice:");
  lines.push(g.professional_advice ?? FALLBACK.professional_advice ?? "");
  lines.push("");
  lines.push("Third-party links:");
  lines.push(g.third_party_links ?? FALLBACK.third_party_links ?? "");
  lines.push("");
  lines.push("User responsibility:");
  lines.push(g.user_responsibility ?? FALLBACK.user_responsibility ?? "");
  lines.push("");
  lines.push(`Contact: ${g.contact_email ?? FALLBACK.contact_email ?? ""}`);
  return lines.join("\n");
}
