import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cn(
              // Mobile-first: full-width bottom sheet that never exceeds the viewport,
              // with its own scrollable body so long forms stay usable on phones.
              "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-xl border border-hairline bg-surface shadow-pop sm:max-h-[88vh] sm:rounded-md",
              className
            )}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline px-5 py-4">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-medium tracking-tight text-ink">{title}</h2>
                {description && (
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="shrink-0 rounded-sm p-1.5 text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
