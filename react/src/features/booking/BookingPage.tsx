import { useMemo, useState } from "react";
import { LoadingIndicator } from "../../components/Chrome";
import { cities, routes, vehicles, type VehicleId } from "../../data/catalogue";
import { calcFare, findRoute, type TripType } from "./fareEngine";
import { formatInr } from "../../utils/format";
import { createDraftBooking, createPaymentCheckout, mapVehicleTier } from "../../services/api";

type Step = 1 | 2 | 3 | 4 | 5;
interface BookingState {
  step: Step;
  from: string;
  to: string;
  date: string;
  time: string;
  tripType: TripType;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  vehicleId: VehicleId;
  name: string;
  phone: string;
  email: string;
  pickupPoint: string;
  specialNotes?: string;
  promoCode: string;
  payment: "upi" | "card";
  bookingId: string;
  guestAccessToken?: string;
  confirmedFare?: {
    total: number;
    advance: number;
    balance: number;
  };
}

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dayAfterTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialState: BookingState = {
  step: 1,
  from: "agra",
  to: "delhi",
  date: tomorrow(),
  time: "08:30",
  tripType: "one-way",
  returnDate: dayAfterTomorrow(),
  returnTime: "18:00",
  passengers: 3,
  vehicleId: "sedan",
  name: "",
  phone: "",
  email: "",
  pickupPoint: "",
  specialNotes: "",
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
    const selectedRoute = routes.find((route) => route.id === params.get("route"));
    const routeFrom = params.get("from") ?? selectedRoute?.from;
    const routeTo = params.get("to") ?? selectedRoute?.to;
    const queryVehicle = params.get("vehicle") as VehicleId | null;
    const queryPassengers = Number(params.get("pax"));
    const queryDate = params.get("date");
    const queryTime = params.get("time");
    const queryCoupon = params.get("coupon");
    return {
      ...initialState,
      ...(isFresh ? draft : {}),
      ...(routeFrom ? { from: routeFrom } : {}),
      ...(routeTo ? { to: routeTo } : {}),
      ...(queryDate ? { date: queryDate } : {}),
      ...(queryTime ? { time: queryTime } : {}),
      ...(params.get("trip") === "round" ? { tripType: "round" as const } : {}),
      ...(queryPassengers > 0 ? { passengers: queryPassengers } : {}),
      ...(queryVehicle && vehicles.some((vehicle) => vehicle.id === queryVehicle) ? { vehicleId: queryVehicle } : {}),
      ...(queryCoupon ? { promoCode: queryCoupon } : {}),
    };
  } catch {
    return initialState;
  }
}

export function BookingPage() {
  const [state, setState] = useState<BookingState>(loadDraft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fare = useMemo(
    () =>
      calcFare({
        from: state.from,
        to: state.to,
        vehicleId: state.vehicleId,
        tripType: state.tripType,
        time: state.time,
        promoCode: state.promoCode,
      }),
    [state],
  );

  const update = <K extends keyof BookingState>(key: K, value: BookingState[K]) => {
    setState((current) => {
      const next = { ...current, [key]: value };
      sessionStorage.setItem("skb-booking", JSON.stringify({ ...next, createdAt: Date.now() }));
      return next;
    });
    setError("");
  };

  const next = () => {
    if (state.step === 1) {
      if (!fare || !state.date) return setError("Choose a published route and travel date.");
      if (state.tripType === "round" && state.returnDate && state.returnDate < state.date) {
        return setError("Return date cannot be earlier than departure date.");
      }
    }
    if (state.step === 3) {
      if (!state.name.trim()) return setError("Please enter your full name.");
      const digits = state.phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 14) {
        return setError("Please enter a valid 10-digit mobile number.");
      }
      if (state.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
        return setError("Please enter a valid email address or leave it blank.");
      }
    }
    setState((current) => ({ ...current, step: Math.min(5, current.step + 1) as Step }));
    setError("");
  };

  const back = () => setState((current) => ({ ...current, step: Math.max(1, current.step - 1) as Step }));

  const pay = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Resolve cities
      const fromCity = cities.find((c) => c.id === state.from);
      const toCity = cities.find((c) => c.id === state.to);
      const originName = fromCity ? fromCity.name : "Agra";
      const destinationName = toCity ? toCity.name : "Delhi";

      // 2. Resolve distance
      const activeRoute = findRoute(state.from, state.to);
      const distanceKm = activeRoute?.km || (fare?.km && Number(fare.km)) || 230;

      // 3. Format pickup datetime
      const pickupDateStr = `${state.date}T${state.time || "09:00"}:00`;
      let pickupDate = new Date(pickupDateStr);
      // Ensure at least 65 minutes ahead to respect backend validation
      const minFuture = new Date(Date.now() + 65 * 60 * 1000);
      if (pickupDate.getTime() < minFuture.getTime()) {
        pickupDate = minFuture;
      }
      const pickupDatetime = pickupDate.toISOString();

      // 4. Format return datetime if round trip
      let returnDatetime: string | undefined = undefined;
      if (state.tripType === "round" && state.returnDate) {
        returnDatetime = new Date(`${state.returnDate}T${state.returnTime || "18:00"}:00`).toISOString();
      }

      // 5. Build draft payload
      const draftPayload = {
        tripType: state.tripType === "round" ? ("round-trip" as const) : ("one-way" as const),
        vehicleTier: mapVehicleTier(state.vehicleId),
        originName,
        destinationName,
        pickupAddress:
          state.pickupPoint.trim().length >= 5
            ? state.pickupPoint.trim()
            : `${originName} Central Hotel / Station Pickup`,
        dropAddress: `${destinationName} Drop Location`,
        pickupDatetime,
        returnDatetime,
        distanceKm,
        customerName: state.name.trim(),
        customerPhone: state.phone.replace(/[^0-9+]/g, "").trim(),
        customerEmail: state.email.trim() || undefined,
        specialNotes: state.specialNotes?.trim() || undefined,
        promoCode: state.promoCode ? state.promoCode.trim().toUpperCase() : undefined,
      };

      // 6. Call backend API to record draft booking
      const draft = await createDraftBooking(draftPayload);

      // 7. Initialize checkout session
      try {
        const idempotencyKey =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        await createPaymentCheckout({
          ticketId: draft.ticketId,
          guestAccessToken: draft.guestAccessToken,
          idempotencyKey,
          provider: state.payment === "card" ? "card" : "razorpay",
          currency: "INR",
        });
      } catch (checkoutErr) {
        console.warn("Payment checkout creation warning:", checkoutErr);
      }

      // 8. Update state with confirmed ticket ID and transition to Step 5
      update("bookingId", draft.ticketId);
      setState((current) => ({
        ...current,
        bookingId: draft.ticketId,
        guestAccessToken: draft.guestAccessToken,
        confirmedFare: {
          total: draft.fare.totalFare,
          advance: draft.fare.advanceAmount,
          balance: draft.fare.balanceAmount,
        },
        step: 5,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record booking. Please verify details and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fromCityName = cities.find((c) => c.id === state.from)?.name || state.from;
  const toCityName = cities.find((c) => c.id === state.to)?.name || state.to;
  const vehicleName = vehicles.find((v) => v.id === state.vehicleId)?.name || state.vehicleId;

  return (
    <main id="main-content" className="booking-page">
      <section className="booking-heading">
        <p className="eyebrow">Book your journey</p>
        <h1>Find a comfortable ride from Agra.</h1>
        <p className="hero-copy">Search your route, compare vehicles, and confirm your booking with transparent pricing.</p>
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
              ? "Search trip"
              : state.step === 2
                ? "Choose vehicle"
                : state.step === 3
                  ? "Traveller details"
                  : state.step === 4
                    ? "Review and pay"
                    : "Booking confirmed"}
          </h2>

          {state.step === 1 && (
            <div className="booking-form">
              <label>
                From
                <select value={state.from} onChange={(event) => update("from", event.target.value)}>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} ({city.code})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                To
                <select value={state.to} onChange={(event) => update("to", event.target.value)}>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name} ({city.code})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Journey type
                <select value={state.tripType} onChange={(event) => update("tripType", event.target.value as TripType)}>
                  <option value="one-way">One way</option>
                  <option value="round">Round trip</option>
                </select>
              </label>
              <label>
                Departure Date
                <input type="date" min={tomorrow()} value={state.date} onChange={(event) => update("date", event.target.value)} />
              </label>
              <label>
                Pickup time
                <input type="time" value={state.time} onChange={(event) => update("time", event.target.value)} />
              </label>
              {state.tripType === "round" && (
                <>
                  <label>
                    Return Date
                    <input
                      type="date"
                      min={state.date || tomorrow()}
                      value={state.returnDate || state.date}
                      onChange={(event) => update("returnDate", event.target.value)}
                    />
                  </label>
                  <label>
                    Return time
                    <input
                      type="time"
                      value={state.returnTime || "18:00"}
                      onChange={(event) => update("returnTime", event.target.value)}
                    />
                  </label>
                </>
              )}
              <label>
                Passengers
                <select value={state.passengers} onChange={(event) => update("passengers", Number(event.target.value))}>
                  {[1, 2, 3, 4, 6, 12, 16].map((count) => (
                    <option key={count} value={count}>
                      {count} passengers
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {state.step === 2 && (
            <div className="vehicle-results">
              {vehicles.map((vehicle) => {
                const result = calcFare({
                  from: state.from,
                  to: state.to,
                  vehicleId: vehicle.id,
                  tripType: state.tripType,
                  time: state.time,
                  promoCode: state.promoCode,
                });
                const disabled = vehicle.seats < state.passengers || !result;
                return (
                  <label
                    key={vehicle.id}
                    className={`vehicle-result ${state.vehicleId === vehicle.id ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}
                  >
                    <img src={vehicle.image} alt="" width="160" height="100" loading="lazy" />
                    <span>
                      <strong>{vehicle.name}</strong>
                      <small>{vehicle.tags.join(" · ")}</small>
                    </span>
                    <b>{result ? formatInr(result.total) : "—"}</b>
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
                  onChange={(event) => update("name", event.target.value)}
                  autoComplete="name"
                  placeholder="e.g. Rahul Sharma"
                />
              </label>
              <label>
                Mobile Number
                <input
                  value={state.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="10-digit mobile number"
                />
              </label>
              <label>
                Email Address (Optional)
                <input
                  type="email"
                  value={state.email}
                  onChange={(event) => update("email", event.target.value)}
                  autoComplete="email"
                  placeholder="name@example.com"
                />
              </label>
              <label>
                Pickup Location / Landmark
                <input
                  value={state.pickupPoint}
                  onChange={(event) => update("pickupPoint", event.target.value)}
                  placeholder="Hotel, station, or landmark address"
                />
              </label>
              <label>
                Promo code
                <input
                  value={state.promoCode}
                  onChange={(event) => update("promoCode", event.target.value)}
                  placeholder="ASTTCAR500OFF"
                />
              </label>
            </div>
          )}

          {state.step === 4 && (
            <div className="review-panel">
              <p>Confirm booking with advance payment via:</p>
              <label>
                <input type="radio" checked={state.payment === "upi"} onChange={() => update("payment", "upi")} /> UPI / QR Code
              </label>
              <label>
                <input type="radio" checked={state.payment === "card"} onChange={() => update("payment", "card")} /> Debit / Credit Card / NetBanking
              </label>
              <p className="muted">
                A transparent advance confirms your vehicle assignment. The remaining balance is payable directly to your chauffeur at trip completion.
              </p>
            </div>
          )}

          {state.step === 5 && (
            <div className="confirmation-panel">
              <p className="eyebrow">Booking Registered</p>
              <h3>{state.bookingId}</h3>
              <p>
                Your ride request from <strong>{fromCityName}</strong> to <strong>{toCityName}</strong> has been confirmed and logged in our dispatch desk for <strong>{state.date}</strong> at <strong>{state.time}</strong>.
              </p>
              <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--surface, #f8f9fa)", borderRadius: "4px" }}>
                <div className="summary-line">
                  <span>Assigned Fleet</span>
                  <strong>{vehicleName}</strong>
                </div>
                <div className="summary-line">
                  <span>Advance Confirmed</span>
                  <strong>{formatInr(state.confirmedFare?.advance || (fare ? fare.advance : 0))}</strong>
                </div>
                <div className="summary-line">
                  <span>Balance Payable to Chauffeur</span>
                  <strong>{formatInr(state.confirmedFare?.balance || (fare ? fare.remaining : 0))}</strong>
                </div>
              </div>
              <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <a
                  href={`https://wa.me/919876543210?text=${encodeURIComponent(`Hi SK Baghel Desk, I have booked ride ${state.bookingId} for ${state.date}. Please confirm vehicle assignment.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary"
                >
                  WhatsApp Travel Desk
                </a>
                <a href="tel:+919876543210" className="button button-outline">
                  Call Dispatch Desk
                </a>
              </div>
            </div>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {loading && <LoadingIndicator label="Registering booking with dispatch desk…" />}

          {!loading && state.step < 5 && (
            <div className="booking-actions">
              {state.step > 1 && (
                <button className="button button-outline" type="button" onClick={back}>
                  Back
                </button>
              )}
              {state.step === 4 ? (
                <button className="button button-primary" type="button" onClick={pay}>
                  Pay {fare ? formatInr(fare.advance) : "advance"}
                </button>
              ) : (
                <button className="button button-primary" type="button" onClick={next}>
                  {state.step === 1 ? "Search rides" : "Continue"}
                </button>
              )}
            </div>
          )}
        </section>

        <aside className="fare-summary" aria-label="Booking summary">
          <p className="eyebrow">Live fare summary</p>
          <h2>{fare?.label ?? "Choose a route"}</h2>
          {fare ? (
            <>
              <p>
                {fare.duration} · {fare.km ?? "Package"} km · {fare.vehicle.name}
              </p>
              <div className="summary-line">
                <span>Total fare</span>
                <strong>{formatInr(fare.total)}</strong>
              </div>
              <div className="summary-line">
                <span>Advance now</span>
                <strong>{formatInr(fare.advance)}</strong>
              </div>
              <div className="summary-line">
                <span>To driver</span>
                <strong>{formatInr(fare.remaining)}</strong>
              </div>
            </>
          ) : (
            <p>Published route fares appear here as you search.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
