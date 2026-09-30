import { type NextRequest, NextResponse } from "next/server";
import { list, del } from "@vercel/blob";
import { isAuthenticated } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const hikeId = new URL(req.url).searchParams.get("hikeId");

  if (!hikeId) {
    return NextResponse.json({ error: "hikeId query param is required." }, { status: 400 });
  }

  // List blobs under photos/{hikeId}/{id}/ and delete them all.
  const { blobs } = await list({ prefix: `photos/${hikeId}/${id}/` });
  if (blobs.length === 0) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  await del(blobs.map((b) => b.url));
  return NextResponse.json({ ok: true });
}
