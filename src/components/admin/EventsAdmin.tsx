"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import type { Category, EventItem, Registration, Status } from "@/lib/types";
import {
  formatDateLong,
  formatDateShort,
  formatTime,
  isUpcoming,
  normalizeText,
} from "@/lib/format";
import { api, formatPhone, isoToLocalInput, localInputToIso, type ApiError } from "./client";
import { ConfirmDialog, Modal, PageHeader, StatusBadge } from "./ui";

interface EventFormState {
  title: string;
  categoryId: string;
  startsAt: string;
  endsAt: string;
  venue: string;
  address: string;
  lat: string;
  lng: string;
  description: string;
  organizer: string;
  isFree: boolean;
  price: string;
  capacity: string;
  status: Status;
}

function defaultStartsAt(): string {
  const date = new Date(Date.now() + 86_400_000 + 5 * 3_600_000);
  return `${date.toISOString().slice(0, 10)}T10:00`;
}

function emptyForm(categories: Category[]): EventFormState {
  return {
    title: "",
    categoryId: categories[0] ? String(categories[0].id) : "",
    startsAt: defaultStartsAt(),
    endsAt: "",
    venue: "",
    address: "",
    lat: "41.3430",
    lng: "69.2870",
    description: "",
    organizer: "",
    isFree: true,
    price: "",
    capacity: "",
    status: "published",
  };
}

function formFromEvent(event: EventItem): EventFormState {
  return {
    title: event.title,
    categoryId: String(event.categoryId),
    startsAt: isoToLocalInput(event.startsAt),
    endsAt: isoToLocalInput(event.endsAt),
    venue: event.venue,
    address: event.address,
    lat: String(event.lat),
    lng: String(event.lng),
    description: event.description,
    organizer: event.organizer,
    isFree: event.isFree,
    price: event.price ?? "",
    capacity: event.capacity == null ? "" : String(event.capacity),
    status: event.status,
  };
}

const sortEvents = (list: EventItem[]) =>
  [...list].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

export function EventsAdmin() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [editing, setEditing] = useState<EventItem | "new" | null>(null);
  const [registrationsFor, setRegistrationsFor] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState<EventItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, categoriesRes] = await Promise.all([
        api<{ data: EventItem[] }>("/api/events?status=all"),
        api<{ data: Category[] }>("/api/categories?kind=event"),
      ]);
      setEvents(sortEvents(eventsRes.data));
      setCategories(categoriesRes.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    return events.filter((event) => {
      if (statusFilter !== "all" && event.status !== statusFilter) return false;
      if (!q) return true;
      return (
        normalizeText(event.title).includes(q) ||
        normalizeText(event.venue).includes(q) ||
        normalizeText(event.category.name).includes(q)
      );
    });
  }, [events, query, statusFilter]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await api(`/api/events/${deleting.id}`, { method: "DELETE" });
      setEvents((list) => list.filter((e) => e.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletePending(false);
    }
  }

  function handleSaved(saved: EventItem, isNew: boolean) {
    setEvents((list) =>
      sortEvents(isNew ? [...list, saved] : list.map((e) => (e.id === saved.id ? saved : e))),
    );
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Kontent"
        title="Tadbirlar"
        description="Tadbir, musobaqa va uchrashuvlarni qo'shing, tahrirlang yoki nashr holatini boshqaring. Har bir tadbir xaritada o'z nuqtasi bilan chiqadi."
        action={
          <button
            type="button"
            onClick={() => setEditing("new")}
            disabled={loading || categories.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pine px-5 py-3 text-sm font-bold text-paper transition hover:bg-pine-soft disabled:opacity-60"
          >
            <Plus className="size-4" />
            Yangi tadbir
          </button>
        }
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-line bg-paper p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            className="field pl-10!"
            placeholder="Nomi, manzil yoki kategoriya bo'yicha qidirish…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-cream p-1">
          {(
            [
              { value: "all", label: "Barchasi" },
              { value: "published", label: "Nashr" },
              { value: "draft", label: "Qoralama" },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatusFilter(item.value)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                statusFilter === item.value
                  ? "bg-paper text-pine shadow-card"
                  : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-line bg-paper">
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-xs font-bold text-muted">
          <span>{filtered.length} ta tadbir</span>
          <span className="hidden sm:block">Ro&apos;yxat / sig&apos;im</span>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 px-5 py-14 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Yuklanmoqda…
          </p>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-display text-lg font-bold">Tadbir topilmadi</p>
            <p className="mt-1 text-sm text-muted">
              Filtrlarni o&apos;zgartiring yoki yangi tadbir qo&apos;shing.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((event) => {
              const upcoming = isUpcoming(event.startsAt);
              return (
                <li
                  key={event.id}
                  className="flex flex-col gap-3 px-4 py-4 transition hover:bg-cream/40 sm:flex-row sm:items-center sm:px-5"
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: event.category.color }}
                    title={event.category.name}
                  >
                    <CalendarDays className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-ink">{event.title}</p>
                      <StatusBadge status={event.status} />
                      {!upcoming ? (
                        <span className="rounded-full bg-cream-deep px-2 py-0.5 text-[11px] font-bold text-muted">
                          O&apos;tgan
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">
                      {formatDateShort(event.startsAt)} · {formatTime(event.startsAt)}
                      {event.venue ? ` · ${event.venue}` : ""}
                      {event.address ? ` · ${event.address}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-xs font-bold text-ink-soft">
                      {event.registered}
                      {event.capacity ? ` / ${event.capacity}` : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRegistrationsFor(event)}
                        className="grid size-9 place-items-center rounded-xl bg-cream text-ink-soft transition hover:bg-cream-deep"
                        title="Ro'yxatdan o'tganlar"
                      >
                        <Users className="size-4" />
                      </button>
                      <a
                        href={`/?event=${encodeURIComponent(event.slug)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="grid size-9 place-items-center rounded-xl bg-cream text-ink-soft transition hover:bg-cream-deep"
                        title="Saytda ko'rish"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setEditing(event)}
                        className="grid size-9 place-items-center rounded-xl bg-cream text-ink-soft transition hover:bg-cream-deep"
                        title="Tahrirlash"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(event)}
                        className="grid size-9 place-items-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                        title="O'chirish"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing ? (
        <EventFormDrawer
          key={editing === "new" ? "new" : editing.id}
          categories={categories}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {registrationsFor ? (
        <RegistrationsDialog
          event={registrationsFor}
          onClose={() => setRegistrationsFor(null)}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Tadbirni o'chirish"
          message={`"${deleting.title}" tadbiri va unga tegishli barcha ro'yxatdan o'tishlar butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.`}
          pending={deletePending}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}

function EventFormDrawer({
  categories,
  initial,
  onClose,
  onSaved,
}: {
  categories: Category[];
  initial: EventItem | null;
  onClose: () => void;
  onSaved: (event: EventItem, isNew: boolean) => void;
}) {
  const existing = initial;
  const [form, setForm] = useState<EventFormState>(() =>
    initial ? formFromEvent(initial) : emptyForm(categories),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set<K extends keyof EventFormState>(key: K, value: EventFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const payload = {
        title: form.title,
        categoryId: Number(form.categoryId),
        startsAt: localInputToIso(form.startsAt),
        endsAt: localInputToIso(form.endsAt),
        venue: form.venue,
        address: form.address,
        lat: Number(form.lat),
        lng: Number(form.lng),
        description: form.description,
        organizer: form.organizer,
        isFree: form.isFree,
        price: form.isFree ? null : form.price || null,
        capacity: form.capacity ? Number(form.capacity) : null,
        status: form.status,
      };
      const res = await api<{ data: EventItem }>(
        existing ? `/api/events/${existing.id}` : "/api/events",
        {
          method: existing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      onSaved(res.data, !existing);
    } catch (err) {
      const apiError = err as ApiError;
      setFormError(apiError.message);
      if (apiError.details) setFieldErrors(apiError.details);
      setPending(false);
    }
  }

  return (
    <Modal
      title={existing ? "Tadbirni tahrirlash" : "Yangi tadbir"}
      subtitle="Barcha maydonlarni to'ldiring — xarita nuqtasi koordinatalar asosida joylashadi."
      onClose={onClose}
      width="max-w-3xl"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="ev-title">
            Sarlavha
          </label>
          <input
            id="ev-title"
            className="field"
            placeholder="Masalan: Yoshlar forumi 2026"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            autoFocus
          />
          {fieldErrors.title ? <p className="field-error">{fieldErrors.title}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="ev-category">
              Kategoriya
            </label>
            <select
              id="ev-category"
              className="field"
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId ? (
              <p className="field-error">{fieldErrors.categoryId}</p>
            ) : null}
          </div>
          <div>
            <label className="field-label" htmlFor="ev-status">
              Holat
            </label>
            <select
              id="ev-status"
              className="field"
              value={form.status}
              onChange={(e) => set("status", e.target.value as Status)}
            >
              <option value="published">Nashr etilgan</option>
              <option value="draft">Qoralama</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="ev-start">
              Boshlanish (Toshkent vaqti)
            </label>
            <input
              id="ev-start"
              type="datetime-local"
              className="field"
              value={form.startsAt}
              onChange={(e) => set("startsAt", e.target.value)}
            />
            {fieldErrors.startsAt ? <p className="field-error">{fieldErrors.startsAt}</p> : null}
          </div>
          <div>
            <label className="field-label" htmlFor="ev-end">
              Tugash (majburiy emas)
            </label>
            <input
              id="ev-end"
              type="datetime-local"
              className="field"
              value={form.endsAt}
              onChange={(e) => set("endsAt", e.target.value)}
            />
            {fieldErrors.endsAt ? <p className="field-error">{fieldErrors.endsAt}</p> : null}
          </div>
          <div>
            <label className="field-label" htmlFor="ev-venue">
              Joy nomi
            </label>
            <input
              id="ev-venue"
              className="field"
              placeholder="Yoshlar markazi"
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="ev-organizer">
              Tashkilotchi
            </label>
            <input
              id="ev-organizer"
              className="field"
              placeholder="Yunusobod tuman hokimiyati"
              value={form.organizer}
              onChange={(e) => set("organizer", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="ev-address">
            Manzil
          </label>
          <input
            id="ev-address"
            className="field"
            placeholder="Yunusobod tumani, ..."
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="ev-lat">
              Kenglik (lat)
            </label>
            <input
              id="ev-lat"
              className="field"
              inputMode="decimal"
              value={form.lat}
              onChange={(e) => set("lat", e.target.value)}
            />
            {fieldErrors.lat ? <p className="field-error">{fieldErrors.lat}</p> : null}
          </div>
          <div>
            <label className="field-label" htmlFor="ev-lng">
              Uzunlik (lng)
            </label>
            <input
              id="ev-lng"
              className="field"
              inputMode="decimal"
              value={form.lng}
              onChange={(e) => set("lng", e.target.value)}
            />
            {fieldErrors.lng ? <p className="field-error">{fieldErrors.lng}</p> : null}
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted">
          Yunusobod hududi: kenglik 41.31 – 41.40, uzunlik 69.23 – 69.34. Nuqtani xaritadan
          taxminan oling.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="ev-capacity">
              Sig&apos;im (majburiy emas)
            </label>
            <input
              id="ev-capacity"
              className="field"
              inputMode="numeric"
              placeholder="Masalan: 120"
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
            />
            {fieldErrors.capacity ? <p className="field-error">{fieldErrors.capacity}</p> : null}
          </div>
          <div>
            <label className="field-label" htmlFor="ev-price">
              Narx (majburiy emas)
            </label>
            <input
              id="ev-price"
              className="field"
              placeholder="Bepul bo'lsa bo'sh qoldiring"
              value={form.isFree ? "" : form.price}
              disabled={form.isFree}
              onChange={(e) => set("price", e.target.value)}
            />
            <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-ink-soft">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) => set("isFree", e.target.checked)}
                className="size-4 accent-pine"
              />
              Tadbir bepul
            </label>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="ev-description">
            Tavsif
          </label>
          <textarea
            id="ev-description"
            className="field"
            placeholder="Tadbir haqida qisqacha ma'lumot…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        {formError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-cream px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-cream-deep"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pine px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-pine-soft disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {pending ? "Saqlanmoqda…" : existing ? "Saqlash" : "Tadbir qo'shish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RegistrationsDialog({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Registration[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api<{ data: Registration[] }>(
          `/api/events/${event.id}/registrations`,
        );
        if (alive) setItems(res.data);
      } catch (err) {
        if (alive) setError((err as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [event.id]);

  return (
    <Modal
      title="Ro'yxatdan o'tganlar"
      subtitle={`${event.title} · ${formatDateLong(event.startsAt)}`}
      onClose={onClose}
      width="max-w-xl"
    >
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
        <span className="text-xs font-bold text-ink-soft">
          Jami: {event.registered}
          {event.capacity ? ` / ${event.capacity} joy` : ""}
        </span>
        {event.capacity ? (
          <span className="text-xs font-bold text-muted">
            Bo&apos;sh joy: {Math.max(event.capacity - event.registered, 0)}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : items === null ? (
        <p className="flex items-center gap-2 py-6 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" /> Yuklanmoqda…
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-cream px-4 py-10 text-center text-sm text-muted">
          Hozircha hech kim ro&apos;yxatdan o&apos;tmagan.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream text-xs font-bold text-ink-soft">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{item.name}</p>
                <p className="text-xs text-muted">
                  {formatDateShort(item.createdAt)} · {formatTime(item.createdAt)}
                </p>
              </div>
              <a
                href={`tel:${item.phone}`}
                className="shrink-0 rounded-xl bg-cream px-3 py-1.5 text-xs font-bold text-pine transition hover:bg-cream-deep"
              >
                {formatPhone(item.phone)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
