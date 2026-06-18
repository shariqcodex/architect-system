// ============================================================================
// Storage interface — abstracts persistence so a Postgres/Prisma backend can
// drop in later for multi-device sync without touching the UI or store logic.
// v1 implementation = localStorage.
// ============================================================================

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

const PREFIX = "the-system:";

export class LocalStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* quota / serialization errors are non-fatal for the game loop */
    }
  }

  async remove(key: string): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PREFIX + key);
  }
}

// Swap this single line to point at an API-backed adapter later.
export const storage: StorageAdapter = new LocalStorageAdapter();

export const STORE_KEY = "state-v1";
