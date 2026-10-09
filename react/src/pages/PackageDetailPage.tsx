import React from "react";
import type { SupportedLanguage } from "../config";
import { type TourPackage } from "../data";
import { TourPackageTemplate } from "../templates/TourPackageTemplate";

export interface PackageDetailPageProps {
  language?: SupportedLanguage;
  pkg: TourPackage;
}

export function PackageDetailPage({ language = "en", pkg }: PackageDetailPageProps) {
  return <TourPackageTemplate language={language} pkg={pkg} />;
}

export default PackageDetailPage;
