import type { CatalogStatus, TourPackageGalleryImage, TourPackageItem } from "@/lib/types";

export type { CatalogStatus, TourPackageGalleryImage, TourPackageItem };

export interface TourPackageFormState {
  name: string;
  packageCode: string;
  durationText: string;
  days: number;
  nights: number;
  baseTierCode: string;
  startingPriceInr: number;
  fleetPrices: Record<string, number>;
  nightChargeInr: number;
  source: string;
  destination: string;
  inclusions: string[];
  exclusions: string[];
  inclusionsHighlight: string;
  inclusionsNote: string;
  imageUrl: string;
  gallery: TourPackageGalleryImage[];
  status: CatalogStatus;
  isActive: boolean;
}

export interface CreateTourPackageInput {
  name: string;
  packageCode: string;
  durationText: string;
  days: number;
  nights: number;
  baseTierCode: string;
  startingPriceInr: number;
  fleetPrices: Record<string, number>;
  nightChargeInr: number;
  source: string;
  destination: string;
  inclusions: string[];
  exclusions: string[];
  inclusionsHighlight: string;
  inclusionsNote?: string;
  imageUrl: string;
  gallery?: TourPackageGalleryImage[];
}

export type UpdateTourPackageInput = Partial<CreateTourPackageInput>;
