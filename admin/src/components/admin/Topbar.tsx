import { useEffect, useState } from "react";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function Topbar({
  title,
  onMenu,
  theme,
  onToggleTheme,
  notifications,
}: {
  title: string;
  onMenu: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  notifications: { id: string; text: string; at: string; read: boolean }[];
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-hairline bg-bg/80 px-4 backdrop-blur-md md:px-6">
      <button
        onClick={onMenu}
        aria-label="Open navigation"
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm text-ink-soft hover:bg-surface-2 hover:text-ink lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold tracking-tight text-ink">{title}</p>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint sm:block">
          {now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" })} · Agra IST
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={`Notifications (${unread} unread)`}
            className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Bell className="h-4.5 w-4.5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
            )}
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-hairline bg-surface p-2 shadow-pop"
              >
                <p className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  Desk notifications
                </p>
                <ul className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="px-2 py-4 text-center text-[12px] text-ink-faint">
                      No desk notifications
                    </li>
                  ) : (
                    notifications.map((n) => (
                      <li
                        key={n.id}
                        className={cn(
                          "rounded-sm px-2 py-2 text-[13px] leading-snug transition-colors hover:bg-surface-2",
                          n.read ? "text-ink-soft" : "bg-gold-soft/50 text-ink"
                        )}
                      >
                        {n.text}
                        <span className="mt-0.5 block font-mono text-[10px] text-ink-faint">{n.at}</span>
                      </li>
                    ))
                  )}
                </ul>
              </motion.div>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <motion.button
          whileTap={reduce ? undefined : { scale: 0.9 }}
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="relative flex min-h-[44px] min-w-[44px] items-center justify-center overflow-hidden rounded-sm text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <motion.span
            key={theme}
            initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-full w-full items-center justify-center"
          >
            {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </motion.span>
        </motion.button>
      </div>
    </header>
  );
}
