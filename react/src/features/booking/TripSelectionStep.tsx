import { useMemo, useState } from "react";
import {
  resolveCatalogMediaUrl,
  TRIP_TYPE_LABEL,
  type PublicAvailability,
  type PublicTripType,
} from "../../services/catalog";
import { BookingAssistant, type QuickPick } from "./BookingAssistant";

/**
 * Step 2 of the booking flow — "Choose Your Trip".
 *
 * Shown right after the customer selects their fleet (either on this page or
 * preselected from the Fleet page). Lists EVERY bookable trip from the live
 * catalog (the single source of trips) with a search bar, trip-type filters,
 * and live availability. Selecting a trip configures the underlying booking
 * engine (mode / package / route), and the desk's authoritative server fare is
 * quoted for the current vehicle — the client never computes money (rule F3).
 * The SK Concierge assistant sits alongside to guide the choice and can hand
 * off to a human agent.
 */

export interface SelectableTrip {
  key: string;
  source: "curated" | "live";
  slug: string;
  name: string;
  blurb: string;
  duration: string;
  distanceKm: number | null;
  stops: string[];
  /** Desk-published starting price (display data, not a client computation). */
  fromPrice: number;
  image: string | null;
  tripType: PublicTripType;
  availability: PublicAvailability;
  seatsLeft: number | null;
}

interface TripSelectionStepProps {
  trips: SelectableTrip[];
  selectedKey: string;
  onSelect: (trip: SelectableTrip) => void;
  vehicleName: string;
  vehicleImage: string;
  /** Authoritative server quote for the current selection + vehicle. */
  serverTotalFare: number | null;
  serverAdvanceAmount: number | null;
  quoteLoading: boolean;
  quoteError: string | null;
  onContinue: () => void;
  onChangeVehicle: () => void;
  onQuickPick: (pick: QuickPick, trips: SelectableTrip[]) => void;
}

const TRIP_TYPE_FILTERS: { value: PublicTripType | "all"; label: string }[] = [
  { value: "all", label: "All trips" },
  { value: "local-tour", label: "Local sightseeing" },
  { value: "one-way", label: "One-way drops" },
  { value: "round-trip", label: "Round trips" },
  { value: "airport-transfer", label: "Airport / station" },
];

const AVAILABILITY_BADGE: Record<PublicAvailability, { label: (seats: number | null) => string; className: string } | null> = {
  available: null,
  limited: {
    label: (seats) => (seats !== null ? `Only ${seats} left` : "Limited seats"),
    className: "bg-terracotta-sandstone text-on-primary font-bold",
  },
  unavailable: {
    label: () => "On request",
    className: "bg-ink-charcoal text-ivory-surface font-semibold",
  },
};

export function TripSelectionStep({
  trips,
  selectedKey,
  onSelect,
  vehicleName,
  vehicleImage,
  serverTotalFare,
  serverAdvanceAmount,
  quoteLoading,
  quoteError,
  onContinue,
  onChangeVehicle,
  onQuickPick,
}: TripSelectionStepProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PublicTripType | "all">("all");

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trips.filter((trip) => {
      if (typeFilter !== "all" && trip.tripType !== typeFilter) return false;
      if (!q) return true;
      return (
        trip.name.toLowerCase().includes(q) ||
        trip.blurb.toLowerCase().includes(q) ||
        trip.stops.some((s) => s.toLowerCase().includes(q)) ||
        trip.duration.toLowerCase().includes(q)
      );
    });
  }, [trips, search, typeFilter]);

  const selectedTrip = trips.find((t) => t.key === selectedKey) ?? null;
  const inr = (v: number) => `₹${v.toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col gap-space-xl">
      {/* Header */}
      <header className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-border-warm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-space-xs px-2.5 py-1 rounded bg-sandstone-wash text-terracotta-sandstone font-label-caps text-label-caps uppercase tracking-widest mb-space-xs">
              <span className="material-symbols-outlined text-[15px]">route</span>
              Step 2 • Live Desk Catalogue
            </div>
            <h1 className="font-headline-lg text-headline-lg text-ink-charcoal tracking-tight mt-1">
              Choose Your Trip for the {vehicleName}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs leading-relaxed">
              Every trip below is published live from our Agra operations desk — search, compare and pick the
              one you want in your selected vehicle. The booking form comes next.
            </p>
          </div>

          {/* Selected vehicle chip */}
          <div className="flex items-center gap-3 bg-surface-container-low p-space-sm rounded-xl border border-border-warm/60 shrink-0">
            <img
              src={vehicleImage}
              alt={`${vehicleName} selected`}
              className="w-16 h-12 rounded-lg object-cover border border-border-warm/60"
              loading="lazy"
            />
            <div className="flex flex-col">
              <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                Your vehicle
              </span>
              <span className="font-title-md text-title-md text-ink-charcoal font-semibold">{vehicleName}</span>
              <button
                type="button"
                onClick={onChangeVehicle}
                className="text-left font-body-sm text-body-sm text-primary hover:underline w-fit"
              >
                ← Change vehicle
              </button>
            </div>
          </div>
        </div>

        {/* Search bar + trip type filters */}
        <div className="mt-space-md flex flex-col md:flex-row gap-space-sm md:items-center">
          <div className="relative flex-1 min-w-0">
            <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" aria-hidden="true">
              search
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trips — Taj Mahal, Mathura temples, Jaipur, sunrise…"
              aria-label="Search available trips"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-surface-container-low border border-border-warm/60 text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin] md:pb-0" role="group" aria-label="Filter trips by type">
            {TRIP_TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setTypeFilter(f.value)}
                aria-pressed={typeFilter === f.value}
                className={`shrink-0 px-3 py-2 rounded-lg font-label-lg text-label-lg font-semibold transition-colors ${
                  typeFilter === f.value
                    ? "bg-ink-charcoal text-ivory-surface shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-border-warm/60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Trip list + sticky summary/assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        <div className="lg:col-span-8 flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-ink-charcoal">
              {filteredTrips.length} bookable {filteredTrips.length === 1 ? "trip" : "trips"}
            </h2>
            <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone bg-sandstone-wash px-2 py-1 rounded font-semibold">
              Live availability
            </span>
          </div>

          {filteredTrips.length === 0 && (
            <div className="bg-surface-container-lowest rounded-xl border border-border-warm p-space-lg text-center">
              <span className="material-symbols-outlined text-[32px] text-secondary" aria-hidden="true">search_off</span>
              <p className="font-title-md text-title-md text-ink-charcoal font-semibold mt-2">
                No trips match “{search}”
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Try a monument name, city, or clear the filters — or ask our agent on WhatsApp for a custom itinerary.
              </p>
            </div>
          )}

          {filteredTrips.map((trip) => {
            const isSelected = trip.key === selectedKey;
            const badge = AVAILABILITY_BADGE[trip.availability];
            return (
              <button
                key={trip.key}
                type="button"
                onClick={() => onSelect(trip)}
                aria-pressed={isSelected}
                className={`text-left bg-surface-container-lowest rounded-xl p-space-md transition-all cursor-pointer border flex flex-col sm:flex-row gap-space-md ${
                  isSelected
                    ? "ring-2 ring-primary border-primary shadow-md bg-sandstone-wash/20"
                    : "border-border-warm hover:shadow-md"
                }`}
              >
                {trip.image && (
                  <div className="sm:w-40 h-28 rounded-lg overflow-hidden shrink-0 bg-surface-container-high">
                    <img
                      src={resolveCatalogMediaUrl(trip.image)}
                      alt={trip.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <h3 className="font-headline-sm text-headline-sm text-ink-charcoal font-semibold leading-snug">
                      {trip.name}
                    </h3>
                    <div className="text-right shrink-0">
                      <span className="font-price-display text-price-display text-primary font-bold">
                        {inr(trip.fromPrice)}
                      </span>
                      <span className="block font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                        starting from
                      </span>
                    </div>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed line-clamp-2">
                    {trip.blurb}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">schedule</span>
                      {trip.duration}
                    </span>
                    {trip.distanceKm !== null && trip.distanceKm !== undefined && (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">route</span>
                        ~{trip.distanceKm} km
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">location_on</span>
                      {trip.stops.length > 0 ? `${trip.stops.length} stop${trip.stops.length === 1 ? "" : "s"}` : "Direct"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-low font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
                      {TRIP_TYPE_LABEL[trip.tripType]}
                    </span>
                    {badge && (
                      <span className={`px-1.5 py-0.5 rounded font-label-caps text-label-caps uppercase tracking-wider ${badge.className}`}>
                        {badge.label(trip.seatsLeft)}
                      </span>
                    )}
                    {trip.source === "live" && (
                      <span className="inline-flex items-center gap-1 font-label-caps text-label-caps uppercase tracking-wider text-success-jade">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-jade" aria-hidden="true" />
                        Desk live
                      </span>
                    )}
                  </div>
                  {trip.stops.length > 0 && (
                    <p className="font-body-sm text-body-sm text-secondary truncate">
                      {trip.stops.join(" · ")}
                    </p>
                  )}
                </div>
                <div className="self-center shrink-0 hidden sm:flex w-6 h-6 rounded-full border-2 border-border-warm items-center justify-center sm:mr-1" aria-hidden="true">
                  <span
                    className={`w-3 h-3 rounded-full transition-all ${isSelected ? "bg-primary" : "bg-transparent"}`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Sticky summary + assistant */}
        <div className="lg:col-span-4 flex flex-col gap-space-md lg:sticky lg:top-6">
          <BookingAssistant
            step={2}
            vehicleName={vehicleName}
            tripName={selectedTrip?.name ?? null}
            totalFare={serverTotalFare}
            advanceAmount={serverAdvanceAmount}
            tripCount={trips.length}
            onQuickPick={(pick) => onQuickPick(pick, trips)}
          />

          <div className="bg-surface-container-lowest rounded-xl border border-border-warm shadow-sm p-space-md flex flex-col gap-2.5">
            <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary font-bold">
              Trip Summary — Desk Quoted
            </span>
            {selectedTrip ? (
              <>
                <div className="flex justify-between items-start gap-2 font-body-md text-body-md">
                  <span className="text-on-surface-variant">{selectedTrip.name}</span>
                  <span className="font-title-md text-title-md text-ink-charcoal font-semibold text-right shrink-0">
                    from {inr(selectedTrip.fromPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center font-body-md text-body-md text-on-surface-variant">
                  <span>{vehicleName}</span>
                  <span className="font-label-caps text-label-caps uppercase tracking-wider text-secondary">
                    included
                  </span>
                </div>
                <div className="pt-space-xs border-t border-border-warm flex items-baseline justify-between">
                  <span className="font-title-lg text-title-lg text-ink-midnight font-bold">
                    {quoteLoading ? "Quoting…" : "Exact Fare"}
                  </span>
                  {quoteLoading ? (
                    <span className="material-symbols-outlined text-[20px] animate-spin text-secondary" aria-hidden="true">
                      progress_activity
                    </span>
                  ) : quoteError ? (
                    <span className="font-body-sm text-body-sm text-terracotta-sandstone text-right max-w-[180px]">
                      Quote unavailable — the desk will confirm on WhatsApp
                    </span>
                  ) : serverTotalFare !== null ? (
                    <span className="font-price-display text-price-display text-primary font-bold">
                      {inr(serverTotalFare)}
                    </span>
                  ) : null}
                </div>
                {serverAdvanceAmount !== null && !quoteLoading && !quoteError && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Reserve with the advance token of <strong>{inr(serverAdvanceAmount)}</strong> — balance to the
                    chauffeur after the trip. Tolls, parking &amp; chauffeur allowance included.
                  </p>
                )}
              </>
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant">
                Select a trip from the list and the desk engine will quote your exact fare.
              </p>
            )}
            <button
              type="button"
              disabled={!selectedTrip}
              onClick={onContinue}
              className="w-full py-3.5 px-space-md rounded-xl bg-terracotta-sandstone text-on-primary font-label-lg text-label-lg font-semibold hover:bg-terracotta-sunlit transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Continue to Booking Form</span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripSelectionStep;
