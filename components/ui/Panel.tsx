"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PanelGlow = boolean | "purple" | "danger" | "success" | "warning";

interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  corners?: boolean;
  title?: ReactNode;
  action?: ReactNode;
  inset?: boolean;
  glow?: PanelGlow;
  /** Extra classes for the inner content wrapper (e.g. to make it a flex column). */
  contentClassName?: string;
}

const glowClasses: Record<string, string> = {
  true: "border-border-hi shadow-glow",
  purple: "border-purple/30 shadow-glow-purple",
  danger: "border-danger/30 shadow-glow-danger",
  success: "border-success/30 shadow-glow-success",
  warning: "border-warning/30 shadow-glow-warning",
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { className, corners = false, title, action, inset = false, glow, contentClassName, children, ...rest },
  ref,
) {
  const glowClass = glow ? (glowClasses[String(glow)] ?? "") : "";

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-panel border border-border bg-bg-700/80 shadow-panel backdrop-blur-md transition-shadow duration-300",
        inset && "bg-bg-800/70",
        corners && "hud-corners",
        glowClass,
        className,
      )}
      {...rest}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-text-mid">
            {title}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-4", contentClassName)}>{children}</div>
    </div>
  );
});
