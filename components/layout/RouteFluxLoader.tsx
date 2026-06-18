"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ProgressiveFluxLoader, type FluxPhase } from "@/components/ui/ProgressiveFluxLoader";

const PHASES: FluxPhase[] = [
  { at: 0, label: "accessing" },
  { at: 35, label: "decrypting" },
  { at: 70, label: "rendering" },
  { at: 100, label: "online" },
];

const MIN_VISIBLE_MS = 600; // ensure the flux + phase labels are actually seen

/**
 * Shows a progressive flux loader during tab/route transitions.
 * Starts when an internal link is clicked, completes when the pathname commits.
 */
export function RouteFluxLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [value, setValue] = useState(0);

  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number>(0);

  const clearTimers = () => {
    if (trickle.current) clearInterval(trickle.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    trickle.current = null;
    hideTimer.current = null;
  };

  const start = useCallback(() => {
    clearTimers();
    startedAt.current = Date.now();
    setActive(true);
    setValue(8);
    // Trickle toward ~90% so there is visible forward motion during the load.
    trickle.current = setInterval(() => {
      setValue((v) => (v >= 90 ? v : v + Math.max(1, (92 - v) * 0.18)));
    }, 90);
  }, []);

  const finish = useCallback(() => {
    if (!active) return;
    if (trickle.current) {
      clearInterval(trickle.current);
      trickle.current = null;
    }
    setValue(100);
    const elapsed = Date.now() - startedAt.current;
    const wait = Math.max(220, MIN_VISIBLE_MS - elapsed);
    hideTimer.current = setTimeout(() => {
      setActive(false);
      setValue(0);
    }, wait);
  }, [active]);

  // Complete the bar once the new route has committed.
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Intercept internal navigation clicks to begin the loader.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = (e.target as Element | null)?.closest("a");
      if (!el) return;
      const href = el.getAttribute("href");
      const target = el.getAttribute("target");
      if (!href || href.startsWith("#") || target === "_blank" || el.hasAttribute("download")) return;
      // internal, same-origin, different path
      let dest: URL;
      try {
        dest = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (dest.origin !== window.location.origin) return;
      if (dest.pathname === window.location.pathname) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
    };
  }, [start]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[200]"
        >
          {/* top flux line */}
          <ProgressiveFluxLoader value={value} phases={PHASES} slim />

          {/* floating phase chip */}
          <div className="mt-2 flex justify-center">
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-full border border-border-hi bg-bg-800/90 px-3 py-1 backdrop-blur"
              style={{ boxShadow: "0 0 18px rgba(0,224,255,0.22)" }}
            >
              <PhaseChip value={value} />
              <span className="sr-only">Loading</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Lightweight inline phase chip reusing the same phase logic + percent.
function PhaseChip({ value }: { value: number }) {
  const label = [...PHASES].reduce((acc, p) => (value >= p.at ? p.label : acc), PHASES[0].label);
  return (
    <span className="flex items-center gap-2">
      <span className="font-display text-[10px] font-semibold uppercase tracking-[0.34em] text-accent-2">
        {label}
      </span>
      <span className="font-mono text-[10px] tabular-nums text-text-mid">{Math.round(value)}%</span>
    </span>
  );
}
