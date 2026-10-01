import { NextResponse } from "next/server";
import { getRedis, HIKES_KEY } from "@/lib/kv";
import { SEED_HIKES } from "@/lib/seed";
import { sortHikes, validateHike } from "@/lib/storage";
import type { Hike } from "@/lib/types";

// GET /api/hikes — public, returns all hikes
export async function GET() {
  if (!process.env.KV_REST_API_URL) {
    // KV not configured yet — return seed data so the app still renders
    return NextResponse.json({ hikes: sortHikes(SEED_HIKES) });
  }

  try {
    const redis = getRedis();
    const raw = await redis.get<Hike[]>(HIKES_KEY);

    if (!raw) {
      // First deploy: seed the store and return seed data
      await redis.set(HIKES_KEY, SEED_HIKES);
      return NextResponse.json({ hikes: sortHikes(SEED_HIKES) });
    }

    const hikes = (Array.isArray(raw) ? raw : []).map(validateHike);
    return NextResponse.json({ hikes: sortHikes(hikes) });
  } catch (err) {
    console.error("GET /api/hikes error:", err);
    return NextResponse.json(
      { error: "Could not load hikes." },
      { status: 503 },
    );
  }
}
