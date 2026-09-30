export const PLACE_TYPES = [
  "waterfall",
  "peak",
  "trail",
  "park",
  "garden",
  "nature-center",
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];

export type Hike = {
  id: string;
  name: string;
  date: string;
  placeType: PlaceType;
  notes: string;
  lat: number;
  lng: number;
  locationLabel: string;
  seeded: boolean;
};

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  waterfall: "Waterfall",
  peak: "Peak",
  trail: "Trail",
  park: "Park",
  garden: "Garden",
  "nature-center": "Nature center",
};
