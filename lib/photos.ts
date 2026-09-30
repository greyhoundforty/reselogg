export type PhotoRecord = {
  id: string;
  hikeId: string;
  name: string;
  url: string;
  createdAt: string;
};

type ListResponse = { photos: PhotoRecord[] };
type UploadResponse = PhotoRecord & { type?: string };

export async function listPhotos(hikeId: string): Promise<PhotoRecord[]> {
  const res = await fetch(`/api/photos?hikeId=${encodeURIComponent(hikeId)}`);
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Could not load photos.");
  }
  const data = (await res.json()) as ListResponse;
  return data.photos;
}

export async function addPhoto(hikeId: string, file: File): Promise<PhotoRecord> {
  const body = new FormData();
  body.append("hikeId", hikeId);
  body.append("file", file);

  const res = await fetch("/api/photos/upload", { method: "POST", body });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Could not upload photo.");
  }
  const data = (await res.json()) as UploadResponse;
  return {
    id: data.id,
    hikeId: data.hikeId,
    name: data.name,
    url: data.url,
    createdAt: data.createdAt,
  };
}

export async function deletePhoto(id: string, hikeId: string): Promise<void> {
  const res = await fetch(
    `/api/photos/${encodeURIComponent(id)}?hikeId=${encodeURIComponent(hikeId)}`,
    { method: "DELETE" },
  );
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Could not delete photo.");
  }
}
