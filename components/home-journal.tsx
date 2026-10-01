"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { HikeList } from "@/components/hike-list";
import { useHikes } from "@/components/hikes-provider";
import { PLACE_TYPE_LABELS } from "@/lib/types";
import type { PlaceType } from "@/lib/types";

const VisitMaps = dynamic(
  () => import("@/components/visit-maps").then((mod) => mod.VisitMaps),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground ring-1 ring-foreground/10">
        Loading maps…
      </div>
    ),
  },
);

export function HomeJournal() {
  const { hikes, status } = useHikes();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (hikes.length === 0) return null;
    const counts = hikes.reduce<Partial<Record<PlaceType, number>>>((acc, h) => {
      acc[h.placeType] = (acc[h.placeType] ?? 0) + 1;
      return acc;
    }, {});
    const dates = hikes.map((h) => h.date).sort();
    return { counts, first: dates[0], last: dates[dates.length - 1], total: hikes.length };
  }, [hikes]);

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-4 py-4 lg:grid-cols-[minmax(280px,400px)_1fr] lg:items-stretch">
      <HikeList selectedId={selectedId} onSelect={setSelectedId} />
      <div className="flex min-h-[360px] flex-col gap-2 lg:min-h-[calc(100vh-8rem)]">
        <div>
          <h1 className="font-heading text-xl font-medium sm:text-2xl">
            Western North Carolina, pinned
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            A running family log of waterfalls, peaks, and Asheville gardens.
            Pinned on a USGS topo of the Blue Ridge, Pisgah, the Black Mountains, and Dupont.
          </p>
          {stats ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{stats.total}</span> visit{stats.total !== 1 ? "s" : ""}
              </span>
              {(Object.entries(stats.counts) as [PlaceType, number][]).map(([type, n]) => (
                <span key={type} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{n}</span> {PLACE_TYPE_LABELS[type].toLowerCase()}{n !== 1 ? "s" : ""}
                </span>
              ))}
              {stats.first && stats.last && stats.first !== stats.last ? (
                <span className="text-xs text-muted-foreground">
                  {stats.first.slice(0, 4)}–{stats.last.slice(0, 4)}
                </span>
              ) : stats.first ? (
                <span className="text-xs text-muted-foreground">{stats.first.slice(0, 4)}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        {status === "ready" ? (
          <VisitMaps
            hikes={hikes}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground ring-1 ring-foreground/10">
            {status === "loading"
              ? "Preparing the maps…"
              : "Fix the hike list to show map pins."}
          </div>
        )}
      </div>
    </div>
  );
}
