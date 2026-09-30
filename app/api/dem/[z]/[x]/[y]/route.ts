import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y } = await context.params;
  if (![z, x, y].every((part) => /^\d+$/.test(part))) {
    return NextResponse.json({ error: "Invalid tile" }, { status: 400 });
  }
  const zoom = Number(z);
  const tx = Number(x);
  const ty = Number(y);
  if (zoom < 0 || zoom > 15 || tx < 0 || ty < 0) {
    return NextResponse.json({ error: "Tile out of range" }, { status: 400 });
  }

  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${zoom}/${tx}/${ty}.png`;
  const upstream = await fetch(url, { cache: "force-cache" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "DEM tile unavailable" },
      { status: 502 },
    );
  }
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
