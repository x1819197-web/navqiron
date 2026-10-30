import type { Boundary, MapPoint, TransitStop } from "@/lib/types";

export interface MapApi {
  zoomIn(): void;
  zoomOut(): void;
  reset(): void;
  locate(): void;
}

export interface MapComponentProps {
  points: MapPoint[];
  stops: TransitStop[];
  selectedKey: string | null;
  boundary: Boundary | null;
  onSelect(point: MapPoint): void;
  onMapClick(): void;
  onReady(api: MapApi): void;
  onError?(message: string): void;
}
