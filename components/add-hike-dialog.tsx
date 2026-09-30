"use client";

import { useState, type FormEvent } from "react";
import { geocodeInNorthCarolina } from "@/lib/geocode";
import { PLACE_TYPES, PLACE_TYPE_LABELS, type PlaceType } from "@/lib/types";
import { useHikes } from "@/components/hikes-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const today = () => new Date().toISOString().slice(0, 10);

export function AddHikeDialog() {
  const { addHike } = useHikes();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(today);
  const [placeType, setPlaceType] = useState<PlaceType>("trail");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [geoWarning, setGeoWarning] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setDate(today());
    setPlaceType("trail");
    setLocation("");
    setLat("");
    setLng("");
    setNotes("");
    setPending(false);
    setFormError(null);
    setGeoWarning(null);
  }

  function close() {
    setOpen(false);
    resetForm();
  }

  function validate(): string | null {
    if (!name.trim()) return "Give the visit a name.";
    if (!date) return "Pick the date you went.";
    if (!PLACE_TYPES.includes(placeType)) return "Choose a place type.";
    if (lat.trim() || lng.trim()) {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        return "Latitude must be a number between -90 and 90.";
      }
      if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
        return "Longitude must be a number between -180 and 180.";
      }
    }
    return null;
  }

  function saveVisit(opts: {
    lat: number;
    lng: number;
    locationLabel: string;
  }) {
    addHike({
      id: crypto.randomUUID(),
      name: name.trim(),
      date,
      placeType,
      notes: notes.trim(),
      lat: opts.lat,
      lng: opts.lng,
      locationLabel: opts.locationLabel,
      seeded: false,
    });
    close();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const validation = validate();
    if (validation) {
      setFormError(validation);
      setGeoWarning(null);
      return;
    }
    setPending(true);
    setFormError(null);
    setGeoWarning(null);

    if (lat.trim() && lng.trim()) {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      saveVisit({
        lat: parsedLat,
        lng: parsedLng,
        locationLabel:
          location.trim() ||
          `${parsedLat.toFixed(5)}, ${parsedLng.toFixed(5)}`,
      });
      return;
    }

    const query = location.trim() || name.trim();
    const geo = await geocodeInNorthCarolina(query);
    setPending(false);
    if (geo.fallback) {
      setLat(String(geo.lat));
      setLng(String(geo.lng));
      setGeoWarning(
        geo.error ??
          "Could not find that place. Enter coordinates, or save with an Asheville pin.",
      );
      return;
    }
    saveVisit({
      lat: geo.lat,
      lng: geo.lng,
      locationLabel: location.trim() || geo.locationLabel,
    });
  }

  return (
    <>
      <Button
        type="button"
        data-testid="add-hike-button"
        onClick={() => {
          setFormError(null);
          setGeoWarning(null);
          setOpen(true);
        }}
      >
        Add a hike
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close add hike form"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-hike-title"
            data-testid="add-hike-dialog"
            className="relative z-10 max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
          >
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-1">
                <h2 id="add-hike-title" className="font-heading text-base font-medium">
                  Log a visit
                </h2>
                <p className="text-sm text-muted-foreground">
                  Name, date, place type, location, and notes. We geocode North
                  Carolina places; if that fails, enter coordinates or drop an
                  Asheville pin.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="hike-name">Name</Label>
                  <Input
                    id="hike-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Looking Glass Falls"
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="hike-date">Date</Label>
                  <Input
                    id="hike-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="hike-type">Place type</Label>
                  <select
                    id="hike-type"
                    value={placeType}
                    onChange={(event) =>
                      setPlaceType(event.target.value as PlaceType)
                    }
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {PLACE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {PLACE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="hike-location">Location</Label>
                  <Input
                    id="hike-location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Pisgah National Forest, or 35.46, -82.65"
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="hike-lat">Latitude (optional)</Label>
                    <Input
                      id="hike-lat"
                      inputMode="decimal"
                      value={lat}
                      onChange={(event) => setLat(event.target.value)}
                      placeholder="35.4665"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="hike-lng">Longitude (optional)</Label>
                    <Input
                      id="hike-lng"
                      inputMode="decimal"
                      value={lng}
                      onChange={(event) => setLng(event.target.value)}
                      placeholder="-82.6500"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="hike-notes">Notes</Label>
                  <Textarea
                    id="hike-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Who went, trail conditions, what the kids noticed."
                  />
                </div>
                {formError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {formError}
                  </p>
                ) : null}
                {geoWarning ? (
                  <div
                    role="alert"
                    className="grid gap-2 rounded-lg bg-muted p-3 text-sm"
                  >
                    <p>{geoWarning}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        saveVisit({
                          lat: Number(lat) || 35.5951,
                          lng: Number(lng) || -82.5515,
                          locationLabel:
                            location.trim() ||
                            `${name.trim()} (Asheville fallback)`,
                        })
                      }
                    >
                      Save with Asheville pin
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Finding a pin…" : "Save visit"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
