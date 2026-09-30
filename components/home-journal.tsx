"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { HikeList } from "@/components/hike-list";
import { useHikes } from "@/components/hikes-provider";

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
