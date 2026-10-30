import fs from "node:fs";
import path from "node:path";
import type { Boundary } from "./types";

export function loadBoundary(): Boundary | null {
  try {
    const file = path.join(process.cwd(), "public", "data", "yunusobod-boundary.min.geojson");
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as {
      features?: { geometry?: { coordinates?: unknown } }[];
    };
    const geometry = raw.features?.[0]?.geometry;
    const ring = (geometry?.coordinates as (number | unknown)[][] | undefined)?.[0];
    if (!Array.isArray(ring) || ring.length < 3) return null;
    const coordinates = ring
      .filter(
        (point): point is [number, number] =>
          Array.isArray(point) &&
          point.length >= 2 &&
          typeof point[0] === "number" &&
          typeof point[1] === "number",
      )
      .map((point) => [point[0], point[1]] as [number, number]);
    if (coordinates.length < 3) return null;

    const lngs = coordinates.map((c) => c[0]);
    const lats = coordinates.map((c) => c[1]);
    const bbox: [number, number, number, number] = [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats),
    ];
    return {
      coordinates,
      bbox,
      center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
    };
  } catch {
    return null;
  }
}
