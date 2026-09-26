import { useCallback } from "react";

export interface SkipLinkProps {
  /** Target element ID to jump and shift focus to (default: "main-content") */
  targetId?: string;
  /** Custom label for the link. If omitted, automatically detects language */
  label?: string;
  /** Optional active pathname for bilingual label resolution */
  currentPath?: string;
  /** Additional CSS class names */
  className?: string;
}

export function SkipLink({
  targetId = "main-content",
  label,
  currentPath,
  className = "",
}: SkipLinkProps) {
  const path =
    currentPath ||
    (typeof window !== "undefined" ? window.location.pathname : "/");
  const displayLabel = label || "Skip to main content";

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        // WCAG best practice: ensure target can receive programmatic focus
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }
        target.focus();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // Update URL hash without jumping
        if (typeof window !== "undefined" && window.history?.pushState) {
          window.history.pushState(null, "", `#${targetId}`);
        }
      }
    },
    [targetId]
  );

  return (
    <a
      href={`#${targetId}`}
      className={`skip-link ${className}`.trim()}
      onClick={handleClick}
      aria-label={displayLabel}
    >
      <span className="skip-link-icon" aria-hidden="true">&darr;</span>
      <span>{displayLabel}</span>
    </a>
  );
}

export default SkipLink;
