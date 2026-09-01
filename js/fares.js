/* Fare engine — mock rules only. Used by routes calculator and booking. */
window.SKB = window.SKB || {};

/* Local-timezone "tomorrow" as yyyy-mm-dd. Do NOT use toISOString() here —
   it slices the UTC date, which is a day early for UTC+ users (e.g. IST)
   between local midnight and the UTC offset. */
SKB.localTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

SKB.city = (id) => SKB.cities.find((c) => c.id === id);
SKB.vehicle = (id) => SKB.vehicles.find((v) => v.id === id);
SKB.route = (id) => SKB.routes.find((r) => r.id === id);
SKB.packageById = (id) => SKB.packages.find((p) => p.id === id);

SKB.findRoute = (from, to) => {
  if (from === to) {
    return SKB.routes.find((r) => r.from === from && r.to === to && r.kind === "local") || null;
  }
  return SKB.routes.find((r) => r.from === from && r.to === to) || null;
};

SKB.inr = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

SKB.advanceOf = (total) => {
  const raw = Math.max(500, Math.round((total * 0.28) / 100) * 100);
  return Math.min(total, raw);
};

SKB.fitsPassengers = (vehicle, passengers) => vehicle.seats >= passengers;

SKB.calcFare = ({ routeId, from, to, vehicleId, tripType = "one-way", packageId, time }) => {
  if (packageId) {
    const pack = SKB.packageById(packageId);
    if (!pack) return null;
    const vehicle = SKB.vehicle(vehicleId) || SKB.vehicles[0];
    const total = pack.from + (vehicle.id === "sedan" ? 0 : vehicle.id === "ertiga" ? 800 : vehicle.id === "innova" ? 1800 : vehicle.id === "tempo" ? 3500 : 5500);
    const advance = SKB.advanceOf(total);
    return {
      total,
      advance,
      remaining: total - advance,
      label: pack.name,
      duration: pack.duration,
      km: null,
      tripType: "package",
      vehicle,
      pack,
    };
  }

  const route = routeId ? SKB.route(routeId) : SKB.findRoute(from, to);
  const vehicle = SKB.vehicle(vehicleId);
  if (!route || !vehicle) return null;
  let total = route.fares[vehicle.id];
  if (total == null) return null;
  let roundMultiplier = false;
  if (tripType === "round" && route.kind !== "local") {
    total = Math.round(total * 1.85);
    roundMultiplier = true;
  }
  // Night allowance: outstation pickups 22:00–05:00 add a flat driver allowance.
  const nightFee = route.kind !== "local" && SKB.isNightTime(time) ? SKB.NIGHT_ALLOWANCE : 0;
  total += nightFee;
  const advance = SKB.advanceOf(total);
  const origin = SKB.city(route.from);
  const dest = SKB.city(route.to);
  return {
    total,
    advance,
    remaining: total - advance,
    label: route.kind === "local" ? route.localLabel : `${origin.name} → ${dest.name}`,
    duration: route.duration,
    km: route.km,
    tripType: route.kind === "local" ? "local" : tripType,
    nightFee,
    roundMultiplier,
    vehicle,
    route,
    origin,
    dest,
  };
};

/* Night allowance: flat fee for outstation pickups 22:00–05:00 (FAQ promise —
   keep in sync with the FAQ copy in render_pages.py / data.js). */
SKB.NIGHT_ALLOWANCE = 400;
SKB.isNightTime = (time) => {
  if (!time) return false;
  const hour = Number(String(time).split(":")[0]);
  if (Number.isNaN(hour)) return false;
  return hour >= 22 || hour < 5;
};
