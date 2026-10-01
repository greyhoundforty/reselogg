import { NextResponse } from "next/server";
import { getRedis, HIKES_KEY } from "@/lib/kv";
import { isAuthenticated } from "@/lib/auth";
import { sortHikes } from "@/lib/storage";
import { SEED_HIKES } from "@/lib/seed";
import type { Hike } from "@/lib/types";

// POST /api/hikes/seed — auth-gated, merges seed hikes into the store
export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.KV_REST_API_URL) {
    return NextResponse.json({ error: "KV store not configured." }, { status: 503 });
  }

  const redis = getRedis();
  const existing = await redis.get<Hike[]>(HIKES_KEY);
  const current: Hike[] = Array.isArray(existing) ? existing : [];

  const existingIds = new Set(current.map((h) => h.id));
  const toAdd = SEED_HIKES.filter((s) => !existingIds.has(s.id));

  if (toAdd.length === 0) {
    return NextResponse.json({ added: 0, message: "All seed hikes already present." });
  }

  const updated = sortHikes([...current, ...toAdd]);
  await redis.set(HIKES_KEY, updated);
  return NextResponse.json({ added: toAdd.length });
}
