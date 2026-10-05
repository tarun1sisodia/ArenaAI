import { useEffect, useState } from "react";
import { Archive, Car, Check, Pencil, Plane, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, NumberInput, Select } from "@/components/ui/Input";
import {
  archiveAdminLocalPackage,
  archiveAdminTransferRoute,
  checkLocalPackageCode,
  checkTransferRouteCode,
  createAdminLocalPackage,
  createAdminTransferRoute,
  deleteAdminLocalPackage,
  deleteAdminTransferRoute,
  fetchAdminLocalPackages,
  fetchAdminTransferRoutes,
  publishAdminLocalPackage,
  publishAdminTransferRoute,
  updateAdminLocalPackage,
  updateAdminTransferRoute,
} from "@/lib/api";
import { can, type AdminUser, type CatalogStatus, type LocalPackageItem, type TransferRouteItem } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const FLEET_KEYS = ["sedan", "ertiga", "innova", "tempo", "urbania"] as const;
const FLEET_LABELS: Record<string, string> = {
  sedan: "Sedan (4s)",
  ertiga: "Ertiga (6s)",
  innova: "Innova (6-7s)",
  tempo: "Tempo (12s)",
  urbania: "Urbania (16s)",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const emptyLocal = {
  name: "",
  packageCode: "",
  durationHours: 8,
  includedKm: 80,
  covers: "Taj Mahal, Agra Fort, Mehtab Bagh",
  parkingNote: "Monument entry fees & parking billed at actuals",
  fleetPrices: { sedan: 1900, ertiga: 2600, innova: 2850, tempo: 5500, urbania: 7500 },
  usePerKm: false,
  extraRates: {
    sedan: { per_km: 10, per_hr: 150 },
    ertiga: { per_km: 14, per_hr: 200 },
    innova: { per_km: 18, per_hr: 250 },
    tempo: { per_km: 25, per_hr: 400 },
    urbania: { per_km: 34, per_hr: 600 },
  },
  nightChargeInr: 0,
  status: "draft" as CatalogStatus,
  isActive: true,
};

const emptyTransfer = {
  name: "",
  routeCode: "",
  distanceText: "~15–20 km",
  directionNote: "Doorstep pickup or drop at station / airport",
  fleetPrices: { sedan: 800, ertiga: 900, innova: 1100, tempo: 2200, urbania: 3500 },
  usePerKm: false,
  nightChargeInr: 0,
  status: "draft" as CatalogStatus,
  isActive: true,
};

export function LocalTransfersPage({ user }: { user: AdminUser }) {
  const [activeTab, setActiveTab] = useState<"local" | "transfer">("local");
  const [localItems, setLocalItems] = useState<LocalPackageItem[]>([]);
  const [transferItems, setTransferItems] = useState<TransferRouteItem[]>([]);
  const [status, setStatus] = useState<CatalogStatus | "all">("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local Modal
  const [localModalOpen, setLocalModalOpen] = useState(false);
  const [editingLocal, setEditingLocal] = useState<LocalPackageItem | null>(null);
  const [localForm, setLocalForm] = useState(emptyLocal);

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<TransferRouteItem | null>(null);
  const [transferForm, setTransferForm] = useState(emptyTransfer);

  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "local") {
        const data = await fetchAdminLocalPackages({ status, q });
        setLocalItems(data);
      } else {
        const data = await fetchAdminTransferRoutes({ status, q });
        setTransferItems(data);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [activeTab, status, q]);

  // Local package handlers
  function openNewLocal() {
    setEditingLocal(null);
    setLocalForm(emptyLocal);
    setLocalModalOpen(true);
  }

  function handleLocalNameChange(name: string) {
    setLocalForm((prev) => ({ ...prev, name, packageCode: editingLocal ? prev.packageCode : slugify(name) }));
  }

  function handleTransferNameChange(name: string) {
    setTransferForm((prev) => ({ ...prev, name, routeCode: editingTransfer ? prev.routeCode : slugify(name) }));
  }

  function openEditLocal(item: LocalPackageItem) {
    setEditingLocal(item);
    setLocalForm({
      name: item.name,
      packageCode: item.packageCode,
      durationHours: item.durationHours,
      includedKm: item.includedKm,
      covers: item.covers,
      parkingNote: item.parkingNote ?? "",
      fleetPrices: { ...emptyLocal.fleetPrices, ...item.fleetPrices },
      usePerKm: item.usePerKm,
      extraRates: {
        sedan: item.extraRates?.sedan ?? emptyLocal.extraRates.sedan,
        ertiga: item.extraRates?.ertiga ?? emptyLocal.extraRates.ertiga,
        innova: item.extraRates?.innova ?? emptyLocal.extraRates.innova,
        tempo: item.extraRates?.tempo ?? emptyLocal.extraRates.tempo,
        urbania: item.extraRates?.urbania ?? emptyLocal.extraRates.urbania,
      },
      nightChargeInr: item.nightChargeInr,
      status: item.status,
      isActive: item.isActive,
    });
    setLocalModalOpen(true);
  }

  async function handleSaveLocal(publish = false) {
    setBusy(true);
    setError(null);
    try {
      if (!localForm.name.trim()) throw new Error("Package name is required.");
      if (!localForm.packageCode.trim()) throw new Error("Package code is required.");

      if (!editingLocal) {
        const check = await checkLocalPackageCode(localForm.packageCode);
        if (!check.available) throw new Error(`Code '${localForm.packageCode}' already taken.`);
      }

      const payload = {
        name: localForm.name.trim(),
        package_code: localForm.packageCode.trim(),
        duration_hours: Number(localForm.durationHours),
        included_km: Number(localForm.includedKm),
        covers: localForm.covers.trim(),
        parking_note: localForm.parkingNote.trim() || undefined,
        fleet_prices: localForm.fleetPrices,
        use_per_km: Boolean(localForm.usePerKm),
        extra_rates: localForm.extraRates,
        night_charge_inr: Number(localForm.nightChargeInr) || 0,
        is_active: localForm.isActive,
      };

      const saved = editingLocal
        ? await updateAdminLocalPackage(editingLocal.id, payload)
        : await createAdminLocalPackage(payload);

      if (publish && saved.status !== "published") {
        await publishAdminLocalPackage(saved.id);
      }

      setLocalModalOpen(false);
      await reload();
    } catch (e: any) {
      setError(e.message || "Failed to save local package.");
    } finally {
      setBusy(false);
    }
  }

  // Transfer handlers
  function openNewTransfer() {
    setEditingTransfer(null);
    setTransferForm(emptyTransfer);
    setTransferModalOpen(true);
  }

  function openEditTransfer(item: TransferRouteItem) {
    setEditingTransfer(item);
    setTransferForm({
      name: item.name,
      routeCode: item.routeCode,
      distanceText: item.distanceText ?? "",
      directionNote: item.directionNote ?? "",
      fleetPrices: { ...emptyTransfer.fleetPrices, ...item.fleetPrices },
      usePerKm: item.usePerKm,
      nightChargeInr: item.nightChargeInr,
      status: item.status,
      isActive: item.isActive,
    });
    setTransferModalOpen(true);
  }

  async function handleSaveTransfer(publish = false) {
    setBusy(true);
    setError(null);
    try {
      if (!transferForm.name.trim()) throw new Error("Route name is required.");
      if (!transferForm.routeCode.trim()) throw new Error("Route code is required.");

      if (!editingTransfer) {
        const check = await checkTransferRouteCode(transferForm.routeCode);
        if (!check.available) throw new Error(`Code '${transferForm.routeCode}' already taken.`);
      }

      const payload = {
        name: transferForm.name.trim(),
        route_code: transferForm.routeCode.trim(),
        distance_text: transferForm.distanceText.trim() || undefined,
        direction_note: transferForm.directionNote.trim() || undefined,
        fleet_prices: transferForm.fleetPrices,
        use_per_km: Boolean(transferForm.usePerKm),
        night_charge_inr: Number(transferForm.nightChargeInr) || 0,
        is_active: transferForm.isActive,
      };

      const saved = editingTransfer
        ? await updateAdminTransferRoute(editingTransfer.id, payload)
        : await createAdminTransferRoute(payload);

      if (publish && saved.status !== "published") {
        await publishAdminTransferRoute(saved.id);
      }

      setTransferModalOpen(false);
      await reload();
    } catch (e: any) {
      setError(e.message || "Failed to save transfer route.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Local & Transfers"
        title="Local Sightseeing & Transfers"
        description="Agra hourly sightseeing packages and station / airport transfer corridors with verified fleet pricing."
        actions={
          can(user.role, "catalog:edit") ? (
            <Button variant="gold" onClick={activeTab === "local" ? openNewLocal : openNewTransfer}>
              <Plus className="mr-1.5 h-4 w-4" /> {activeTab === "local" ? "New Local Package" : "New Transfer Route"}
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-hairline gap-4">
        <button
          onClick={() => setActiveTab("local")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "local" ? "border-gold text-ink" : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Car className="h-4 w-4 text-gold" /> Local Sightseeing Packages
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "transfer" ? "border-gold text-ink" : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          <Plane className="h-4 w-4 text-gold" /> Point-to-Point Transfers
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${activeTab === "local" ? "packages" : "transfers"}...`}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-40">
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* List */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-hairline">
          {activeTab === "local" &&
            localItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-surface-raised/40 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{item.name}</span>
                    <Badge tone={item.status === "published" ? "success" : item.status === "draft" ? "gold" : "neutral"}>
                      {item.status}
                    </Badge>
                    <span className="text-xs text-ink-soft">({item.durationHours}h / {item.includedKm} km)</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    /local-packages/{item.packageCode} · Sedan {formatINR(item.fleetPrices.sedan ?? 0)}
                  </p>
                  <p className="text-xs text-ink-soft mt-1">Covers: {item.covers}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-ink-soft">
                    {FLEET_KEYS.map((k) => (
                      <span key={k} className="rounded bg-surface-raised px-1.5 py-0.5 border border-hairline font-mono">
                        {k}: {item.fleetPrices[k] ? formatINR(item.fleetPrices[k]) : "—"}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {can(user.role, "catalog:edit") && (
                    <Button size="sm" variant="outline" onClick={() => openEditLocal(item)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                  {can(user.role, "catalog:publish") && item.status === "draft" && (
                    <Button size="sm" variant="gold" onClick={async () => { await publishAdminLocalPackage(item.id); reload(); }}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Publish
                    </Button>
                  )}
                  {item.status !== "archived" && (
                    <Button size="sm" variant="ghost" onClick={async () => { await archiveAdminLocalPackage(item.id); reload(); }}>
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {item.status === "draft" && (
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={async () => { if (confirm("Delete draft?")) { await deleteAdminLocalPackage(item.id); reload(); } }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

          {activeTab === "transfer" &&
            transferItems.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-surface-raised/40 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{item.name}</span>
                    <Badge tone={item.status === "published" ? "success" : item.status === "draft" ? "gold" : "neutral"}>
                      {item.status}
                    </Badge>
                    <span className="text-xs text-ink-soft">({item.distanceText})</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    /transfers/{item.routeCode} · Sedan {formatINR(item.fleetPrices.sedan ?? 0)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-ink-soft">
                    {FLEET_KEYS.map((k) => (
                      <span key={k} className="rounded bg-surface-raised px-1.5 py-0.5 border border-hairline font-mono">
                        {k}: {item.fleetPrices[k] ? formatINR(item.fleetPrices[k]) : "—"}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {can(user.role, "catalog:edit") && (
                    <Button size="sm" variant="outline" onClick={() => openEditTransfer(item)}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                  {can(user.role, "catalog:publish") && item.status === "draft" && (
                    <Button size="sm" variant="gold" onClick={async () => { await publishAdminTransferRoute(item.id); reload(); }}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Publish
                    </Button>
                  )}
                  {item.status !== "archived" && (
                    <Button size="sm" variant="ghost" onClick={async () => { await archiveAdminTransferRoute(item.id); reload(); }}>
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {item.status === "draft" && (
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={async () => { if (confirm("Delete draft?")) { await deleteAdminTransferRoute(item.id); reload(); } }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

          {((activeTab === "local" && localItems.length === 0) ||
            (activeTab === "transfer" && transferItems.length === 0)) &&
            !loading && (
              <div className="p-8 text-center text-sm text-ink-soft">No items found for this view.</div>
            )}
        </div>
      </Card>

      {/* Local Package Modal */}
      <Dialog
        open={localModalOpen}
        onClose={() => setLocalModalOpen(false)}
        title={editingLocal ? `Edit: ${editingLocal.name}` : "New Local Sightseeing Package"}
        description="Configure duration, included km, covers, 5 fleet prices, and extra km/hr rates."
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Package Name</Label>
              <Input
                value={localForm.name}
                onChange={(e) => handleLocalNameChange(e.target.value)}
                placeholder="e.g. Agra Standard Sightseeing"
              />
            </div>
            <div>
              <Label>Package Slug / Code {editingLocal && "(immutable)"}</Label>
              <Input
                value={localForm.packageCode}
                readOnly={Boolean(editingLocal)}
                onChange={(e) => setLocalForm((p) => ({ ...p, packageCode: e.target.value }))}
                placeholder="e.g. agra-standard-sightseeing"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Duration (Hours)</Label>
              <NumberInput
                min={1}
                value={localForm.durationHours}
                onChange={(v) => setLocalForm((p) => ({ ...p, durationHours: v || 1 }))}
              />
            </div>
            <div>
              <Label>Included Distance (Km)</Label>
              <NumberInput
                min={1}
                value={localForm.includedKm}
                onChange={(v) => setLocalForm((p) => ({ ...p, includedKm: v || 1 }))}
              />
            </div>
          </div>

          <div>
            <Label>Places Covered</Label>
            <Input
              value={localForm.covers}
              onChange={(e) => setLocalForm((p) => ({ ...p, covers: e.target.value }))}
              placeholder="Taj Mahal, Agra Fort, Mehtab Bagh..."
            />
          </div>

          <div>
            <Label>Parking & Entry Note</Label>
            <Input
              value={localForm.parkingNote}
              onChange={(e) => setLocalForm((p) => ({ ...p, parkingNote: e.target.value }))}
              placeholder="Monument entry fees & parking billed at actuals"
            />
          </div>

          {/* 5-tier fleet prices */}
          <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20">
            <h4 className="font-semibold text-ink text-sm mb-3">5 Canonical Fleet Fares (₹)</h4>
            <div className="grid gap-3 sm:grid-cols-5">
              {FLEET_KEYS.map((k) => (
                <div key={k}>
                  <Label className="text-xs">{FLEET_LABELS[k]}</Label>
                  <NumberInput
                    value={localForm.fleetPrices[k] ?? 0}
                    onChange={(v) => setLocalForm((p) => ({ ...p, fleetPrices: { ...p.fleetPrices, [k]: v } }))}
                    placeholder="₹"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Extra rates editor */}
          <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20">
            <h4 className="font-semibold text-ink text-sm mb-3">Extra Distance & Hour Rates</h4>
            <div className="grid gap-3 sm:grid-cols-5">
              {FLEET_KEYS.map((k) => (
                <div key={k} className="space-y-1">
                  <span className="text-xs font-medium text-ink">{FLEET_LABELS[k]}</span>
                  <div>
                    <Label className="text-[10px]">₹ / Extra Km</Label>
                    <NumberInput
                      value={localForm.extraRates[k]?.per_km ?? 10}
                      onChange={(v) =>
                        setLocalForm((p) => ({
                          ...p,
                          extraRates: {
                            ...p.extraRates,
                            [k]: { ...(p.extraRates[k] ?? { per_hr: 150 }), per_km: v },
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">₹ / Extra Hr</Label>
                    <NumberInput
                      value={localForm.extraRates[k]?.per_hr ?? 150}
                      onChange={(v) =>
                        setLocalForm((p) => ({
                          ...p,
                          extraRates: {
                            ...p.extraRates,
                            [k]: { ...(p.extraRates[k] ?? { per_km: 10 }), per_hr: v },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
            <Button variant="outline" onClick={() => setLocalModalOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="outline" onClick={() => void handleSaveLocal(false)} disabled={busy}>Save Draft</Button>
            <Button variant="gold" onClick={() => void handleSaveLocal(true)} disabled={busy}>
              <Check className="mr-1 h-3.5 w-3.5" /> Save & Publish
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Transfer Route Modal */}
      <Dialog
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title={editingTransfer ? `Edit: ${editingTransfer.name}` : "New Transfer Route"}
        description="Configure doorstep station or airport transfer corridor and 5 fleet prices."
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Route Name</Label>
              <Input
                value={transferForm.name}
                onChange={(e) => handleTransferNameChange(e.target.value)}
                placeholder="e.g. Agra Cantt Railway Station (AGC) Drop/Pickup"
              />
            </div>
            <div>
              <Label>Route Slug / Code {editingTransfer && "(immutable)"}</Label>
              <Input
                value={transferForm.routeCode}
                readOnly={Boolean(editingTransfer)}
                onChange={(e) => setTransferForm((p) => ({ ...p, routeCode: e.target.value }))}
                placeholder="e.g. agc-station-drop"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Distance Text</Label>
              <Input
                value={transferForm.distanceText}
                onChange={(e) => setTransferForm((p) => ({ ...p, distanceText: e.target.value }))}
                placeholder="~15–20 km"
              />
            </div>
            <div>
              <Label>Direction / Service Note</Label>
              <Input
                value={transferForm.directionNote}
                onChange={(e) => setTransferForm((p) => ({ ...p, directionNote: e.target.value }))}
                placeholder="Doorstep pickup or drop at Agra Cantt Railway Station"
              />
            </div>
          </div>

          {/* 5-tier fleet prices */}
          <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20">
            <h4 className="font-semibold text-ink text-sm mb-3">5 Canonical Fleet Fares (₹)</h4>
            <div className="grid gap-3 sm:grid-cols-5">
              {FLEET_KEYS.map((k) => (
                <div key={k}>
                  <Label className="text-xs">{FLEET_LABELS[k]}</Label>
                  <NumberInput
                    value={transferForm.fleetPrices[k] ?? 0}
                    onChange={(v) => setTransferForm((p) => ({ ...p, fleetPrices: { ...p.fleetPrices, [k]: v } }))}
                    placeholder="₹"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
            <Button variant="outline" onClick={() => setTransferModalOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="outline" onClick={() => void handleSaveTransfer(false)} disabled={busy}>Save Draft</Button>
            <Button variant="gold" onClick={() => void handleSaveTransfer(true)} disabled={busy}>
              <Check className="mr-1 h-3.5 w-3.5" /> Save & Publish
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
