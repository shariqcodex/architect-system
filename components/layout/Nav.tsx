"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Swords, LineChart, User, Settings, Bot } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/", label: "HUD", icon: LayoutDashboard },
  { href: "/dungeon", label: "Dungeon", icon: Swords },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/coach", label: "Architect", icon: Bot },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop: left rail */}
      <nav className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col items-center gap-1 border-r border-border bg-bg-800/90 py-5 backdrop-blur-md md:flex">
        {/* Logo */}
        <Link href="/" className="mb-4 flex flex-col items-center gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-inset border border-accent/35 bg-accent/10 shadow-glow transition-all duration-300 hover:bg-accent/18 hover:shadow-glow">
            <span className="font-display text-lg font-bold leading-none text-accent text-glow">
              SL
            </span>
          </div>
          <span className="text-[8px] uppercase tracking-[0.3em] text-text-low">System</span>
        </Link>

        <div className="mb-2 h-px w-10 rounded bg-border" />

        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex w-full flex-col items-center gap-1 py-2.5 transition-colors duration-200",
                active ? "text-accent" : "text-text-low hover:text-text-mid",
              )}
            >
              {/* Active indicator line */}
              {active && (
                <span className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-r-full bg-accent shadow-glow" />
              )}
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-inset border transition-all duration-200",
                  active
                    ? "border-accent/50 bg-accent/15 shadow-glow"
                    : "border-transparent group-hover:border-border group-hover:bg-bg-700/60",
                )}
              >
                <Icon size={18} />
              </span>
              <span className="font-display text-[9px] uppercase tracking-widest">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile: bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-bg-800/95 backdrop-blur-md md:hidden">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors duration-200",
                active ? "text-accent" : "text-text-low",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-inset transition-all duration-200",
                  active && "bg-accent/12",
                )}
                style={
                  active
                    ? { filter: "drop-shadow(0 0 6px rgba(61,169,252,0.55))" }
                    : undefined
                }
              >
                <Icon size={18} />
              </span>
              <span className="font-display text-[8px] uppercase tracking-wider">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
