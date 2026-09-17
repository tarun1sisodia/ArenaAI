import { useEffect, useState } from "react";
import { AlertTriangle, Compass, Moon, RotateCw, ShieldCheck, Timer, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import { fetchAdminFareRules } from "@/lib/api";
import { can, type AdminUser, type FareRuleset } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export function FaresPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const canRead = can(user.role, "fares:read");
  const [rs, setRs] = useState<FareRuleset | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
        description="Server-authoritative pricing — read-only inspection. The backend fare engine is the single source of truth; admins cannot override fares."
        actions={
          rs ? (
            <Badge tone="gold" className="px-3 py-1.5">
              <Compass className="h-3.5 w-3.5" /> Ruleset {rs.version}
            </Badge>
          ) : undefined
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
    </div>
  );
}
