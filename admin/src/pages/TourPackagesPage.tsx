import { useEffect, useState } from "react";
import { Archive, Check, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import {
  archiveAdminTourPackage,
  checkTourPackageCode,
  createAdminTourPackage,
  deleteAdminTourPackage,
  fetchAdminTourPackages,
  publishAdminTourPackage,
  updateAdminTourPackage,
} from "@/lib/api";
import { can, type AdminUser, type CatalogStatus, type TourPackageItem } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const FLEET_KEYS = ["sedan", "ertiga", "innova", "tempo", "urbania"] as const;
const FLEET_LABELS: Record<string, string> = {
  sedan: "Sedan (4 Seater)",
  ertiga: "Ertiga (6 Seater)",
  innova: "Innova Crysta (6-7 Seater)",
  tempo: "Tempo Traveller (12 Seater)",
  urbania: "Force Urbania (16 Seater)",
};

const emptyPackage = {
  name: "",
  packageCode: "",
  durationText: "1 Day",
  days: 1,
  nights: 0,
  baseTierCode: "sedan",
  startingPriceInr: 3499,
  fleetPrices: { sedan: 3499, ertiga: 4299, innova: 5299, tempo: 6999, urbania: 8999 },
  usePerKm: false,
  nightChargeInr: 300,
  flatChargeInr: 0,
  inclusionsHighlight: "Private AC Cab, Chauffeur Allowance, Fuel & State Taxes",
  inclusionsNote: "",
  status: "draft" as CatalogStatus,
  isActive: true,
};

export function TourPackagesPage({ user }: { user: AdminUser }) {
  const [items, setItems] = useState<TourPackageItem[]>([]);
  const [status, setStatus] = useState<CatalogStatus | "all">("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TourPackageItem | null>(null);
  const [form, setForm] = useState(emptyPackage);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminTourPackages({ status, q });
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load tour packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [status, q]);

  function openNew() {
    setEditing(null);
    setForm(emptyPackage);
    setModalOpen(true);
  }

  async function openEdit(pkg: TourPackageItem) {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      packageCode: pkg.packageCode,
      durationText: pkg.durationText,
      days: pkg.days,
      nights: pkg.nights,
      baseTierCode: pkg.baseTierCode,
      startingPriceInr: pkg.startingPriceInr,
      fleetPrices: {
        sedan: pkg.fleetPrices.sedan ?? pkg.startingPriceInr,
        ertiga: pkg.fleetPrices.ertiga ?? pkg.startingPriceInr + 800,
        innova: pkg.fleetPrices.innova ?? pkg.startingPriceInr + 1800,
        tempo: pkg.fleetPrices.tempo ?? pkg.startingPriceInr + 3500,
        urbania: pkg.fleetPrices.urbania ?? pkg.startingPriceInr + 5500,
      },
      usePerKm: pkg.usePerKm,
      nightChargeInr: pkg.nightChargeInr,
      flatChargeInr: pkg.flatChargeInr,
      inclusionsHighlight: pkg.inclusionsHighlight ?? "",
      inclusionsNote: pkg.inclusionsNote ?? "",
      status: pkg.status,
      isActive: pkg.isActive,
    });
    setModalOpen(true);
  }

  function handleNameChange(name: string) {
    setForm((prev) => {
      const autoSlug = !editing
        ? name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        : prev.packageCode;
      return { ...prev, name, packageCode: autoSlug };
    });
  }

  function setFleetPrice(tier: string, value: number) {
    setForm((prev) => ({
      ...prev,
      fleetPrices: { ...prev.fleetPrices, [tier]: value },
      startingPriceInr: tier === prev.baseTierCode ? value : prev.startingPriceInr,
    }));
  }

  async function handleSave(publish = false) {
    setBusy(true);
    setError(null);
    try {
      if (!form.name.trim()) throw new Error("Package name is required.");
      if (!form.packageCode.trim()) throw new Error("Package code is required.");

      // Check code availability if creating new
      if (!editing) {
        const check = await checkTourPackageCode(form.packageCode);
        if (!check.available) throw new Error(`Code '${form.packageCode}' is already taken.`);
      }

      const payload = {
        name: form.name.trim(),
        package_code: form.packageCode.trim(),
        duration_text: form.durationText.trim(),
        days: Number(form.days),
        nights: Number(form.nights),
        base_tier_code: form.baseTierCode,
        starting_price_inr: Number(form.startingPriceInr),
        fleet_prices: form.fleetPrices,
        use_per_km: Boolean(form.usePerKm),
        night_charge_inr: Number(form.nightChargeInr) || 0,
        flat_charge_inr: Number(form.flatChargeInr) || 0,
        inclusions_highlight: form.inclusionsHighlight.trim() || undefined,
        inclusions_note: form.inclusionsNote.trim() || undefined,
        is_active: form.isActive,
      };

      const saved = editing
        ? await updateAdminTourPackage(editing.id, payload)
        : await createAdminTourPackage(payload);

      if (publish && saved.status !== "published") {
        await publishAdminTourPackage(saved.id);
      }

      setModalOpen(false);
      await reload();
    } catch (e: any) {
      setError(e.message || "Failed to save tour package.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish(id: string) {
    setBusy(true);
    try {
      await publishAdminTourPackage(id);
      await reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive(id: string) {
    setBusy(true);
    try {
      await archiveAdminTourPackage(id);
      await reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this draft tour package?")) return;
    setBusy(true);
    try {
      await deleteAdminTourPackage(id);
      await reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tours & Packages"
        title="Tour Packages"
        description="Signature multi-day itineraries and same-day guided heritage tours with authoritative 5-tier fleet pricing."
        actions={
          can(user.role, "catalog:edit") ? (
            <Button variant="gold" onClick={openNew}>
              <Plus className="mr-1.5 h-4 w-4" /> New Package
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by package name or code..."
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-40">
          <option value="all">All statuses</option>
          <option value="draft">Draft (Review)</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="divide-y divide-hairline">
          {items.map((pkg) => (
            <div key={pkg.id} className="flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-raised/40">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-gold shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{pkg.name}</span>
                    <Badge tone={pkg.status === "published" ? "success" : pkg.status === "draft" ? "gold" : "neutral"}>
                      {pkg.status}
                    </Badge>
                    <span className="text-xs text-ink-soft">({pkg.durationText})</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    /packages/{pkg.packageCode} · From {formatINR(pkg.startingPriceInr)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-ink-soft">
                    {FLEET_KEYS.map((k) => (
                      <span key={k} className="rounded bg-surface-raised px-1.5 py-0.5 border border-hairline font-mono">
                        {k}: {pkg.fleetPrices[k] ? formatINR(pkg.fleetPrices[k]) : "—"}
                      </span>
                    ))}
                    {pkg.usePerKm && <span className="rounded bg-amber-500/10 text-amber-400 px-1.5 py-0.5 border border-amber-500/20">Per-km enabled</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {can(user.role, "catalog:edit") && (
                  <Button size="sm" variant="outline" onClick={() => void openEdit(pkg)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                )}
                {can(user.role, "catalog:publish") && pkg.status === "draft" && (
                  <Button size="sm" variant="gold" onClick={() => void handlePublish(pkg.id)} disabled={busy}>
                    <Check className="mr-1 h-3.5 w-3.5" /> Publish
                  </Button>
                )}
                {pkg.status !== "archived" && (
                  <Button size="sm" variant="ghost" onClick={() => void handleArchive(pkg.id)} disabled={busy} title="Archive">
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                )}
                {pkg.status === "draft" && (
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => void handleDelete(pkg.id)} disabled={busy} title="Delete draft">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {items.length === 0 && !loading && (
            <div className="p-8 text-center text-sm text-ink-soft">No tour packages found.</div>
          )}
        </div>
      </Card>

      {/* Editor Dialog */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit: ${editing.name}` : "New Tour Package"}
        description="Configure commercial fares across the 5 canonical vehicle tiers, durations, and inclusions."
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Package Name</Label>
              <Input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Same Day Agra Taj Mahal Tour"
              />
            </div>
            <div>
              <Label>Package Slug / Code {editing && "(immutable)"}</Label>
              <Input
                value={form.packageCode}
                readOnly={Boolean(editing)}
                onChange={(e) => setForm((p) => ({ ...p, packageCode: e.target.value }))}
                placeholder="e.g. same-day-agra-tour"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Duration Text</Label>
              <Input
                value={form.durationText}
                onChange={(e) => setForm((p) => ({ ...p, durationText: e.target.value }))}
                placeholder="e.g. 1 Day (12-14 Hours)"
              />
            </div>
            <div>
              <Label>Days</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={form.days}
                onChange={(e) => setForm((p) => ({ ...p, days: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Nights</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={form.nights}
                onChange={(e) => setForm((p) => ({ ...p, nights: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* 5-tier fleet pricing editor */}
          <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20">
            <h4 className="font-semibold text-ink text-sm mb-3">5 Canonical Fleet Fares (₹ INR)</h4>
            <div className="grid gap-3 sm:grid-cols-5">
              {FLEET_KEYS.map((k) => (
                <div key={k}>
                  <Label className="text-xs">{FLEET_LABELS[k]}</Label>
                  <Input
                    type="number"
                    value={form.fleetPrices[k] ?? ""}
                    onChange={(e) => setFleetPrice(k, Number(e.target.value))}
                    placeholder="₹"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Night Charge per Night (₹)</Label>
              <Input
                type="number"
                value={form.nightChargeInr}
                onChange={(e) => setForm((p) => ({ ...p, nightChargeInr: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Flat Surcharge (₹)</Label>
              <Input
                type="number"
                value={form.flatChargeInr}
                onChange={(e) => setForm((p) => ({ ...p, flatChargeInr: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  checked={form.usePerKm}
                  onChange={(e) => setForm((p) => ({ ...p, usePerKm: e.target.checked }))}
                />
                <span className="text-xs text-ink font-medium">Use per-km calculation</span>
              </Label>
            </div>
          </div>

          <div>
            <Label>Inclusions Highlight</Label>
            <Input
              value={form.inclusionsHighlight}
              onChange={(e) => setForm((p) => ({ ...p, inclusionsHighlight: e.target.value }))}
              placeholder="e.g. AC Cab, Fuel, Chauffeur, Sightseeing, Tolls"
            />
          </div>

          <div>
            <Label>Inclusions & Exclusions Detail Note</Label>
            <Textarea
              rows={2}
              value={form.inclusionsNote ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, inclusionsNote: e.target.value }))}
              placeholder="Monument entrance tickets and personal meals not included..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => void handleSave(false)} disabled={busy}>
              Save as Draft
            </Button>
            <Button variant="gold" onClick={() => void handleSave(true)} disabled={busy}>
              <Check className="mr-1 h-3.5 w-3.5" /> Save & Publish
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
