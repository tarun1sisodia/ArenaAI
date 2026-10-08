import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";
import { fetchLocationSuggestions, type LocationSuggestion } from "@/lib/api";

interface LocationAutocompleteInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocompleteInput({
  label,
  value,
  onChange,
  placeholder = "Search location / city...",
  className,
}: LocationAutocompleteInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced search query
  useEffect(() => {
    if (!isOpen) return;
    const clean = query.trim();
    if (clean.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      fetchLocationSuggestions(clean)
        .then((items) => {
          setSuggestions(items);
          setLoading(false);
        })
        .catch(() => {
          setSuggestions([]);
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(s: LocationSuggestion) {
    // If a clean city is present, prefer City, State (e.g. "Agra, Uttar Pradesh")
    const clean = s.city && s.state ? `${s.city}, ${s.state}` : s.displayName.split(",").slice(0, 3).join(",").trim();
    setQuery(clean);
    onChange(clean);
    setIsOpen(false);
    setSuggestions([]);
  }

  function handleClear() {
    setQuery("");
    onChange("");
    setSuggestions([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none">
          <MapPin className="h-4 w-4 text-gold" />
        </div>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="pl-8 pr-8"
        />
        {loading ? (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
          </div>
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {isOpen && (suggestions.length > 0 || loading) && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-hairline bg-surface shadow-xl py-1 text-xs divide-y divide-hairline">
          {loading && suggestions.length === 0 ? (
            <div className="px-3 py-2 text-ink-soft flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
              <span>Searching LocationIQ...</span>
            </div>
          ) : (
            suggestions.map((s, idx) => (
              <button
                key={s.placeId || idx}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 hover:bg-surface-raised flex items-start gap-2 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                <div className="overflow-hidden">
                  <div className="font-semibold text-ink truncate">{s.city || s.displayName.split(",")[0]}</div>
                  <div className="text-[11px] text-ink-soft truncate">{s.displayName}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
