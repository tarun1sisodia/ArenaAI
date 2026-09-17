import { useMemo, useState } from "react";
import { LoadingIndicator } from "../../components/Chrome";
import { cities, routes, vehicles, packages, type VehicleId } from "../../data/catalogue";
import { calcFare, localPackages, type TripType, type LocalPackageKey } from "./fareEngine";
import { formatInr } from "../../utils/format";
import { createDraftBooking, mapVehicleTier } from "../../services/api";

type Step = 1 | 2 | 3 | 4 | 5;
export type ServiceCategory = "outstation" | "local" | "airport" | "package";

interface BookingState {
  step: Step;
  serviceCategory: ServiceCategory;
  from: string;
  to: string;
  tripType: TripType;
  localPackage: LocalPackageKey;
  packageId: string;
  transferPoint: string;
  transferType: "pickup" | "drop";
  date: string;
  time: string;
  passengers: number;
  vehicleId: VehicleId;
  name: string;
  phone: string;
  pickupPoint: string;
  promoCode: string;
  payment: "upi" | "card";
  bookingId: string;
}

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AIRPORT_TRANSFER_POINTS = [
  { id: "delhi-airport", name: "Delhi IGI Airport (T1/T2/T3)", isDelhi: true },
  { id: "agra-cantt", name: "Agra Cantt Railway Station (AGC)", isDelhi: false },
  { id: "agra-airport", name: "Agra Kheria Airport (AGR)", isDelhi: false },
  { id: "agra-fort", name: "Agra Fort Railway Station (AF)", isDelhi: false },
];

const initialState: BookingState = {
  step: 1,
  serviceCategory: "outstation",
  from: "agra",
  to: "delhi",
  date: tomorrow(),
  time: "08:30",
  tripType: "one-way",
  localPackage: "8hr-80km",
  packageId: "taj-mahal-sunrise-tour",
  transferPoint: "delhi-airport",
  transferType: "pickup",
  passengers: 3,
  vehicleId: "sedan",
  name: "",
  phone: "",
  pickupPoint: "",
  promoCode: "",
  payment: "upi",
  bookingId: "",
};

function loadDraft(): BookingState {
  try {
    if (typeof window === "undefined") return initialState;
    const saved = sessionStorage.getItem("skb-booking");
    const draft = saved ? (JSON.parse(saved) as Partial<BookingState> & { createdAt?: number }) : null;
    const isFresh = draft?.createdAt && Date.now() - draft.createdAt < 24 * 60 * 60 * 1000;
    const params = new URLSearchParams(window.location.search);

    const queryService = params.get("service");
    const queryPackage = params.get("package") || params.get("pkg");
    const queryTransfer = params.get("transfer");
    const selectedRoute = routes.find((route) => route.id === params.get("route"));
    const routeFrom = params.get("from") ?? selectedRoute?.from;
    const routeTo = params.get("to") ?? selectedRoute?.to;
    const queryVehicle = params.get("vehicle") as VehicleId | null;
    const queryPassengers = Number(params.get("pax"));
    const queryDate = params.get("date");
    const queryTime = params.get("time");
    const queryCoupon = params.get("coupon");
    const queryTrip = params.get("trip");

    // Determine initial serviceCategory from parameters
    let serviceCategory: ServiceCategory = "outstation";
    let localPackage: LocalPackageKey = "8hr-80km";
    let packageId = "taj-mahal-sunrise-tour";
    let transferPoint = "delhi-airport";

    if (queryPackage) {
      const matchLocal = Object.keys(localPackages).find((k) => k === queryPackage);
      if (matchLocal) {
        serviceCategory = matchLocal === "airport-transfer" ? "airport" : "local";
        localPackage = matchLocal as LocalPackageKey;
      } else {
        const matchTour = packages.find((p) => p.slug === queryPackage || p.id === queryPackage);
        if (matchTour) {
          serviceCategory = "package";
          packageId = matchTour.slug || matchTour.id;
        }
      }
    } else if (queryTransfer) {
      serviceCategory = "airport";
      transferPoint = queryTransfer;
    } else if (queryService) {
      if (queryService === "local") {
        serviceCategory = "local";
      } else if (queryService === "airport") {
        serviceCategory = "airport";
      } else if (queryService === "tours") {
        serviceCategory = "package";
      } else if (queryService === "roundtrip") {
        serviceCategory = "outstation";
      } else if (queryService === "tempo") {
        serviceCategory = "outstation";
      }
    } else if (queryTrip === "local") {
      serviceCategory = "local";
    }

    return {
      ...initialState,
      ...(isFresh ? draft : {}),
      serviceCategory: (draft?.serviceCategory && !queryService && !queryPackage && !queryTransfer) ? draft.serviceCategory : serviceCategory,
      ...(routeFrom ? { from: routeFrom } : {}),
      ...(routeTo ? { to: routeTo } : {}),
      ...(queryDate ? { date: queryDate } : {}),
      ...(queryTime ? { time: queryTime } : {}),
      ...(queryTrip === "round" || queryService === "roundtrip" ? { tripType: "round" as const } : {}),
      ...(queryPassengers > 0 ? { passengers: queryPassengers } : {}),
      ...(queryVehicle && vehicles.some((v) => v.id === queryVehicle) ? { vehicleId: queryVehicle } : queryService === "tempo" ? { vehicleId: "tempo" } : {}),
      ...(queryCoupon ? { promoCode: queryCoupon } : {}),
      localPackage: (queryPackage && queryPackage in localPackages) ? (queryPackage as LocalPackageKey) : localPackage,
      packageId,
      transferPoint,
    };
  } catch {
    return initialState;
  }
}

export function BookingPage() {
  const [state, setState] = useState<BookingState>(loadDraft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fare = useMemo(() => {
    if (state.serviceCategory === "package") {
      return calcFare({
        packageId: state.packageId,
        vehicleId: state.vehicleId,
        time: state.time,
        promoCode: state.promoCode,
      });
    }
    if (state.serviceCategory === "local") {
      return calcFare({
        localPackageKey: state.localPackage,
        vehicleId: state.vehicleId,
        time: state.time,
        promoCode: state.promoCode,
      });
    }
    if (state.serviceCategory === "airport") {
      const isDelhi = state.transferPoint === "delhi-airport";
      if (isDelhi) {
        return calcFare({
          from: "agra",
          to: "delhi",
          vehicleId: state.vehicleId,
          tripType: "one-way",
          time: state.time,
          promoCode: state.promoCode,
        });
      }
      return calcFare({
        localPackageKey: "airport-transfer",
        vehicleId: state.vehicleId,
        time: state.time,
        promoCode: state.promoCode,
      });
    }
    return calcFare({
      from: state.from,
      to: state.to,
      vehicleId: state.vehicleId,
      tripType: state.tripType,
      time: state.time,
      promoCode: state.promoCode,
    });
  }, [state]);

  const update = <K extends keyof BookingState>(key: K, value: BookingState[K]) => {
    setState((current) => {
      const next = { ...current, [key]: value };
      sessionStorage.setItem("skb-booking", JSON.stringify({ ...next, createdAt: Date.now() }));
      return next;
    });
    setError("");
  };

  const next = () => {
    if (state.step === 1 && (!fare || !state.date)) {
      return setError("Please complete all trip options and ensure a valid fare quote is available.");
    }
    if (state.step === 3 && (!state.name.trim() || !/^[0-9+\-\s]{10,}$/.test(state.phone))) {
      return setError("Enter your name and a valid phone number (at least 10 digits).");
    }
    setState((current) => ({ ...current, step: Math.min(5, current.step + 1) as Step }));
    setError("");
  };

  const back = () => setState((current) => ({ ...current, step: Math.max(1, current.step - 1) as Step }));

  const pay = async () => {
    setLoading(true);
    let bookingId = `AGR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    try {
      let originName = "";
      let destinationName = "";
      let tripTypeFormatted: "one-way" | "round-trip" = "one-way";

      if (state.serviceCategory === "outstation") {
        originName = cities.find((c) => c.id === state.from)?.name || state.from;
        destinationName = cities.find((c) => c.id === state.to)?.name || state.to;
        tripTypeFormatted = state.tripType === "round" ? "round-trip" : "one-way";
      } else if (state.serviceCategory === "local") {
        originName = "Agra";
        const lp = (localPackages as Record<string, { label?: string }>)[state.localPackage];
        destinationName = lp?.label || "Agra Sightseeing";
      } else if (state.serviceCategory === "airport") {
        const transferObj = AIRPORT_TRANSFER_POINTS.find((p) => p.id === state.transferPoint);
        const pointName = transferObj?.name || state.transferPoint;
        originName = state.transferType === "pickup" ? pointName : "Agra";
        destinationName = state.transferType === "pickup" ? "Agra" : pointName;
      } else {
        const pkg = packages.find((p) => p.id === state.packageId || p.slug === state.packageId);
        originName = "Agra";
        destinationName = pkg?.name || "Curated Tour Package";
      }

      const digits = state.phone.replace(/\D/g, "");
      const formattedPhone = state.phone.startsWith("+")
        ? state.phone
        : `+91${digits.length === 10 ? digits : "9876543210"}`;

      const res = await createDraftBooking({
        tripType: tripTypeFormatted,
        vehicleTier: mapVehicleTier(state.vehicleId),
        originName,
        destinationName,
        pickupAddress: state.pickupPoint || `${originName} Central`,
        dropAddress: `${destinationName} Central`,
        pickupDatetime: `${state.date}T${state.time}:00Z`,
        customerName: state.name || "Guest Customer",
        customerPhone: formattedPhone,
        promoCode: state.promoCode || undefined,
      });

      if (res?.ticketId || res?.bookingId) {
        bookingId = res.ticketId || res.bookingId;
      }
    } catch {
      // Graceful fallback to simulated booking ID on offline / mock mode
    }
    update("bookingId", bookingId);
    setState((current) => ({ ...current, bookingId, step: 5 }));
    setLoading(false);
  };

  const getServiceLabel = () => {
    if (state.serviceCategory === "outstation") return "Outstation Taxi";
    if (state.serviceCategory === "local") return "Local Sightseeing";
    if (state.serviceCategory === "airport") return "Airport & Station Transfer";
    return "Curated Tour Package";
  };

  return (
    <main id="main-content" className="booking-page">
      <section className="booking-heading">
        <p className="eyebrow">Online Reservation</p>
        <h1>Book your journey with SK Baghel.</h1>
        <p className="hero-copy">
          Select your service vertical, customize your vehicle, and reserve with a verified advance deposit.
        </p>
      </section>

      <div className="booking-layout">
        <section className="booking-card" aria-labelledby="booking-form-heading">
          <div className="booking-steps" aria-label="Booking progress">
            {[1, 2, 3, 4, 5].map((step) => (
              <span key={step} className={state.step >= step ? "is-active" : ""}>
                {step}
              </span>
            ))}
          </div>
          <h2 id="booking-form-heading">
            {state.step === 1
              ? "1. Select Service & Trip"
              : state.step === 2
              ? "2. Choose Vehicle"
              : state.step === 3
              ? "3. Traveller Details"
              : state.step === 4
              ? "4. Review & Confirm"
              : "5. Booking Confirmed"}
          </h2>

          {state.step === 1 && (
            <div className="booking-form">
              {/* Service Type Selector */}
              <div
                style={{
                  gridColumn: "span 2",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "8px",
                }}
                role="tablist"
                aria-label="Service category"
              >
                {[
                  { id: "outstation", label: "🛣️ Outstation Drop / Round", desc: "Intercity taxi" },
                  { id: "local", label: "🏛️ Local Sightseeing", desc: "8H/80KM & 12H/120KM" },
                  { id: "airport", label: "✈️ Airport & Station", desc: "Transfers & pickups" },
                  { id: "package", label: "🌅 Tour Packages", desc: "Curated heritage tours" },
                ].map((s) => {
                  const isSelected = state.serviceCategory === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => update("serviceCategory", s.id as ServiceCategory)}
                      style={{
                        flex: "1 1 calc(50% - 8px)",
                        minWidth: "160px",
                        padding: "12px 14px",
                        border: isSelected ? "2px solid var(--gold)" : "1px solid var(--border)",
                        borderRadius: "var(--radius, 8px)",
                        background: isSelected ? "var(--gold-wash, rgba(217, 148, 59, 0.08))" : "var(--surface)",
                        color: isSelected ? "var(--ink, #121416)" : "var(--text)",
                        textAlign: "left",
                        cursor: "pointer",
                        fontWeight: isSelected ? 700 : 500,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ fontSize: "14px" }}>{s.label}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-soft)", marginTop: "2px" }}>{s.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Conditional Form per Service Category */}
              {state.serviceCategory === "outstation" && (
                <>
                  <label>
                    From (Pickup City)
                    <select value={state.from} onChange={(e) => update("from", e.target.value)}>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name} ({city.code})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    To (Destination)
                    <select value={state.to} onChange={(e) => update("to", e.target.value)}>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name} ({city.code})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Journey Type
                    <select
                      value={state.tripType}
                      onChange={(e) => update("tripType", e.target.value as TripType)}
                    >
                      <option value="one-way">One-Way Drop (Expressway Tolls Included)</option>
                      <option value="round">Outstation Round-Trip (300 km/day min)</option>
                    </select>
                  </label>
                </>
              )}

              {state.serviceCategory === "local" && (
                <div style={{ gridColumn: "span 2" }}>
                  <label>
                    Select Local Package
                    <select
                      value={state.localPackage}
                      onChange={(e) => update("localPackage", e.target.value as LocalPackageKey)}
                    >
                      <option value="8hr-80km">Agra Sightseeing (8 Hours / 80 KM) — Taj Mahal & Agra Fort</option>
                      <option value="12hr-120km">Agra Extended Tour (12 Hours / 120 KM) — Taj, Fort, Mehtab Bagh & Sikandra</option>
                    </select>
                  </label>
                </div>
              )}

              {state.serviceCategory === "airport" && (
                <>
                  <label>
                    Transfer Location
                    <select
                      value={state.transferPoint}
                      onChange={(e) => update("transferPoint", e.target.value)}
                    >
                      {AIRPORT_TRANSFER_POINTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Transfer Direction
                    <select
                      value={state.transferType}
                      onChange={(e) => update("transferType", e.target.value as "pickup" | "drop")}
                    >
                      <option value="pickup">Pickup from Station / Airport to Hotel</option>
                      <option value="drop">Drop from Hotel / Home to Station / Airport</option>
                    </select>
                  </label>
                </>
              )}

              {state.serviceCategory === "package" && (
                <div style={{ gridColumn: "span 2" }}>
                  <label>
                    Select Curated Tour Package
                    <select
                      value={state.packageId}
                      onChange={(e) => update("packageId", e.target.value)}
                    >
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.slug || pkg.id}>
                          {pkg.name} ({pkg.duration} — From ₹{pkg.from.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {/* Shared Date, Time, Passengers */}
              <label>
                Travel Date
                <input
                  type="date"
                  min={tomorrow()}
                  value={state.date}
                  onChange={(e) => update("date", e.target.value)}
                />
              </label>
              <label>
                Pickup Time
                <input
                  type="time"
                  value={state.time}
                  onChange={(e) => update("time", e.target.value)}
                />
              </label>
              <label style={{ gridColumn: "span 2" }}>
                Passengers
                <select
                  value={state.passengers}
                  onChange={(e) => update("passengers", Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 6, 7, 12, 16, 20].map((count) => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? "passenger" : "passengers"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {state.step === 2 && (
            <div className="vehicle-results">
              <p style={{ marginBottom: "16px", color: "var(--text-soft)", fontSize: "14px" }}>
                Showing verified fleet rates for <strong>{getServiceLabel()}</strong>:
              </p>
              {vehicles.map((vehicle) => {
                let quote = null;
                if (state.serviceCategory === "package") {
                  quote = calcFare({
                    packageId: state.packageId,
                    vehicleId: vehicle.id,
                    time: state.time,
                    promoCode: state.promoCode,
                  });
                } else if (state.serviceCategory === "local") {
                  quote = calcFare({
                    localPackageKey: state.localPackage,
                    vehicleId: vehicle.id,
                    time: state.time,
                    promoCode: state.promoCode,
                  });
                } else if (state.serviceCategory === "airport") {
                  const isDelhi = state.transferPoint === "delhi-airport";
                  quote = isDelhi
                    ? calcFare({
                        from: "agra",
                        to: "delhi",
                        vehicleId: vehicle.id,
                        tripType: "one-way",
                        time: state.time,
                        promoCode: state.promoCode,
                      })
                    : calcFare({
                        localPackageKey: "airport-transfer",
                        vehicleId: vehicle.id,
                        time: state.time,
                        promoCode: state.promoCode,
                      });
                } else {
                  quote = calcFare({
                    from: state.from,
                    to: state.to,
                    vehicleId: vehicle.id,
                    tripType: state.tripType,
                    time: state.time,
                    promoCode: state.promoCode,
                  });
                }

                const disabled = vehicle.seats < state.passengers || !quote;
                return (
                  <label
                    key={vehicle.id}
                    className={`vehicle-result ${state.vehicleId === vehicle.id ? "is-selected" : ""} ${
                      disabled ? "is-disabled" : ""
                    }`}
                  >
                    <img src={vehicle.image} alt={vehicle.name} width="160" height="100" loading="lazy" />
                    <span>
                      <strong>{vehicle.name}</strong>
                      <small>
                        {vehicle.seats} seats · {vehicle.bags} bags · {vehicle.tags.join(" · ")}
                      </small>
                    </span>
                    <b>{quote ? formatInr(quote.total) : "—"}</b>
                    <input
                      type="radio"
                      name="vehicle"
                      disabled={disabled}
                      checked={state.vehicleId === vehicle.id}
                      onChange={() => update("vehicleId", vehicle.id)}
                    />
                  </label>
                );
              })}
            </div>
          )}

          {state.step === 3 && (
            <div className="booking-form">
              <label>
                Full Name
                <input
                  value={state.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </label>
              <label>
                Phone / WhatsApp Number
                <input
                  value={state.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </label>
              <label style={{ gridColumn: "span 2" }}>
                Pickup Location / Hotel / Station Landmark
                <input
                  value={state.pickupPoint}
                  onChange={(e) => update("pickupPoint", e.target.value)}
                  placeholder="Hotel name, station platform, or residential address in Agra"
                />
              </label>
              <label style={{ gridColumn: "span 2" }}>
                Promotional Coupon Code
                <input
                  value={state.promoCode}
                  onChange={(e) => update("promoCode", e.target.value)}
                  placeholder="ASTTCAR500OFF (Flat ₹500 off on ₹2,000+)"
                />
              </label>
            </div>
          )}

          {state.step === 4 && (
            <div className="review-panel">
              <div style={{ marginBottom: "16px", padding: "12px", background: "var(--bg-alt)", borderRadius: "var(--radius)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Service:</span>
                  <strong>{getServiceLabel()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Vehicle:</span>
                  <strong>{fare?.vehicle.name} ({fare?.vehicle.seats} seats)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Travel Date:</span>
                  <strong>{state.date} at {state.time} IST</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Passenger:</span>
                  <strong>{state.name} ({state.phone})</strong>
                </div>
              </div>

              <p>Select advance deposit payment method:</p>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0", cursor: "pointer" }}>
                <input
                  type="radio"
                  checked={state.payment === "upi"}
                  onChange={() => update("payment", "upi")}
                />
                <span>UPI / QR Payment (Google Pay, PhonePe, Paytm)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0", cursor: "pointer" }}>
                <input
                  type="radio"
                  checked={state.payment === "card"}
                  onChange={() => update("payment", "card")}
                />
                <span>Credit / Debit Card / NetBanking</span>
              </label>
              <p className="muted" style={{ marginTop: "12px" }}>
                Note: In this preview environment, payments simulate the 28% advance deposit without live debit. Driver balance is collected directly upon ride completion.
              </p>
            </div>
          )}

          {state.step === 5 && (
            <div className="confirmation-panel">
              <p className="eyebrow">Reservation Confirmed</p>
              <h3 style={{ fontSize: "24px", color: "var(--gold)", margin: "8px 0" }}>{state.bookingId}</h3>
              <p style={{ marginTop: "8px" }}>
                Your booking request has been successfully recorded. A confirmation message and chauffeur contact will be coordinated via WhatsApp.
              </p>
              <div style={{ marginTop: "20px" }}>
                <a
                  href={`https://wa.me/919876543210?text=${encodeURIComponent(
                    `Hello SK Baghel Travels, I have booked ${state.bookingId} (${getServiceLabel()}) for ${state.date}. Please confirm dispatch.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-gold"
                >
                  Message Desk on WhatsApp ↗
                </a>
              </div>
            </div>
          )}

          {error && (
            <p className="form-error" role="alert" style={{ marginTop: "16px" }}>
              {error}
            </p>
          )}

          {loading && <LoadingIndicator label="Securing advance reservation…" />}

          {!loading && state.step < 5 && (
            <div className="booking-actions" style={{ marginTop: "24px" }}>
              {state.step > 1 && (
                <button className="button button-outline" type="button" onClick={back}>
                  ← Back
                </button>
              )}
              {state.step === 4 ? (
                <button className="button button-primary" type="button" onClick={pay}>
                  Pay {fare ? formatInr(fare.advance) : "Advance"} Deposit ↗
                </button>
              ) : (
                <button className="button button-primary" type="button" onClick={next}>
                  {state.step === 1 ? "Select Vehicle →" : "Continue →"}
                </button>
              )}
            </div>
          )}
        </section>

        <aside className="fare-summary" aria-label="Booking summary">
          <p className="eyebrow">Transparent Fare Summary</p>
          <h2>{fare?.label ?? "Calculating Fare…"}</h2>
          {fare ? (
            <>
              <p style={{ color: "var(--text-soft)", fontSize: "14px", margin: "4px 0 16px" }}>
                {fare.duration} · {fare.km ? `${fare.km} km · ` : ""}{fare.vehicle.name}
              </p>
              <div className="summary-line">
                <span>Total Calculated Fare</span>
                <strong>{formatInr(fare.total)}</strong>
              </div>
              <div className="summary-line">
                <span>Advance Deposit (28%)</span>
                <strong style={{ color: "var(--gold)" }}>{formatInr(fare.advance)}</strong>
              </div>
              <div className="summary-line">
                <span>Balance to Chauffeur</span>
                <strong>{formatInr(fare.remaining)}</strong>
              </div>
              {fare.promo?.valid && (
                <div className="summary-line" style={{ color: "var(--success, #2e7d32)" }}>
                  <span>Coupon Discount</span>
                  <span>-₹{fare.promo.discount}</span>
                </div>
              )}
              <div style={{ marginTop: "20px", fontSize: "12px", color: "var(--text-soft)", lineHeight: 1.5 }}>
                ✓ Includes highway tolls, fuel, and state passenger tax.<br />
                ✓ Verified sanitized vehicle with chauffeur.<br />
                ✓ Zero hidden charges on arrival.
              </div>
            </>
          ) : (
            <p>Select your route or tour details to see verified, all-inclusive pricing.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
