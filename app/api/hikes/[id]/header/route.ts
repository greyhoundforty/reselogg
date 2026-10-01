import { type NextRequest, NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { getRedis, HIKES_KEY } from "@/lib/kv";
import { isAuthenticated } from "@/lib/auth";
import type { Hike } from "@/lib/types";

// POST /api/hikes/[id]/header — upload / replace the header image
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob store not configured." }, { status: 503 });
  }

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are accepted." }, { status: 400 });
  }

  // Remove any existing header blob for this hike first
  const { blobs: existing } = await list({ prefix: `headers/${id}/` });
  if (existing.length > 0) await del(existing.map((b) => b.url));

  const blob = await put(`headers/${id}/${file.name}`, file, { access: "public" });

  // Persist the URL on the hike record in KV
  if (process.env.KV_REST_API_URL) {
    const redis = getRedis();
    const raw = await redis.get<Hike[]>(HIKES_KEY);
    if (Array.isArray(raw)) {
      const updated = raw.map((h) =>
        h.id === id ? { ...h, headerImageUrl: blob.url } : h,
      );
      await redis.set(HIKES_KEY, updated);
    }
  }

  return NextResponse.json({ url: blob.url });
}

// DELETE /api/hikes/[id]/header — remove the header image
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { blobs } = await list({ prefix: `headers/${id}/` });
    if (blobs.length > 0) await del(blobs.map((b) => b.url));
  }

  if (process.env.KV_REST_API_URL) {
    const redis = getRedis();
    const raw = await redis.get<Hike[]>(HIKES_KEY);
    if (Array.isArray(raw)) {
      const updated = raw.map((h) => {
        if (h.id !== id) return h;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { headerImageUrl: _removed, ...rest } = h;
        return rest as Hike;
      });
      await redis.set(HIKES_KEY, updated);
    }
  }

  return NextResponse.json({ ok: true });
}
