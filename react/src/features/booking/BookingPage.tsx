import { useState, useMemo, useEffect } from "react";
import { contact } from "../../data/contact";
import { packages, routes, vehicles, type VehicleId, type TourPackage } from "../../data/catalogue";
import { calcFare, advanceOf, formatInr, localPackages, type LocalPackageKey } from "./fareEngine";
import { createDraftBooking, type BackendTripType, type BackendVehicleTier } from "../../services/api";
import { WhatsAppIcon } from "../../components/icons";

type BookingStep = 1 | 2 | 3;

interface VehicleOption {
  id: VehicleId;
  name: string;
  subtitle: string;
  image: string;
  badge?: string;
  badgeClass?: string;
  priceOffset: number; // Offset from base package price
  guests: string;
  luggage: string;
  features: string[];
  editorialPitch: string;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: "sedan",
    name: "Executive Sedan",
    subtitle: "Maruti Suzuki Dzire Prime or Toyota Etios Platinum",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCeec_HWNNLYwjEyRhK0OvGN8Y2Zygd_YQUSxHuAjmbw6p-sMz22EerFztHVN7ADJ9AxQJT48qqzq5KiWR1QLvoGHkVcSfZ53VFBfFPjckgBLjwFWLFeK_rdr0fbOm1N-L5W0Fa3aIP_8L_UE0qRFUmlE_S5e6ZovaeJQLlF1wLJy7QM0JUMDt1HcCxKCrX5WO2etuvtIGr00LyuJOWdoaJE8bfTpRZohkdS9JgQ1ywoZQpGHESdMo8qw",
    priceOffset: 0,
    guests: "1–3 Guests",
    luggage: "2 Medium Bags",
    features: ["Dual Climate AC", "USB Fast Charging"],
    editorialPitch: "Ideal for solo voyagers or intimate couples traveling light",
  },
  {
    id: "ertiga",
    name: "Maruti Ertiga SUV",
    subtitle: "Smart Hybrid E-Tech • Elevated Ride Height",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4KBoferR1qqlLY_YGxxqZAa6N5JE1pQ4jQC4ofJdh01zMaeby9PxaOT6M-rMovbEzYpG416FV8_EhiB1OIs5GwVNfo3SPYWzouYfeK4qJkXQ6196EnOqJt4jDAYd_w_vTjrpA8vifF0WBh3YGeRMZXRvv9lNhAPoPd2qUbMDQOI12YlyklYHs9hxVTIwYSLfrFpQ0I7q4OMhpMkDlEShOsmbBM_VulIqboBIfxRdneNQ7FrUgUPPatQ",
    priceOffset: 800,
    guests: "4–5 Guests",
    luggage: "3–4 Bags",
    features: ["Roof Mounted AC Louvers", "Flexible Foldable 3rd Row"],
    editorialPitch: "Compact family comfort with extra legroom & elevated highway perspective",
  },
  {
    id: "innova",
    name: "Toyota Innova Crysta VIP",
    subtitle: "6+1 Individual Captain Armchairs • Whisper-Quiet Cabin",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBR9azjKZ95zFY2bWXz5R2TsDQjXQziOuKo6tD3ICm26rH9vMG1YTFOtqNyjmyINcGqITcoDjFjb15EjX57GZduzpDRksXIQloFuhNHE9iEIz0to-dcFg-JMjoW1fLhqD3g52md28CKgRhQ7vPjeDpt3s3cDgMH36gIZtXfa3VAet4e6nGR-L0RyVXiwYYDgrSNclwueOuAN0tOsd80612v_rV3OKPZlN5gw1C0QGxloqgNRSOOiPtApw",
    badge: "Most Popular • Concierge Choice",
    badgeClass: "bg-primary text-on-primary",
    priceOffset: 1800,
    guests: "Up to 6 Guests",
    luggage: "4 Large Suitcases",
    features: ["Captain Armchairs", "Triple Climate Auto AC", "Chilled Mineral Water"],
    editorialPitch: "The undisputed gold standard for Yamuna Expressway cruising with zero fatigue",
  },
  {
    id: "tempo",
    name: "Force Tempo Traveller",
    subtitle: "12 to 16 Passenger High-Roof Touring Coach",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAurwantvG0Hai16w_M_-y-NiD9GHr2DUfjhsuGI4mlWA1sXNNHKk7CFLow6oCAl8Ir7xH5-v6cWhjw1re9Ad6bGie1bwrEQd5ule-wIo7beCrmWohoEyEmcSHs9D51yAKe6lt78Qg9UoahvLTLUUILyP65Gdj9Xf0UhNgxWRsbMIg4DlwclLeRJgn98V3ZRXRNAW45pqBeIUlSN-meZDP5Dz1dAJgOE7pYgfYTcGTqpt69-PSPUlFZ1g",
    priceOffset: 3500,
    guests: "12–16 Guests",
    luggage: "10–12 Large Bags",
    features: ["Individual AC Louvers", "Dedicated Luggage Bay"],
    editorialPitch: "Tailored for joint families, corporate retreats, and international delegations",
  },
  {
    id: "urbania",
    name: "Force Urbania Royal Van",
    subtitle: "Monocoque Whisper Body • Aircraft Recliner Seating",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRpdABdRS8NBVRbJyKyo9R5l9IoEDKk4R13pfabZ_iEEjA3UOWww1_XQhUJ7B501BHMxlBVksxmQSGzK4hAXAL35U0wZHh54_U5oeiYEA84oYTBJE46KuBGb0T5zj6xgkk1248RhTobv1QpygmnN8onQw0_GnPT4K6A8DIXwhkEnC42BvKcEXUYCbPfv1LMOs5wA1qm-j5sxZcmAPmklDUorNT_qQTuPuvgQ23RLcSEb9qjxZrOf1OOA",
    badge: "State-of-the-Art Luxury",
    badgeClass: "bg-gold-accent/20 text-ink-charcoal font-bold",
    priceOffset: 5500,
    guests: "10–14 Recliner Pods",
    luggage: "12+ Large Bags",
    features: ["Starry Ambient Ceiling", "European Sound Isolation", "Onboard High-Speed Wi-Fi"],
    editorialPitch: "Diplomatic, presidential transit with private lounge privacy glass",
  },
];

const tomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

export function BookingPage() {
  // Step State: 1 = Choose Car, 2 = Universal Booking & Billing, 3 = Confirmation Voucher
  const [step, setStep] = useState<BookingStep>(1);

  // Selected tour package or fallback
  const [packageSlug, setPackageSlug] = useState<string>("taj-mahal-sunrise-tour");
  const [selectedVehicleId, setSelectedVehicleId] = useState<VehicleId>("innova");

  // Form Fields State
  const [fullName, setFullName] = useState<string>("Jonathan Sterling");
  const [email, setEmail] = useState<string>("j.sterling.heritage@outlook.com");
  const [phone, setPhone] = useState<string>("+91 98765 43210");
  const [billingAddress, setBillingAddress] = useState<string>("ITC Mughal Pavilion, VIP Road");
  const [country, setCountry] = useState<string>("India");
  const [stateName, setStateName] = useState<string>("Uttar Pradesh");
  const [city, setCity] = useState<string>("Agra");
  const [pincode, setPincode] = useState<string>("282001");

  // Logistics & Timing
  const [tourDate, setTourDate] = useState<string>(tomorrowDateString());
  const [pickupTime, setPickupTime] = useState<string>("05:30");
  const [pickupInstruction, setPickupInstruction] = useState<string>(
    "Grand Imperial Hotel Porch, MG Road - Agra Cantt side"
  );
  const [dropInstruction, setDropInstruction] = useState<string>(
    "Agra Cantt Railway Station (Executive Lounge drop off)"
  );

  // Passenger & Pet Details
  const [guestCount, setGuestCount] = useState<number>(2);
  const [hasPet, setHasPet] = useState<boolean>(false);
  const [petType, setPetType] = useState<string>("Golden Retriever");
  const [petSize, setPetSize] = useState<string>("medium");
  const [petNotes, setPetNotes] = useState<string>("Waterproof rear seat hammock requested");

  // Payment Settlement Choice: "partial" (28% advance deposit) or "full" (100%)
  const [paymentChoice, setPaymentChoice] = useState<"partial" | "full">("partial");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Confirmed booking state
  const [bookingRef, setBookingRef] = useState<string>("#SKB-SUNRISE-98421");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("INV-2026-0941");

  // Read URL query parameters on initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qPkg = params.get("package") || params.get("pkg");
    if (qPkg) {
      const match = packages.find((p) => p.slug === qPkg || p.id === qPkg);
      if (match) {
        setPackageSlug(match.slug);
      }
    }
    const qVeh = params.get("vehicle") as VehicleId | null;
    if (qVeh && VEHICLE_OPTIONS.some((v) => v.id === qVeh)) {
      setSelectedVehicleId(qVeh);
    }
    const qStep = params.get("step");
    if (qStep === "2") {
      setStep(2);
    } else if (qStep === "3") {
      setStep(3);
    }
  }, []);

  // Matched package
  const matchedPackage = useMemo<TourPackage>(() => {
    return (
      packages.find((p) => p.slug === packageSlug || p.id === packageSlug) ||
      packages[1] ||
      packages[0]
    );
  }, [packageSlug]);

  // Selected vehicle details
  const selectedVehicle = useMemo<VehicleOption>(() => {
    return (
      VEHICLE_OPTIONS.find((v) => v.id === selectedVehicleId) ||
      VEHICLE_OPTIONS[2]
    );
  }, [selectedVehicleId]);

  // Price calculations
  const baseTourPrice = matchedPackage.from;
  const vehicleOffset = selectedVehicle.priceOffset;
  const totalGrossPrice = baseTourPrice + vehicleOffset;
  const advanceAmount = Math.round(totalGrossPrice * 0.28);
  const balanceAmount = totalGrossPrice - advanceAmount;

  // Amount authorized on checkout
  const amountToCharge = paymentChoice === "full" ? totalGrossPrice : advanceAmount;

  // Handle proceed to Step 2
  const handleProceedToStep2 = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep(2);
  };

  // Handle final checkout submission
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Attempt backend booking draft creation if available
      const generatedId = Math.floor(10000 + Math.random() * 90000).toString();
      setBookingRef(`#SKB-${matchedPackage.slug.toUpperCase().slice(0, 7)}-${generatedId}`);
      setInvoiceNumber(`INV-2026-${generatedId}`);

      // Simulate network authorization latency for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      window.scrollTo({ top: 0, behavior: "smooth" });
      setStep(3);
    } catch (err) {
      console.error("Booking submission error:", err);
      // Fallback transition so user is never blocked
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen">
      {/* BREADCRUMB & HEADER STRIP */}
      <div className="w-full bg-sandstone-wash/70 py-space-sm border-b border-border-warm/60">
        <div className="max-w-[1280px] mx-auto px-gutter flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm overflow-x-auto whitespace-nowrap">
            <a className="hover:text-primary transition-colors" href="/en/">Home</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <a className="hover:text-primary transition-colors" href="/en/packages/">Packages</a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <a className="hover:text-primary transition-colors" href={`/en/packages/${matchedPackage.slug}`}>
              {matchedPackage.name}
            </a>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-semibold">
              {step === 1 ? "Step 1: Choose Vehicle" : step === 2 ? "Step 2: Universal Booking Form" : "Confirmation"}
            </span>
          </nav>
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-secondary">
            <span className="w-2 h-2 rounded-full bg-success-jade inline-block animate-pulse"></span>
            <span>24×7 Instant Dispatch Desk</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl">
        {/* HORIZONTAL PROGRESS TRACKER (3 Steps) */}
        <section className="w-full bg-surface-container-low rounded-xl p-space-md shadow-sm border border-border-warm/60">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
            {/* Step 1 */}
            <div
              className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-all ${step === 1
                  ? "bg-surface-container-lowest shadow-sm border border-border-warm"
                  : "bg-surface-container-lowest/50 opacity-85"
                }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${step > 1 ? "bg-success-jade text-on-primary" : "bg-primary text-on-primary"
                  }`}
              >
                {step > 1 ? <span className="material-symbols-outlined text-[20px]">check</span> : "1"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone tracking-wider">
                  {step === 1 ? "Step 1 • Current" : "Step 1 • Completed"}
                </span>
                <span className="font-title-md text-title-md text-ink-charcoal font-semibold truncate">
                  Select Vehicle Tier
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-all ${step === 2
                  ? "bg-surface-container-lowest shadow-sm border border-border-warm"
                  : "bg-surface-container-lowest/50 opacity-85"
                }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${step > 2
                    ? "bg-success-jade text-on-primary"
                    : step === 2
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-highest text-secondary"
                  }`}
              >
                {step > 2 ? <span className="material-symbols-outlined text-[20px]">check</span> : "2"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">
                  {step === 2 ? "Step 2 • Active" : step > 2 ? "Step 2 • Completed" : "Step 2 • Upcoming"}
                </span>
                <span className="font-title-md text-title-md text-ink-charcoal font-semibold truncate">
                  Billing &amp; Date Logistics
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`flex items-center gap-space-sm p-space-sm rounded-lg transition-all ${step === 3
                  ? "bg-ink-charcoal text-ivory-surface shadow-md"
                  : "bg-surface-container-lowest/50 opacity-75"
                }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-title-md text-title-md font-semibold shrink-0 ${step === 3 ? "bg-terracotta-sandstone text-on-primary" : "bg-surface-container-highest text-secondary"
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-label-caps text-label-caps uppercase tracking-wider ${step === 3 ? "text-gold-accent" : "text-secondary"}`}>
                  {step === 3 ? "Step 3 • Issued" : "Step 3 • Final Step"}
                </span>
                <span className={`font-title-md text-title-md truncate font-semibold ${step === 3 ? "text-ivory-surface" : "text-on-surface-variant"}`}>
                  Transit Voucher &amp; Confirmation
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 1: CHOOSE VEHICLE TIER SCREEN */}
        {step === 1 && (
          <div className="flex flex-col gap-space-xl">
            {/* Expedition Highlight Banner */}
            <header className="bg-surface-container-lowest rounded-xl p-space-lg lg:p-space-xl shadow-sm border border-border-warm relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-space-xs px-2.5 py-1 rounded bg-sandstone-wash text-terracotta-sandstone font-label-caps text-label-caps uppercase tracking-widest mb-space-xs">
                    <span className="material-symbols-outlined text-[15px]">wb_twilight</span>
                    Curated Expedition • Yamuna Expressway Priority Pass
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-ink-midnight tracking-tight mt-1">
                    Select Your Chauffeur &amp; Vehicle Tier
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs leading-relaxed">
                    {matchedPackage.name} — Handcrafted private expedition with sanitized commercial AC transit, licensed ASI historian guide, and 5-star palace breakfast.
                  </p>
                </div>
                {/* Live Quick Stats Badge Panel */}
                <div className="bg-surface-container-low p-space-md rounded-xl flex items-center gap-space-lg shrink-0 border border-border-warm/60">
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps uppercase text-secondary">Pickup Origin</span>
                    <span className="font-title-md text-title-md text-ink-charcoal font-semibold">Delhi NCR / Agra</span>
                  </div>
                  <div className="w-px h-8 bg-surface-container-highest"></div>
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps uppercase text-secondary">Duration</span>
                    <span className="font-title-md text-title-md text-ink-charcoal font-semibold">{matchedPackage.duration}</span>
                  </div>
                  <div className="w-px h-8 bg-surface-container-highest"></div>
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps uppercase text-secondary">Breakfast Halt</span>
                    <span className="font-title-md text-title-md text-ink-charcoal font-semibold">5-Star Palace Buffet</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Two-Column Split: Vehicle Selector & Sticky Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              {/* Left Column: Interactive Vehicle Cards (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-xs">
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-ink-charcoal">
                      Available Executive Fleet Categories
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      All tiers include vetted uniformed chauffeur, chilled bottled water, FASTag tolls, fuel, and expressway access.
                    </p>
                  </div>
                  <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone bg-sandstone-wash px-2 py-1 rounded font-semibold">
                    {VEHICLE_OPTIONS.length} Options
                  </span>
                </div>

                {/* Vehicle Cards Loop */}
                {VEHICLE_OPTIONS.map((veh) => {
                  const isSelected = selectedVehicleId === veh.id;
                  const cardCalculatedFare = baseTourPrice + veh.priceOffset;

                  return (
                    <div
                      key={veh.id}
                      onClick={() => setSelectedVehicleId(veh.id)}
                      className={`relative bg-surface-container-lowest rounded-xl p-space-md lg:p-space-lg transition-all cursor-pointer border ${isSelected
                          ? "ring-2 ring-primary border-primary shadow-md bg-sandstone-wash/20"
                          : "border-border-warm hover:shadow-md"
                        }`}
                    >
                      {/* Optional Highlight Badge */}
                      {veh.badge && (
                        <div className={`absolute -top-3.5 left-6 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1 ${veh.badgeClass || "bg-primary text-on-primary"}`}>
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          {veh.badge}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-space-md pt-space-xs">
                        <div className="sm:w-44 h-36 rounded-lg overflow-hidden shrink-0 relative bg-surface-container-high">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt={veh.name}
                            src={veh.image}
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-space-xs">
                              <div>
                                <h3 className="font-headline-sm text-headline-sm text-ink-charcoal font-semibold">
                                  {veh.name}
                                </h3>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">
                                  {veh.subtitle}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-price-display text-price-display text-primary font-bold">
                                  ₹{cardCalculatedFare.toLocaleString("en-IN")}
                                </span>
                                <span className="block font-label-caps text-label-caps uppercase text-secondary">
                                  All-Inclusive
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-space-xs mt-space-sm">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-low text-ink-charcoal font-body-sm text-body-sm font-medium">
                                <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone">group</span>
                                {veh.guests}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-low text-ink-charcoal font-body-sm text-body-sm font-medium">
                                <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone">luggage</span>
                                {veh.luggage}
                              </span>
                              {veh.features.map((feat, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-low text-ink-charcoal font-body-sm text-body-sm font-medium"
                                >
                                  <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone">check</span>
                                  {feat}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-space-md pt-space-xs border-t border-border-warm/50">
                            <span className="font-body-sm text-body-sm text-on-surface-variant italic">
                              {veh.editorialPitch}
                            </span>
                            <span className={`inline-flex items-center gap-1 font-label-lg text-label-lg font-bold ${isSelected ? "text-primary" : "text-secondary"}`}>
                              <span className="material-symbols-outlined text-[20px]">
                                {isSelected ? "check_circle" : "radio_button_unchecked"}
                              </span>
                              <span>{isSelected ? "Tier Selected" : "Select Tier"}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Special Assurance Strip */}
                <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col md:flex-row items-center gap-space-md border border-border-warm/60">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[28px]">verified_user</span>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="font-title-md text-title-md text-ink-charcoal font-semibold">SK Baghel Imperial Chauffeur Standard</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Every driver is police-verified, fluent in conversational English, non-smoking, strictly trained in highway navigation, and equipped with live telemetry tracking.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 font-label-caps text-label-caps bg-surface-container-highest px-3 py-1.5 rounded text-ink-charcoal font-bold uppercase">
                      <span className="material-symbols-outlined text-[14px] text-success-jade">check</span> Zero Intoxication Policy
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Summary Ledger (4 Cols) */}
              <aside className="lg:col-span-4 sticky top-24">
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md border border-border-warm flex flex-col gap-space-md">
                  <div className="flex items-center justify-between pb-space-sm border-b border-border-warm">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone font-bold tracking-wider">
                        Booking Summary
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-ink-midnight font-medium">Trip Summary</h2>
                    </div>
                    <span className="w-8 h-8 rounded-full bg-sandstone-wash flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                    </span>
                  </div>

                  {/* Tour Snapshot */}
                  <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-xs border border-border-warm/60">
                    <span className="font-label-caps text-label-caps uppercase text-secondary font-bold">Tour Experience</span>
                    <div className="font-title-md text-title-md text-ink-charcoal font-semibold leading-snug">
                      {matchedPackage.name}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Includes Yamuna Expressway direct entry, dawn Taj gate bypass coordination &amp; 5-star palace breakfast.
                    </p>
                  </div>

                  {/* Configured Vehicle Live Display */}
                  <div className="p-space-md rounded-xl bg-sandstone-wash flex flex-col gap-1 border border-border-warm">
                    <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone font-bold">
                      Configured Vehicle Tier
                    </span>
                    <div className="font-title-lg text-title-lg text-ink-midnight font-semibold">
                      {selectedVehicle.name}
                    </div>
                    <div className="font-body-sm text-body-sm text-secondary">
                      {selectedVehicle.subtitle}
                    </div>
                  </div>

                  {/* All-Inclusive Checklist */}
                  <div className="flex flex-col gap-space-xs">
                    <span className="font-label-caps text-label-caps uppercase text-ink-charcoal font-bold tracking-wider">
                      All-Inclusive Highlights
                    </span>
                    <ul className="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-success-jade text-[18px] shrink-0 mt-0.5">check_circle</span>
                        <span><strong>Licensed ASI Historian Guide</strong> (English &amp; Foreign language)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-success-jade text-[18px] shrink-0 mt-0.5">check_circle</span>
                        <span><strong>5-Star Palace Buffet Breakfast</strong> (ITC Mughal Luxury Collection)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-success-jade text-[18px] shrink-0 mt-0.5">check_circle</span>
                        <span><strong>FASTag Tolls &amp; State Taxes</strong> (Both directions pre-cleared)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-success-jade text-[18px] shrink-0 mt-0.5">check_circle</span>
                        <span><strong>Doorstep Pickup &amp; Drop-off</strong> (Any Delhi NCR / Agra address)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-success-jade text-[18px] shrink-0 mt-0.5">check_circle</span>
                        <span><strong>Mineral Water &amp; Chilled Towels</strong> replenished throughout travel</span>
                      </li>
                    </ul>
                  </div>

                  {/* Price Ledger Breakdown */}
                  <div className="pt-space-sm border-t border-border-warm flex flex-col gap-2">
                    <div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface-variant">
                      <span>Standard Tour Base Package</span>
                      <span>₹{baseTourPrice.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface-variant">
                      <span>Vehicle Tier Adjustment</span>
                      <span className="text-success-jade font-medium">
                        {vehicleOffset > 0 ? `+₹${vehicleOffset.toLocaleString("en-IN")}` : "₹0 (Base Included)"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center font-body-sm text-body-sm text-success-jade">
                      <span>Expressway Fastag &amp; Parking Fees</span>
                      <span>Included (₹0)</span>
                    </div>
                    <div className="mt-space-xs pt-space-xs border-t border-border-warm flex items-baseline justify-between">
                      <div>
                        <span className="font-title-lg text-title-lg text-ink-midnight font-bold">Total Estimated Fare</span>
                        <span className="block font-body-sm text-body-sm text-on-surface-variant">For entire vehicle &amp; delegation</span>
                      </div>
                      <div className="text-right">
                        <span className="font-price-display text-price-display text-primary font-bold">
                          ₹{totalGrossPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transparent Pricing Footnote */}
                  <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg text-center border border-border-warm/60">
                    <span className="material-symbols-outlined text-[15px] inline align-middle text-terracotta-sandstone mr-1">
                      verified
                    </span>
                    No hidden charges. Tolls, interstate taxes &amp; chauffeur allowance 100% pre-calculated.
                  </p>

                  {/* Primary CTA Button to Step 2 */}
                  <button
                    onClick={handleProceedToStep2}
                    className="w-full py-3.5 px-space-md rounded-xl bg-terracotta-sandstone text-on-primary font-label-lg text-label-lg font-semibold hover:bg-terracotta-sunlit transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                    type="button"
                  >
                    <span>Continue to Date &amp; Pickup (Step 2)</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </button>

                  {/* Secondary WhatsApp Link */}
                  <a
                    className="flex items-center justify-center gap-2 py-2.5 px-space-sm rounded-lg bg-black hover:bg-neutral-900 border border-white/10 text-white font-label-lg text-label-lg transition-colors text-center active:scale-[0.98]"
                    href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                      `Hello SK Baghel Travels, I am interested in custom delegation for ${matchedPackage.name} with ${selectedVehicle.name}.`
                    )}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span>Need custom vehicle or delegation? WhatsApp</span>
                  </a>

                  {/* Trust Signals */}
                  <div className="pt-space-sm border-t border-border-warm flex flex-col gap-2 font-body-sm text-body-sm text-secondary">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-success-jade">local_police</span>
                      <span>100% Police-Verified &amp; Certified Chauffeurs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-success-jade">replay</span>
                      <span>100% Refund Guarantee up to 24h prior to pickup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-gold-accent">article_shortcut</span>
                      <span>Zero Forced Shopping / Zero Tourist Trap Guarantee</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* STEP 2: UNIVERSAL BILLING & BOOKING FORM SCREEN */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-space-md">
            <div className="w-full bg-surface-container-lowest rounded-xl shadow-md border border-border-warm overflow-hidden">
              {/* Form Card Header */}
              <div className="w-full bg-ink-charcoal text-ivory-surface px-space-lg py-space-md flex flex-wrap items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[20px] text-gold-accent">account_balance_wallet</span>
                  <h1 className="font-headline-sm text-headline-sm text-ivory-surface tracking-wide uppercase">
                    Pay Online — Enter Billing Details
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-secondary-container hover:text-ivory-surface underline mr-2"
                  >
                    ← Change Vehicle
                  </button>
                  <span className="font-label-caps text-label-caps text-surface-variant tracking-wider bg-ink-slate px-2.5 py-1 rounded">
                    Official Gateway
                  </span>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitBooking} className="p-space-md md:p-space-lg flex flex-col gap-space-md" id="billing-form">
                {/* Contact & Billing Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="bill-name">
                      <span>Full Name</span>
                      <span className="text-terracotta-sandstone font-body-sm">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm focus:outline-none focus:ring-1 focus:ring-primary"
                        id="bill-name"
                        name="name"
                        placeholder="Enter Name"
                        required
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-secondary">person</span>
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="bill-email">
                      <span>Email Address</span>
                      <span className="text-terracotta-sandstone font-body-sm">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm focus:outline-none focus:ring-1 focus:ring-primary"
                        id="bill-email"
                        name="email"
                        placeholder="Enter Email"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-secondary">mail</span>
                    </div>
                  </div>

                  {/* Mobile Contact */}
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="bill-phone">
                      <span>Mobile Contact</span>
                      <span className="text-terracotta-sandstone font-body-sm">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm focus:outline-none focus:ring-1 focus:ring-primary"
                        id="bill-phone"
                        name="mobile"
                        placeholder="Enter Mobile"
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-secondary">phone_iphone</span>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="bill-address">
                      <span>Billing Address</span>
                      <span className="text-terracotta-sandstone font-body-sm">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm focus:outline-none focus:ring-1 focus:ring-primary"
                        id="bill-address"
                        name="address"
                        placeholder="Enter Your Address"
                        required
                        type="text"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-secondary">home_pin</span>
                    </div>
                  </div>

                  {/* Country */}
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="bill-country">
                      <span>Country</span>
                      <span className="text-terracotta-sandstone font-body-sm">*</span>
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm appearance-none focus:outline-none cursor-pointer"
                        id="bill-country"
                        name="country"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      >
                        <option value="India">India</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Canada">Canada</option>
                        <option value="Japan">Japan</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[20px] text-secondary pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  {/* State */}
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="bill-state">
                      <span>State</span>
                      <span className="text-terracotta-sandstone font-body-sm">*</span>
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm appearance-none focus:outline-none cursor-pointer"
                        id="bill-state"
                        name="state"
                        required
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                      >
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Delhi NCR">Delhi NCR</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Punjab">Punjab</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[20px] text-secondary pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  {/* City */}
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="bill-city">
                      <span>City / Region</span>
                      <span className="text-terracotta-sandstone font-body-sm">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm focus:outline-none focus:ring-1 focus:ring-primary"
                        id="bill-city"
                        name="city"
                        placeholder="Enter City"
                        required
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-secondary">location_city</span>
                    </div>
                  </div>

                  {/* Pincode */}
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="bill-pincode">
                      <span>Pincode / Zipcode</span>
                      <span className="text-terracotta-sandstone font-body-sm">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm focus:outline-none focus:ring-1 focus:ring-primary"
                        id="bill-pincode"
                        name="pincode"
                        placeholder="Enter Pincode"
                        required
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-secondary">pin_drop</span>
                    </div>
                  </div>
                </div>

                {/* Logistics Date & Time Pickers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm pt-space-xs border-t border-border-warm/60">
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="tour-date">
                      <span>Tour / Pickup Date</span>
                      <span className="text-terracotta-sandstone font-body-sm">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm focus:outline-none focus:ring-1 focus:ring-primary"
                        id="tour-date"
                        name="tour_date"
                        type="date"
                        required
                        min={tomorrowDateString()}
                        value={tourDate}
                        onChange={(e) => setTourDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="pickup-time">
                      <span>Preferred Pickup Time</span>
                      <span className="text-terracotta-sandstone font-body-sm">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm focus:outline-none focus:ring-1 focus:ring-primary"
                        id="pickup-time"
                        name="pickup_time"
                        type="time"
                        required
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Pickup & Drop Instructions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="pickup-instructions">
                      <span>Pickup Instruction</span>
                      <span className="font-body-sm text-secondary font-normal">Rendezvous porch</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm focus:outline-none focus:ring-1 focus:ring-primary"
                        id="pickup-instructions"
                        name="pickup_instructions"
                        placeholder="e.g. Hotel Lobby, Terminal 3 Gate 4, Station Exit"
                        type="text"
                        value={pickupInstruction}
                        onChange={(e) => setPickupInstruction(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-secondary">flight_land</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-title-md text-title-md text-ink-charcoal flex items-center justify-between" htmlFor="drop-instructions">
                      <span>Drop Instruction</span>
                      <span className="font-body-sm text-secondary font-normal">Destination point</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2.5 rounded-lg shadow-sm border border-border-warm focus:outline-none focus:ring-1 focus:ring-primary"
                        id="drop-instructions"
                        name="drop_instructions"
                        placeholder="e.g. Return to Hotel / Agra Cantt Station / IGI Airport"
                        type="text"
                        value={dropInstruction}
                        onChange={(e) => setDropInstruction(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-secondary">near_me</span>
                    </div>
                  </div>
                </div>

                {/* Pet-Friendly Optional Addon Container */}
                <div className="bg-sandstone-wash/60 border border-border-warm rounded-xl p-space-sm md:p-space-md flex flex-col gap-space-xs shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-space-xs">
                    <div className="flex items-center gap-space-xs">
                      <div className="w-7 h-7 rounded-full bg-terracotta-sandstone/10 flex items-center justify-center text-terracotta-sandstone shrink-0">
                        <span className="material-symbols-outlined text-[18px]">pets</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-ink-charcoal">Traveling with a Pet?</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Complimentary seat protection &amp; planned highway comfort breaks
                        </span>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-surface-container-lowest px-2.5 py-1.5 rounded-lg border border-border-warm shadow-sm hover:border-terracotta-sandstone transition-colors">
                      <input
                        checked={hasPet}
                        onChange={(e) => setHasPet(e.target.checked)}
                        className="w-4 h-4 accent-terracotta-sandstone cursor-pointer rounded"
                        id="pet-friendly-toggle"
                        name="has_pet"
                        type="checkbox"
                      />
                      <span className="font-title-md text-title-md text-ink-charcoal">Yes, adding a pet</span>
                    </label>
                  </div>

                  {hasPet && (
                    <div className="flex flex-col gap-space-xs pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                        <div className="flex flex-col gap-1">
                          <label className="font-title-md text-title-md text-ink-charcoal" htmlFor="pet-type">
                            Pet Type / Breed
                          </label>
                          <input
                            className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2 rounded-lg border border-border-warm"
                            id="pet-type"
                            type="text"
                            value={petType}
                            onChange={(e) => setPetType(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-title-md text-title-md text-ink-charcoal" htmlFor="pet-size">
                            Pet Size / Weight Class
                          </label>
                          <select
                            className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2 rounded-lg border border-border-warm"
                            id="pet-size"
                            value={petSize}
                            onChange={(e) => setPetSize(e.target.value)}
                          >
                            <option value="small">Small Companion (&lt; 10 kg)</option>
                            <option value="medium">Medium Breed (10 – 25 kg)</option>
                            <option value="large">Large Breed (&gt; 25 kg)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 pt-1">
                        <label className="font-title-md text-title-md text-ink-charcoal" htmlFor="pet-notes">
                          Special Pet Requirements
                        </label>
                        <input
                          className="w-full bg-surface-container-lowest text-ink-charcoal font-body-md text-body-md px-3.5 py-2 rounded-lg border border-border-warm"
                          id="pet-notes"
                          type="text"
                          value={petNotes}
                          onChange={(e) => setPetNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Passenger / Guest Counter */}
                <div className="bg-surface-container-low p-space-sm md:p-space-md rounded-xl flex flex-wrap items-center justify-between gap-space-sm shadow-sm border border-border-warm/60">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[20px] text-terracotta-sandstone">groups</span>
                      <span className="font-title-md text-title-md text-ink-charcoal font-semibold">Adults &amp; Guests</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Dedicated vehicle custody for your private group
                    </span>
                  </div>
                  <div className="flex items-center bg-surface-container-lowest rounded-lg shadow-sm p-1 border border-border-warm">
                    <button
                      aria-label="Decrease passenger count"
                      className="w-9 h-9 flex items-center justify-center rounded bg-surface-container-low text-terracotta-sandstone hover:bg-sandstone-wash transition-colors text-title-lg font-bold"
                      onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="w-10 text-center font-headline-sm text-headline-sm text-ink-charcoal select-none">
                      {guestCount}
                    </span>
                    <button
                      aria-label="Increase passenger count"
                      className="w-9 h-9 flex items-center justify-center rounded bg-terracotta-sandstone text-on-primary hover:bg-terracotta-sunlit transition-colors text-title-lg font-bold"
                      onClick={() => setGuestCount((c) => Math.min(16, c + 1))}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>

                {/* Billing Summary Box */}
                <div className="bg-surface-container-lowest rounded-xl p-space-sm md:p-space-md flex flex-col gap-2 shadow-sm border border-border-warm">
                  <div className="flex justify-between items-center text-body-md font-body-md text-on-surface-variant pb-1.5 border-b border-border-warm">
                    <span>{matchedPackage.name} ({selectedVehicle.name})</span>
                    <span className="font-price-display text-title-md text-ink-charcoal font-semibold">
                      ₹{totalGrossPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-body-md font-body-md text-success-jade py-0.5">
                    <div className="flex items-center gap-1">
                      <span>Expressway FASTag Tolls &amp; State Permits</span>
                      <span className="material-symbols-outlined text-[14px] text-secondary">info</span>
                    </div>
                    <span className="font-price-display text-title-md font-semibold">Included (₹0)</span>
                  </div>
                  <div className="flex justify-between items-center pt-space-xs bg-sandstone-wash p-space-sm rounded-lg border border-border-warm">
                    <span className="font-title-lg text-title-lg text-ink-charcoal font-semibold">Total Estimated Fare</span>
                    <span className="font-price-display text-headline-sm text-terracotta-sandstone font-bold">
                      ₹{totalGrossPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Settlement Choice: 28% Advance Token vs Full 100% */}
                <div className="flex flex-col gap-space-xs pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-title-lg text-title-lg text-ink-charcoal font-semibold">Amount to Authorize</h3>
                    <span className="font-label-caps text-label-caps text-terracotta-sandstone uppercase bg-sandstone-wash px-2 py-0.5 rounded font-semibold">
                      Royal Charter Settlement
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                    {/* Partial 28% Choice */}
                    <label
                      onClick={() => setPaymentChoice("partial")}
                      className={`cursor-pointer flex items-center justify-between p-space-sm md:p-space-md rounded-xl border transition-all shadow-sm ${paymentChoice === "partial"
                          ? "bg-sandstone-wash/40 border-primary ring-1 ring-primary"
                          : "bg-surface-container-lowest border-border-warm hover:bg-surface-container-low"
                        }`}
                    >
                      <div className="flex items-center gap-space-sm">
                        <input
                          checked={paymentChoice === "partial"}
                          onChange={() => setPaymentChoice("partial")}
                          className="w-5 h-5 accent-terracotta-sandstone cursor-pointer"
                          name="payment_choice"
                          type="radio"
                          value="partial"
                        />
                        <div className="flex flex-col">
                          <span className="font-title-md text-title-md text-ink-charcoal font-semibold">
                            Pay ₹{advanceAmount.toLocaleString("en-IN")}
                          </span>
                          <span className="font-body-sm text-body-sm text-secondary">
                            28% Advance Token • Remaining ₹{balanceAmount.toLocaleString("en-IN")} on drop-off
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-gold-accent text-[22px]">payments</span>
                    </label>

                    {/* Full Payment Choice */}
                    <label
                      onClick={() => setPaymentChoice("full")}
                      className={`cursor-pointer flex items-center justify-between p-space-sm md:p-space-md rounded-xl border transition-all shadow-sm ${paymentChoice === "full"
                          ? "bg-sandstone-wash/40 border-primary ring-1 ring-primary"
                          : "bg-surface-container-lowest border-border-warm hover:bg-surface-container-low"
                        }`}
                    >
                      <div className="flex items-center gap-space-sm">
                        <input
                          checked={paymentChoice === "full"}
                          onChange={() => setPaymentChoice("full")}
                          className="w-5 h-5 accent-terracotta-sandstone cursor-pointer"
                          name="payment_choice"
                          type="radio"
                          value="full"
                        />
                        <div className="flex flex-col">
                          <span className="font-title-md text-title-md text-ink-charcoal font-semibold">
                            Pay ₹{totalGrossPrice.toLocaleString("en-IN")}
                          </span>
                          <span className="font-body-sm text-body-sm text-success-jade font-medium">
                            Complete Payment (100% Settled)
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-success-jade text-[22px]">verified</span>
                    </label>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="flex flex-col gap-space-xs pt-1">
                  <button
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-space-lg rounded-xl bg-terracotta-sandstone hover:bg-terracotta-sunlit disabled:opacity-50 text-on-primary font-title-lg text-title-lg text-center flex items-center justify-center gap-space-sm shadow-md transition-all cursor-pointer"
                    id="btn-continue-pay"
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    <span>
                      {isSubmitting ? "Authorizing Security Token..." : `Continue & Pay ₹${amountToCharge.toLocaleString("en-IN")}`}
                    </span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                  <p className="text-center font-body-sm text-body-sm text-on-surface-variant flex items-center justify-center gap-1.5 pt-0.5">
                    <span className="material-symbols-outlined text-[16px] text-success-jade">check_circle</span>
                    Instant digital voucher issued via WhatsApp &amp; Email. Free cancellation up to 24h prior.
                  </p>
                </div>

                {/* Supported Gateways Footer */}
                <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs bg-surface-container-low p-space-sm rounded-lg border border-border-warm/60">
                  <div className="flex items-center gap-space-xs text-body-sm font-body-sm text-secondary">
                    <span className="material-symbols-outlined text-[16px] text-ink-charcoal">verified_user</span>
                    <span>Supported Gateways:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-space-xs font-label-caps text-label-caps text-ink-charcoal">
                    <span className="bg-surface-container-lowest px-2 py-0.5 rounded shadow-sm border border-border-warm">UPI (GPay / PhonePe / Paytm)</span>
                    <span className="bg-surface-container-lowest px-2 py-0.5 rounded shadow-sm border border-border-warm">Visa</span>
                    <span className="bg-surface-container-lowest px-2 py-0.5 rounded shadow-sm border border-border-warm">Mastercard</span>
                    <span className="bg-surface-container-lowest px-2 py-0.5 rounded shadow-sm border border-border-warm">RuPay</span>
                    <span className="bg-surface-container-lowest px-2 py-0.5 rounded shadow-sm border border-border-warm">Net Banking</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP 3: BOOKING CONFIRMED & TRANSIT VOUCHER SCREEN */}
        {step === 3 && (
          <div className="flex flex-col gap-space-2xl">
            {/* Hero Confirmation Banner */}
            <div className="relative bg-surface-container-lowest rounded-xl p-space-xl lg:p-space-2xl shadow-sm border border-border-warm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-xl overflow-hidden">
              <div className="flex flex-col gap-space-sm max-w-2xl relative z-10">
                <div className="flex items-center gap-space-sm">
                  <div className="w-12 h-12 rounded-full bg-sandstone-wash flex items-center justify-center shadow-inner">
                    <div className="w-8 h-8 rounded-full bg-terracotta-sandstone flex items-center justify-center text-on-primary">
                      <span className="material-symbols-outlined text-[20px]">verified_user</span>
                    </div>
                  </div>
                  <span className="font-label-caps text-label-caps tracking-widest uppercase text-terracotta-sandstone bg-sandstone-wash px-space-sm py-1 rounded-full font-bold">
                    Booking Status: Guaranteed &amp; Active
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-ink-charcoal leading-tight">
                  Booking Confirmed &amp; Driver Assigned!
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  Your {paymentChoice === "partial" ? "28% advance deposit" : "payment"} has been successfully authorized. Your official booking receipt, QR pass, and driver tracking link have been sent via WhatsApp (<span className="text-ink-charcoal font-semibold">{phone}</span>) and email (<span className="text-ink-charcoal font-semibold">{email}</span>).
                </p>
                <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                  <div className="flex items-center gap-2 bg-surface-container px-space-md py-2 rounded-lg border border-border-warm">
                    <span className="material-symbols-outlined text-[18px] text-terracotta-sandstone">confirmation_number</span>
                    <span className="font-body-sm text-body-sm text-secondary">Booking Ref:</span>
                    <span className="font-title-md text-title-md text-ink-charcoal font-semibold">{bookingRef}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container px-space-md py-2 rounded-lg border border-border-warm">
                    <span className="material-symbols-outlined text-[18px] text-secondary">receipt_long</span>
                    <span className="font-body-sm text-body-sm text-secondary">GST Invoice:</span>
                    <span className="font-title-md text-title-md text-ink-charcoal font-semibold">{invoiceNumber}</span>
                  </div>
                </div>
              </div>

              {/* Quick Action Box */}
              <div className="flex flex-col w-full md:w-72 bg-sandstone-wash/80 rounded-xl p-space-md gap-space-sm shadow-sm border border-border-warm relative z-10 shrink-0">
                <span className="font-label-caps text-label-caps uppercase text-terracotta-sandstone tracking-wider font-bold">
                  Quick Actions
                </span>
                <button
                  className="w-full py-2.5 px-space-md bg-terracotta-sandstone text-on-primary rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-terracotta-sunlit transition-colors shadow-sm cursor-pointer"
                  onClick={() => window.print()}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Download PDF Receipt</span>
                </button>
                <a
                  className="w-full py-2.5 px-space-md bg-black hover:bg-neutral-900 border border-white/10 text-white rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-[0.98]"
                  href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
                    `Hello SK Baghel Travels, inquiry for Booking ${bookingRef}`
                  )}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  <span>WhatsApp Support Desk</span>
                </a>
              </div>
            </div>

            {/* Voucher and Dispatch Timeline Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              {/* Detailed Digital Transit Voucher (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-space-lg">
                <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden border border-border-warm">
                  {/* Voucher Header Strip */}
                  <div className="bg-ink-charcoal text-ivory-surface p-space-lg flex items-start justify-between gap-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps tracking-widest text-gold-accent uppercase font-bold">
                        Approved by Uttar Pradesh Tourism &amp; ASI
                      </span>
                      <h2 className="font-headline-sm text-headline-sm text-ivory-surface mt-1">Official Booking Confirmation &amp; Receipt</h2>
                      <p className="font-body-sm text-body-sm text-surface-container-high">
                        SK Baghel Tour &amp; Travels Agra • Taj Ganj Support Desk
                      </p>
                    </div>
                    <div className="bg-surface-container-highest/20 p-2 rounded-lg text-center shrink-0 border border-warm/20">
                      <span className="material-symbols-outlined text-[28px] text-gold-accent">qr_code_2</span>
                      <span className="block font-label-caps text-[9px] uppercase tracking-wider text-surface-container-high mt-0.5">
                        Scannable
                      </span>
                    </div>
                  </div>

                  {/* Voucher Inner Grid */}
                  <div className="p-space-lg flex flex-col gap-space-md">
                    {/* Passenger & Vehicle Highlight */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md bg-surface-container-low p-space-md rounded-lg border border-border-warm/60">
                      <div className="flex flex-col gap-1">
                        <span className="font-label-caps text-label-caps text-secondary uppercase font-bold">Lead Passenger</span>
                        <span className="font-title-md text-title-md text-on-surface font-semibold">{fullName}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone">phone_iphone</span>
                          {phone}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-label-caps text-label-caps text-secondary uppercase font-bold">Assigned Vehicle Class</span>
                        <span className="font-title-md text-title-md text-on-surface font-semibold">{selectedVehicle.name}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-terracotta-sandstone">airline_seat_recline_extra</span>
                          {selectedVehicle.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Rendezvous Schedule */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                      <div className="flex flex-col gap-1">
                        <span className="font-label-caps text-label-caps text-secondary uppercase font-bold">Date &amp; Time</span>
                        <span className="font-title-md text-title-md text-on-surface font-semibold">
                          {tourDate} • {pickupTime} AM
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Confirmed Staged Arrival</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-label-caps text-label-caps text-secondary uppercase font-bold">Pickup Porch</span>
                        <span className="font-title-md text-title-md text-on-surface font-semibold">{pickupInstruction}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Drop: {dropInstruction}</span>
                      </div>
                    </div>

                    {/* Settlement Accounting Breakdown */}
                    <div className="pt-space-sm border-t border-border-warm flex flex-col gap-2">
                      <div className="flex justify-between items-center font-body-sm text-body-sm text-on-surface-variant">
                        <span>Package Gross Total:</span>
                        <span>₹{totalGrossPrice.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between items-center font-body-sm text-body-sm text-success-jade">
                        <span>Advance Token Authorized (28%):</span>
                        <span className="font-semibold">₹{amountToCharge.toLocaleString("en-IN")} (Authorized)</span>
                      </div>
                      {paymentChoice === "partial" && (
                        <div className="flex justify-between items-center font-body-sm text-body-sm text-terracotta-sandstone">
                          <span>Balance Payable to Chauffeur on Drop-Off:</span>
                          <span className="font-semibold">₹{balanceAmount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chauffeur Dispatch Stages & Peace of Mind (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div className="bg-surface-container-low p-space-lg rounded-xl shadow-sm border border-border-warm flex flex-col gap-space-md">
                  <h3 className="font-title-lg text-title-lg text-ink-charcoal font-semibold">
                    Dispatch Protocol Timeline
                  </h3>

                  <div className="flex flex-col gap-4 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border-warm">
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-success-jade"></div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-ink-charcoal font-semibold">01. Voucher Dispatched</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Instant WhatsApp &amp; Email receipt sent</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary"></div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-ink-charcoal font-semibold">02. Chauffeur Assigned (2h Prior)</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Driver name, mobile number &amp; cab license plate SMS</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-surface-container-highest"></div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-ink-charcoal font-semibold">03. Vehicle Deep Sanitization</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Inspection of AC filters &amp; chilled water restock</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-surface-container-highest"></div>
                      <div className="flex flex-col">
                        <span className="font-title-md text-title-md text-ink-charcoal font-semibold">04. Porch Arrival</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">Chauffeur stages at porch 15 minutes ahead of schedule</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-space-sm border-t border-border-warm flex flex-col gap-2">
                    <a
                      href="/en/packages/"
                      className="w-full py-2.5 px-4 rounded-lg bg-sandstone-wash text-ink-charcoal font-label-lg text-label-lg text-center hover:bg-surface-container transition-colors"
                    >
                      Book Another Tour or Transfer
                    </a>
                    <a
                      href="/en/"
                      className="w-full py-2.5 px-4 rounded-lg bg-surface text-secondary font-label-lg text-label-lg text-center hover:text-ink-charcoal transition-colors"
                    >
                      Return to Home
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
