"use client";

// Decorative Monarch sigil rendered behind the body avatar. Purely cosmetic
// (aria-hidden), pointer-events disabled, and motion is killed by the global
// prefers-reduced-motion rule. Renders as a centered square so the rings stay
// circular and centered on the figure regardless of the container's aspect.
export function MagicCircle({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 300 300"
        className="aspect-square h-auto w-[135%] max-w-none opacity-50"
        fill="none"
      >
        {/* Outer rotating ring with rune ticks */}
        <g className="animate-spin-cw" style={{ transformOrigin: "150px 150px" }}>
          <circle cx="150" cy="150" r="140" stroke="#8b5cf6" strokeOpacity="0.35" strokeWidth="1" />
          <circle
            cx="150"
            cy="150"
            r="132"
            stroke="#8b5cf6"
            strokeOpacity="0.5"
            strokeWidth="1.5"
            strokeDasharray="2 10"
          />
        </g>
        {/* Mid counter-rotating ring */}
        <g className="animate-spin-ccw" style={{ transformOrigin: "150px 150px" }}>
          <circle
            cx="150"
            cy="150"
            r="112"
            stroke="#3da9fc"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="22 14"
          />
          <polygon
            points="150,52 235,101 235,199 150,248 65,199 65,101"
            stroke="#00e0ff"
            strokeOpacity="0.28"
            strokeWidth="1"
          />
        </g>
        {/* Inner static glyph ring */}
        <circle cx="150" cy="150" r="92" stroke="#a78bfa" strokeOpacity="0.22" strokeWidth="1" />
      </svg>
    </div>
  );
}
