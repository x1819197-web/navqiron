// OSM relation/2448072 (Yunusobod tumani) -> GeoJSON boundary.
// Run: node scripts/build-boundary.mjs
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const raw = JSON.parse(fs.readFileSync(path.join(root, "yunus_relation.json"), "utf8"));
const nodes = new Map();
const ways = new Map();

for (const el of raw.elements) {
  if (el.type === "node") nodes.set(el.id, [el.lon, el.lat]);
  if (el.type === "way") ways.set(el.id, el.nodes);
}

const relation = raw.elements.find((el) => el.type === "relation");
const outerIds = relation.members
  .filter((m) => m.type === "way" && m.role === "outer")
  .map((m) => m.ref);

// Stitch way segments into closed rings by matching endpoints.
const segments = outerIds.map((id) => [...(ways.get(id) || [])]).filter((s) => s.length > 1);
const rings = [];
while (segments.length) {
  const ring = segments.shift();
  let guard = 0;
  while (ring[0] !== ring[ring.length - 1] && guard++ < 200) {
    const tail = ring[ring.length - 1];
    let found = -1;
    let flip = false;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg[0] === tail) { found = i; flip = false; break; }
      if (seg[seg.length - 1] === tail) { found = i; flip = true; break; }
    }
    if (found === -1) break;
    const seg = segments.splice(found, 1)[0];
    const add = flip ? [...seg].reverse() : seg;
    ring.push(...add.slice(1));
  }
  if (ring.length > 3 && ring[0] === ring[ring.length - 1]) rings.push(ring);
}

const coords = rings
  .map((ring) => ring.map((id) => nodes.get(id)).filter(Boolean))
  .filter((r) => r.length > 3);

const all = coords.flat();
const bbox = [
  Math.min(...all.map((c) => c[0])),
  Math.min(...all.map((c) => c[1])),
  Math.max(...all.map((c) => c[0])),
  Math.max(...all.map((c) => c[1])),
];

const geojson = {
  type: "FeatureCollection",
  features: coords.map((ring) => ({
    type: "Feature",
    properties: { name: "Yunusobod tumani" },
    geometry: { type: "Polygon", coordinates: [ring] },
  })),
};

const outDir = path.join(root, "public", "data");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "yunusobod-boundary.geojson"), JSON.stringify(geojson, null, 2));

// Simplified ring for the public map (Douglas-Peucker, ~25m tolerance).
function sqSegDist(p, a, b) {
  let x = a[0], y = a[1];
  let dx = b[0] - x, dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) { x = b[0]; y = b[1]; } else if (t > 0) { x += dx * t; y += dy * t; }
  }
  dx = p[0] - x; dy = p[1] - y;
  return dx * dx + dy * dy;
}
function simplify(points, tolerance) {
  if (points.length <= 4) return points;
  const sqTol = tolerance * tolerance;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxDist = 0, index = -1;
    for (let i = first + 1; i < last; i++) {
      const dist = sqSegDist(points[i], points[first], points[last]);
      if (dist > maxDist) { maxDist = dist; index = i; }
    }
    if (maxDist > sqTol) {
      keep[index] = true;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const simplified = {
  type: "FeatureCollection",
  features: coords.map((ring) => ({
    type: "Feature",
    properties: { name: "Yunusobod tumani" },
    geometry: { type: "Polygon", coordinates: [simplify(ring, 0.0003)] },
  })),
};

fs.writeFileSync(path.join(outDir, "yunusobod-boundary.min.geojson"), JSON.stringify(simplified));

console.log(JSON.stringify({ rings: coords.length, points: all.length, simplifiedPoints: simplified.features.reduce((n, f) => n + f.geometry.coordinates[0].length, 0), bbox }, null, 2));
