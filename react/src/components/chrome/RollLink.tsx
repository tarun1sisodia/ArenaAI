import { type ReactNode } from "react";
import { prefetchDocument } from "../../app/prefetch";

export interface RollLinkProps {
  href: string;
  children: ReactNode;
  hasDropdown?: boolean;
  isActive?: boolean;
  className?: string;
  ariaLabel?: string;
  dataNav?: string;
  onNavigate?: () => void;
}

export function RollLink({
  href,
  children,
  hasDropdown = false,
  isActive = false,
  className = "",
  ariaLabel,
  dataNav,
  onNavigate,
}: RollLinkProps) {
  return (
    <a
      href={href}
      data-nav={dataNav}
      className={`roll-link ${isActive ? "is-active" : ""} ${className}`.trim()}
      aria-current={isActive ? "page" : undefined}
      aria-label={ariaLabel}
      aria-haspopup={hasDropdown ? "true" : undefined}
      onMouseEnter={() => prefetchDocument(href)}
      onFocus={() => prefetchDocument(href)}
      onClick={onNavigate}
    >
      <span className="text-fill">
        <span className="roll-label">{children}</span>
        {hasDropdown && (
          <svg
            className="nav-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </span>
      {isActive && <span className="roll-active-dot" aria-hidden="true" />}
    </a>
  );
}

export default RollLink;
