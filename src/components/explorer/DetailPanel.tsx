"use client";

import { useEffect } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import type { Selected } from "./types";
import { darkenHex } from "@/lib/colors";
import { formatCount, formatEventWhen, formatTimeRange } from "@/lib/format";
import { iconSvg } from "@/lib/icons";

interface DetailPanelProps {
  selected: Selected;
  onClose(): void;
  onRegister(): void;
  onShare(): void;
}

export function DetailPanel({ selected, onClose, onRegister, onShare }: DetailPanelProps) {
  const isEvent = selected.kind === "event";
  const item = selected.item;
  const title = isEvent ? selected.item.title : selected.item.name;
  const category = item.category;
  const color = category.color;

  const registered = isEvent ? selected.item.registered : 0;
  const capacity = isEvent ? selected.item.capacity : null;
  const remaining = capacity === null ? null : Math.max(0, capacity - registered);
  const full = remaining === 0;
  const progress = capacity ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Yopish"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[2px] lg:hidden"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-up fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[26px] bg-paper shadow-soft lg:absolute lg:inset-y-3 lg:left-auto lg:right-3 lg:top-3 lg:max-h-none lg:w-[392px] lg:animate-slide-in lg:rounded-[24px]"
      >
        <div
          className="relative h-[136px] shrink-0 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${darkenHex(color, 0.08)} 0%, ${darkenHex(color, 0.62)} 100%)`,
          }}
        >
          <div className="dot-grid absolute inset-0 opacity-20" />
          <div
            className="absolute -right-5 -top-7 text-white/25"
            dangerouslySetInnerHTML={{ __html: iconSvg(category.icon, 156, 1.1) }}
          />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-ink shadow-sm">
              <CategoryIcon name={category.icon} size={12} />
              {category.name}
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
              {isEvent ? (selected.item.isFree ? "Bepul" : selected.item.price || "Narxli") : "Foydali joy"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:bg-white"
            aria-label="Panelni yopish"
          >
            <X size={16} />
          </button>
          <p className="absolute bottom-3 left-4 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/70">
            {isEvent ? "Tadbir" : "Manzil"} · Yunusobod
          </p>
        </div>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4">
          <h2 className="font-display text-[21px] font-bold leading-[1.18] tracking-[-0.03em] text-ink">
            {title}
          </h2>

          <div className="mt-4 space-y-3">
            {isEvent ? (
              <>
                <MetaRow
                  icon={<CalendarDays size={15} />}
                  title={formatEventWhen(selected.item.startsAt, selected.item.endsAt)}
                  subtitle={formatTimeRange(selected.item.startsAt, selected.item.endsAt)}
                  color={color}
                />
                <MetaRow
                  icon={<MapPin size={15} />}
                  title={selected.item.venue || selected.item.address}
                  subtitle={selected.item.venue ? selected.item.address : undefined}
                  color={color}
                />
                <MetaRow
                  icon={<Users size={15} />}
                  title={selected.item.organizer}
                  subtitle={
                    selected.item.isFree
                      ? "Ishtirok bepul"
                      : `Ishtirok narxi: ${selected.item.price || "tashkilotchidan"}`
                  }
                  color={color}
                />
              </>
            ) : (
              <>
                {selected.item.workingHours ? (
                  <MetaRow
                    icon={<Clock3 size={15} />}
                    title={selected.item.workingHours}
                    subtitle="Ish vaqti"
                    color={color}
                  />
                ) : null}
                <MetaRow
                  icon={<MapPin size={15} />}
                  title={selected.item.address}
                  subtitle="Manzil"
                  color={color}
                />
                {selected.item.phone ? (
                  <MetaRow
                    icon={<Phone size={15} />}
                    title={selected.item.phone}
                    subtitle="Telefon"
                    color={color}
                  />
                ) : null}
              </>
            )}
          </div>

          <p className="mt-4 text-[12.5px] leading-relaxed text-ink-soft">
            {item.description}
          </p>

          {isEvent && capacity !== null ? (
            <div className="mt-4 rounded-2xl border border-line/80 bg-cream/60 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-ink-soft">Joylar bandligi</span>
                <span className="tabular-nums text-ink">
                  {formatCount(registered)} / {formatCount(capacity)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line/80">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: color }}
                />
              </div>
              <p className="mt-1.5 text-[10.5px] font-medium text-muted">
                {full
                  ? "Barcha joylar band — keyingi tadbirlarga qarang"
                  : `${formatCount(remaining ?? 0)} ta joy qoldi`}
              </p>
            </div>
          ) : null}

          {isEvent && selected.item.registered > 0 ? (
            <p className="mt-3 flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-700">
              <Check size={12} />
              {formatCount(selected.item.registered)} nafar ishtirokchi allaqachon
              ro&apos;yxatdan o&apos;tgan
            </p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-line/80 bg-paper px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex gap-2">
            {isEvent ? (
              <button
                type="button"
                onClick={onRegister}
                disabled={full}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-pine px-4 py-3 text-[12.5px] font-extrabold text-paper transition hover:bg-pine-soft disabled:cursor-not-allowed disabled:bg-cream-deep disabled:text-muted"
              >
                {full ? "Joylar tugagan" : "Ro'yxatdan o'tish"}
                {full ? null : <Ticket size={15} className="text-lime" />}
              </button>
            ) : (
              <a
                href={`https://3.redirect.appmetrica.yandex.com/route?end-lat=${item.lat}&end-lon=${item.lng}&ref=navqiron&appmetrica_tracking_id=1178268795219780156`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-pine px-4 py-3 text-[12.5px] font-extrabold text-paper transition hover:bg-pine-soft"
              >
                Yo&apos;nalish olish
                <Navigation size={15} className="text-lime" />
              </a>
            )}
            <button
              type="button"
              onClick={onShare}
              className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl border border-line bg-white text-ink-soft transition hover:border-pine/30 hover:text-pine"
              aria-label="Ulashish"
              title="Ulashish"
            >
              <Share2 size={17} />
            </button>
          </div>
          {isEvent ? (
            <p className="mt-2 flex items-center justify-center gap-1 text-[9.5px] font-medium text-muted">
              <ArrowUpRight size={10} />
              Ro&apos;yxatdan o&apos;tish 30 soniya vaqt oladi
            </p>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function MetaRow({
  icon,
  title,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: `${color}14`, color }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-bold leading-snug text-ink">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 text-[10.5px] font-medium text-muted">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
