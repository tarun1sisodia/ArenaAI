import { useEffect } from "react";
import { contact } from "../data/contact";

interface SeoHeadProps {
  language: "en" | "hi";
  pathname: string;
  title: string;
  description: string;
  noindex?: boolean;
}

export function SeoHead({ language, pathname, title, description, noindex = false }: SeoHeadProps) {
  useEffect(() => {
    document.documentElement.lang = language === "hi" ? "hi-IN" : "en-IN";
    document.documentElement.dir = "ltr";
    document.title = title;

    const setMeta = (name: string, content: string) => {
      const meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`) ?? document.createElement("meta");
      meta.name = name;
      meta.content = content;
      if (!meta.parentElement) document.head.appendChild(meta);
    };
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = new URL(pathname, window.location.origin).href;
    if (!canonical.parentElement) document.head.appendChild(canonical);
    setMeta("description", description);
    setMeta("robots", noindex ? "noindex,nofollow" : "index,follow");
    setMeta("twitter:card", "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]') ?? document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    ogTitle.content = title;
    if (!ogTitle.parentElement) document.head.appendChild(ogTitle);
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]') ?? document.createElement("meta");
    ogDescription.setAttribute("property", "og:description");
    ogDescription.content = description;
    if (!ogDescription.parentElement) document.head.appendChild(ogDescription);
    const ogType = document.querySelector<HTMLMetaElement>('meta[property="og:type"]') ?? document.createElement("meta");
    ogType.setAttribute("property", "og:type");
    ogType.content = "website";
    if (!ogType.parentElement) document.head.appendChild(ogType);

    const alternate = (hreflang: string, href: string) => {
      const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${hreflang}"]`) ?? document.createElement("link");
      link.rel = "alternate";
      link.hreflang = hreflang;
      link.href = href;
      if (!link.parentElement) document.head.appendChild(link);
    };
    const counterpart = pathname.startsWith("/hi/") ? pathname.replace(/^\/hi/, "/en") : pathname === "/hi/" ? "/" : pathname.startsWith("/en/") ? pathname.replace(/^\/en/, "/hi") : `/hi${pathname === "/" ? "/" : pathname}`;
    alternate("en-IN", new URL(pathname.startsWith("/hi/") ? counterpart : pathname, window.location.origin).href);
    alternate("hi-IN", new URL(pathname.startsWith("/hi/") ? pathname : counterpart, window.location.origin).href);
    alternate("x-default", new URL(pathname.startsWith("/hi/") ? counterpart : pathname, window.location.origin).href);
  }, [description, language, noindex, pathname, title]);

  return (
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": ["TravelAgency", "TaxiService", "LocalBusiness"],
        name: "SK Baghel Tour & Travels",
        url: window.location.origin,
        telephone: contact.phone,
        email: contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: contact.address,
          addressCountry: "IN"
        },
        availableLanguage: ["en-IN", "hi-IN"]
      })}
    </script>
  );
}
