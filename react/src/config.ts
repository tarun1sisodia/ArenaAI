export type SupportedLanguage = "en" | "hi";

export type SiteContact = {
  phone: string;
  phoneDisplay: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  hours: string;
  mapsUrl: string;
  companyReceipt: string;
};

export type SiteConfig = {
  name: string;
  domain: string;
  contact: SiteContact;
  defaultLanguage: SupportedLanguage;
  supportedLanguages: readonly SupportedLanguage[];
};

export const siteConfig: SiteConfig = {
  name: "SK Baghel Tour & Travels",
  domain: "https://agraskbagheltourandtravels.com",
  defaultLanguage: "en",
  supportedLanguages: ["en", "hi"],
  contact: {
    phone: "+916395867598",
    phoneDisplay: "+91 63958 67598",
    whatsapp: "919762817598",
    email: "bookings@agraskbagheltourandtravels.com",
    address: "Near Taj East Gate Road, Taj Ganj, Agra, Uttar Pradesh 282001",
    city: "Agra",
    region: "Uttar Pradesh",
    postalCode: "282001",
    latitude: 27.1632,
    longitude: 78.0322,
    hours: "Bookings open 24×7",
    mapsUrl: "https://maps.google.com/?q=Taj+Ganj+Agra",
    companyReceipt: "",
  },
};

export function isReactMigrationEnabled(): boolean {
  return import.meta.env.VITE_REACT_MIGRATION_ENABLED !== "false";
}

/**
 * Reads the LocationIQ access token from build-time / runtime configuration.
 *
 * SECURITY (2026-10-01): the token is configuration only — build-time env var
 * `VITE_LOCATIONIQ_ACCESS_TOKEN` or the `window.LOCATIONIQ_ACCESS_TOKEN`
 * global. There is intentionally NO localStorage persistence and NO UI to
 * view or edit the token: the secure backend proxy
 * (`/api/v1/locations/autocomplete`) is the primary search path and holds the
 * real token server-side. A visitor must never be able to read or overwrite it.
 */
function readRuntimeToken(): string {
  const configured = import.meta.env.VITE_LOCATIONIQ_ACCESS_TOKEN?.trim();
  if (configured) return configured;

  if (typeof window === "undefined") return "";

  try {
    return (
      (window as unknown as { LOCATIONIQ_ACCESS_TOKEN?: string }).LOCATIONIQ_ACCESS_TOKEN?.trim() || ""
    );
  } catch {
    return "";
  }
}

export function getLocationIqAccessToken(): string {
  return readRuntimeToken();
}
