// Central design tokens — single source of truth for non-Tailwind contexts
// (SVG fills, Recharts, Framer Motion). Mirrors tailwind.config.ts.

import type { Rank } from "@/lib/types";

export const colors = {
  bg900: "#07060F",
  bg800: "#0C0B1A",
  bg700: "#111225",
  bg600: "#191630",
  border: "rgba(120,160,220,0.12)",
  borderHi: "rgba(100,170,255,0.40)",
  textHi: "#E8EEF8",
  textMid: "#9FB0C9",
  textLow: "#5C6B85",
  accent: "#3DA9FC",
  accent2: "#00E0FF",
  purple: "#8B5CF6",
  purpleHi: "#A78BFA",
  success: "#36D399",
  danger: "#FF4D6D",
  warning: "#FFB454",
} as const;

export const rankColors: Record<Rank, string> = {
  E: "#6B7280",
  D: "#36D399",
  C: "#3DA9FC",
  B: "#A855F7",
  A: "#F5C04A",
  S: "#FF4D6D",
  SS: "#F0F6FF",
};

// Glow strength + figure scale applied per rank tier on the avatar.
export const rankVisuals: Record<Rank, { glow: number; scale: number }> = {
  E: { glow: 0, scale: 1.0 },
  D: { glow: 2, scale: 1.01 },
  C: { glow: 4, scale: 1.025 },
  B: { glow: 6, scale: 1.04 },
  A: { glow: 9, scale: 1.06 },
  S: { glow: 13, scale: 1.085 },
  SS: { glow: 18, scale: 1.11 },
};

// Motion durations (ms) — keep everything purposeful & quick.
export const motion = {
  fast: 0.15,
  base: 0.24,
  slow: 0.3,
} as const;
