import { CalendarDays, CheckCircle2, IndianRupee, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { AreaChart, DonutChart, RankedBars, VerticalBars } from "@/components/charts/Charts";
import { StatCard } from "@/components/admin/StatCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";
import { AUDIT, BOOKINGS, REVENUE_SERIES, TOP_ROUTES } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  paid_confirmed: "var(--teal)",
  in_transit: "var(--ink-soft)",
  completed: "var(--success)",
  pending_payment: "var(--gold)",
  draft: "var(--text-faint)",
  cancelled: "var(--coral)",
  refunded: "var(--gold-deep)",
};

const STATUS_LABELS: Record<string, string> = {
  paid_confirmed: "Paid · confirmed",
  in_transit: "In transit",
  completed: "Completed",
  pending_payment: "Pending payment",
  draft: "Draft",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function DashboardPage() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const statusCounts = BOOKINGS.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  const tierCounts = BOOKINGS.reduce<Record<string, number>>((acc, b) => {
    acc[b.vehicleTier] = (acc[b.vehicleTier] ?? 0) + 1;
    return acc;
  }, {});

  const tierLabels: Record<string, string> = {
    sedan: "Sedan",
    ertiga: "Ertiga",
    "innova-crysta": "Innova",
    "tempo-traveller-12": "T.12",
    "tempo-traveller-17": "T.17",
    "coastal-coach-25": "C.25",
  };

  const recent = [...AUDIT].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  return (
    <div>
      <PageHeader
        eyebrow="Live board"
        title="Operations Overview"
        description="September 2026 · Agra desk · figures sync from the Fastify ops API"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate("/bookings")}>
              Open bookings
            </Button>
            <Button variant="gold" size="sm" onClick={() => navigate("/catalog")}>
              Manage catalog
            </Button>
          </>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Revenue · MTD"
          value={121000}
          format="inr"
          icon={IndianRupee}
          delta={8.4}
          deltaLabel="vs Aug"
          spark={[182, 205, 248, 231, 259, 312, 287, 334, 296, 308, 342, 121]}
        />
        <StatCard
          index={1}
          label="Bookings · MTD"
          value={43}
          format="number"
          icon={CalendarDays}
          delta={12.1}
          deltaLabel="vs Aug"
          spark={[61, 68, 82, 74, 86, 101, 92, 109, 97, 100, 112, 43]}
        />
        <StatCard
          index={2}
          label="Trips in transit"
          value={2}
          format="number"
          icon={CheckCircle2}
          delta={-33.3}
          deltaLabel="vs yesterday"
          spark={[4, 3, 5, 2, 3, 6, 4, 5, 3, 4, 3, 2]}
        />
        <StatCard
          index={3}
          label="Reviews pending"
          value={3}
          format="number"
          icon={Star}
          delta={50}
          deltaLabel="vs last week"
          spark={[1, 2, 1, 3, 2, 2, 4, 3, 2, 2, 4, 3]}
        />
      </div>

      {/* Revenue + status mix */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>Revenue — trailing 12 months</CardTitle>
              <CardDescription>Captured gateway amounts, ₹ (lakh)</CardDescription>
            </div>
            <Badge tone="gold">Sep '26 in progress</Badge>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={REVENUE_SERIES.map((p) => ({
                label: p.month,
                value: p.revenue,
                sub: `${p.bookings} bookings`,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking status mix</CardTitle>
            <CardDescription>Current 12 active records</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              centerLabel="Bookings"
              centerValue={String(BOOKINGS.length)}
              slices={Object.entries(statusCounts).map(([status, value]) => ({
                label: STATUS_LABELS[status] ?? status,
                value,
                color: STATUS_COLORS[status] ?? "var(--text-faint)",
              }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Vehicle tiers + top routes */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Trips by vehicle tier</CardTitle>
            <CardDescription>Current records</CardDescription>
          </CardHeader>
          <CardContent>
            <VerticalBars
              items={Object.entries(tierLabels).map(([key, label]) => ({
                label,
                value: tierCounts[key] ?? 0,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top routes — 12 mo</CardTitle>
            <CardDescription>Revenue share from Agra departures</CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBars
              items={TOP_ROUTES.map((r) => ({
                label: `${r.from} → ${r.to}`,
                value: r.revenue,
                sub: `${r.trips} trips`,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Latest desk activity</CardTitle>
              <CardDescription>Immutable audit trail</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/audit")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <ol className="space-y-0">
              {recent.map((entry, i) => (
                <motion.li
                  key={entry.id}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex gap-3 pb-4 last:pb-0"
                >
                  {i < recent.length - 1 && (
                    <span className="absolute left-[5px] top-4 h-full w-px bg-hairline" aria-hidden="true" />
                  )}
                  <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-gold bg-surface" />
                  <div className="min-w-0">
                    <p className="text-[13px] leading-snug text-ink">
                      <span className="font-semibold">{entry.actor}</span>{" "}
                      <span className="text-ink-soft">{entry.detail}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                      {entry.resourceId} · {timeAgo(entry.at)}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
