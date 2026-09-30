import { type NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAuthenticated } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await req.formData();
  const hikeId = formData.get("hikeId");
  const file = formData.get("file");

  if (typeof hikeId !== "string" || !hikeId) {
    return NextResponse.json({ error: "hikeId is required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are accepted." }, { status: 400 });
  }

  const photoId = crypto.randomUUID();
  const blobPath = `photos/${hikeId}/${photoId}/${file.name}`;

  const blob = await put(blobPath, file, { access: "public" });

  return NextResponse.json({
    id: photoId,
    hikeId,
    name: file.name,
    type: file.type,
    url: blob.url,
    createdAt: new Date().toISOString(),
  });
}
