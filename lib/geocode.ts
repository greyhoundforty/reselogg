const ASHEVILLE = { lat: 35.5951, lng: -82.5515 };

export type GeoResult = {
  lat: number;
  lng: number;
  locationLabel: string;
  fallback: boolean;
  error?: string;
};

export function parseCoordinates(raw: string): { lat: number; lng: number } | null {
  const match = raw
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export async function geocodeInNorthCarolina(
  query: string,
): Promise<GeoResult> {
  const trimmed = query.trim();
  const asCoords = parseCoordinates(trimmed);
  if (asCoords) {
    return {
      ...asCoords,
      locationLabel: `${asCoords.lat.toFixed(5)}, ${asCoords.lng.toFixed(5)}`,
      fallback: false,
    };
  }

  try {
    const response = await fetch(
      `/api/geocode?q=${encodeURIComponent(trimmed)}`,
    );
    const data = (await response.json()) as {
      lat?: number;
      lng?: number;
      locationLabel?: string;
      fallback?: { lat: number; lng: number };
      error?: string;
    };
    if (!response.ok || data.lat == null || data.lng == null) {
      return {
        ...(data.fallback ?? ASHEVILLE),
        locationLabel: `${trimmed} (Asheville fallback)`,
        fallback: true,
        error:
          data.error ??
          "Could not find that place in North Carolina. Enter coordinates or try a more specific name.",
      };
    }
    return {
      lat: data.lat,
      lng: data.lng,
      locationLabel: data.locationLabel ?? trimmed,
      fallback: false,
    };
  } catch {
    return {
      ...ASHEVILLE,
      locationLabel: `${trimmed} (Asheville fallback)`,
      fallback: true,
      error:
        "Could not reach the geocoder. Enter latitude and longitude, or save with an Asheville pin.",
    };
  }
}
