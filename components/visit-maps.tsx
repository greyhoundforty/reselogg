"use client";

import { TopoMap } from "@/components/topo-map";
import type { Hike } from "@/lib/types";

export function VisitMaps({
  hikes,
  selectedId,
  onSelect,
  showDetailLink = true,
}: {
  hikes: Hike[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showDetailLink?: boolean;
}) {
  return (
    <TopoMap
      hikes={hikes}
      selectedId={selectedId}
      onSelect={onSelect}
      showDetailLink={showDetailLink}
    />
  );
}
