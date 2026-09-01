/* Fare engine — mock rules only. Used by routes calculator and booking. */
window.SKB = window.SKB || {};

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

SKB.calcFare = ({ routeId, from, to, vehicleId, tripType = "one-way", packageId }) => {
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
  if (tripType === "round" && route.kind !== "local") {
    total = Math.round(total * 1.85);
  }
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
    vehicle,
    route,
    origin,
    dest,
  };
};
