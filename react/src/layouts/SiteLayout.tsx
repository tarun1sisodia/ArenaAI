import type { ReactNode } from "react";
import { Header, LeadBar, RadialDock, Footer, SkipLink } from "../components/Chrome";

interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="app-shell">
      <SkipLink />
      <Header />
      {/* Single main landmark on every page; SkipLink targets #main-content (2026-10-02). */}
      <main id="main-content" className="pt-12">
        {children}
      </main>
      <LeadBar />
      <RadialDock />
      <Footer />
    </div>
  );
}
