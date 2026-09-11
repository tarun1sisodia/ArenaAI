import type { SupportedLanguage } from "../../config";

interface FleetSectionProps {
  language?: SupportedLanguage;
}

interface FeaturedVehicle {
  id: string;
  slug: string;
  indexTag: string;
  category: string;
  name: { en: string; hi: string };
  blurb: { en: string; hi: string };
  specs: { en: string[]; hi: string[] };
  startingFare: number;
  image: string;
  srcset: string;
}

const FEATURED_VEHICLES: FeaturedVehicle[] = [
  {
    id: "sedan",
    slug: "sedan",
    indexTag: "01 / 05",
    category: "SEDAN",
    name: {
      en: "Sedan (Dzire / Etios)",
      hi: "सेडान (डिजायर / इटिओस)"
    },
    blurb: {
      en: "Everyday comfort for city rides, Yamuna Expressway drops, and local sightseeing.",
      hi: "शहर की यात्रा, यमुना एक्सप्रेसवे और आगरा लोकल दर्शन के लिए रोज़मर्रा का आरामदायक विकल्प।"
    },
    specs: {
      en: ["4+1 Seats", "AC", "2 Large Bags"],
      hi: ["4+1 सीटें", "एसी", "2 बड़े बैग"]
    },
    startingFare: 3499,
    image: "/assets/fleet/sedan.webp",
    srcset: "/assets/fleet/sedan-480.webp 480w, /assets/fleet/sedan-768.webp 768w, /assets/fleet/sedan.webp 1312w"
  },
  {
    id: "innova",
    slug: "innova-crysta",
    indexTag: "03 / 05",
    category: "INNOVA CRYSTA",
    name: {
      en: "Innova Crysta",
      hi: "इनोवा क्रिस्टा"
    },
    blurb: {
      en: "The outstation favourite — plush pushback seats, smooth suspension, and a quiet cabin.",
      hi: "आउटस्टेशन की पसंदीदा — आलीशान पुशबैक सीटें, स्मूथ सस्पेंशन और शांत केबिन।"
    },
    specs: {
      en: ["6+1 Seats", "Dual AC", "4 Large Bags"],
      hi: ["6+1 सीटें", "डुअल एसी", "4 बड़े बैग"]
    },
    startingFare: 6499,
    image: "/assets/fleet/innova.webp",
    srcset: "/assets/fleet/innova-480.webp 480w, /assets/fleet/innova-768.webp 768w, /assets/fleet/innova.webp 1312w"
  },
  {
    id: "tempo",
    slug: "tempo-traveller",
    indexTag: "04 / 05",
    category: "TEMPO TRAVELLER",
    name: {
      en: "Tempo Traveller",
      hi: "टेम्पो ट्रैवलर"
    },
    blurb: {
      en: "Spacious pushback seats, luggage bay, individual AC vents, and ice-box for group travel.",
      hi: "समूह यात्रा के लिए आरामदायक पुशबैक सीटें, लगेज स्पेस, व्यक्तिगत एसी वेंट्स।"
    },
    specs: {
      en: ["12+1 Seats", "Rear AC", "Luggage Bay"],
      hi: ["12+1 सीटें", "रियर एसी", "लगेज बे"]
    },
    startingFare: 9500,
    image: "/assets/fleet/tempo.webp",
    srcset: "/assets/fleet/tempo-480.webp 480w, /assets/fleet/tempo-768.webp 768w, /assets/fleet/tempo.webp 1312w"
  }
];

export function FleetSection({ language = "en" }: FleetSectionProps) {
  const isHindi = language === "hi";
  const langPrefix = isHindi ? "/hi" : "/en";

  return (
    <section className="home-section fleet-section" aria-labelledby="fleet-heading">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{isHindi ? "गाड़ियां" : "Fleet"}</p>
            <h2 id="fleet-heading">
              {isHindi ? (
                <>
                  अपनी सुविधा अनुसार गाड़ी चुनें।
                  <br />
                  <i>पूरे परिवार के साथ सफर करें।</i>
                </>
              ) : (
                <>
                  Choose your comfort.
                  <br />
                  <i>Bring your people.</i>
                </>
              )}
            </h2>
          </div>
          <a className="text-link" href={`${langPrefix}/fleet/`}>
            {isHindi ? "पूरी फ्लीट देखें ↗" : "Full fleet ↗"}
          </a>
        </div>

        <div className="fleet-grid">
          {FEATURED_VEHICLES.map((v) => (
            <article className="vehicle-card" key={v.id}>
              <div className="vehicle-photo">
                <img
                  src={v.image}
                  srcSet={v.srcset}
                  sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 1120px) 50vw, 348px"
                  alt={`${v.name[language]} taxi in Agra`}
                  width="480"
                  height="300"
                  loading="lazy"
                  decoding="async"
                />
                <div className="vehicle-photo-tag">
                  <span>{v.indexTag}</span>
                  <b>{v.category}</b>
                </div>
              </div>

              <div className="vehicle-body">
                <h3>{v.name[language]}</h3>
                <p>{v.blurb[language]}</p>

                <div className="vehicle-specs" aria-label="Vehicle features">
                  {v.specs[language].map((spec, i) => (
                    <span className="vehicle-spec-pill" key={i}>
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="vehicle-cta">
                  <div className="vehicle-price">
                    <span className="vehicle-price-label">
                      {isHindi ? "किराया शुरू" : "Starting from"}
                    </span>
                    <span className="vehicle-price-val">
                      ₹{v.startingFare.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <a
                    className="vehicle-action-link"
                    href={`${langPrefix}/vehicles/${v.slug}/`}
                  >
                    <span>{isHindi ? "गाड़ी चुनें" : "Choose this car"}</span>
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
