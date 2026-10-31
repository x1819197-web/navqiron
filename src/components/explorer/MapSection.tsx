"use client";

import { useState } from "react";
import { Layers, MapPin, MousePointerClick } from "lucide-react";
import { MapCanvas } from "./MapCanvas";
import { DetailPanel } from "./DetailPanel";
import type { LayerState, Selected } from "./types";
import type { Boundary, Category, FreeFriend, MapPoint, TransitStop } from "@/lib/types";

interface MapSectionProps {
  points: MapPoint[];
  stops: TransitStop[];
  friends: FreeFriend[];
  friendsEnabled: boolean;
  selectedKey: string | null;
  selected: Selected | null;
  boundary: Boundary | null;
  apiKey: string;
  mapId: string;
  onSelect(point: MapPoint): void;
  onSelectFriend(id: number): void;
  onCloseDetail(): void;
  onRegister(): void;
  onShare(): void;
  layers: LayerState;
  onToggleLayer(kind: "event" | "place" | "friend"): void;
  counts: { events: number; places: number };
  legendCategories: Category[];
}

export function MapSection({
  points,
  stops,
  friends,
  friendsEnabled,
  selectedKey,
  selected,
  boundary,
  apiKey,
  mapId,
  onSelect,
  onSelectFriend,
  onCloseDetail,
  onRegister,
  onShare,
  layers,
  onToggleLayer,
  counts,
  legendCategories,
}: MapSectionProps) {
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <section id="map-section" className="relative order-2 scroll-mt-3 mx-3 h-[46dvh] min-h-[350px] overflow-hidden rounded-[26px] border border-white/10 bg-[#0a0614] shadow-soft lg:order-none lg:mx-0 lg:h-full lg:min-h-0 lg:rounded-[30px]">
      <MapCanvas
        points={points}
        stops={stops}
        friends={layers.friend ? friends : []}
        selectedKey={selectedKey}
        boundary={boundary}
        apiKey={apiKey}
        mapId={mapId}
        onSelect={onSelect}
        onSelectFriend={onSelectFriend}
        onMapClick={onCloseDetail}
        onReady={() => undefined}
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-start justify-between gap-2 lg:inset-x-4 lg:top-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 px-2.5 py-1.5 shadow-card glass">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
            <MapPin size={15} />
          </span>
          <div>
            <p className="text-[11px] font-extrabold leading-none text-ink">
              Yunusobod tumani
            </p>
            <p className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.14em] text-muted">
              Toshkent shahri
            </p>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-1 rounded-full border border-white/10 p-1 shadow-card glass">
          <LayerPill
            active={layers.event}
            onClick={() => onToggleLayer("event")}
            label="Tadbirlar"
            count={counts.events}
          />
          <LayerPill
            active={layers.place}
            onClick={() => onToggleLayer("place")}
            label="Foydali joylar"
            count={counts.places}
          />
          {friendsEnabled ? (
            <LayerPill
              active={layers.friend}
              onClick={() => onToggleLayer("friend")}
              label="Do'stlar"
              count={friends.length}
            />
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setLegendOpen((open) => !open)}
        className="absolute bottom-12 left-3 z-20 flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-extrabold text-ink-soft shadow-card glass sm:hidden"
        aria-expanded={legendOpen}
      >
        <Layers size={12} />
        Belgilar
      </button>

      <div
        className={`absolute bottom-24 left-3 z-20 w-[206px] rounded-2xl border border-white/10 p-3 shadow-card glass ${
          legendOpen ? "block" : "hidden"
        } sm:block sm:bottom-12`}
      >
        <p className="text-[8.5px] font-extrabold uppercase tracking-[0.18em] text-muted">
          Belgilar
        </p>
        <div className="mt-2 space-y-1.5">
          {legendCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 text-[10.5px] font-semibold text-ink-soft"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-2 border-t border-line/70 pt-2 text-[9.5px] font-medium text-muted">
          <span className="h-2.5 w-4 rounded border border-dashed border-violet-300/50 bg-violet-500/10" />
          Tuman chegarasi
        </div>
      </div>

      {!selected ? (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-ink-soft shadow-card glass md:flex">
          <MousePointerClick size={12} className="text-violet-300" />
          Nuqtani tanlang — batafsil ma&apos;lumot
        </div>
      ) : null}

      {selected ? (
        <DetailPanel
          key={selectedKey}
          selected={selected}
          onClose={onCloseDetail}
          onRegister={onRegister}
          onShare={onShare}
        />
      ) : null}
    </section>
  );
}

function LayerPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick(): void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-extrabold transition ${
        active ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_8px_20px_-10px_rgba(139,92,246,1)]" : "text-muted hover:bg-white/[0.06] hover:text-ink"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-lime" : "bg-muted/60"}`}
      />
      {label}
      <span
        className={`rounded-full px-1.5 text-[8.5px] ${
          active ? "bg-white/20 text-white" : "bg-white/[0.06] text-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
