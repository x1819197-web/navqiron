import type { EventItem, PlaceItem } from "@/lib/types";

export type Tab = "events" | "places";
export type DateRange = "all" | "today" | "week" | "month";

export type Selected =
  | { kind: "event"; item: EventItem }
  | { kind: "place"; item: PlaceItem };

export interface LayerState {
  event: boolean;
  place: boolean;
  friend: boolean;
}
