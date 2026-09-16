import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, CheckCircle2, Globe, Star, ThumbsDown, XCircle, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { actOnReview, fetchAdminCatalog, fetchAdminReviews } from "@/lib/api";
import { can, type AdminUser, type Review, type ReviewStatus } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={i <= n ? "h-3.5 w-3.5 fill-gold text-gold" : "h-3.5 w-3.5 text-hairline-strong"}
        />
      ))}
    </span>
  );
}

export function ReviewsPage({ user }: { user: AdminUser }) {
  const reduce = useReducedMotion();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending_review");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const canModerate = can(user.role, "reviews:moderate");
  const canPublish = can(user.role, "reviews:publish");

  useEffect(() => {
    let isMounted = true;
    setLoadError(null);
    // Catalog items are fetched as well to resolve review → tour title.
    fetchAdminCatalog()
      .then((catalog) => fetchAdminReviews(catalog.map((c) => ({ id: c.id, title: c.title }))))
      .then((data) => {
        if (isMounted) setReviews(data);
      })
      .catch((err) => {
        if (isMounted) {
          setReviews([]);
          setLoadError(err instanceof Error ? err.message : "Could not load reviews from the backend.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const visible = reviews.filter((r) => filter === "all" || r.status === filter);
  const pending = reviews.filter((r) => r.status === "pending_review").length;

  async function act(id: string, status: Extract<ReviewStatus, "approved" | "rejected" | "published" | "archived">) {
    const actionMap = { approved: "approve", rejected: "reject", published: "publish", archived: "archive" } as const;
    setActionError(null);
    setBusyId(id);
    try {
      const result = await actOnReview(id, actionMap[status]);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: result.status } : r)));
    } catch (err) {
      setActionError(`Could not update the review: ${err instanceof Error ? err.message : "backend error"}`);
    } finally {
      setBusyId(null);
    }
  }

  const tabs = [
    { value: "pending_review", label: "Queue", count: pending },
    { value: "approved", label: "Approved", count: reviews.filter((r) => r.status === "approved").length },
    { value: "published", label: "Published", count: reviews.filter((r) => r.status === "published").length },
    { value: "rejected", label: "Rejected", count: reviews.filter((r) => r.status === "rejected").length },
    { value: "all", label: "All", count: reviews.length },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Social proof"
        title="Review Moderation"
        description="Cross-reference every review with a completed ticket before publishing to the public site."
        actions={
          <div className="flex rounded-sm border border-hairline bg-surface-2 p-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setFilter(t.value as ReviewStatus | "all")}
                className={`rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  filter === t.value ? "bg-surface text-ink shadow-card" : "text-ink-soft hover:text-ink"
                }`}
              >
                {t.label} <span className="font-mono text-[11px] text-ink-faint">{t.count}</span>
              </button>
            ))}
          </div>
        }
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
      {actionError && (
        <div
          className="mb-4 flex items-start gap-2.5 rounded-md border border-error/20 bg-error-soft px-4 py-3 text-[13px] text-error"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1 leading-snug">{actionError}</span>
          <button onClick={() => setActionError(null)} className="rounded-sm p-0.5 hover:bg-error/10" aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visible.map((review, i) => (
            <motion.article
              key={review.id}
              layout
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="h-full p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-night font-display text-sm font-semibold text-gold">
                      {review.customerName.slice(0, 1)}
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                        {review.customerName}
                        {review.verifiedBooking && (
                          <span title="Verified against a completed booking">
                            <BadgeCheck className="h-4 w-4 text-teal" />
                          </span>
                        )}
                      </p>
                      <p className="font-mono text-[11px] text-ink-faint">
                        {review.ticketId} · {review.route}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={review.status} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Stars n={review.rating} />
                  <span className="font-mono text-[11px] text-ink-faint">{timeAgo(review.submittedAt)}</span>
                </div>

                <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">{review.text}</p>

                {!review.verifiedBooking && (
                  <p className="mt-3 rounded-sm bg-error-soft px-3 py-2 text-[12px] leading-snug text-error">
                    ⚠ No completed booking matches this ticket ID — possible spam.
                  </p>
                )}

                {canModerate && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4">
                    {review.status === "pending_review" && (
                      <>
                        <Button variant="gold" size="sm" disabled={busyId === review.id} onClick={() => act(review.id, "approved")}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" disabled={busyId === review.id} onClick={() => act(review.id, "rejected")}>
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}
                    {review.status === "approved" && (
                      <Button variant="gold" size="sm" disabled={!canPublish || busyId === review.id} title={canPublish ? undefined : "publish requires super_admin"} onClick={() => act(review.id, "published")}>
                        <Globe className="h-3.5 w-3.5" /> Publish to website
                      </Button>
                    )}
                    {(review.status === "rejected" || review.status === "approved") && (
                      <Button variant="ghost" size="sm" disabled={busyId === review.id} onClick={() => act(review.id, "archived")}>
                        <ThumbsDown className="h-3.5 w-3.5" /> Archive
                      </Button>
                    )}
                    {review.status === "published" && (
                      <Badge tone="success" className="px-3 py-1">Live on public route pages</Badge>
                    )}
                    {!canModerate && (
                      <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                        moderation requires super_admin
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {visible.length === 0 && !loadError && (
        <Card className="p-10 text-center">
          <p className="text-sm text-ink-soft">
            {reviews.length === 0
              ? "No reviews yet — customer-submitted reviews from the website appear here for moderation."
              : "Nothing in this bucket — the queue is clear."}
          </p>
        </Card>
      )}
    </div>
  );
}
