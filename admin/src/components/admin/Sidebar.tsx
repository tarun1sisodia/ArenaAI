import { NavLink, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Compass,
  IndianRupee,
  LayoutDashboard,
  Library,
  LogOut,
  MessageSquare,
  Car,
  ScrollText,
  Star,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { BrandMark } from "./BrandMark";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, type AdminUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/finance", label: "Finance & Refunds", icon: IndianRupee },
  { to: "/catalog", label: "Catalog CMS", icon: Library },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/inquiries", label: "Inquiries", icon: MessageSquare },
  { to: "/rental-requests", label: "Rental Requests", icon: Car },
  { to: "/fares", label: "Fare Rules", icon: Compass },
  { to: "/audit", label: "Audit Log", icon: ScrollText },
];

export function Sidebar({
  user,
  onLogout,
  mobileOpen,
  onMobileClose,
}: {
  user: AdminUser;
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const content = (
    <div className="flex h-full flex-col gap-6 p-5">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <BrandMark size={38} />
        <div>
          <p className="font-display text-[17px] font-semibold leading-tight tracking-tight text-ink">
            SK Baghel
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
            Admin Desk
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1" aria-label="Admin">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item, i) => (
            <motion.li
              key={item.to}
              initial={reduce ? { opacity: 1 } : { opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.045, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <NavLink
                to={item.to}
                end={item.to === "/"}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  cn(
                    "group relative flex min-h-[44px] items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-gold-text"
                      : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        transition={{ type: "spring", stiffness: 480, damping: 36 }}
                        className="absolute inset-0 rounded-sm border border-gold-border bg-gold-soft"
                      />
                    )}
                    <item.icon
                      className={cn(
                        "relative z-10 h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-gold" : "text-ink-faint group-hover:text-ink"
                      )}
                    />
                    <span className="relative z-10">{item.label}</span>
                    {item.badge ? (
                      <span className="relative z-10 ml-auto rounded-pill bg-gold px-1.5 py-px font-mono text-[10px] text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Role + user */}
      <div className="space-y-3">
        <div className="rounded-sm border border-hairline bg-surface-2 p-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-pill bg-ink font-display text-sm font-semibold text-gold">
              {user.name.slice(0, 1)}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
              <Badge tone="gold" className="mt-0.5">{ROLE_LABELS[user.role]}</Badge>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            onLogout();
            navigate("/login");
          }}
          className="flex min-h-[44px] w-full items-center gap-2 rounded-sm px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-error-soft hover:text-error"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-hairline bg-bg-alt lg:block">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/40"
            onClick={onMobileClose}
          />
          <motion.aside
            initial={reduce ? { opacity: 0 } : { x: -280 }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="absolute inset-y-0 left-0 w-72 border-r border-hairline bg-bg-alt"
          >
            {content}
          </motion.aside>
        </div>
      )}
    </>
  );
}
