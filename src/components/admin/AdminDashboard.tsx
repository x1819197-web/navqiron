"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import type { EventItem, PlaceItem, Stats } from "@/lib/types";
import { formatDateShort, formatTime, formatCount, isUpcoming } from "@/lib/format";
import { api } from "./client";

export function AdminDashboard({ name }: { name: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [statsRes, eventsRes, placesRes] = await Promise.all([
          api<{ data: Stats }>("/api/stats"),
          api<{ data: EventItem[] }>("/api/events?status=all"),
          api<{ data: PlaceItem[] }>("/api/places?status=all"),
        ]);
        if (!alive) return;
        setStats(statsRes.data);
        setEvents(eventsRes.data);
        setPlaces(placesRes.data);
      } catch (err) {
        if (alive) setError((err as Error).message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.status === "published" && isUpcoming(e.startsAt))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, 5),
    [events],
  );

  const drafts = useMemo(
    () => [
      ...events.filter((e) => e.status === "draft").map((e) => ({ key: `e${e.id}`, title: e.title, kind: "Tadbir" })),
      ...places.filter((p) => p.status === "draft").map((p) => ({ key: `p${p.id}`, title: p.name, kind: "Joy" })),
    ],
    [events, places],
  );

  return (
    <div className="space-y-4">
      <header className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.035] p-6 lg:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Boshqaruv</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Salom, {name.split(" ")[0]} 👋
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Platformadagi tadbirlar, joylar va ro&apos;yxatdan o&apos;tishlarni shu yerdan
          boshqarasiz. O&apos;zgarishlar ommaviy xaritada darhol ko&apos;rinadi.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-300">
          {error}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="size-5" />}
          label="Faol tadbirlar"
          value={stats ? formatCount(stats.upcomingEvents) : "—"}
          accent="bg-lime/15 text-lime"
          loading={loading}
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="Ro'yxatdan o'tganlar"
          value={stats ? formatCount(stats.registered) : "—"}
          accent="bg-sky-400/15 text-sky-300"
          loading={loading}
        />
        <StatCard
          icon={<CircleDollarSign className="size-5" />}
          label="Bepul tadbirlar"
          value={stats ? formatCount(stats.freeEvents) : "—"}
          accent="bg-emerald-400/15 text-emerald-300"
          loading={loading}
        />
        <StatCard
          icon={<MapPin className="size-5" />}
          label="Foydali joylar"
          value={stats ? formatCount(stats.places) : "—"}
          accent="bg-violet-400/15 text-violet-300"
          loading={loading}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="rounded-3xl border border-white/8 bg-white/[0.035] p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Yaqin tadbirlar</h2>
            <Link
              href="/admin/events"
              className="inline-flex items-center gap-1 text-xs font-bold text-violet-300 hover:underline"
            >
              Barchasi <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {loading ? (
              <p className="flex items-center gap-2 py-8 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> Yuklanmoqda…
              </p>
            ) : upcoming.length === 0 ? (
              <p className="rounded-2xl bg-cream px-4 py-8 text-center text-sm text-muted">
                Hozircha rejalashtirilgan tadbir yo&apos;q.
              </p>
            ) : (
              upcoming.map((event) => (
                <Link
                  key={event.id}
                  href={`/?event=${encodeURIComponent(event.slug)}`}
                  target="_blank"
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 transition hover:border-violet-400/30 hover:bg-white/[0.06]"
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: event.category.color }}
                  >
                    <CalendarDays className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{event.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {formatDateShort(event.startsAt)} · {formatTime(event.startsAt)} ·{" "}
                      {event.venue}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-ink-soft">
                    {event.registered}
                    {event.capacity ? `/${event.capacity}` : ""}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/8 bg-white/[0.035] p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold">Qoralamalar</h2>
              <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-ink-soft">
                {drafts.length}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {loading ? (
                <p className="py-4 text-sm text-muted">Yuklanmoqda…</p>
              ) : drafts.length === 0 ? (
                <p className="rounded-2xl bg-cream px-4 py-6 text-center text-sm text-muted">
                  Qoralama yo&apos;q — hammasi nashr etilgan.
                </p>
              ) : (
                drafts.slice(0, 6).map((item) => (
                  <Link
                    key={item.key}
                    href={item.kind === "Tadbir" ? "/admin/events" : "/admin/places"}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 px-3 py-2.5 text-sm transition hover:border-violet-400/30"
                  >
                    <span className="truncate font-semibold text-ink">{item.title}</span>
                    <span className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                      {item.kind}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <QuickLink
              href="/admin/events"
              title="Tadbir qo'shish"
              text="Yangi tadbir, musobaqa yoki uchrashuv yarating."
              icon={<CalendarDays className="size-5" />}
            />
            <QuickLink
              href="/admin/places"
              title="Joy qo'shish"
              text="Yoshlar uchun foydali maskanlarni belgilang."
              icon={<MapPin className="size-5" />}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/8 bg-white/[0.035] p-5 backdrop-blur">
      <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${accent}`}>
        {icon}
      </span>
      <span>
        <span className="block text-[11px] font-bold uppercase tracking-wide text-muted">
          {label}
        </span>
        <span className="mt-0.5 block font-display text-2xl font-bold">
          {loading ? <Loader2 className="size-5 animate-spin text-muted" /> : value}
        </span>
      </span>
    </div>
  );
}

function QuickLink({
  href,
  title,
  text,
  icon,
}: {
  href: string;
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/10 bg-gradient-to-br from-violet-700 via-violet-800 to-[#1e0f3d] p-5 text-white shadow-[0_20px_50px_-30px_rgba(0,0,0,1)] transition hover:brightness-110"
    >
      <span className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-lime text-[#150d24]">{icon}</span>
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
      </span>
      <span className="mt-4 block font-display text-sm font-bold">{title}</span>
      <span className="mt-1 block text-xs leading-relaxed text-white/70">{text}</span>
    </Link>
  );
}
