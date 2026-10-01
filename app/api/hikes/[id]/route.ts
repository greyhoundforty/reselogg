import { type NextRequest, NextResponse } from "next/server";
import { getRedis, HIKES_KEY } from "@/lib/kv";
import { isAuthenticated } from "@/lib/auth";
import { sortHikes } from "@/lib/storage";
import type { Hike } from "@/lib/types";

// PATCH /api/hikes/[id] — auth-gated, updates fields on a hike
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.KV_REST_API_URL) {
    return NextResponse.json({ error: "KV store not configured." }, { status: 503 });
  }

  const { id } = await params;
  let patch: Partial<Hike>;
  try {
    patch = (await req.json()) as Partial<Hike>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const redis = getRedis();
  const existing = await redis.get<Hike[]>(HIKES_KEY);
  const hikes: Hike[] = Array.isArray(existing) ? existing : [];
  const idx = hikes.findIndex((h) => h.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "Hike not found." }, { status: 404 });
  }

  const updated = hikes.map((h) => (h.id === id ? { ...h, ...patch, id } : h));
  await redis.set(HIKES_KEY, sortHikes(updated));
  return NextResponse.json({ hike: updated[idx] });
}

// DELETE /api/hikes/[id] — auth-gated, removes a hike
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.KV_REST_API_URL) {
    return NextResponse.json({ error: "KV store not configured." }, { status: 503 });
  }

  const { id } = await params;
  const redis = getRedis();
  const existing = await redis.get<Hike[]>(HIKES_KEY);
  const hikes: Hike[] = Array.isArray(existing) ? existing : [];

  const next = hikes.filter((h) => h.id !== id);
  if (next.length === hikes.length) {
    return NextResponse.json({ error: "Hike not found." }, { status: 404 });
  }

  await redis.set(HIKES_KEY, next);
  return NextResponse.json({ ok: true });
}
