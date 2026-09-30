import { cookies } from "next/headers";
import { verify } from "@/app/api/auth/login/route";

export async function isAuthenticated(): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const store = await cookies();
  const token = store.get("mt_session")?.value;
  if (!token) return false;
  return verify(token, secret);
}
