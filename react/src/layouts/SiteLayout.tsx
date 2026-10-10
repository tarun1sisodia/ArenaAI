import type { ReactNode } from "react";
import { Header, LeadBar, RadialDock, Footer, SkipLink } from "../components/Chrome";
import { BuddyWidget } from "../components/avatar/BuddyWidget";

interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="app-shell">
      <SkipLink />
      <Header />
      <div className="pt-12">
        {children}
      </div>
      <LeadBar />
      <RadialDock />
      <BuddyWidget />
      <Footer />
    </div>
  );
}
