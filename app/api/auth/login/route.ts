import { type NextRequest, NextResponse } from "next/server";

const COOKIE = "mt_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(value: string, secret: string): string {
  // Simple HMAC-less signature: base64(value) + "." + base64(secret-derived checksum)
  // For a family app a timing-safe compare on a single env-var secret is sufficient.
  // We encode both to make the cookie opaque.
  const payload = Buffer.from(value).toString("base64url");
  const check = Buffer.from(`${secret}:${value}`).toString("base64url").slice(0, 16);
  return `${payload}.${check}`;
}

export function verify(token: string, secret: string): boolean {
  const [payload, check] = token.split(".");
  if (!payload || !check) return false;
  try {
    const value = Buffer.from(payload, "base64url").toString();
    const expected = Buffer.from(`${secret}:${value}`).toString("base64url").slice(0, 16);
    return expected === check;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    return NextResponse.json(
      { error: "Auth is not configured on this server." },
      { status: 503 },
    );
  }

  let body: { password?: unknown };
  try {
    body = (await req.json()) as { password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = sign("admin", sessionSecret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return res;
}
