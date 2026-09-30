export type OsmPoi = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: string;
};

const OVERPASS = "https://overpass-api.de/api/interpreter";

export async function fetchNearbyOsmPois(): Promise<OsmPoi[]> {
  const query = `
[out:json][timeout:12];
(
  nwr["waterway"="waterfall"](35.15,-83.05,36.28,-81.65);
  nwr["leisure"="garden"](35.48,-82.70,35.66,-82.45);
);
out center 40;
`.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);
  try {
    const response = await fetch(OVERPASS, {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      elements?: Array<{
        id: number;
        type: string;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: { name?: string; waterway?: string; leisure?: string };
      }>;
    };
    return (data.elements ?? [])
      .map((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (lat == null || lng == null) return null;
        const name = el.tags?.name;
        if (!name) return null;
        return {
          id: `osm-${el.type}-${el.id}`,
          name,
          lat,
          lng,
          kind: el.tags?.waterway === "waterfall" ? "waterfall" : "garden",
        } satisfies OsmPoi;
      })
      .filter((poi): poi is OsmPoi => poi !== null)
      .slice(0, 40);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
