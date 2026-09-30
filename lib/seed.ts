import type { Hike } from "./types";

/** Seeded family visits. Coordinates are WGS84, aimed at the named feature (not parking). */
export const SEED_HIKES: Hike[] = [
  {
    id: "seed-catawba-falls",
    name: "Catawba Falls",
    date: "2025-04-12",
    placeType: "waterfall",
    locationLabel: "Pisgah National Forest, Old Fort",
    lat: 35.61333,
    lng: -82.23167,
    seeded: true,
    notes:
      "Creek walk in Pisgah just west of Old Fort to a ~100-foot fall, with an upper drop a short scramble beyond. The rebuilt trail stays close to Catawba Creek the whole way—expect wet rock and a full afternoon if the kids linger at the pools.",
  },
  {
    id: "seed-triple-falls",
    name: "Triple Falls",
    date: "2025-05-18",
    placeType: "waterfall",
    locationLabel: "Dupont State Recreational Forest",
    lat: 35.1975,
    lng: -82.6175,
    seeded: true,
    notes:
      "Three stacked drops on the Little River. The overlook trail is wide and family-friendly; stairs drop to a middle platform that makes the height obvious. Same Dupont morning as Hooker Falls, with a picnic at the river after.",
  },
  {
    id: "seed-hooker-falls",
    name: "Hooker Falls",
    date: "2025-05-18",
    placeType: "waterfall",
    locationLabel: "Dupont State Recreational Forest",
    lat: 35.2025,
    lng: -82.62306,
    seeded: true,
    notes:
      "A short, nearly level walk from the Hooker Falls lot to a wide 12-foot horseshoe. Summer swimming hole below the lip; in spring it is a loud sheet of whitewater. Easy add-on after Triple Falls.",
  },
  {
    id: "seed-mount-mitchell",
    name: "Mount Mitchell Peak",
    date: "2025-06-21",
    placeType: "peak",
    locationLabel: "Mount Mitchell State Park, Blue Ridge Parkway",
    lat: 35.76472,
    lng: -82.265,
    seeded: true,
    notes:
      "Highest summit east of the Mississippi at 6,684 feet. We drove the Parkway to the state park, walked the paved path to the observation deck, and stood in cold spruce-fir wind. The museum and picnic area make it doable with kids even when the summit is in cloud.",
  },
  {
    id: "seed-graveyard-fields",
    name: "Graveyard Fields",
    date: "2025-07-04",
    placeType: "trail",
    locationLabel: "Blue Ridge Parkway, milepost 418.8",
    lat: 35.32056,
    lng: -82.84722,
    seeded: true,
    notes:
      "A broad, storm-opened valley on the Parkway with boardwalk, berry thickets, and short walks to Second Falls and Yellowstone Falls. We stayed on the lower loop—crowded on a holiday weekend, but the creek crossings kept everyone happy.",
  },
  {
    id: "seed-laurel-creek",
    name: "Laurel Creek Falls",
    date: "2025-08-09",
    placeType: "waterfall",
    locationLabel: "Banner Elk / Beech Mountain, Blue Ridge",
    lat: 36.165,
    lng: -81.8472,
    seeded: true,
    notes:
      "Also called Secret Falls: a sliding-rock cascade on Laurel Creek off the Beech Mountain road. Short, steep social trail with slick roots—more creek play than a maintained park walk. We treated it as a Blue Ridge side trip, not a Dupont-style overlook.",
  },
  {
    id: "seed-nc-arboretum",
    name: "The North Carolina Arboretum",
    date: "2025-03-22",
    placeType: "garden",
    locationLabel: "Bent Creek, Asheville",
    lat: 35.50015,
    lng: -82.60647,
    seeded: true,
    notes:
      "434 acres in the Bent Creek valley, with the Quilt Garden, greenhouse, and miles of walking paths that connect toward the Blue Ridge Parkway. The Baker Exhibit Center and café made it an easy Asheville morning before anyone was ready for a waterfall hike.",
  },
  {
    id: "seed-botanical-gardens-avl",
    name: "Botanical Gardens at Asheville",
    date: "2025-04-05",
    placeType: "garden",
    locationLabel: "UNC Asheville campus",
    lat: 35.6164,
    lng: -82.5657,
    seeded: true,
    notes:
      "Ten acres of native Southern Appalachian plants along a creek on the UNCA campus. Free, close to town, and dense with spring ephemerals. We used it as a slow nature-center walk rather than a mileage hike.",
  },
  {
    id: "seed-biltmore-gardens",
    name: "Biltmore Estate gardens",
    date: "2025-09-01",
    placeType: "garden",
    locationLabel: "Biltmore Estate, Asheville",
    lat: 35.5388,
    lng: -82.5505,
    seeded: true,
    notes:
      "Olmsted’s gardens beside the house: Italian Garden pools, the walled garden’s glasshouses, and the azalea slope when it is in season. Ticketed estate day, not a forest trail—still the most planted landscape we log around Asheville.",
  },
  {
    id: "seed-wnc-nature-center",
    name: "Western North Carolina Nature Center",
    date: "2025-03-08",
    placeType: "nature-center",
    locationLabel: "East Asheville",
    lat: 35.5642,
    lng: -82.4975,
    seeded: true,
    notes:
      "A compact wildlife park of Appalachian animals—red wolves, otters, cougars, and a farmyard—set on a wooded hillside above Gashes Creek. We go for the animal paths and the small nature-play areas, then grab the rest of the day in town.",
  },
];
