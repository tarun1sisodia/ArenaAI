import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, THead, TD, TH, TRow } from "@/components/ui/Table";
import { fetchAdminAuditLogs } from "@/lib/api";
import { ROLE_LABELS, can, type AdminUser, type AuditAction, type AuditEntry } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

const ACTION_TONES: Record<AuditAction, "gold" | "success" | "error" | "teal" | "ink" | "neutral"> = {
  BOOKING_STATUS_CHANGED: "teal",
  BOOKING_UNMASK_VIEWED: "gold",
  REFUND_REQUESTED: "gold",
  REFUND_EXECUTED: "success",
  CATALOG_DRAFTED: "neutral",
  CATALOG_PUBLISHED: "success",
  CATALOG_ARCHIVED: "neutral",
  REVIEW_APPROVED: "success",
  REVIEW_REJECTED: "error",
  REVIEW_PUBLISHED: "success",
  INQUIRY_UPDATED: "teal",
  LOGIN: "ink",
};

export function AuditPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState<AuditAction | "all">("all");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const canRead = can(user.role, "audit:read");

  useEffect(() => {
    let isMounted = true;
    setLoadError(null);
    fetchAdminAuditLogs()
      .then((data) => {
        if (isMounted) {
          setLogs(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLogs([]);
          setLoadError(err instanceof Error ? err.message : "Could not load audit logs from the backend.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const actions = useMemo(() => {
    const set = new Set<AuditAction>();
    logs.forEach((a) => set.add(a.action));
    return [...set];
  }, [logs]);

  const visible = logs.filter((a) => filter === "all" || a.action === filter).sort(
    (a, b) => b.at.localeCompare(a.at)
  );

  if (!canRead) {
    return (
      <div>
        <PageHeader eyebrow="Security" title="Audit Trail" />
        <Card className="p-10 text-center">
          <Lock className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 font-display text-lg text-ink">Audit logs are super-admin only</p>
          <p className="mt-1 text-sm text-ink-soft">
            The immutable trail of staff mutations and PII reads is restricted to the
            <code className="font-mono"> super_admin</code> role.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Security"
        title="Audit Trail"
        description="Immutable, append-only log of every sensitive action — status changes, refunds, PII unmasking, publishing and logins."
        actions={<Badge tone="gold" className="px-3 py-1.5"><Lock className="h-3.5 w-3.5" /> Append-only · hash-chained</Badge>}
      />

      {loadError && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{loadError}</span>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </Button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-pill border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors",
            filter === "all" ? "border-gold bg-gold-soft text-gold-text" : "border-hairline text-ink-soft hover:border-gold-border"
          )}
        >
          All · {logs.length}
        </button>
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={cn(
              "rounded-pill border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors",
              filter === a ? "border-gold bg-gold-soft text-gold-text" : "border-hairline text-ink-soft hover:border-gold-border"
            )}
          >
            {a}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <THead>
            <TRow>
              <TH>Time</TH>
              <TH>Action</TH>
              <TH>Actor</TH>
              <TH>Resource</TH>
              <TH>Detail</TH>
              <TH>IP</TH>
            </TRow>
          </THead>
          <TBody>
            {visible.map((a, i) => (
              <motion.tr
                key={a.id}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="align-top transition-colors hover:bg-gold-wash/40"
              >
                <TD className="whitespace-nowrap font-mono text-[12px] text-ink-soft">{formatDateTime(a.at)}</TD>
                <TD>
                  <Badge tone={ACTION_TONES[a.action]}>{a.action}</Badge>
                </TD>
                <TD>
                  <span className="block text-[13px] font-medium text-ink">{a.actor}</span>
                  <span className="block font-mono text-[11px] text-ink-faint">{ROLE_LABELS[a.actorRole]}</span>
                </TD>
                <TD className="font-mono text-[12px] text-ink-soft">
                  <span className="text-ink-faint">{a.resourceType}:</span> {a.resourceId}
                </TD>
                <TD className="max-w-md text-[13px] leading-snug text-ink-soft">{a.detail}</TD>
                <TD className="whitespace-nowrap font-mono text-[12px] text-ink-faint">{a.ip}</TD>
              </motion.tr>
            ))}
          </TBody>
        </Table>
        {visible.length === 0 && !loadError && (
          <div className="p-12 text-center">
            <p className="font-display text-lg text-ink">No audit entries yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
              Every sensitive action — status changes, refunds, PII unmasking — is recorded here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
