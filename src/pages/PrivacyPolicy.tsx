import React, { useEffect, useState } from "react";
import { ShieldCheck, FileText, Printer, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

/**
 * PrivacyPolicy.tsx
 *
 * Enterprise-grade, accessible and type-safe Privacy Policy page.
 * - Dynamic: fetches /api/privacy when available, falls back to built-in copy.
 * - SEO: sets document.title and meta description (guarded for SSR).
 * - Accessibility: semantic headings, keyboard-friendly controls.
 * - Utilities: download plain text, print, copy contact email.
 *
 * Drop this file into src/pages/PrivacyPolicy.tsx
 */

/* ---------------------- Types ---------------------- */
type PrivacyPayload = {
  last_updated?: string;
  summary?: string;
  data_collected?: { id: string; title: string; description: string }[];
  cookies?: string;
  third_parties?: string;
  user_rights?: string[];
  retention?: string;
  security?: string;
  contact_email?: string;
  domain?: string;
};

/* -------------------- Fallback --------------------- */
const FALLBACK: PrivacyPayload = {
  last_updated: new Date().toISOString().split("T")[0],
  summary:
    "Infernal Social is committed to protecting your privacy. This policy explains what data we collect, why we collect it, how we use it, and the rights you have over your data.",
  data_collected: [
    { id: "account", title: "Account information", description: "Name, username, email address and profile details you provide." },
    { id: "content", title: "User content", description: "Messages, posts, media and other content you create or upload." },
    { id: "usage", title: "Usage data", description: "Technical logs, IP address, device identifiers and analytics for service operation and improvement." },
    { id: "payment", title: "Payment data", description: "Billing details and transaction records (processed by third-party payment providers)." },
  ],
  cookies:
    "We use cookies and similar technologies to provide, secure and analyze our services. You can control cookies through your browser settings and account preferences.",
  third_parties:
    "We use third-party services for analytics, payments, and hosting. We limit shared data to what is necessary and require contractual protections.",
  user_rights: ["Access", "Rectification", "Erasure (right to be forgotten)", "Restriction of processing", "Data portability", "Objection"],
  retention: "We retain personal data only as long as necessary for the purposes described and to comply with legal obligations.",
  security:
    "We employ industry-standard technical and organizational measures to protect your data, including TLS, access controls, encryption at rest where appropriate, and regular audits.",
  contact_email: "privacy@infernal.social",
  domain: "https://infernal.social",
};

/* -------------------- Component -------------------- */
export default function PrivacyPolicy() {
  const [policy, setPolicy] = useState<PrivacyPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Normalized policy object for rendering (never undefined fields)
  const p = policy ?? FALLBACK;

  // Set SEO metadata (guarded)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const title = "Privacy Policy • Infernal Social";
    document.title = title;

    const desc = String(p.summary ?? FALLBACK.summary ?? "");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", desc);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }

    // JSON-LD (Organization + Policy)
    const ldId = "infernal-privacy-jsonld";
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: "Infernal Social Privacy Policy",
      description: desc,
      datePublished: p.last_updated ?? FALLBACK.last_updated,
      publisher: {
        "@type": "Organization",
        name: "Infernal Social",
        url: p.domain ?? FALLBACK.domain,
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
  }, [policy]);

  // Fetch remote policy if available
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchPolicy() {
      setLoading(true);
      try {
        const res = await fetch("/api/privacy", { signal: controller.signal });
        if (!res.ok) throw new Error("no remote policy");
        const json = (await res.json()) as PrivacyPayload;
        if (mounted && json) setPolicy(json);
      } catch {
        if (mounted) setPolicy(FALLBACK);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchPolicy();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // Utilities — all guarded/typed
  const copyPrivacyEmail = async () => {
    const email = String(p.contact_email ?? FALLBACK.contact_email ?? "");
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
      toast.error("Copy failed");
    }
  };

  const printPolicy = () => {
    try {
      if (typeof window !== "undefined" && window.print) window.print();
      else toast.error("Print not supported");
    } catch {
      toast.error("Unable to open print dialog");
    }
  };

  const downloadPolicy = () => {
    try {
      const text = generatePlainTextPolicy(p);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "infernal_social_privacy_policy.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Privacy policy downloaded");
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <main className="min-h-screen bg-black text-slate-100 antialiased p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex items-start gap-4">
          <div className="rounded-full h-12 w-12 flex items-center justify-center bg-[#170000] border border-crimson-700">
            <ShieldCheck className="h-6 w-6 text-crimson-400" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mt-1">{p.summary}</p>
            <div className="mt-2 text-xs text-muted-foreground">Last updated: {String(p.last_updated ?? FALLBACK.last_updated)}</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={copyPrivacyEmail} title="Copy contact email">
              <Mail className="h-4 w-4 text-crimson-300" /> Contact
            </Button>
            <Button variant="ghost" onClick={downloadPolicy} title="Download policy">
              <FileText className="h-4 w-4 text-crimson-300" /> Download
            </Button>
            <Button variant="ghost" onClick={printPolicy} title="Print policy">
              <Printer className="h-4 w-4 text-crimson-300" /> Print
            </Button>
          </div>
        </header>

        <ScrollArea className="rounded-lg bg-neutral-900/60 p-6 border border-neutral-800">
          {/* Data collected */}
          <section aria-labelledby="data-collected" className="mb-6">
            <h2 id="data-collected" className="text-lg font-semibold">Data we collect</h2>
            <p className="text-sm text-muted-foreground mt-2">We collect information you provide and technical data to operate and improve the service.</p>

            <ul className="mt-3 list-disc list-inside text-sm text-muted-foreground">
              {(p.data_collected ?? FALLBACK.data_collected ?? []).map((d) => (
                <li key={d.id} className="mb-2">
                  <strong>{d.title}:</strong> {d.description}
                </li>
              ))}
            </ul>
          </section>

          {/* Cookies */}
          <section aria-labelledby="cookies" className="mb-6">
            <h3 id="cookies" className="text-lg font-semibold">Cookies & tracking</h3>
            <p className="text-sm text-muted-foreground mt-2">{String(p.cookies ?? FALLBACK.cookies ?? "")}</p>
          </section>

          {/* Third parties */}
          <section aria-labelledby="third-parties" className="mb-6">
            <h3 id="third-parties" className="text-lg font-semibold">Third-party services</h3>
            <p className="text-sm text-muted-foreground mt-2">{String(p.third_parties ?? FALLBACK.third_parties ?? "")}</p>
          </section>

          {/* User rights */}
          <section aria-labelledby="user-rights" className="mb-6">
            <h3 id="user-rights" className="text-lg font-semibold">Your rights</h3>
            <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
              {(p.user_rights ?? FALLBACK.user_rights ?? []).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>

          {/* Retention */}
          <section aria-labelledby="retention" className="mb-6">
            <h3 id="retention" className="text-lg font-semibold">Data retention</h3>
            <p className="text-sm text-muted-foreground mt-2">{String(p.retention ?? FALLBACK.retention ?? "")}</p>
          </section>

          {/* Security & law */}
          <section aria-labelledby="security" className="mb-6">
            <h3 id="security" className="text-lg font-semibold">Security & legal</h3>
            <p className="text-sm text-muted-foreground mt-2">{String(p.security ?? FALLBACK.security ?? "")}</p>
            <p className="text-xs text-muted-foreground mt-3">
              We cooperate with lawful requests from authorities and will notify users of requests where permitted.
            </p>
          </section>
        </ScrollArea>

        <footer className="mt-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            Contact privacy:{" "}
            <a className="text-crimson-300 hover:underline" href={`mailto:${String(p.contact_email ?? FALLBACK.contact_email)}`}>
              {String(p.contact_email ?? FALLBACK.contact_email)}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={copyPrivacyEmail}>
              <Mail className="h-4 w-4" /> Copy contact
            </Button>
            <Button variant="ghost" onClick={downloadPolicy}>
              <FileText className="h-4 w-4" /> Download
            </Button>
            <Button variant="ghost" onClick={printPolicy}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </footer>
      </div>
    </main>
  );
}

/* ---------------- Helpers ---------------- */
function generatePlainTextPolicy(g: PrivacyPayload) {
  const lines: string[] = [];
  lines.push("Infernal Social — Privacy Policy");
  lines.push(`Last updated: ${g.last_updated ?? FALLBACK.last_updated}`);
  lines.push("");
  lines.push("Summary:");
  lines.push(g.summary ?? FALLBACK.summary ?? "");
  lines.push("");
  lines.push("Data collected:");
  (g.data_collected ?? FALLBACK.data_collected ?? []).forEach((d) => {
    lines.push(`- ${d.title}: ${d.description}`);
  });
  lines.push("");
  lines.push("Cookies & tracking:");
  lines.push(g.cookies ?? FALLBACK.cookies ?? "");
  lines.push("");
  lines.push("Third-party services:");
  lines.push(g.third_parties ?? FALLBACK.third_parties ?? "");
  lines.push("");
  lines.push("User rights:");
  (g.user_rights ?? FALLBACK.user_rights ?? []).forEach((r) => lines.push(`- ${r}`));
  lines.push("");
  lines.push("Retention:");
  lines.push(g.retention ?? FALLBACK.retention ?? "");
  lines.push("");
  lines.push("Security:");
  lines.push(g.security ?? FALLBACK.security ?? "");
  lines.push("");
  lines.push(`Contact: ${g.contact_email ?? FALLBACK.contact_email ?? ""}`);
  return lines.join("\n");
}
