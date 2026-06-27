import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  PhoneCall,
  Globe,
  Music,
  Camera,
  ZapOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

/**
 * JoinNow.tsx — fixed TypeScript errors
 *
 * Key fixes:
 * - joinUrl is now a guaranteed string (const joinUrl: string = ...)
 * - All calls that expected a string receive a string (no string | undefined)
 * - Safe guards for window/navigator for SSR
 * - Tailwind canonical classes applied (shrink-0)
 *
 * Drop this file in place of the previous JoinNow.tsx.
 */

type Feature = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  highlight?: boolean;
};

type FeaturesPayload = {
  tagline?: string;
  features: Feature[];
  heroTitle?: string;
  heroSubtitle?: string;
  joinUrl?: string;
};

const FALLBACK_FEATURES: FeaturesPayload = {
  tagline: "Secure. Private. Infernal.",
  heroTitle: "Join Infernal Social",
  heroSubtitle:
    "Connect with friends, family, and like-minded creators in a privacy-first community built for the alternative and occult scenes.",
  joinUrl: "/signup",
  features: [
    { id: "f1", title: "End-to-end encrypted chat", description: "Client-side encryption for messages and media.", icon: "ShieldCheck", highlight: true },
    { id: "f2", title: "Realtime voice & video", description: "WebRTC calls with DB signaling fallback for reliability.", icon: "PhoneCall" },
    { id: "f3", title: "Verified creators & portfolios", description: "Highlight your work with rich profiles and galleries.", icon: "Camera" },
    { id: "f4", title: "Mobile-first & PWA", description: "Fast, responsive UI with an installable PWA.", icon: "PhoneCall" },
    { id: "f5", title: "Privacy-first defaults", description: "Private profiles, granular sharing and block/report controls.", icon: "ShieldCheck" },
    { id: "f6", title: "Custom ringtones & presence", description: "Personalize call ringtones and presence indicators.", icon: "Music" },
  ],
};

export default function JoinNow() {
  const [data, setData] = useState<FeaturesPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Safe site URL/origin for sharing (guarded for SSR)
  const siteUrl = useMemo(() => (typeof window !== "undefined" ? window.location.href : "/"), []);
  const origin = useMemo(() => (typeof window !== "undefined" ? window.location.origin : ""), []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchFeatures() {
      setLoading(true);
      try {
        const res = await fetch("/api/features", { signal: controller.signal });
        if (!res.ok) throw new Error("no remote features");
        const json = (await res.json()) as FeaturesPayload;
        if (mounted && json) setData(json);
      } catch {
        setData(FALLBACK_FEATURES);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchFeatures();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

 // Replace the existing effect that sets title/meta with this block
useEffect(() => {
  const title = `${data?.heroTitle ?? FALLBACK_FEATURES.heroTitle} • Infernal Social`;

  if (typeof document !== "undefined") {
    document.title = title;

    // Guarantee `desc` is a string (never undefined) before using it with DOM APIs
    const desc: string = String(data?.heroSubtitle ?? FALLBACK_FEATURES.heroSubtitle ?? "");

    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", desc);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }
}, [data]);

  const features = data?.features ?? FALLBACK_FEATURES.features;
  const heroTitle = data?.heroTitle ?? FALLBACK_FEATURES.heroTitle;
  const heroSubtitle = data?.heroSubtitle ?? FALLBACK_FEATURES.heroSubtitle;

  // IMPORTANT: ensure joinUrl is a string (no undefined)
  const joinUrl: string = String(data?.joinUrl ?? FALLBACK_FEATURES.joinUrl ?? "/signup");

  const handleJoinNow = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        navigator.sendBeacon("/api/track", JSON.stringify({ action: "join_click", page: "join", ts: Date.now() }));
      }
    } catch {
      /* ignore */
    }

    if (joinUrl.startsWith("http")) {
      window.open(joinUrl, "_self");
    } else {
      window.location.assign(joinUrl);
    }
  };

  const handleNativeShare = async () => {
    const title = heroTitle ?? "Join Infernal Social";
    const text = heroSubtitle ?? "";
    const url = siteUrl;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        // @ts-ignore navigator.share may not be typed in some environments
        await (navigator as any).share({ title, text, url });
        return;
      } catch {
        // fallback to twitter
      }
    }
    handleShareTwitter();
  };

  const copyInviteLink = async () => {
    try {
      const full = joinUrl.startsWith("http") ? joinUrl : `${origin}${joinUrl}`;
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(full);
      } else {
        const input = document.createElement("input");
        input.value = full;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      toast.success("Invite link copied to clipboard");
    } catch {
      toast.error("Copy failed — please copy manually");
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${heroTitle} — ${heroSubtitle}`);
    const url = encodeURIComponent(joinUrl.startsWith("http") ? joinUrl : `${origin}${joinUrl}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer,width=600,height=420");
  };

  const handleShareExternal = (provider: "mastodon" | "telegram" | "facebook") => {
    const url = encodeURIComponent(joinUrl.startsWith("http") ? joinUrl : `${origin}${joinUrl}`);
    const text = encodeURIComponent(`${heroTitle} — ${heroSubtitle}`);
    let shareUrl = "";
    if (provider === "mastodon") shareUrl = `https://mastodon.social/share?text=${text}%20${url}`;
    else if (provider === "telegram") shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
    else shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=700,height=550");
  };

  const renderIcon = (icon?: string) => {
    switch (icon) {
      case "ShieldCheck":
        return <ShieldCheck className="h-6 w-6 text-crimson-400" aria-hidden />;
      case "Zap":
        return <Zap className="h-6 w-6 text-crimson-400" aria-hidden />;
      case "PhoneCall":
        return <PhoneCall className="h-6 w-6 text-crimson-400" aria-hidden />;
      case "Camera":
        return <Camera className="h-6 w-6 text-crimson-400" aria-hidden />;
      case "Music":
        return <Music className="h-6 w-6 text-crimson-400" aria-hidden />;
      default:
        return <Users className="h-6 w-6 text-crimson-400" aria-hidden />;
    }
  };

  return (
    <main className="min-h-screen bg-black text-slate-100 antialiased">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <div className="flex items-start gap-4">
            <div className="rounded-full h-14 w-14 flex items-center justify-center bg-[#120000] border border-crimson-700">
              <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#8b0000" strokeWidth="1.2" fill="#0b0b0b" />
                <path d="M7 12c1.333-3 5-3 6 0 1-3 4-3 5 0" stroke="#8b0000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{heroTitle}</h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{heroSubtitle}</p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <Badge variant="default" className="bg-[#111] text-crimson-300 border border-crimson-600">Privacy-first</Badge>
              <Button onClick={handleJoinNow} className="bg-crimson-600 hover:bg-crimson-700 text-white hidden sm:inline-flex">
                <UserPlus className="h-4 w-4 mr-2" /> Join Now
              </Button>
            </div>
          </div>
        </header>

        <section aria-labelledby="features-heading" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg bg-neutral-900/60 p-6 border border-neutral-800">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <ShieldCheck className="h-10 w-10 text-crimson-400" />
                </div>
                <div>
                  <h2 id="features-heading" className="text-xl font-semibold">Why join Infernal Social?</h2>
                  <p className="mt-2 text-sm text-muted-foreground">We offer a secure, respectful space for alternative communities to connect, create, and collaborate. Built for creators, privacy-conscious users, and communities with niche interests.</p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.slice(0, 4).map((f) => (
                      <article key={f.id} className={`p-3 rounded-md border ${f.highlight ? "border-crimson-600 bg-[#140000]" : "border-neutral-800"}`}>
                        <div className="flex items-start gap-3">
                          <div className="shrink-0">{renderIcon(f.icon)}</div>
                          <div>
                            <div className="text-sm font-semibold">{f.title}</div>
                            <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-neutral-900/60 p-6 border border-neutral-800">
              <h3 className="text-lg font-semibold mb-3">All features</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((f) => (
                  <li key={f.id} className="flex items-start gap-3 p-3 rounded-md border border-neutral-800">
                    <div className="mt-1">{renderIcon(f.icon)}</div>
                    <div>
                      <div className="text-sm font-semibold">{f.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{f.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-neutral-900/60 p-6 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold">Built for creators & communities</h4>
                <p className="text-sm text-muted-foreground mt-1">Monetize, showcase, and collaborate — with privacy controls that respect you and your audience.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground">Trusted by</div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-[#151515] border border-neutral-800 flex items-center justify-center text-sm">A</div>
                  <div className="h-8 w-8 rounded bg-[#151515] border border-neutral-800 flex items-center justify-center text-sm">B</div>
                  <div className="h-8 w-8 rounded bg-[#151515] border border-neutral-800 flex items-center justify-center text-sm">C</div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6 sticky top-6">
            <div className="rounded-lg bg-neutral-900/60 p-5 border border-neutral-800">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <UserPlus className="h-8 w-8 text-crimson-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Ready to join?</h3>
                  <p className="text-sm text-muted-foreground mt-1">Create your account and start connecting securely.</p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <Button onClick={handleJoinNow} className="w-full bg-crimson-600 hover:bg-crimson-700 text-white">
                  <UserPlus className="h-4 w-4 mr-2" /> Join Now
                </Button>

                <Button variant="ghost" onClick={() => window.location.assign("/pricing")} className="w-full border border-neutral-800">
                  View Plans & Pricing <ExternalLink className="h-4 w-4 ml-2" />
                </Button>

                <div className="pt-2 border-t border-neutral-800"></div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div>Invite friends</div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={handleNativeShare} aria-label="Share">
                      <Share2 className="h-4 w-4 text-crimson-300" />
                    </Button>
                    <Button variant="ghost" onClick={copyInviteLink} aria-label="Copy invite link">
                      <Copy className="h-4 w-4 text-crimson-300" />
                    </Button>
                    <Button variant="ghost" onClick={() => handleShareExternal("telegram")} aria-label="Share to Telegram">
                      <svg className="h-4 w-4 text-crimson-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M21 3L3 10.5l4.5 1.6L9 21l3-2 3 2 6-15.5L21 3z"></path>
                      </svg>
                    </Button>
                    <Button variant="ghost" onClick={() => handleShareExternal("mastodon")} aria-label="Share to Mastodon">
                      <svg className="h-4 w-4 text-crimson-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2c-5.52 0-10 3.58-10 8 0 4.42 4.48 8 10 8s10-3.58 10-8c0-4.42-4.48-8-10-8z"></path>
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-neutral-900/60 p-4 border border-neutral-800 text-xs">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-crimson-400" />
                <div>
                  <div className="font-semibold text-sm">Secure by design</div>
                  <div className="text-muted-foreground text-xs">Encryption-first architecture & opt-in privacy settings.</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-neutral-900/60 p-4 border border-neutral-800 text-xs">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Quick links</div>
                <div className="text-muted-foreground text-xs">Explore</div>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="/about" className="text-crimson-300 hover:underline inline-flex items-center gap-2"><ExternalLink className="h-4 w-4" /> About</a></li>
                <li><a href="/features" className="text-crimson-300 hover:underline inline-flex items-center gap-2"><Zap className="h-4 w-4" /> Features</a></li>
                <li><a href="/privacy" className="text-crimson-300 hover:underline inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Privacy</a></li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
