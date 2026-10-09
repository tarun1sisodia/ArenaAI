import React from "react";
import type { SupportedLanguage } from "../config";
import { MonumentTemplate, type DossierMonumentItem } from "../templates/MonumentTemplate";

export type { DossierMonumentItem };

export interface MonumentDetailPageProps {
  language?: SupportedLanguage;
  item: DossierMonumentItem;
}

export function MonumentDetailPage({ language = "en", item }: MonumentDetailPageProps) {
  return <MonumentTemplate language={language} item={item} />;
}

export default MonumentDetailPage;
