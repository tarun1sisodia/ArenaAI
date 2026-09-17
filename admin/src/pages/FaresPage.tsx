import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Compass, Edit3, Moon, RotateCw, ShieldCheck, Timer, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import { fetchAdminFareRules, updateAdminFareRules } from "@/lib/api";
import { can, type AdminUser, type FareRuleset } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export function FaresPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const canRead = can(user.role, "fares:read");
  const canEdit = user.role === "super_admin" || user.role === "operator" || user.role === "finance_operator";

  const [rs, setRs] = useState<FareRuleset | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Edit Fare Rules Dialog State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    minKmPerDay: 300,
    nightAllowanceCab: 300,
    nightAllowanceTempo: 500,
    sedan: 10,
    ertiga: 14,
    innova: 18,
    tempo: 25,
    urbania: 34,
  });

  const handleOpenEdit = () => {
    if (!rs) return;
    const sedanRule = rs.rules.find((r) => r.vehicleTier === "sedan");
    const ertigaRule = rs.rules.find((r) => r.vehicleTier === "ertiga");
    const innovaRule = rs.rules.find((r) => r.vehicleTier === "innova-crysta");
    const tempoRule = rs.rules.find((r) => r.vehicleTier === "tempo-traveller" || r.vehicleTier === "tempo-traveller-12");
    const urbaniaRule = rs.rules.find((r) => r.vehicleTier === "urbania");

    setEditForm({
      minKmPerDay: sedanRule?.minDailyKm ?? 300,
      nightAllowanceCab: 300,
      nightAllowanceTempo: 500,
      sedan: sedanRule?.perKm ?? 10,
      ertiga: ertigaRule?.perKm ?? 14,
      innova: innovaRule?.perKm ?? 18,
      tempo: tempoRule?.perKm ?? 25,
      urbania: urbaniaRule?.perKm ?? 34,
    });
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditOpen(true);
  };

  const handleSaveFares = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await updateAdminFareRules({
        outstation: {
          minKmPerDay: Number(editForm.minKmPerDay),
          nightAllowanceCab: Number(editForm.nightAllowanceCab),
          nightAllowanceTempo: Number(editForm.nightAllowanceTempo),
        },
        vehicles: [
          { tier: "sedan", name: "Sedan (Dzire / Etios)", seats: 4, perKm: Number(editForm.sedan) },
          { tier: "ertiga", name: "Maruti Ertiga", seats: 6, perKm: Number(editForm.ertiga) },
          { tier: "innova-crysta", name: "Innova Crysta", seats: 7, perKm: Number(editForm.innova) },
          { tier: "tempo-traveller", name: "Tempo Traveller", seats: 12, perKm: Number(editForm.tempo) },
          { tier: "urbania", name: "Force Urbania Luxury", seats: 15, perKm: Number(editForm.urbania) },
        ],
      });

      setSaveSuccess("Fare rules updated successfully! Synchronized across backend and customer apps.");
      setReloadKey((k) => k + 1);
      setTimeout(() => {
        setIsEditOpen(false);
        setSaveSuccess(null);
      }, 1200);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update fare rules.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);
    fetchAdminFareRules()
      .then((data) => {
        if (isMounted && data) {
          setRs(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setRs(null);
          setLoadError(err instanceof Error ? err.message : "Could not reach the backend fare engine.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  if (!canRead) {
    return (
      <div>
        <PageHeader eyebrow="Access" title="Fare Rules" />
        <Card className="p-10 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 font-display text-lg text-ink">Fare rules are role-gated</p>
          <p className="mt-1 text-sm text-ink-soft">Requires dispatcher, finance_operator or super_admin.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Commercial"
        title="Fare Rules"
        description="Server-authoritative pricing — rates configured here govern all new customer bookings and desk reservations."
        actions={
          <div className="flex items-center gap-2.5">
            {rs ? (
              <Badge tone="gold" className="px-3 py-1.5">
                <Compass className="h-3.5 w-3.5" /> Ruleset {rs.version}
              </Badge>
            ) : undefined}
            {canEdit && (
              <Button variant="gold" size="sm" onClick={handleOpenEdit} disabled={!rs || loading}>
                <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Modify Fares
              </Button>
            )}
          </div>
        }
      />

      {loading && (
        <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
          Loading fare rules from backend…
        </div>
      )}

      {loadError && (
        <div
          className="mb-4 flex items-center justify-between rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{loadError}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {rs && !loading && (
        <>
          {/* Rule chips */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Timer, label: "Minimum daily km", value: "300 km (outstation)", note: "billed at tier minimum" },
              { icon: Moon, label: "Night window", value: rs.nightWindow, note: "tier hourly rate accrues" },
              { icon: Users, label: "Driver allowance", value: "₹300–500 / day", note: "fixed per agreement" },
            ].map((chip, i) => (
              <motion.div
                key={chip.label}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="flex items-center gap-4 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-gold-soft text-gold-text">
                    <chip.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{chip.label}</p>
                    <p className="text-sm font-semibold text-ink">{chip.value}</p>
                    <p className="text-[12px] text-ink-soft">{chip.note}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Per-km rate table</CardTitle>
                <CardDescription>Effective from {rs.effectiveFrom} · version {rs.version}</CardDescription>
              </div>
              <Badge tone="teal"><ShieldCheck className="h-3 w-3" /> Locked by agreement</Badge>
            </CardHeader>
            <Table>
              <THead>
                <TRow>
                  <TH>Vehicle tier</TH>
                  <TH className="text-right">Seats</TH>
                  <TH className="text-right">Per km</TH>
                  <TH className="text-right">Min daily km</TH>
                  <TH className="text-right">Night / hr</TH>
                  <TH className="text-right">Driver / day</TH>
                </TRow>
              </THead>
              <TBody>
                {rs.rules.map((r, i) => (
                  <motion.tr
                    key={r.vehicleTier}
                    initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                    className="transition-colors hover:bg-gold-wash/50"
                  >
                    <TD className="text-[13px] font-medium">{r.label}</TD>
                    <TD className="text-right font-mono text-[13px]">{r.seats}</TD>
                    <TD className="text-right font-display text-[15px] font-semibold text-gold-text">
                      {formatINR(r.perKm)}
                    </TD>
                    <TD className="text-right font-mono text-[13px]">{r.minDailyKm}</TD>
                    <TD className="text-right font-mono text-[13px]">{formatINR(r.nightChargePerHour)}</TD>
                    <TD className="text-right font-mono text-[13px]">{formatINR(r.driverAllowance)}</TD>
                  </motion.tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Rule notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {rs.notes.map((n, i) => (
                  <motion.li
                    key={i}
                    initial={reduce ? { opacity: 1 } : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.35 }}
                    className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft"
                  >
                    <span className="font-mono text-[11px] text-gold-text">{String(i + 1).padStart(2, "0")}</span>
                    {n}
                  </motion.li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modify Fare Rules Modal */}
      <Dialog
        open={isEditOpen}
        onClose={() => !saving && setIsEditOpen(false)}
        title="Modify Authoritative Fare Rules"
        description="Update server-authoritative rates. Changes take effect immediately for all subsequent customer bookings and manual dispatches while preserving past booking snapshots."
      >
        <form onSubmit={handleSaveFares} className="space-y-4">
          {saveError && (
            <div className="flex items-center gap-2 rounded-md bg-error-soft px-3 py-2 text-xs text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-teal-soft px-3 py-2 text-xs text-teal-text">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <div className="rounded-lg border border-gold/20 bg-gold-wash/30 p-3 text-xs text-ink-soft">
            <span className="font-semibold text-ink">Zero Client Trust Enforcement:</span> Rates updated here are strictly validated on the backend and saved with a versioned audit trail.
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Min Daily Km (Outstation)</label>
              <Input
                type="number"
                min="100"
                max="1000"
                required
                value={editForm.minKmPerDay}
                onChange={(e) => setEditForm((f) => ({ ...f, minKmPerDay: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Cab Driver/Night (₹)</label>
              <Input
                type="number"
                min="100"
                max="2000"
                required
                value={editForm.nightAllowanceCab}
                onChange={(e) => setEditForm((f) => ({ ...f, nightAllowanceCab: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Tempo Driver/Night (₹)</label>
              <Input
                type="number"
                min="200"
                max="3000"
                required
                value={editForm.nightAllowanceTempo}
                onChange={(e) => setEditForm((f) => ({ ...f, nightAllowanceTempo: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="border-t border-rule pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Per-Kilometer Base Rates (₹/km)
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-ink">Sedan (Dzire / Etios · 4 Seats)</label>
                <Input
                  type="number"
                  min="5"
                  max="100"
                  required
                  value={editForm.sedan}
                  onChange={(e) => setEditForm((f) => ({ ...f, sedan: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink">Maruti Ertiga (6 Seats)</label>
                <Input
                  type="number"
                  min="8"
                  max="150"
                  required
                  value={editForm.ertiga}
                  onChange={(e) => setEditForm((f) => ({ ...f, ertiga: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink">Innova Crysta (7 Seats)</label>
                <Input
                  type="number"
                  min="10"
                  max="200"
                  required
                  value={editForm.innova}
                  onChange={(e) => setEditForm((f) => ({ ...f, innova: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink">Tempo Traveller (12 Seats)</label>
                <Input
                  type="number"
                  min="15"
                  max="300"
                  required
                  value={editForm.tempo}
                  onChange={(e) => setEditForm((f) => ({ ...f, tempo: Number(e.target.value) }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-ink">Force Urbania Luxury (15 Seats)</label>
                <Input
                  type="number"
                  min="20"
                  max="400"
                  required
                  value={editForm.urbania}
                  onChange={(e) => setEditForm((f) => ({ ...f, urbania: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-rule pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={saving}>
              {saving ? "Saving…" : "Save New Rates"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
