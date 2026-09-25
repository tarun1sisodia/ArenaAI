import { type ReactNode, useEffect } from "react";
import { Header, LeadBar, RadialDock, PageLoader, Footer, SkipLink } from "../components/Chrome";
import { initSmoothScrollLimiter } from "../utils/smoothScrollLimiter";

interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  useEffect(() => {
    const cleanup = initSmoothScrollLimiter();
    return cleanup;
  }, []);

  return (
    <div className="app-shell">
      <SkipLink />
      <PageLoader />
      <Header />
      <div className="pt-12">
        {children}
      </div>
      <LeadBar />
      <RadialDock />
      <Footer />
    </div>
  );
}
