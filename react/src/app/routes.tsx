export interface AppRoute {
  path: string;
  page: "home" | "booking" | "marketing";
  localized: boolean;
}

export const marketingHubs = [
  "services",
  "routes",
  "packages",
  "fleet",
  "about",
  "contact",
  "faq",
  "privacy",
  "terms"
] as const;

export const marketingDetailPrefixes = ["vehicles", "packages"] as const;

export const appRoutes: AppRoute[] = [
  { path: "/", page: "home", localized: true },
  { path: "/hi/", page: "home", localized: true },
  { path: "/book.html", page: "booking", localized: false },
  { path: "/en/*", page: "marketing", localized: true },
  { path: "/hi/*", page: "marketing", localized: true }
];
