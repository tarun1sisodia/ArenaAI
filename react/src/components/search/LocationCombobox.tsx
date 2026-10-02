/**
 * Searchable Location Combobox Component (Step R6.2)
 *
 * Provides:
 * 1. Touch-friendly combobox with autocomplete suggestions.
 * 2. 25+ curated offline Indian destinations with airport/station/heritage icons.
 * 3. Live LocationIQ address autocomplete with 300ms debounce via useLocationIQ hook.
 * 4. Full keyboard navigation (ArrowUp, ArrowDown, Enter, Escape).
 * 5. ARIA 1.2 combobox accessibility standards.
 * 6. Non-interactive LocationIQ status indicator. Live search runs only
 *    through the secure backend proxy, which holds the token server-side;
 *    the browser holds no token and nothing is displayed or editable here
 *    (2026-10-02 security fix).
 * 7. Clean White light mode and Solar Dusk dark mode design tokens compliance.
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useLocationIQ,
  type LocationSuggestion,
} from "../../hooks/useLocationIQ";

/** Curated Indian destinations available even when offline or without API token */
export interface StaticDestination {
  id: string;
  name: string;
  state: string;
  code: string;
  desc: string;
  popular: boolean;
  type?: "city" | "airport" | "railway" | "heritage";
}

export const STATIC_DESTINATIONS: readonly StaticDestination[] = [
  {
    id: "agra",
    name: "Agra",
    state: "Uttar Pradesh",
    code: "AGR",
    desc: "Taj Mahal, Agra Fort, Agra Cantt",
    popular: true,
    type: "heritage",
  },
  {
    id: "delhi",
    name: "Delhi (IGI Airport / NCR)",
    state: "Delhi NCR",
    code: "DEL",
    desc: "Terminal 1/2/3, New Delhi Rly",
    popular: true,
    type: "airport",
  },
  {
    id: "jaipur",
    name: "Jaipur (Pink City)",
    state: "Rajasthan",
    code: "JAI",
    desc: "Hawa Mahal, Amber Fort, Airport",
    popular: true,
    type: "heritage",
  },
  {
    id: "mathura",
    name: "Mathura",
    state: "Uttar Pradesh",
    code: "MAT",
    desc: "Krishna Janmabhoomi, Yamuna Ghats",
    popular: true,
    type: "heritage",
  },
  {
    id: "vrindavan",
    name: "Vrindavan",
    state: "Uttar Pradesh",
    code: "VRN",
    desc: "Prem Mandir, Banke Bihari, ISKCON",
    popular: true,
    type: "heritage",
  },
  {
    id: "gwalior",
    name: "Gwalior",
    state: "Madhya Pradesh",
    code: "GWL",
    desc: "Gwalior Fort, Jai Vilas Palace",
    popular: true,
    type: "heritage",
  },
  {
    id: "lucknow",
    name: "Lucknow",
    state: "Uttar Pradesh",
    code: "LKO",
    desc: "Rumi Darwaza, Airport, Charbagh",
    popular: true,
    type: "city",
  },
  {
    id: "ayodhya",
    name: "Ayodhya",
    state: "Uttar Pradesh",
    code: "AYD",
    desc: "Shri Ram Janmabhoomi, Airport",
    popular: true,
    type: "heritage",
  },
  {
    id: "varanasi",
    name: "Varanasi (Kashi)",
    state: "Uttar Pradesh",
    code: "VNS",
    desc: "Kashi Vishwanath, Dashashwamedh",
    popular: true,
    type: "heritage",
  },
  {
    id: "rishikesh",
    name: "Rishikesh",
    state: "Uttarakhand",
    code: "RKSH",
    desc: "Triveni Ghat, Laxman Jhula",
    popular: true,
    type: "heritage",
  },
  {
    id: "haridwar",
    name: "Haridwar",
    state: "Uttarakhand",
    code: "HW",
    desc: "Har Ki Pauri, Ganga Aarti",
    popular: true,
    type: "heritage",
  },
  {
    id: "dehradun",
    name: "Dehradun / Mussoorie",
    state: "Uttarakhand",
    code: "DED",
    desc: "Jolly Grant Airport, Mall Road",
    popular: false,
    type: "airport",
  },
  {
    id: "chandigarh",
    name: "Chandigarh",
    state: "Punjab/Haryana",
    code: "IXC",
    desc: "Sukhna Lake, Sector 17",
    popular: true,
    type: "city",
  },
  {
    id: "shimla",
    name: "Shimla",
    state: "Himachal Pradesh",
    code: "SML",
    desc: "The Ridge, Mall Road, Kufri",
    popular: true,
    type: "city",
  },
  {
    id: "manali",
    name: "Manali & Solang",
    state: "Himachal Pradesh",
    code: "MNL",
    desc: "Solang Valley, Rohtang, Atal Tunnel",
    popular: true,
    type: "city",
  },
  {
    id: "fatehpur-sikri",
    name: "Fatehpur Sikri",
    state: "Uttar Pradesh",
    code: "FTS",
    desc: "Buland Darwaza, Salim Chishti",
    popular: true,
    type: "heritage",
  },
  {
    id: "bharatpur",
    name: "Bharatpur",
    state: "Rajasthan",
    code: "BTP",
    desc: "Keoladeo National Bird Sanctuary",
    popular: false,
    type: "heritage",
  },
  {
    id: "noida",
    name: "Noida / Greater Noida",
    state: "Uttar Pradesh",
    code: "NOI",
    desc: "Pari Chowk, Sector 18, Expressway",
    popular: false,
    type: "city",
  },
  {
    id: "gurgaon",
    name: "Gurugram (Gurgaon)",
    state: "Haryana",
    code: "GGN",
    desc: "Cyber City, DLF, Golf Course Rd",
    popular: false,
    type: "city",
  },
  {
    id: "amritsar",
    name: "Amritsar",
    state: "Punjab",
    code: "ATQ",
    desc: "Golden Temple, Wagah Border",
    popular: false,
    type: "heritage",
  },
  {
    id: "udaipur",
    name: "Udaipur",
    state: "Rajasthan",
    code: "UDR",
    desc: "City Palace, Lake Pichola",
    popular: false,
    type: "heritage",
  },
  {
    id: "jodhpur",
    name: "Jodhpur",
    state: "Rajasthan",
    code: "JDH",
    desc: "Mehrangarh Fort, Blue City",
    popular: false,
    type: "heritage",
  },
  {
    id: "ajmer",
    name: "Ajmer / Pushkar",
    state: "Rajasthan",
    code: "AII",
    desc: "Dargah Sharif, Brahma Temple",
    popular: false,
    type: "heritage",
  },
  {
    id: "prayagraj",
    name: "Prayagraj (Allahabad)",
    state: "Uttar Pradesh",
    code: "PRG",
    desc: "Triveni Sangam, Civil Lines",
    popular: false,
    type: "heritage",
  },
  {
    id: "nainital",
    name: "Nainital",
    state: "Uttarakhand",
    code: "NNT",
    desc: "Naini Lake, Mallital",
    popular: false,
    type: "city",
  },
];

/** Resolves an appropriate contextual emoji icon based on name and category */
export function resolveLocationIcon(item: {
  name: string;
  subtitle?: string;
  desc?: string;
  code?: string;
  type?: string;
  isLocationIQ?: boolean;
}): string {
  if (item.type === "airport") return "✈️";
  if (item.type === "railway") return "🚆";
  if (item.type === "heritage") return "🏛️";

  const text = `${item.name} ${item.subtitle || ""} ${item.desc || ""}`.toLowerCase();

  if (
    text.includes("airport") ||
    text.includes("igi") ||
    text.includes("terminal") ||
    text.includes("aerodrome") ||
    item.code === "DEL" ||
    item.code === "DED" ||
    item.code === "IXC"
  ) {
    return "✈️";
  }

  if (
    text.includes("railway") ||
    text.includes("station") ||
    text.includes("junction") ||
    text.includes("cantt") ||
    text.includes("rly")
  ) {
    return "🚆";
  }

  if (
    text.includes("taj") ||
    text.includes("fort") ||
    text.includes("mandir") ||
    text.includes("temple") ||
    text.includes("ghat") ||
    text.includes("mahal") ||
    text.includes("palace") ||
    text.includes("ashram") ||
    text.includes("darwaza") ||
    text.includes("sanctuary")
  ) {
    return "🏛️";
  }

  if (
    text.includes("valley") ||
    text.includes("tunnel") ||
    text.includes("ridge") ||
    text.includes("kufri") ||
    text.includes("hill") ||
    text.includes("solang") ||
    text.includes("mussoorie") ||
    text.includes("lake")
  ) {
    return "🏔️";
  }

  if (item.isLocationIQ) {
    return "📍";
  }

  return "🏙️";
}

export interface LocationComboboxProps {
  /** Current selected value (e.g. "Agra", "Delhi") */
  value: string;
  /** Callback fired when a location is selected or typed */
  onChange: (val: string, item?: LocationSuggestion) => void;
  /** Input placeholder string */
  placeholder?: string;
  /** Accessible label for the combobox */
  label?: string;
  /** Component element ID */
  id?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Optional custom CSS class */
  className?: string;
  /** Quick recommendation pill tags shown in dropdown */
  quickTags?: string[];
  /** Whether to show the LocationIQ token status badge */
  showLocationIqBadge?: boolean;
  /** Icon displayed in the closed trigger button */
  triggerIcon?: string;
}

export function LocationCombobox({
  value,
  onChange,
  placeholder = "Search city, airport, landmark...",
  label = "Select Location",
  id: customId,
  disabled = false,
  className = "",
  quickTags = ["Agra", "Delhi", "Jaipur", "Mathura", "Vrindavan"],
  showLocationIqBadge = true,
  triggerIcon = "📍",
}: LocationComboboxProps): React.JSX.Element {
  const generatedId = useId();
  const comboboxId = customId || `loc-combobox-${generatedId}`;
  const listboxId = `loc-listbox-${generatedId}`;

  // Dropdown open / close state
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [statusMessage, setStatusMessage] = useState("");

  // Container refs for click-outside and focus management
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Hook into typed LocationIQ engine.
  // NOTE (2026-10-02): live search runs only through the secure backend
  // proxy at /api/v1/locations/autocomplete, which holds the token
  // server-side. The browser holds no token; when the proxy returns no
  // results the curated static destinations below are shown instead.
  const {
    query,
    setQuery,
    results: iqResults,
    isLoading,
    liveSearchAvailable,
  } = useLocationIQ("", { debounceMs: 300, minQueryLength: 2, limit: 5 });

  // Filter static destinations based on user query
  const staticMatches = useMemo((): LocationSuggestion[] => {
    const q = query.trim().toLowerCase();
    const list = q
      ? STATIC_DESTINATIONS.filter(
          (dest) =>
            dest.name.toLowerCase().includes(q) ||
            dest.desc.toLowerCase().includes(q) ||
            dest.state.toLowerCase().includes(q) ||
            dest.code.toLowerCase().includes(q)
        )
      : STATIC_DESTINATIONS.filter((dest) => dest.popular);

    return list.map((dest) => ({
      id: `static-${dest.id}`,
      name: dest.name,
      subtitle: `${dest.desc} · ${dest.state}`,
      code: dest.code,
      isLocationIQ: false,
    }));
  }, [query]);

  // Combined suggestions: LocationIQ results at top (if present), followed by matching static destinations
  const combinedSuggestions = useMemo((): LocationSuggestion[] => {
    if (iqResults.length > 0) {
      // Deduplicate static destinations that might overlap
      const iqNames = new Set(iqResults.map((r) => r.name.toLowerCase()));
      const filteredStatic = staticMatches.filter(
        (s) => !iqNames.has(s.name.toLowerCase())
      );
      return [...iqResults, ...filteredStatic];
    }
    return staticMatches;
  }, [iqResults, staticMatches]);

  // Screen reader announcements for ARIA 1.2 compliance
  useEffect(() => {
    if (!isOpen) {
      setStatusMessage("");
      return;
    }
    if (isLoading) {
      setStatusMessage("Searching address suggestions...");
    } else if (combinedSuggestions.length === 0) {
      setStatusMessage(
        query.trim().length >= 2
          ? `No exact matches found for "${query}". Press Enter to select custom address.`
          : "Type at least 2 characters to search destinations."
      );
    } else {
      setStatusMessage(
        `${combinedSuggestions.length} destination suggestion${combinedSuggestions.length === 1 ? "" : "s"} available. Use arrow keys to navigate, and Enter to select.`
      );
    }
  }, [isOpen, isLoading, combinedSuggestions.length, query]);

  // Open dropdown
  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setActiveIdx(-1);
    // Initialize search input with empty or focused
    setQuery("");
  }, [disabled, setQuery]);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setActiveIdx(-1);
  }, []);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Small timeout for DOM render
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle selection of a location item
  const handleSelect = useCallback(
    (item: LocationSuggestion) => {
      onChange(item.name, item);
      closeDropdown();
      triggerBtnRef.current?.focus();
    },
    [onChange, closeDropdown]
  );

  // Handle quick tag click
  const handleQuickTagClick = useCallback(
    (tagName: string) => {
      const match = STATIC_DESTINATIONS.find(
        (d) => d.name.toLowerCase() === tagName.toLowerCase()
      );
      if (match) {
        handleSelect({
          id: `static-${match.id}`,
          name: match.name,
          subtitle: `${match.desc} · ${match.state}`,
          code: match.code,
          isLocationIQ: false,
        });
      } else {
        onChange(tagName);
        closeDropdown();
        triggerBtnRef.current?.focus();
      }
    },
    [handleSelect, onChange, closeDropdown]
  );

  // Keyboard navigation within the dropdown
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (combinedSuggestions.length === 0) {
        if (e.key === "Escape") {
          e.preventDefault();
          closeDropdown();
          triggerBtnRef.current?.focus();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setActiveIdx((prev) => {
            const next = prev + 1 >= combinedSuggestions.length ? 0 : prev + 1;
            scrollItemIntoView(next);
            return next;
          });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setActiveIdx((prev) => {
            const next = prev - 1 < 0 ? combinedSuggestions.length - 1 : prev - 1;
            scrollItemIntoView(next);
            return next;
          });
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (activeIdx >= 0 && activeIdx < combinedSuggestions.length) {
            handleSelect(combinedSuggestions[activeIdx]);
          } else if (query.trim().length > 0) {
            // Select custom typed query as fallback
            onChange(query.trim());
            closeDropdown();
            triggerBtnRef.current?.focus();
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          closeDropdown();
          triggerBtnRef.current?.focus();
          break;
        }
        case "Home": {
          e.preventDefault();
          if (combinedSuggestions.length > 0) {
            setActiveIdx(0);
            scrollItemIntoView(0);
          }
          break;
        }
        case "End": {
          e.preventDefault();
          if (combinedSuggestions.length > 0) {
            const last = combinedSuggestions.length - 1;
            setActiveIdx(last);
            scrollItemIntoView(last);
          }
          break;
        }
        case "PageDown": {
          e.preventDefault();
          setActiveIdx((prev) => {
            const next = Math.min(
              combinedSuggestions.length - 1,
              (prev < 0 ? 0 : prev) + 5
            );
            scrollItemIntoView(next);
            return next;
          });
          break;
        }
        case "PageUp": {
          e.preventDefault();
          setActiveIdx((prev) => {
            const next = Math.max(0, prev - 5);
            scrollItemIntoView(next);
            return next;
          });
          break;
        }
        case "Tab": {
          closeDropdown();
          break;
        }
      }
    },
    [combinedSuggestions, activeIdx, query, handleSelect, onChange, closeDropdown]
  );

  // Scroll highlighted item into view during arrow navigation
  const scrollItemIntoView = (index: number) => {
    if (!listboxRef.current) return;
    const itemEl = listboxRef.current.children[index] as HTMLElement | undefined;
    if (itemEl) {
      itemEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`loc-picker ${className}`.trim()}
      id={comboboxId}
    >
      {/* 1. Main Trigger Button */}
      <button
        ref={triggerBtnRef}
        type="button"
        role="combobox"
        className="loc-display-btn"
        onClick={isOpen ? closeDropdown : openDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={label}
        id={`${comboboxId}-btn`}
      >
        <span className="loc-pin" aria-hidden="true">
          {/^[a-z0-9_]+$/.test(triggerIcon) ? (
            <span className="material-symbols-outlined">{triggerIcon}</span>
          ) : triggerIcon}
        </span>
        <span className={`loc-value ${!value ? "is-empty" : ""}`}>
          {value || placeholder}
        </span>
        <span className="loc-chevron" aria-hidden="true">
          ▼
        </span>
      </button>

      {/* 2. Dropdown Floating Panel */}
      {isOpen && (
        <div className="loc-dropdown" role="dialog" aria-modal="false">
          {/* 2a. Search Input Header */}
          <div className="loc-search-head">
            <span className="loc-search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              role="combobox"
              className="loc-search-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type city, landmark, station, or airport..."
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-describedby={`${comboboxId}-status`}
              aria-activedescendant={
                activeIdx >= 0 ? `${comboboxId}-opt-${activeIdx}` : undefined
              }
              aria-label="Search destination"
            />
            {isLoading && (
              <span
                className="loc-spinner"
                aria-label="Searching LocationIQ..."
                title="Searching..."
              >
                ⏳
              </span>
            )}

            {/* LocationIQ status indicator (non-interactive). Live search
                runs through the secure backend proxy; the browser holds no
                token and nothing here can expose or edit one. */}
            {showLocationIqBadge && (
              <span
                className={`loc-api-tag ${liveSearchAvailable ? "is-active" : ""}`}
                title={
                  liveSearchAvailable
                    ? "LocationIQ live search available"
                    : "LocationIQ live search unavailable — showing curated destinations"
                }
              >
                {liveSearchAvailable ? "● LocationIQ Active" : "○ Curated List"}
              </span>
            )}
          </div>

          {/* 2b. Quick Popular Suggestion Pills */}
          {quickTags.length > 0 && (
            <div className="loc-quick-tags" aria-label="Popular Quick Picks">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="loc-tag"
                  onClick={() => handleQuickTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* 2d. Suggestions Listbox */}
          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            className="loc-results"
            aria-label="Location Suggestions"
          >
            {combinedSuggestions.length === 0 ? (
              <div className="loc-empty">
                {query.trim().length >= 2
                  ? `No exact matches found for "${query}". Press Enter to use as custom location.`
                  : "Type at least 2 characters to search addresses..."}
              </div>
            ) : (
              combinedSuggestions.map((item, idx) => {
                const isSelected = idx === activeIdx;
                const icon = resolveLocationIcon(item);

                return (
                  <div
                    key={item.id}
                    id={`${comboboxId}-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`loc-result-item ${
                      isSelected ? "is-selected" : ""
                    }`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIdx(idx)}
                  >
                    <span className="loc-item-icon" aria-hidden="true">
                      {icon}
                    </span>
                    <div className="loc-item-text">
                      <div className="loc-item-name">{item.name}</div>
                      <div className="loc-item-sub">{item.subtitle}</div>
                    </div>
                    {item.code && (
                      <span className="loc-item-code">{item.code}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. Screen Reader Live Status Region */}
      <div
        id={`${comboboxId}-status`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>
    </div>
  );
}

export default LocationCombobox;
