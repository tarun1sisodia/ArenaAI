import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Archive, CheckCircle2, Clock, Globe, MapPin, PenSquare, Plus, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Select } from "@/components/ui/Input";
import { createAdminCatalogItem, fetchAdminCatalog, setCatalogItemStatus, updateAdminCatalogItem } from "@/lib/api";
import { can, type AdminUser, type CatalogItem, type CatalogCategory, type CatalogStatus } from "@/lib/types";
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
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Dialog state for New / Edit Item
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<CatalogCategory>("package");
  const [formSummary, setFormSummary] = useState("");
  const [formDuration, setFormDuration] = useState("8 hrs / 80 km");
  const [formPrice, setFormPrice] = useState<number>(1900);
  const [formPlaces, setFormPlaces] = useState("Taj Mahal, Agra Fort");
  const [formStatus, setFormStatus] = useState<CatalogStatus>("draft");

  const canEdit = can(user.role, "catalog:edit");
  const canPublish = can(user.role, "catalog:publish");

  useEffect(() => {
    let isMounted = true;
    setLoadError(null);
    fetchAdminCatalog()
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch((err) => {
        if (isMounted) {
          setItems([]);
          setLoadError(err instanceof Error ? err.message : "Could not load catalog items from the backend.");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  function openCreate() {
    setEditingItem(null);
    setFormTitle("");
    setFormSlug("");
    setFormCategory("package");
    setFormSummary("");
    setFormDuration("8 hrs / 80 km");
    setFormPrice(1900);
    setFormPlaces("Taj Mahal, Agra Fort");
    setFormStatus("draft");
    setFormError(null);
    setIsDialogOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormSlug(item.slug);
    setFormCategory(item.category);
    setFormSummary(item.summary);
    setFormDuration(item.duration);
    setFormPrice(item.startingPrice);
    setFormPlaces(item.places.join(", "));
    setFormStatus(item.status);
    setFormError(null);
    setIsDialogOpen(true);
  }

  async function handleSaveItem(e: FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return setFormError("Title is required.");
    const slug = formSlug.trim() || formTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (slug.length < 2) return setFormError("Valid slug is required.");
    if (formPrice <= 0) return setFormError("Starting price must be greater than zero.");

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingItem) {
        const updated = await updateAdminCatalogItem(editingItem.id, {
          title: formTitle.trim(),
          slug,
          type: formCategory,
          shortDescription: formSummary.trim() || formTitle.trim(),
          durationText: formDuration.trim(),
          startingPriceInr: Number(formPrice),
          routeSummary: formPlaces.trim(),
          status: formStatus,
        });
        setItems((prev) => prev.map((it) => (it.id === editingItem.id ? { ...it, ...updated, title: formTitle.trim(), summary: formSummary.trim(), duration: formDuration.trim(), startingPrice: Number(formPrice), places: formPlaces.split(",").map((s) => s.trim()).filter(Boolean) } : it)));
      } else {
        const created = await createAdminCatalogItem({
          title: formTitle.trim(),
          slug,
          type: formCategory,
          shortDescription: formSummary.trim() || formTitle.trim(),
          durationText: formDuration.trim(),
          startingPriceInr: Number(formPrice),
          routeSummary: formPlaces.trim(),
        });
        setItems((prev) => [created, ...prev]);
      }
      setIsDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setIsSaving(false);
    }
  }

  async function setStatus(id: string, action: "publish" | "archive") {
    setActionError(null);
    setBusyId(id);
    try {
      const updated = await setCatalogItemStatus(id, action);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: updated.status } : it)));
    } catch (err) {
      setActionError(`Could not update the item: ${err instanceof Error ? err.message : "backend error"}`);
    } finally {
      setBusyId(null);
    }
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
            <Button variant="gold" size="sm" shine onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1" /> New item
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
      {!loadError && items.length === 0 && (
        <Card className="p-12 text-center">
          <p className="font-display text-lg text-ink">No catalog items yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
            Items created in the backend CMS appear here. Click "New item" above to add your first travel package or ride.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <motion.article
            key={item.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Card className="flex h-full flex-col justify-between p-5 transition-shadow hover:shadow-pop">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <Badge tone={CATEGORY_TONE[item.category]}>{item.category}</Badge>
                  <Badge tone={item.status === "published" ? "success" : item.status === "draft" ? "gold" : "neutral"}>
                    {item.status}
                  </Badge>
                </div>

                <h3 className="mt-3 font-display text-base font-semibold leading-snug tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                  {item.summary}
                </p>

                {item.places.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
                    <MapPin className="h-3 w-3 shrink-0 text-ink-faint" />
                    {item.places.map((place) => (
                      <span key={place} className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-soft">
                        {place}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-3 border-t border-hairline pt-3">
                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-ink-soft">From </span>
                    <span className="font-display text-base font-semibold text-ink">
                      {formatINR(item.startingPrice)}
                    </span>
                    {item.duration && (
                      <span className="ml-2 font-mono text-[11px] text-ink-faint">
                        <Clock className="inline h-3 w-3 mr-0.5 text-ink-faint" />
                        {item.duration}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                    upd {formatDate(item.updatedAt)}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  {canEdit && item.status !== "archived" && (
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(item)}>
                      <PenSquare className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  )}
                  {canPublish && item.status === "draft" && (
                    <Button variant="gold" size="sm" className="flex-1" disabled={busyId === item.id} onClick={() => setStatus(item.id, "publish")}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Publish
                    </Button>
                  )}
                  {canPublish && item.status === "published" && (
                    <Button variant="outline" size="sm" className="flex-1" disabled={busyId === item.id} onClick={() => setStatus(item.id, "archive")}>
                      <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                    </Button>
                  )}
                  {canPublish && item.status === "archived" && (
                    <Button variant="outline" size="sm" className="flex-1" disabled={busyId === item.id} onClick={() => setStatus(item.id, "publish")}>
                      <Globe className="h-3.5 w-3.5 mr-1" /> Restore
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

      {/* Create / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => !isSaving && setIsDialogOpen(false)}
        title={editingItem ? `Edit: ${editingItem.title}` : "Create New Catalog Item"}
        description="Configure commercial details, pricing, routes, and publication status."
        className="max-w-xl"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-error/20 bg-error-soft p-3 text-xs text-error">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="form-title">Item Title *</Label>
              <Input
                id="form-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Taj Mahal Sunrise Tour"
                required
              />
            </div>
            <div>
              <Label htmlFor="form-slug">URL Slug</Label>
              <Input
                id="form-slug"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g. taj-mahal-sunrise-tour"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="form-cat">Vertical Category</Label>
              <Select
                id="form-cat"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as CatalogCategory)}
              >
                <option value="package">Package (Heritage & Circuit Tour)</option>
                <option value="tour">Tour (Local Sightseeing)</option>
                <option value="route">Route (Outstation Drop/Round)</option>
                <option value="ride">Ride (Airport / City Transfer)</option>
                <option value="vehicle">Vehicle (Fleet Spec)</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="form-price">Starting Fare (INR) *</Label>
              <Input
                id="form-price"
                type="number"
                min="100"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="form-dur">Duration Text</Label>
              <Input
                id="form-dur"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="e.g. 8 hrs / 80 km or 3 Days"
              />
            </div>
            <div>
              <Label htmlFor="form-status">Initial Status</Label>
              <Select
                id="form-status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as CatalogStatus)}
                disabled={!canPublish && formStatus === "draft"}
              >
                <option value="draft">Draft (Private / Staging)</option>
                {canPublish && <option value="published">Published (Live to Public)</option>}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="form-summary">Summary Description</Label>
            <Input
              id="form-summary"
              value={formSummary}
              onChange={(e) => setFormSummary(e.target.value)}
              placeholder="Short 1-2 sentence overview shown in cards and search"
            />
          </div>

          <div>
            <Label htmlFor="form-places">Key Places / Route Summary (comma-separated)</Label>
            <Input
              id="form-places"
              value={formPlaces}
              onChange={(e) => setFormPlaces(e.target.value)}
              placeholder="e.g. Taj Mahal, Agra Fort, Mehtab Bagh"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-hairline">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" disabled={isSaving}>
              {isSaving ? "Saving…" : editingItem ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
