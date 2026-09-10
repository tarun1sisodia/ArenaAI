import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/app/App";
import { AppErrorBoundary } from "@/AppErrorBoundary";
import { assertCatalogueInvariants } from "@/data/parity";
import "@/styles/tokens.css";
import "@/styles/global.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("React root element was not found.");
}

try {
  assertCatalogueInvariants();
} catch (e) {
  console.warn("Catalogue invariant check warning:", e);
}

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
