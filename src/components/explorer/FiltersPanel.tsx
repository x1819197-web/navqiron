"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import type { DateRange, Tab } from "./types";
import type { Category } from "@/lib/types";

interface FiltersPanelProps {
  tab: Tab;
  onTabChange(tab: Tab): void;
  counts: { events: number; places: number };
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange(slug: string | null): void;
  dateRange: DateRange;
  onDateRangeChange(range: DateRange): void;
}

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all", label: "Hammasi" },
  { value: "today", label: "Bugun" },
  { value: "week", label: "Shu hafta" },
  { value: "month", label: "30 kun" },
];

export function FiltersPanel({
  tab,
  onTabChange,
  counts,
  categories,
  activeCategory,
  onCategoryChange,
  dateRange,
  onDateRangeChange,
}: FiltersPanelProps) {
  return (
    <div className="shrink-0 border-y border-line/70 bg-paper px-4 pb-3.5 pt-3 sm:px-6 lg:px-5">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-line/70 bg-cream-deep/60 p-1">
        <TabButton
          active={tab === "events"}
          onClick={() => onTabChange("events")}
          icon={<CalendarDays size={14} />}
          label="Tadbirlar"
          count={counts.events}
        />
        <TabButton
          active={tab === "places"}
          onClick={() => onTabChange("places")}
          icon={<MapPin size={14} />}
          label="Foydali joylar"
          count={counts.places}
        />
      </div>

      <div className="relative mt-3">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition ${
              activeCategory === null
                ? "border-pine bg-pine text-paper shadow-sm"
                : "border-line/80 bg-white/60 text-ink-soft hover:border-line hover:bg-white"
            }`}
          >
            Barchasi
          </button>
          {categories.map((category) => {
            const active = activeCategory === category.slug;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(active ? null : category.slug)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition ${
                  active
                    ? "border-pine bg-pine text-paper shadow-sm"
                    : "border-line/80 bg-white/60 text-ink-soft hover:border-line hover:bg-white"
                }`}
              >
                <span
                  className="grid h-4 w-4 place-items-center rounded-full"
                  style={{
                    backgroundColor: active ? "rgba(255,255,255,0.14)" : `${category.color}1f`,
                    color: active ? "#d8f47b" : category.color,
                  }}
                >
                  <CategoryIcon name={category.icon} size={10} />
                </span>
                {category.name}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-paper via-paper/80 to-transparent lg:hidden" />
      </div>

      {tab === "events" ? (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="mr-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.13em] text-muted/80">
            Sana
          </span>
          {DATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onDateRangeChange(option.value)}
              className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold transition ${
                dateRange === option.value
                  ? "bg-ink text-paper"
                  : "text-muted hover:bg-cream hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2.5 px-0.5 text-[10.5px] font-medium leading-relaxed text-muted">
          Yoshlar uchun bepul xizmatlar, o&apos;quv va maslahat markazlari
        </p>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick(): void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[12px] font-bold transition ${
        active ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink"
      }`}
    >
      <span className={active ? "text-pine-soft" : "text-muted"}>{icon}</span>
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums ${
          active ? "bg-lime text-pine" : "bg-cream-deep text-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
