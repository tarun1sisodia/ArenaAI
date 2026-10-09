import { VEHICLE_TIERS, type VehicleTier } from "@/contracts/vehicle-tiers";

export interface FleetSpec {
  id: VehicleTier;
  label: string;
  name: string;
  seats: string;
  bags: string;
  ac: string;
  icon: string;
  defaultIncrement: number;
}

export const CANONICAL_FLEET_SPECS: Record<VehicleTier, FleetSpec> = {
  sedan: {
    id: "sedan",
    label: "Sedan",
    name: "Maruti Dzire / Toyota Etios",
    seats: "4 Passengers",
    bags: "2 Bags",
    ac: "Full Climate Control",
    icon: "Car",
    defaultIncrement: 0,
  },
  ertiga: {
    id: "ertiga",
    label: "Ertiga",
    name: "Maruti Ertiga Hybrid",
    seats: "6 Passengers",
    bags: "3 Bags",
    ac: "Dual AC Vents",
    icon: "Car",
    defaultIncrement: 800,
  },
  "innova-crysta": {
    id: "innova-crysta",
    label: "Innova Crysta",
    name: "Toyota Innova Crysta VIP",
    seats: "6-7 Passengers",
    bags: "4 Bags",
    ac: "Triple-Zone Climate",
    icon: "Shield",
    defaultIncrement: 1800,
  },
  "tempo-traveller": {
    id: "tempo-traveller",
    label: "Tempo Traveller",
    name: "Force Tempo Traveller",
    seats: "12-16 Passengers",
    bags: "8+ Bags",
    ac: "Roof-Mounted AC",
    icon: "Bus",
    defaultIncrement: 3500,
  },
  urbania: {
    id: "urbania",
    label: "Urbania VIP",
    name: "Force Urbania VIP",
    seats: "10-13 Passengers",
    bags: "10 Bags",
    ac: "Individual AC Louvers",
    icon: "Crown",
    defaultIncrement: 5500,
  },
};

export const FLEET_KEYS: readonly VehicleTier[] = VEHICLE_TIERS;

export const FLEET_LABELS: Record<VehicleTier, string> = {
  sedan: "Sedan (4 Seater)",
  ertiga: "Ertiga (6 Seater)",
  "innova-crysta": "Innova Crysta (6-7 Seater)",
  "tempo-traveller": "Tempo Traveller (12 Seater)",
  urbania: "Urbania VIP (16 Seater)",
};
