"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { AddHikeDialog } from "@/components/add-hike-dialog";
import { LoginDialog } from "@/components/login-dialog";
import { useHikes } from "@/components/hikes-provider";
import { PLACE_TYPE_LABELS } from "@/lib/types";
import type { Hike } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, (month ?? 1) - 1, day ?? 1));
}

export function HikeList({
  selectedId,
  onSelect,
}: {
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const { hikes, status, error, restoreSeeds, retry } = useHikes();
  const { state: authState } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hikes;
    return hikes.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.locationLabel.toLowerCase().includes(q) ||
        h.notes.toLowerCase().includes(q),
    );
  }, [hikes, query]);

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Family visits</CardTitle>
            <CardDescription>
              Waterfalls, peaks, and Asheville gardens in Western North Carolina.
            </CardDescription>
          </div>
          {status === "ready" ? (
            authState === "authenticated" ? (
              <AddHikeDialog />
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLogin(true)}
              >
                Sign in to add
              </Button>
            )
          ) : null}
          {showLogin ? (
            <LoginDialog onClose={() => setShowLogin(false)} />
          ) : null}
        </div>
        {status === "ready" && hikes.length > 0 ? (
          <div className="relative mt-1">
            <Input
              type="search"
              placeholder="Search name, location, or notes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 pr-8 text-sm"
              aria-label="Search hikes"
            />
            {query ? (
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {filtered.length}/{hikes.length}
              </span>
            ) : null}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="max-h-[min(70vh,720px)] overflow-y-auto pt-4">
        {status === "loading" ? <LoadingState /> : null}
        {status === "error" ? (
          <ErrorState message={error} onRetry={retry} onRestore={restoreSeeds} />
        ) : null}
        {status === "ready" && hikes.length === 0 ? (
          <EmptyState onRestore={restoreSeeds} onLoginRequest={() => setShowLogin(true)} />
        ) : null}
        {status === "ready" && hikes.length > 0 ? (
          filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No visits match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="grid gap-2">
              {filtered.map((hike) => (
                <li key={hike.id}>
                  <HikeRow
                    hike={hike}
                    selected={hike.id === selectedId}
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

function HikeRow({
  hike,
  selected,
  onSelect,
}: {
  hike: Hike;
  selected: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-lg p-3 ring-1 transition-colors ${
        selected
          ? "bg-muted ring-foreground/20"
          : "ring-foreground/10 hover:bg-muted/60"
      }`}
    >
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => onSelect?.(hike.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium">{hike.name}</p>
          <Badge variant="secondary">{PLACE_TYPE_LABELS[hike.placeType]}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(hike.date)} · {hike.locationLabel}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {hike.notes || "No notes yet."}
        </p>
      </button>
      <div className="mt-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          nativeButton={false}
          render={<Link href={`/hikes/${hike.id}`} />}
        >
          Notes and photos
        </Button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-2" aria-live="polite" aria-busy="true">
      <p className="text-sm text-muted-foreground">Loading the hike log…</p>
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="h-24 animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
  );
}

function EmptyState({
  onRestore,
  onLoginRequest,
}: {
  onRestore: () => void;
  onLoginRequest: () => void;
}) {
  const { state: authState } = useAuth();
  return (
    <div className="grid gap-3 py-8 text-center">
      <p className="font-medium">No visits logged yet</p>
      <p className="text-sm text-muted-foreground">
        Add a hike, garden, or nature-center day, or restore the seeded Western
        North Carolina list.
      </p>
      <div className="flex justify-center gap-2">
        {authState === "authenticated" ? (
          <AddHikeDialog />
        ) : (
          <Button variant="outline" onClick={onLoginRequest}>
            Sign in to add
          </Button>
        )}
        <Button variant="outline" onClick={onRestore}>
          Restore seed visits
        </Button>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  onRestore,
}: {
  message: string | null;
  onRetry: () => void;
  onRestore: () => void;
}) {
  return (
    <div className="grid gap-3 py-8 text-center">
      <p className="font-medium">Could not load the hike list</p>
      <p className="text-sm text-muted-foreground">
        {message ?? "The saved log looks damaged."} You can retry or replace it
        with the seeded visits.
      </p>
      <div className="flex justify-center gap-2">
        <Button onClick={onRetry}>Retry</Button>
        <Button variant="outline" onClick={onRestore}>
          Restore seed visits
        </Button>
      </div>
    </div>
  );
}
