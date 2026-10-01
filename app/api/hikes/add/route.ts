import { type NextRequest, NextResponse } from "next/server";
import { getRedis, HIKES_KEY } from "@/lib/kv";
import { isAuthenticated } from "@/lib/auth";
import { sortHikes, validateHike } from "@/lib/storage";
import type { Hike } from "@/lib/types";

// POST /api/hikes — auth-gated, adds a single hike
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.KV_REST_API_URL) {
    return NextResponse.json({ error: "KV store not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  let newHike: Hike;
  try {
    newHike = validateHike(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid hike data." },
      { status: 422 },
    );
  }

  const redis = getRedis();
  const existing = await redis.get<Hike[]>(HIKES_KEY);
  const hikes: Hike[] = Array.isArray(existing) ? existing : [];

  if (hikes.some((h) => h.id === newHike.id)) {
    return NextResponse.json({ error: "A hike with this ID already exists." }, { status: 409 });
  }

  const updated = sortHikes([...hikes, newHike]);
  await redis.set(HIKES_KEY, updated);
  return NextResponse.json({ hike: newHike }, { status: 201 });
}
