import { useState, useEffect, useMemo, useCallback } from "react";
import { EDITORIAL_TYPOGRAPHY } from "../layout/EditorialPageTemplate";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";
import { contact } from "../../data/contact";
import { getIndicativeBrowseFare } from "../../fares";
import { loadRoutesManifest } from "../../services/catalogManifest";

export interface CompressedRouteItem {
  o: string;        // Origin
  d: string;        // Destination
  km: number;       // Distance in km (One-Way)
  m: number;        // Duration in minutes
  fh: number;       // Fare Hatchback
  fs: number;       // Fare Sedan
  fe: number;       // Fare Ertiga / SUV
  fi: number;       // Fare Innova Crysta
  ft: number;       // Tempo Traveller Per-KM Rate
  fu: number;       // Force Urbania Per-KM Rate
  c: string;        // Travel Corridor
  toll: 1 | 0;      // Toll inclusion
}

export type VehicleTier = "sedan" | "ertiga" | "innova" | "hatchback" | "tempo" | "urbania";

export interface InstantRouteCalculatorProps {
  initialOrigin?: string;
  initialDestination?: string;
  onSelectRoute?: (slug: string, route: CompressedRouteItem) => void;
  className?: string;
}

export function InstantRouteCalculator({
  initialOrigin = "Agra",
  initialDestination = "Delhi",
  onSelectRoute,
  className = "",
}: InstantRouteCalculatorProps) {
  const [manifest, setManifest] = useState<Record<string, CompressedRouteItem> | null>(null);
  const [originInput, setOriginInput] = useState(initialOrigin);
  const [destInput, setDestInput] = useState(initialDestination);
  const [selectedTier, setSelectedTier] = useState<VehicleTier>("sedan");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    loadRoutesManifest()
      .then((data) => {
        if (isMounted) {
          setManifest(data as any);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const { origins, destinations } = useMemo(() => {
    if (!manifest) return { origins: [], destinations: [] };
    const oSet = new Set<string>();
    const dSet = new Set<string>();
    for (const item of Object.values(manifest)) {
      if (item.o) oSet.add(item.o);
      if (item.d) dSet.add(item.d);
    }
    return {
      origins: Array.from(oSet).sort((a, b) => a.localeCompare(b)),
      destinations: Array.from(dSet).sort((a, b) => a.localeCompare(b)),
    };
  }, [manifest]);

  const matchedEntry = useMemo(() => {
    if (!manifest) return null;
    const cleanO = originInput.trim().toLowerCase();
    const cleanD = destInput.trim().toLowerCase();
    if (!cleanO || !cleanD) return null;

    for (const [slug, item] of Object.entries(manifest)) {
      if (item.o.toLowerCase() === cleanO && item.d.toLowerCase() === cleanD) return { slug, ...item };
    }
    for (const [slug, item] of Object.entries(manifest)) {
      if (
        (item.o.toLowerCase().includes(cleanO) || cleanO.includes(item.o.toLowerCase())) &&
        (item.d.toLowerCase().includes(cleanD) || cleanD.includes(item.d.toLowerCase()))
      ) {
        return { slug, ...item };
      }
    }
    // Fallback: slug search
    const slugKey = `${cleanO.replace(/\s+/g, "-")}-to-${cleanD.replace(/\s+/g, "-")}`;
    for (const [slug, item] of Object.entries(manifest)) {
      if (slug.includes(slugKey)) {
        return { slug, ...item };
      }
    }
    return null;
  }, [manifest, originInput, destInput]);

  const applyRouteSelection = useCallback(
    (slug: string, item: CompressedRouteItem) => {
      const targetUrl = `/en/${slug}/`;
      if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
        window.history.pushState({ slug, o: item.o, d: item.d }, "", targetUrl);
      }
      onSelectRoute?.(slug, item);
    },
    [onSelectRoute]
  );

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.o && e.state.d) {
        setOriginInput(e.state.o);
        setDestInput(e.state.d);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Indicative Browse Engine (Shared Rule Module)
  const indicativeQuote = useMemo(() => {
    if (!matchedEntry) return null;
    const tier = selectedTier === "hatchback" ? "sedan" : selectedTier;
    const quote = getIndicativeBrowseFare(matchedEntry, tier, "one-way");
    if (selectedTier === "hatchback") {
      return {
        ...quote,
        total: matchedEntry.fh || Math.round(quote.total * 0.85),
      };
    }
    return quote;
  }, [matchedEntry, selectedTier]);

  const activeFare = indicativeQuote?.total ?? 0;
  const isGroupVehicle = Boolean(indicativeQuote?.alwaysRoundTrip);
  const billableKm = indicativeQuote?.billedKm ?? (matchedEntry ? matchedEntry.km : 0);

  return (
    <div
      className={`w-full bg-surface-container-lowest border border-border-warm rounded-xl p-space-md lg:p-space-lg shadow-[0_4px_24px_-4px_rgba(24,29,39,0.06)] ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md border-b border-border-warm pb-space-sm">
        <div>
          <span className={EDITORIAL_TYPOGRAPHY.eyebrowSandstone}>0ms In-Memory Corridor Engine</span>
          <h3 className={`${EDITORIAL_TYPOGRAPHY.sectionH2} mt-0.5`}>Instant Outstation Fare Calculator</h3>
        </div>
        <div className="flex items-center gap-1.5 font-body-sm text-xs text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-success-jade animate-pulse" />
          <span className="font-semibold text-ink-slate">982 Outstation Routes</span>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-md">
        <div>
          <label htmlFor="instant-calc-origin" className="block font-label-lg text-xs font-bold text-ink-slate mb-1">
            Pickup Origin
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-terracotta-sandstone pointer-events-none">
              trip_origin
            </span>
            <input
              id="instant-calc-origin"
              type="text"
              list="instant-calc-origins-datalist"
              value={originInput}
              onChange={(e) => setOriginInput(e.target.value)}
              className="w-full pl-9 pr-space-md py-2.5 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Agra, Delhi NCR"
            />
            <datalist id="instant-calc-origins-datalist">
              {origins.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
        </div>
        <div>
          <label htmlFor="instant-calc-dest" className="block font-label-lg text-xs font-bold text-ink-slate mb-1">
            Drop-off Destination
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gold-accent pointer-events-none">
              location_on
            </span>
            <input
              id="instant-calc-dest"
              type="text"
              list="instant-calc-dest-datalist"
              value={destInput}
              onChange={(e) => setDestInput(e.target.value)}
              className="w-full pl-9 pr-space-md py-2.5 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Mathura, Jaipur"
            />
            <datalist id="instant-calc-dest-datalist">
              {destinations.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
        </div>
      </div>

      {/* Vehicle Tier Selector (6 Options) */}
      <div className="mb-space-md">
        <label className="block font-label-lg text-xs font-bold text-ink-slate mb-1.5">Select Vehicle Class</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: "sedan", label: "Sedan", seats: "4 Seater · 2 Bags", icon: "directions_car" },
            { id: "ertiga", label: "Ertiga / SUV", seats: "6 Seater · 3 Bags", icon: "airport_shuttle" },
            { id: "innova", label: "Innova Crysta", seats: "6 Seater · 4 Bags", icon: "directions_car_filled" },
            { id: "tempo", label: "Tempo Traveller", seats: "7-26 Seater", icon: "transportation" },
            { id: "urbania", label: "Force Urbania", seats: "10-13 Luxury", icon: "vip_services" },
            { id: "hatchback", label: "Hatchback", seats: "4 Seater · 2 Bags", icon: "electric_car" },
          ].map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTier(tier.id as VehicleTier)}
              className={`p-2.5 rounded-lg text-left transition-all border ${
                selectedTier === tier.id
                  ? "bg-primary-container text-on-primary-container border-primary font-semibold shadow-xs"
                  : "bg-surface hover:bg-surface-container text-on-surface border-border-warm"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone">{tier.icon}</span>
                <span className="font-title-md text-xs font-bold leading-tight">{tier.label}</span>
              </div>
              <div className="font-body-sm text-[11px] opacity-80 pl-5">{tier.seats}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 0ms Result Calculation Dock */}
      {matchedEntry ? (
        <div className="bg-sandstone-wash/80 border border-border-warm rounded-lg p-space-md transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md mb-space-sm">
            <div>
              <div className="flex items-center gap-space-xs mb-1">
                <span className="font-title-lg text-title-lg text-ink-charcoal font-bold">
                  {matchedEntry.o} → {matchedEntry.d}
                </span>
                <span className="font-label-caps text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-bold uppercase">
                  {matchedEntry.c}
                </span>
              </div>
              <div className="font-body-sm text-xs text-on-surface-variant flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 font-medium text-ink-slate">
                  <span className="material-symbols-outlined text-[14px] text-primary">add_road</span>
                  {matchedEntry.km} km (One-Way)
                </span>
                <span className="flex items-center gap-1 font-medium text-ink-slate">
                  <span className="material-symbols-outlined text-[14px] text-terracotta-sandstone">schedule</span>
                  {Math.floor(matchedEntry.m / 60)}h {matchedEntry.m % 60}m approx
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="block font-body-sm text-xs text-on-surface-variant">
                {isGroupVehicle ? "Indicative Group Fare (Round-Trip Billed)" : "Indicative One-Way Fare"}
              </span>
              <span className={EDITORIAL_TYPOGRAPHY.price}>₹{activeFare.toLocaleString("en-IN")}</span>

              {/* Transparent Breakdown for Tempo / Urbania */}
              {isGroupVehicle && (
                <span className="block font-body-sm text-[10px] text-on-surface-variant mt-0.5 font-medium">
                  Round-trip billed · {billableKm} km · +₹500 Driver
                </span>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 pt-space-xs border-t border-border-warm/60">
            <a
              href={`/en/${matchedEntry.slug}/`}
              onClick={(e) => {
                e.preventDefault();
                applyRouteSelection(matchedEntry.slug, matchedEntry);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ink-charcoal text-ivory-surface font-label-lg text-xs font-semibold hover:bg-ink-slate transition-colors"
            >
              <span>View Route Details</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
            <a
              href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hello SK Baghel Travels, I would like to book a ${selectedTier.toUpperCase()} for ${matchedEntry.o} to ${matchedEntry.d} (${matchedEntry.km} km). Indicative Fare: ₹${activeFare}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#000000] border border-white/15 text-[#ffffff] font-label-lg text-xs font-semibold hover:bg-neutral-900 transition-colors shadow-xs"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
              <span>WhatsApp Concierge</span>
            </a>
            <a
              href={`/book.html?from=${encodeURIComponent(matchedEntry.o)}&to=${encodeURIComponent(matchedEntry.d)}&vehicle=${selectedTier === "hatchback" ? "sedan" : selectedTier}&trip=one-way`}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-sandstone-wash text-primary border border-primary/25 font-label-lg text-xs font-semibold hover:bg-sandstone-wash/60 transition-colors ml-auto"
            >
              <span>Direct Booking Form</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="p-space-md text-center font-body-sm text-xs text-on-surface-variant bg-surface rounded-lg border border-dashed border-border-warm">
          {isLoading ? "Loading routes manifest..." : "Select a pickup origin and destination drop city above to view live fares."}
        </div>
      )}
    </div>
  );
}
