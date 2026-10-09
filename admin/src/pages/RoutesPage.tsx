import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/Button";
import { RouteCatalogPanel } from "@/modules/routes";
import { fetchCatalogManifestStatus, republishCatalogManifest } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import type { AdminUser } from "@/lib/types";

export function RoutesPage({ user }: { user: AdminUser }) {
  const [manifestStatus, setManifestStatus] = useState<{
    version: number;
    updatedAt: string;
    routeCount?: number;
    packageCount?: number;
  } | null>(null);
  const [isRepublishing, setIsRepublishing] = useState(false);
  const [republishSuccess, setRepublishSuccess] = useState<string | null>(null);

  const loadManifestStatus = () => {
    fetchCatalogManifestStatus()
      .then(setManifestStatus)
      .catch((e) => console.warn("Failed to load manifest status", e));
  };

  useEffect(() => {
    loadManifestStatus();
  }, []);

  async function handleRepublish() {
    setIsRepublishing(true);
    setRepublishSuccess(null);
    try {
      const res = await republishCatalogManifest();
      setManifestStatus(res);
      setRepublishSuccess(`Site manifest updated to v${res.version} (${res.routeCount ?? 0} routes).`);
    } catch (err) {
      console.error("Republish failed:", err);
      alert(err instanceof Error ? err.message : "Failed to republish site manifest.");
    } finally {
      setIsRepublishing(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Corridors & Network"
        title="Intercity Routes"
        description="Highway corridors, distances, LocationIQ landmarks, and 5-fleet fare rates across northern India."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRepublish}
              disabled={isRepublishing}
              title={
                manifestStatus
                  ? `Manifest v${manifestStatus.version} • last published ${formatDate(manifestStatus.updatedAt)}`
                  : "Regenerate public site data"
              }
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isRepublishing && "animate-spin")} />
              Republish site data
            </Button>
          </div>
        }
      />

      {/* Manifest strip + republish feedback */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
        <span>
          {manifestStatus
            ? `Public site manifest v${manifestStatus.version} • ${manifestStatus.routeCount ?? 0} routes • updated ${formatDate(manifestStatus.updatedAt)}`
            : "Public site manifest status unavailable."}
        </span>
        {republishSuccess && (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {republishSuccess}
          </span>
        )}
      </div>

      <RouteCatalogPanel user={user} />
    </div>
  );
}
