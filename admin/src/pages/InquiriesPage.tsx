import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Building2, MessageSquare, Phone, Plane, Send, Users, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { fetchAdminInquiries, updateAdminInquiry } from "@/lib/api";
import { can, type AdminUser, type Inquiry, type InquiryStatus, type InquiryType } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const FLOW: InquiryStatus[] = ["new", "contacted", "quoted", "converted", "closed"];

const TYPE_META: Record<InquiryType, { label: string; icon: typeof Plane; tone: "gold" | "teal" | "neutral" }> = {
  custom_tour: { label: "Custom tour", icon: Plane, tone: "gold" },
  group_charter: { label: "Group charter", icon: Users, tone: "teal" },
  contact: { label: "Contact", icon: MessageSquare, tone: "neutral" },
  local_tour: { label: "Local tour", icon: Building2, tone: "teal" },
  outstation: { label: "Outstation", icon: ArrowRight, tone: "gold" },
};

const UNKNOWN_TYPE_META = { label: "Not specified", icon: MessageSquare, tone: "neutral" as const };

export function InquiriesPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [note, setNote] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const canManage = can(user.role, "inquiries:manage");

  useEffect(() => {
    let isMounted = true;
    setLoadError(null);
    fetchAdminInquiries()
      .then((data) => {
        if (isMounted) {
          setItems(data);
          setSelectedId((current) =>
            current && data.some((item) => item.id === current) ? current : (data[0]?.id ?? ""),
          );
        }
      })
      .catch((err) => {
        if (isMounted) {
          setItems([]);
          setLoadError(err instanceof Error ? err.message : "Could not load inquiries from the backend.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const selected = items.find((i) => i.id === selectedId);

  async function advance(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const idx = FLOW.indexOf(item.status);
    const next = FLOW[Math.min(FLOW.length - 1, idx + 1)];
    setActionError(null);
    try {
      await updateAdminInquiry(id, { status: next });
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id) return i;
          return { ...i, status: next };
        })
      );
    } catch (err) {
      setActionError(`Could not update this inquiry: ${err instanceof Error ? err.message : "backend error"}`);
    }
  }

  async function addNote(id: string) {
    const text = note.trim();
    if (!text) return;
    setActionError(null);
    try {
      await updateAdminInquiry(id, { note: text });
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, notes: [...i.notes, text] } : i))
      );
      setNote("");
    } catch (err) {
      setActionError(`Could not save the note: ${err instanceof Error ? err.message : "backend error"}`);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Leads"
        title="Inquiries & Leads"
        description="Unified inbox for custom tours, group charters and contact forms — track each lead through the desk workflow."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
        {/* List */}
        <div className="space-y-2">
          {loadError && (
            <div
              className="flex items-start gap-2.5 rounded-md border border-error/20 bg-error-soft px-3.5 py-3 text-[13px] text-error"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-snug">{loadError}</span>
            </div>
          )}
          {actionError && (
            <div
              className="flex items-start gap-2.5 rounded-md border border-error/20 bg-error-soft px-3.5 py-3 text-[13px] text-error"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1 leading-snug">{actionError}</span>
              <button onClick={() => setActionError(null)} className="rounded-sm p-0.5 hover:bg-error/10" aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {!loadError && items.length === 0 && (
            <Card className="p-8 text-center">
              <MessageSquare className="mx-auto h-7 w-7 text-ink-faint" />
              <p className="mt-3 font-display text-base text-ink">No inquiries yet</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                Contact form and tour interest submissions from the customer site land here.
              </p>
            </Card>
          )}
          {items.map((item, i) => {
            const typeMeta = item.type ? TYPE_META[item.type] ?? UNKNOWN_TYPE_META : UNKNOWN_TYPE_META;
            const TypeIcon = typeMeta.icon;
            return (
              <motion.button
                key={item.id}
                initial={reduce ? { opacity: 1 } : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "block w-full rounded-md border p-3.5 text-left transition-all duration-200",
                  selectedId === item.id
                    ? "border-gold-border bg-gold-wash shadow-card"
                    : "border-hairline bg-surface hover:border-gold-border hover:bg-surface-2"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                    <TypeIcon className="h-3.5 w-3.5 text-gold" />
                    {item.name}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 line-clamp-1 text-[12.5px] text-ink-soft">{item.subject || "Subject not provided"}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                  {typeMeta.label} · {timeAgo(item.createdAt)}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Detail */}
        <AnimatePresence mode="wait">
          {!selected && items.length > 0 && (
            <Card key="placeholder" className="flex items-center justify-center p-10">
              <p className="text-sm text-ink-faint">Select an inquiry from the list to view its details.</p>
            </Card>
          )}
          {selected && (
            <motion.div
              key={selected.id}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-medium tracking-tight text-ink">{selected.subject || "Subject not provided"}</h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] text-ink-soft">
                      <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-gold" />{selected.name}</span>
                      <span className="flex items-center gap-1.5 font-mono text-[12px]"><Phone className="h-3.5 w-3.5 text-gold" />{selected.phone}</span>
                      <Badge tone={selected.type ? TYPE_META[selected.type]?.tone ?? "neutral" : "neutral"}>{selected.type ? TYPE_META[selected.type]?.label ?? "Not specified" : "Not specified"}</Badge>
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <p className="mt-4 rounded-sm border border-hairline bg-bg-alt p-4 text-[13.5px] leading-relaxed text-ink-soft">
                  {selected.message}
                </p>

                {/* Workflow */}
                <div className="mt-5">
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Workflow</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {FLOW.map((s, i) => {
                      const currentIdx = FLOW.indexOf(selected.status);
                      const done = i < currentIdx;
                      const current = i === currentIdx;
                      return (
                        <span key={s} className="flex items-center gap-1.5">
                          {i > 0 && <ArrowRight className="h-3 w-3 text-ink-faint" />}
                          <span
                            className={cn(
                              "rounded-pill border px-2.5 py-1 font-mono text-[11px] capitalize transition-colors",
                              done && "border-transparent bg-success-soft text-success",
                              current && "border-gold bg-gold-soft text-gold-text",
                              !done && !current && "border-hairline text-ink-faint"
                            )}
                          >
                            {s}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                  {canManage && selected.status !== "closed" && (
                    <div className="mt-3">
                      <Button variant="gold" size="sm" onClick={() => advance(selected.id)}>
                        Move to {FLOW[Math.min(FLOW.length - 1, FLOW.indexOf(selected.status) + 1)]} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mt-5">
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">Operator notes</p>
                  <ul className="space-y-2">
                    {selected.notes.map((n, i) => (
                      <motion.li
                        key={i}
                        initial={reduce ? { opacity: 1 } : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-sm bg-surface-2 px-3 py-2 text-[13px] text-ink-soft"
                      >
                        {n}
                      </motion.li>
                    ))}
                    {selected.notes.length === 0 && (
                      <li className="text-[12px] italic text-ink-faint">No notes yet.</li>
                    )}
                  </ul>
                  {canManage && (
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder="Add a call summary or agreed price…"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addNote(selected.id)}
                        className="h-9 text-[13px]"
                      />
                      <Button size="sm" variant="secondary" onClick={() => addNote(selected.id)} aria-label="Add note">
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
