"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "ghost" | "danger" | "success" | "subtle";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent/15 text-accent border-accent/40 hover:bg-accent/25 hover:border-accent/65 hover:shadow-glow",
  ghost:
    "bg-transparent text-text-mid border-border hover:text-text-hi hover:border-border-hi hover:bg-bg-600/50",
  danger:
    "bg-danger/12 text-danger border-danger/40 hover:bg-danger/22 hover:border-danger/65 hover:shadow-glow-danger",
  success:
    "bg-success/12 text-success border-success/40 hover:bg-success/22 hover:border-success/65 hover:shadow-glow-success",
  subtle:
    "bg-bg-600/80 text-text-hi border-border hover:bg-bg-600 hover:border-border-hi",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-inset border font-display font-semibold uppercase tracking-wider",
        "transition-all duration-150",
        "active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-900",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  );
});
