import { useMemo, useState } from "react";
import { LoadingIndicator } from "../../components/Chrome";
import { cities, routes, vehicles, type VehicleId } from "../../data/catalogue";
import { calcFare, type TripType } from "./fareEngine";
import { formatInr } from "../../utils/format";

type Step = 1 | 2 | 3 | 4 | 5;
interface BookingState {
  step: Step;
  from: string;
  to: string;
  date: string;
  time: string;
  tripType: TripType;
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

const initialState: BookingState = {
  step: 1,
  from: "agra",
  to: "delhi",
  date: tomorrow(),
  time: "08:30",
  tripType: "one-way",
  passengers: 3,
  vehicleId: "sedan",
  name: "",
  phone: "",
  pickupPoint: "",
  promoCode: "",
  payment: "upi",
  bookingId: ""
};

function loadDraft(): BookingState {
  try {
    if (typeof window === "undefined") return initialState;
    const saved = sessionStorage.getItem("skb-booking");
    const draft = saved ? JSON.parse(saved) as Partial<BookingState> & { createdAt?: number } : null;
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
      ...(queryCoupon ? { promoCode: queryCoupon } : {})
    };
  } catch {
    return initialState;
  }
}

export function BookingPage() {
  const [state, setState] = useState<BookingState>(loadDraft);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fare = useMemo(() => calcFare({
    from: state.from,
    to: state.to,
    vehicleId: state.vehicleId,
    tripType: state.tripType,
    time: state.time,
    promoCode: state.promoCode
  }), [state]);

  const update = <K extends keyof BookingState>(key: K, value: BookingState[K]) => {
    setState((current) => {
      const next = { ...current, [key]: value };
      sessionStorage.setItem("skb-booking", JSON.stringify({ ...next, createdAt: Date.now() }));
      return next;
    });
    setError("");
  };

  const next = () => {
    if (state.step === 1 && (!fare || !state.date)) return setError("Choose a published route and travel date.");
    if (state.step === 3 && (!state.name.trim() || !/^[0-9+\-\s]{10,}$/.test(state.phone))) {
      return setError("Enter your name and a valid phone number.");
    }
    setState((current) => ({ ...current, step: Math.min(5, current.step + 1) as Step }));
    setError("");
  };

  const back = () => setState((current) => ({ ...current, step: Math.max(1, current.step - 1) as Step }));

  const pay = () => {
    setLoading(true);
    window.setTimeout(() => {
      const bookingId = `AGR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      update("bookingId", bookingId);
      setState((current) => ({ ...current, bookingId, step: 5 }));
      setLoading(false);
    }, 900);
  };

  return (
    <main id="main-content" className="booking-page">
      <section className="booking-heading">
        <p className="eyebrow">Book your journey</p>
        <h1>Find a comfortable ride from Agra.</h1>
        <p className="hero-copy">Search your route, compare vehicles, and confirm a mock booking with a transparent advance.</p>
      </section>

      <div className="booking-layout">
        <section className="booking-card" aria-labelledby="booking-form-heading">
          <div className="booking-steps" aria-label="Booking progress">
            {[1, 2, 3, 4, 5].map((step) => <span key={step} className={state.step >= step ? "is-active" : ""}>{step}</span>)}
          </div>
          <h2 id="booking-form-heading">{state.step === 1 ? "Search trip" : state.step === 2 ? "Choose vehicle" : state.step === 3 ? "Traveller details" : state.step === 4 ? "Review and pay" : "Booking confirmed"}</h2>

          {state.step === 1 && <div className="booking-form">
            <label>From<select value={state.from} onChange={(event) => update("from", event.target.value)}>{cities.map((city) => <option key={city.id} value={city.id}>{city.name} ({city.code})</option>)}</select></label>
            <label>To<select value={state.to} onChange={(event) => update("to", event.target.value)}>{cities.map((city) => <option key={city.id} value={city.id}>{city.name} ({city.code})</option>)}</select></label>
            <label>Journey type<select value={state.tripType} onChange={(event) => update("tripType", event.target.value as TripType)}><option value="one-way">One way</option><option value="round">Round trip</option></select></label>
            <label>Date<input type="date" min={tomorrow()} value={state.date} onChange={(event) => update("date", event.target.value)} /></label>
            <label>Pickup time<input type="time" value={state.time} onChange={(event) => update("time", event.target.value)} /></label>
            <label>Passengers<select value={state.passengers} onChange={(event) => update("passengers", Number(event.target.value))}>{[1, 2, 3, 4, 6, 12, 16].map((count) => <option key={count} value={count}>{count} passengers</option>)}</select></label>
          </div>}

          {state.step === 2 && <div className="vehicle-results">{vehicles.map((vehicle) => {
            const result = calcFare({ from: state.from, to: state.to, vehicleId: vehicle.id, tripType: state.tripType, time: state.time, promoCode: state.promoCode });
            const disabled = vehicle.seats < state.passengers || !result;
            return <label key={vehicle.id} className={`vehicle-result ${state.vehicleId === vehicle.id ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}>
              <img src={vehicle.image} alt="" width="160" height="100" loading="lazy" />
              <span><strong>{vehicle.name}</strong><small>{vehicle.tags.join(" · ")}</small></span>
              <b>{result ? formatInr(result.total) : "—"}</b>
              <input type="radio" name="vehicle" disabled={disabled} checked={state.vehicleId === vehicle.id} onChange={() => update("vehicleId", vehicle.id)} />
            </label>;
          })}</div>}

          {state.step === 3 && <div className="booking-form">
            <label>Name<input value={state.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" /></label>
            <label>Phone<input value={state.phone} onChange={(event) => update("phone", event.target.value)} autoComplete="tel" inputMode="tel" /></label>
            <label>Pickup point<input value={state.pickupPoint} onChange={(event) => update("pickupPoint", event.target.value)} placeholder="Hotel, station, landmark" /></label>
            <label>Promo code<input value={state.promoCode} onChange={(event) => update("promoCode", event.target.value)} placeholder="ASTTCAR500OFF" /></label>
          </div>}

          {state.step === 4 && <div className="review-panel">
            <p>Pay a mock advance using:</p>
            <label><input type="radio" checked={state.payment === "upi"} onChange={() => update("payment", "upi")} /> UPI</label>
            <label><input type="radio" checked={state.payment === "card"} onChange={() => update("payment", "card")} /> Card</label>
            <p className="muted">No real payment is taken. This simulates the current booking contract.</p>
          </div>}

          {state.step === 5 && <div className="confirmation-panel"><p className="eyebrow">Confirmed</p><h3>{state.bookingId}</h3><p>We have recorded your mock booking. Call or WhatsApp the travel desk to confirm availability.</p></div>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {loading && <LoadingIndicator label="Processing mock payment" />}
          {!loading && state.step < 5 && <div className="booking-actions">{state.step > 1 && <button className="button button-outline" type="button" onClick={back}>Back</button>}{state.step === 4 ? <button className="button button-primary" type="button" onClick={pay}>Pay {fare ? formatInr(fare.advance) : "advance"}</button> : <button className="button button-primary" type="button" onClick={next}>{state.step === 1 ? "Search rides" : "Continue"}</button>}</div>}
        </section>

        <aside className="fare-summary" aria-label="Booking summary">
          <p className="eyebrow">Live fare summary</p>
          <h2>{fare?.label ?? "Choose a route"}</h2>
          {fare ? <><p>{fare.duration} · {fare.km ?? "Package"} km · {fare.vehicle.name}</p><div className="summary-line"><span>Total fare</span><strong>{formatInr(fare.total)}</strong></div><div className="summary-line"><span>Advance now</span><strong>{formatInr(fare.advance)}</strong></div><div className="summary-line"><span>To driver</span><strong>{formatInr(fare.remaining)}</strong></div></> : <p>Published route fares appear here as you search.</p>}
        </aside>
      </div>
    </main>
  );
}
