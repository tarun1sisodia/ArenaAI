import { useEffect, useState } from "react";
import type { SupportedLanguage } from "../config";
import type { TourPackage } from "../data";
import { fetchTourPackageBySlug } from "../services/catalogManifest";
import { PackageDetailPage } from "./PackageDetailPage";
import { NotFoundPage } from "./NotFoundPage";

interface DynamicPackageDetailPageProps {
  language?: SupportedLanguage;
  slug: string;
}

export function DynamicPackageDetailPage({ language = "en", slug }: DynamicPackageDetailPageProps) {
  const [pkg, setPkg] = useState<TourPackage | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let isMounted = true;
    setStatus("loading");
    fetchTourPackageBySlug(slug)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setPkg(data);
          setStatus("ready");
        } else {
          setStatus("missing");
        }
      })
      .catch(() => {
        if (isMounted) setStatus("missing");
      });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (status === "missing") {
    return <NotFoundPage language={language} />;
  }

  if (status === "loading" || !pkg) {
    return (
      <div className="w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin py-space-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-1/3 rounded bg-surface-container" />
          <div className="h-64 rounded-xl bg-surface-container" />
          <div className="h-6 w-2/3 rounded bg-surface-container" />
          <div className="h-4 w-1/2 rounded bg-surface-container" />
        </div>
      </div>
    );
  }

  return <PackageDetailPage language={language} pkg={pkg} />;
}

export default DynamicPackageDetailPage;
