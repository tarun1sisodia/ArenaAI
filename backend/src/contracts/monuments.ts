/**
 * GENERATED — do not edit by hand.
 * Source: contracts/monuments.ts
 * Regenerate: npx tsx contracts/scripts/sync-contracts.ts
 * Contract: C-CONTRACT-ALL · contracts/LOCKED.md
 */
import type { CatalogStatus } from "./product-verticals.js";

export interface MonumentItem {
  id: string;
  name: string;
  visitingHours: string;
  closedNote: string;
  historicalContext?: string | null;
  sortOrder: number;
  imageUrl?: string | null;
  gallery?: string[];
  status?: CatalogStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMonumentInput {
  name: string;
  visitingHours: string;
  closedNote: string;
  historicalContext?: string | null;
  sortOrder?: number;
  imageUrl?: string | null;
  gallery?: string[];
  status?: CatalogStatus;
}

export type UpdateMonumentInput = Partial<CreateMonumentInput>;
