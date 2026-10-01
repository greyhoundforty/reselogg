import { type NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";

// Public endpoint — anyone can view photos for a hike.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hikeId = searchParams.get("hikeId");

  if (!hikeId) {
    return NextResponse.json({ error: "hikeId query param is required." }, { status: 400 });
  }

  // If the Blob store isn't connected yet return an empty list rather than 500.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ photos: [] });
  }

  try {
    const { blobs } = await list({ prefix: `photos/${hikeId}/` });

    const photos = blobs.map((blob) => {
      // pathname: photos/{hikeId}/{photoId}/{filename}
      const parts = blob.pathname.split("/");
      return {
        id: parts[2] ?? blob.pathname,
        hikeId,
        name: parts[3] ?? blob.pathname,
        url: blob.url,
        createdAt: blob.uploadedAt.toISOString(),
      };
    });

    // newest first
    photos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ photos });
  } catch (err) {
    console.error("Blob list error:", err);
    return NextResponse.json(
      { error: "Could not load photos. The Blob store may not be connected." },
      { status: 503 },
    );
  }
}
