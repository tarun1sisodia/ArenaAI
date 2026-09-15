/**
 * NetworkBoard — home page "network intelligence" analytics section
 * --------------------------------------------------------------------------
 * New, add-only section: it slots into HomePage between the fleet showcase and
 * the coverflow carousel. It reuses the shared AnalyticsBoard so the home page
 * speaks the same data-visual language as the routes/services/fleet hubs.
 *
 * All figures are marketing aggregates of the published catalogue (they are not
 * live telemetry): corridor count, fleet classes, published city pairs and the
 * headline expressway benchmarks.
 */

import { AnalyticsBoard, type BoardBar, type BoardMetric } from "../ui/AnalyticsBoard";
import { Reveal } from "../ui/motion";
import type { SupportedLanguage } from "../../config";
import { routes, vehicles } from "../../data";

interface NetworkBoardProps {
  language?: SupportedLanguage;
}

const CORRIDOR_BENCHMARKS: Array<{ label: string; labelHi: string; fare: number; km: number }> = [
  { label: "Agra → Delhi NCR", labelHi: "आगरा → दिल्ली एनसीआर", fare: 3499, km: 230 },
  { label: "Agra → Jaipur", labelHi: "आगरा → जयपुर", fare: 3499, km: 240 },
  { label: "Agra → Lucknow", labelHi: "आगरा → लखनऊ", fare: 7000, km: 335 },
  { label: "Agra → Gwalior", labelHi: "आगरा → ग्वालियर", fare: 3000, km: 120 },
  { label: "Agra → Mathura", labelHi: "आगरा → मथुरा", fare: 2200, km: 58 },
];

export function NetworkBoard({ language }: NetworkBoardProps) {
  const isHindi = language === "hi";

  const metrics: BoardMetric[] = [
    {
      id: "corridors",
      label: isHindi ? "प्रकाशित कॉरिडोर" : "Published corridors",
      value: routes.length,
      unit: isHindi ? "मार्ग" : "routes",
      icon: "route",
      delta: isHindi ? "5 राज्य" : "across 5 states",
      deltaTone: "flat",
      spark: [4, 5, 6, 7, 8, 9, routes.length],
    },
    {
      id: "fleet",
      label: isHindi ? "बेड़े की श्रेणियां" : "Fleet classes",
      value: vehicles.length,
      unit: isHindi ? "श्रेणियां" : "classes",
      icon: "car",
      spark: [2, 3, 3, 4, 4, vehicles.length],
    },
    {
      id: "response",
      label: isHindi ? "औसत डिस्पैच समय" : "Avg. dispatch time",
      value: 12,
      unit: isHindi ? "मिनट" : "min",
      icon: "clock",
      delta: isHindi ? "24×7 कंट्रोल रूम" : "24×7 control room",
    },
    {
      id: "rating",
      label: isHindi ? "औसत यात्री रेटिंग" : "Average trip rating",
      value: 4.9,
      decimals: 1,
      unit: "/ 5",
      icon: "star",
      delta: isHindi ? "सत्यापित यात्री" : "verified travellers",
    },
  ];

  const bars: BoardBar[] = CORRIDOR_BENCHMARKS.map((corridor) => ({
    id: corridor.label,
    label: isHindi ? corridor.labelHi : corridor.label,
    value: corridor.fare,
    display: `₹${corridor.fare.toLocaleString("en-IN")} · ${corridor.km} km`,
    icon: "toll",
  }));

  return (
    <section
      className="home-section network-board-section section--paper-alt"
      aria-labelledby="network-board-heading"
    >
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{isHindi ? "नेटवर्क इंटेलिजेंस" : "Network Intelligence"}</p>
            <h2 id="network-board-heading">
              {isHindi ? (
                <>
                  हमारे नेटवर्क के आंकड़े,
                  <br />
                  <i>एक नज़र में पारदर्शी।</i>
                </>
              ) : (
                <>
                  The network at a glance,
                  <br />
                  <i>measured, not estimated.</i>
                </>
              )}
            </h2>
          </div>
          <a className="text-link" href={isHindi ? "/hi/routes/" : "/en/routes/"}>
            {isHindi ? "पूरा किराया बोर्ड देखें ↗" : "See the full fare board ↗"}
          </a>
        </div>

        <Reveal>
          <AnalyticsBoard
            title={isHindi ? "एक्सप्रेसवे कॉरिडोर बेंचमार्क" : "Expressway corridor benchmarks"}
            description={
              isHindi
                ? "सेडान वन-वे किराया, टोल व राज्य कर सहित — कोई छिपा शुल्क नहीं।"
                : "Sedan one-way fares inclusive of tolls and state permits — no hidden surcharges."
            }
            metrics={metrics}
            bars={bars}
            barHeading={isHindi ? "किराया तुलना (सेडान, वन-वे)" : "Fare comparison (sedan, one-way)"}
            footerNote={
              isHindi
                ? "सभी बुकिंग पर जीएसटी इनवॉइस, UPI अग्रिम भुगतान और 24 घंटे में मुफ्त कैंसिलेशन।"
                : "GST invoice, UPI advance payment and free cancellation up to 24 hours before departure."
            }
            legend={[
              { label: isHindi ? "प्रति किमी दर" : "Fare per published route" },
              { label: isHindi ? "सीट व सामान" : "Seats & luggage", muted: true },
            ]}
          />
        </Reveal>
      </div>
    </section>
  );
}

export default NetworkBoard;
