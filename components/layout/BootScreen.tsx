"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ProgressiveFluxLoader, type FluxPhase } from "@/components/ui/ProgressiveFluxLoader";

const BOOT_PHASES: FluxPhase[] = [
  { at: 0, label: "calibrating" },
  { at: 40, label: "syncing" },
  { at: 75, label: "awakening" },
  { at: 100, label: "ready" },
];

export function BootScreen() {
  const [value, setValue] = useState(6);

  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => (v >= 94 ? v : v + Math.max(1, (96 - v) * 0.12)));
    }, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm text-center"
      >
        <div className="font-display text-2xl font-bold uppercase tracking-[0.4em] text-accent text-glow">
          THE SYSTEM
        </div>
        <p className="mb-6 mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-text-low">
          Hunter Protocol
        </p>
        <ProgressiveFluxLoader value={value} phases={BOOT_PHASES} />
      </motion.div>
    </div>
  );
}
