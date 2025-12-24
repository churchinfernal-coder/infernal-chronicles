import React, { useEffect, useState } from "react";
import { FileText, Printer, Mail, Gavel, ShieldCheck, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

/**
 * Terms.tsx
 *
 * Enterprise-grade, type-safe Terms & Conditions page.
 * - Attempts to fetch /api/terms; falls back to built-in copy.
 * - Safe guards for SSR (guards document/window/navigator).
 * - Ensures no "possibly undefined" or "string | undefined" TypeScript errors by normalizing values.
 * - Utilities: copy contact email, print, download plaintext.
 *
 * Drop into src/pages/Terms.tsx
 */

/* ---------------- Types ---------------- */
type TermsPayload = {
  last_updated?: string;
  overview?: string;
  user_agreements?: string[];
  acceptable_use?: string[];
  prohibited?: string[];
  dispute_resolution?: string;
  governing_law?: string;
  contact_email?: string;
  domain?: string;
};

/* --------------- Fallback ---------------- */
const FALLBACK: TermsPayload = {
  last_updated: new Date().toISOString().split("T")[0],
  overview:
    "These Terms govern your use of Infernal Social. By accessing or using the service you agree to comply with these terms. Please read carefully.",
  user_agreements: [
    "You will provide accurate information when creating an account.",
    "You will not impersonate others or use the service for unlawful purposes.",
    "You consent to our processing of data as described in the Privacy Policy.",
  ],
  acceptable_use: [
    "Respect other users and their privacy.",
    "Post content only if you have the right to share it.",
    "Use platform features as intended and do not abuse system resources.",
  ],
  prohibited: [
    "Illegal activity, incitement, or instructions facilitating wrongdoing.",
    "Hate speech, threats, or targeted harassment.",
    "Sharing private personal data (doxxing) or images without consent.",
  ],
  dispute_resolution:
    "We encourage first contacting support. Disputes may be resolved via internal appeals; in some cases arbitration or formal legal process may apply as described below.",
  governing_law: "These Terms are governed by the laws of the jurisdiction where Infernal Social is incorporated. See the full policy for details.",
  contact_email: "legal@infernal.social",
  domain: "https://infernal.social",
};

/* --------------- Component --------------- */
export default function Terms() {
  const [terms, setTerms] = useState<TermsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const t = terms ?? FALLBACK;

  // Fetch remote terms if available
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchTerms() {
      setLoading(true);
      try {
        const res = await fetch("/api/terms", { signal: controller.signal });
        if (!res.ok) throw new Error("no remote terms");
        const json = (await res.json()) as TermsPayload;
        if (mounted && json) setTerms(json);
      } catch {
        if (mounted) setTerms(FALLBACK);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchTerms();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // SEO/meta (guarded)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const title = "Terms & Conditions • Infernal Social";
    document.title = title;
    const desc = String(t.overview ?? FALLBACK.overview ?? "");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terms]);

  // Utilities (defensive)
  const copyContactEmail = async () => {
    const email = String(t.contact_email ?? FALLBACK.contact_email ?? "");
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

  const printTerms = () => {
    try {
      if (typeof window !== "undefined" && window.print) window.print();
      else toast.error("Print not supported in this environment");
    } catch {
      toast.error("Unable to open print dialog");
    }
  };

  const downloadTerms = () => {
    try {
      const text = generatePlainTextTerms(t);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "infernal_social_terms.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Terms downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <main className="min-h-screen bg-black text-slate-100 antialiased p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="rounded-full h-12 w-12 flex items-center justify-center bg-[#170000] border border-crimson-700">
            <Gavel className="h-6 w-6 text-crimson-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Terms & Conditions</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.overview}</p>
            <div className="mt-2 text-xs text-muted-foreground">Last updated: {String(t.last_updated ?? FALLBACK.last_updated)}</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={copyContactEmail} title="Copy legal contact email">
              <Mail className="h-4 w-4 text-crimson-300" /> Contact
            </Button>
            <Button variant="ghost" onClick={downloadTerms} title="Download terms">
              <FileText className="h-4 w-4 text-crimson-300" /> Download
            </Button>
            <Button variant="ghost" onClick={printTerms} title="Print terms">
              <Printer className="h-4 w-4 text-crimson-300" /> Print
            </Button>
          </div>
        </header>

        <ScrollArea className="rounded-lg bg-neutral-900/60 p-6 border border-neutral-800">
          {/* User agreements */}
          <section aria-labelledby="agreements" className="mb-6">
            <h2 id="agreements" className="text-lg font-semibold flex items-center gap-2">
              <List className="h-5 w-5 text-crimson-400" /> User agreements
            </h2>
            <ol className="mt-3 list-decimal list-inside text-sm text-muted-foreground">
              {(t.user_agreements ?? FALLBACK.user_agreements ?? []).map((a, i) => (
                <li key={i} className="mb-2">
                  {a}
                </li>
              ))}
            </ol>
          </section>

          {/* Acceptable use */}
          <section aria-labelledby="acceptable-use" className="mb-6">
            <h3 id="acceptable-use" className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-crimson-400" /> Acceptable use
            </h3>
            <ul className="mt-3 list-disc list-inside text-sm text-muted-foreground">
              {(t.acceptable_use ?? FALLBACK.acceptable_use ?? []).map((u, i) => (
                <li key={i} className="mb-1">
                  {u}
                </li>
              ))}
            </ul>
          </section>

          {/* Prohibited */}
          <section aria-labelledby="prohibited" className="mb-6">
            <h3 id="prohibited" className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-crimson-400" /> Prohibited conduct
            </h3>
            <ul className="mt-3 list-disc list-inside text-sm text-muted-foreground">
              {(t.prohibited ?? FALLBACK.prohibited ?? []).map((p, i) => (
                <li key={i} className="mb-1">
                  {p}
                </li>
              ))}
            </ul>
          </section>

          {/* Dispute resolution */}
          <section aria-labelledby="dispute" className="mb-6">
            <h3 id="dispute" className="text-lg font-semibold flex items-center gap-2">
              <Gavel className="h-5 w-5 text-crimson-400" /> Dispute resolution
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{String(t.dispute_resolution ?? FALLBACK.dispute_resolution ?? "")}</p>
          </section>

          {/* Governing law */}
          <section aria-labelledby="governing" className="mb-6">
            <h3 id="governing" className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-crimson-400" /> Governing law
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{String(t.governing_law ?? FALLBACK.governing_law ?? "")}</p>
          </section>
        </ScrollArea>

        <footer className="mt-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            Legal contact:{" "}
            <a className="text-crimson-300 hover:underline" href={`mailto:${String(t.contact_email ?? FALLBACK.contact_email ?? "")}`}>
              {String(t.contact_email ?? FALLBACK.contact_email ?? "")}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={copyContactEmail}>
              <Mail className="h-4 w-4" /> Copy contact
            </Button>
            <Button variant="ghost" onClick={downloadTerms}>
              <FileText className="h-4 w-4" /> Download
            </Button>
            <Button variant="ghost" onClick={printTerms}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* --------------- Helpers --------------- */
function generatePlainTextTerms(g: TermsPayload) {
  const lines: string[] = [];
  lines.push("Infernal Social — Terms & Conditions");
  lines.push(`Last updated: ${g.last_updated ?? FALLBACK.last_updated}`);
  lines.push("");
  lines.push("Overview:");
  lines.push(g.overview ?? FALLBACK.overview ?? "");
  lines.push("");
  lines.push("User agreements:");
  (g.user_agreements ?? FALLBACK.user_agreements ?? []).forEach((a) => lines.push(`- ${a}`));
  lines.push("");
  lines.push("Acceptable use:");
  (g.acceptable_use ?? FALLBACK.acceptable_use ?? []).forEach((u) => lines.push(`- ${u}`));
  lines.push("");
  lines.push("Prohibited conduct:");
  (g.prohibited ?? FALLBACK.prohibited ?? []).forEach((p) => lines.push(`- ${p}`));
  lines.push("");
  lines.push("Dispute resolution:");
  lines.push(g.dispute_resolution ?? FALLBACK.dispute_resolution ?? "");
  lines.push("");
  lines.push("Governing law:");
  lines.push(g.governing_law ?? FALLBACK.governing_law ?? "");
  lines.push("");
  lines.push(`Contact: ${g.contact_email ?? FALLBACK.contact_email ?? ""}`);
  return lines.join("\n");
}