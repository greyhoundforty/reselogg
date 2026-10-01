"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { sortHikes } from "@/lib/storage";
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

type HikeListResponse = { hikes: Hike[]; error?: string };

export function HikesProvider({ children }: { children: ReactNode }) {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);

  // Load hikes from the API on mount and whenever epoch changes (retry / restore).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/hikes")
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json() as Promise<HikeListResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setHikes(sortHikes(data.hikes ?? []));
        setStatus("ready");
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Could not load hikes.");
      });
    return () => {
      cancelled = true;
    };
  }, [epoch]);

  const addHike = useCallback((hike: Hike) => {
    fetch("/api/hikes/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hike),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        // Optimistic update
        setHikes((prev) => sortHikes([...prev, hike]));
      })
      .catch((err: unknown) => {
        console.error("addHike failed:", err);
      });
  }, []);

  const updateHike = useCallback((id: string, patch: Partial<Hike>) => {
    // Optimistic update first
    setHikes((prev) =>
      sortHikes(prev.map((h) => (h.id === id ? { ...h, ...patch } : h))),
    );
    fetch(`/api/hikes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch((err: unknown) => {
      console.error("updateHike failed:", err);
      // Roll back by re-fetching
      setEpoch((e) => e + 1);
    });
  }, []);

  const deleteHike = useCallback((id: string) => {
    // Optimistic update first
    setHikes((prev) => prev.filter((h) => h.id !== id));
    fetch(`/api/hikes/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(
      (err: unknown) => {
        console.error("deleteHike failed:", err);
        setEpoch((e) => e + 1);
      },
    );
  }, []);

  const restoreSeeds = useCallback(() => {
    setStatus("loading");
    fetch("/api/hikes/seed", { method: "POST" })
      .then(() => setEpoch((e) => e + 1))
      .catch((err: unknown) => console.error("restoreSeeds failed:", err));
  }, []);

  const retry = useCallback(() => {
    setStatus("loading");
    setEpoch((e) => e + 1);
  }, []);

  const value = useMemo<HikesContextValue>(
    () => ({ hikes, status, error, addHike, updateHike, deleteHike, restoreSeeds, retry }),
    [hikes, status, error, addHike, updateHike, deleteHike, restoreSeeds, retry],
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
