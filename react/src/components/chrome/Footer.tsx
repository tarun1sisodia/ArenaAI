import { BrandLogo } from "./BrandLogo";
import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";

export interface FooterProps {
  currentPath?: string;
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  const fleetLinks = [
    { name: "Dzire Sedan (4+1)", rate: "From ₹10/km", href: "/fleet" },
    { name: "Maruti Ertiga MPV (6+1)", rate: "From ₹14/km", href: "/fleet" },
    { name: "Innova Crysta VIP (6+1)", rate: "From ₹18/km", href: "/fleet" },
    { name: "Tempo Traveller (12–16s)", rate: "From ₹24/km", href: "/fleet" },
    { name: "Force Urbania Luxury (16s)", rate: "From ₹32/km", href: "/fleet" },
  ];

  const routeLinks = [
    { name: "Agra → Delhi / IGI Airport", fare: "₹3,499", href: "/routes" },
    { name: "Agra → Jaipur Pink City", fare: "₹3,499", href: "/routes" },
    { name: "Agra → Mathura Vrindavan", fare: "₹2,200", href: "/routes" },
    { name: "Agra → Gwalior Fort", fare: "₹3,000", href: "/routes" },
    { name: "Agra → Fatehpur Sikri", fare: "₹1,800", href: "/routes" },
  ];

  const tourLinks = [
    { name: "Taj Mahal Sunrise Tour", href: "/packages/taj-mahal-sunrise-tour" },
    { name: "Mathura-Vrindavan Tour", href: "/packages/mathura-vrindavan" },
    { name: "Golden Triangle 3-City Tour", href: "/packages/golden-triangle" },
    { name: "Agra Local Sightseeing (8h/80km)", href: "/packages/agra-sightseeing" },
    { name: "Driver Standards & Safety", href: "/services" },
  ];

  return (
    <footer
      className={`w-full bg-surface-container-low text-on-surface-variant border-t border-border-warm pb-24 md:pb-0 ${className}`.trim()}
      role="contentinfo"
    >

      {/* Main 4-Column Directory */}
      <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin pt-space-2xl pb-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl">
          {/* Column 1: Brand & NAP */}
          <div className="flex flex-col gap-space-md">
            <BrandLogo href="/" />
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Reliable taxi service, outstation cabs, and guided sightseeing tours in Agra and across North India. Government-approved tourist fleet operator.
            </p>
            <div className="flex flex-col gap-space-xs mt-space-xs">
              <span className="font-label-caps text-label-caps text-primary uppercase font-bold tracking-wider">
                Taj Ganj Office
              </span>
              <p className="font-body-sm text-body-sm text-on-surface">
                {contact.address}
              </p>
              <div className="flex flex-col gap-1 pt-1 text-body-sm">
                <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 text-on-surface hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-primary text-[18px]">call</span>
                  <span>{contact.phoneDisplay}</span>
                </a>
                <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-on-surface hover:text-primary transition-colors">
                  <WhatsAppIcon className="w-[18px] h-[18px] shrink-0" />
                  <span>WhatsApp Support</span>
                </a>
                <a
                  href={contact.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-space-xs text-primary hover:underline font-label-lg text-label-lg mt-1"
                >
                  <span className="material-symbols-outlined text-[16px]">map</span>
                  <span>View on Google Maps</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Fleet Directory */}
          <div className="flex flex-col gap-space-md">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              Our Fleet
            </h3>
            <ul className="flex flex-col gap-space-sm font-body-sm text-body-sm">
              {fleetLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onMouseEnter={() => prefetchDocument(item.href)}
                    className="flex items-center justify-between hover:text-primary transition-colors py-0.5"
                  >
                    <span>{item.name}</span>
                    <span className="font-label-caps text-label-caps text-primary font-semibold">{item.rate}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Intercity Routes */}
          <div className="flex flex-col gap-space-md">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              Popular Routes
            </h3>
            <ul className="flex flex-col gap-space-sm font-body-sm text-body-sm">
              {routeLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onMouseEnter={() => prefetchDocument(item.href)}
                    className="flex items-center justify-between hover:text-primary transition-colors py-0.5"
                  >
                    <span>{item.name}</span>
                    <span className="font-label-caps text-label-caps text-primary font-semibold">{item.fare}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Tours */}
          <div className="flex flex-col gap-space-md">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              Sightseeing Tours
            </h3>
            <nav className="flex flex-col gap-space-sm font-body-sm text-body-sm">
              {tourLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onMouseEnter={() => prefetchDocument(item.href)}
                  className="hover:text-primary transition-colors py-0.5"
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Sub-Footer & Legal Copyright */}
      <div className="border-t border-border-warm bg-surface-container/40">
        <div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-center sm:text-left">
          <p className="font-body-sm text-body-sm text-on-surface-variant text-[13px]">
            © {new Date().getFullYear()} SK Baghel Tour & Travels. All rights reserved. GSTIN: {contact.gst}.
          </p>
          <div className="flex flex-wrap items-center gap-space-md font-body-sm text-body-sm text-[13px]">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="text-border-warm">•</span>
            <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
            <span className="text-border-warm">•</span>
            <a href="/faq" className="hover:text-primary transition-colors">FAQ & Cancellation</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
