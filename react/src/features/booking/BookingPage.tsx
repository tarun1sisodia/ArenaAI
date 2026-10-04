import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { contact } from "../../data/contact";
import { packages, vehicles, cities, routes, type VehicleId, type TourPackage, type Route } from "../../data/catalogue";
import { formatInr, localTomorrow, localPackages, type LocalPackageKey } from "./fareEngine";
import {
  calculateServerFare,
  mapVehicleTier,
  formatInquiryPhone,
  sanitizeInquiryName,
  type ServerFareBreakdown,
  type BookingSelectionPayload,
} from "../../services/api";
import { useCustomerAuth } from "../../auth/customerAuth";
import { getMyProfile } from "../../services/customerAuthApi";
import { clearPendingBookingIntent, clearPaymentResumeReference, getPendingBookingIntent, storePendingBookingIntent, storePaymentResumeReference } from "../../auth/bookingIntentStorage";
import { CustomerApiError, createBookingIntent, finalizeBookingIntent, getBookingIntent } from "../../services/customerAuthApi";
import { WhatsAppIcon } from "../../components/icons";
import { BookingAssistant } from "./BookingAssistant";
import { fetchLiveFleet, fetchPublishedCatalog, type PublicCatalogItem, type PublicFleetVehicle } from "../../services/catalog";
import { LocationCombobox } from "../../components/search/LocationCombobox";

interface UnsupportedRequest {
  kind: "route" | "tour";
  origin?: string;
  destination?: string;
  name?: string;
  suggestions: Route[];
}

function normalizePlace(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).filter((key) => record[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function cityIdForSearch(value: string): string | null {
  const normalized = normalizePlace(value);
  return cities.find((city) => normalized === city.id || normalized === normalizePlace(city.name))?.id ?? null;
}

function findSupportedRoute(origin: string, destination: string): Route | null {
  const from = cityIdForSearch(origin);
  const to = cityIdForSearch(destination);
  if (!from || !to) return null;
  return routes.find((route) => route.from === from && route.to === to) ?? null;
}

function supportedRouteSuggestions(origin: string, destination: string): Route[] {
  const from = cityIdForSearch(origin);
  const to = cityIdForSearch(destination);
  const nearby = routes.filter((route) => (from && (route.from === from || route.to === from)) || (to && (route.from === to || route.to === to)));
  return [...new Map([...nearby, ...routes].map((route) => [route.id, route])).values()].slice(0, 5);
}

function UnavailableBookingRequest({ request, selectedVehicleId, message }: { request: UnsupportedRequest | null; selectedVehicleId: VehicleId; message?: string | null }) {
  if (!request) {
    return <section className="rounded-2xl border border-primary/30 bg-sandstone-wash/70 p-space-lg" role={message ? "alert" : "status"}><div className="flex items-start gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary" aria-hidden="true">{message ? "info" : "hourglass_top"}</span><p className="font-body-md">{message || "Checking route availability before showing vehicles…"}</p></div></section>;
  }
  return <section className="rounded-2xl border border-primary/30 bg-sandstone-wash/70 p-space-lg md:p-space-xl" role="alert" aria-live="polite">
    <div className="flex items-start gap-3"><span className="material-symbols-outlined text-icon-28 text-primary" aria-hidden="true">route</span><div><p className="font-label-caps text-label-caps uppercase tracking-widest text-terracotta-sandstone font-bold">Route not in our catalogue</p><h2 className="font-headline-sm text-headline-sm text-ink-midnight font-bold mt-1">{request.kind === "route" ? `${request.origin} → ${request.destination} is not currently available` : "That tour is not currently available"}</h2><p className="font-body-md text-on-surface-variant mt-2 leading-relaxed">We do not have a published route, package, or trip for this search, so we have not shown vehicle availability. Our desk can still check a custom charter by phone or WhatsApp.</p></div></div>
    <div className="flex flex-col sm:flex-row gap-2 mt-space-md"><a className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-white font-semibold" href={`tel:${contact.phone}`}><span className="material-symbols-outlined text-icon-18" aria-hidden="true">call</span>Call {contact.phoneDisplay}</a><a className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-white font-semibold" href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hello SK Baghel Travels, please check a custom booking for ${request.origin ?? request.name ?? "my requested tour"}${request.destination ? ` to ${request.destination}` : ""}.`)}`} target="_blank" rel="noreferrer"><WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />WhatsApp the desk</a></div>
    {request.suggestions.length > 0 && <div className="mt-space-lg"><h3 className="font-title-lg text-title-lg text-ink-charcoal font-semibold">Try one of these supported routes</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">{request.suggestions.map((route) => { const from = cities.find((city) => city.id === route.from)?.name ?? route.from; const to = cities.find((city) => city.id === route.to)?.name ?? route.to; return <a key={route.id} className="rounded-xl border border-border-warm bg-surface-container-lowest px-3 py-3 hover:border-primary transition-colors" href={`/book.html?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&vehicle=${selectedVehicleId}&trip=one-way`}><span className="block font-semibold text-ink-charcoal">{from} → {to}</span><span className="text-xs text-on-surface-variant">From {formatInr(route.fares.sedan)} by Sedan</span></a>; })}</div></div>}
    <a className="inline-flex mt-space-md text-primary font-semibold hover:underline" href="/en/routes/">Browse all supported routes ↗</a>
  </section>;
}

type BookingStep = 1 | 2 | 3;
type BookingMode = "outstation" | "local" | "package";

interface VehicleOption {
  id: VehicleId;
  name: string;
  subtitle: string;
  image: string;
  badge?: string;
  badgeClass?: string;
  guests: string;
  luggage: string;
  features: string[];
  editorialPitch: string;
  alwaysRoundTrip: boolean;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: "sedan",
    name: "Sedan",
    subtitle: "Maruti Suzuki Dzire Prime or Toyota Etios Platinum",
    image: "/assets/fleet/sedan.webp",
    guests: "4 Seats",
    luggage: "2 Bags",
    features: ["Dual Climate AC", "USB Fast Charging", "Yamuna Expressway FastTag"],
    editorialPitch: "Ideal for solo voyagers or intimate couples traveling light",
    alwaysRoundTrip: false,
  },
  {
    id: "ertiga",
    name: "Ertiga",
    subtitle: "Smart Hybrid E-Tech • Elevated Ride Height",
    image: "/assets/fleet/ertiga.webp",
    guests: "6 Seats",
    luggage: "3 Bags",
    features: ["Roof Mounted AC Louvers", "Flexible 3rd Row", "Spacious Cabin"],
    editorialPitch: "Compact family comfort with extra legroom & elevated highway perspective",
    alwaysRoundTrip: false,
  },
  {
    id: "innova",
    name: "Innova Crysta",
    subtitle: "6+1 Individual Captain Armchairs • Whisper-Quiet Cabin",
    image: "/assets/fleet/innova.webp",
    badge: "Most Popular • Concierge Choice",
    badgeClass: "bg-primary text-on-primary",
    guests: "6 Seats",
    luggage: "4 Bags",
    features: ["Captain Armchairs", "Triple Climate Auto AC", "Chilled Mineral Water"],
    editorialPitch: "The undisputed gold standard for Yamuna Expressway cruising with zero fatigue",
    alwaysRoundTrip: false,
  },
  {
    id: "tempo",
    name: "Tempo Traveller",
    subtitle: "12-Passenger High-Roof Touring Coach",
    image: "/assets/fleet/tempo.webp",
    badge: "Always Booked as Round Trip",
    badgeClass: "bg-terracotta-deep text-white font-bold",
    guests: "12 Seats",
    luggage: "8 Bags",
    features: ["Individual AC Louvers", "Dedicated Luggage Bay", "Full Reclining Seats"],
    editorialPitch: "Tailored for joint families, corporate retreats, and international delegations",
    alwaysRoundTrip: true,
  },
  {
    id: "urbania",
    name: "Force Urbania",
    subtitle: "Monocoque Whisper Body • Aircraft Recliner Seating",
    image: "/assets/fleet/urbania.webp",
    badge: "Always Booked as Round Trip",
    badgeClass: "bg-gold-accent/20 text-ink-charcoal font-bold",
    guests: "16 Seats",
    luggage: "10 Bags",
    features: ["Starry Ambient Ceiling", "European Sound Isolation", "Airplane-Style Recliners"],
    editorialPitch: "Diplomatic, presidential transit with private lounge privacy glass",
    alwaysRoundTrip: true,
  },
];

const PACKAGE_UPGRADES: Record<VehicleId, number> = {
  sedan: 0,
  ertiga: 800,
  innova: 1800,
  tempo: 3500,
  urbania: 5500,
};

function formatBookingDate(value: string): string {
  if (!value) return "Select date";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Select date" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
export function BookingPage() {
  const { user, accessToken, loading: authLoading, configured, signInWithGoogle } = useCustomerAuth();
  // One booking flow: 1 = trip & vehicle, 2 = guest details and fare review, 3 = confirmation voucher.
  const [step, setStep] = useState<BookingStep>(1);

  // Track if user came with a pre-selected route from homepage or query params
  const [hasPreselectedRoute, setHasPreselectedRoute] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get("from") && params.get("to"));
  });
  const [queryReady, setQueryReady] = useState<boolean>(false);
  const [unsupportedRequest, setUnsupportedRequest] = useState<UnsupportedRequest | null>(null);

  // Booking Mode & Route Parameters
  const [bookingMode, setBookingMode] = useState<BookingMode>("outstation");
  const [isLocalTourEntry, setIsLocalTourEntry] = useState(false);
  const [originName, setOriginName] = useState<string>("Agra");
  const [destinationName, setDestinationName] = useState<string>("Delhi");
  const [localPickupName, setLocalPickupName] = useState<string>("Agra");
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
  const [localPackageKey, setLocalPackageKey] = useState<LocalPackageKey>("8hr-80km");
  const [packageSlug, setPackageSlug] = useState<string>("taj-mahal-sunrise-tour");
  const [selectedLocalCatalogId, setSelectedLocalCatalogId] = useState<string | null>(null);
  const [selectedPackageCatalogId, setSelectedPackageCatalogId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<VehicleId>("sedan");

  // One shared published catalogue powers the service selectors in Step 1.
  const [liveTrips, setLiveTrips] = useState<PublicCatalogItem[]>([]);
  const [liveFleet, setLiveFleet] = useState<PublicFleetVehicle[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<"loading" | "ready" | "error">("loading");
  const [catalogLoadError, setCatalogLoadError] = useState<string | null>(null);

  // Datetime fields
  const [pickupDate, setPickupDate] = useState<string>(localTomorrow());
  const [pickupTime, setPickupTime] = useState<string>("06:00");
  const [returnDate, setReturnDate] = useState<string>(localTomorrow());
  const [returnTime, setReturnTime] = useState<string>("20:00");

  // Passenger & Contact Fields
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [pickupAddress, setPickupAddress] = useState<string>("");
  const [dropAddress, setDropAddress] = useState<string>("");
  const [flightTrainNumber, setFlightTrainNumber] = useState<string>("");
  const [specialNotes, setSpecialNotes] = useState<string>("");

  // Promo code
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [activePromoCode, setActivePromoCode] = useState<string>("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  // Authoritative Server Fare State (Single Source of Truth)
  const [serverFare, setServerFare] = useState<ServerFareBreakdown | null>(null);
  const [loadingFare, setLoadingFare] = useState<boolean>(false);
  const [fareError, setFareError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeIntent, setActiveIntent] = useState<{ intentId: string; resumeSecret: string; idempotencyKey: string } | null>(null);
  const [activeIntentPayload, setActiveIntentPayload] = useState<string | null>(null);
  const [intentCreateKey, setIntentCreateKey] = useState<string | null>(null);
  const [intentCreatePayload, setIntentCreatePayload] = useState<string | null>(null);
  const [acceptUpdatedFare, setAcceptUpdatedFare] = useState(false);
  const restoreIntentStarted = useRef(false);

  // Confirmed booking state
  const [confirmedTicketId, setConfirmedTicketId] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number>(0);

  function updateRouteLocation(field: "origin" | "destination", value: string) {
    const nextOrigin = field === "origin" ? value : originName;
    const nextDestination = field === "destination" ? value : destinationName;
    if (field === "origin") setOriginName(value);
    else setDestinationName(value);
    if (findSupportedRoute(nextOrigin, nextDestination)) {
      setUnsupportedRequest(null);
    } else {
      setUnsupportedRequest({
        kind: "route",
        origin: nextOrigin,
        destination: nextDestination,
        suggestions: supportedRouteSuggestions(nextOrigin, nextDestination),
      });
    }
  }

  // Selected vehicle metadata
  const fleetOptions = useMemo<VehicleOption[]>(() => {
    const activeFleet = liveFleet.filter((vehicle) => vehicle.active);
    if (activeFleet.length === 0) return VEHICLE_OPTIONS;
    return activeFleet.map((vehicle) => {
      const fallback = VEHICLE_OPTIONS.find((option) => option.id === vehicle.id) ??
        VEHICLE_OPTIONS.find((option) => mapVehicleTier(option.id) === vehicle.tier) ??
        VEHICLE_OPTIONS[0];
      return {
        ...fallback,
        id: fallback.id,
        name: vehicle.name || fallback.name,
        guests: `${vehicle.seats} Seats`,
        luggage: `${vehicle.bags} Bags`,
        subtitle: fallback.subtitle,
        alwaysRoundTrip: fallback.alwaysRoundTrip,
      };
    });
  }, [liveFleet]);
  const selectedVehicle = useMemo<VehicleOption>(() => {
    return fleetOptions.find((v) => v.id === selectedVehicleId) || fleetOptions[0] || VEHICLE_OPTIONS[0];
  }, [fleetOptions, selectedVehicleId]);

  // Selected tour package metadata
  const selectedPackage = useMemo<TourPackage>(() => {
    return (
      packages.find((p) => p.slug === packageSlug || p.id === packageSlug) ||
      packages[0]
    );
  }, [packageSlug]);

  // Published admin-managed offerings shown in the three service-mode controls.
  // Unavailable items remain visible in admin but must not be bookable.
  const localCatalogTrips = useMemo(
    () =>
      liveTrips.filter(
        (item) =>
          item.availability !== "unavailable" &&
          (item.type === "tour" || item.type === "ride") &&
          (item.tripType === "local-tour" || item.tripType === "airport-transfer" || item.tripType === null),
      ),
    [liveTrips],
  );

  const packageCatalogTrips = useMemo(
    () => liveTrips.filter((item) => item.availability !== "unavailable" && (item.type === "package" || item.type === "tour")),
    [liveTrips],
  );

  const selectedLocalCatalog = useMemo(
    () => localCatalogTrips.find((item) => item.id === selectedLocalCatalogId) ?? null,
    [localCatalogTrips, selectedLocalCatalogId],
  );

  const selectedPackageCatalog = useMemo(
    () => packageCatalogTrips.find((item) => item.id === selectedPackageCatalogId) ?? null,
    [packageCatalogTrips, selectedPackageCatalogId],
  );

  const bookingSelection = useMemo<BookingSelectionPayload>(() => {
    if (bookingMode === "package") {
      return selectedPackageCatalog
        ? { kind: "package", id: selectedPackageCatalog.id, source: "catalog", slug: selectedPackageCatalog.slug }
        : { kind: "package", id: selectedPackage.id, source: "curated", slug: selectedPackage.slug };
    }
    if (bookingMode === "local") {
      const pickupLocation = localPickupName.trim() || "Agra";
      if (selectedLocalCatalog) {
        return {
          kind: "local",
          id: selectedLocalCatalog.id,
          source: "catalog",
          slug: selectedLocalCatalog.slug,
          tripType: selectedLocalCatalog.type === "ride" || selectedLocalCatalog.tripType === "airport-transfer" ? "airport-transfer" : "local-tour",
          pickupLocation,
        };
      }
      return {
        kind: "local",
        id: localPackageKey,
        source: "curated",
        tripType: localPackageKey === "airport-transfer" ? "airport-transfer" : "local-tour",
        localPackageKey,
        pickupLocation,
        ...(localPackageKey === "airport-transfer" ? { transferTarget: "Agra Cantt Airport / Station" } : {}),
      };
    }
    const route = findSupportedRoute(originName, destinationName);
    const routeId = route?.id ?? `${normalizePlace(originName).replace(/\s+/g, "-")}-to-${normalizePlace(destinationName).replace(/\s+/g, "-")}`;
    return { kind: "outstation", id: routeId, tripType, originName: originName.trim(), destinationName: destinationName.trim() };
  }, [bookingMode, selectedPackageCatalog, selectedPackage, localPickupName, selectedLocalCatalog, localPackageKey, originName, destinationName, tripType]);

  const selectedTripName = useMemo(() => {
    if (bookingMode === "package") return selectedPackageCatalog?.title ?? selectedPackage.name;
    if (bookingMode === "local") return selectedLocalCatalog?.title ?? localPackages[localPackageKey].label;
    return `${originName.trim()} → ${destinationName.trim()}`;
  }, [bookingMode, selectedPackageCatalog, selectedPackage, selectedLocalCatalog, localPackageKey, originName, destinationName]);

  // Read URL query parameters on initial mount to pre-fill funnel
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    const qTrip = params.get("trip");
    if (qTrip === "local") {
      setIsLocalTourEntry(true);
      setBookingMode("local");
    } else if (qTrip === "round" || qTrip === "round-trip") {
      setBookingMode("outstation");
      setTripType("round-trip");
    } else if (qTrip === "one-way") {
      setBookingMode("outstation");
      setTripType("one-way");
    }

    const qFrom = params.get("from");
    const qTo = params.get("to");
    if (qFrom && qTo) {
      setHasPreselectedRoute(true);
      setBookingMode("outstation");
      if (!findSupportedRoute(qFrom, qTo)) {
        setUnsupportedRequest({
          kind: "route",
          origin: qFrom,
          destination: qTo,
          suggestions: supportedRouteSuggestions(qFrom, qTo),
        });
      }
    }

    if (qFrom) {
      const matchCity = cities.find((c) => c.id === qFrom.toLowerCase());
      setOriginName(matchCity ? matchCity.name : qFrom);
      setLocalPickupName(matchCity ? matchCity.name : qFrom);
    }

    if (qTo) {
      const matchCity = cities.find((c) => c.id === qTo.toLowerCase());
      setDestinationName(matchCity ? matchCity.name : qTo);
    }

    const qPkg = params.get("package") || params.get("pkg");
    if (qPkg) {
      if (qPkg === "8hr-80km" || qPkg === "12hr-120km" || qPkg === "airport-transfer") {
        setBookingMode("local");
        setLocalPackageKey(qPkg as LocalPackageKey);
      } else {
        const matchTour = packages.find((p) => p.slug === qPkg || p.id === qPkg);
        if (matchTour) {
          // Homepage Local Taxi selections use the existing package catalogue;
          // keep the package fare/payment contract while preserving the local-tour UI intent.
          setBookingMode("package");
          setPackageSlug(matchTour.slug);
        } else {
          setUnsupportedRequest({ kind: "tour", name: qPkg, suggestions: routes.slice(0, 5) });
        }
      }
    }

    const qVeh = params.get("vehicle");
    if (qVeh) {
      const match = VEHICLE_OPTIONS.find((v) => v.id === qVeh || mapVehicleTier(v.id) === qVeh);
      if (match) {
        setSelectedVehicleId(match.id);
      }
    }

    const qDate = params.get("date");
    if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
      setPickupDate(qDate);
      setReturnDate(qDate);
    }
    const qReturnDate = params.get("returnDate");
    if (qReturnDate && /^\d{4}-\d{2}-\d{2}$/.test(qReturnDate)) setReturnDate(qReturnDate);
    const qReturnTime = params.get("returnTime");
    if (qReturnTime && /^\d{2}:\d{2}$/.test(qReturnTime)) setReturnTime(qReturnTime);

    const qStep = params.get("step");
    const hasTripSelection = Boolean(qFrom && qTo) || Boolean(qPkg) || qTrip === "local";
    if (qStep === "2" && hasTripSelection) setStep(2);
    else setStep(1);
    setQueryReady(true);
  }, []);

  // Load published trips from live catalog
  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([fetchPublishedCatalog(), fetchLiveFleet()]).then(([tripsResult, fleetResult]) => {
      if (!isMounted) return;
      if (tripsResult.status === "fulfilled") {
        const items = tripsResult.value;
        const bookable = items.filter((i) => i.type !== "place" && i.type !== "vehicle" && i.availability !== "unavailable");
        setLiveTrips(bookable);
        setCatalogStatus("ready");
        setCatalogLoadError(null);
        const qPkg = new URLSearchParams(window.location.search).get("package") || new URLSearchParams(window.location.search).get("pkg");
        const livePackage = qPkg ? bookable.find((item) => item.slug === qPkg || item.id === qPkg) : null;
        if (livePackage) {
          setUnsupportedRequest(null);
          setBookingMode("package");
          setSelectedPackageCatalogId(livePackage.id);
          setPackageSlug(livePackage.slug);
        }
      }
      if (tripsResult.status === "rejected") {
        setCatalogStatus("error");
        setCatalogLoadError("We could not verify the live trip catalogue. Please choose a curated option or try again.");
      }
      if (fleetResult.status === "fulfilled") {
        setLiveFleet(fleetResult.value);
        const current = fleetResult.value.find((vehicle) => vehicle.active && (vehicle.id === selectedVehicleId || vehicle.tier === mapVehicleTier(selectedVehicleId)));
        if (!current) {
          const first = fleetResult.value.find((vehicle) => vehicle.active);
          if (first) {
            const matching = VEHICLE_OPTIONS.find((option) => option.id === first.id || mapVehicleTier(option.id) === first.tier);
            if (matching) setSelectedVehicleId(matching.id);
          }
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const catalogSelectionError =
    (selectedPackageCatalogId && catalogStatus !== "loading" && !selectedPackageCatalog) ||
    (selectedLocalCatalogId && catalogStatus !== "loading" && !selectedLocalCatalog)
      ? catalogStatus === "error"
        ? catalogLoadError || "The live trip catalogue could not be checked. Please select another offering or retry."
        : "This live offering is no longer bookable. Select a current offering from the list before continuing."
      : null;
  const isAvailabilityBlocked = Boolean(unsupportedRequest || catalogSelectionError) || (hasPreselectedRoute && !queryReady);

  useEffect(() => {
    if (restoreIntentStarted.current || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("restoreIntent") !== "1") return;
    restoreIntentStarted.current = true;
    const pending = getPendingBookingIntent();
    if (!pending) {
      setSubmitError("That saved booking continuation has expired. Please review your trip details and start again.");
      return;
    }
    setIsSubmitting(true);
    void getBookingIntent(pending.intentId, pending.resumeSecret).then(({ payload, quote }) => {
      const restoredSelection = payload.bookingSelection;
      setOriginName(restoredSelection?.kind === "outstation" ? restoredSelection.originName : payload.originName ?? "Agra");
      setLocalPickupName(restoredSelection?.kind === "local" ? restoredSelection.pickupLocation : payload.originName ?? "Agra");
      setDestinationName(restoredSelection?.kind === "outstation" ? restoredSelection.destinationName : payload.destinationName ?? "Delhi");
      setHasPreselectedRoute(restoredSelection?.kind === "outstation");
      setQueryReady(true);
      setBookingMode(restoredSelection?.kind === "package" ? "package" : restoredSelection?.kind === "local" ? "local" : restoredSelection?.kind === "outstation" ? "outstation" : payload.localPackageKey ? "local" : payload.packageId ? "package" : payload.tripType === "local-tour" || payload.tripType === "airport-transfer" ? "local" : "outstation");
      setIsLocalTourEntry(restoredSelection?.kind === "local" || (!restoredSelection && (payload.tripType === "local-tour" || payload.tripType === "airport-transfer")));
      setTripType(restoredSelection?.kind === "outstation" ? restoredSelection.tripType : payload.tripType === "round-trip" ? "round-trip" : "one-way");
      setLocalPackageKey(restoredSelection?.kind === "local" ? restoredSelection.localPackageKey ?? "8hr-80km" : payload.localPackageKey ?? "8hr-80km");
      setSelectedPackageCatalogId(restoredSelection?.kind === "package" && restoredSelection.source === "catalog" ? restoredSelection.id : payload.packageId && !restoredSelection ? payload.packageId : null);
      setSelectedLocalCatalogId(restoredSelection?.kind === "local" && restoredSelection.source === "catalog" ? restoredSelection.id : null);
      if (restoredSelection?.kind === "package") setPackageSlug(restoredSelection.slug);
      else if (payload.packageId && !restoredSelection) setPackageSlug(payload.packageId);
      const vehicleId: Record<string, VehicleId> = { sedan: "sedan", ertiga: "ertiga", "innova-crysta": "innova", "tempo-traveller": "tempo", urbania: "urbania" };
      setSelectedVehicleId(vehicleId[payload.vehicleTier] ?? "sedan");
      setPickupDate(payload.pickupDatetime.slice(0, 10));
      setPickupTime(payload.pickupDatetime.slice(11, 16));
      setReturnDate((payload.returnDatetime ?? payload.pickupDatetime).slice(0, 10));
      setReturnTime((payload.returnDatetime ?? payload.pickupDatetime).slice(11, 16));
      setFullName(payload.customerName);
      setPhone(payload.customerPhone);
      setEmail(payload.customerEmail ?? "");
      setPickupAddress(payload.pickupAddress);
      setDropAddress(payload.dropAddress ?? "");
      setFlightTrainNumber(payload.flightTrainNumber ?? "");
      setSpecialNotes(payload.specialNotes ?? "");
      setPromoCodeInput(payload.promoCode ?? "");
      setActivePromoCode(payload.promoCode ?? "");
      setServerFare(quote);
      setStep(2);
      setActiveIntent(pending);
      setActiveIntentPayload(stableSerialize(payload));
      setSubmitError(params.get("auth") === "cancelled" ? "Google sign-in was cancelled. Your trip and contact details are restored; continue when ready." : null);
    }).catch((error) => {
      setSubmitError(error instanceof Error ? error.message : "Could not restore the saved booking. Please start again.");
      clearPendingBookingIntent();
    }).finally(() => setIsSubmitting(false));
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    const metadata = user?.user_metadata as Record<string, unknown> | undefined;
    const identityName = [metadata?.full_name, metadata?.name].find((value) => typeof value === "string" && value.trim());
    void getMyProfile(accessToken).then((profile) => {
      if (!active) return;
      setFullName((current) => current || profile.fullName || (typeof identityName === "string" ? identityName.trim() : ""));
      setEmail((current) => current || profile.email || user?.email || "");
      setPhone((current) => current || profile.phone || user?.phone || "");
      setProfileLoadError(null);
    }).catch(() => {
      if (!active) return;
      setFullName((current) => current || (typeof identityName === "string" ? identityName.trim() : ""));
      setEmail((current) => current || user?.email || "");
      setPhone((current) => current || user?.phone || "");
      setProfileLoadError("We could not load your saved contact details. Please check or enter them manually.");
    });
    return () => { active = false; };
  }, [accessToken, user?.id]);

  // Compute ISO datetimes for server calculation and submission
  const pickupDatetimeIso = useMemo(() => {
    return `${pickupDate}T${pickupTime}:00+05:30`;
  }, [pickupDate, pickupTime]);

  const returnDatetimeIso = useMemo(() => {
    if (tripType === "round-trip" || selectedVehicle.alwaysRoundTrip) {
      return `${returnDate}T${returnTime}:00+05:30`;
    }
    return undefined;
  }, [tripType, selectedVehicle.alwaysRoundTrip, returnDate, returnTime]);

  // Route fields exist only for outstation trips. Local services and packages carry
  // their pickup/service or package identity in bookingSelection instead.
  const effectiveOrigin = bookingSelection.kind === "outstation"
    ? bookingSelection.originName
    : bookingSelection.kind === "local"
      ? bookingSelection.pickupLocation
      : "";
  const effectiveDestination = bookingSelection.kind === "outstation"
    ? bookingSelection.destinationName
    : bookingSelection.kind === "local"
      ? bookingSelection.transferTarget ?? (bookingSelection.tripType === "airport-transfer" ? "Agra Cantt Airport / Station" : selectedTripName)
      : "";

  // Primary Server Fare Fetcher: calls POST /api/v1/fares/calculate
  // Rule F3: Never compute or send money or distance from client!
  const fetchAuthoritativeFare = useCallback(async () => {
    setLoadingFare(true);
    setFareError(null);

    try {
      const payloadVehicleTier = mapVehicleTier(selectedVehicleId);
      const res = await calculateServerFare({
        vehicleTier: payloadVehicleTier,
        bookingSelection,
        pickupDatetime: pickupDatetimeIso,
        returnDatetime: returnDatetimeIso,
        promoCode: activePromoCode || undefined,
      });

      setServerFare(res);
      if (activePromoCode) {
        if (res.promoValid) {
          setPromoMessage(`Promo code applied: ₹${res.discountAmount} discount`);
        } else {
          setPromoMessage("Invalid or inapplicable promo code.");
        }
      }
    } catch (err: any) {
      console.warn("Server fare calculation warning:", err);
      setFareError(err?.message || "Failed to fetch authoritative fare from server.");
    } finally {
      setLoadingFare(false);
    }
  }, [bookingSelection, selectedVehicleId, pickupDatetimeIso, returnDatetimeIso, activePromoCode]);

  // Debounced auto-fetch on route, vehicle, datetime, or promo changes
  useEffect(() => {
    if (isAvailabilityBlocked) {
      setServerFare(null);
      setFareError(null);
      return;
    }
    const timer = setTimeout(() => {
      fetchAuthoritativeFare();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAuthoritativeFare, isAvailabilityBlocked]);

  // Handle promo code submit
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle.alwaysRoundTrip) {
      setPromoMessage("Group commercial vehicles (Tempo / Urbania) cannot use promo codes.");
      return;
    }
    const clean = promoCodeInput.trim().toUpperCase();
    if (!clean) {
      setActivePromoCode("");
      setPromoMessage(null);
      return;
    }
    setActivePromoCode(clean);
  };

  // Step transitions
  const handleProceedFromStep1 = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep(2);
  };

  // Account authorization precedes creating the payable booking. Form PII and fare inputs go
  // to a short-lived server intent; only the one-time secret is kept in tab-scoped storage.
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverFare) {
      setSubmitError("Fare quote is still calculating. Please wait a moment.");
      return;
    }
    if (authLoading) {
      setSubmitError("Checking your Google sign-in session. Please try again in a moment.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const cleanPhone = formatInquiryPhone(phone);
      const cleanName = sanitizeInquiryName(fullName);
      const payload = {
        vehicleTier: mapVehicleTier(selectedVehicleId),
        bookingSelection,
        pickupAddress: pickupAddress.trim(),
        dropAddress: dropAddress.trim() || undefined,
        pickupDatetime: pickupDatetimeIso,
        returnDatetime: returnDatetimeIso,
        customerName: cleanName,
        customerPhone: cleanPhone,
        customerEmail: email.trim() || undefined,
        flightTrainNumber: flightTrainNumber.trim() || undefined,
        specialNotes: specialNotes.trim() || undefined,
        promoCode: serverFare.promoValid && serverFare.promoCode ? serverFare.promoCode : undefined,
      };

      const payloadFingerprint = stableSerialize(payload);
      let intent = activeIntent;
      if (intent && activeIntentPayload !== payloadFingerprint) {
        // The customer edited the restored draft. Do not finalize stale server-side form data.
        clearPendingBookingIntent();
        intent = null;
        setActiveIntent(null);
        setActiveIntentPayload(null);
        setAcceptUpdatedFare(false);
      }
      if (!intent) {
        if (!configured && !accessToken) {
          throw new Error("Google sign-in is not configured on this build. Please contact the travel desk before continuing.");
        }
        if (intentCreatePayload && intentCreatePayload !== payloadFingerprint) {
          setIntentCreateKey(null);
          setIntentCreatePayload(null);
        }
        const reuseKey = intentCreatePayload === payloadFingerprint ? intentCreateKey : null;
        const idempotencyKey = reuseKey ?? (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; const v = c === "x" ? r : (r & 0x3) | 0x8; return v.toString(16); }));
        setIntentCreateKey(idempotencyKey);
        setIntentCreatePayload(payloadFingerprint);
        clearPendingBookingIntent();
        const created = await createBookingIntent(payload, idempotencyKey);
        if (!created.resumeSecret) throw new Error("The booking is saved, but its secure continuation could not be restored. Please submit once more.");
        intent = { intentId: created.intentId, resumeSecret: created.resumeSecret, idempotencyKey };
        storePendingBookingIntent(intent);
        setActiveIntent(intent);
        setActiveIntentPayload(payloadFingerprint);
        setIntentCreateKey(null);
        setIntentCreatePayload(null);
      }

      if (!accessToken) {
        if (!configured) throw new Error("Google sign-in is not configured. Your saved booking is safe; please contact the travel desk.");
        await signInWithGoogle("/book.html?restoreIntent=1");
        return;
      }

      try {
        const result = await finalizeBookingIntent(intent.intentId, intent.resumeSecret, accessToken, acceptUpdatedFare);
        storePaymentResumeReference({
          bookingId: result.booking.id,
          ticketId: result.booking.ticketId,
          idempotencyKey: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        });
        clearPendingBookingIntent();
        setActiveIntent(null);
        setActiveIntentPayload(null);
        setAcceptUpdatedFare(false);
        setIntentCreateKey(null);
        setIntentCreatePayload(null);
        window.location.assign("/payment/resume/");
      } catch (finalizeError) {
        if (finalizeError instanceof CustomerApiError && finalizeError.code === "FARE_RECONFIRMATION_REQUIRED") {
          const refreshed = await getBookingIntent(intent.intentId, intent.resumeSecret);
          setServerFare(refreshed.quote);
          setAcceptUpdatedFare(true);
          setSubmitError(`The server fare changed to ${formatInr(refreshed.quote.totalFare)} (advance ${formatInr(refreshed.quote.advanceAmount)}). Review the updated amount above and click again to accept it before payment.`);
          return;
        }
        throw finalizeError;
      }
    } catch (err) {
      console.error("Booking authorization/payment error:", err);
      setSubmitError(err instanceof Error ? err.message : "Could not prepare your booking. Your payment has not been started.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test-only helper. It is intentionally unreachable in production UI.
  const handleSimulatePayment = () => {
    if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_PAYMENT_SIMULATION !== "true") return;
    const mockTicket = `AGR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmedTicketId(mockTicket);
    setAmountPaid(serverFare?.advanceAmount ?? 700);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep(3);
  };

  const startAnotherBooking = () => {
    clearPendingBookingIntent();
    clearPaymentResumeReference();
    setActiveIntent(null);
    setActiveIntentPayload(null);
    setIntentCreateKey(null);
    setIntentCreatePayload(null);
    setAcceptUpdatedFare(false);
    setBookingMode("outstation");
    setIsLocalTourEntry(false);
    setHasPreselectedRoute(false);
    setQueryReady(true);
    setUnsupportedRequest(null);
    setOriginName("Agra");
    setDestinationName("Delhi");
    setLocalPickupName("Agra");
    setTripType("one-way");
    setLocalPackageKey("8hr-80km");
    setPackageSlug(packages[0]?.slug ?? "taj-mahal-sunrise-tour");
    setSelectedLocalCatalogId(null);
    setSelectedPackageCatalogId(null);
    setSelectedVehicleId("sedan");
    const nextDate = localTomorrow();
    setPickupDate(nextDate);
    setReturnDate(nextDate);
    setPickupTime("06:00");
    setReturnTime("20:00");
    setPickupAddress("");
    setDropAddress("");
    setFlightTrainNumber("");
    setSpecialNotes("");
    setPromoCodeInput("");
    setActivePromoCode("");
    setPromoMessage(null);
    setServerFare(null);
    setFareError(null);
    setSubmitError(null);
    setConfirmedTicketId("");
    setAmountPaid(0);
    setStep(1);
    if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Is current view rendering the Guest Details form?
  const isGuestFormStep = step === 2;
  const isVoucherStep = step === 3;

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen">
      {/* BREADCRUMB STRIP */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-gutter flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm overflow-x-auto whitespace-nowrap">
            <a className="hover:text-primary transition-colors" href="/en/">Home</a>
            <span className="material-symbols-outlined text-icon-14">chevron_right</span>
            <span className="text-on-surface-variant">Booking</span>
            <span className="material-symbols-outlined text-icon-14">chevron_right</span>
            <span className="text-primary font-semibold">
              {step === 1
                ? hasPreselectedRoute ? "Step 1: Route & Vehicle" : "Step 1: Trip & Vehicle"
                : isGuestFormStep
                ? "Step 2: Guest Details & Fare Review"
                : isVoucherStep
                ? "Step 3: Confirmed Voucher"
                : "Booking"}
            </span>
          </nav>
          <div className="hidden sm:flex items-center gap-2 text-body-lg text-secondary">
            <span className="w-2 h-2 rounded-full bg-success-jade inline-block animate-pulse"></span>
            <span>Live Fastify Fare Engine Connected</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl">
        {/* One canonical three-step booking tracker */}
        <section className="w-full bg-surface-container-low rounded-xl p-space-md shadow-sm border border-border-warm/60" aria-label="Booking progress">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
            {[
              { number: 1, title: hasPreselectedRoute ? "Route & Vehicle" : "Trip & Vehicle" },
              { number: 2, title: "Guest & Fare Review" },
              { number: 3, title: "Confirmed Voucher" },
            ].map((item) => (
              <button
                key={item.number}
                type="button"
                disabled={item.number === 3 || item.number > step}
                onClick={() => item.number < step && setStep(item.number as BookingStep)}
                aria-current={step === item.number ? "step" : undefined}
                className={`flex items-center gap-space-sm p-space-sm rounded-lg text-left transition-all disabled:cursor-default ${step === item.number ? "bg-surface-container-lowest shadow-sm border border-border-warm ring-1 ring-primary/20" : "bg-surface-container-lowest/50 opacity-85"}`}
              >
                <span className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${step > item.number ? "bg-success-jade text-on-primary" : step === item.number ? "bg-primary text-on-primary" : "bg-surface-container-highest text-secondary"}`}>
                  {step > item.number ? <span className="material-symbols-outlined text-icon-20">check</span> : item.number}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone tracking-wider font-bold">Step {item.number}{step === item.number ? " • Active" : step > item.number ? " • Completed" : " • Upcoming"}</span>
                  <span className="font-title-md text-title-md text-ink-charcoal font-semibold truncate">{item.title}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* STEP 1: TRIP & VEHICLE SELECTION */}
        {step === 1 && (
          <div className="flex flex-col gap-space-xl">
            {/* TRIP MODE SELECTOR & CONFIGURATION HEADER */}
            <header className="bg-surface-container-lowest rounded-xl p-space-lg lg:p-space-xl shadow-sm border border-border-warm flex flex-col gap-space-md">
              {isLocalTourEntry ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm bg-sandstone-wash/80 p-space-md rounded-xl border border-border-warm/80">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-icon-24">landscape</span>
                    </span>
                    <div className="min-w-0">
                      <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone tracking-widest font-bold">
                        Local Taxi Booking
                      </span>
                      <h1 className="font-headline-sm text-headline-sm text-ink-midnight tracking-tight font-bold truncate">
                        {selectedTripName}
                      </h1>
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant shrink-0">Tour date: {formatBookingDate(pickupDate)}</span>
                </div>
              ) : hasPreselectedRoute ? (
                /* PRE-SELECTED ROUTE HEADER (Clean, No Distracting Inputs) */
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm bg-sandstone-wash/80 p-space-md rounded-xl border border-border-warm/80">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-icon-24">route</span>
                    </span>
                    <div>
                      <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone tracking-widest font-bold">
                        Authoritative Outstation Route
                      </span>
                      <h1 className="font-headline-sm text-headline-sm text-ink-midnight tracking-tight font-bold">
                        {originName} → {destinationName}
                      </h1>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <a
                      href={`/en/routes/?from=${encodeURIComponent(originName)}&to=${encodeURIComponent(destinationName)}`}
                      className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline bg-surface px-3 py-1.5 rounded-lg border border-border-warm shadow-xs transition-colors"
                    >
                      <span>Change Route</span>
                      <span className="material-symbols-outlined text-icon-14">open_in_new</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* GENERIC MODE SELECTOR HEADER (For direct /book visits) */
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                  <div>
                    <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone tracking-widest font-bold">
                      Authoritative Server Booking Engine
                    </span>
                    <h1 className="font-headline-lg text-headline-lg text-ink-midnight tracking-tight mt-0.5">
                      Plan Your Ride &amp; Select Vehicle Tier
                    </h1>
                  </div>
                  {/* Trip Mode Switcher */}
                  <div className="inline-flex p-1 bg-surface-container-low rounded-lg border border-border-warm/60 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => { setBookingMode("outstation"); setUnsupportedRequest(null); }}
                      className={`px-3.5 py-1.5 rounded-md font-label-lg text-xs font-semibold transition-all ${
                        bookingMode === "outstation" ? "bg-primary text-on-primary shadow-xs" : "text-ink-slate hover:text-ink-charcoal"
                      }`}
                    >
                      Outstation Route
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBookingMode("local"); setLocalPickupName("Agra"); setUnsupportedRequest(null); }}
                      className={`px-3.5 py-1.5 rounded-md font-label-lg text-xs font-semibold transition-all ${
                        bookingMode === "local" ? "bg-primary text-on-primary shadow-xs" : "text-ink-slate hover:text-ink-charcoal"
                      }`}
                    >
                      Local Tour / Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBookingMode("package"); setUnsupportedRequest(null); }}
                      className={`px-3.5 py-1.5 rounded-md font-label-lg text-xs font-semibold transition-all ${
                        bookingMode === "package" ? "bg-primary text-on-primary shadow-xs" : "text-ink-slate hover:text-ink-charcoal"
                      }`}
                    >
                      Tour Package
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Trip Parameter Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm pt-space-xs border-t border-border-warm/60">
                {/* Outstation Mode: keep both LocationIQ fields editable even
                    when the homepage preselected an initial route. */}
                {bookingMode === "outstation" && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="origin-input" className="font-label-lg text-xs font-bold text-ink-slate">Pickup Origin City</label>
                      <LocationCombobox
                        id="origin-input"
                        value={originName}
                        onChange={(value) => updateRouteLocation("origin", value)}
                        placeholder="Search pickup city, airport, landmark..."
                        label="Pickup Origin City"
                        triggerIcon="trip_origin"
                        showLocationIqBadge={false}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="dest-input" className="font-label-lg text-xs font-bold text-ink-slate">Destination City</label>
                      <LocationCombobox
                        id="dest-input"
                        value={destinationName}
                        onChange={(value) => updateRouteLocation("destination", value)}
                        placeholder="Search destination city, airport, landmark..."
                        label="Destination City"
                        triggerIcon="pin_drop"
                        showLocationIqBadge={false}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="triptype-select" className="font-label-lg text-xs font-bold text-ink-slate">Trip Direction</label>
                      <select
                        id="triptype-select"
                        value={tripType}
                        onChange={(e) => setTripType(e.target.value as "one-way" | "round-trip")}
                        className="px-3 py-2 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="one-way">One-Way Drop</option>
                        <option value="round-trip">Round-Trip Return</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Local Mode */}
                {bookingMode === "local" && (
                  <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-1">
                    <label htmlFor="local-pkg-select" className="font-label-lg text-xs font-bold text-ink-slate">Select Local Tour / Transfer</label>
                    <select
                      id="local-pkg-select"
                      value={selectedLocalCatalogId ? `live:${selectedLocalCatalogId}` : localPackageKey}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.startsWith("live:")) {
                          setSelectedLocalCatalogId(value.slice(5));
                        } else {
                          setSelectedLocalCatalogId(null);
                          setLocalPackageKey(value as LocalPackageKey);
                        }
                      }}
                      className="px-3 py-2 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <optgroup label="Standard local services">
                        <option value="8hr-80km">{localPackages["8hr-80km"].label}</option>
                        <option value="12hr-120km">{localPackages["12hr-120km"].label}</option>
                        <option value="airport-transfer">{localPackages["airport-transfer"].label}</option>
                      </optgroup>
                      {localCatalogTrips.length > 0 && (
                        <optgroup label="Published tours & transfers">
                          {localCatalogTrips.map((item) => (
                            <option key={item.id} value={`live:${item.id}`}>
                              {item.title} — {item.durationText || "Custom itinerary"}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                {/* Package Mode */}
                {bookingMode === "package" && (
                  <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-1">
                    <label htmlFor="package-select" className="font-label-lg text-xs font-bold text-ink-slate">{isLocalTourEntry ? "Selected Local Tour" : "Select Tour Package"}</label>
                    <select
                      id="package-select"
                      value={selectedPackageCatalogId ? `live:${selectedPackageCatalogId}` : `static:${packageSlug}`}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.startsWith("live:")) {
                          const item = packageCatalogTrips.find((entry) => entry.id === value.slice(5));
                          setSelectedPackageCatalogId(value.slice(5));
                          if (item) setPackageSlug(item.slug);
                        } else {
                          setSelectedPackageCatalogId(null);
                          setPackageSlug(value.slice(7));
                        }
                      }}
                      className="px-3 py-2 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <optgroup label="Curated heritage packages">
                        {packages.map((pkg) => (
                          <option key={pkg.slug} value={`static:${pkg.slug}`}>
                            {pkg.name} ({pkg.duration})
                          </option>
                        ))}
                      </optgroup>
                      {packageCatalogTrips.length > 0 && (
                        <optgroup label="Published desk packages">
                          {packageCatalogTrips.map((item) => (
                            <option key={item.id} value={`live:${item.id}`}>
                              {item.title} — {item.durationText || "Custom itinerary"}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                {/* Pickup Date & Time */}
                <div className={`flex flex-col gap-1 ${hasPreselectedRoute ? "sm:col-span-2" : ""}`}>
                  <label htmlFor="pickup-date-input" className="font-label-lg text-xs font-bold text-ink-slate">Pickup Date &amp; Time</label>
                  <div className="flex gap-1.5">
                    <input
                      id="pickup-date-input"
                      type="date"
                      value={pickupDate}
                      onChange={(e) => {
                        const nextPickup = e.target.value;
                        setPickupDate(nextPickup);
                        if (returnDate < nextPickup) {
                          setReturnDate(nextPickup);
                        }
                      }}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker();
                        } catch {}
                      }}
                      min={localTomorrow()}
                      className="w-3/5 px-2.5 py-2 rounded-lg border border-border-warm bg-surface font-body-sm text-xs text-on-surface focus:outline-none cursor-pointer"
                    />
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-2/5 px-2 py-2 rounded-lg border border-border-warm bg-surface font-body-sm text-xs text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                {bookingMode === "outstation" && (tripType === "round-trip" || selectedVehicle.alwaysRoundTrip) && (
                  <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-2">
                    <label htmlFor="return-date-input" className="font-label-lg text-xs font-bold text-ink-slate">Return Date &amp; Time</label>
                    <div className="flex gap-1.5">
                      <input
                        id="return-date-input"
                        type="date"
                        value={returnDate}
                        min={pickupDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch {}
                        }}
                        className="w-3/5 px-2.5 py-2 rounded-lg border border-border-warm bg-surface font-body-sm text-xs text-on-surface focus:outline-none cursor-pointer"
                      />
                      <input
                        id="return-time-input"
                        type="time"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-2/5 px-2 py-2 rounded-lg border border-border-warm bg-surface font-body-sm text-xs text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Plain Sentence Banner for Force Vehicles */}
              {selectedVehicle.alwaysRoundTrip && (
                <div className="w-full bg-sandstone-wash border border-primary/30 rounded-xl p-space-md flex items-start gap-space-sm mt-1">
                  <span className="material-symbols-outlined text-primary text-icon-24 shrink-0 mt-0.5">
                    info
                  </span>
                  <div className="flex flex-col">
                    <p className="font-title-md text-title-md text-ink-midnight font-bold">
                      This vehicle is always booked as a round trip.
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
                      Force commercial vehicles (Tempo Traveller &amp; Force Urbania) operate under commercial charter regulations and are dispatched from our central fleet hub in Agra. All bookings include return mileage and driver allowance.
                    </p>
                  </div>
                </div>
              )}
            </header>

            {isAvailabilityBlocked ? (
              <UnavailableBookingRequest request={unsupportedRequest} selectedVehicleId={selectedVehicleId} message={catalogSelectionError} />
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              {/* Left Column: 5 Vehicle Cards (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <h2 className="font-title-lg text-title-lg text-ink-charcoal font-semibold">
                    Select Your Fleet Class
                  </h2>
                  <span className="font-body-sm text-xs text-secondary">
                    5 Commercial Vehicles Available
                  </span>
                </div>

                {fleetOptions.map((veh) => {
                  const isSelected = selectedVehicleId === veh.id;
                  const localTourPrice = selectedLocalCatalog && selectedLocalCatalog.startingPriceInr > 0
                    ? selectedLocalCatalog.startingPriceInr + (PACKAGE_UPGRADES[veh.id] ?? 0)
                    : localPackages[localPackageKey]?.fares[veh.id];
                  const packageTourPrice = (selectedPackageCatalog?.startingPriceInr || selectedPackage.from) + (PACKAGE_UPGRADES[veh.id] ?? 0);
                  const liveVehicleRate = liveFleet.find((f) => f.id === veh.id || f.tier === mapVehicleTier(veh.id))?.perKm;

                  return (
                    <button
                      key={veh.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedVehicleId(veh.id)}
                      className={`w-full text-left cursor-pointer rounded-xl p-space-md lg:p-space-lg transition-all border ${
                        isSelected
                          ? "bg-surface-container-lowest border-primary ring-2 ring-primary/20 shadow-md"
                          : "bg-surface-container-lowest border-border-warm hover:border-primary/40 shadow-xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row gap-space-md items-start sm:items-center">
                        <div className="relative w-full sm:w-44 h-28 bg-surface-container-low rounded-lg overflow-hidden shrink-0 border border-border-warm/60">
                          <img
                            src={veh.image}
                            alt={veh.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {veh.badge && (
                            <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-label-lg ${veh.badgeClass || "bg-primary text-white"}`}>
                              {veh.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-title-lg text-title-lg text-ink-midnight font-bold">
                                {veh.name}
                              </h3>
                              <p className="font-body-sm text-body-sm text-secondary">
                                {veh.subtitle}
                              </p>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              {bookingMode === "local" && localTourPrice ? (
                                <div className="flex flex-col items-end">
                                  <span className="font-title-lg text-base sm:text-lg font-bold text-primary">
                                    {formatInr(localTourPrice)}
                                  </span>
                                  <span className="font-label-caps text-[10px] text-terracotta-sandstone font-semibold uppercase tracking-wider">
                                    Fixed Tour Tariff
                                  </span>
                                </div>
                              ) : bookingMode === "package" && packageTourPrice ? (
                                <div className="flex flex-col items-end">
                                  <span className="font-title-lg text-base sm:text-lg font-bold text-primary">
                                    {formatInr(packageTourPrice)}
                                  </span>
                                  <span className="font-label-caps text-[10px] text-terracotta-sandstone font-semibold uppercase tracking-wider">
                                    Package Tariff
                                  </span>
                                </div>
                              ) : liveVehicleRate ? (
                                <div className="flex flex-col items-end">
                                  <span className="font-title-lg text-sm sm:text-base font-bold text-ink-midnight">
                                    ₹{liveVehicleRate}/km
                                  </span>
                                  <span className="font-label-caps text-[10px] text-secondary font-medium">
                                    Standard Rate
                                  </span>
                                </div>
                              ) : null}
                              <span className={`font-label-caps text-xs font-bold mt-0.5 ${isSelected ? "text-primary" : "text-ink-slate"}`}>
                                {isSelected ? "Selected Tier" : "Click to Select"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-label-md font-semibold bg-surface-container-low px-2 py-0.5 rounded text-ink-slate border border-border-warm/60">
                              <span className="material-symbols-outlined text-icon-14">groups</span>
                              {veh.guests}
                            </span>
                            <span className="inline-flex items-center gap-1 text-label-md font-semibold bg-surface-container-low px-2 py-0.5 rounded text-ink-slate border border-border-warm/60">
                              <span className="material-symbols-outlined text-icon-14">luggage</span>
                              {veh.luggage}
                            </span>
                            {veh.alwaysRoundTrip && (
                              <span className="inline-flex items-center gap-1 text-label-md font-semibold bg-sandstone-wash text-terracotta-sandstone px-2 py-0.5 rounded border border-primary/20">
                                Round-Trip Policy
                              </span>
                            )}
                          </div>
                          <p className="font-body-sm text-xs text-on-surface-variant italic mt-1">
                            {veh.editorialPitch}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Sticky Server Fare Ledger (4 Cols) */}
              <aside className="lg:col-span-4 sticky top-24">
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md border border-border-warm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between pb-space-sm border-b border-border-warm">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone font-bold tracking-wider">
                        Real-Time Server Quote
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-ink-midnight font-medium">
                        Live Price Ledger
                      </h2>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-sandstone-wash flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-icon-20">verified</span>
                    </span>
                  </div>

                  {/* Route & Vehicle Summary */}
                  <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-1 border border-border-warm/60">
                    <span className="font-label-caps text-label-caps uppercase text-secondary font-bold">
                      Itinerary
                    </span>
                    <div className="font-title-md text-title-md text-ink-charcoal font-semibold leading-snug">
                      {serverFare?.label || selectedTripName}
                    </div>
                    <div className="font-body-sm text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                      <span>Vehicle: <strong>{selectedVehicle.name}</strong></span>
                      {serverFare?.billedKm && (
                        <span>• Billed: <strong>{serverFare.billedKm} km</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Loading State or Server Price Breakdown */}
                  {loadingFare ? (
                    <div className="p-space-lg flex flex-col items-center justify-center gap-2 bg-surface-container-low rounded-xl">
                      <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                      <span className="font-body-sm text-xs text-secondary font-medium">
                        Calculating authoritative fare with Fastify...
                      </span>
                    </div>
                  ) : fareError ? (
                    <div className="p-space-md bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                      <p className="font-bold">Fare Estimation Notice:</p>
                      <p className="mt-0.5">{fareError}</p>
                      <button
                        type="button"
                        onClick={fetchAuthoritativeFare}
                        className="mt-2 text-primary font-bold underline"
                      >
                        Retry calculation
                      </button>
                    </div>
                  ) : serverFare ? (
                    <div className="flex flex-col gap-2 pt-space-xs border-t border-border-warm">
                      <div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface-variant">
                        <span>Base Server Fare:</span>
                        <span className="font-medium">{formatInr(serverFare.baseFare)}</span>
                      </div>

                      {serverFare.nightAllowance > 0 && (
                        <div className="flex justify-between items-center font-body-sm text-body-sm text-terracotta-sandstone">
                          <span>Night Chauffeur Allowance (22:00–05:00):</span>
                          <span>+{formatInr(serverFare.nightAllowance)}</span>
                        </div>
                      )}

                      {serverFare.driverAllowance > 0 && (
                        <div className="flex justify-between items-center font-body-sm text-body-sm text-ink-slate">
                          <span>Commercial Driver Allowance:</span>
                          <span>+{formatInr(serverFare.driverAllowance)}</span>
                        </div>
                      )}

                      {serverFare.discountAmount > 0 && (
                        <div className="flex justify-between items-center font-body-sm text-body-sm text-success-jade">
                          <span>Promotional Discount:</span>
                          <span>-{formatInr(serverFare.discountAmount)}</span>
                        </div>
                      )}

                      <div className="mt-space-xs pt-space-xs border-t border-border-warm flex items-baseline justify-between">
                        <div>
                          <span className="font-title-lg text-title-lg text-ink-midnight font-bold">
                            Total Final Fare
                          </span>
                          <span className="block font-body-sm text-label-md text-success-jade font-semibold">
                            Authoritative Server Rate
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-price-display text-price-display text-primary font-bold">
                            {formatInr(serverFare.totalFare)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-1 p-2.5 rounded-lg bg-sandstone-wash flex justify-between items-center text-xs">
                        <span className="font-semibold text-ink-charcoal">Advance Token to Confirm:</span>
                        <span className="font-bold text-primary">{formatInr(serverFare.advanceAmount)}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Continue CTA Button */}
                  <button
                    onClick={handleProceedFromStep1}
                    disabled={loadingFare || !serverFare}
                    className="w-full py-3.5 px-space-md rounded-xl bg-terracotta-deep text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                    type="button"
                  >
                    <span>Continue to Guest &amp; Fare Review</span>
                    <span className="material-symbols-outlined text-icon-18 group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>

                  <a
                    className="flex items-center justify-center gap-2 py-2.5 px-space-sm rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg text-label-lg transition-colors text-center"
                    style={{ color: "#ffffff" }}
                    href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                      `Hello SK Baghel Travels, I have a question about ${selectedTripName} with ${selectedVehicle.name}.`
                    )}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
                    <span className="text-white font-semibold" style={{ color: "#ffffff" }}>WhatsApp Concierge Desk</span>
                  </a>
                </div>
              </aside>
            </div>
            )}
          </div>
        )}

        {/* GUEST DETAILS & FARE REVIEW FORM (Step 2) */}
        {isGuestFormStep && (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-space-md">
            <div className="w-full bg-surface-container-lowest rounded-xl shadow-md border border-border-warm overflow-hidden">
              {/* Header */}
              <div className="w-full bg-ink-charcoal text-ivory-surface px-space-lg py-space-md flex flex-wrap items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-icon-20 text-gold-accent">contact_phone</span>
                  <h2 className="font-headline-sm text-headline-sm text-ivory-surface tracking-wide uppercase">
                    Passenger Logistics &amp; Review
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-gold-accent hover:text-ivory-surface underline"
                >
                  ← Edit Trip &amp; Vehicle
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitBooking} className="p-space-md md:p-space-lg flex flex-col gap-space-lg">
                {submitError && (
                  <div className="p-space-md bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                    {submitError}
                  </div>
                )}
                <p className="-mb-3 text-sm text-on-surface-variant">Before payment, sign in with Google so this booking is saved to your account and can be resumed if checkout is interrupted.</p>
                {profileLoadError && <p className="-mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">{profileLoadError}</p>}

                {/* Clean prefilled booking summary — mirrors the homepage selection. */}
                <div className="booking-prefill-summary grid grid-cols-2 sm:grid-cols-4 gap-space-sm rounded-lg border border-border-warm/70 bg-surface-container-low p-space-sm">
                  <div><span className="booking-summary-label">Trip</span><strong>{selectedTripName}</strong></div>
                  <div><span className="booking-summary-label">{bookingSelection.kind === "outstation" ? "From" : bookingSelection.kind === "local" ? "Pickup location" : "Pickup address"}</span><strong>{bookingSelection.kind === "outstation" ? effectiveOrigin : bookingSelection.kind === "local" ? bookingSelection.pickupLocation : pickupAddress || "Add pickup address"}</strong></div>
                  <div><span className="booking-summary-label">{bookingSelection.kind === "outstation" ? "To" : bookingSelection.kind === "local" ? "Service" : "Package"}</span><strong>{bookingSelection.kind === "outstation" ? effectiveDestination : bookingSelection.kind === "local" ? selectedTripName : "Itinerary included"}</strong></div>
                  <div><span className="booking-summary-label">Pickup date</span><strong>{formatBookingDate(pickupDate)}</strong></div>
                  <div><span className="booking-summary-label">Vehicle</span><strong>{selectedVehicle.name}</strong></div>
                  {bookingSelection.kind === "outstation" && bookingSelection.tripType === "round-trip" && <div><span className="booking-summary-label">Return</span><strong>{formatBookingDate(returnDate)}</strong></div>}
                </div>
                {/* Contact Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-xs font-bold text-ink-charcoal" htmlFor="bill-name">
                      Full Name *
                    </label>
                    <input
                      id="bill-name"
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rohan Verma"
                      className="px-3 py-2.5 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-xs font-bold text-ink-charcoal" htmlFor="bill-phone">
                      Mobile Phone (with WhatsApp) *
                    </label>
                    <input
                      id="bill-phone"
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 97628 17598"
                      className="px-3 py-2.5 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-xs font-bold text-ink-charcoal" htmlFor="bill-email">
                      Email Address (for Transit Voucher)
                    </label>
                    <input
                      id="bill-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rohan@example.com"
                      className="px-3 py-2.5 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-xs font-bold text-ink-charcoal" htmlFor="bill-flight">
                      Flight / Train Number (Optional)
                    </label>
                    <input
                      id="bill-flight"
                      type="text"
                      value={flightTrainNumber}
                      onChange={(e) => setFlightTrainNumber(e.target.value)}
                      placeholder="e.g. 6E-2041 or 12002 Shatabdi"
                      className="px-3 py-2.5 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Pickup & Drop Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-xs font-bold text-ink-charcoal" htmlFor="bill-pickup">
                      Exact Pickup Address / Porch *
                    </label>
                    <textarea
                      id="bill-pickup"
                      required
                      rows={2}
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Hotel porch, airport gate, or residence"
                      className="px-3 py-2 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-xs font-bold text-ink-charcoal" htmlFor="bill-drop">
                      Drop-off Destination Address
                    </label>
                    <textarea
                      id="bill-drop"
                      rows={2}
                      value={dropAddress}
                      onChange={(e) => setDropAddress(e.target.value)}
                      placeholder="Destination hotel, terminal or address"
                      className="px-3 py-2 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Special Notes & Promo Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md items-start">
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-xs font-bold text-ink-charcoal" htmlFor="bill-notes">
                      Special Notes / Requests
                    </label>
                    <input
                      id="bill-notes"
                      type="text"
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="e.g. Child seat, extra luggage, senior assistance"
                      className="px-3 py-2.5 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  {/* Promo Code Input */}
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-xs font-bold text-ink-charcoal" htmlFor="promo-input">
                      Promotional Voucher Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="promo-input"
                        type="text"
                        disabled={selectedVehicle.alwaysRoundTrip}
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder={selectedVehicle.alwaysRoundTrip ? "N/A for group vans" : "e.g. ASTTCAR500OFF"}
                        className="flex-1 px-3 py-2 rounded-lg border border-border-warm bg-surface font-body-md text-on-surface uppercase disabled:bg-surface-container-low"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={selectedVehicle.alwaysRoundTrip}
                        className="px-4 py-2 rounded-lg bg-surface-container-high text-ink-charcoal font-semibold text-xs hover:bg-surface-container-highest transition-colors disabled:opacity-40"
                      >
                        Apply
                      </button>
                    </div>
                    {promoMessage && (
                      <span className={`text-label-md font-medium ${serverFare?.promoValid ? "text-success-jade" : "text-terracotta-sandstone"}`}>
                        {promoMessage}
                      </span>
                    )}
                  </div>
                </div>

                {/* Server-authoritative payment amount */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border-warm">
                  <label className="font-title-md text-xs font-bold text-ink-charcoal">
                    Advance payment
                  </label>
                  <div className="p-space-md rounded-xl border border-primary bg-sandstone-wash/80">
                    <span className="font-bold text-ink-midnight text-sm block">
                      28% Advance Token ({formatInr(serverFare?.advanceAmount ?? 700)})
                    </span>
                    <span className="text-xs text-secondary font-medium">
                      The server locks this amount for Razorpay. Balance ₹{(serverFare?.totalFare ?? 2500) - (serverFare?.advanceAmount ?? 700)} is payable directly to the chauffeur at destination.
                    </span>
                  </div>
                </div>

                {/* Concierge Desk Call/WhatsApp Notice before Payment */}
                <div className="p-space-md rounded-xl bg-sandstone-wash/90 border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-primary text-icon-24 shrink-0 mt-0.5">
                      support_agent
                    </span>
                    <div className="flex flex-col">
                      <p className="font-title-md text-xs sm:text-sm font-bold text-ink-midnight">
                        Planning custom stops or have questions before paying?
                      </p>
                      <p className="font-body-sm text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        Local tours and transfers have fixed tariffs. Call our central dispatch desk or message on WhatsApp to confirm custom monument timing or complete an instant reservation offline.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <a
                      href="tel:+919762817598"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface border border-border-warm text-ink-charcoal font-label-lg text-xs font-bold hover:bg-surface-container-high transition-colors shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-icon-16 text-primary">call</span>
                      <span>Call Desk</span>
                    </a>
                    <a
                      href="https://wa.me/919762817598?text=Hello%20SK%20Baghel%20Travels%2C%20I%20have%20a%20question%20regarding%20my%20local%20tour%20booking%20before%20payment."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366] text-white font-label-lg text-xs font-bold hover:bg-[#1EBE5D] transition-colors shadow-2xs"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                      </svg>
                      <span>WhatsApp Desk</span>
                    </a>
                  </div>
                </div>

                {/* Submission CTA Buttons */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border-warm">
                  <button
                    type="submit"
                    disabled={isSubmitting || authLoading || !serverFare}
                    className="w-full py-3.5 px-space-md rounded-xl bg-terracotta-deep text-on-primary font-title-lg font-bold hover:bg-terracotta-sunlit transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-icon-20">lock</span>
                    <span>
                      {isSubmitting
                        ? "Saving booking securely…"
                        : acceptUpdatedFare
                          ? `Accept Updated Fare & Pay ${formatInr(serverFare?.advanceAmount ?? 0)}`
                          : `Authorize & Pay ${formatInr(serverFare?.advanceAmount ?? 0)}`}
                    </span>
                  </button>

                  {import.meta.env.DEV && import.meta.env.VITE_ENABLE_PAYMENT_SIMULATION === "true" && (
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      className="w-full py-2 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-ink-slate font-label-lg text-xs font-semibold transition-colors border border-border-warm"
                    >
                      Simulate Payment Authorization (Development Only)
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* SK Concierge */}
            <div className="max-w-2xl w-full mx-auto">
              <BookingAssistant
                vehicleName={selectedVehicle.name}
                tripName={selectedTripName}
                totalFare={serverFare?.totalFare ?? null}
                advanceAmount={serverFare?.advanceAmount ?? null}
                tourDate={pickupDate}
              />
            </div>
          </div>
        )}

        {/* OFFICIAL TRANSIT VOUCHER (Step 3 in Direct Funnel, Step 4 in Fleet-First Funnel) */}
        {isVoucherStep && (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-space-lg">
            {/* Success Banner */}
            <div className="bg-success-jade/10 border border-success-jade/40 rounded-xl p-space-lg flex items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="w-10 h-10 rounded-full bg-success-jade text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-icon-24">verified</span>
                </span>
                <div>
                  <h1 className="font-headline-sm text-headline-sm text-ink-midnight font-bold">
                    Booking Confirmed — Transit Voucher Issued
                  </h1>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Your ride has been registered and verified by SK Baghel Tour &amp; Travels central dispatch.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-secondary block">Official Ticket ID</span>
                <span className="font-title-lg text-title-lg text-primary font-bold tracking-wider">
                  {confirmedTicketId || "AGR-20260927-4821"}
                </span>
              </div>
            </div>

            {/* Voucher Body */}
            <div className="bg-surface-container-lowest rounded-xl shadow-md border border-border-warm overflow-hidden">
              <div className="bg-ink-charcoal text-ivory-surface p-space-md flex items-center justify-between">
                <div>
                  <span className="text-label-lg tracking-widest text-gold-accent uppercase font-bold">
                    SK Baghel Imperial Fleet Charter
                  </span>
                  <h2 className="text-lg font-bold text-white">Chauffeur Transit Voucher</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-secondary-container">Status</span>
                  <span className="block text-success-jade font-bold text-xs">CONFIRMED</span>
                </div>
              </div>

              <div className="p-space-lg flex flex-col gap-space-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md bg-surface-container-low p-space-md rounded-lg">
                  <div>
                    <span className="text-xs text-secondary uppercase font-bold block">Lead Guest</span>
                    <span className="font-title-md text-on-surface font-semibold">{fullName}</span>
                    <span className="text-xs text-on-surface-variant block mt-0.5">{phone} • {email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-secondary uppercase font-bold block">Assigned Vehicle</span>
                    <span className="font-title-md text-on-surface font-semibold">{selectedVehicle.name}</span>
                    <span className="text-xs text-on-surface-variant block mt-0.5">{selectedVehicle.subtitle}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div>
                    <span className="text-xs text-secondary uppercase font-bold block">Pickup Timing</span>
                    <span className="font-title-md text-on-surface font-semibold">{pickupDate} at {pickupTime} IST</span>
                    <span className="text-xs text-on-surface-variant block mt-0.5">Porch: {pickupAddress}</span>
                  </div>
                  <div>
                    <span className="text-xs text-secondary uppercase font-bold block">{bookingSelection.kind === "outstation" ? "Destination &amp; Route" : bookingSelection.kind === "package" ? "Selected Package" : "Local Service"}</span>
                    <span className="font-title-md text-on-surface font-semibold">
                      {serverFare?.label || selectedTripName}
                    </span>
                    <span className="text-xs text-on-surface-variant block mt-0.5">Drop: {dropAddress}</span>
                  </div>
                </div>

                {/* Accounting */}
                <div className="pt-space-sm border-t border-border-warm flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Total Trip Fare:</span>
                    <span className="font-bold text-ink-midnight">{formatInr(serverFare?.totalFare ?? 2500)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-success-jade">
                    <span>Advance Payment Authorized:</span>
                    <span className="font-bold">{formatInr(amountPaid)} (Authorized)</span>
                  </div>
                  <div className="flex justify-between text-sm text-terracotta-sandstone font-bold pt-1 border-t border-border-warm/60">
                    <span>Balance Payable on Pickup:</span>
                    <span>{formatInr(Math.max(0, (serverFare?.totalFare ?? 2500) - amountPaid))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-space-sm">
              <a
                href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                  `*SK Baghel Tour & Travels — Booking Confirmation*\nTicket ID: ${confirmedTicketId || "AGR-20260927-4821"}\nTrip: ${serverFare?.label || selectedTripName}\nVehicle: ${selectedVehicle.name}\nPickup: ${pickupDate} at ${pickupTime}\nPorch: ${pickupAddress}\nTotal: ${formatInr(serverFare?.totalFare ?? 2500)}\nPaid: ${formatInr(amountPaid)}\nBalance on Pickup: ${formatInr(Math.max(0, (serverFare?.totalFare ?? 2500) - amountPaid))}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#ffffff" }}
                className="flex-1 py-3 px-space-md rounded-xl bg-black text-white font-label-lg font-bold flex items-center justify-center gap-2 hover:bg-neutral-900 transition-colors shadow-sm"
              >
                <WhatsAppIcon className="w-5 h-5 shrink-0 text-white" />
                <span className="text-white" style={{ color: "#ffffff" }}>Share Voucher on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-3 rounded-xl bg-sandstone-wash text-primary border border-primary/20 font-label-lg font-bold hover:bg-sandstone-wash/60 transition-colors"
              >
                Print / Save Voucher
              </button>

              <button
                type="button"
                onClick={startAnotherBooking}
                className="px-6 py-3 rounded-xl bg-surface-container-low text-ink-slate font-label-lg font-bold hover:bg-surface-container transition-colors"
              >
                Book Another Trip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
