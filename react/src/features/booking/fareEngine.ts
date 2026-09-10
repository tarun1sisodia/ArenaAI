import {
  cities,
  packages,
  promoCodes,
  routes,
  vehicles,
  type Route,
  type Vehicle,
  type VehicleId
} from "../../data/catalogue";

export type TripType = "one-way" | "round";

export interface FareRequest {
  routeId?: string;
  from?: string;
  to?: string;
  vehicleId: VehicleId;
  tripType?: TripType;
  packageId?: string;
  localPackageKey?: keyof typeof localPackages;
  time?: string;
  promoCode?: string;
}

export interface FareResult {
  total: number;
  advance: number;
  remaining: number;
  label: string;
  duration: string;
  km: number | null;
  tripType: TripType | "local" | "package";
  vehicle: Vehicle;
  route?: Route;
  nightFee?: number;
  promo: { valid: boolean; discount: number; finalTotal: number; desc?: string };
}

export const localPackages = {
  "8hr-80km": { label: "Agra Sightseeing (8 Hours / 80 KM)", duration: "8 hrs / 80 km", km: 80, fares: { sedan: 1900, ertiga: 2600, innova: 2850, tempo: 5500, urbania: 7500 } },
  "12hr-120km": { label: "Agra Extended Tour (12 Hours / 120 KM)", duration: "12 hrs / 120 km", km: 120, fares: { sedan: 2200, ertiga: 2950, innova: 3100, tempo: 6500, urbania: 8500 } },
  "airport-transfer": { label: "Airport / Station Pickup & Drop", duration: "Point to Point", km: 40, fares: { sedan: 800, ertiga: 900, innova: 1100, tempo: 2200, urbania: 3500 } }
} as const;

export const NIGHT_ALLOWANCE = 300;
export const NIGHT_ALLOWANCE_TEMPO = 500;

const advanceOf = (total: number) => Math.min(total, Math.max(500, Math.round((total * 0.28) / 100) * 100));
const vehicleFor = (id: VehicleId) => vehicles.find((vehicle) => vehicle.id === id);
const routeFor = (id?: string) => routes.find((route) => route.id === id);
const packageFor = (id?: string) => packages.find((item) => item.id === id || item.slug === id);
const isNightTime = (time?: string) => {
  if (!time) return false;
  const hour = Number(time.split(":")[0]);
  return Number.isInteger(hour) && (hour >= 20 || hour < 6);
};

function applyPromo(code: string | undefined, total: number) {
  const rule = code ? promoCodes[code.trim().toUpperCase() as keyof typeof promoCodes] : undefined;
  if (!rule || total < rule.minTotal) return { valid: false, discount: 0, finalTotal: total };
  return { valid: true, discount: Math.min(rule.discount, total), finalTotal: total - Math.min(rule.discount, total), desc: rule.desc };
}

export function calcFare(request: FareRequest): FareResult | null {
  const vehicle = vehicleFor(request.vehicleId);
  if (!vehicle) return null;

  if (request.packageId) {
    const pack = packageFor(request.packageId);
    if (!pack) return null;
    const upgrade = { sedan: 0, ertiga: 800, innova: 1800, tempo: 3500, urbania: 5500 }[vehicle.id];
    const promo = applyPromo(request.promoCode, pack.from + upgrade);
    return { total: promo.finalTotal, advance: advanceOf(promo.finalTotal), remaining: promo.finalTotal - advanceOf(promo.finalTotal), label: pack.name, duration: pack.duration, km: null, tripType: "package", vehicle, promo };
  }

  if (request.localPackageKey) {
    const local = localPackages[request.localPackageKey];
    if (!local) return null;
    const total = local.fares[vehicle.id];
    const promo = applyPromo(request.promoCode, total);
    return { total: promo.finalTotal, advance: advanceOf(promo.finalTotal), remaining: promo.finalTotal - advanceOf(promo.finalTotal), label: local.label, duration: local.duration, km: local.km, tripType: "local", vehicle, promo };
  }

  const route = routeFor(request.routeId) ?? routes.find((item) => item.from === request.from && item.to === request.to);
  if (!route) return null;
  let total = route.fares[vehicle.id];
  const isRound = request.tripType === "round" && route.kind !== "local";
  if (isRound) total = Math.max(total * 1.85, Math.min(300 * vehicle.perKm, total * 1.85));
  const nightFee = route.kind !== "local" && isNightTime(request.time) ? (vehicle.id === "tempo" || vehicle.id === "urbania" ? NIGHT_ALLOWANCE_TEMPO : NIGHT_ALLOWANCE) : 0;
  total += nightFee;
  const promo = applyPromo(request.promoCode, total);
  const advance = advanceOf(promo.finalTotal);
  const origin = cities.find((city) => city.id === route.from)?.name ?? route.from;
  const destination = cities.find((city) => city.id === route.to)?.name ?? route.to;
  return { total: promo.finalTotal, advance, remaining: promo.finalTotal - advance, label: route.kind === "local" ? route.localLabel ?? "Local sightseeing" : `${origin} → ${destination}`, duration: route.duration, km: route.km, tripType: route.kind === "local" ? "local" : request.tripType ?? "one-way", nightFee, vehicle, route, promo };
}

