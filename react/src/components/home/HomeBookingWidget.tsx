import { useRef, useState, type ReactNode, type RefObject } from "react";
import { packages, vehicles, type VehicleId } from "../../data/catalogue";
import { LocationCombobox } from "../search/LocationCombobox";
import { localTomorrow } from "../../fares";

const modes = [
  { id: "oneway", label: "One Way", icon: "car" },
  { id: "round", label: "Round Trip", icon: "swap" },
  { id: "local", label: "Local Taxi", icon: "pin" },
] as const;
type BookingMode = (typeof modes)[number]["id"];

const fleetIds: VehicleId[] = ["sedan", "ertiga", "innova", "tempo", "urbania"];
const fleetLabels: Record<VehicleId, string> = {
  sedan: "Sedan",
  ertiga: "Ertiga",
  innova: "Crysta",
  tempo: "Tempo",
  urbania: "Urbania",
};
const localTours = packages.filter((tour) => tour.duration.toLowerCase().includes("1 day"));
const localTourCards = [
  { slug: "agra-sightseeing", title: "Agra Local", meta: "4–8 Hours", note: "Taj Mahal, Agra Fort", image: "/assets/booking/agra-fort.webp" },
  { slug: "mathura-vrindavan", title: "Mathura Vrindavan", meta: "8–10 Hours", note: "Temples, Spiritual Tour", image: "/assets/booking/prem-mandir.webp" },
  { slug: "jaipur-day-tour", title: "Jaipur Day Tour", meta: "10–12 Hours", note: "Amber Fort, City Palace", image: "/assets/booking/hawa-mahal.webp" },
  { slug: "fatehpur-sikri", title: "Fatehpur Sikri", meta: "6–8 Hours", note: "Historic Monuments", image: "/assets/booking/fatehpur-sikri.webp" },
];

type IconName = "car" | "swap" | "pin" | "calendar" | "sedan" | "van" | "bus" | "shield" | "rupee" | "clock" | "support" | "arrow";
function SvgIcon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    car: <><path d="M4 15.5h16l-1.2-5.1a2 2 0 0 0-1.95-1.55H7.15A2 2 0 0 0 5.2 10.4L4 15.5Z" /><path d="M3 15.5v2.3M21 15.5v2.3M6.5 18v1M17.5 18v1M7 13h.01M17 13h.01" /></>,
    swap: <><path d="M5 7h13M15 4l3 3-3 3M19 17H6M9 14l-3 3 3 3" /></>,
    pin: <><path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 9h16" /></>,
    sedan: <><path d="M4 15.5h16l-1.2-5.1a2 2 0 0 0-1.95-1.55H7.15A2 2 0 0 0 5.2 10.4L4 15.5Z" /><path d="M3 15.5v2.3M21 15.5v2.3M7 13h.01M17 13h.01" /></>,
    van: <><path d="M3 16V8.5A1.5 1.5 0 0 1 4.5 7h11.8a2 2 0 0 1 1.7.95L21 12v4H3Z" /><path d="M7 10h2M12 10h2M4 16v2M20 16v2M7 18h.01M17 18h.01" /></>,
    bus: <><rect x="5" y="4" width="14" height="16" rx="2" /><path d="M5 12h14M8 16h.01M16 16h.01M8 7h8" /></>,
    shield: <><path d="m12 3 7 3v5c0 4.4-2.95 7.8-7 10-4.05-2.2-7-5.6-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    rupee: <><path d="M7 5h10M7 9h8M8 5c5 0 6 2 6 4 0 3-3 4-7 4l6 6" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    support: <><path d="M5 13v-2a7 7 0 0 1 14 0v2" /><path d="M5 13H3v4h3v-4M19 13h2v4h-3v-4M12 20h3" /></>,
    arrow: <><path d="M4 12h15M14 7l5 5-5 5" /></>,
  };
  return <svg className="booking-svg-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

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
              <SvgIcon name={item.icon as IconName} size={15} />{item.label}
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
              <div className="booking-reference__field booking-reference__field--origin"><label>From</label><div className="booking-reference__location"><SvgIcon name="pin" size={20} /><LocationCombobox id="home-origin" value={origin} onChange={setOrigin} placeholder="Search pickup city..." label="Pickup origin city" triggerIcon="" showLocationIqBadge={false} className="booking-reference__combobox" /></div><FieldError>{errors.origin}</FieldError></div>
              <div className="booking-reference__field booking-reference__field--destination"><label>To</label><div className="booking-reference__location"><SvgIcon name="pin" size={20} /><LocationCombobox id="home-destination" value={destination} onChange={setDestination} placeholder="Search destination city..." label="Destination city" triggerIcon="" showLocationIqBadge={false} className="booking-reference__combobox" /></div><FieldError>{errors.destination}</FieldError></div>
            </>
          )}
          <div className="booking-reference__field booking-reference__field--date"><label htmlFor="home-pickup-date">{mode === "local" ? "Travel Date" : "Pickup Date"}</label><div className="booking-reference__date"><SvgIcon name="calendar" size={18} /><input ref={pickupInputRef} id="home-pickup-date" type="date" value={pickupDate} min={localTomorrow()} onChange={(event) => { setPickupDate(event.target.value); if (returnDate < event.target.value) setReturnDate(event.target.value); }} /><span>{pickupDate ? formatDate(pickupDate) : "Select date"}</span><button type="button" aria-label="Open pickup date picker" onClick={() => openPicker(pickupInputRef)} /></div><FieldError>{errors.pickupDate}</FieldError></div>
          {mode === "round" && <div className="booking-reference__field booking-reference__field--return"><label htmlFor="home-return-date">Return Date</label><div className="booking-reference__date"><SvgIcon name="calendar" size={18} /><input ref={returnInputRef} id="home-return-date" type="date" value={returnDate} min={pickupDate} onChange={(event) => setReturnDate(event.target.value)} /><span>{returnDate ? formatDate(returnDate) : "Select date"}</span><button type="button" aria-label="Open return date picker" onClick={() => openPicker(returnInputRef)} /></div><FieldError>{errors.returnDate}</FieldError></div>}
          <div className="booking-reference__field booking-reference__field--fleet"><label>Vehicle</label><div className="booking-reference__vehicles" role="radiogroup" aria-label="Vehicle type">{fleetIds.map((id) => <button type="button" role="radio" aria-checked={selectedVehicle === id} className={`booking-reference__vehicle ${selectedVehicle === id ? "is-active" : ""}`} key={id} onClick={() => setSelectedVehicle(id)}><SvgIcon name={id === "urbania" ? "bus" : id === "tempo" ? "van" : id === "innova" ? "van" : id === "sedan" ? "sedan" : "car"} size={23} /><span>{fleetLabels[id]}</span></button>)}</div></div>
          <div className="booking-reference__action"><button type="button" className="booking-reference__search" onClick={() => { if (!validate()) return; window.location.href = bookingHref(); }}>Book Now<SvgIcon name="arrow" size={19} /></button></div>
        </div>

        {mode === "local" && <div className="booking-reference__tour-cards" aria-label="Popular local tours">{localTourCards.map((card) => <button type="button" key={card.slug} className={`booking-reference__tour-card ${localTourId === card.slug ? "is-active" : ""}`} onClick={() => setLocalTourId(card.slug)}><img src={card.image} alt="" /><span><strong>{card.title}</strong><small>{card.meta}</small><em>{card.note}</em></span><i>{localTourId === card.slug ? "●" : "○"}</i></button>)}</div>}

        <div className="booking-reference__trust"><span><SvgIcon name="shield" size={15} /> Verified Drivers</span><span><SvgIcon name="rupee" size={15} /> Transparent Pricing</span><span><SvgIcon name="clock" size={15} /> On-Time Pickup</span><span><SvgIcon name="support" size={15} /> 24/7 Support</span></div>
      </div>
    </div>
  );
}
