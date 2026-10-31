"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import type { DateRange, Tab } from "./types";
import type { Category } from "@/lib/types";
import { lightenHex } from "@/lib/colors";

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
    <div className="shrink-0 border-y border-white/8 bg-paper/60 px-4 pb-3.5 pt-3 backdrop-blur sm:px-6 lg:px-5">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/8 bg-black/30 p-1">
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
                ? "border-violet-400/60 bg-violet-500/20 text-ink shadow-[0_0_20px_-8px_rgba(139,92,246,0.9)]"
                : "border-white/10 bg-white/[0.05] text-ink-soft hover:border-white/20 hover:bg-white/[0.08]"
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
                    ? "border-violet-400/60 bg-violet-500/20 text-ink shadow-[0_0_20px_-8px_rgba(139,92,246,0.9)]"
                    : "border-white/10 bg-white/[0.05] text-ink-soft hover:border-white/20 hover:bg-white/[0.08]"
                }`}
              >
                <span
                  className="grid h-4 w-4 place-items-center rounded-full"
                  style={{
                    backgroundColor: active ? "rgba(255,255,255,0.14)" : `${category.color}1f`,
                    color: active ? "#c8ff5e" : lightenHex(category.color, 0.28),
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
                  ? "bg-lime text-[#150d24] shadow-[0_0_18px_-6px_rgba(200,255,94,0.7)]"
                  : "text-muted hover:bg-white/[0.06] hover:text-ink"
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
        active
          ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_10px_22px_-12px_rgba(139,92,246,1)]"
          : "text-muted hover:bg-white/[0.04] hover:text-ink"
      }`}
    >
      <span className={active ? "text-white" : "text-muted"}>{icon}</span>
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums ${
          active ? "bg-lime text-[#150d24]" : "bg-white/8 text-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
