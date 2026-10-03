import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const items = [
    {
      key: "eyebrow",
      el: (
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold-text">{eyebrow}</p>
      ),
    },
    {
      key: "title",
      el: (
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
          {title}
        </h1>
      ),
    },
    ...(description
      ? [
          {
            key: "desc",
            el: <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>,
          },
        ]
      : []),
  ];

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <motion.div
            key={item.key}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 }}
          >
            {item.el}
          </motion.div>
        ))}
      </div>
      {actions && (
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="flex flex-wrap items-center gap-2"
        >
          {actions}
        </motion.div>
      )}
    </div>
  );
}
