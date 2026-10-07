import { useEffect, useState } from "react";
import { Archive, Check, Image as ImageIcon, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, NumberInput, Select, Textarea } from "@/components/ui/Input";
import {
  archiveAdminTourPackage,
  checkTourPackageCode,
  createAdminTourPackage,
  deleteAdminTourPackage,
  fetchAdminTourPackages,
  publishAdminTourPackage,
  updateAdminTourPackage,
  uploadTourPackageImage,
} from "@/lib/api";
import { can, type AdminUser, type CatalogStatus, type TourPackageGalleryImage, type TourPackageItem } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const FLEET_KEYS = ["sedan", "ertiga", "innova", "tempo", "urbania"] as const;
const FLEET_LABELS: Record<string, string> = {
  sedan: "Sedan (4 Seater)",
  ertiga: "Ertiga (6 Seater)",
  innova: "Innova Crysta (6-7 Seater)",
  tempo: "Tempo Traveller (12 Seater)",
  urbania: "Force Urbania (16 Seater)",
};

export const HERITAGE_PHOTO_PRESETS = [
  { url: "/assets/places/gallery/taj-mahal-01.jpg", caption: "Taj Mahal reflection pool at dawn", alt: "Taj Mahal dawn reflection Agra" },
  { url: "/assets/places/gallery/taj-mahal-02.jpg", caption: "Taj Mahal marble archways & minarets", alt: "Taj Mahal dome architecture" },
  { url: "/assets/places/gallery/taj-mahal-03.jpg", caption: "Intricate floral pietra dura marble inlay", alt: "Pietra dura marble inlay details" },
  { url: "/assets/places/gallery/agra-fort-01.jpg", caption: "Amar Singh Gate at Agra Red Fort", alt: "Agra Fort red sandstone entrance" },
  { url: "/assets/places/gallery/agra-fort-02.jpg", caption: "Diwan-i-Khas marble royal pavilion", alt: "Diwan-i-Khas Agra Fort" },
  { url: "/assets/places/gallery/mehtab-bagh-01.jpg", caption: "Mehtab Bagh sunset vantage point", alt: "Mehtab Bagh across Yamuna River" },
  { url: "/assets/places/gallery/mathura-vrindavan-01.jpg", caption: "Prem Mandir & Banke Bihari illumination", alt: "Prem Mandir illuminated at night" },
  { url: "/assets/places/gallery/fatehpur-sikri-01.jpg", caption: "Buland Darwaza imperial gate", alt: "Buland Darwaza Fatehpur Sikri" },
  { url: "/assets/places/gallery/jaipur-pink-city-01.jpg", caption: "Hawa Mahal Palace of Winds", alt: "Hawa Mahal facade Jaipur" },
];

export const INCLUSION_PRESETS = [
  "Private AC Cab dedicated exclusively to your group",
  "Police-verified professional chauffeur & fuel charges",
  "All highway toll taxes & state border permits",
  "Parking charges at all monument sites",
  "Doorstep hotel / railway station pickup & drop",
  "Government approved ASI heritage guide assistance",
  "Chilled packaged drinking water bottles",
  "Prem Mandir & Krishna Janmabhoomi darshan coordination",
];

export const EXCLUSION_PRESETS = [
  "Monument entry tickets & camera/drone permits",
  "Meals, buffet lunches & personal snacks/dining",
  "Chauffeur / guide discretionary tips & gratuities",
  "Special temple VIP pooja / express darshan passes",
  "Personal shopping & handicraft purchases",
  "Unscheduled out-of-route deviations & waiting halts",
];

const emptyPackage = {
  name: "",
  packageCode: "",
  durationText: "1 Day",
  days: 1,
  nights: 0,
  baseTierCode: "sedan",
  startingPriceInr: 3499,
  fleetPrices: { sedan: 3499, ertiga: 4299, innova: 5299, tempo: 6999, urbania: 8999 },
  nightChargeInr: 300,
  source: "Agra",
  destination: "",
  inclusions: [
    "Private AC Cab dedicated exclusively to your group",
    "Police-verified professional chauffeur & fuel charges",
    "All highway toll taxes & state border permits",
    "Doorstep hotel / railway station pickup & drop",
    "Chilled packaged drinking water bottles",
  ] as string[],
  exclusions: [
    "Monument entry tickets & camera/drone permits",
    "Meals, buffet lunches & personal snacks/dining",
    "Chauffeur / guide discretionary tips & gratuities",
  ] as string[],
  inclusionsHighlight: "Private AC Cab, Chauffeur Allowance, Fuel & State Taxes",
  inclusionsNote: "",
  imageUrl: "/assets/packages/taj-dawn.webp",
  gallery: [] as TourPackageGalleryImage[],
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
  const [deleteTarget, setDeleteTarget] = useState<TourPackageItem | null>(null);

  // Gallery and image upload states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customImageCaption, setCustomImageCaption] = useState("");
  const [customImageAlt, setCustomImageAlt] = useState("");

  // Inclusions and Exclusions inputs
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");

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
    setCustomImageUrl("");
    setCustomImageCaption("");
    setCustomImageAlt("");
    setNewInclusion("");
    setNewExclusion("");
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
      nightChargeInr: pkg.nightChargeInr,
      source: pkg.source ?? "Agra",
      destination: pkg.destination ?? "",
      inclusions: Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0 ? [...pkg.inclusions] : [...emptyPackage.inclusions],
      exclusions: Array.isArray(pkg.exclusions) && pkg.exclusions.length > 0 ? [...pkg.exclusions] : [...emptyPackage.exclusions],
      inclusionsHighlight: pkg.inclusionsHighlight ?? "",
      inclusionsNote: pkg.inclusionsNote ?? "",
      imageUrl: pkg.imageUrl ?? "/assets/packages/taj-dawn.webp",
      gallery: Array.isArray(pkg.gallery) ? [...pkg.gallery] : [],
      status: pkg.status,
      isActive: pkg.isActive,
    });
    setCustomImageUrl("");
    setCustomImageCaption("");
    setCustomImageAlt("");
    setNewInclusion("");
    setNewExclusion("");
    setModalOpen(true);
  }

  function addInclusion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || form.inclusions.includes(trimmed)) return;
    setForm((p) => ({ ...p, inclusions: [...p.inclusions, trimmed] }));
  }

  function addCustomInclusion() {
    if (!newInclusion.trim()) return;
    addInclusion(newInclusion);
    setNewInclusion("");
  }

  function removeInclusion(idx: number) {
    setForm((p) => ({ ...p, inclusions: p.inclusions.filter((_, i) => i !== idx) }));
  }

  function addExclusion(text: string) {
    const trimmed = text.trim();
    if (!trimmed || form.exclusions.includes(trimmed)) return;
    setForm((p) => ({ ...p, exclusions: [...p.exclusions, trimmed] }));
  }

  function addCustomExclusion() {
    if (!newExclusion.trim()) return;
    addExclusion(newExclusion);
    setNewExclusion("");
  }

  function removeExclusion(idx: number) {
    setForm((p) => ({ ...p, exclusions: p.exclusions.filter((_, i) => i !== idx) }));
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

  async function optimizeImageForUpload(file: File, maxDim = 1920, quality = 0.85): Promise<{ base64: string; mimeType: "image/jpeg" | "image/png" | "image/webp" }> {
    if (file.size < 800 * 1024 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.includes(",") ? result.split(",")[1] : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return { base64, mimeType: file.type as any };
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context creation failed"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(outputType, quality);
        const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
        resolve({ base64, mimeType: outputType as any });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image for optimization"));
      };
      img.src = objectUrl;
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setError(null);
    try {
      const { base64, mimeType } = await optimizeImageForUpload(file);

      const res = await uploadTourPackageImage({
        dataBase64: base64,
        mimeType,
        altText: customImageAlt.trim() || form.name || "Tour photo",
        caption: customImageCaption.trim() || undefined,
      });

      if (res.url) {
        const newImg: TourPackageGalleryImage = {
          url: res.url,
          caption: customImageCaption.trim() || file.name.replace(/\.[^/.]+$/, ""),
          alt: customImageAlt.trim() || form.name || "Tour photo",
        };
        setForm((prev) => ({
          ...prev,
          imageUrl: prev.imageUrl || res.url,
          gallery: [...prev.gallery, newImg],
        }));
        setCustomImageUrl("");
        setCustomImageCaption("");
        setCustomImageAlt("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  }

  function addPresetPhoto(preset: { url: string; caption: string; alt: string }) {
    if (form.gallery.some((g) => g.url === preset.url)) return;
    setForm((prev) => ({
      ...prev,
      imageUrl: prev.imageUrl || preset.url,
      gallery: [...prev.gallery, { url: preset.url, caption: preset.caption, alt: preset.alt }],
    }));
  }

  function addCustomPhoto() {
    const url = customImageUrl.trim();
    if (!url) return;
    if (form.gallery.some((g) => g.url === url)) return;
    setForm((prev) => ({
      ...prev,
      imageUrl: prev.imageUrl || url,
      gallery: [
        ...prev.gallery,
        {
          url,
          caption: customImageCaption.trim() || form.name,
          alt: customImageAlt.trim() || form.name,
        },
      ],
    }));
    setCustomImageUrl("");
    setCustomImageCaption("");
    setCustomImageAlt("");
  }

  function removeGalleryPhoto(idx: number) {
    setForm((prev) => {
      const next = prev.gallery.filter((_, i) => i !== idx);
      const nextCover = prev.imageUrl === prev.gallery[idx]?.url ? (next[0]?.url ?? null) : prev.imageUrl;
      return { ...prev, gallery: next, imageUrl: nextCover };
    });
  }

  function setCoverPhoto(url: string) {
    setForm((prev) => ({ ...prev, imageUrl: url }));
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
        night_charge_inr: Number(form.nightChargeInr) || 0,
        source: form.source.trim() || "Agra",
        destination: form.destination.trim() || "",
        inclusions: form.inclusions,
        exclusions: form.exclusions,
        inclusions_highlight: form.inclusionsHighlight.trim() || undefined,
        inclusions_note: form.inclusionsNote.trim() || undefined,
        image_url: form.imageUrl?.trim() || undefined,
        gallery: form.gallery,
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteAdminTourPackage(deleteTarget.id);
      await reload();
      setDeleteTarget(null);
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
              <div className="flex items-start gap-3.5">
                {pkg.imageUrl ? (
                  <img
                    src={pkg.imageUrl}
                    alt={pkg.name}
                    className="h-14 w-20 rounded-lg object-cover border border-hairline shrink-0 bg-surface-raised shadow-xs"
                  />
                ) : (
                  <div className="h-14 w-20 rounded-lg border border-hairline bg-surface-raised/60 flex items-center justify-center shrink-0 text-ink-soft">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink">{pkg.name}</span>
                    <Badge tone={pkg.status === "published" ? "success" : pkg.status === "draft" ? "gold" : "neutral"}>
                      {pkg.status}
                    </Badge>
                    {pkg.gallery && pkg.gallery.length > 0 && (
                      <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-ink font-semibold border border-hairline flex items-center gap-1">
                        <ImageIcon className="h-3 w-3 text-gold" /> {pkg.gallery.length} photos
                      </span>
                    )}
                    <span className="text-xs text-ink-soft">({pkg.durationText})</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink-soft flex items-center gap-2 flex-wrap">
                    <span>/packages/{pkg.packageCode}</span>
                    <span>·</span>
                    <span className="text-primary font-medium">📍 {pkg.source || "Agra"} → {pkg.destination || "Tour"}</span>
                    <span>·</span>
                    <span>From {formatINR(pkg.startingPriceInr)}</span>
                    {Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0 && (
                      <span className="text-emerald-400 font-sans text-[11px] font-medium">✓ {pkg.inclusions.length} incl</span>
                    )}
                    {Array.isArray(pkg.exclusions) && pkg.exclusions.length > 0 && (
                      <span className="text-rose-400 font-sans text-[11px] font-medium">✗ {pkg.exclusions.length} excl</span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-ink-soft">
                    {FLEET_KEYS.map((k) => (
                      <span key={k} className="rounded bg-surface-raised px-1.5 py-0.5 border border-hairline font-mono">
                        {k}: {pkg.fleetPrices[k] ? formatINR(pkg.fleetPrices[k]) : "—"}
                      </span>
                    ))}
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
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleteTarget(pkg)} disabled={busy} title="Delete draft">
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
        description="Configure fixed commercial fares across the 5 canonical vehicle tiers, durations, and inclusions."
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
              <NumberInput
                min={1}
                max={30}
                value={form.days}
                onChange={(v) => setForm((p) => ({ ...p, days: v || 1 }))}
              />
            </div>
            <div>
              <Label>Nights</Label>
              <NumberInput
                min={0}
                max={30}
                value={form.nights}
                onChange={(v) => setForm((p) => ({ ...p, nights: v }))}
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
                  <NumberInput
                    value={form.fleetPrices[k] ?? 0}
                    onChange={(v) => setFleetPrice(k, v)}
                    placeholder="₹"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Night Charge per Night (₹)</Label>
              <NumberInput
                value={form.nightChargeInr}
                onChange={(v) => setForm((p) => ({ ...p, nightChargeInr: v }))}
                placeholder="₹"
              />
            </div>

          </div>

          {/* Source and Destination Corridor */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Source / Pickup Location</Label>
              <Input
                value={form.source}
                onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                placeholder="e.g. Agra, Delhi NCR, Jaipur"
              />
            </div>
            <div>
              <Label>Destination / Route Covered</Label>
              <Input
                value={form.destination}
                onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
                placeholder="e.g. Mathura & Vrindavan, Taj Mahal & Fatehpur Sikri"
              />
            </div>
          </div>

          <div>
            <Label>Inclusions Highlight (Short summary)</Label>
            <Input
              value={form.inclusionsHighlight}
              onChange={(e) => setForm((p) => ({ ...p, inclusionsHighlight: e.target.value }))}
              placeholder="e.g. AC Cab, Fuel, Chauffeur, Sightseeing, Tolls"
            />
          </div>

          {/* Interactive Inclusions Manager */}
          <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-ink text-sm">Package Inclusions (What is included)</h4>
                <p className="text-xs text-ink-soft">Displays as verified green checkmarks on customer cards and detail pages.</p>
              </div>
              <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-xs font-semibold">
                {form.inclusions.length} {form.inclusions.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-medium text-ink-soft block mb-1">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {INCLUSION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addInclusion(preset)}
                    disabled={form.inclusions.includes(preset)}
                    className="text-[11px] rounded-full border border-hairline px-2.5 py-0.5 bg-surface hover:bg-surface-raised text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="flex gap-2">
              <Input
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                placeholder="Add custom inclusion..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomInclusion(); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomInclusion}>
                Add
              </Button>
            </div>

            {/* Active Inclusions Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {form.inclusions.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 text-xs">
                  <span>✓</span> {item}
                  <button type="button" onClick={() => removeInclusion(idx)} className="hover:text-red-400 font-bold ml-1">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Exclusions Manager */}
          <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-ink text-sm">Package Exclusions (What is NOT included)</h4>
                <p className="text-xs text-ink-soft">Displays as clear exclusion items to prevent customer confusion.</p>
              </div>
              <span className="rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 text-xs font-semibold">
                {form.exclusions.length} {form.exclusions.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-medium text-ink-soft block mb-1">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {EXCLUSION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addExclusion(preset)}
                    disabled={form.exclusions.includes(preset)}
                    className="text-[11px] rounded-full border border-hairline px-2.5 py-0.5 bg-surface hover:bg-surface-raised text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="flex gap-2">
              <Input
                value={newExclusion}
                onChange={(e) => setNewExclusion(e.target.value)}
                placeholder="Add custom exclusion..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomExclusion(); } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomExclusion}>
                Add
              </Button>
            </div>

            {/* Active Exclusions Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {form.exclusions.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 text-xs">
                  <span>✗</span> {item}
                  <button type="button" onClick={() => removeExclusion(idx)} className="hover:text-red-400 font-bold ml-1">×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <Label>Inclusions & Exclusions Detail Note (Optional)</Label>
            <Textarea
              rows={2}
              value={form.inclusionsNote ?? ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, inclusionsNote: e.target.value }))}
              placeholder="Monument entrance tickets and personal meals not included..."
            />
          </div>

          {/* Showcase Photos & Multi-Image Gallery Manager */}
          <div className="rounded-lg border border-hairline p-4 bg-surface-raised/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-ink text-sm flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-gold" /> Cover Image & Showcase Gallery
                </h4>
                <p className="text-xs text-ink-soft mt-0.5">
                  Attach multiple real photos. The customer site displays an interactive thumbnail switcher, counter badge, and full-resolution lightbox modal.
                </p>
              </div>
              <span className="rounded bg-gold/15 px-2 py-0.5 text-xs text-gold font-semibold">
                {form.gallery.length} {form.gallery.length === 1 ? "Photo" : "Photos"}
              </span>
            </div>

            {/* Active Gallery Thumbnails Grid */}
            {form.gallery.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {form.gallery.map((img, idx) => {
                  const isCover = form.imageUrl === img.url;
                  return (
                    <div
                      key={idx}
                      className={`relative rounded-lg overflow-hidden border p-1 bg-surface-1 transition-all ${
                        isCover ? "border-gold ring-2 ring-gold/30" : "border-hairline"
                      }`}
                    >
                      <div className="aspect-[16/10] w-full rounded overflow-hidden relative bg-black/10">
                        <img src={img.url} alt={img.alt || form.name} className="w-full h-full object-cover" />
                        {isCover && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-gold text-ink-charcoal font-bold text-[10px] uppercase shadow-xs">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeGalleryPhoto(idx)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                          title="Remove photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="mt-1 px-1">
                        <p className="text-[11px] font-medium text-ink truncate" title={img.caption || img.url}>
                          {img.caption || "Photo " + (idx + 1)}
                        </p>
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => setCoverPhoto(img.url)}
                            className="mt-0.5 text-[10px] text-gold hover:underline font-semibold block"
                          >
                            Make Cover Photo
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Photos Toolbar */}
            <div className="rounded border border-hairline/80 bg-surface-raised/40 p-3 space-y-3">
              <span className="text-xs font-semibold text-ink block">Add Photos to Gallery</span>

              {/* Option A: Direct File Upload */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gold text-ink-charcoal text-xs font-semibold hover:bg-gold-dark transition-colors cursor-pointer shadow-xs">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isUploadingImage ? "Uploading Photo..." : "Upload Photo File"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleFileUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-ink-soft">or choose from verified Agra heritage library below</span>
              </div>

              {/* Option B: Choose from Presets */}
              <div>
                <Label className="text-[11px] text-ink-soft mb-1.5">Quick Presets (Agra Heritage & Monument Photos)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {HERITAGE_PHOTO_PRESETS.map((preset) => {
                    const alreadyAdded = form.gallery.some((g) => g.url === preset.url);
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => addPresetPhoto(preset)}
                        disabled={alreadyAdded}
                        className={`text-[11px] px-2 py-1 rounded border transition-all flex items-center gap-1 ${
                          alreadyAdded
                            ? "border-hairline text-ink-soft opacity-50 cursor-not-allowed bg-surface-raised"
                            : "border-hairline text-ink hover:border-gold hover:text-gold bg-canvas-pure"
                        }`}
                      >
                        <span>{preset.caption}</span>
                        {alreadyAdded && <Check className="h-2.5 w-2.5 text-green-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option C: Custom URL or Site Asset Path */}
              <div className="grid gap-2 sm:grid-cols-3 pt-1 border-t border-hairline/60">
                <div className="sm:col-span-2">
                  <Input
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="Paste Image URL or /assets/... path"
                    className="text-xs"
                  />
                </div>
                <div>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={addCustomPhoto} disabled={!customImageUrl.trim()}>
                    Add to Gallery
                  </Button>
                </div>
              </div>
            </div>
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

      {/* Delete confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete draft package"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.name}"? This action cannot be undone.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()} disabled={busy}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete draft
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
