import { SEED_HIKES } from "./seed";
import type { Hike } from "./types";

export const STORAGE_KEY = "mountain-tracker:hikes:v1";

const listeners = new Set<() => void>();
let storeEpoch = 0;

function notify() {
  storeEpoch += 1;
  listeners.forEach((listener) => listener());
}

export function subscribeHikes(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHikesClientSnapshot() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return `${storeEpoch}:${raw ?? "__seed__"}`;
}

export function getHikesServerSnapshot() {
  return "0:__seed__";
}

export function sortHikes(hikes: Hike[]): Hike[] {
  return [...hikes].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return a.name.localeCompare(b.name);
  });
}

export function parseHikesSnapshot(snapshot: string): {
  hikes: Hike[];
  status: "loading" | "ready" | "error";
  error: string | null;
} {
  const raw = snapshot.slice(snapshot.indexOf(":") + 1);
  try {
    if (raw === "__seed__") {
      return { hikes: sortHikes(SEED_HIKES), status: "ready", error: null };
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("Saved hike list is not an array.");
    }
    return {
      hikes: sortHikes(parsed.map(validateHike)),
      status: "ready",
      error: null,
    };
  } catch (err) {
    return {
      hikes: [],
      status: "error",
      error:
        err instanceof Error
          ? err.message
          : "Could not read the saved hike list.",
    };
  }
}

export function saveHikes(hikes: Hike[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortHikes(hikes)));
  notify();
}

export function restoreSeedHikes(): void {
  saveHikes(SEED_HIKES);
}

export function retryHikesLoad(): void {
  notify();
}

function validateHike(value: unknown): Hike {
  if (!value || typeof value !== "object") {
    throw new Error("A saved hike is not an object.");
  }
  const hike = value as Hike;
  if (
    typeof hike.id !== "string" ||
    typeof hike.name !== "string" ||
    typeof hike.date !== "string" ||
    typeof hike.placeType !== "string" ||
    typeof hike.notes !== "string" ||
    typeof hike.lat !== "number" ||
    typeof hike.lng !== "number" ||
    typeof hike.locationLabel !== "string"
  ) {
    throw new Error("A saved hike is missing required fields.");
  }
  return {
    ...hike,
    seeded: Boolean(hike.seeded),
  };
}
