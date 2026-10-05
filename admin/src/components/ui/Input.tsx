import { forwardRef, useState, useEffect, type InputHTMLAttributes, type SelectHTMLAttributes, type LabelHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "h-10 w-full rounded-sm border border-hairline-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, onWheel, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      onWheel={(e) => {
        if (type === "number") (e.target as HTMLElement).blur();
        onWheel?.(e);
      }}
      className={cn(fieldBase, className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: number | string | undefined | null;
  onChange: (value: number) => void;
  allowDecimals?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, allowDecimals = false, className, onBlur, ...props }, ref) => {
    const [raw, setRaw] = useState<string>(value !== undefined && value !== null ? String(value) : "");

    useEffect(() => {
      const strVal = value !== undefined && value !== null ? String(value) : "";
      if (strVal !== raw && (raw === "" || Number(raw) !== Number(value))) {
        setRaw(strVal);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (next === "") {
        setRaw("");
        onChange(0);
        return;
      }
      const pattern = allowDecimals ? /^\d*\.?\d*$/ : /^\d*$/;
      if (pattern.test(next)) {
        setRaw(next);
        const parsed = allowDecimals ? parseFloat(next) : parseInt(next, 10);
        if (!isNaN(parsed)) {
          onChange(parsed);
        }
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (raw === "") {
        setRaw("0");
        onChange(0);
      }
      onBlur?.(e);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode={allowDecimals ? "decimal" : "numeric"}
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(fieldBase, className)}
        {...props}
      />
    );
  }
);
NumberInput.displayName = "NumberInput";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-sm border border-hairline-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(fieldBase, "appearance-none bg-no-repeat pr-8", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.75rem center",
      }}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft",
        className
      )}
      {...props}
    />
  );
}
