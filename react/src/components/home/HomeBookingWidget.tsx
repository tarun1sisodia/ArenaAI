import { useRef, useState, type RefObject } from "react";
import { packages, vehicles, type VehicleId } from "../../data/catalogue";
import { LocationCombobox } from "../search/LocationCombobox";
import { calcFare, formatInr, localTomorrow } from "../../fares";

const modes = [
  { id: "oneway", label: "One Way", icon: "directions_car" },
  { id: "round", label: "Round Trip", icon: "sync_alt" },
  { id: "local", label: "Local Tour", icon: "location_on" },
] as const;
type BookingMode = (typeof modes)[number]["id"];

const localTours = packages.filter((tour) => tour.duration.toLowerCase().includes("1 day"));
const fleetIds: VehicleId[] = ["sedan", "ertiga", "innova", "tempo", "urbania"];
const fleetIcons: Record<VehicleId, string> = {
  sedan: "directions_car",
  ertiga: "directions_car",
  innova: "airport_shuttle",
  tempo: "rv_hookup",
  urbania: "directions_bus",
};
const localTourCards = [
  { slug: "agra-sightseeing", title: "Agra Local", meta: "4–8 Hours", note: "Taj Mahal, Agra Fort", image: "/assets/booking/agra-fort.webp" },
  { slug: "mathura-vrindavan", title: "Mathura Vrindavan", meta: "8–10 Hours", note: "Temples, Spiritual Tour", image: "/assets/booking/prem-mandir.webp" },
  { slug: "jaipur-day-tour", title: "Jaipur Day Tour", meta: "10–12 Hours", note: "Amber Fort, City Palace", image: "/assets/booking/hawa-mahal.webp" },
  { slug: "fatehpur-sikri", title: "Fatehpur Sikri", meta: "6–8 Hours", note: "Historic Monuments", image: "/assets/booking/fatehpur-sikri.webp" },
];

function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function FieldError({ children }: { children?: string }) {
  return children ? <p className="home-booking-error" role="alert">{children}</p> : null;
}

export function HomeBookingWidget() {
  const [mode, setMode] = useState<BookingMode>("oneway");
  const [origin, setOrigin] = useState("Agra");
  const [destination, setDestination] = useState("Delhi");
  const [pickupDate, setPickupDate] = useState(localTomorrow());
  const [returnDate, setReturnDate] = useState(localTomorrow());
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>("sedan");
  const [localTourId, setLocalTourId] = useState(localTours[0]?.slug ?? "agra-sightseeing");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const returnInputRef = useRef<HTMLInputElement>(null);
  const selectedTour = localTours.find((tour) => tour.slug === localTourId) ?? localTours[0];
  const quote = mode === "local"
    ? calcFare({ packageId: selectedTour?.slug, vehicleId: selectedVehicle })
    : calcFare({ from: origin.split(" (")[0], to: destination.split(" (")[0], vehicleId: selectedVehicle, tripType: mode === "round" ? "round" : "one-way" });

  const openPicker = (ref: RefObject<HTMLInputElement | null>) => {
    try { ref.current?.showPicker(); } catch { ref.current?.focus(); }
  };
  function validate(): boolean {
    const next: Record<string, string> = {};
    if (mode !== "local" && !origin.trim()) next.origin = "Select pickup location.";
    if (mode !== "local" && !destination.trim()) next.destination = "Select destination.";
    if (!pickupDate) next.pickupDate = mode === "local" ? "Select tour date." : "Select pickup date.";
    if (mode === "round" && (!returnDate || returnDate < pickupDate)) next.returnDate = "Select a valid return date.";
    if (mode === "local" && !selectedTour) next.localTour = "Select a local tour.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }
  function bookingHref(): string {
    if (mode === "local") return `/book?trip=local&pkg=${encodeURIComponent(selectedTour?.slug ?? localTourId)}&vehicle=${selectedVehicle}&date=${encodeURIComponent(pickupDate)}`;
    return `/book?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&vehicle=${selectedVehicle}&trip=${mode === "round" ? "round-trip" : "one-way"}&date=${encodeURIComponent(pickupDate)}${mode === "round" ? `&returnDate=${encodeURIComponent(returnDate)}` : ""}`;
  }

  return (
    <div id="home-booking-widget" className={`booking-reference booking-reference--${mode}`}>
      <img className="booking-reference__hero" src="/assets/booking/taj-mahal.webp" alt="Taj Mahal in Agra" />
      <div className="booking-reference__veil" aria-hidden="true" />
      <div className="booking-reference__content">
        <div className="booking-reference__tabs" role="tablist" aria-label="Booking type">
          {modes.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={mode === item.id} className={`booking-reference__tab ${mode === item.id ? "is-active" : ""}`} onClick={() => { setMode(item.id); setErrors({}); }}>
              <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        <div className="booking-reference__controls">
          {mode === "local" ? (
            <div className="booking-reference__field booking-reference__field--tour">
              <label htmlFor="home-local-tour">Select Tour</label>
              <div className="booking-reference__select booking-reference__select--with-icon"><span className="booking-reference__thumb"><img src={localTourCards.find((card) => card.slug === localTourId)?.image ?? "/assets/booking/agra-fort.webp"} alt="" /></span><select id="home-local-tour" value={localTourId} onChange={(event) => setLocalTourId(event.target.value)}>{localTours.map((tour) => <option key={tour.slug} value={tour.slug}>{tour.name}</option>)}</select></div>
              <FieldError>{errors.localTour}</FieldError>
            </div>
          ) : (
            <>
              <div className="booking-reference__field"><label>From</label><LocationCombobox id="home-origin" value={origin} onChange={setOrigin} placeholder="Search pickup city..." label="Pickup origin city" triggerIcon="trip_origin" showLocationIqBadge={false} /><FieldError>{errors.origin}</FieldError></div>
              <div className="booking-reference__field"><label>To</label><LocationCombobox id="home-destination" value={destination} onChange={setDestination} placeholder="Search destination city..." label="Destination city" triggerIcon="pin_drop" showLocationIqBadge={false} /><FieldError>{errors.destination}</FieldError></div>
            </>
          )}
          <div className="booking-reference__field"><label htmlFor="home-pickup-date">{mode === "local" ? "Travel Date" : "Pickup Date"}</label><div className="booking-reference__date"><input ref={pickupInputRef} id="home-pickup-date" type="date" value={pickupDate} min={localTomorrow()} onChange={(event) => { setPickupDate(event.target.value); if (returnDate < event.target.value) setReturnDate(event.target.value); }} /><span>{pickupDate ? formatDate(pickupDate) : "Select date"}</span><span className="material-symbols-outlined">calendar_today</span><button type="button" aria-label="Open pickup date picker" onClick={() => openPicker(pickupInputRef)} /></div><FieldError>{errors.pickupDate}</FieldError></div>
          {mode === "round" && <div className="booking-reference__field"><label htmlFor="home-return-date">Return Date</label><div className="booking-reference__date"><input ref={returnInputRef} id="home-return-date" type="date" value={returnDate} min={pickupDate} onChange={(event) => setReturnDate(event.target.value)} /><span>{returnDate ? formatDate(returnDate) : "Select date"}</span><span className="material-symbols-outlined">calendar_today</span><button type="button" aria-label="Open return date picker" onClick={() => openPicker(returnInputRef)} /></div><FieldError>{errors.returnDate}</FieldError></div>}
          <div className="booking-reference__field booking-reference__field--fleet"><label htmlFor="home-fleet">Fleet Type</label><div className="booking-reference__select"><span className="material-symbols-outlined">directions_car</span><select id="home-fleet" value={selectedVehicle} onChange={(event) => setSelectedVehicle(event.target.value as VehicleId)}><option value="sedan">All Vehicles</option>{fleetIds.map((id) => <option key={id} value={id}>{id === "innova" ? "Crysta" : vehicles.find((vehicle) => vehicle.id === id)?.name ?? id}</option>)}</select></div></div>
          <div className="booking-reference__action"><button type="button" className="booking-reference__search" onClick={() => { if (!validate()) return; window.location.href = bookingHref(); }}>{mode === "local" ? "Search Local Tour" : "Search Cab"}<span className="material-symbols-outlined">east</span></button></div>
        </div>

        {mode === "local" && <div className="booking-reference__tour-cards" aria-label="Popular local tours">{localTourCards.map((card) => <button type="button" key={card.slug} className={`booking-reference__tour-card ${localTourId === card.slug ? "is-active" : ""}`} onClick={() => setLocalTourId(card.slug)}><img src={card.image} alt="" /><span><strong>{card.title}</strong><small>{card.meta}</small><em>{card.note}</em></span><i className="material-symbols-outlined">{localTourId === card.slug ? "radio_button_checked" : "radio_button_unchecked"}</i></button>)}</div>}

        <div className="booking-reference__trust"><span><b className="material-symbols-outlined">verified_user</b> Verified Drivers</span><span><b className="material-symbols-outlined">currency_rupee</b> Transparent Pricing</span><span><b className="material-symbols-outlined">schedule</b> On-Time Pickup</span><span><b className="material-symbols-outlined">support_agent</b> 24/7 Support</span></div>
      </div>
      <div className="booking-reference__fare" aria-live="polite"><span>Estimated Fare</span><strong>{quote ? formatInr(quote.total) : "—"}</strong><small>{quote && quote.advance < quote.total ? `28% advance from ${formatInr(quote.advance)}` : "Toll-inclusive booking receipt"}</small></div>
    </div>
  );
}
