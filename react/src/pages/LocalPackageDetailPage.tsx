import React from "react";
import type { SupportedLanguage } from "../config";
import { LocalTourTemplate, type DossierLocalPackageItem } from "../templates/LocalTourTemplate";

export type { DossierLocalPackageItem };

export interface LocalPackageDetailPageProps {
  language?: SupportedLanguage;
  item: DossierLocalPackageItem;
}

export function LocalPackageDetailPage({ language = "en", item }: LocalPackageDetailPageProps) {
  return <LocalTourTemplate language={language} item={item} />;
}

export default LocalPackageDetailPage;
