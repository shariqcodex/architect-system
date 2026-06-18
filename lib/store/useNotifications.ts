"use client";

import { create } from "zustand";
import type { NotificationVariant, SystemNotice } from "@/lib/types";

interface NotificationState {
  notices: SystemNotice[];
  push: (variant: NotificationVariant, header: string, body: string) => void;
  dismiss: (id: string) => void;
}

export const useNotifications = create<NotificationState>((set) => ({
  notices: [],
  push: (variant, header, body) =>
    set((s) => ({
      notices: [
        ...s.notices,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          variant,
          header,
          body,
          createdAt: Date.now(),
        },
      ],
    })),
  dismiss: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),
}));

// Allows non-React modules (the player store) to fire notifications.
export function notify(variant: NotificationVariant, header: string, body: string): void {
  useNotifications.getState().push(variant, header, body);
}
