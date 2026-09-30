"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { addPhoto, deletePhoto, listPhotos, type PhotoRecord } from "@/lib/photos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PhotoGallery({ hikeId }: { hikeId: string }) {
  const { state: authState } = useAuth();
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listPhotos(hikeId)
      .then((rows) => {
        if (cancelled) return;
        setPhotos(rows);
        setStatus("ready");
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Photos could not be read.");
      });
    return () => {
      cancelled = true;
    };
  }, [hikeId, epoch]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        await addPhoto(hikeId, file);
      }
      setEpoch((value) => value + 1);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not upload photos.");
    }
  }

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-medium">Photos</h2>
          <p className="text-sm text-muted-foreground">
            Stored in Vercel Blob. Visible to anyone with the link.
          </p>
        </div>
        {authState === "authenticated" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="photo-upload">Add photos</Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                void onFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </div>
        ) : null}
      </div>
      {status === "loading" ? (
        <p className="text-sm text-muted-foreground">Loading photos…</p>
      ) : null}
      {status === "error" ? (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <p>{error}</p>
          <Button
            className="mt-2"
            size="sm"
            variant="outline"
            onClick={() => setEpoch((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      ) : null}
      {status === "ready" && photos.length === 0 ? (
        <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          No photos for this visit yet.
          {authState !== "authenticated"
            ? " Sign in to upload photos."
            : " Add some above."}
        </p>
      ) : null}
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.name}
                className="h-36 w-full object-cover"
              />
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-xs text-muted-foreground">
                  {photo.name}
                </span>
                {authState === "authenticated" ? (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={async () => {
                      await deletePhoto(photo.id, hikeId);
                      setEpoch((value) => value + 1);
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
