# Mountain-Tracker

A family hiking log for Western North Carolina: a running list of visits, editable notes, photos that stay in the browser, and a 3D topographic map with pins for places you have been.

This first slice ships ten seeded visits—six classic hikes plus four Asheville gardens and nature-center days—without accounts or a backend.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:43147](http://127.0.0.1:43147). The dev server binds port **43147** on `0.0.0.0` and allows `127.0.0.1` as a Next.js `allowedDevOrigins` host so client hydration works from that preview URL.

Hikes are stored in `localStorage`. Photos are stored in IndexedDB on the same device. Clearing site data removes both.

## Map tiles (no paid key)

The maps use [MapLibre GL JS](https://maplibre.org/) with public tiles (no paid key):

- **USGS topo:** [USGS The National Map](https://www.usgs.gov/programs/national-geospatial-program/national-map) `USGSTopo` raster, plus optional 3D hillshade from AWS Terrarium DEM. If WebGL is unavailable, this view falls back to a 2D National Map image with the same pins.
- **Isometric 3D:** a tilted elevation mesh built from public AWS Terrarium DEM tiles (proxied at `/api/dem/...`, source `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`) covering Asheville, the Blue Ridge, Pisgah, the Black Mountains / Mount Mitchell, and Dupont. Drag to orbit, scroll or pinch to zoom. Visit pins stay on the mesh. This view does not need a map API key. If DEM tiles fail to load, switch back to USGS topo.

New visits geocode through OpenStreetMap Nominatim and fall back to an Asheville pin if lookup fails.

An optional “Show OSM nearby” toggle asks the Overpass API for extra waterfalls and gardens. Failure there does not hide the ten seeded pins.

## Seeded visits

| Place | Kind | Area |
| --- | --- | --- |
| Catawba Falls | Waterfall | Pisgah NF, Old Fort |
| Triple Falls | Waterfall | Dupont State Recreational Forest |
| Hooker Falls | Waterfall | Dupont State Recreational Forest |
| Mount Mitchell Peak | Peak | Mount Mitchell State Park |
| Graveyard Fields | Trail | Blue Ridge Parkway MP 418.8 |
| Laurel Creek Falls | Waterfall | Banner Elk / Beech Mountain (Blue Ridge) |
| The North Carolina Arboretum | Garden | Bent Creek, Asheville |
| Botanical Gardens at Asheville | Garden | UNC Asheville |
| Biltmore Estate gardens | Garden | Biltmore Estate, Asheville |
| Western North Carolina Nature Center | Nature center | East Asheville |

## Public NC trail / park / waterfall data sources

These are real public sources you can use to extend the log. **AllTrails has no public API.**

- **OpenStreetMap Overpass** — trails, waterfalls, gardens, and POIs as OSM features. Used optionally in this app for nearby dots.
- **USGS** — topographic maps, The National Map, 3DEP elevation, and GNIS feature coordinates.
- **GNIS (USGS Geographic Names Information System)** — official names and coordinates for waterfalls, peaks, and populated places.
- **NPS** — Great Smoky Mountains and other park boundaries, visitor info, and geospatial datasets (NPMap / NPS Open Data).
- **USFS** — Pisgah and Nantahala National Forest recreation sites, MVUM roads, and FSGeodata.
- **NC State Parks** — park pages, GIS, and visitor alerts for sites such as Mount Mitchell and Dupont State Recreational Forest (jointly managed).
- **Recreation.gov** — campground and recreation site metadata for federal lands (API available with a key; not required here).

Coordinates for the seeded pins are WGS84 estimates of the named feature (falls, summit, garden, or nature center), not always the parking lot.
