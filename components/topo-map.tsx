"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  GeoJSONSource,
  GlobeControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  type ErrorEvent,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { fetchNearbyOsmPois, type OsmPoi } from "@/lib/osm";
import type { Hike, PlaceType } from "@/lib/types";
import { PLACE_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TERRAIN_TILES =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

const MAP_STYLE: StyleSpecification = {
  version: 8,
  name: "Mountain-Tracker USGS topo",
  sources: {
    usgs: {
      type: "raster",
      tiles: [
        "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 16,
      attribution: "USGS The National Map",
    },
    terrain: {
      type: "raster-dem",
      tiles: [TERRAIN_TILES],
      tileSize: 256,
      encoding: "terrarium",
      maxzoom: 15,
    },
  },
  layers: [
    { id: "usgs", type: "raster", source: "usgs" },
    {
      id: "hillshade",
      type: "hillshade",
      source: "terrain",
      paint: {
        "hillshade-exaggeration": 0.55,
        "hillshade-shadow-color": "#1c1917",
        "hillshade-highlight-color": "#fafaf9",
      },
    },
  ],
  terrain: { source: "terrain", exaggeration: 1.45 },
};

const BBOX = { west: -83.12, south: 35.1, east: -81.62, north: 36.3 };

const USGS_STATIC = `https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/export?bbox=${BBOX.west},${BBOX.south},${BBOX.east},${BBOX.north}&bboxSR=4326&imageSR=4326&size=1280,900&format=png&f=image`;

function canUseWebGL() {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }),
    );
  } catch {
    return false;
  }
}
const PIN_COLORS: Record<PlaceType, string> = {
  waterfall: "#2563eb",
  peak: "#b45309",
  trail: "#15803d",
  park: "#0f766e",
  garden: "#c026d3",
  "nature-center": "#7c3aed",
};

type Props = {
  hikes: Hike[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showDetailLink?: boolean;
};

export function TopoMap({ hikes, selectedId, onSelect, showDetailLink = true }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [terrainReady, setTerrainReady] = useState(false);
  const [osmPois, setOsmPois] = useState<OsmPoi[] | null>(null);
  const [showOsm, setShowOsm] = useState(false);
  const use3d = useSyncExternalStore(
    () => () => {},
    canUseWebGL,
    () => false,
  );

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: (osmPois ?? []).map((poi) => ({
        type: "Feature" as const,
        properties: { name: poi.name, kind: poi.kind },
        geometry: {
          type: "Point" as const,
          coordinates: [poi.lng, poi.lat],
        },
      })),
    }),
    [osmPois],
  );

  useEffect(() => {
    if (!use3d || !containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-82.55, 35.55],
      zoom: 8.2,
      pitch: 62,
      bearing: -18,
      maxPitch: 80,
    });
    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new GlobeControl(), "top-right");
    mapRef.current = map;

    map.on("error", (event: ErrorEvent) => {
      const message = event.error?.message ?? "Map failed to load tiles.";
      if (message.toLowerCase().includes("style") || message.toLowerCase().includes("failed")) {
        setMapError(message);
      }
    });

    map.on("load", () => {
      setTerrainReady(true);
      if (!map.getSource("osm-pois")) {
        map.addSource("osm-pois", { type: "geojson", data: geojson });
        map.addLayer({
          id: "osm-pois-circle",
          type: "circle",
          source: "osm-pois",
          layout: { visibility: "none" },
          paint: {
            "circle-radius": 4,
            "circle-color": "#94a3b8",
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.85,
          },
        });
      }
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // geojson is applied in a later effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [use3d]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = hikes.map((hike) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "mt-pin";
      el.style.background = PIN_COLORS[hike.placeType];
      el.style.boxShadow =
        hike.id === selectedId ? "0 0 0 4px rgba(255,255,255,0.9)" : "0 0 0 2px rgba(255,255,255,0.85)";
      el.title = hike.name;
      el.setAttribute("aria-label", hike.name);
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelect?.(hike.id);
      });
      const notePreview = hike.notes.length > 80
        ? hike.notes.slice(0, 80).trimEnd() + "…"
        : hike.notes;
      const detailLink = showDetailLink
        ? `<a href="/hikes/${hike.id}" class="mt-popup-link">View details</a>`
        : "";
      const popup = new Popup({ offset: 18, closeButton: true, maxWidth: "260px" }).setHTML(
        `<div class="mt-popup">
          <p class="mt-popup-type">${escapeHtml(PLACE_TYPE_LABELS[hike.placeType])} · ${escapeHtml(hike.date)}</p>
          <strong class="mt-popup-name">${escapeHtml(hike.name)}</strong>
          <p class="mt-popup-loc">${escapeHtml(hike.locationLabel)}</p>
          ${notePreview ? `<p class="mt-popup-notes">${escapeHtml(notePreview)}</p>` : ""}
          ${detailLink}
        </div>`,
      );
      const marker = new Marker({ element: el, anchor: "bottom" })
        .setLngLat([hike.lng, hike.lat])
        .setPopup(popup)
        .addTo(map);
      return marker;
    });
  }, [hikes, onSelect, selectedId, showDetailLink]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource("osm-pois") as GeoJSONSource | undefined;
    source?.setData(geojson);
    if (map.getLayer("osm-pois-circle")) {
      map.setLayoutProperty(
        "osm-pois-circle",
        "visibility",
        showOsm ? "visible" : "none",
      );
    }
  }, [geojson, showOsm]);

  useEffect(() => {
    if (!showOsm || osmPois) return;
    let cancelled = false;
    fetchNearbyOsmPois().then((pois) => {
      if (!cancelled) setOsmPois(pois);
    });
    return () => {
      cancelled = true;
    };
  }, [osmPois, showOsm]);

  useEffect(() => {
    const selected = hikes.find((hike) => hike.id === selectedId);
    if (!selected || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [selected.lng, selected.lat],
      zoom: Math.max(mapRef.current.getZoom(), 11.5),
      pitch: 64,
      essential: true,
    });
  }, [hikes, selectedId]);

  return (
    <div className="relative flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-xl ring-1 ring-foreground/10">
      {!use3d || !terrainReady ? (
        <StaticTopo
          hikes={hikes}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ) : null}
      {use3d ? <div ref={containerRef} className="absolute inset-0" /> : null}
      {mapError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-900/80 p-6 text-center text-sm text-stone-100">
          <p>
            The 3D map could not load public tiles ({mapError}). Check the
            network and reload. Logged pins still live in the hike list.
          </p>
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2">
        <Badge variant="secondary" className="pointer-events-auto bg-background/90">
          {terrainReady ? "3D terrain + hillshade" : "USGS topographic map"}
        </Badge>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="pointer-events-auto bg-background/90"
          onClick={() => setShowOsm((value) => !value)}
        >
          {showOsm
            ? osmPois && osmPois.length === 0
              ? "OSM nearby unavailable"
              : "Hide OSM nearby"
            : "Show OSM nearby"}
        </Button>
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-wrap gap-2">
        {(Object.keys(PIN_COLORS) as PlaceType[]).map((type) => (
          <span
            key={type}
            className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-1 text-[11px] text-foreground ring-1 ring-foreground/10"
          >
            <span
              className="size-2 rounded-full"
              style={{ background: PIN_COLORS[type] }}
            />
            {PLACE_TYPE_LABELS[type]}
          </span>
        ))}
      </div>
      {showDetailLink && selectedId ? (
        <div className="pointer-events-auto absolute right-3 bottom-14 z-10 hidden sm:block">
          <Button size="sm" variant="secondary" nativeButton={false} render={<Link href={`/hikes/${selectedId}`} />}>
            Open selected hike
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StaticTopo({
  hikes,
  selectedId,
  onSelect,
}: {
  hikes: Hike[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="absolute inset-0 bg-stone-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={USGS_STATIC}
        alt="USGS topographic map of Western North Carolina"
        className="h-full w-full object-cover"
      />
      {hikes.map((hike) => {
        const left =
          ((hike.lng - BBOX.west) / (BBOX.east - BBOX.west)) * 100;
        const top =
          ((BBOX.north - hike.lat) / (BBOX.north - BBOX.south)) * 100;
        return (
          <button
            key={hike.id}
            type="button"
            title={hike.name}
            aria-label={hike.name}
            onClick={() => onSelect?.(hike.id)}
            className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              background: PIN_COLORS[hike.placeType],
              boxShadow:
                hike.id === selectedId
                  ? "0 0 0 5px rgba(255,255,255,0.85)"
                  : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
