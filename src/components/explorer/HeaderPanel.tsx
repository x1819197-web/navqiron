"use client";

import { useEffect, useRef } from "react";
import { Search, Sparkles, User, Users, X } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { formatCount } from "@/lib/format";
import type { UserAccount } from "@/lib/types";

interface HeaderPanelProps {
  query: string;
  onQueryChange(value: string): void;
  stats: { events: number; places: number; youth: number };
  user: UserAccount | null;
  onProfile(): void;
  onFriends(): void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function HeaderPanel({
  query,
  onQueryChange,
  stats,
  user,
  onProfile,
  onFriends,
}: HeaderPanelProps) {
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
          <div className="relative grid h-10 w-10 place-items-center rounded-[14px] bg-gradient-to-br from-violet-500 via-violet-600 to-fuchsia-600 text-white shadow-[0_10px_26px_-10px_rgba(139,92,246,0.95)]">
            <CategoryIcon name="spark" size={21} />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-cream bg-lime" />
          </div>
          <div>
            <p className="font-display text-[17px] font-bold leading-none tracking-[-0.03em] text-ink">
              Navqiron
            </p>
            <p className="mt-1 text-[9.5px] font-bold uppercase leading-none tracking-[0.15em] text-muted">
              Yunusobod yoshlar platformasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              type="button"
              onClick={onFriends}
              className="hidden items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-[11px] font-extrabold text-violet-100 transition hover:border-violet-400/50 hover:bg-violet-500/20 lg:flex"
              aria-label="Do'stlar"
            >
              <Users size={14} />
              Do&apos;stlar
            </button>
          ) : null}
          <button
            type="button"
            onClick={onProfile}
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-1 transition hover:border-violet-400/40 hover:bg-white/[0.08] sm:pr-3"
            aria-label="Profil"
            title="Profil"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[11px] font-extrabold text-white">
              {user ? initials(user.name) : <User size={14} />}
            </span>
            <span className="hidden max-w-[92px] truncate text-[11px] font-bold text-ink-soft sm:block">
              {user ? user.name.split(" ")[0] : "Mehmon"}
            </span>
          </button>
        </div>
      </div>

      <div
        className="relative mt-4 overflow-hidden rounded-[26px] border border-white/10 px-4 py-5 shadow-[0_26px_60px_-34px_rgba(0,0,0,1)]"
        style={{
          backgroundImage:
            "radial-gradient(120% 130% at 108% -18%, rgba(200,255,94,0.22), transparent 56%), radial-gradient(90% 110% at 0% 110%, rgba(236,72,153,0.35), transparent 60%), linear-gradient(135deg, #4c1d95 0%, #2a1060 48%, #160c2e 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full border-[16px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-violet-500/30 blur-2xl" />
        <Sparkles
          className="pointer-events-none absolute bottom-3 right-4 text-white/15"
          size={54}
          strokeWidth={1.2}
        />

        <div className="relative flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-lime/90">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          Yunusobod tumani · Toshkent
        </div>

        <h1 className="relative mt-2.5 font-display text-[27px] font-bold leading-[1.06] tracking-[-0.035em] text-white sm:text-[30px]">
          Yunusobodda
          <br />
          <span className="relative inline-block">
            <span className="relative z-10">nima bo&apos;lyapti?</span>
            <span className="absolute inset-x-0 bottom-0.5 z-0 h-3 -rotate-1 rounded-[3px] bg-lime/90" />
          </span>
        </h1>

        <p className="relative mt-3 max-w-[34ch] text-[12.5px] font-medium leading-relaxed text-white/70">
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
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.055] pl-10 pr-14 text-[13px] font-medium text-ink outline-none transition placeholder:text-muted/70 focus:border-violet-400/50 focus:bg-white/[0.08] focus:ring-4 focus:ring-violet-500/10"
        />
        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center">
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-muted transition hover:bg-white/15 hover:text-ink"
              aria-label="Qidiruvni tozalash"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-muted sm:block">
              /
            </kbd>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-white/8 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.045] py-2.5 backdrop-blur">
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
