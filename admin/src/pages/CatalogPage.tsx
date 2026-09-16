import { useState } from "react";
import { Archive, CheckCircle2, Clock, Globe, MapPin, PenSquare } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CATALOG } from "@/lib/mock-data";
import { can, type AdminUser, type CatalogItem, type CatalogCategory } from "@/lib/types";
import { cn, formatDate, formatINR } from "@/lib/utils";

const CATEGORY_TONE: Record<CatalogCategory, "neutral" | "teal" | "gold"> = {
  ride: "neutral",
  tour: "teal",
  package: "gold",
  route: "teal",
  vehicle: "neutral",
};

export function CatalogPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<CatalogItem[]>(CATALOG);
  const canEdit = can(user.role, "catalog:edit");
  const canPublish = can(user.role, "catalog:publish");

  function setStatus(id: string, status: CatalogItem["status"]) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
  }

  const counts = {
    draft: items.filter((i) => i.status === "draft").length,
    published: items.filter((i) => i.status === "published").length,
    archived: items.filter((i) => i.status === "archived").length,
  };

  return (
    <div>
      <PageHeader
        eyebrow="CMS"
        title="Catalog CMS"
        description="Rides, tours and packages. Drafts are invisible to the public site until a super admin publishes them."
        actions={
          canEdit ? (
            <Button variant="gold" size="sm" shine>
              <PenSquare className="h-3.5 w-3.5" /> New item
            </Button>
          ) : (
            <Badge tone="neutral">Read-only for your role</Badge>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {(Object.keys(counts) as (keyof typeof counts)[]).map((k) => (
          <Badge key={k} tone={k === "published" ? "success" : k === "draft" ? "gold" : "neutral"}>
            {k} · {counts[k]}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, i) => (
          <motion.article
            key={item.id}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            whileHover={reduce ? undefined : { y: -4 }}
            className="group"
          >
            <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-200 group-hover:shadow-lift">
              {/* Art header */}
              <div className="relative h-28 overflow-hidden bg-night">
                <svg viewBox="0 0 300 112" className="h-full w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id={`g-${item.id}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#E5A044" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#E5A044" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <rect width="300" height="112" fill="url(#g-{item.id})" />
                  <path d="M-10 84 C 50 84, 70 40, 130 46 S 240 78, 320 30" fill="none" stroke="#E5A044" strokeWidth="1.5" strokeDasharray="4 5" className="transition-all duration-500 group-hover:[stroke-dashoffset:-18]" />
                  <circle cx="130" cy="46" r="3.5" fill="#E5A044" />
                  <circle cx="30" cy="80" r="3" fill="#FDFCFB" opacity="0.7" />
                </svg>
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <Badge tone={CATEGORY_TONE[item.category]} className="bg-ink/60 capitalize backdrop-blur">{item.category}</Badge>
                  <Badge tone={item.status === "published" ? "success" : item.status === "draft" ? "gold" : "neutral"} className="bg-ink/60 backdrop-blur">
                    {item.status === "published" ? <Globe className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {item.status}
                  </Badge>
                </div>
                <span className="absolute bottom-2 right-3 font-display text-2xl font-semibold text-white/25 transition-colors duration-300 group-hover:text-gold-light/70">
                  {formatINR(item.startingPrice, true)}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2.5 p-4">
                <div>
                  <h3 className="font-display text-[17px] font-medium leading-snug tracking-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">{item.summary}</p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-1.5">
                  <span className="flex items-center gap-1 font-mono text-[11px] text-ink-faint">
                    <MapPin className="h-3 w-3 text-gold" />
                    {item.places.join(" · ")}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-hairline pt-3">
                  <div className="text-[12px] text-ink-soft">
                    <span className="font-mono text-[11px] text-ink-faint">from </span>
                    <span className="font-display text-[15px] font-semibold text-ink">{formatINR(item.startingPrice)}</span>
                    <span className="ml-2 font-mono text-[11px] text-ink-faint">{item.duration}</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                    upd {formatDate(item.updatedAt)}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  {canEdit && item.status !== "archived" && (
                    <Button variant="secondary" size="sm" className="flex-1">
                      <PenSquare className="h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                  {canPublish && item.status === "draft" && (
                    <Button variant="gold" size="sm" className="flex-1" onClick={() => setStatus(item.id, "published")}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Publish
                    </Button>
                  )}
                  {canPublish && item.status === "published" && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setStatus(item.id, "archived")}>
                      <Archive className="h-3.5 w-3.5" /> Archive
                    </Button>
                  )}
                  {canPublish && item.status === "archived" && (
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setStatus(item.id, "published")}>
                      <Globe className="h-3.5 w-3.5" /> Restore
                    </Button>
                  )}
                  {!canEdit && (
                    <span className={cn("w-full text-center font-mono text-[10px] uppercase tracking-wide text-ink-faint")}>
                      publish requires super_admin
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
