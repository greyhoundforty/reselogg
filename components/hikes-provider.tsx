"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getHikesClientSnapshot,
  getHikesServerSnapshot,
  parseHikesSnapshot,
  restoreSeedHikes,
  retryHikesLoad,
  saveHikes,
  sortHikes,
  subscribeHikes,
} from "@/lib/storage";
import type { Hike } from "@/lib/types";

type Status = "loading" | "ready" | "error";

type HikesContextValue = {
  hikes: Hike[];
  status: Status;
  error: string | null;
  addHike: (hike: Hike) => void;
  updateHike: (id: string, patch: Partial<Hike>) => void;
  deleteHike: (id: string) => void;
  restoreSeeds: () => void;
  retry: () => void;
};

const HikesContext = createContext<HikesContextValue | null>(null);

export function HikesProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeHikes,
    getHikesClientSnapshot,
    getHikesServerSnapshot,
  );
  const parsed = parseHikesSnapshot(snapshot);
  const hikes = parsed.hikes;

  const persist = useCallback(
    (next: Hike[]) => {
      saveHikes(sortHikes(next));
    },
    [],
  );

  const value = useMemo<HikesContextValue>(
    () => ({
      hikes,
      status: parsed.status,
      error: parsed.error,
      addHike: (hike) => persist([...hikes, hike]),
      updateHike: (id, patch) =>
        persist(
          hikes.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        ),
      deleteHike: (id) => persist(hikes.filter((item) => item.id !== id)),
      restoreSeeds: () => restoreSeedHikes(),
      retry: () => retryHikesLoad(),
    }),
    [hikes, parsed.error, parsed.status, persist],
  );

  return <HikesContext.Provider value={value}>{children}</HikesContext.Provider>;
}

export function useHikes() {
  const ctx = useContext(HikesContext);
  if (!ctx) {
    throw new Error("useHikes must be used inside HikesProvider.");
  }
  return ctx;
}
