import { loadBoundary } from "./boundary";
import type { Boundary, TransitKind, TransitStop } from "./types";

const OVERPASS_ENDPOINTS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const REQUEST_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const EMPTY_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_STOPS = 400;

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

interface Candidate {
  stop: TransitStop;
  priority: number;
}

function buildQuery(boundary: Boundary): string {
  const [west, south, east, north] = boundary.bbox;
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:25];(
node["railway"="station"]["station"="subway"](${bbox});
node["railway"="subway_entrance"](${bbox});
node["highway"="bus_stop"](${bbox});
node["amenity"="bus_station"](${bbox});
node["public_transport"="stop_position"](${bbox});
node["public_transport"="platform"](${bbox});
);out body;`;
}

function insidePolygon(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function metersBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = (aLat - bLat) * 111_320;
  const dLng = (aLng - bLng) * 111_320 * Math.cos(((aLat + bLat) / 2) * (Math.PI / 180));
  return Math.hypot(dLat, dLng);
}

function classify(tags: Record<string, string>): { kind: TransitKind; priority: number } | null {
  if (tags.railway === "station" && tags.station === "subway") {
    return { kind: "metro", priority: 0 };
  }
  if (tags.railway === "subway_entrance") {
    return { kind: "metro", priority: 2 };
  }
  if (tags.highway === "bus_stop") {
    return { kind: "bus", priority: 0 };
  }
  if (tags.amenity === "bus_station") {
    return { kind: "bus", priority: 1 };
  }
  const isBusPublic =
    tags.bus === "yes" || tags.trolleybus === "yes" || tags.tram === "yes";
  if (tags.public_transport === "stop_position" && isBusPublic) {
    return { kind: "bus", priority: 2 };
  }
  if (tags.public_transport === "platform" && isBusPublic) {
    return { kind: "bus", priority: 3 };
  }
  return null;
}

function stopName(tags: Record<string, string>): string | null {
  const name = (tags["name:uz"] || tags.name || "").trim();
  if (!name || name === "?") return null;
  return name;
}

async function fetchElements(query: string): Promise<OverpassElement[] | null> {
  const body = new URLSearchParams({ data: query });
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": "Navqiron/1.0 (Yunusobod youth map)",
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const payload = (await res.json()) as { elements?: OverpassElement[] };
      if (Array.isArray(payload.elements)) return payload.elements;
    } catch {
      // try the next mirror
    }
  }
  return null;
}

function toStops(elements: OverpassElement[], boundary: Boundary): TransitStop[] {
  const candidates: Candidate[] = [];

  for (const element of elements) {
    if (typeof element.lat !== "number" || typeof element.lon !== "number") continue;
    const tags = element.tags ?? {};
    const type = classify(tags);
    if (!type) continue;
    const name = stopName(tags);
    if (!name) continue;
    if (!insidePolygon(element.lat, element.lon, boundary.coordinates)) continue;
    candidates.push({
      stop: {
        id: `osm-${element.id}`,
        name,
        lat: element.lat,
        lng: element.lon,
        kind: type.kind,
      },
      priority: type.priority,
    });
  }

  candidates.sort((a, b) => a.priority - b.priority);

  const kept: TransitStop[] = [];
  for (const { stop } of candidates) {
    const duplicate = kept.some((other) => {
      if (other.kind !== stop.kind) return false;
      const distance = metersBetween(other.lat, other.lng, stop.lat, stop.lng);
      if (stop.kind === "metro") return distance < 350;
      return other.name.toLowerCase() === stop.name.toLowerCase() && distance < 70;
    });
    if (!duplicate) kept.push(stop);
    if (kept.length >= MAX_STOPS) break;
  }

  return kept;
}

interface TransitCache {
  stops: TransitStop[];
  at: number;
}

const memo = globalThis as unknown as { __navqironTransitCache?: TransitCache };

export async function getTransitStops(): Promise<TransitStop[]> {
  const boundary = loadBoundary();
  if (!boundary) return [];

  const cached = memo.__navqironTransitCache;
  if (cached) {
    const ttl = cached.stops.length > 0 ? CACHE_TTL_MS : EMPTY_CACHE_TTL_MS;
    if (Date.now() - cached.at < ttl) return cached.stops;
  }

  const elements = await fetchElements(buildQuery(boundary));
  const stops = elements ? toStops(elements, boundary) : [];
  if (elements) {
    memo.__navqironTransitCache = { stops, at: Date.now() };
  }
  return stops;
}
