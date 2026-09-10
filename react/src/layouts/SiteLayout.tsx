import type { ReactNode } from "react";
import { Header, LeadBar, RadialDock, PageLoader, Footer, SkipLink } from "../components/Chrome";

interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="app-shell">
      <SkipLink />
      <PageLoader />
      <Header />
      {children}
      <LeadBar />
      <RadialDock />
      <Footer />
    </div>
  );
}
