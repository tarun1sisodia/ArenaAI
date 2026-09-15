import { useCallback } from "react";
import { contact } from "../../data/contact";
import { prefetchDocument } from "../../app/prefetch";

export interface FooterProps {
  currentPath?: string;
  className?: string;
}

export function Footer({ currentPath, className = "" }: FooterProps) {
  const path =
    currentPath ||
    (typeof window !== "undefined" ? window.location.pathname : "/");
  const isHindi = path.startsWith("/hi");
  const langPrefix = isHindi ? "/hi" : "/en";
  const currentYear = new Date().getFullYear();

  const handleLinkHover = useCallback((url: string) => {
    prefetchDocument(url);
  }, []);

  const scrollToTop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Route slugs depending on language
  const agraDelhiRoute = isHindi ? "agra-se-delhi-taxi" : "agra-to-delhi-taxi";
  const delhiAgraRoute = isHindi ? "delhi-se-agra-taxi" : "delhi-to-agra-taxi";
  const agraJaipurRoute = isHindi ? "agra-se-jaipur-taxi" : "agra-to-jaipur-taxi";
  const agraMathuraRoute = isHindi ? "agra-se-mathura-taxi" : "agra-to-mathura-taxi";
  const agraGwaliorRoute = isHindi ? "agra-se-gwalior-taxi" : "agra-to-gwalior-taxi";
  const agraSightseeingRoute = isHindi ? "agra-darshan-taxi" : "agra-sightseeing-taxi";

  return (
    <footer className={`site-footer ${className}`.trim()} role="contentinfo">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Column 1: Brand & Verified NAP Block */}
          <div className="footer-col footer-brand-col">
            <div className="footer-brand">
              <a
                href={isHindi ? "/hi/" : "/"}
                className="footer-brand-link"
                aria-label="SK Baghel Tour & Travels Home"
                onMouseEnter={() => handleLinkHover(isHindi ? "/hi/" : "/")}
              >
                <span className="footer-brand-compass" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="22"
                    height="22"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polygon
                      points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
                      fill="var(--gold, #E5A044)"
                      stroke="none"
                    />
                  </svg>
                </span>
                <span className="footer-brand-text">
                  <strong>SK BAGHEL</strong>
                  <small>TOUR &amp; TRAVELS &bull; AGRA</small>
                </span>
              </a>
            </div>

            <p className="footer-blurb">
              {isHindi
                ? "ताज गंज, आगरा स्थित विश्वसनीय टैक्सी और टूर डेस्क। दिल्ली/जयपुर आउटस्टेशन कैब, आगरा दर्शन, और टेम्पो ट्रैवलर रेंटल के लिए पारदर्शी और फिक्स किराये।"
                : "Agra's premier taxi & tour desk based in Taj Ganj. Clean AC cabs, verified chauffeurs, and transparent all-inclusive fares across Uttar Pradesh, Rajasthan & Delhi NCR."}
            </p>

            <address className="footer-nap" not-italic="true">
              <div className="footer-nap-item">
                <span className="footer-nap-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="16"
                    height="16"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span className="footer-nap-text">
                  {contact.address}
                  <a
                    href={contact.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-maps-link"
                  >
                    {isHindi ? "गूगल मैप्स पर देखें" : "View on Google Maps"} &rarr;
                  </a>
                </span>
              </div>

              <div className="footer-nap-item">
                <span className="footer-nap-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="16"
                    height="16"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <a href={`tel:${contact.phone}`} className="footer-contact-link">
                  <strong>{contact.phoneDisplay}</strong>
                  <span className="footer-subtext">{isHindi ? "24×7 कॉल करें" : "24×7 Instant Dispatch"}</span>
                </a>
              </div>

              <div className="footer-nap-item">
                <span className="footer-nap-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="16"
                    height="16"
                  >
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </span>
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-contact-link"
                >
                  <span>{isHindi ? "व्हाट्सएप सपोर्ट" : "WhatsApp Travel Desk"}</span>
                  <span className="footer-subtext">{contact.phoneDisplay}</span>
                </a>
              </div>

              <div className="footer-nap-item">
                <span className="footer-nap-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="16"
                    height="16"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <a href={`mailto:${contact.email}`} className="footer-contact-link">
                  <span>{contact.email}</span>
                </a>
              </div>
            </address>

            <div className="footer-credentials">
              <span className="footer-credential-pill">GSTIN: {contact.gst}</span>
              <span className="footer-credential-pill">{isHindi ? "24 घंटे बुकिंग" : "Open 24×7"}</span>
            </div>
          </div>

          {/* Column 2: Fleet & Vehicle Directory */}
          <div className="footer-col">
            <h4 className="footer-heading">
              {isHindi ? "वाहनों की सूची" : "Fleet Directory"}
            </h4>
            <ul className="footer-link-list">
              <li>
                <a
                  href={`${langPrefix}/vehicles/sedan/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/vehicles/sedan/`)}
                >
                  <span>{isHindi ? "सेडान कैब (Dzire / Etios)" : "Sedan Cab (Dzire / Etios)"}</span>
                  <small className="footer-rate-tag">₹10/km</small>
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/vehicles/ertiga/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/vehicles/ertiga/`)}
                >
                  <span>{isHindi ? "अर्टिगा 6-सीटर (Ertiga)" : "Ertiga 6-Seater SUV"}</span>
                  <small className="footer-rate-tag">₹14/km</small>
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/vehicles/innova-crysta/`}
                  onMouseEnter={() =>
                    handleLinkHover(`${langPrefix}/vehicles/innova-crysta/`)
                  }
                >
                  <span>{isHindi ? "इनोवा क्रिस्टा (Innova)" : "Innova Crysta Premium"}</span>
                  <small className="footer-rate-tag">₹18/km</small>
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/vehicles/tempo-traveller/`}
                  onMouseEnter={() =>
                    handleLinkHover(`${langPrefix}/vehicles/tempo-traveller/`)
                  }
                >
                  <span>{isHindi ? "टेम्पो ट्रैवलर (9–26 सीट)" : "Tempo Traveller (9–26s)"}</span>
                  <small className="footer-rate-tag">₹25/km</small>
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/vehicles/urbania/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/vehicles/urbania/`)}
                >
                  <span>{isHindi ? "फोर्स अर्बानिया लग्जरी (Urbania)" : "Force Urbania Luxury Van"}</span>
                  <small className="footer-rate-tag">₹34/km</small>
                </a>
              </li>
              <li className="footer-view-all">
                <a
                  href={`${langPrefix}/fleet/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/fleet/`)}
                >
                  <strong>{isHindi ? "सभी वाहन व रेट कार्ड &rarr;" : "View All Fleet Rates &rarr;"}</strong>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Outstation & Popular Route Directory */}
          <div className="footer-col">
            <h4 className="footer-heading">
              {isHindi ? "प्रमुख रूट्स" : "Popular Routes"}
            </h4>
            <ul className="footer-link-list">
              <li>
                <a
                  href={`${langPrefix}/${agraDelhiRoute}/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/${agraDelhiRoute}/`)}
                >
                  <span>{isHindi ? "आगरा से दिल्ली टैक्सी" : "Agra to Delhi Airport Taxi"}</span>
                  <small className="footer-rate-tag">₹3,499</small>
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/${delhiAgraRoute}/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/${delhiAgraRoute}/`)}
                >
                  <span>{isHindi ? "दिल्ली से आगरा टैक्सी" : "Delhi to Agra Express Cab"}</span>
                  <small className="footer-rate-tag">₹3,499</small>
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/${agraJaipurRoute}/`}
                  onMouseEnter={() =>
                    handleLinkHover(`${langPrefix}/${agraJaipurRoute}/`)
                  }
                >
                  <span>{isHindi ? "आगरा से जयपुर टैक्सी" : "Agra to Jaipur Highway Taxi"}</span>
                  <small className="footer-rate-tag">₹3,499</small>
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/${agraMathuraRoute}/`}
                  onMouseEnter={() =>
                    handleLinkHover(`${langPrefix}/${agraMathuraRoute}/`)
                  }
                >
                  <span>{isHindi ? "आगरा से मथुरा-वृंदावन" : "Agra to Mathura-Vrindavan"}</span>
                  <small className="footer-rate-tag">₹2,200</small>
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/${agraGwaliorRoute}/`}
                  onMouseEnter={() =>
                    handleLinkHover(`${langPrefix}/${agraGwaliorRoute}/`)
                  }
                >
                  <span>{isHindi ? "आगरा से ग्वालियर टैक्सी" : "Agra to Gwalior Day Trip"}</span>
                  <small className="footer-rate-tag">₹2,800</small>
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/${agraSightseeingRoute}/`}
                  onMouseEnter={() =>
                    handleLinkHover(`${langPrefix}/${agraSightseeingRoute}/`)
                  }
                >
                  <span>{isHindi ? "आगरा लोकल दर्शन (8h/80km)" : "Agra Local Tour (8h/80km)"}</span>
                  <small className="footer-rate-tag">₹1,900</small>
                </a>
              </li>
              <li className="footer-view-all">
                <a
                  href={`${langPrefix}/routes/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/routes/`)}
                >
                  <strong>{isHindi ? "सभी रूट्स और दूरी तालिका &rarr;" : "All 8 Outstation Routes &rarr;"}</strong>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Tours, Company & Legal Links */}
          <div className="footer-col">
            <h4 className="footer-heading">
              {isHindi ? "टूर्स और सेवाएं" : "Tours & Services"}
            </h4>
            <ul className="footer-link-list">
              <li>
                <a
                  href={`${langPrefix}/packages/taj-mahal-sunrise-tour/`}
                  onMouseEnter={() =>
                    handleLinkHover(`${langPrefix}/packages/taj-mahal-sunrise-tour/`)
                  }
                >
                  {isHindi ? "ताज महल सनराइज टूर" : "Taj Mahal Sunrise Tour"}
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/packages/mathura-vrindavan/`}
                  onMouseEnter={() =>
                    handleLinkHover(`${langPrefix}/packages/mathura-vrindavan/`)
                  }
                >
                  {isHindi ? "मथुरा-वृंदावन दर्शन" : "Mathura-Vrindavan Pilgrimage"}
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/packages/golden-triangle/`}
                  onMouseEnter={() =>
                    handleLinkHover(`${langPrefix}/packages/golden-triangle/`)
                  }
                >
                  {isHindi ? "गोल्डन ट्रायंगल सर्किट (3 दिन)" : "Golden Triangle Tour (3-Day)"}
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/services/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/services/`)}
                >
                  {isHindi ? "हमारी 6 प्रमुख सेवाएं" : "All 6 Travel Services"}
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/about/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/about/`)}
                >
                  {isHindi ? "हमारे बारे में (About Us)" : "About SK Baghel Travels"}
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/contact/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/contact/`)}
                >
                  {isHindi ? "संपर्क केंद्र (Contact Desk)" : "Contact & Support Desk"}
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/faq/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/faq/`)}
                >
                  {isHindi ? "अक्सर पूछे जाने वाले सवाल (FAQ)" : "FAQs & Billing Rules"}
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/terms/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/terms/`)}
                >
                  {isHindi ? "नियम व 24h रिफंड पॉलिसी" : "Terms & 24h Refund Policy"}
                </a>
              </li>
              <li>
                <a
                  href={`${langPrefix}/privacy/`}
                  onMouseEnter={() => handleLinkHover(`${langPrefix}/privacy/`)}
                >
                  {isHindi ? "गोपनीयता नीति (Privacy)" : "Privacy Policy"}
                </a>
              </li>
              <li className="footer-book-cta">
                <a
                  href="/book.html"
                  className="footer-book-btn"
                  onMouseEnter={() => handleLinkHover("/book.html")}
                >
                  {isHindi ? "ऑनलाइन टैक्सी बुक करें" : "Book Online Taxi Now"} &rarr;
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-copy">
            <p>
              &copy; {currentYear} <strong>SK Baghel Tour &amp; Travels</strong>.{" "}
              {isHindi ? "सर्वाधिकार सुरक्षित।" : "All rights reserved."}
            </p>
            <p className="footer-meta-note">
              {isHindi
                ? "ताज गंज, आगरा • पारदर्शी किराये • 28% अग्रिम जमा नीति • शून्य छिपे शुल्क"
                : "Taj Ganj, Agra • Serving North India with pride • 28% Advance Deposit Policy • 100% Fare Transparency"}
            </p>
          </div>

          <div className="footer-bottom-actions">
            <button
              type="button"
              className="footer-top-btn"
              onClick={scrollToTop}
              aria-label={isHindi ? "पेज के शीर्ष पर जाएं" : "Back to top of page"}
              title={isHindi ? "शीर्ष पर जाएं" : "Back to top"}
            >
              <span aria-hidden="true">&uarr;</span>
              <span>{isHindi ? "शीर्ष पर जाएं" : "Back to top"}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
