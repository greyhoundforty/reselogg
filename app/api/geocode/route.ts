import { NextRequest, NextResponse } from "next/server";

const ASHEVILLE = { lat: 35.5951, lng: -82.5515 };

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json(
      { error: "Enter a place name to look up." },
      { status: 400 },
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${query}, North Carolina, USA`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "us");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mountain-Tracker/1.0 (family hiking log)",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Place lookup failed (${response.status}). Enter coordinates or try again.`,
          fallback: ASHEVILLE,
        },
        { status: 502 },
      );
    }
    const data = (await response.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
    }>;
    const hit = data[0];
    if (!hit) {
      return NextResponse.json(
        {
          error:
            "No North Carolina match for that name. Try a more specific place, or enter latitude and longitude.",
          fallback: ASHEVILLE,
        },
        { status: 404 },
      );
    }
    return NextResponse.json({
      lat: Number(hit.lat),
      lng: Number(hit.lon),
      locationLabel: hit.display_name ?? query,
      fallback: false,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not reach the geocoder. Check the network, then retry or enter coordinates.",
        fallback: ASHEVILLE,
      },
      { status: 503 },
    );
  }
}
