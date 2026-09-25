import { useState } from "react";
import type { SupportedLanguage } from "../config";
import { contact } from "../data/contact";

export interface NotFoundPageProps {
  language?: SupportedLanguage;
}

export function NotFoundPage({ language = "en" }: NotFoundPageProps) {
  const [search, setSearch] = useState("");

  const popularLinks = [
    { label: "Taj Mahal Sunrise Tour", url: "/packages/taj-mahal-sunrise-tour" },
    { label: "Agra to Delhi Taxi", url: "/book?from=Agra&to=Delhi" },
    { label: "Agra to Jaipur Cab", url: "/book?from=Agra&to=Jaipur" },
    { label: "Fleet Showroom", url: "/fleet" },
    { label: "All Tour Packages", url: "/packages" },
    { label: "24x7 Dispatch Desk", url: "/contact" },
  ];

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-[calc(100vh-80px)] flex flex-col justify-center">
      {/* 404 HERITAGE DETOUR STAGE */}
      <section className="relative w-full py-space-xl md:py-space-3xl overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div className="lg:col-span-7 space-y-4">
              <span className="px-3 py-1 rounded-full bg-sandstone-wash text-primary font-label-caps text-xs uppercase tracking-wider font-bold inline-block">
                Route Diversion · Error 404
              </span>

              <h1 className="font-headline-hero text-headline-hero text-ink-charcoal leading-[1.08] tracking-tight">
                It seems your chauffeur has taken a{" "}
                <span className="text-primary italic font-normal">detour</span>.
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                The milestone you followed does not exist or may have been relocated. Don&apos;t worry—our 24×7 Taj Ganj
                control room is ready to reroute you immediately.
              </p>

              {/* Instant Search / Recovery */}
              <div className="pt-2 max-w-lg space-y-3">
                <div className="relative">
                  <span className="material-symbols-outlined text-on-surface-variant absolute left-3.5 top-3 text-[20px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search routes, packages or fleet..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-lowest border border-border-warm text-on-surface text-sm focus:outline-none focus:border-primary shadow-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-on-surface-variant font-medium">Quick suggestions:</span>
                  {popularLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.url}
                      className="px-2.5 py-1 rounded-md bg-surface-container hover:bg-surface-container-high text-xs text-ink-charcoal font-medium transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <a
                  href="/"
                  className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">home</span>
                  <span>Return to Home</span>
                </a>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-lg bg-ink-charcoal hover:bg-ink-slate text-surface text-sm font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px] text-gold-accent">chat</span>
                  <span>WhatsApp Concierge</span>
                </a>
              </div>
            </div>

            {/* Right: Architectural Plinth */}
            <div className="lg:col-span-5 relative">
              <div className="relative bg-surface-container-low rounded-2xl p-6 sm:p-8 overflow-hidden shadow-xl border border-border-warm/80">
                <div className="absolute -right-4 -bottom-8 font-headline-hero text-[160px] font-bold text-primary/5 select-none leading-none pointer-events-none">
                  404
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-primary text-white font-label-caps text-[10px] uppercase font-bold">
                      Central Dispatch Guarantee
                    </span>
                    <span className="text-xs text-success-jade font-semibold flex items-center gap-1">
                      <span className="size-2 rounded-full bg-success-jade animate-pulse" />
                      Active Telemetry
                    </span>
                  </div>

                  <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-inner">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDD8qIomeQK1B1K10edswimb7LBthYlOrRfCm9L--JN2JH4dvvFzYC8Eb79o3xkthSTzN4dNVRaVizv7Le5pjLLSw4cmwdgO6n8QDbahmm3pQn2U5-sfrzvMUdNp4S_XcRjqLvJByj2qao2UvBk71J_gEV-VsW2i4nrLyPsy9G6A-WzzawThUTN5DrldRngzssKQD8-dRuuzsZi67EZhbWs9WDgGtnz5d8d0MtM-WmrAXmhI_0exJRflA"
                      alt="Chauffeur stationed outside Mughal gateway in Agra"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-midnight/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-ivory-surface">
                      <span className="font-title-md text-xs font-semibold block">Agra Dispatch Station</span>
                      <span className="font-body-sm text-[11px] text-surface-dim">Taj Ganj Control Room · +91 98765 43210</span>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Need urgent roadside assistance or customized point-to-point dispatch? Call our 24×7 hotline directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
