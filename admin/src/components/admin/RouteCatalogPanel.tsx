import { useEffect, useState } from "react";
import { Archive, Check, Pencil, Plus, Route as RouteIcon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Select } from "@/components/ui/Input";
import {
  archiveAdminRoute,
  createAdminRoute,
  fetchAdminRoutes,
  fetchRouteFleets,
  publishAdminRoute,
  suggestRouteFares,
  updateAdminRoute,
} from "@/lib/api";
import type { AdminUser, CatalogStatus, RouteCatalogItem, RouteFleet, RouteStop, RouteTripType } from "@/lib/types";
import { can } from "@/lib/types";
import { formatINR } from "@/lib/utils";

interface RouteFormState {
  sourceCity: string;
  sourceDetail: string;
  destinationCity: string;
  slug: string;
  distanceKm: string;
  durationText: string;
  driverChargeInr: string;
  nightHaltInr: string;
  tollAmountInr: string;
  minKmPerDay: string;
  usePerKm: boolean;
  perKmRateOverride: string;
  highway: string;
  allInclusiveNote: string;
}

const emptyForm: RouteFormState = {
  sourceCity: "Agra",
  sourceDetail: "",
  destinationCity: "",
  slug: "",
  distanceKm: "",
  durationText: "",
  driverChargeInr: "0",
  nightHaltInr: "0",
  tollAmountInr: "",
  minKmPerDay: "300",
  usePerKm: true,
  perKmRateOverride: "",
  highway: "",
  allInclusiveNote: "",
};

export function RouteCatalogPanel({ user }: { user: AdminUser }) {
  const [items, setItems] = useState<RouteCatalogItem[]>([]);
  const [fleets, setFleets] = useState<RouteFleet[]>([]);
  const [tripType, setTripType] = useState<RouteTripType>("one-way");
  const [status, setStatus] = useState<CatalogStatus | "all">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<RouteCatalogItem | null>(null);
  const [form, setForm] = useState<RouteFormState>(emptyForm);
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
        next.slug = `${src}-to-${dst}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") + "-taxi";
      }
      return next;
    });
  }

  function openNew() {
    setEditing(null);
    setTripType("one-way");
    setForm(emptyForm);
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
      distanceKm: item.distanceKm?.toString() ?? "",
      durationText: item.durationText ?? "",
      driverChargeInr: item.driverChargeInr.toString(),
      nightHaltInr: item.nightHaltInr.toString(),
      tollAmountInr: item.tollAmountInr?.toString() ?? "",
      minKmPerDay: item.minKmPerDay.toString(),
      usePerKm: item.usePerKm ?? true,
      perKmRateOverride: item.perKmRateOverride?.toString() ?? "",
      highway: item.highway ?? "",
      allInclusiveNote: item.allInclusiveNote ?? "",
    });
    setSelected(item.availableFleets);
    setFares(item.faresInr);
    setStops(item.stops?.length ? item.stops : [{ name: "Taj Mahal" }, { name: "Agra Fort" }]);
    setFormError(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function autoFill() {
    const distance = Number(form.distanceKm);
    if (!distance) {
      setFormError("Enter distance before suggesting fares.");
      return;
    }
    try {
      setFormError(null);
      const suggested = await suggestRouteFares({ tripType, distanceKm: distance });
      setFares(suggested);
      setSelected(fleets.map((f) => f.id));
    } catch (e: any) {
      setFormError(e.message || "Failed to suggest fares.");
    }
  }

  async function save(publish = false) {
    setBusy(true);
    setFormError(null);
    try {
      if (tripType !== "local-tour" && !form.destinationCity.trim()) {
        throw new Error("Destination city is required.");
      }
      if (tripType === "local-tour" && stops.length < 2) {
        throw new Error("Local tours require at least two stops.");
      }
      if (!selected.length || selected.some((id) => !fares[id])) {
        throw new Error("Select fleets and provide every selected fare.");
      }
      const payload: any = {
        tripType,
        sourceCity: form.sourceCity.trim(),
        sourceDetail: form.sourceDetail.trim() || null,
        destinationCity: tripType === "local-tour" ? null : form.destinationCity.trim(),
        slug: form.slug.trim(),
        distanceKm: form.distanceKm ? Number(form.distanceKm) : null,
        durationText: form.durationText.trim() || null,
        availableFleets: selected,
        faresInr: Object.fromEntries(selected.map((id) => [id, Number(fares[id])])),
        driverChargeInr: Number(form.driverChargeInr) || 0,
        nightHaltInr: Number(form.nightHaltInr) || 0,
        tollIncluded: !form.tollAmountInr,
        tollAmountInr: form.tollAmountInr ? Number(form.tollAmountInr) : null,
        interstateCharges: [],
        minKmPerDay: Number(form.minKmPerDay) || 300,
        stops: tripType === "local-tour" ? stops : [],
        usePerKm: Boolean(form.usePerKm),
        perKmRateOverride: form.perKmRateOverride ? Number(form.perKmRateOverride) : null,
        highway: form.highway.trim() || null,
        allInclusiveNote: form.allInclusiveNote.trim() || null,
        needsReview: false,
      };
      const saved = editing ? await updateAdminRoute(editing.id, payload) : await createAdminRoute(payload);
      if (publish) await publishAdminRoute(saved.id);
      closeForm();
      await reload();
    } catch (e: any) {
      setFormError(e.message || "Could not save route.");
    } finally {
      setBusy(false);
    }
  }

  async function action(id: string, actionName: "publish" | "archive") {
    setBusy(true);
    try {
      const updated = actionName === "publish" ? await publishAdminRoute(id) : await archiveAdminRoute(id);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Route catalog</p>
          <h2 className="font-display text-2xl font-semibold text-ink">Published routes and fares</h2>
        </div>
        {can(user.role, "catalog:edit") && (
          <Button variant="gold" size="sm" onClick={openNew}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New route
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search city or slug"
          className="max-w-xs"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="w-36"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {error && (
        <p className="rounded border border-error/20 bg-error-soft px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="divide-y divide-hairline">
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 p-4">
              <RouteIcon className="h-4 w-4 text-gold" />
              <div className="min-w-[220px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm text-ink">
                    {item.sourceCity}
                    {item.destinationCity ? ` → ${item.destinationCity}` : ` · ${item.stops.length} stops`}
                  </strong>
                  <Badge tone={item.status === "published" ? "success" : item.status === "draft" ? "gold" : "neutral"}>
                    {item.status}
                  </Badge>
                  <span className="text-xs text-ink-soft">{item.tripType}</span>
                  {item.highway && (
                    <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-ink-soft">
                      {item.highway}
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-[11px] text-ink-soft">
                  /{item.slug} ·{" "}
                  {Object.values(item.faresInr).length
                    ? `${formatINR(Math.min(...Object.values(item.faresInr)))}–${formatINR(Math.max(...Object.values(item.faresInr)))}`
                    : "No fares"}
                </p>
              </div>
              <div className="flex gap-1.5">
                {can(user.role, "catalog:edit") && (
                  <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
                )}
                {can(user.role, "catalog:publish") && item.status === "draft" && (
                  <Button size="sm" variant="gold" onClick={() => void action(item.id, "publish")} disabled={busy}>
                    Publish
                  </Button>
                )}
                {item.status !== "archived" && (
                  <Button size="sm" variant="ghost" onClick={() => void action(item.id, "archive")} disabled={busy}>
                    <Archive className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="p-8 text-center text-sm text-ink-soft">No route catalog items match this filter.</p>
          )}
        </div>
      </Card>

      <Dialog
        open={isFormOpen}
        onClose={closeForm}
        title={editing ? `Edit route: ${form.sourceCity} → ${form.destinationCity || "Local tour"}` : "New route draft"}
        description="Configure route corridor, trip type, duration, stops, and fleet fares."
        className="max-w-4xl"
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded border border-error/20 bg-error-soft px-3 py-2 text-sm text-error" role="alert">
              {formError}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Trip type</Label>
              <Select value={tripType} onChange={(e) => setTripType(e.target.value as RouteTripType)}>
                <option value="one-way">One-way</option>
                <option value="round-trip">Round-trip</option>
                <option value="local-tour">Local tour</option>
              </Select>
            </div>
            <div>
              <Label>Source city</Label>
              <Input value={form.sourceCity} onChange={(e) => setField("sourceCity", e.target.value)} />
            </div>
            <div>
              <Label>Destination city</Label>
              <Input
                value={form.destinationCity}
                disabled={tripType === "local-tour"}
                onChange={(e) => setField("destinationCity", e.target.value)}
                placeholder={tripType === "local-tour" ? "N/A for local tour" : "e.g. Delhi"}
              />
            </div>
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
            <div>
              <Label>Highway / Corridor</Label>
              <Input
                value={form.highway}
                onChange={(e) => setField("highway", e.target.value)}
                placeholder="Yamuna Expressway / NH-21"
              />
            </div>
            <div className="md:col-span-2">
              <Label>All-inclusive Note</Label>
              <Input
                value={form.allInclusiveNote}
                onChange={(e) => setField("allInclusiveNote", e.target.value)}
                placeholder="Toll, state tax, and driver allowance included"
              />
            </div>
            <div className="md:col-span-3">
              <Label>Public slug {editing && "(immutable after creation)"}</Label>
              <Input
                value={form.slug}
                readOnly={Boolean(editing)}
                onChange={(e) => setField("slug", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <Label className="mb-0">Fleets and fares</Label>
              <Button size="sm" variant="outline" onClick={() => void autoFill()}>
                <Sparkles className="mr-1 h-3 w-3" /> Auto-fill from fare engine
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {fleets.map((fleet) => (
                <label key={fleet.id} className="rounded border border-hairline p-3 text-xs">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(fleet.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked ? [...prev, fleet.id] : prev.filter((id) => id !== fleet.id)
                        )
                      }
                    />
                    <strong>{fleet.name}</strong>
                  </span>
                  <span className="mt-1 block text-ink-soft">
                    {fleet.seats} seats · ₹{fleet.perKm}/km
                  </span>
                  {selected.includes(fleet.id) && (
                    <Input
                      className="mt-2"
                      type="number"
                      value={fares[fleet.id] ?? ""}
                      onChange={(e) =>
                        setFares((prev) => ({ ...prev, [fleet.id]: Number(e.target.value) }))
                      }
                      placeholder="Fare ₹"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div>
              <Label>Driver charge</Label>
              <Input
                type="number"
                value={form.driverChargeInr}
                onChange={(e) => setField("driverChargeInr", e.target.value)}
              />
            </div>
            <div>
              <Label>Night halt</Label>
              <Input
                type="number"
                value={form.nightHaltInr}
                onChange={(e) => setField("nightHaltInr", e.target.value)}
              />
            </div>
            <div>
              <Label>Toll amount (leave blank if included)</Label>
              <Input
                type="number"
                value={form.tollAmountInr}
                onChange={(e) => setField("tollAmountInr", e.target.value)}
              />
            </div>
            {tripType === "round-trip" && (
              <div>
                <Label>Minimum km/day</Label>
                <Input
                  type="number"
                  value={form.minKmPerDay}
                  onChange={(e) => setField("minKmPerDay", e.target.value)}
                />
              </div>
            )}
            <div>
              <Label className="flex items-center gap-2 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  checked={form.usePerKm}
                  onChange={(e) => setField("usePerKm", e.target.checked)}
                />
                <span>Use per-km calculation</span>
              </Label>
            </div>
            <div>
              <Label>Per-km override (optional)</Label>
              <Input
                type="number"
                value={form.perKmRateOverride}
                onChange={(e) => setField("perKmRateOverride", e.target.value)}
                placeholder="e.g. 11"
              />
            </div>
          </div>

          {tripType === "local-tour" && (
            <div className="mt-5">
              <Label>Stops (minimum 2)</Label>
              {stops.map((stop, index) => (
                <div className="mb-2 flex gap-2" key={index}>
                  <Input
                    value={stop.name}
                    onChange={(e) =>
                      setStops((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, name: e.target.value } : s))
                      )
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStops((prev) => prev.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setStops((prev) => [...prev, { name: "" }])}>
                Add stop
              </Button>
            </div>
          )}

          <div className="sticky bottom-0 mt-5 flex flex-wrap justify-end gap-2 border-t border-hairline bg-surface pt-3">
            <Button variant="outline" onClick={closeForm} disabled={busy}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => void save(false)} disabled={busy}>
              {busy ? "Saving…" : "Save as draft"}
            </Button>
            <Button variant="gold" onClick={() => void save(true)} disabled={busy}>
              <Check className="mr-1 h-3 w-3" /> Publish
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
