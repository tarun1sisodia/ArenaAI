import type { ReactNode } from "react";
import { Header, LeadBar } from "../components/Chrome";
import { contact } from "../data/contact";

interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="app-shell">
      <Header />
      {children}
      <LeadBar />
      <footer className="site-footer">
        <span>SK Baghel Tour &amp; Travels</span>
        <a href={`tel:${contact.phone}`}>Call the travel desk</a>
      </footer>
    </div>
  );
}
