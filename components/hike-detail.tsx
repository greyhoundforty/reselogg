"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { PhotoGallery } from "@/components/photo-gallery";
import { useHikes } from "@/components/hikes-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PLACE_TYPE_LABELS } from "@/lib/types";

const VisitMaps = dynamic(
  () => import("@/components/visit-maps").then((mod) => mod.VisitMaps),
  { ssr: false },
);

export function HikeDetail({ hikeId }: { hikeId: string }) {
  const router = useRouter();
  const { state: authState } = useAuth();
  const { hikes, status, updateHike, deleteHike, error, retry } = useHikes();
  const hike = hikes.find((item) => item.id === hikeId);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [headerUrl, setHeaderUrl] = useState<string | null>(null);
  const [headerUploading, setHeaderUploading] = useState(false);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when the hike changes
  if (hike && hike.id !== draftId) {
    setDraftId(hike.id);
    setNotes(hike.notes);
    setSaved(false);
    setHeaderUrl(hike.headerImageUrl ?? null);
  }

  async function uploadHeader(file: File) {
    setHeaderUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/hikes/${hike!.id}/header`, { method: "POST", body });
      if (!res.ok) throw new Error("Upload failed.");
      const data = (await res.json()) as { url: string };
      setHeaderUrl(data.url);
      // Keep local hike record in sync so stats / list re-render correctly
      updateHike(hike!.id, { headerImageUrl: data.url });
    } finally {
      setHeaderUploading(false);
    }
  }

  async function removeHeader() {
    await fetch(`/api/hikes/${hike!.id}/header`, { method: "DELETE" });
    setHeaderUrl(null);
    updateHike(hike!.id, { headerImageUrl: undefined });
  }

  if (status === "loading") {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <p className="text-sm text-muted-foreground">Loading this visit…</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <p className="font-medium">Could not load visits</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-3" onClick={retry}>
          Retry
        </Button>
      </main>
    );
  }

  if (!hike) {
    return (
      <main className="mx-auto grid w-full max-w-4xl flex-1 gap-3 px-4 py-8">
        <p className="font-medium">That visit is not in this browser&apos;s log</p>
        <p className="text-sm text-muted-foreground">
          It may have been removed, or you are on a device that never saved it.
        </p>
        <Button nativeButton={false} render={<Link href="/" />}>
          Back to the list
        </Button>
      </main>
    );
  }

  const activeHeader = headerUrl ?? hike.headerImageUrl;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            nativeButton={false}
            render={<Link href="/" />}
          >
            ← All visits
          </Button>
          <h1 className="font-heading mt-2 text-2xl font-medium">{hike.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hike.date} · {hike.locationLabel} · {hike.lat.toFixed(5)},{" "}
            {hike.lng.toFixed(5)}
          </p>
        </div>
        <Badge variant="secondary">{PLACE_TYPE_LABELS[hike.placeType]}</Badge>
      </div>

      {/* ── Header image ───────────────────────────────────────────── */}
      {activeHeader ? (
        <div className="relative mt-4 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeHeader}
            alt={`Header image for ${hike.name}`}
            className="h-56 w-full object-cover sm:h-72"
          />
          {authState === "authenticated" ? (
            <div className="absolute right-3 top-3 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={() => headerInputRef.current?.click()}
                disabled={headerUploading}
              >
                {headerUploading ? "Uploading…" : "Change"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={removeHeader}
              >
                Remove
              </Button>
            </div>
          ) : null}
        </div>
      ) : authState === "authenticated" ? (
        <div
          className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-foreground/15 py-8 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          onClick={() => headerInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && headerInputRef.current?.click()}
        >
          {headerUploading ? "Uploading…" : "Add a header image"}
        </div>
      ) : null}

      {/* Hidden file input for header image */}
      <input
        ref={headerInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadHeader(file);
          e.target.value = "";
        }}
      />

      {/* ── Notes + Map (side by side) ─────────────────────────────── */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-5">
          <section className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              readOnly={authState !== "authenticated"}
              onChange={(event) => {
                setNotes(event.target.value);
                setSaved(false);
              }}
              className="min-h-52"
            />
            {authState === "authenticated" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    updateHike(hike.id, { notes });
                    setSaved(true);
                  }}
                >
                  Save notes
                </Button>
                {saved ? (
                  <span className="self-center text-sm text-muted-foreground">
                    Saved.
                  </span>
                ) : null}
              </div>
            ) : null}
          </section>
          <PhotoGallery hikeId={hike.id} />
          {authState === "authenticated" ? (
            <div>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteHike(hike.id);
                  router.push("/");
                }}
              >
                Remove this visit
              </Button>
            </div>
          ) : null}
        </div>

        {/* Map — stretches to match the left column height */}
        <div className="lg:sticky lg:top-4">
          <div className="h-[320px] lg:h-[420px]">
            <VisitMaps
              hikes={hikes}
              selectedId={hike.id}
              showDetailLink={false}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
