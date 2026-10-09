import { useEffect, useState } from "react";
import { Archive, Check, Pencil, Plus, Route as RouteIcon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Select } from "@/components/ui/Input";
import { LocationAutocompleteInput } from "@/components/admin/LocationAutocompleteInput";
import { FleetPricingGrid } from "@/modules/fleets";
import {
  archiveAdminRoute,
  createAdminRoute,
  fetchAdminRoutes,
  fetchRouteFleets,
  publishAdminRoute,
  suggestRouteFares,
  updateAdminRoute,
} from "./routes.api";
import { EMPTY_ROUTE_FORM, type RouteFormState } from "./routes.types";
import type { AdminUser, CatalogStatus, RouteCatalogItem, RouteFleet, RouteStop, RouteTripType } from "@/lib/types";
import { can } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import type { VehicleTier } from "@/contracts/vehicle-tiers";

export function RouteCatalogPanel({ user }: { user: AdminUser }) {
  const [items, setItems] = useState<RouteCatalogItem[]>([]);
  const [fleets, setFleets] = useState<RouteFleet[]>([]);
  const [tripType, setTripType] = useState<RouteTripType>("one-way");
  const [status, setStatus] = useState<CatalogStatus | "all">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<RouteCatalogItem | null>(null);
  const [form, setForm] = useState<RouteFormState>(EMPTY_ROUTE_FORM);
  const [selected, setSelected] = useState<string[]>([]);
  const [fares, setFares] = useState<Record<string, number>>({});
  const [stops, setStops] = useState<RouteStop[]>([{ name: "Taj Mahal" }, { name: "Agra Fort" }]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const reload = () =>
    fetchAdminRoutes({ status, q })
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load routes."));

  useEffect(() => {
    void reload();
  }, [status, q]);

  useEffect(() => {
    fetchRouteFleets()
      .then((data) => {
        setFleets(data);
        setSelected(data.map((f) => f.id));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load fleets."));
  }, []);

  function setField<K extends keyof RouteFormState>(key: K, value: RouteFormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (!editing && (key === "sourceCity" || key === "destinationCity")) {
        const src = (key === "sourceCity" ? String(value) : next.sourceCity) || "agra";
        const dst = (key === "destinationCity" ? String(value) : next.destinationCity) || "";
        const cleanSrc = src.split(",")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const cleanDst = dst.split(",")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        next.slug = `${cleanSrc}-to-${cleanDst}-taxi`
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      return next;
    });
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_ROUTE_FORM);
    setTripType("one-way");
    setSelected(fleets.map((f) => f.id));
    setFares({});
    setStops([{ name: "Taj Mahal" }, { name: "Agra Fort" }]);
    setFormError(null);
    setIsFormOpen(true);
  }

  function openEdit(item: RouteCatalogItem) {
    setEditing(item);
    setTripType(item.tripType);
    setForm({
      sourceCity: item.sourceCity,
      sourceDetail: item.sourceDetail ?? "",
      destinationCity: item.destinationCity ?? "",
      slug: item.slug,
      distanceKm: item.distanceKm ? String(item.distanceKm) : "",
      durationText: item.durationText ?? "",
      driverChargeInr: item.driverChargeInr ? String(item.driverChargeInr) : "0",
      nightHaltInr: item.nightHaltInr ? String(item.nightHaltInr) : "0",
      tollAmountInr: item.tollAmountInr ? String(item.tollAmountInr) : "",
      minKmPerDay: String(item.minKmPerDay ?? 300),
      usePerKm: Boolean(item.usePerKm),
      perKmRateOverride: item.perKmRateOverride ? String(item.perKmRateOverride) : "",
      highway: item.highway ?? "",
      allInclusiveNote: item.allInclusiveNote ?? "",
    });
    const itemFares = item.faresInr ?? {};
    setFares(itemFares);
    setSelected(Object.keys(itemFares).length ? Object.keys(itemFares) : fleets.map((f) => f.id));
    setStops(item.stops.length ? item.stops : [{ name: "" }]);
    setFormError(null);
    setIsFormOpen(true);
  }

  async function autoFill() {
    const km = Number(form.distanceKm);
    if (!km || km <= 0) {
      setFormError("Enter a valid distance (km) to generate fares.");
      return;
    }
    try {
      const suggested = await suggestRouteFares({ tripType, distanceKm: km });
      setFares(suggested);
      setSelected(Object.keys(suggested));
      setFormError(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to suggest fares.");
    }
  }

  async function handleSave() {
    setBusy(true);
    setFormError(null);
    try {
      if (!form.sourceCity.trim()) throw new Error("Source city is required.");
      if (tripType !== "local-tour" && !form.destinationCity.trim()) {
        throw new Error("Destination city is required.");
      }
      if (!form.slug.trim()) throw new Error("Slug is required.");
      if (selected.length === 0) throw new Error("Select at least one vehicle fleet.");

      const filteredFares: Record<string, number> = {};
      for (const k of selected) {
        if (typeof fares[k] === "number" && fares[k] > 0) {
          filteredFares[k] = fares[k];
        }
      }

      const payload = {
        sourceCity: form.sourceCity.trim(),
        sourceDetail: form.sourceDetail.trim() || null,
        destinationCity: tripType === "local-tour" ? null : form.destinationCity.trim(),
        slug: form.slug.trim(),
        tripType,
        distanceKm: form.distanceKm ? Number(form.distanceKm) : null,
        durationText: form.durationText.trim() || null,
        driverChargeInr: Number(form.driverChargeInr) || 0,
        nightHaltInr: Number(form.nightHaltInr) || 0,
        tollAmountInr: form.tollAmountInr ? Number(form.tollAmountInr) : null,
        minKmPerDay: Number(form.minKmPerDay) || 300,
        usePerKm: form.usePerKm,
        perKmRateOverride: form.perKmRateOverride ? Number(form.perKmRateOverride) : null,
        highway: form.highway.trim() || null,
        allInclusiveNote: form.allInclusiveNote.trim() || null,
        fares: filteredFares,
        stops: tripType === "local-tour" ? stops.filter((s) => s.name.trim()) : [],
      };

      if (editing) {
        await updateAdminRoute(editing.id, payload);
      } else {
        await createAdminRoute(payload as any);
      }
      setIsFormOpen(false);
      await reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save route.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish(id: string) {
    setBusy(true);
    try {
      await publishAdminRoute(id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish route.");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive(id: string) {
    if (!confirm("Are you sure you want to archive this route?")) return;
    setBusy(true);
    try {
      await archiveAdminRoute(id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive route.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-auto text-xs">
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search source or destination..."
            className="max-w-xs text-xs"
          />
        </div>
        {can(user.role, "catalog:create") && (
          <Button variant="gold" size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New route
          </Button>
        )}
      </div>

      {error && <p className="mb-3 text-xs text-error">{error}</p>}

      <Card className="divide-y divide-hairline overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-surface-2 transition-colors">
            <div className="flex items-start gap-3">
              <div className="rounded p-2 bg-surface-raised border border-hairline text-gold">
                <RouteIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink text-sm">
                    {item.sourceCity}
                    {item.destinationCity ? ` → ${item.destinationCity}` : ` · ${item.stops.length} stops`}
                  </span>
                  <Badge tone={item.status === "published" ? "success" : item.status === "draft" ? "gold" : "neutral"}>
                    {item.status}
                  </Badge>
                  <span className="font-mono text-[11px] text-ink-soft">/{item.slug}</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft flex items-center gap-2">
                  <span>{item.tripType}</span>
                  {item.distanceKm && <span>· {item.distanceKm} km</span>}
                  {item.durationText && <span>· {item.durationText}</span>}
                  {item.highway && <span>· {item.highway}</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-ink-soft">
                  {Object.entries(item.faresInr || {}).map(([k, v]) => (
                    <span key={k} className="rounded bg-surface-raised px-1.5 py-0.5 border border-hairline font-mono text-[10px]">
                      {k.split("-")[0]}: {formatINR(Number(v))}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {can(user.role, "catalog:edit") && (
                <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {can(user.role, "catalog:publish") && item.status === "draft" && (
                <Button size="sm" variant="gold" onClick={() => void handlePublish(item.id)} disabled={busy}>
                  <Check className="mr-1 h-3.5 w-3.5" /> Publish
                </Button>
              )}
              {item.status !== "archived" && (
                <Button size="sm" variant="ghost" onClick={() => void handleArchive(item.id)} disabled={busy} title="Archive">
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-8 text-center text-sm text-ink-soft">No route catalog items match the filters.</div>
        )}
      </Card>

      {/* Route Editor Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? `Edit route: ${form.sourceCity} → ${form.destinationCity || "Local tour"}` : "New route draft"}
        description="Configure route corridor, distance, LocationIQ landmarks, and 5-fleet fares."
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {formError && <p className="text-xs text-error font-medium">{formError}</p>}

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Trip type</Label>
              <Select value={tripType} onChange={(e) => setTripType(e.target.value as RouteTripType)}>
                <option value="one-way">One-way</option>
                <option value="round-trip">Round-trip</option>
                <option value="local-tour">Local tour</option>
              </Select>
            </div>
            <div>
              <LocationAutocompleteInput
                label="Source City (LocationIQ)"
                value={form.sourceCity}
                onChange={(val) => setField("sourceCity", val)}
                placeholder="e.g. Agra, Uttar Pradesh"
              />
            </div>
            <div>
              <LocationAutocompleteInput
                label="Destination City (LocationIQ)"
                value={form.destinationCity}
                onChange={(val) => setField("destinationCity", val)}
                placeholder={tripType === "local-tour" ? "N/A for local tour" : "e.g. Delhi, New Delhi"}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Source detail</Label>
              <Input
                value={form.sourceDetail}
                onChange={(e) => setField("sourceDetail", e.target.value)}
                placeholder="Taj East Gate"
              />
            </div>
            <div>
              <Label>Distance (km)</Label>
              <Input
                type="number"
                value={form.distanceKm}
                onChange={(e) => setField("distanceKm", e.target.value)}
              />
            </div>
            <div>
              <Label>Duration</Label>
              <Input
                value={form.durationText}
                onChange={(e) => setField("durationText", e.target.value)}
                placeholder="3h 30m approx"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Highway / Corridor</Label>
              <Input
                value={form.highway}
                onChange={(e) => setField("highway", e.target.value)}
                placeholder="Yamuna Expressway / NH-21"
              />
            </div>
            <div>
              <Label>All-inclusive Note</Label>
              <Input
                value={form.allInclusiveNote}
                onChange={(e) => setField("allInclusiveNote", e.target.value)}
                placeholder="Toll, state tax, and driver allowance included"
              />
            </div>
          </div>

          <div>
            <Label>Public slug {editing && "(immutable after creation)"}</Label>
            <Input
              value={form.slug}
              readOnly={Boolean(editing)}
              onChange={(e) => setField("slug", e.target.value)}
            />
          </div>

          {/* 5-tier Fleet Fares with Auto-fill option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="mb-0">Canonical Fleets &amp; Fares</Label>
              <Button size="sm" variant="outline" type="button" onClick={() => void autoFill()}>
                <Sparkles className="mr-1 h-3 w-3" /> Auto-fill from fare engine
              </Button>
            </div>

            <FleetPricingGrid
              prices={fares}
              onChange={(tier: VehicleTier, val: number) => {
                setFares((prev) => ({ ...prev, [tier]: val }));
                if (!selected.includes(tier)) setSelected((p) => [...p, tier]);
              }}
              title="5 Canonical Fleet Fares (₹ INR)"
              description="Configure outstation fares for Sedan, Ertiga, Innova Crysta, Tempo Traveller, and Urbania."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Driver charge per night (₹)</Label>
              <Input
                type="number"
                value={form.driverChargeInr}
                onChange={(e) => setField("driverChargeInr", e.target.value)}
              />
            </div>
            <div>
              <Label>Night halt charge (₹)</Label>
              <Input
                type="number"
                value={form.nightHaltInr}
                onChange={(e) => setField("nightHaltInr", e.target.value)}
              />
            </div>
            <div>
              <Label>Toll estimate (₹)</Label>
              <Input
                type="number"
                value={form.tollAmountInr}
                onChange={(e) => setField("tollAmountInr", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={busy}>
              {busy ? "Saving..." : editing ? "Save changes" : "Create route"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
