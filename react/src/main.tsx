import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "@/app/App";
import { AppErrorBoundary } from "@/AppErrorBoundary";
import { CustomerAuthProvider } from "@/auth/customerAuth";
import { assertCatalogueInvariants } from "@/data/parity";
import "@/styles/tokens.css";
import "@/styles/theme.css";
import "@/styles/global.css";
import "@/styles/rental.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("React root element was not found.");
}

try {
  assertCatalogueInvariants();
} catch (e) {
  console.warn("Catalogue invariant check warning:", e);
}

const appTree = (
  <StrictMode>
      <AppErrorBoundary>
        <CustomerAuthProvider>
          <App />
        </CustomerAuthProvider>
      </AppErrorBoundary>
  </StrictMode>
);

if (root.hasChildNodes()) {
  hydrateRoot(root, appTree);
} else {
  createRoot(root).render(appTree);
}
