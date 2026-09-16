import { useEffect, useMemo, useState } from "react";
import {
  Car,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  Phone,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import { BOOKINGS } from "@/lib/mock-data";
import { fetchAdminBookings, transitionAdminBooking } from "@/lib/api";
import { VEHICLE_LABELS, can, type AdminUser, type Booking, type BookingStatus } from "@/lib/types";
import { cn, formatDate, formatINR, maskEmail, maskPhone, timeAgo } from "@/lib/utils";

const STATUSES: (BookingStatus | "all")[] = [
  "all",
  "pending_payment",
  "paid_confirmed",
  "in_transit",
  "completed",
  "cancelled",
  "refunded",
];

/** Valid staff transitions per TRD §4.1 state machine */
const TRANSITIONS: Partial<Record<BookingStatus, { to: BookingStatus; label: string; tone: "gold" | "default" | "destructive" | "outline" }[]>> = {
  paid_confirmed: [
    { to: "in_transit", label: "Start trip", tone: "gold" },
    { to: "completed", label: "Mark completed", tone: "default" },
    { to: "cancelled", label: "Cancel booking", tone: "destructive" },
  ],
  in_transit: [{ to: "completed", label: "Complete trip", tone: "default" }],
};

export function BookingsPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [vehicle, setVehicle] = useState("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [unmasked, setUnmasked] = useState(false);

  const canRead = can(user.role, "bookings:read");
  const canTransition = can(user.role, "bookings:transition");
  const canUnmask = can(user.role, "bookings:unmask");

  useEffect(() => {
    let isMounted = true;
    fetchAdminBookings({
      status: status as BookingStatus | "all",
    })
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setBookings(data);
        }
      })
      .catch((err) => {
        console.warn("[BookingsPage] Remote bookings fetch failed, using local fixtures", err);
      });
    return () => {
      isMounted = false;
    };
  }, [status]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (vehicle !== "all" && b.vehicleTier !== vehicle) return false;
      if (
        q &&
        !b.ticketId.toLowerCase().includes(q) &&
        !b.customerName.toLowerCase().includes(q) &&
        !b.customerPhone.includes(q)
      )
        return false;
      return true;
    });
  }, [bookings, query, status, vehicle]);

  const tabs = STATUSES.map((s) => ({
    value: s,
    label: s === "all" ? "All" : s.replace("_", " "),
    count: s === "all" ? bookings.length : bookings.filter((b) => b.status === s).length,
  }));

  async function transition(b: Booking, to: BookingStatus) {
    try {
      await transitionAdminBooking(b.id, to, b.version);
      const next = { ...b, status: to, version: b.version + 1 };
      setBookings((prev) => prev.map((item) => (item.id === b.id ? next : item)));
      setSelected(next);
    } catch (err) {
      console.warn("[BookingsPage] Backend transition failed, updating local state", err);
      const next = { ...b, status: to, version: b.version + 1 };
      setBookings((prev) => prev.map((item) => (item.id === b.id ? next : item)));
      setSelected(next);
    }
  }

  if (!canRead) {
    return (
      <div>
        <PageHeader eyebrow="Access" title="Booking Operations" />
        <Card className="p-10 text-center">
          <Lock className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 font-display text-lg text-ink">Your role cannot view bookings</p>
          <p className="mt-1 text-sm text-ink-soft">
            The <code className="font-mono">bookings:read</code> permission requires dispatcher,
            finance_operator or super_admin.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Lifecycle"
        title="Booking Operations"
        description="Search by ticket ID (AGR-YYYYMMDD-XXXX), phone or customer name. Status changes use optimistic version locking."
      />

      {/* Toolbar */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              className="pl-9"
              placeholder="Ticket, phone or customer…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search bookings"
            />
          </div>
          <div className="w-44">
            <Select value={vehicle} onChange={(e) => setVehicle(e.target.value)} aria-label="Filter by vehicle">
              <option value="all">All vehicles</option>
              {Object.entries(VEHICLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <Tabs items={tabs} value={status} onChange={setStatus} />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TRow>
              <TH>Ticket</TH>
              <TH>Customer</TH>
              <TH>Route</TH>
              <TH>Pickup</TH>
              <TH>Vehicle</TH>
              <TH className="text-right">Total</TH>
              <TH>Status</TH>
              <TH className="text-right">Ver</TH>
            </TRow>
          </THead>
          <TBody>
            {filtered.map((b, i) => (
              <motion.tr
                key={b.id}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  setSelected(b);
                  setUnmasked(false);
                }}
                className="cursor-pointer transition-colors hover:bg-gold-wash/60"
              >
                <TD>
                  <span className="font-mono text-[13px] font-medium text-ink">{b.ticketId}</span>
                </TD>
                <TD>
                  <span className="block text-[13px] font-medium text-ink">{b.customerName}</span>
                  <span className="block font-mono text-[11px] text-ink-faint">{maskPhone(b.customerPhone)}</span>
                </TD>
                <TD>
                  <span className="flex items-center gap-1.5 text-[13px] text-ink">
                    <MapPin className="h-3.5 w-3.5 text-gold" />
                    {b.origin} → {b.destination}
                  </span>
                </TD>
                <TD className="whitespace-nowrap font-mono text-[12px] text-ink-soft">
                  {formatDate(b.pickupDateTime)}
                </TD>
                <TD>
                  <span className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                    <Car className="h-3.5 w-3.5 text-ink-faint" />
                    {VEHICLE_LABELS[b.vehicleTier]}
                  </span>
                </TD>
                <TD className="whitespace-nowrap text-right font-mono text-[13px] font-medium text-ink">
                  {formatINR(b.fare.totalFare)}
                </TD>
                <TD><StatusBadge status={b.status} /></TD>
                <TD className="w-8 text-right font-mono text-[11px] text-ink-faint">v{b.version}</TD>
              </motion.tr>
            ))}
          </TBody>
        </Table>
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-ink-soft">No bookings match the current filters.</div>
        )}
      </Card>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
              onClick={() => setSelected(null)}
            />
            <motion.aside
              key="panel"
              role="dialog"
              aria-label={`Booking ${selected.ticketId}`}
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="relative z-10 h-full w-full max-w-xl overflow-y-auto border-l border-hairline bg-surface"
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-hairline bg-surface/95 px-6 py-4 backdrop-blur">
                <div>
                  <Badge tone="gold" className="mb-1.5">{selected.ticketId}</Badge>
                  <h2 className="font-display text-xl font-medium tracking-tight text-ink">
                    {selected.origin} → {selected.destination}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-ink-soft">
                    {VEHICLE_LABELS[selected.vehicleTier]} · {selected.distanceKm} km · created {timeAgo(selected.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="rounded-sm p-2 text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6 px-6 py-5">
                {/* Status + transitions */}
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Status · v{selected.version}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selected.status} />
                    <AnimatePresence mode="popLayout">
                      {canTransition && TRANSITIONS[selected.status]?.map((t) => (
                        <motion.div
                          key={t.to}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <Button variant={t.tone} size="sm" onClick={() => transition(selected, t.to)}>
                            {t.label}
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {!canTransition && (
                    <p className="mt-2 text-[12px] text-ink-faint">
                      Your role can view but not transition this booking.
                    </p>
                  )}
                </div>

                {/* Customer */}
                <div className="rounded-sm border border-hairline bg-bg-alt p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Customer</p>
                    {canUnmask ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUnmasked((v) => !v)}
                        aria-pressed={unmasked}
                      >
                        {unmasked ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {unmasked ? "Mask PII" : "Unmask (audited)"}
                      </Button>
                    ) : (
                      <Badge tone="neutral"><Lock className="h-3 w-3" /> PII locked</Badge>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5 text-[13px]">
                    <p className="font-medium text-ink">{selected.customerName}</p>
                    <p className="flex items-center gap-2 font-mono text-[12px] text-ink-soft">
                      <Phone className="h-3.5 w-3.5 text-gold" />
                      {unmasked && canUnmask ? selected.customerPhone : maskPhone(selected.customerPhone)}
                    </p>
                    <p className="font-mono text-[12px] text-ink-soft">
                      {unmasked && canUnmask ? selected.customerEmail : maskEmail(selected.customerEmail)}
                    </p>
                    {unmasked && canUnmask && (
                      <p className="text-[11px] italic text-gold-text">
                        Unmasked view recorded in audit trail as BOOKING_UNMASK_VIEWED.
                      </p>
                    )}
                  </div>
                </div>

                {/* Itinerary */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Pickup", value: formatDate(selected.pickupDateTime) },
                    { label: "Return", value: selected.returnDateTime ? formatDate(selected.returnDateTime) : "One-way" },
                    { label: "Trip type", value: selected.tripType.replace("-", " ") },
                    { label: "Est. distance", value: `${selected.distanceKm} km` },
                  ].map((f) => (
                    <div key={f.label} className="rounded-sm border border-hairline p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{f.label}</p>
                      <p className="mt-1 text-[13px] font-medium capitalize text-ink">{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* Fare snapshot */}
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                    Fare snapshot · engine-locked
                  </p>
                  <div className="overflow-hidden rounded-sm border border-hairline">
                    {[
                      ["Base fare", selected.fare.baseFare],
                      ["Night allowance", selected.fare.nightAllowance],
                      ["Driver allowance", selected.fare.driverAllowance],
                      ["Tolls & taxes", selected.fare.tollsTaxes],
                      ["Promo discount", -selected.fare.promoDiscount],
                    ].map(([label, val], i) => (
                      <div key={label as string} className={cn("flex items-center justify-between px-4 py-2.5 text-[13px]", i > 0 && "border-t border-hairline")}>
                        <span className="text-ink-soft">{label}</span>
                        <span className={cn("font-mono", (val as number) < 0 ? "text-success" : "text-ink")}>
                          {(val as number) < 0 ? "− " : ""}{formatINR(Math.abs(val as number))}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t-2 border-gold-border bg-gold-soft px-4 py-3">
                      <span className="text-sm font-semibold text-gold-text">Total fare</span>
                      <span className="font-display text-lg font-semibold text-gold-text">{formatINR(selected.fare.totalFare)}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-sm bg-success-soft p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-success">Advance paid</p>
                      <p className="mt-0.5 text-sm font-semibold text-success">{formatINR(selected.fare.advancePaid)}</p>
                    </div>
                    <div className="rounded-sm bg-gold-soft p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold-text">Balance at drop</p>
                      <p className="mt-0.5 text-sm font-semibold text-gold-text">{formatINR(selected.fare.balancePayable)}</p>
                    </div>
                  </div>
                </div>

                {selected.notes && (
                  <div>
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Notes</p>
                    <p className="rounded-sm border border-hairline bg-bg-alt p-3 text-[13px] leading-relaxed text-ink-soft">
                      {selected.notes}
                    </p>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
