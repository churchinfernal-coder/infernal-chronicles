import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Slash,
  Users,
  AlertOctagon,
  BookOpen,
  UserCheck,
  Mail,
  FileText,
  Download,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

/**
 * CommunityGuidelines.tsx
 *
 * Clean, type-safe implementation of the Community Guidelines page with
 * defensive TypeScript guards to avoid "possibly undefined" and "string | undefined"
 * errors. All DOM / navigator usage is guarded for SSR and optional values are
 * normalized to strings before being passed to APIs.
 *
 * Drop this file into src/pages/CommunityGuidelines.tsx
 */

/* --- Types --- */
type ProhibitedItem = {
  id: string;
  title: string;
  description: string;
  examples?: string[];
};

type GuidelinesPayload = {
  last_updated?: string;
  summary?: string;
  prohibited?: ProhibitedItem[];
  enforcement?: string[];
  reporting?: { steps: string[]; required_fields?: string[] };
  appeals?: string;
  law_enforcement?: string;
  contact_email?: string;
  domain?: string;
};

/* --- Fallback copy --- */
const FALLBACK: GuidelinesPayload = {
  last_updated: new Date().toISOString().split("T")[0],
  summary:
    "Infernal Social provides a private, consent-first space for alternative communities. To keep the platform safe and aligned with laws and community values we prohibit certain types of content and behavior. Below are our guidelines, enforcement steps, and how you can report violations.",
  prohibited: [
    {
      id: "illegal",
      title: "Illegal activity",
      description:
        "Any content that facilitates, encourages, or admits to illegal activity is prohibited. This includes but is not limited to solicitations to commit crimes, instructions for wrongdoing, and advertisement of unlawful services.",
      examples: ["Instructions to manufacture illegal weapons", "Sale of stolen property", "Organizing theft or fraud"],
    },
    {
      id: "hate",
      title: "Hate speech & discrimination",
      description:
        "Content that promotes violence or hatred against people based on protected characteristics (race, religion, ethnicity, national origin, gender, sexual orientation, disability, etc.) is strictly prohibited.",
      examples: ["Calls for violence against a protected group", "Slurs and dehumanizing language targeted at a protected class"],
    },
    {
      id: "violence",
      title: "Graphic violence or threats",
      description:
        "Graphic depictions of violence, threats of violence toward an individual or group, or content that celebrates or encourages harm are not allowed.",
      examples: ["Posting graphic images of severe injury", "Threatening to physically assault someone"],
    },
  ],
  enforcement: [
    "Content removal: content violating these policies will be removed.",
    "Account actions: warnings, temporary suspensions, or permanent bans depending on severity and recurrence.",
    "Transparency: in most cases we notify the user when content is removed or when enforcement action is taken.",
    "Lawful cooperation: we comply with lawful requests from law enforcement and will retain records as required by law.",
  ],
  reporting: {
    steps: [
      "Click 'Report' on the offending post or profile and provide context and evidence.",
      "If reporting via email, include direct links, screenshots, date/time, and any usernames involved.",
      "Our moderation team will review reports within the standard SLA and may request additional information.",
    ],
    required_fields: ["link_to_content", "reason", "screenshots_or_evidence", "reporter_contact (optional)"],
  },
  appeals:
    "If you believe enforcement action was taken in error, you may submit an appeal within 30 days. Appeals are reviewed by a separate moderation panel and resolved according to our appeals policy.",
  law_enforcement:
    "We comply with law enforcement requests in accordance with applicable laws. We will notify users of requests when permitted and use judicial process where required. Emergency requests (imminent harm) are prioritized.",
  contact_email: "trustandsafety@infernal.social",
  domain: "https://infernal.social",
};

/* --- Component --- */
export default function CommunityGuidelines() {
  const [guidelines, setGuidelines] = useState<GuidelinesPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Normalize helper: always return a GuidelinesPayload (never undefined)
  const g = guidelines ?? FALLBACK;

  // SEO/meta: set title and meta description safely
  useEffect(() => {
    if (typeof document === "undefined") return;
    const title = "Community Guidelines • Infernal Social";
    document.title = title;

    const desc = String(g.summary ?? FALLBACK.summary ?? "");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", desc);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }

    // JSON-LD (Organization + CreativeWork) - inject or update
    const ldId = "infernal-guidelines-jsonld";
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: "Infernal Social - Community Guidelines",
      description: desc,
      datePublished: g.last_updated ?? FALLBACK.last_updated,
      publisher: {
        "@type": "Organization",
        name: "Infernal Social",
        url: g.domain ?? FALLBACK.domain,
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
  }, [guidelines]); // only depends on guidelines

  // Fetch authoritative guidelines if available (defensive)
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchGuidelines() {
      setLoading(true);
      try {
        const res = await fetch("/api/guidelines", { signal: controller.signal });
        if (!res.ok) throw new Error("no guidelines endpoint");
        const json = (await res.json()) as GuidelinesPayload;
        if (mounted && json) setGuidelines(json);
      } catch {
        if (mounted) setGuidelines(FALLBACK);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchGuidelines();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // Copy contact email (safe: normalize to string)
  const copyReportEmail = async () => {
    const email = String(g.contact_email ?? FALLBACK.contact_email ?? "");
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
      toast.success("Report email copied to clipboard");
    } catch {
      toast.error("Unable to copy report email");
    }
  };

  // Print (guarded)
  const printGuidelines = () => {
    try {
      if (typeof window !== "undefined" && window.print) window.print();
      else toast.error("Print not supported in this environment");
    } catch {
      toast.error("Unable to open print dialog");
    }
  };

  // Download plaintext guidelines - uses normalized payload
  const downloadGuidelines = () => {
    try {
      const text = generatePlainTextGuidelines(g);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "infernal_social_community_guidelines.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Guidelines downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <main className="min-h-screen bg-black text-slate-100 antialiased p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="rounded-full h-12 w-12 flex items-center justify-center bg-[#170000] border border-crimson-700">
            <ShieldCheck className="h-6 w-6 text-crimson-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Community Guidelines</h1>
            <p className="text-sm text-muted-foreground mt-1">{g.summary}</p>
            <div className="mt-2 text-xs text-muted-foreground">Last updated: {g.last_updated}</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={copyReportEmail} title="Copy report email">
              <Mail className="h-4 w-4 text-crimson-300" /> Report
            </Button>
            <Button variant="ghost" onClick={downloadGuidelines} title="Download guidelines">
              <FileText className="h-4 w-4 text-crimson-300" /> Download
            </Button>
            <Button variant="ghost" onClick={printGuidelines} title="Print guidelines">
              <Printer className="h-4 w-4 text-crimson-300" /> Print
            </Button>
          </div>
        </header>

        <ScrollArea className="rounded-lg bg-neutral-900/60 p-6 border border-neutral-800">
          {/* Prohibited categories */}
          <section aria-labelledby="prohibited-heading" className="mb-6">
            <h2 id="prohibited-heading" className="text-lg font-semibold flex items-center gap-2">
              <Slash className="h-5 w-5 text-crimson-400" /> Prohibited content
            </h2>
            <p className="text-sm text-muted-foreground mt-2">The following content is disallowed on Infernal Social. This list is not exhaustive; we evaluate context and intent.</p>

            <div className="mt-4 space-y-4">
              {(g.prohibited ?? []).map((p) => (
                <article key={p.id} className="p-3 border border-neutral-800 rounded-md bg-[#0b0b0b]">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      <AlertOctagon className="h-5 w-5 text-crimson-400" />
                    </div>
                    <div>
                      <div className="font-semibold">{p.title}</div>
                      <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                      {p.examples && p.examples.length > 0 && (
                        <ul className="mt-2 text-xs list-disc list-inside text-muted-foreground">
                          {p.examples.map((ex, i) => (
                            <li key={i}>{ex}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Enforcement */}
          <section aria-labelledby="enforcement-heading" className="mb-6">
            <h3 id="enforcement-heading" className="text-lg font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-crimson-400" /> Enforcement & actions
            </h3>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              {(g.enforcement ?? []).map((e, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="shrink-0 mt-1">
                    <Users className="h-4 w-4 text-crimson-300" />
                  </div>
                  <div>{e}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Reporting */}
          <section aria-labelledby="reporting-heading" className="mb-6">
            <h3 id="reporting-heading" className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5 text-crimson-400" /> How to report
            </h3>

            <div className="mt-3 text-sm text-muted-foreground">
              <p>Reports help our Trust & Safety team investigate and resolve issues quickly. Include as much information as possible:</p>
              <ul className="list-disc list-inside mt-2">
                {(g.reporting?.required_fields ?? []).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>

              <div className="mt-3">
                <strong className="text-sm">Steps</strong>
                <ol className="list-decimal list-inside mt-2 text-sm">
                  {(g.reporting?.steps ?? []).map((s, i) => (
                    <li key={i} className="mb-1 text-muted-foreground">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* Appeals & law enforcement */}
          <section aria-labelledby="appeals-heading" className="mb-6">
            <h3 id="appeals-heading" className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-crimson-400" /> Appeals & law enforcement
            </h3>

            <div className="mt-3 text-sm text-muted-foreground space-y-2">
              <div>
                <strong>Appeals:</strong> {g.appeals}
              </div>
              <div>
                <strong>Law enforcement:</strong> {g.law_enforcement}
              </div>
            </div>
          </section>

          {/* Safety & resources */}
          <section aria-labelledby="resources-heading" className="mb-6">
            <h3 id="resources-heading" className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-crimson-400" /> Safety resources
            </h3>

            <div className="mt-3 text-sm text-muted-foreground space-y-2">
              <div>If you or someone is in immediate danger contact your local emergency services first.</div>
              <div>
                For support with abuse, exploitation or self-harm concerns, consult local helplines and resources. Infernal Social is not a crisis service; we will assist with referrals where possible.
              </div>
            </div>
          </section>
        </ScrollArea>

        <footer className="mt-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            Contact Trust & Safety:{" "}
            <a
              className="text-crimson-300 hover:underline"
              href={`mailto:${String(g.contact_email ?? FALLBACK.contact_email)}`}
            >
              {String(g.contact_email ?? FALLBACK.contact_email)}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={copyReportEmail}>
              <Mail className="h-4 w-4" /> Copy report email
            </Button>
            <Button variant="ghost" onClick={downloadGuidelines}>
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="ghost" onClick={printGuidelines}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* Helper: generate a straightforward plaintext guide for download */
function generatePlainTextGuidelines(g: GuidelinesPayload) {
  const lines: string[] = [];
  lines.push("Infernal Social — Community Guidelines");
  lines.push(`Last updated: ${g.last_updated ?? FALLBACK.last_updated}`);
  lines.push("");
  lines.push("Summary:");
  lines.push(g.summary ?? FALLBACK.summary ?? "");
  lines.push("");
  lines.push("Prohibited content:");
  (g.prohibited ?? FALLBACK.prohibited ?? []).forEach((p) => {
    lines.push(`- ${p.title}: ${p.description}`);
    if (p.examples && p.examples.length) {
      p.examples.forEach((ex) => lines.push(`    * ${ex}`));
    }
  });
  lines.push("");
  lines.push("Enforcement:");
  (g.enforcement ?? FALLBACK.enforcement ?? []).forEach((e) => lines.push(`- ${e}`));
  lines.push("");
  lines.push("Reporting steps:");
  (g.reporting?.steps ?? FALLBACK.reporting?.steps ?? []).forEach((s) => lines.push(`- ${s}`));
  lines.push("");
  lines.push("Appeals:");
  lines.push(g.appeals ?? FALLBACK.appeals ?? "");
  lines.push("");
  lines.push("Law enforcement:");
  lines.push(g.law_enforcement ?? FALLBACK.law_enforcement ?? "");
  lines.push("");
  lines.push(`Contact: ${g.contact_email ?? FALLBACK.contact_email ?? ""}`);
  return lines.join("\n");
}
