import { Redis } from "@upstash/redis";

// Lazily create the client so missing env vars only throw at call time,
// not at module import time (which would break static builds).
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      throw new Error(
        "KV_REST_API_URL and KV_REST_API_TOKEN must be set. " +
          "Add an Upstash Redis integration in your Vercel project.",
      );
    }
    _redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return _redis;
}

export const HIKES_KEY = "mountain-tracker:hikes:v1";
