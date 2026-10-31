"use client";

import { ArrowUpRight, Clock3, MapPin, Users } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { formatCount, formatDayBadge, formatTime, formatTimeRange } from "@/lib/format";
import { lightenHex, withAlpha } from "@/lib/colors";
import type { EventItem, PlaceItem } from "@/lib/types";

export function EventCard({
  event,
  active,
  onSelect,
}: {
  event: EventItem;
  active: boolean;
  onSelect(): void;
}) {
  const badge = formatDayBadge(event.startsAt);
  const color = event.category.color;
  const accent = lightenHex(color, 0.3);
  const remaining =
    event.capacity === null ? null : Math.max(0, event.capacity - event.registered);
  const full = remaining === 0;

  return (
    <button
      type="button"
      id={`card-event-${event.id}`}
      onClick={onSelect}
      className={`group relative flex w-full gap-3 rounded-2xl border p-3 text-left transition duration-200 ${
        active
          ? "border-violet-400/50 bg-white/[0.075] shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)]"
          : "border-white/8 bg-white/[0.035] hover:-translate-y-px hover:border-white/16 hover:bg-white/[0.06]"
      }`}
    >
      <span
        className={`absolute bottom-3 left-0 top-3 w-0.5 rounded-full transition ${
          active ? "bg-lime" : "bg-transparent"
        }`}
      />
      <span
        className="flex w-[54px] shrink-0 flex-col items-center justify-center rounded-[14px] border py-2"
        style={{
          backgroundColor: withAlpha(color, 0.14),
          borderColor: withAlpha(color, 0.28),
          color: accent,
        }}
      >
        <span className="font-display text-[21px] font-bold leading-none">{badge.day}</span>
        <span className="mt-1 text-[8.5px] font-extrabold tracking-[0.13em]">{badge.month}</span>
        <span className="mt-1 text-[10px] font-bold tabular-nums opacity-70">
          {formatTime(event.startsAt)}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span
            className="truncate text-[9.5px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color: accent }}
          >
            {event.category.name}
          </span>
          {full ? (
            <span className="ml-auto rounded-full bg-white/8 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide text-muted">
              To&apos;lgan
            </span>
          ) : null}
        </span>

        <span className="mt-1 block truncate font-display text-[14px] font-semibold leading-snug text-ink group-hover:text-violet-200">
          {event.title}
        </span>

        <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{event.venue || event.address}</span>
        </span>

        <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-ink-soft">
            <Users size={10} />
            {formatCount(event.registered)}
          </span>
          {event.friendsGoing ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">
              <Users size={10} />
              {event.friendsGoing} do&apos;st
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-ink-soft">
            <Clock3 size={10} />
            {formatTimeRange(event.startsAt, event.endsAt)}
          </span>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 ${
              event.isFree
                ? "bg-lime/90 text-[#150d24]"
                : "bg-amber-400/15 text-amber-300"
            }`}
          >
            {event.isFree ? "Bepul" : event.price || "Narx bor"}
          </span>
        </span>
      </span>
    </button>
  );
}

export function PlaceCard({
  place,
  active,
  onSelect,
}: {
  place: PlaceItem;
  active: boolean;
  onSelect(): void;
}) {
  const color = place.category.color;
  const accent = lightenHex(color, 0.32);
  return (
    <button
      type="button"
      id={`card-place-${place.id}`}
      onClick={onSelect}
      className={`group flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition duration-200 ${
        active
          ? "border-violet-400/50 bg-white/[0.075] shadow-[0_16px_40px_-24px_rgba(0,0,0,0.9)]"
          : "border-white/8 bg-white/[0.035] hover:-translate-y-px hover:border-white/16 hover:bg-white/[0.06]"
      }`}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border"
        style={{
          backgroundColor: withAlpha(color, 0.16),
          borderColor: withAlpha(color, 0.32),
          color: accent,
        }}
      >
        <CategoryIcon name={place.category.icon} size={19} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[9.5px] font-extrabold uppercase tracking-[0.12em]"
          style={{ color: accent }}
        >
          {place.category.name}
        </span>
        <span className="mt-0.5 block truncate font-display text-[14px] font-semibold leading-snug text-ink group-hover:text-violet-200">
          {place.name}
        </span>
        <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{place.address}</span>
        </span>
        {place.workingHours ? (
          <span className="mt-1 flex items-center gap-1 text-[10.5px] font-medium text-muted">
            <Clock3 size={10} />
            {place.workingHours}
          </span>
        ) : null}
      </span>

      <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-muted transition group-hover:border-violet-400/40 group-hover:text-violet-200">
        <ArrowUpRight size={13} />
      </span>
    </button>
  );
}

export function EmptyState({ onReset }: { onReset(): void }) {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.025] px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.06] text-violet-300">
        <MapPin size={24} />
      </div>
      <p className="mt-3 font-display text-[15px] font-semibold text-ink">
        Hech narsa topilmadi
      </p>
      <p className="mt-1 max-w-[30ch] text-[12px] leading-relaxed text-muted">
        Qidiruv so&apos;zini yoki filtrlarni o&apos;zgartirib, qaytadan urinib
        ko&apos;ring.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-[11.5px] font-bold text-white shadow-[0_14px_28px_-16px_rgba(139,92,246,0.9)] transition"
      >
        Filtrlarni tozalash
      </button>
    </div>
  );
}
