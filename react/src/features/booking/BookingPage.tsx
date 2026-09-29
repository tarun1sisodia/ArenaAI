import { useState, useMemo, useEffect, useCallback } from "react";
import { contact } from "../../data/contact";
import { packages, vehicles, cities, type VehicleId, type TourPackage } from "../../data/catalogue";
import { formatInr, localTomorrow, localPackages, type LocalPackageKey } from "./fareEngine";
import {
  calculateServerFare,
  createDraftBooking,
  createPaymentCheckout,
  getPaymentStatus,
  mapVehicleTier,
  formatInquiryPhone,
  sanitizeInquiryName,
  type ServerFareBreakdown,
  type BackendTripType,
} from "../../services/api";
import { loadRazorpayScript } from "./razorpay";
import { WhatsAppIcon } from "../../components/icons";
import { TripSelectionStep, type SelectableTrip } from "./TripSelectionStep";
import { BookingAssistant, type QuickPick } from "./BookingAssistant";
import { fetchPublishedCatalog, type PublicCatalogItem } from "../../services/catalog";
import { LocationCombobox } from "../../components/search/LocationCombobox";

type BookingStep = 1 | 2 | 3 | 4;
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
    name: "Executive Sedan",
    subtitle: "Maruti Suzuki Dzire Prime or Toyota Etios Platinum",
    image: "/assets/fleet/sedan.webp",
    guests: "1–3 Guests",
    luggage: "2 Medium Bags",
    features: ["Dual Climate AC", "USB Fast Charging", "Yamuna Expressway FastTag"],
    editorialPitch: "Ideal for solo voyagers or intimate couples traveling light",
    alwaysRoundTrip: false,
  },
  {
    id: "ertiga",
    name: "Maruti Ertiga SUV",
    subtitle: "Smart Hybrid E-Tech • Elevated Ride Height",
    image: "/assets/fleet/ertiga.webp",
    guests: "4–5 Guests",
    luggage: "3–4 Bags",
    features: ["Roof Mounted AC Louvers", "Flexible 3rd Row", "Spacious Cabin"],
    editorialPitch: "Compact family comfort with extra legroom & elevated highway perspective",
    alwaysRoundTrip: false,
  },
  {
    id: "innova",
    name: "Toyota Innova Crysta VIP",
    subtitle: "6+1 Individual Captain Armchairs • Whisper-Quiet Cabin",
    image: "/assets/fleet/innova.webp",
    badge: "Most Popular • Concierge Choice",
    badgeClass: "bg-primary text-on-primary",
    guests: "Up to 6 Guests",
    luggage: "4 Large Suitcases",
    features: ["Captain Armchairs", "Triple Climate Auto AC", "Chilled Mineral Water"],
    editorialPitch: "The undisputed gold standard for Yamuna Expressway cruising with zero fatigue",
    alwaysRoundTrip: false,
  },
  {
    id: "tempo",
    name: "Force Tempo Traveller",
    subtitle: "12 to 16 Passenger High-Roof Touring Coach",
    image: "/assets/fleet/tempo.webp",
    badge: "Always Booked as Round Trip",
    badgeClass: "bg-terracotta-sandstone text-white font-bold",
    guests: "12–16 Guests",
    luggage: "10–12 Large Bags",
    features: ["Individual AC Louvers", "Dedicated Luggage Bay", "Full Reclining Seats"],
    editorialPitch: "Tailored for joint families, corporate retreats, and international delegations",
    alwaysRoundTrip: true,
  },
  {
    id: "urbania",
    name: "Force Urbania Royal Van",
    subtitle: "Monocoque Whisper Body • Aircraft Recliner Seating",
    image: "/assets/fleet/urbania.webp",
    badge: "Always Booked as Round Trip",
    badgeClass: "bg-gold-accent/20 text-ink-charcoal font-bold",
    guests: "10–14 Recliner Pods",
    luggage: "12+ Large Bags",
    features: ["Starry Ambient Ceiling", "European Sound Isolation", "Airplane-Style Recliners"],
    editorialPitch: "Diplomatic, presidential transit with private lounge privacy glass",
    alwaysRoundTrip: true,
  },
];

function formatBookingDate(value: string): string {
  if (!value) return "Select date";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Select date" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
export function BookingPage() {
  // Navigation & Step State
  // For Route-First (3-step flow): 1 = Route & Vehicle, 2 = Guest Details & Review, 3 = Confirmation Voucher
  // For Fleet-First (4-step flow): 1 = Vehicle Tier, 2 = Choose Your Trip, 3 = Guest Details & Review, 4 = Confirmation Voucher
  const [step, setStep] = useState<BookingStep>(1);

  // Track if user came with a pre-selected route from homepage or query params
  const [hasPreselectedRoute, setHasPreselectedRoute] = useState<boolean>(false);

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

  // Fleet-first trip selection (Step 2 in 4-step flow)
  const [liveTrips, setLiveTrips] = useState<PublicCatalogItem[]>([]);
  const [selectedTripKey, setSelectedTripKey] = useState<string | null>(null);

  // Datetime fields
  const [pickupDate, setPickupDate] = useState<string>(localTomorrow());
  const [pickupTime, setPickupTime] = useState<string>("06:00");
  const [returnDate, setReturnDate] = useState<string>(localTomorrow());
  const [returnTime, setReturnTime] = useState<string>("20:00");

  // Passenger & Contact Fields
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
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

  // Confirmed booking state
  const [confirmedTicketId, setConfirmedTicketId] = useState<string>("");
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Selected vehicle metadata
  const selectedVehicle = useMemo<VehicleOption>(() => {
    return (
      VEHICLE_OPTIONS.find((v) => v.id === selectedVehicleId) ||
      VEHICLE_OPTIONS[0]
    );
  }, [selectedVehicleId]);

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
    () => liveTrips.filter((item) => item.availability !== "unavailable" && item.type === "package"),
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

  // Every bookable trip for Fleet-First Step 2: curated static packages + live desk catalog
  const availableTrips = useMemo<SelectableTrip[]>(() => {
    const curated: SelectableTrip[] = packages.map((pkg) => ({
      key: `curated:${pkg.slug}`,
      source: "curated" as const,
      slug: pkg.slug,
      name: pkg.name,
      blurb: pkg.blurb,
      duration: pkg.duration,
      distanceKm: null,
      stops: [...pkg.places],
      fromPrice: pkg.from,
      image: pkg.image,
      tripType: "local-tour",
      availability: "available",
      seatsLeft: null,
    }));
    const live: SelectableTrip[] = liveTrips.map((t) => ({
      key: `live:${t.slug}`,
      source: "live" as const,
      slug: t.slug,
      name: t.title,
      blurb: t.shortDescription,
      duration: t.durationText || "Full day",
      distanceKm: t.distanceKm,
      stops: t.stops,
      fromPrice: t.startingPriceInr,
      image: t.coverImage?.url ?? null,
      tripType: t.tripType ?? "local-tour",
      availability: t.availability,
      seatsLeft: t.seatsLeft,
    }));
    const liveSlugs = new Set(live.map((t) => t.slug));
    return [...live, ...curated.filter((t) => !liveSlugs.has(t.slug))];
  }, [liveTrips]);

  // The trip currently selected on Step 2 (fleet-first)
  const selectedTrip = useMemo<SelectableTrip | null>(() => {
    if (selectedTripKey) {
      const found = availableTrips.find((t) => t.key === selectedTripKey);
      if (found) return found;
    }
    return (
      availableTrips.find((t) => t.source === "curated" && t.slug === packageSlug) ??
      availableTrips.find((t) => t.source === "curated") ??
      null
    );
  }, [availableTrips, selectedTripKey, packageSlug]);

  // Selecting a trip in fleet-first mode
  function handleSelectTrip(trip: SelectableTrip) {
    setSelectedTripKey(trip.key);
    if (trip.source === "curated") {
      setBookingMode("package");
      setPackageSlug(trip.slug);
      return;
    }
    switch (trip.tripType) {
      case "airport-transfer":
        setBookingMode("local");
        setLocalPackageKey("airport-transfer");
        break;
      case "one-way":
      case "round-trip": {
        setBookingMode("outstation");
        setTripType(trip.tripType);
        const first = trip.stops[0]?.trim();
        const last = trip.stops[trip.stops.length - 1]?.trim();
        if (first) setOriginName(first);
        if (last && last !== first) setDestinationName(last);
        break;
      }
      case "local-tour":
      default: {
        if (packages.some((pkg) => pkg.slug === trip.slug)) {
          setBookingMode("package");
          setPackageSlug(trip.slug);
        } else {
          setBookingMode("local");
          setLocalPackageKey("8hr-80km");
        }
        break;
      }
    }
  }

  // Concierge quick picks
  function handleQuickPick(pick: QuickPick, trips: SelectableTrip[]) {
    if (trips.length === 0) return;
    let chosen: SelectableTrip | undefined;
    switch (pick) {
      case "popular":
        chosen = trips.find((t) => /same day|agra sightseeing|taj mahal/i.test(t.name)) ?? trips[0];
        break;
      case "family":
        chosen =
          trips.find((t) => /mathura|vrindavan|family/i.test(t.name)) ??
          [...trips].sort((a, b) => b.stops.length - a.stops.length)[0];
        break;
      case "budget":
        chosen = [...trips].sort((a, b) => a.fromPrice - b.fromPrice)[0];
        break;
      case "sunrise":
        chosen = trips.find((t) => /sunrise|dawn/i.test(t.name)) ?? trips[0];
        break;
    }
    if (chosen) handleSelectTrip(chosen);
  }

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
        }
      }
    }

    const qVeh = params.get("vehicle") as VehicleId | null;
    if (qVeh && VEHICLE_OPTIONS.some((v) => v.id === qVeh)) {
      setSelectedVehicleId(qVeh);
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
    if (qStep === "1") setStep(1);
    else if (qStep === "2") setStep(2);
    else if (qStep === "3") setStep(3);
    else if (qStep === "4") setStep(4);
  }, []);

  // Load published trips from live catalog
  useEffect(() => {
    let isMounted = true;
    fetchPublishedCatalog()
      .then((items) => {
        if (!isMounted) return;
        setLiveTrips(items.filter((i) => i.type !== "place" && i.type !== "vehicle" && i.availability !== "unavailable"));
      })
      .catch(() => {
        /* curated static packages remain the fallback */
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Determine if this booking uses the direct 3-step funnel (Route-First or Package-First)
  // vs the 4-step Fleet-First funnel
  const isDirectFunnel = hasPreselectedRoute || bookingMode === "package";

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

  // Map current UI state into Fastify BackendTripType
  const backendTripType = useMemo<BackendTripType>(() => {
    if (bookingMode === "local") {
      return selectedLocalCatalog?.tripType === "airport-transfer" || localPackageKey === "airport-transfer"
        ? "airport-transfer"
        : "local-tour";
    }
    if (bookingMode === "package") {
      return selectedPackageCatalog?.tripType === "one-way" || selectedPackageCatalog?.tripType === "local-tour"
        ? selectedPackageCatalog.tripType
        : "round-trip";
    }
    return tripType;
  }, [bookingMode, localPackageKey, tripType, selectedLocalCatalog, selectedPackageCatalog]);

  // Effective origin & destination
  const effectiveOrigin = useMemo(() => {
    if (bookingMode === "local") return localPickupName.trim() || "Agra";
    if (bookingMode === "package") return "Agra";
    return originName.trim() || "Agra";
  }, [bookingMode, localPickupName, originName]);

  const effectiveDestination = useMemo(() => {
    if (bookingMode === "local") {
      if (selectedLocalCatalog) return selectedLocalCatalog.routeSummary || selectedLocalCatalog.title;
      return localPackageKey === "airport-transfer" ? "Agra Cantt Airport / Station" : "Agra Local Sightseeing";
    }
    if (bookingMode === "package") {
      if (selectedPackageCatalog) return selectedPackageCatalog.title;
      return selectedPackage.name;
    }
    return destinationName.trim() || "Delhi";
  }, [bookingMode, localPackageKey, selectedPackage, destinationName, selectedLocalCatalog, selectedPackageCatalog]);

  const selectedCatalogBookingId = useMemo(() => {
    if (bookingMode === "local") return selectedLocalCatalog?.id;
    if (bookingMode === "package") return selectedPackageCatalog?.id;
    return undefined;
  }, [bookingMode, selectedLocalCatalog, selectedPackageCatalog]);

  const selectedPackageId = bookingMode === "package" ? selectedCatalogBookingId ?? selectedPackage.id : selectedCatalogBookingId;
  const selectedLocalPackageKey = bookingMode === "local" && !selectedLocalCatalog ? localPackageKey : undefined;

  // Primary Server Fare Fetcher: calls POST /api/v1/fares/calculate
  // Rule F3: Never compute or send money or distance from client!
  const fetchAuthoritativeFare = useCallback(async () => {
    setLoadingFare(true);
    setFareError(null);

    try {
      const payloadVehicleTier = mapVehicleTier(selectedVehicleId);
      const res = await calculateServerFare({
        tripType: backendTripType,
        vehicleTier: payloadVehicleTier,
        originName: effectiveOrigin,
        destinationName: effectiveDestination,
        pickupDatetime: pickupDatetimeIso,
        returnDatetime: returnDatetimeIso,
        promoCode: activePromoCode || undefined,
        packageId: selectedPackageId,
        localPackageKey: selectedLocalPackageKey,
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
  }, [
    backendTripType,
    selectedVehicleId,
    effectiveOrigin,
    effectiveDestination,
    pickupDatetimeIso,
    returnDatetimeIso,
    activePromoCode,
    bookingMode,
    selectedPackageId,
    selectedLocalPackageKey,
  ]);

  // Debounced auto-fetch on route, vehicle, datetime, or promo changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuthoritativeFare();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchAuthoritativeFare]);

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
    if (isDirectFunnel) {
      // In direct funnel: proceed straight to Guest Details Form (Step 2)
      setStep(2);
    } else {
      // In fleet-first funnel: proceed to Choose Trip (Step 2)
      setStep(2);
    }
  };

  const handleProceedFromFleetStep2 = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep(3);
  };

  // Final Checkout & Draft Booking Submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverFare) {
      setSubmitError("Fare quote is still calculating. Please wait a moment.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    let modalOpened = false;

    try {
      const cleanPhone = formatInquiryPhone(phone);
      const cleanName = sanitizeInquiryName(fullName);

      // Draft payload: strictly NO price, total, or distance sent (Server is sole authority)
      const draft = await createDraftBooking({
        tripType: backendTripType,
        vehicleTier: mapVehicleTier(selectedVehicleId),
        originName: effectiveOrigin,
        destinationName: effectiveDestination,
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
        packageId: selectedPackageId,
        localPackageKey: selectedLocalPackageKey,
      });

      // Attempt to initiate real checkout
      try {
        const checkout = await createPaymentCheckout({
          ticketId: draft.ticketId,
          guestAccessToken: draft.guestAccessToken,
          idempotencyKey: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `idemp-${Date.now()}`,
          provider: "razorpay",
          currency: "INR",
        });

        if (checkout.checkoutUrl) {
          window.location.assign(checkout.checkoutUrl);
          return;
        }

        if (checkout.providerOrderId) {
          const rzpKey = checkout.publicClientToken || checkout.keyId;
          const rzpLoaded = await loadRazorpayScript();
          if (!rzpLoaded || !window.Razorpay) {
            throw new Error("Unable to load secure Razorpay checkout modal. Please check your connection or ad-blocker.");
          }
          if (!rzpKey) {
            throw new Error("Payment gateway key missing from server response. Please contact support.");
          }

          const rzp = new window.Razorpay({
            key: rzpKey,
            order_id: checkout.providerOrderId,
            amount: checkout.amountMinor,
            currency: checkout.currency || "INR",
            name: "SK Baghel Tour & Travels",
            description: `Trip Booking #${draft.ticketId}`,
            image: `${window.location.origin}/assets/brand/favicon.svg`,
            prefill: {
              name: cleanName,
              contact: cleanPhone,
              email: email.trim() || undefined,
            },
            theme: {
              color: "#8B1E1E",
            },
            modal: {
              ondismiss: () => {
                setIsSubmitting(false);
                setSubmitError(
                  "Payment window was closed. Your booking request is safely saved as a draft. Click 'Authorize & Pay' to retry.",
                );
              },
            },
            handler: async () => {
              try {
                // Razorpay's browser callback is not proof of payment. The backend
                // webhook must first move both the payment and booking to confirmed.
                let verified = null;
                for (let attempt = 0; attempt < 8; attempt += 1) {
                  const status = await getPaymentStatus(checkout.paymentId, draft.guestAccessToken);
                  if (status.status === "captured" && status.bookingStatus === "paid_confirmed") {
                    verified = status;
                    break;
                  }
                  if (status.status === "failed" || status.status === "refunded") {
                    throw new Error("The payment was not confirmed by the payment server.");
                  }
                  await new Promise((resolve) => window.setTimeout(resolve, 1500));
                }
                if (!verified) {
                  setSubmitError("Payment received by Razorpay but still awaiting server verification. Please do not pay again; use your ticket to check status shortly.");
                  return;
                }
                setConfirmedTicketId(draft.ticketId);
                setConfirmedBookingId(draft.bookingId);
                setAmountPaid(verified.amountMinor / 100);
                window.scrollTo({ top: 0, behavior: "smooth" });
                setStep(isDirectFunnel ? 3 : 4);
              } catch (verificationError) {
                setSubmitError(verificationError instanceof Error ? verificationError.message : "Payment verification is still pending. Please check your ticket status.");
              } finally {
                setIsSubmitting(false);
              }
            },
          });

          rzp.on("payment.failed", (response: any) => {
            setIsSubmitting(false);
            setSubmitError(`Payment failed: ${response?.error?.description || "Card/UPI transaction was declined."}`);
          });

          rzp.open();
          modalOpened = true;
          return;
        }

        throw new Error("Razorpay did not return a checkout order. The booking was saved, but payment was not started.");
      } catch (payErr) {
        setSubmitError(payErr instanceof Error ? payErr.message : "Payment checkout could not be started. Please try again.");
        return;
      }
    } catch (err: any) {
      console.error("Booking submission error:", err);
      setSubmitError(err?.message || "Failed to create booking draft. Please check your contact details.");
    } finally {
      if (!modalOpened) {
        setIsSubmitting(false);
      }
    }
  };

  // Test-only helper. It is intentionally unreachable in production UI.
  const handleSimulatePayment = () => {
    if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_PAYMENT_SIMULATION !== "true") return;
    const mockTicket = `AGR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmedTicketId(mockTicket);
    setConfirmedBookingId(`book-${Date.now()}`);
    setAmountPaid(serverFare?.advanceAmount ?? 700);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep(isDirectFunnel ? 3 : 4);
  };

  // Is current view rendering the Guest Details form?
  const isGuestFormStep = isDirectFunnel ? step === 2 : step === 3;
  // Is current view rendering the Confirmed Voucher?
  const isVoucherStep = isDirectFunnel ? step === 3 : step === 4;

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen">
      {/* BREADCRUMB STRIP */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-gutter flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm overflow-x-auto whitespace-nowrap">
            <a className="hover:text-primary transition-colors" href="/en/">Home</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface-variant">Booking</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-semibold">
              {step === 1
                ? hasPreselectedRoute
                  ? "Step 1: Outstation Route & Vehicle"
                  : "Step 1: Select Vehicle Tier"
                : isGuestFormStep
                ? isDirectFunnel
                  ? "Step 2: Guest Details & Review"
                  : "Step 3: Guest Details & Review"
                : isVoucherStep
                ? isDirectFunnel
                  ? "Step 3: Confirmed Voucher"
                  : "Step 4: Confirmed Voucher"
                : "Step 2: Choose Your Trip"}
            </span>
          </nav>
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-secondary">
            <span className="w-2 h-2 rounded-full bg-success-jade inline-block animate-pulse"></span>
            <span>Live Fastify Fare Engine Connected</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl">
        {/* HORIZONTAL PROGRESS TRACKER */}
        {isDirectFunnel ? (
          /* 3-STEP TRACKER (Route-First / Package-First) */
          <section className="w-full bg-surface-container-low rounded-xl p-space-md shadow-sm border border-border-warm/60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
              {/* Step 1 */}
              <div
                onClick={() => step > 1 && setStep(1)}
                className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-all ${
                  step === 1
                    ? "bg-surface-container-lowest shadow-sm border border-border-warm ring-1 ring-primary/20"
                    : "bg-surface-container-lowest/50 opacity-85 cursor-pointer hover:bg-surface-container-lowest"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${
                    step > 1 ? "bg-success-jade text-on-primary" : "bg-primary text-on-primary"
                  }`}
                >
                  {step > 1 ? <span className="material-symbols-outlined text-[20px]">check</span> : "1"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone tracking-wider font-bold">
                    {step === 1 ? "Step 1 • Active" : "Step 1 • Completed"}
                  </span>
                  <span className="font-title-md text-title-md text-ink-charcoal font-semibold truncate">
                    {hasPreselectedRoute ? "Route & Vehicle" : "Tour & Vehicle"}
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => step === 3 && setStep(2)}
                className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-all ${
                  step === 2
                    ? "bg-surface-container-lowest shadow-sm border border-border-warm ring-1 ring-primary/20"
                    : "bg-surface-container-lowest/50 opacity-85"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${
                    step > 2
                      ? "bg-success-jade text-on-primary"
                      : step === 2
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-highest text-secondary"
                  }`}
                >
                  {step > 2 ? <span className="material-symbols-outlined text-[20px]">check</span> : "2"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider font-bold">
                    {step === 2 ? "Step 2 • Active" : step > 2 ? "Step 2 • Completed" : "Step 2 • Upcoming"}
                  </span>
                  <span className="font-title-md text-title-md text-ink-charcoal font-semibold truncate">
                    Guest &amp; Fare Review
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-all ${
                  step === 3
                    ? "bg-ink-charcoal text-ivory-surface shadow-md"
                    : "bg-surface-container-lowest/50 opacity-75"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${
                    step === 3 ? "bg-terracotta-sandstone text-on-primary" : "bg-surface-container-highest text-secondary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`font-label-caps text-label-caps uppercase tracking-wider font-bold ${step === 3 ? "text-gold-accent" : "text-secondary"}`}>
                    {step === 3 ? "Step 3 • Issued" : "Step 3 • Final Voucher"}
                  </span>
                  <span className={`font-title-md text-title-md truncate font-semibold ${step === 3 ? "text-ivory-surface" : "text-on-surface-variant"}`}>
                    Confirmed Voucher
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* 4-STEP TRACKER (Fleet-First Flow) */
          <section className="w-full bg-surface-container-low rounded-xl p-space-md shadow-sm border border-border-warm/60">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm">
              {/* Step 1 */}
              <div
                onClick={() => step > 1 && setStep(1)}
                className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-all ${
                  step === 1
                    ? "bg-surface-container-lowest shadow-sm border border-border-warm ring-1 ring-primary/20"
                    : "bg-surface-container-lowest/50 opacity-85 cursor-pointer hover:bg-surface-container-lowest"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${
                    step > 1 ? "bg-success-jade text-on-primary" : "bg-primary text-on-primary"
                  }`}
                >
                  {step > 1 ? <span className="material-symbols-outlined text-[20px]">check</span> : "1"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone tracking-wider font-bold">
                    {step === 1 ? "Step 1 • Active" : "Step 1 • Completed"}
                  </span>
                  <span className="font-title-md text-title-md text-ink-charcoal font-semibold truncate">
                    Vehicle Tier
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => step > 2 && setStep(2)}
                className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-all ${
                  step === 2
                    ? "bg-surface-container-lowest shadow-sm border border-border-warm ring-1 ring-primary/20"
                    : "bg-surface-container-lowest/50 opacity-85 cursor-pointer hover:bg-surface-container-lowest"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${
                    step > 2
                      ? "bg-success-jade text-on-primary"
                      : step === 2
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-highest text-secondary"
                  }`}
                >
                  {step > 2 ? <span className="material-symbols-outlined text-[20px]">check</span> : "2"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider font-bold">
                    {step === 2 ? "Step 2 • Active" : step > 2 ? "Step 2 • Completed" : "Step 2 • Upcoming"}
                  </span>
                  <span className="font-title-md text-title-md text-ink-charcoal font-semibold truncate">
                    Choose Your Trip
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => step === 4 && setStep(3)}
                className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-all ${
                  step === 3
                    ? "bg-surface-container-lowest shadow-sm border border-border-warm ring-1 ring-primary/20"
                    : "bg-surface-container-lowest/50 opacity-85"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${
                    step > 3
                      ? "bg-success-jade text-on-primary"
                      : step === 3
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-highest text-secondary"
                  }`}
                >
                  {step > 3 ? <span className="material-symbols-outlined text-[20px]">check</span> : "3"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider font-bold">
                    {step === 3 ? "Step 3 • Active" : step > 3 ? "Step 3 • Completed" : "Step 3 • Upcoming"}
                  </span>
                  <span className="font-title-md text-title-md text-ink-charcoal font-semibold truncate">
                    Guest &amp; Fare Review
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div
                className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-all ${
                  step === 4
                    ? "bg-ink-charcoal text-ivory-surface shadow-md"
                    : "bg-surface-container-lowest/50 opacity-75"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${
                    step === 4 ? "bg-terracotta-sandstone text-on-primary" : "bg-surface-container-highest text-secondary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`font-label-caps text-label-caps uppercase tracking-wider font-bold ${step === 4 ? "text-gold-accent" : "text-secondary"}`}>
                    {step === 4 ? "Step 4 • Issued" : "Step 4 • Final Voucher"}
                  </span>
                  <span className={`font-title-md text-title-md truncate font-semibold ${step === 4 ? "text-ivory-surface" : "text-on-surface-variant"}`}>
                    Confirmed Voucher
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* STEP 1: ROUTE & VEHICLE SELECTION */}
        {step === 1 && (
          <div className="flex flex-col gap-space-xl">
            {/* TRIP MODE SELECTOR & CONFIGURATION HEADER */}
            <header className="bg-surface-container-lowest rounded-xl p-space-lg lg:p-space-xl shadow-sm border border-border-warm flex flex-col gap-space-md">
              {isLocalTourEntry ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm bg-sandstone-wash/80 p-space-md rounded-xl border border-border-warm/80">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <span className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">landscape</span>
                    </span>
                    <div className="min-w-0">
                      <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone tracking-widest font-bold">
                        Local Taxi Booking
                      </span>
                      <h1 className="font-headline-sm text-headline-sm text-ink-midnight tracking-tight font-bold truncate">
                        {selectedPackage.name}
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
                      <span className="material-symbols-outlined text-[24px]">route</span>
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
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
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
                      onClick={() => setBookingMode("outstation")}
                      className={`px-3.5 py-1.5 rounded-md font-label-lg text-xs font-semibold transition-all ${
                        bookingMode === "outstation" ? "bg-primary text-on-primary shadow-xs" : "text-ink-slate hover:text-ink-charcoal"
                      }`}
                    >
                      Outstation Route
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingMode("local")}
                      className={`px-3.5 py-1.5 rounded-md font-label-lg text-xs font-semibold transition-all ${
                        bookingMode === "local" ? "bg-primary text-on-primary shadow-xs" : "text-ink-slate hover:text-ink-charcoal"
                      }`}
                    >
                      Local Tour / Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingMode("package")}
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
                        onChange={(value) => setOriginName(value)}
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
                        onChange={(value) => setDestinationName(value)}
                        placeholder="Search destination city, airport, landmark..."
                        label="Destination City"
                        triggerIcon="location_on"
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
                  <>
                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <label htmlFor="local-pickup-input" className="font-label-lg text-xs font-bold text-ink-slate">Pickup Location</label>
                      <LocationCombobox
                        id="local-pickup-input"
                        value={localPickupName}
                        onChange={(value) => setLocalPickupName(value)}
                        placeholder="Search hotel, station, city..."
                        label="Local tour pickup location"
                        triggerIcon="trip_origin"
                        showLocationIqBadge={false}
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-2 flex flex-col gap-1">
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
                  </>
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
                      onChange={(e) => setPickupDate(e.target.value)}
                      min={localTomorrow()}
                      className="w-3/5 px-2.5 py-2 rounded-lg border border-border-warm bg-surface font-body-sm text-xs text-on-surface focus:outline-none"
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
                        className="w-3/5 px-2.5 py-2 rounded-lg border border-border-warm bg-surface font-body-sm text-xs text-on-surface focus:outline-none"
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
                  <span className="material-symbols-outlined text-primary text-[24px] shrink-0 mt-0.5">
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

            {/* MAIN TWO-COLUMN SPLIT: VEHICLE SELECTION CARDS & STICKY LIVE SUMMARY */}
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

                {VEHICLE_OPTIONS.map((veh) => {
                  const isSelected = selectedVehicleId === veh.id;
                  return (
                    <div
                      key={veh.id}
                      onClick={() => setSelectedVehicleId(veh.id)}
                      className={`cursor-pointer rounded-xl p-space-md lg:p-space-lg transition-all border ${
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
                            <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] ${veh.badgeClass || "bg-primary text-white"}`}>
                              {veh.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-title-lg text-title-lg text-ink-midnight font-bold">
                              {veh.name}
                            </h3>
                            <span className="font-label-caps text-xs text-primary font-bold">
                              {isSelected ? "Selected Tier" : "Click to Select"}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-secondary">
                            {veh.subtitle}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-surface-container-low px-2 py-0.5 rounded text-ink-slate border border-border-warm/60">
                              <span className="material-symbols-outlined text-[14px]">groups</span>
                              {veh.guests}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-surface-container-low px-2 py-0.5 rounded text-ink-slate border border-border-warm/60">
                              <span className="material-symbols-outlined text-[14px]">luggage</span>
                              {veh.luggage}
                            </span>
                            {veh.alwaysRoundTrip && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sandstone-wash text-terracotta-sandstone px-2 py-0.5 rounded border border-primary/20">
                                Round-Trip Policy
                              </span>
                            )}
                          </div>
                          <p className="font-body-sm text-xs text-on-surface-variant italic mt-1">
                            {veh.editorialPitch}
                          </p>
                        </div>
                      </div>
                    </div>
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
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                    </span>
                  </div>

                  {/* Route & Vehicle Summary */}
                  <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-1 border border-border-warm/60">
                    <span className="font-label-caps text-label-caps uppercase text-secondary font-bold">
                      Itinerary
                    </span>
                    <div className="font-title-md text-title-md text-ink-charcoal font-semibold leading-snug">
                      {serverFare?.label || `${effectiveOrigin} → ${effectiveDestination}`}
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
                          <span className="block font-body-sm text-[11px] text-success-jade font-semibold">
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
                    className="w-full py-3.5 px-space-md rounded-xl bg-terracotta-sandstone text-on-primary font-label-lg text-label-lg font-semibold hover:bg-terracotta-sunlit disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                    type="button"
                  >
                    <span>{isDirectFunnel ? "Proceed to Guest Details (Step 2)" : "Choose Your Trip (Step 2)"}</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>

                  <a
                    className="flex items-center justify-center gap-2 py-2.5 px-space-sm rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg text-label-lg transition-colors text-center"
                    style={{ color: "#ffffff" }}
                    href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                      `Hello SK Baghel Travels, query for ${effectiveOrigin} to ${effectiveDestination} with ${selectedVehicle.name}.`
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
          </div>
        )}

        {/* STEP 2 IN FLEET-FIRST FLOW: CHOOSE YOUR TRIP */}
        {!isDirectFunnel && step === 2 && (
          <TripSelectionStep
            trips={availableTrips}
            selectedKey={selectedTrip?.key ?? ""}
            onSelect={handleSelectTrip}
            vehicleName={selectedVehicle.name}
            vehicleImage={selectedVehicle.image}
            serverTotalFare={serverFare?.totalFare ?? null}
            serverAdvanceAmount={serverFare?.advanceAmount ?? null}
            quoteLoading={loadingFare}
            quoteError={fareError}
            onContinue={handleProceedFromFleetStep2}
            onChangeVehicle={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setStep(1);
            }}
            onQuickPick={handleQuickPick}
          />
        )}

        {/* GUEST DETAILS & FARE REVIEW FORM (Step 2 in Direct Funnel, Step 3 in Fleet-First Funnel) */}
        {isGuestFormStep && (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-space-md">
            <div className="w-full bg-surface-container-lowest rounded-xl shadow-md border border-border-warm overflow-hidden">
              {/* Header */}
              <div className="w-full bg-ink-charcoal text-ivory-surface px-space-lg py-space-md flex flex-wrap items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[20px] text-gold-accent">contact_phone</span>
                  <h2 className="font-headline-sm text-headline-sm text-ivory-surface tracking-wide uppercase">
                    Passenger Logistics &amp; Review
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(isDirectFunnel ? 1 : 2)}
                  className="text-xs text-gold-accent hover:text-ivory-surface underline"
                >
                  ← {isDirectFunnel ? "Edit Vehicle / Route" : "Edit Trip / Vehicle"}
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitBooking} className="p-space-md md:p-space-lg flex flex-col gap-space-lg">
                {submitError && (
                  <div className="p-space-md bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                    {submitError}
                  </div>
                )}

                {/* Clean prefilled booking summary — mirrors the homepage selection. */}
                <div className="booking-prefill-summary grid grid-cols-2 sm:grid-cols-4 gap-space-sm rounded-lg border border-border-warm/70 bg-surface-container-low p-space-sm">
                  <div><span className="booking-summary-label">Trip</span><strong>{isLocalTourEntry ? "Local Taxi" : bookingMode === "package" ? "Tour Package" : tripType === "round-trip" ? "Round Trip" : "One Way"}</strong></div>
                  <div><span className="booking-summary-label">{isLocalTourEntry ? "Local Tour" : "From"}</span><strong>{isLocalTourEntry ? selectedPackage.name : originName}</strong></div>
                  <div><span className="booking-summary-label">{isLocalTourEntry ? "Tour Date" : "To"}</span><strong>{isLocalTourEntry ? formatBookingDate(pickupDate) : destinationName}</strong></div>
                  <div><span className="booking-summary-label">{isLocalTourEntry ? "Fare" : "Pickup"}</span><strong>{isLocalTourEntry ? (serverFare ? formatInr(serverFare.totalFare) : "Fare on request") : formatBookingDate(pickupDate)}</strong></div>
                  {!isLocalTourEntry && tripType === "round-trip" && <div><span className="booking-summary-label">Return</span><strong>{formatBookingDate(returnDate)}</strong></div>}
                  {!isLocalTourEntry && <div><span className="booking-summary-label">Vehicle</span><strong>{selectedVehicle.name}</strong></div>}
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
                      placeholder="+91 98765 43210"
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
                      <span className={`text-[11px] font-medium ${serverFare?.promoValid ? "text-success-jade" : "text-terracotta-sandstone"}`}>
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

                {/* Submission CTA Buttons */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border-warm">
                  <button
                    type="submit"
                    disabled={isSubmitting || !serverFare}
                    className="w-full py-3.5 px-space-md rounded-xl bg-terracotta-sandstone text-on-primary font-title-lg font-bold hover:bg-terracotta-sunlit transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    <span>
                      {isSubmitting
                        ? "Registering Booking with Server..."
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
                step={3}
                vehicleName={selectedVehicle.name}
                tripName={selectedTrip?.name ?? (bookingMode === "package" ? selectedPackage.name : null)}
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
                  <span className="material-symbols-outlined text-[24px]">verified</span>
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
                  <span className="text-[10px] tracking-widest text-gold-accent uppercase font-bold">
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
                    <span className="text-xs text-secondary uppercase font-bold block">Destination &amp; Route</span>
                    <span className="font-title-md text-on-surface font-semibold">
                      {serverFare?.label || `${effectiveOrigin} → ${effectiveDestination}`}
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
                  `*SK Baghel Tour & Travels — Booking Confirmation*\nTicket ID: ${confirmedTicketId || "AGR-20260927-4821"}\nRoute: ${effectiveOrigin} to ${effectiveDestination}\nVehicle: ${selectedVehicle.name}\nPickup: ${pickupDate} at ${pickupTime}\nPorch: ${pickupAddress}\nTotal: ${formatInr(serverFare?.totalFare ?? 2500)}\nPaid: ${formatInr(amountPaid)}\nBalance on Pickup: ${formatInr(Math.max(0, (serverFare?.totalFare ?? 2500) - amountPaid))}`
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
                onClick={() => {
                  setStep(1);
                  setConfirmedTicketId("");
                  setSelectedTripKey(null);
                }}
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
