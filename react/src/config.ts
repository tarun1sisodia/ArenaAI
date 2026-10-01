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

function readRuntimeToken(): string {
  const configured = import.meta.env.VITE_LOCATIONIQ_ACCESS_TOKEN?.trim();
  if (configured) return configured;

  if (typeof window === "undefined") return "";

  try {
    const globalKey = (window as unknown as { LOCATIONIQ_ACCESS_TOKEN?: string }).LOCATIONIQ_ACCESS_TOKEN?.trim();
    if (globalKey) return globalKey;

    return (
      window.localStorage.getItem("locationiq_access_token")?.trim() || ""
    );
  } catch {
    return "";
  }
}

export function getLocationIqAccessToken(): string {
  return readRuntimeToken();
}

export function setLocationIqAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = token.trim();
    if (trimmed) {
      window.localStorage.setItem("locationiq_access_token", trimmed);
    } else {
      window.localStorage.removeItem("locationiq_access_token");
    }
  } catch {
    // Ignore storage quota / access errors
  }
}

export function clearLocationIqAccessToken(): void {
  setLocationIqAccessToken("");
}
