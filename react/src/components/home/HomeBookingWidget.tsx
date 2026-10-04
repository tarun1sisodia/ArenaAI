import { useState, useRef } from "react";
import { packages, vehicles, type VehicleId } from "../../data/catalogue";
import { LocationCombobox } from "../search/LocationCombobox";
import { localTomorrow } from "../../fares";

const modes = [
  { id: "oneway", label: "One Way" },
  { id: "round", label: "Round Trip" },
  { id: "local", label: "Local Taxi" },
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

function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function FieldError({ children }: { children?: string }) {
  return children ? <p className="mt-1 text-label-lg text-error" role="alert">{children}</p> : null;
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

  const openPickupPicker = () => {
    try {
      pickupInputRef.current?.showPicker();
    } catch {
      pickupInputRef.current?.focus();
    }
  };

  const openReturnPicker = () => {
    try {
      returnInputRef.current?.showPicker();
    } catch {
      returnInputRef.current?.focus();
    }
  };

  const selectedTour = localTours.find((tour) => tour.slug === localTourId) ?? localTours[0];
  function validate(): boolean {
    const next: Record<string, string> = {};
    if (mode !== "local" && !origin.trim()) next.origin = "Select pickup location.";
    if (mode !== "local" && !destination.trim()) next.destination = "Select destination.";
    if (!pickupDate) next.pickupDate = mode === "local" ? "Select tour date." : "Select pickup date.";
    if (mode === "round") {
      if (!returnDate) {
        next.returnDate = "Select return date.";
      } else if (returnDate < pickupDate) {
        next.returnDate = "Return date cannot be earlier than pickup date.";
      }
    }
    if (mode === "local" && !selectedTour) next.localTour = "Select a local tour.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function bookingHref(): string {
    if (mode === "local") {
      return `/book?trip=local&pkg=${encodeURIComponent(selectedTour?.slug ?? localTourId)}&vehicle=${selectedVehicle}&date=${encodeURIComponent(pickupDate)}`;
    }
    return `/book?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&vehicle=${selectedVehicle}&trip=${mode === "round" ? "round-trip" : "one-way"}&date=${encodeURIComponent(pickupDate)}${mode === "round" ? `&returnDate=${encodeURIComponent(returnDate)}` : ""}`;
  }

  return (
    <div id="home-booking-widget" className="home-booking-widget w-full max-w-[430px] min-h-[460px] flex flex-col justify-between rounded-xl border border-border-warm/70 bg-surface-container-lowest p-3.5 text-on-surface shadow-xl sm:p-4">
      <div>
        <div className="home-booking-tabs" role="tablist" aria-label="Booking type">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              className={`home-booking-tab ${mode === item.id ? "is-active" : ""}`}
              onClick={() => { setMode(item.id); setErrors({}); }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {mode === "local" ? (
            <div>
              <label htmlFor="home-local-tour" className="home-booking-label">Local Tour</label>
              <div className="home-booking-select-wrap">
                <span className="material-symbols-outlined home-booking-field-icon" aria-hidden="true">landscape</span>
                <select id="home-local-tour" value={localTourId} onChange={(event) => setLocalTourId(event.target.value)} className="home-booking-select">
                  {localTours.map((tour) => <option key={tour.slug} value={tour.slug}>{tour.name}</option>)}
                </select>
              </div>
              <FieldError>{errors.localTour}</FieldError>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="home-booking-label">From</label>
                <LocationCombobox id="home-origin" value={origin} onChange={setOrigin} placeholder="Search pickup city..." label="Pickup origin city" triggerIcon="trip_origin" showLocationIqBadge={false} />
                <FieldError>{errors.origin}</FieldError>
              </div>
              <div className="min-w-0">
                <label className="home-booking-label">To</label>
                <LocationCombobox id="home-destination" value={destination} onChange={setDestination} placeholder="Search destination city..." label="Destination city" triggerIcon="pin_drop" showLocationIqBadge={false} />
                <FieldError>{errors.destination}</FieldError>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 gap-3 ${mode === "round" ? "sm:grid-cols-2" : ""}`}>
            <div>
              <label htmlFor="home-pickup-date" className="home-booking-label">{mode === "local" ? "Tour Date" : "Pickup Date"}</label>
              <div
                className="home-booking-date-wrap cursor-pointer"
                onClick={openPickupPicker}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openPickupPicker();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={mode === "local" ? "Open tour date picker" : "Open pickup date picker"}
              >
                <input
                  ref={pickupInputRef}
                  id="home-pickup-date"
                  type="date"
                  value={pickupDate}
                  min={localTomorrow()}
                  onChange={(event) => {
                    const next = event.target.value;
                    setPickupDate(next);
                    if (returnDate && returnDate < next) {
                      setReturnDate(next);
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openPickupPicker();
                  }}
                  className="home-booking-date"
                  aria-label={mode === "local" ? "Tour date" : "Pickup date"}
                />
                <span className={`home-booking-date-display ${pickupDate ? "has-value" : ""}`} aria-hidden="true">{pickupDate ? formatDate(pickupDate) : "Select date"}</span>
                <span className="material-symbols-outlined home-booking-field-icon" aria-hidden="true">calendar_today</span>
              </div>
              <FieldError>{errors.pickupDate}</FieldError>
            </div>
            {mode === "round" && (
              <div>
                <label htmlFor="home-return-date" className="home-booking-label">Return Date</label>
                <div
                  className="home-booking-date-wrap cursor-pointer"
                  onClick={openReturnPicker}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openReturnPicker();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="Open return date picker"
                >
                  <input
                    ref={returnInputRef}
                    id="home-return-date"
                    type="date"
                    value={returnDate}
                    min={pickupDate || localTomorrow()}
                    onChange={(event) => setReturnDate(event.target.value)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openReturnPicker();
                    }}
                    className="home-booking-date"
                    aria-label="Return date"
                  />
                  <span className={`home-booking-date-display ${returnDate ? "has-value" : ""}`} aria-hidden="true">{returnDate ? formatDate(returnDate) : "Select date"}</span>
                  <span className="material-symbols-outlined home-booking-field-icon" aria-hidden="true">calendar_today</span>
                </div>
                <FieldError>{errors.returnDate}</FieldError>
              </div>
            )}
          </div>

          <fieldset className="min-w-0">
            <legend className="home-booking-label">Vehicle</legend>
            <div className="home-booking-fleet" role="radiogroup" aria-label="Choose a vehicle">
              {fleetIds.map((id) => {
                const vehicle = vehicles.find((item) => item.id === id);
                const label = id === "innova" ? "Crysta" : id === "tempo" ? "Tempo" : id === "urbania" ? "Urbania" : vehicle?.name ?? id;
                return (
                  <button key={id} type="button" role="radio" aria-checked={selectedVehicle === id} className={`home-booking-fleet-option ${selectedVehicle === id ? "is-active" : ""}`} onClick={() => setSelectedVehicle(id)}>
                    <span className="material-symbols-outlined" aria-hidden="true">{fleetIcons[id]}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </div>

      <div>
        <div className="home-booking-action mt-4 border-t border-border-warm/70 pt-3.5">
          <a href={bookingHref()} onClick={(event) => { if (!validate()) { event.preventDefault(); document.getElementById("home-booking-widget")?.scrollIntoView({ behavior: "smooth", block: "center" }); } }} className="home-booking-cta">
            Book Now <span className="material-symbols-outlined text-icon-17" aria-hidden="true">east</span>
          </a>
        </div>
        <p className="mt-3 text-center text-label-caps leading-relaxed text-on-surface-variant">Toll-inclusive · booking receipt · 28% advance only</p>
      </div>
    </div>
  );
}
