import React from "react";
import Reveal from "../components/reveal";
import { MonumentCard, type MonumentCardContract } from "../components/cards";
import { SectionHeading } from "../components/badges";
import { agraMonuments } from "../data";
import type { SupportedLanguage } from "../config";

const MONUMENT_THUMBNAILS: Record<string, string> = {
  "taj-mahal": "/assets/places/agra-taj-mahal.webp",
  "agra-fort": "/assets/places/agra-red-fort.webp",
  "fatehpur-sikri": "/assets/places/agra-fatehpur-sikri.webp",
  "itmad-ud-daulah": "/assets/places/india-heritage-monument.webp",
  "mehtab-bagh": "/assets/packages/taj-dawn.webp",
  "sikandra-fort": "/assets/places/delhi-red-fort.webp",
  "jama-masjid": "/assets/places/delhi-akshardham.webp",
  "moti-masjid": "/assets/places/agra-red-fort.webp",
};

export interface MonumentsPageProps {
  language?: SupportedLanguage;
}

export function MonumentsPage({ language = "en" }: MonumentsPageProps) {
  const monuments: MonumentCardContract[] = agraMonuments.map((m, idx) => ({
    slug: m.id,
    name: m.name,
    thumbnail: MONUMENT_THUMBNAILS[m.id] || "/assets/places/agra-taj-mahal.webp",
    thumbnailAlt: `${m.name} — Agra Heritage Monument`,
    visitingHours: m.timings,
    isNew: idx < 2,
  }));

  return (
    <main className="min-h-screen bg-ivory text-ink">
      <section className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8">
        <Reveal>
          <SectionHeading
            as="h1"
            index="M"
            kicker={`${monuments.length} published guides`}
            title={
              <>
                Stones that <em className="text-saffron italic">sing</em>
              </>
            }
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
          {monuments.map((m, i) => (
            <Reveal key={m.slug} delay={i * 80}>
              <MonumentCard monument={m} />
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}

export default MonumentsPage;
