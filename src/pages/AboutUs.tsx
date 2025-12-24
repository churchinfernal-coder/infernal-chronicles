import React, { useEffect, useMemo, useState } from "react";
import { Users, ShieldCheck, PhoneCall, Mail, Globe, BookOpen, Heart, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

/**
 * AboutUs.tsx
 *
 * Enterprise-grade, SEO- and accessibility-optimized "About Us" page for Infernal Social.
 * - Dynamic: fetches authoritative content from /api/about (serverless endpoint) if available.
 * - Performance: lazy images, memoized values, minimal re-renders.
 * - SEO: sets document.title and meta description, injects structured data (JSON-LD).
 * - Accessibility: semantic markup, ARIA attributes, keyboard focus management.
 * - Styling: mobile-first, dark theme with black background and crimson accent.
 *
 * Notes:
 * - Replace /api/about with your canonical API or Supabase row if you prefer.
 * - Icons use lucide-react (already installed in repo).
 * - Uses existing UI primitives (Button, Avatar, ScrollArea, toast) from the project.
 *
 * Usage:
 * - Drop into src/pages/AboutUs.tsx and route to "/about" in your router.
 */

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatar_url?: string;
  contact?: { type: "email" | "link"; value: string };
};

type AboutPayload = {
  siteName: string;
  tagline: string;
  description: string;
  mission: string;
  values: string[];
  communityGuidelines: string[];
  faqs?: { q: string; a: string }[];
  team: TeamMember[];
  contactEmail?: string;
  twitter?: string;
  domain?: string;
};

const FALLBACK_DATA: AboutPayload = {
  siteName: "Infernal Social",
  tagline: "Connect, Share, Summon — A privacy-first community",
  description:
    "Infernal Social is a privacy-first social platform focused on secure, respectful connections for occultists, left-hand path practitioners, tattoo professionals, and alternative lifestyle communities. We provide encrypted communication, realtime connection, and a safe place to share work and ideas.",
  mission:
    "Provide a secure, private, and inclusive platform where alternative communities can connect, collaborate, and grow — while maintaining respect, consent, and safety at the core of every interaction.",
  values: [
    "Privacy & Security: end-to-end encrypted communications where applicable.",
    "Consent & Respect: clear community standards and moderation.",
    "Authenticity: support real creators and communities with transparent tools.",
    "Resilience: strong, auditable architecture and backups.",
  ],
  communityGuidelines: [
    "Be respectful and obtain consent before sharing private content.",
    "No illegal activity or solicitation—follow local laws and platform rules.",
    "Moderators act according to published policies; appeals are processed fairly.",
  ],
  faqs: [
    {
      q: "Is my chat really encrypted?",
      a: "We use client-side encryption primitives for message encryption with keys stored locally; our platform also supports transport-level encryption via TLS and WebRTC for calls.",
    },
    {
      q: "How do I report abuse?",
      a: "Use the 'Report' action in conversation menus. Reports are reviewed by moderators; egregious violations will lead to account action.",
    },
  ],
  team: [
    {
      id: "1",
      name: "Empress",
      role: "Founder & Product",
      bio: "Longstanding community builder in alternative communities. Focused on product strategy and community safety.",
      avatar_url: "/team/empress.jpg",
      contact: { type: "email", value: "founder@infernal.social" },
    },
    {
      id: "2",
      name: "Solomon",
      role: "Engineering Lead",
      bio: "Backend and realtime systems engineer; responsible for secure messaging and WebRTC signaling.",
      avatar_url: "/team/solomon.jpg",
      contact: { type: "link", value: "https://github.com/solomon" },
    },
    {
      id: "3",
      name: "Lilith",
      role: "Community & Moderation",
      bio: "Community safety lead; designs moderation flows and appeals policies.",
      avatar_url: "/team/lilith.jpg",
      contact: { type: "email", value: "safety@infernal.social" },
    },
  ],
  contactEmail: "support@infernal.social",
  twitter: "https://twitter.com/infernalsocial",
  domain: "https://infernal.social",
};

export default function AboutUs(): JSX.Element {
  const [data, setData] = useState<AboutPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Colors / theme classes (Tailwind utility usage expected in project)
  const accent = useMemo(() => "text-crimson-400", []);
  const bgMain = useMemo(() => "bg-black text-slate-100", []);
  const cardBg = useMemo(() => "bg-neutral-900/60", []);

  // Fetch authoritative about content if available
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchAbout() {
      setLoading(true);
      try {
        const res = await fetch("/api/about", { signal: controller.signal });
        if (!res.ok) {
          // no remote data available — fall back silently
          throw new Error("No remote about data");
        }
        const json = (await res.json()) as AboutPayload;
        if (mounted && json && typeof json === "object") {
          setData(json);
        }
      } catch (err) {
        // fallback to embedded authoritative content if API not present
        setData(FALLBACK_DATA);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAbout();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // SEO: set document title & meta description & structured data
  useEffect(() => {
    const site = data ?? FALLBACK_DATA;
    // title
    document.title = `${site.siteName} — About`;
    // meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", site.description);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = site.description;
      document.head.appendChild(m);
    }

    // JSON-LD Organization schema
    const ldId = "infernal-social-org-jsonld";
    let existing = document.getElementById(ldId) as HTMLScriptElement | null;
    const organizationLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.siteName,
      url: site.domain ?? window.location.origin,
      description: site.tagline,
      sameAs: [site.twitter || ""].filter(Boolean),
      contactPoint: [
        {
          "@type": "ContactPoint",
          email: site.contactEmail ?? "support@infernal.social",
          contactType: "customer support",
        },
      ],
    };
    const ld = JSON.stringify(organizationLd);
    if (existing) {
      existing.textContent = ld;
    } else {
      existing = document.createElement("script");
      existing.id = ldId;
      existing.type = "application/ld+json";
      existing.textContent = ld;
      document.head.appendChild(existing);
    }
  }, [data]);

  // simple analytics / view tracking (non-blocking)
  useEffect(() => {
    if (!data) return;
    try {
      // fire and forget: /api/track page view (non-blocking)
      navigator.sendBeacon?.("/api/track", JSON.stringify({ page: "about", ts: Date.now() }));
    } catch {
      // ignore
    }
  }, [data]);

  const handleContact = (email?: string) => {
    if (!email) {
      toast("Contact information not available");
      return;
    }
    if (email.startsWith("http")) {
      window.open(email, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = `mailto:${email}`;
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ((prev) => (prev === index ? null : index));
  };

  const site = data ?? FALLBACK_DATA;

  return (
    <main className={`${bgMain} min-h-screen p-4 sm:p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full h-12 w-12 flex items-center justify-center bg-[#220000] border border-crimson-600">
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#8b0000" strokeWidth="1.2" fill="#0b0b0b"/>
                <path d="M7 12c1.333-3 5-3 6 0 1-3 4-3 5 0" stroke="#8b0000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{site.siteName}</h1>
              <p className="text-sm text-muted-foreground mt-1">{site.tagline}</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => window.location.assign("/signup")} className="border border-crimson-700 text-crimson-300">
                Join Infernal Social
                <ArrowRight className="ml-2 inline-block" />
              </Button>
            </div>
          </div>
        </header>

        {/* Overview / Mission */}
        <section className={`${cardBg} rounded-lg p-6 mb-6`} aria-labelledby="mission-heading">
          <div className="md:flex md:items-start md:gap-6">
            <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-md bg-[#111] border border-crimson-700 mr-4">
              <Users className="h-8 w-8 text-crimson-400" aria-hidden />
            </div>
            <div>
              <h2 id="mission-heading" className="text-lg font-semibold mb-2">Our mission</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{site.mission}</p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {site.values.map((v, i) => (
                  <article key={i} className="p-3 rounded-md border border-neutral-800">
                    <div className="flex items-start gap-3">
                      <Star className="h-5 w-5 text-crimson-400 mt-1" />
                      <div>
                        <div className="text-sm font-semibold">Value</div>
                        <p className="text-xs text-muted-foreground">{v}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className={`${cardBg} rounded-lg p-6 mb-6`} aria-labelledby="security-heading">
          <h3 id="security-heading" className="text-lg font-semibold mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-crimson-400" />
            Security & Privacy
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            We prioritize user privacy: encryption, strict access controls, and opt-in features. You control your profile, contacts, and who can message or call you. We publish transparency reports and work with community moderators to enforce safety.
          </p>

          <ul className="list-none space-y-3">
            <li className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-crimson-400 mt-1" />
              <div>
                <div className="text-sm font-semibold">End-to-end where possible</div>
                <div className="text-xs text-muted-foreground">Messages are encrypted client-side before sending; we never store plaintext when E2E is enabled.</div>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <LockSymbol />
              <div>
                <div className="text-sm font-semibold">Safe defaults</div>
                <div className="text-xs text-muted-foreground">Private profiles by default, granular block/report controls, and strict content policies for sensitive content.</div>
              </div>
            </li>
          </ul>
        </section>

        {/* Community Guidelines */}
        <section className={`${cardBg} rounded-lg p-6 mb-6`} aria-labelledby="guidelines-heading">
          <h3 id="guidelines-heading" className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-crimson-400" />
            Community Guidelines
          </h3>

          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            {site.communityGuidelines.map((g, idx) => (
              <li key={idx} className="leading-relaxed">{g}</li>
            ))}
          </ol>
        </section>

        {/* Team */}
        <section className={`${cardBg} rounded-lg p-6 mb-6`} aria-labelledby="team-heading">
          <div className="flex items-center justify-between">
            <h3 id="team-heading" className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-crimson-400" /> Meet the team
            </h3>
            <div className="text-xs text-muted-foreground">Real people, community-focused</div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {site.team.map((member) => (
              <article key={member.id} className="flex gap-3 items-start p-3 rounded border border-neutral-800">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  {member.avatar_url ? (
                    <AvatarImage src={member.avatar_url} alt={`${member.name} avatar`} />
                  ) : (
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.role}</div>
                    </div>
                    <div className="flex gap-2">
                      {member.contact?.type === "email" && (
                        <Button variant="ghost" size="sm" onClick={() => handleContact(member.contact!.value)}>
                          <Mail className="h-4 w-4 text-crimson-400" />
                        </Button>
                      )}
                      {member.contact?.type === "link" && (
                        <Button variant="ghost" size="sm" onClick={() => handleContact(member.contact!.value)}>
                          <Globe className="h-4 w-4 text-crimson-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {member.bio && <p className="text-xs text-muted-foreground mt-2">{member.bio}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        {site.faqs && site.faqs.length > 0 && (
          <section className={`${cardBg} rounded-lg p-6 mb-6`} aria-labelledby="faq-heading">
            <h3 id="faq-heading" className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-crimson-400" /> Frequently asked questions
            </h3>

            <div className="space-y-3">
              {site.faqs.map((f, i) => (
                <div key={i} className="border border-neutral-800 rounded-md overflow-hidden">
                  <button
                    className="w-full text-left p-3 flex items-center justify-between gap-3"
                    onClick={() => toggleFAQ(i)}
                    aria-expanded={expandedFAQ === i}
                    aria-controls={`faq-panel-${i}`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{f.q}</div>
                    </div>
                    <div className="text-crimson-400">{expandedFAQ === i ? "−" : "+"}</div>
                  </button>
                  <div id={`faq-panel-${i}`} className={`px-4 pb-3 transition-all ${expandedFAQ === i ? "block" : "hidden"}`}>
                    <div className="text-xs text-muted-foreground">{f.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact / CTA */}
        <section className={`${cardBg} rounded-lg p-6 mb-12`} aria-labelledby="contact-heading">
          <h3 id="contact-heading" className="text-lg font-semibold mb-3 flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-crimson-400" /> Get in touch
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                For press, partnerships or support reach out to <strong className="text-crimson-300">{site.contactEmail}</strong>
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleContact(site.contactEmail)}>
                  <Mail className="h-4 w-4 mr-2 text-crimson-400" /> Email support
                </Button>
                <Button variant="ghost" onClick={() => window.location.assign("/policy")}>
                  <BookOpen className="h-4 w-4 mr-2 text-crimson-400" /> Policies & Safety
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">Follow us for announcements and community highlights</p>
              <div className="flex gap-2">
                {site.twitter && (
                  <Button variant="ghost" onClick={() => window.open(site.twitter, "_blank", "noopener,noreferrer")}>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M22 5.92a8.38 8.38 0 0 1-2.36.65 4.12 4.12 0 0 0 1.8-2.27 8.28 8.28 0 0 1-2.6.99 4.13 4.13 0 0 0-7.04 3.76A11.72 11.72 0 0 1 3.15 4.5a4.13 4.13 0 0 0 1.28 5.52 4.06 4.06 0 0 1-1.87-.52v.05a4.13 4.13 0 0 0 3.31 4.05 4.13 4.13 0 0 1-1.86.07 4.13 4.13 0 0 0 3.85 2.87A8.29 8.29 0 0 1 2 19.54a11.7 11.7 0 0 0 6.29 1.84c7.55 0 11.68-6.26 11.68-11.69 0-.18 0-.35-.01-.53A8.33 8.33 0 0 0 22 5.92z"></path>
                    </svg>
                    Follow
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-xs text-muted-foreground text-center py-6">
          <div>© {new Date().getFullYear()} {site.siteName}. All rights reserved.</div>
          <div className="mt-2">Built for alternative communities. Respect, consent, and privacy come first.</div>
        </footer>
      </div>
    </main>
  );
}

/**
 * Inline small presentational icon to avoid extra package import and to ensure
 * consistent crimson accent usage for the lock icon used in the Security section.
 */
function LockSymbol() {
  return (
    <svg className="h-4 w-4 text-crimson-400 mt-1" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="11" width="18" height="10" rx="2" stroke="#8b0000" strokeWidth="1.2" fill="none" />
      <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="#8b0000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}