"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePlayer } from "@/lib/store/usePlayer";
import { Nav } from "@/components/layout/Nav";
import { SystemNotificationHost } from "@/components/system/SystemNotification";
import { RouteFluxLoader } from "@/components/layout/RouteFluxLoader";
import { BootScreen } from "@/components/layout/BootScreen";

const PUBLIC_ROUTES = ["/onboarding"];

export function AppFrame({ children }: { children: ReactNode }) {
  const hydrate = usePlayer((s) => s.hydrate);
  const hydrated = usePlayer((s) => s.hydrated);
  const onboarded = usePlayer((s) => s.onboarded);
  const ensureDailyQuest = usePlayer((s) => s.ensureDailyQuest);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void hydrate();
    // Register the PWA service worker (production only).
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [hydrate]);

  // Re-check quest / penalty whenever the tab regains focus (handles crossing midnight).
  useEffect(() => {
    const onFocus = () => ensureDailyQuest();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [ensureDailyQuest]);

  // Route guard: force onboarding until awakened.
  useEffect(() => {
    if (!hydrated) return;
    if (!onboarded && !PUBLIC_ROUTES.includes(pathname)) {
      router.replace("/onboarding");
    }
    if (onboarded && pathname === "/onboarding") {
      router.replace("/");
    }
  }, [hydrated, onboarded, pathname, router]);

  if (!mounted || !hydrated) {
    return <BootScreen />;
  }

  const showNav = onboarded && !PUBLIC_ROUTES.includes(pathname);

  return (
    <>
      <RouteFluxLoader />
      <SystemNotificationHost />
      {showNav && <Nav />}
      <main className={showNav ? "pb-20 md:pb-0 md:pl-[76px]" : ""}>
        <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-8 md:py-8">{children}</div>
      </main>
    </>
  );
}
