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

SKB.city = (id) => {
  const c = SKB.cities.find((x) => x.id === id);
  if (c) return c;
  const clean = String(id || "").replace(/-/g, " ");
  const cap = clean.charAt(0).toUpperCase() + clean.slice(1);
  return { id, name: cap, code: "LOC" };
};

SKB.vehicle = (id) => SKB.vehicles.find((v) => v.id === id);
SKB.route = (id) => SKB.routes.find((r) => r.id === id);
SKB.packageById = (id) => SKB.packages.find((p) => p.id === id || p.slug === id);

SKB.findRoute = (from, to) => {
  if (!from || !to) return null;
  if (from === to) {
    const existing = SKB.routes.find((r) => r.from === from && r.to === to && r.kind === "local");
    if (existing) return existing;
    return {
      id: `${from}-local`,
      from,
      to,
      kind: "local",
      localLabel: `${(SKB.city(from) || {}).name || from} Sightseeing & Local Tour`,
      duration: "8 hrs / 80 km",
      km: 80,
      fares: { sedan: 2000, ertiga: 2800, innova: 3800, tempo: 5500, urbania: 7500 }
    };
  }
  const existing = SKB.routes.find((r) => r.from === from && r.to === to);
  if (existing) return existing;

  const reverse = SKB.routes.find((r) => r.from === to && r.to === from);
  if (reverse) {
    return {
      ...reverse,
      id: `${from}-to-${to}`,
      from,
      to
    };
  }

  // Dynamic distance estimate for searched / Google Maps places
  const DIST_MAP = {
    "agra": 0,
    "delhi": 210,
    "jaipur": 240,
    "mathura": 58,
    "vrindavan": 64,
    "gwalior": 120,
    "lucknow": 335,
    "ayodhya": 470,
    "varanasi": 600,
    "prayagraj": 480,
    "haridwar": 370,
    "rishikesh": 390,
    "dehradun": 420,
    "chandigarh": 450,
    "shimla": 580,
    "manali": 750,
    "fatehpur-sikri": 40,
    "bharatpur": 56,
    "noida": 190,
    "gurgaon": 210,
    "amritsar": 680,
    "udaipur": 640,
    "jodhpur": 570,
    "ajmer": 380
  };

  const d1 = DIST_MAP[from] != null ? DIST_MAP[from] : 100;
  const d2 = DIST_MAP[to] != null ? DIST_MAP[to] : 250;
  const estimatedKm = Math.max(60, Math.abs(d1 - d2) || (d1 + d2) || 250);
  const hrs = Math.max(1, Math.round(estimatedKm / 55));
  const durStr = `${hrs}–${hrs + 1} hrs (${estimatedKm} km)`;

  return {
    id: `${from}-to-${to}`,
    from,
    to,
    kind: "outstation",
    duration: durStr,
    km: estimatedKm,
    fares: {
      sedan: Math.round(Math.max(2200, estimatedKm * 12.5)),
      ertiga: Math.round(Math.max(2800, estimatedKm * 15.0)),
      innova: Math.round(Math.max(3800, estimatedKm * 19.5)),
      tempo: Math.round(Math.max(5500, estimatedKm * 24.0)),
      urbania: Math.round(Math.max(7500, estimatedKm * 30.0))
    }
  };
};

SKB.inr = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

SKB.advanceOf = (total) => {
  const raw = Math.max(500, Math.round((total * 0.28) / 100) * 100);
  return Math.min(total, raw);
};

SKB.localPackages = {
  "8hr-80km": {
    label: "Agra Sightseeing (8 Hours / 80 KM)",
    duration: "8 hrs / 80 km",
    km: 80,
    fares: { sedan: 1900, ertiga: 2600, innova: 2850, tempo: 5500, urbania: 7500 }
  },
  "12hr-120km": {
    label: "Agra Extended Tour (12 Hours / 120 KM)",
    duration: "12 hrs / 120 km",
    km: 120,
    fares: { sedan: 2200, ertiga: 2950, innova: 3100, tempo: 6500, urbania: 8500 }
  },
  "airport-transfer": {
    label: "Airport / Station Pickup & Drop",
    duration: "Point to Point",
    km: 40,
    fares: { sedan: 800, ertiga: 900, innova: 1100, tempo: 2200, urbania: 3500 }
  }
};

SKB.fitsPassengers = (vehicle, passengers) => vehicle.seats >= passengers;

/* Night allowance: flat fee for outstation pickups after 8:00 PM (20:00–06:00).
   Verified industry standard: ₹300 for cabs, ₹500 for Tempo Travellers & Urbania. */
SKB.NIGHT_ALLOWANCE = 300;
SKB.NIGHT_ALLOWANCE_TEMPO = 500;
SKB.getNightAllowance = (vehicleId) =>
  vehicleId === "tempo" || vehicleId === "urbania" ? SKB.NIGHT_ALLOWANCE_TEMPO : SKB.NIGHT_ALLOWANCE;

SKB.isNightTime = (time) => {
  if (!time) return false;
  const hour = Number(String(time).split(":")[0]);
  if (Number.isNaN(hour)) return false;
  return hour >= 20 || hour < 6;
};

SKB.applyPromo = (code, total) => {
  if (!code) return { valid: false, discount: 0, finalTotal: total };
  const clean = String(code).trim().toUpperCase();
  const rule = SKB.promoCodes && SKB.promoCodes[clean];
  if (rule && total >= rule.minTotal) {
    const discount = Math.min(rule.discount, total);
    return { valid: true, discount, finalTotal: total - discount, desc: rule.desc };
  }
  return { valid: false, discount: 0, finalTotal: total };
};

SKB.calcFare = ({ routeId, from, to, vehicleId, tripType = "one-way", packageId, localPackageKey, time, promoCode }) => {
  if (packageId) {
    const pack = SKB.packageById(packageId);
    if (!pack) return null;
    const vehicle = SKB.vehicle(vehicleId) || SKB.vehicles[0];
    let total = pack.from + (vehicle.id === "sedan" ? 0 : vehicle.id === "ertiga" ? 800 : vehicle.id === "innova" ? 1800 : vehicle.id === "tempo" ? 3500 : 5500);
    const promo = SKB.applyPromo(promoCode, total);
    total = promo.finalTotal;
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
      promo,
    };
  }

  // Check local sightseeing package tier
  if (localPackageKey && SKB.localPackages[localPackageKey]) {
    const lp = SKB.localPackages[localPackageKey];
    const vehicle = SKB.vehicle(vehicleId) || SKB.vehicles[0];
    let total = lp.fares[vehicle.id] || lp.fares.sedan;
    const promo = SKB.applyPromo(promoCode, total);
    total = promo.finalTotal;
    const advance = SKB.advanceOf(total);
    return {
      total,
      advance,
      remaining: total - advance,
      label: lp.label,
      duration: lp.duration,
      km: lp.km,
      tripType: "local",
      vehicle,
      promo,
    };
  }

  const route = routeId ? SKB.route(routeId) : SKB.findRoute(from, to);
  const vehicle = SKB.vehicle(vehicleId);
  if (!route || !vehicle) return null;
  let total = route.fares[vehicle.id];
  if (total == null) return null;
  let roundMultiplier = false;
  if (tripType === "round" && route.kind !== "local") {
    // Minimum 300 KM per day outstation rule or 1.85x base
    const minDayKmTotal = Math.round(300 * vehicle.perKm);
    const standardRound = Math.round(total * 1.85);
    total = Math.max(standardRound, Math.min(minDayKmTotal, standardRound));
    roundMultiplier = true;
  }
  // Night allowance: pickups between 20:00 and 06:00 add flat driver allowance.
  const nightFee = route.kind !== "local" && SKB.isNightTime(time) ? SKB.getNightAllowance(vehicle.id) : 0;
  total += nightFee;

  const promo = SKB.applyPromo(promoCode, total);
  total = promo.finalTotal;
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
    promo,
  };
};
