"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type { Category, PlaceItem, Status } from "@/lib/types";
import { normalizeText } from "@/lib/format";
import { api, type ApiError } from "./client";
import { ConfirmDialog, Modal, PageHeader, StatusBadge } from "./ui";

interface PlaceFormState {
  name: string;
  categoryId: string;
  address: string;
  lat: string;
  lng: string;
  description: string;
  workingHours: string;
  phone: string;
  url: string;
  status: Status;
}

function emptyForm(categories: Category[]): PlaceFormState {
  return {
    name: "",
    categoryId: categories[0] ? String(categories[0].id) : "",
    address: "",
    lat: "41.3430",
    lng: "69.2870",
    description: "",
    workingHours: "",
    phone: "",
    url: "",
    status: "published",
  };
}

function formFromPlace(place: PlaceItem): PlaceFormState {
  return {
    name: place.name,
    categoryId: String(place.categoryId),
    address: place.address,
    lat: String(place.lat),
    lng: String(place.lng),
    description: place.description,
    workingHours: place.workingHours ?? "",
    phone: place.phone ?? "",
    url: place.url ?? "",
    status: place.status,
  };
}

export function PlacesAdmin() {
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [editing, setEditing] = useState<PlaceItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<PlaceItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [placesRes, categoriesRes] = await Promise.all([
        api<{ data: PlaceItem[] }>("/api/places?status=all"),
        api<{ data: Category[] }>("/api/categories?kind=place"),
      ]);
      setPlaces(placesRes.data);
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
    return places.filter((place) => {
      if (statusFilter !== "all" && place.status !== statusFilter) return false;
      if (!q) return true;
      return (
        normalizeText(place.name).includes(q) ||
        normalizeText(place.address).includes(q) ||
        normalizeText(place.category.name).includes(q)
      );
    });
  }, [places, query, statusFilter]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await api(`/api/places/${deleting.id}`, { method: "DELETE" });
      setPlaces((list) => list.filter((p) => p.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletePending(false);
    }
  }

  function handleSaved(saved: PlaceItem, isNew: boolean) {
    setPlaces((list) =>
      isNew ? [...list, saved] : list.map((p) => (p.id === saved.id ? saved : p)),
    );
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Kontent"
        title="Foydali joylar"
        description="Yoshlar uchun foydali maskanlarni belgilang: o'quv markazlari, kutubxonalar, sport inshootlari, bandlik markazlari va dam olish joylari."
        action={
          <button
            type="button"
            onClick={() => setEditing("new")}
            disabled={loading || categories.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pine px-5 py-3 text-sm font-bold text-paper transition hover:bg-pine-soft disabled:opacity-60"
          >
            <Plus className="size-4" />
            Yangi joy
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
        <div className="border-b border-line px-5 py-3 text-xs font-bold text-muted">
          {filtered.length} ta joy
        </div>

        {loading ? (
          <p className="flex items-center gap-2 px-5 py-14 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Yuklanmoqda…
          </p>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="font-display text-lg font-bold">Joy topilmadi</p>
            <p className="mt-1 text-sm text-muted">
              Filtrlarni o&apos;zgartiring yoki yangi joy qo&apos;shing.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((place) => (
              <li
                key={place.id}
                className="flex flex-col gap-3 px-4 py-4 transition hover:bg-cream/40 sm:flex-row sm:items-center sm:px-5"
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl border-2 bg-paper"
                  style={{ borderColor: place.category.color, color: place.category.color }}
                  title={place.category.name}
                >
                  <MapPin className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink">{place.name}</p>
                    <StatusBadge status={place.status} />
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                      style={{ backgroundColor: `${place.category.color}1a`, color: place.category.color }}
                    >
                      {place.category.name}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">
                    {place.address || "Manzil ko'rsatilmagan"}
                    {place.workingHours ? ` · ${place.workingHours}` : ""}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-1">
                  <a
                    href={`/?place=${encodeURIComponent(place.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="grid size-9 place-items-center rounded-xl bg-cream text-ink-soft transition hover:bg-cream-deep"
                    title="Saytda ko'rish"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setEditing(place)}
                    className="grid size-9 place-items-center rounded-xl bg-cream text-ink-soft transition hover:bg-cream-deep"
                    title="Tahrirlash"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(place)}
                    className="grid size-9 place-items-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                    title="O'chirish"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing ? (
        <PlaceFormDrawer
          key={editing === "new" ? "new" : editing.id}
          categories={categories}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Joyni o'chirish"
          message={`"${deleting.name}" joyi butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.`}
          pending={deletePending}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  );
}

function PlaceFormDrawer({
  categories,
  initial,
  onClose,
  onSaved,
}: {
  categories: Category[];
  initial: PlaceItem | null;
  onClose: () => void;
  onSaved: (place: PlaceItem, isNew: boolean) => void;
}) {
  const [form, setForm] = useState<PlaceFormState>(() =>
    initial ? formFromPlace(initial) : emptyForm(categories),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set<K extends keyof PlaceFormState>(key: K, value: PlaceFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const payload = {
        name: form.name,
        categoryId: Number(form.categoryId),
        address: form.address,
        lat: Number(form.lat),
        lng: Number(form.lng),
        description: form.description,
        workingHours: form.workingHours || null,
        phone: form.phone || null,
        url: form.url || null,
        status: form.status,
      };
      const res = await api<{ data: PlaceItem }>(
        initial ? `/api/places/${initial.id}` : "/api/places",
        {
          method: initial ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      onSaved(res.data, !initial);
    } catch (err) {
      const apiError = err as ApiError;
      setFormError(apiError.message);
      if (apiError.details) setFieldErrors(apiError.details);
      setPending(false);
    }
  }

  return (
    <Modal
      title={initial ? "Joyni tahrirlash" : "Yangi joy"}
      subtitle="Joy xaritada kategoriya rangidagi kvadrat belgi bilan ko'rinadi."
      onClose={onClose}
      width="max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="pl-name">
            Nomi
          </label>
          <input
            id="pl-name"
            className="field"
            placeholder="Masalan: Yunusobod yoshlar markazi"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus
          />
          {fieldErrors.name ? <p className="field-error">{fieldErrors.name}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="pl-category">
              Kategoriya
            </label>
            <select
              id="pl-category"
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
            <label className="field-label" htmlFor="pl-status">
              Holat
            </label>
            <select
              id="pl-status"
              className="field"
              value={form.status}
              onChange={(e) => set("status", e.target.value as Status)}
            >
              <option value="published">Nashr etilgan</option>
              <option value="draft">Qoralama</option>
            </select>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="pl-address">
            Manzil
          </label>
          <input
            id="pl-address"
            className="field"
            placeholder="Yunusobod tumani, ..."
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="pl-lat">
              Kenglik (lat)
            </label>
            <input
              id="pl-lat"
              className="field"
              inputMode="decimal"
              value={form.lat}
              onChange={(e) => set("lat", e.target.value)}
            />
            {fieldErrors.lat ? <p className="field-error">{fieldErrors.lat}</p> : null}
          </div>
          <div>
            <label className="field-label" htmlFor="pl-lng">
              Uzunlik (lng)
            </label>
            <input
              id="pl-lng"
              className="field"
              inputMode="decimal"
              value={form.lng}
              onChange={(e) => set("lng", e.target.value)}
            />
            {fieldErrors.lng ? <p className="field-error">{fieldErrors.lng}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="pl-hours">
              Ish vaqti
            </label>
            <input
              id="pl-hours"
              className="field"
              placeholder="09:00 – 18:00 (Dush–Jum)"
              value={form.workingHours}
              onChange={(e) => set("workingHours", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="pl-phone">
              Telefon
            </label>
            <input
              id="pl-phone"
              className="field"
              placeholder="+998 71 000 00 00"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="pl-url">
            Havola (majburiy emas)
          </label>
          <input
            id="pl-url"
            className="field"
            placeholder="https://…"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="pl-description">
            Tavsif
          </label>
          <textarea
            id="pl-description"
            className="field"
            placeholder="Joy haqida qisqacha ma'lumot…"
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
            {pending ? "Saqlanmoqda…" : initial ? "Saqlash" : "Joy qo'shish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
