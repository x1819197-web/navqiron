"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Search, Settings2, X } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { formatCount } from "@/lib/format";

interface HeaderPanelProps {
  query: string;
  onQueryChange(value: string): void;
  stats: { events: number; places: number; youth: number };
}

export function HeaderPanel({ query, onQueryChange, stats }: HeaderPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="shrink-0 px-4 pb-4 pt-4 sm:px-6 lg:px-5 lg:pt-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative grid h-10 w-10 place-items-center rounded-[14px] bg-pine text-lime shadow-card">
            <CategoryIcon name="spark" size={21} />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-paper bg-lime" />
          </div>
          <div>
            <p className="font-display text-[17px] font-bold leading-none tracking-[-0.03em]">
              Navqiron
            </p>
            <p className="mt-1 text-[9.5px] font-bold uppercase leading-none tracking-[0.15em] text-muted">
              Yunusobod yoshlar platformasi
            </p>
          </div>
        </div>

        <Link
          href="/admin"
          className="grid h-9 w-9 place-items-center rounded-full border border-line bg-white/60 text-ink-soft transition hover:border-pine/30 hover:bg-white hover:text-pine"
          aria-label="Admin panel"
          title="Admin panel"
        >
          <Settings2 size={16} />
        </Link>
      </div>

      <div
        className="relative mt-4 overflow-hidden rounded-[24px] px-4 py-5 text-paper shadow-card"
        style={{
          backgroundImage:
            "radial-gradient(120% 130% at 110% -20%, rgba(216,244,123,0.28), transparent 58%), linear-gradient(135deg, #0c352a 0%, #0a2b22 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full border-[18px] border-lime/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-36 w-36 rounded-full bg-lime/10 blur-2xl" />

        <div className="relative flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-lime/90">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          Yunusobod tumani · Toshkent
        </div>

        <h1 className="relative mt-2.5 font-display text-[28px] font-bold leading-[1.06] tracking-[-0.035em] sm:text-[31px]">
          Yunusobodda
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">nima bo&apos;lyapti?</span>
            <span className="absolute inset-x-0 bottom-0.5 z-0 h-3 -rotate-1 rounded-[3px] bg-lime/90" />
          </span>
        </h1>

        <p className="relative mt-3 max-w-[34ch] text-[12.5px] font-medium leading-relaxed text-paper/75">
          Tadbirlar, musobaqalar va yoshlar uchun foydali joylar — barchasi
          bitta xaritada.
        </p>
      </div>

      <div className="relative mt-3">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Tadbir, joy yoki kalit so'z..."
          aria-label="Qidirish"
          className="h-11 w-full rounded-2xl border border-line bg-white/80 pl-10 pr-14 text-[13px] font-medium text-ink outline-none transition placeholder:text-muted/80 focus:border-pine-soft/50 focus:bg-white focus:ring-4 focus:ring-pine/5"
        />
        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center">
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="grid h-6 w-6 place-items-center rounded-full bg-cream text-muted transition hover:bg-cream-deep hover:text-ink"
              aria-label="Qidiruvni tozalash"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="hidden rounded-md border border-line bg-cream px-1.5 py-0.5 text-[9px] font-bold text-muted sm:block">
              /
            </kbd>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-line/80 overflow-hidden rounded-2xl border border-line bg-white/60 py-2.5">
        <StatCell value={formatCount(stats.events)} label="Tadbirlar" />
        <StatCell value={formatCount(stats.places)} label="Foydali joylar" />
        <StatCell value={formatCount(stats.youth)} label="Ishtirokchilar" />
      </div>
    </header>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-1.5 text-center">
      <p className="font-display text-[18px] font-bold leading-none tracking-[-0.03em] text-ink">
        {value}
      </p>
      <p className="mt-1.5 text-[8px] font-extrabold uppercase leading-none tracking-[0.13em] text-muted">
        {label}
      </p>
    </div>
  );
}
