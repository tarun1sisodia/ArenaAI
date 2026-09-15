/**
 * Button — motion.dev-enhanced action primitive
 * --------------------------------------------------------------------------
 * Renders an <a> when `href` is provided, otherwise a <button>. The visual
 * contract stays the same `.button` + variant classes defined in ui-kit.css,
 * so server-rendered markup is styled without JavaScript; motion.dev only adds
 * spring hover/press feedback once hydrated (and is skipped entirely under
 * `prefers-reduced-motion`).
 */

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useHydrated } from "./motion";

export type ButtonVariant = "primary" | "outline" | "secondary" | "ghost" | "light";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  target?: string;
  rel?: string;
  "aria-label"?: string;
  /** Stretch to the full width of the parent. */
  block?: boolean;
  title?: string;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "button button-primary",
  outline: "button button-outline",
  secondary: "button button-secondary",
  ghost: "button button--ghost",
  light: "button button-outline button-light",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "button-sm",
  md: "",
  lg: "",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  type = "button",
  disabled,
  target,
  rel,
  block,
  title,
  ...rest
}: ButtonProps) {
  const hydrated = useHydrated();
  const classes = [VARIANT_CLASS[variant], SIZE_CLASS[size], block ? "button-block" : "", className]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {children}
    </>
  );

  if (href) {
    if (!hydrated) {
      return (
        <a className={classes} href={href} target={target} rel={rel} title={title} {...rest}>
          {content}
        </a>
      );
    }
    return (
      <motion.a
        className={classes}
        href={href}
        target={target}
        rel={rel}
        title={title}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 460, damping: 30 }}
        {...rest}
      >
        {content}
      </motion.a>
    );
  }

  if (!hydrated || disabled) {
    return (
      <button className={classes} type={type} onClick={onClick} disabled={disabled} title={title} {...rest}>
        {content}
      </button>
    );
  }

  return (
    <motion.button
      className={classes}
      type={type}
      onClick={onClick}
      title={title}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 460, damping: 30 }}
      {...rest}
    >
      {content}
    </motion.button>
  );
}

export default Button;
