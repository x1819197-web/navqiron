"use client";

import { useMemo } from "react";
import { ArrowDownWideNarrow } from "lucide-react";
import { EmptyState, EventCard, PlaceCard } from "./Cards";
import { dateKeyOf, dayLabel } from "@/lib/format";
import type { Selected, Tab } from "./types";
import type { EventItem, PlaceItem } from "@/lib/types";

interface ListPanelProps {
  tab: Tab;
  events: EventItem[];
  places: PlaceItem[];
  selected: Selected | null;
  query: string;
  onSelectEvent(id: number): void;
  onSelectPlace(id: number): void;
  onResetFilters(): void;
}

export function ListPanel({
  tab,
  events,
  places,
  selected,
  query,
  onSelectEvent,
  onSelectPlace,
  onResetFilters,
}: ListPanelProps) {
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: EventItem[] }>();
    for (const event of events) {
      const key = dateKeyOf(event.startsAt);
      if (!map.has(key)) {
        map.set(key, { label: dayLabel(event.startsAt), items: [] });
      }
      map.get(key)!.items.push(event);
    }
    return Array.from(map.values());
  }, [events]);

  const total = tab === "events" ? events.length : places.length;

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1">
      <div className="flex items-center justify-between gap-3 px-4 pb-2.5 pt-3.5 sm:px-6 lg:px-5">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[15px] font-bold tracking-[-0.01em] text-ink">
            {query ? "Qidiruv natijalari" : tab === "events" ? "Yaqin tadbirlar" : "Foydali joylar"}
          </h2>
          <span className="rounded-full bg-lime/70 px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-pine">
            {total}
          </span>
        </div>
        {tab === "events" ? (
          <span className="flex items-center gap-1 pb-0.5 text-[10px] font-semibold text-muted">
            <ArrowDownWideNarrow size={12} className="text-pine-soft" />
            Sana bo&apos;yicha
          </span>
        ) : null}
      </div>

      <div className="scroll-area min-h-0 flex-1 px-4 pb-5 sm:px-6 lg:overflow-y-auto lg:px-5">
        {total === 0 ? (
          <EmptyState onReset={onResetFilters} />
        ) : tab === "events" ? (
          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.label}>
                <div className="sticky top-0 z-10 -mx-1 flex items-center gap-2 bg-paper/95 px-1 py-1.5 backdrop-blur">
                  <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    {group.label}
                  </span>
                  <span className="h-px flex-1 bg-line/70" />
                  <span className="rounded-full bg-cream px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums text-muted">
                    {group.items.length}
                  </span>
                </div>
                <div className="mt-1.5 space-y-2">
                  {group.items.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      active={selected?.kind === "event" && selected.item.id === event.id}
                      onSelect={() => onSelectEvent(event.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                active={selected?.kind === "place" && selected.item.id === place.id}
                onSelect={() => onSelectPlace(place.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
