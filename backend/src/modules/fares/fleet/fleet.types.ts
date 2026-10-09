export type PublicFleetVehicle = {
  id: string;
  tier: string;
  name: string;
  seats: number;
  bags: number;
  perKm: number;
  active: boolean;
};

export type FleetQueryResult = {
  version: string;
  vehicles: PublicFleetVehicle[];
};
