// Prepares public/data/world-countries.geojson from a Natural Earth 110m
// admin_0_countries GeoJSON (the dataset globe.gl's own examples use — its
// geometry triangulates cleanly, unlike older world map files that produce
// floating-ribbon artifacts on extruded country caps).
//
// Keeps only what NationsGlobe needs: feature.id = ISO3, properties.name.
//
// Usage: node scripts/prepWorldGeojson.mjs <ne_110m_admin_0_countries.geojson>

import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2];
if (!src) {
  console.error("Usage: node scripts/prepWorldGeojson.mjs <source.geojson>");
  process.exit(1);
}

const geo = JSON.parse(readFileSync(src, "utf8"));

const features = geo.features.map((f) => ({
  type: "Feature",
  id: f.properties.ISO_A3 || f.id,
  properties: { name: f.properties.ADMIN || f.properties.NAME },
  geometry: f.geometry,
}));

const out = { type: "FeatureCollection", features };
writeFileSync("public/data/world-countries.geojson", JSON.stringify(out));

console.log(`Wrote ${features.length} countries.`);
const want = ["KAZ", "IND", "KEN", "GHA", "BRA", "CHN", "RUS", "ZAF", "NGA", "USA"];
const ids = new Set(features.map((f) => f.id));
const missing = want.filter((id) => !ids.has(id));
console.log(missing.length ? `MISSING: ${missing.join(", ")}` : "All 10 nations present.");
