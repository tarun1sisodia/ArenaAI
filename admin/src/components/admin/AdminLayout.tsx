import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { fetchAdminAuditLogs } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import type { AdminUser } from "@/lib/types";

const TITLES: Record<string, string> = {
  "/": "Operations Overview",
  "/bookings": "Booking Operations",
  "/finance": "Finance & Refunds",
  "/catalog": "Catalog CMS",
  "/reviews": "Review Moderation",
  "/inquiries": "Inquiries & Leads",
  "/fares": "Fare Rules",
  "/audit": "Audit Trail",
};

export function AdminLayout({
  user,
  onLogout,
}: {
  user: AdminUser;
  onLogout: () => void;
}) {
  const reduce = useReducedMotion();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("skb-admin-theme") as "light" | "dark") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("skb-admin-theme", theme);
  }, [theme]);

  const [notifications, setNotifications] = useState<
    Array<{ id: string; text: string; at: string; read: boolean }>
  >([]);

  useEffect(() => {
    let isMounted = true;
    fetchAdminAuditLogs(5)
      .then((logs) => {
        if (!isMounted || !Array.isArray(logs)) return;
        setNotifications(
          logs.map((log) => ({
            id: log.id,
            text: `${log.actor}: ${log.action.replace(/_/g, " ").toLowerCase()} · ${log.resourceType}${log.resourceId ? ` (${log.resourceId})` : ""}`,
            at: timeAgo(log.at),
            read: false,
          }))
        );
      })
      .catch(() => {
        if (isMounted) setNotifications([]);
      });
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  return (
    <div className="min-h-full">
      <Sidebar
        user={user}
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="lg:pl-64">
        <Topbar
          title={TITLES[location.pathname] ?? "Admin"}
          onMenu={() => setMobileOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          notifications={notifications}
        />
        <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
