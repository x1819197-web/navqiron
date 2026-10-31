"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Link2,
  Loader2,
  MapPin,
  Phone,
  Search,
  ShieldOff,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { formatDateShort, formatTime } from "@/lib/format";
import type {
  AppNotification,
  EventItem,
  FriendSummary,
  FriendsOverview,
  PublicUser,
  UserAccount,
} from "@/lib/types";

interface FriendsScreenProps {
  user: UserAccount | null;
  overview: FriendsOverview | null;
  events: EventItem[];
  onClose(): void;
  onRefresh(): void;
  onRequireAuth(): void;
  onOpenEvent(eventId: number): void;
}

function prettyPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return phone;
}

function timeOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function untilLabel(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return "tugagan";
  const total = Math.max(1, Math.round(diff / 60_000));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} daq`;
  return minutes ? `${hours} soat ${minutes} daq` : `${hours} soat`;
}

function currentPoint(): Promise<{ lat: number; lng: number }> {
  const fallback = { lat: 41.356, lng: 69.286 };
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(fallback);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(fallback),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60_000 },
    );
  });
}

export function FriendsScreen({
  user,
  overview,
  events,
  onClose,
  onRefresh,
  onRequireAuth,
  onOpenEvent,
}: FriendsScreenProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicUser[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [inviteFor, setInviteFor] = useState<FriendSummary | null>(null);
  const [freeOpen, setFreeOpen] = useState(false);
  const [hours, setHours] = useState(2);
  const [note, setNote] = useState("");
  const [freeBusy, setFreeBusy] = useState(false);

  const freeStatus = overview?.freeStatus ?? null;
  const friends = overview?.friends ?? [];
  const incoming = overview?.incoming ?? [];
  const outgoing = overview?.outgoing ?? [];
  const invites = useMemo(() => {
    const cutoff = Date.now() - 72 * 60 * 60 * 1000;
    const seen = new Set<number>();
    return (overview?.notifications ?? []).filter((item) => {
      if (item.type !== "invite" || !item.eventId) return false;
      if (new Date(item.createdAt).getTime() < cutoff) return false;
      if (seen.has(item.eventId)) return false;
      seen.add(item.eventId);
      return true;
    });
  }, [overview]);
  const upcomingEvents = useMemo(
    () => events.filter((event) => new Date(event.startsAt).getTime() > Date.now()).slice(0, 12),
    [events],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(() => {
        if (alive) onRefresh();
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const text = query.trim();
    if (text.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    let alive = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      fetch(`/api/users/search?q=${encodeURIComponent(text)}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { data?: PublicUser[] } | null) => {
          if (alive) setResults(payload?.data ?? []);
        })
        .catch(() => {
          if (alive) setResults([]);
        })
        .finally(() => {
          if (alive) setSearching(false);
        });
    }, 300);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query, user]);

  async function act(
    key: string,
    request: () => Promise<Response>,
    successMessage: string,
    options: { clearQuery?: boolean; closeInvite?: boolean } = {},
  ) {
    setBusy(key);
    try {
      const response = await request();
      const payload = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (!response.ok) {
        setToast(payload?.error?.message || "Xatolik yuz berdi");
        return;
      }
      setToast(successMessage);
      if (options.clearQuery) setQuery("");
      if (options.closeInvite) setInviteFor(null);
      onRefresh();
    } catch {
      setToast("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setBusy(null);
    }
  }

  function requestFriend(userId: number) {
    void act(
      `add-${userId}`,
      () =>
        fetch("/api/friends/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }),
      "Do'stlik so'rovi yuborildi",
      { clearQuery: true },
    );
  }

  function respond(id: number, accept: boolean) {
    void act(
      `respond-${id}`,
      () =>
        fetch("/api/friends/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action: accept ? "accept" : "decline" }),
        }),
      accept ? "So'rov qabul qilindi" : "So'rov rad etildi",
    );
  }

  function removeFriend(userId: number) {
    void act(
      `remove-${userId}`,
      () =>
        fetch("/api/friends/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }),
      "Do'stlar ro'yxatidan olib tashlandi",
    );
    setRemovingId(null);
  }

  function blockUser(userId: number) {
    void act(
      `block-${userId}`,
      () =>
        fetch("/api/friends/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, action: "block" }),
        }),
      "Foydalanuvchi bloklandi",
      { clearQuery: true },
    );
    setRemovingId(null);
  }

  function invite(friend: FriendSummary, eventId: number) {
    void act(
      `invite-${friend.id}-${eventId}`,
      () =>
        fetch("/api/friends/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId: friend.id, eventId }),
        }),
      `Taklif yuborildi — ${friend.name}`,
      { closeInvite: true },
    );
  }

  async function enableFree() {
    setFreeBusy(true);
    try {
      const point = await currentPoint();
      const response = await fetch("/api/me/free", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours, note: note.trim(), lat: point.lat, lng: point.lng }),
      });
      if (!response.ok) {
        setToast("Holatni yoqib bo'lmadi");
        return;
      }
      setFreeOpen(false);
      setNote("");
      setToast("Bo'shman holati yoqildi — do'stlaringiz sizni xaritada ko'radi");
      onRefresh();
    } catch {
      setToast("Tarmoq xatosi");
    } finally {
      setFreeBusy(false);
    }
  }

  async function disableFree() {
    setFreeBusy(true);
    try {
      const response = await fetch("/api/me/free", { method: "DELETE" });
      if (!response.ok) {
        setToast("Holatni o'chirib bo'lmadi");
        return;
      }
      setToast("Bo'shman holati o'chirildi");
      onRefresh();
    } catch {
      setToast("Tarmoq xatosi");
    } finally {
      setFreeBusy(false);
    }
  }

  async function copyInviteLink() {
    if (!user) return;
    const link = `${window.location.origin}/?invite=${user.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setToast("Shaxsiy havola nusxalandi");
    } catch {
      setToast(link);
    }
  }

  function openInviteEvent(notification: AppNotification) {
    if (!notification.eventId) return;
    void fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notification.id }),
    }).catch(() => undefined);
    onOpenEvent(notification.eventId);
  }

  return (
    <div className="app-bg fixed inset-0 z-[68] flex flex-col">
      <header className="sticky top-0 z-10 border-b border-white/8 bg-[#07040f]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pb-3 pt-[max(0.9rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-ink-soft transition hover:border-violet-400/40 hover:text-ink"
            aria-label="Orqaga"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[19px] font-bold leading-none tracking-[-0.02em]">
              Do&apos;stlar
            </h1>
            <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-muted">
              Birga bo&apos;l · xaritada ko&apos;rish
            </p>
          </div>
          {user ? (
            <button
              type="button"
              onClick={copyInviteLink}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-2 text-[10.5px] font-extrabold text-white shadow-[0_10px_26px_-14px_rgba(139,92,246,1)]"
            >
              <Link2 size={13} />
              Havola
            </button>
          ) : null}
        </div>
      </header>

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4">
          {!user ? (
            <GuestCard onRequireAuth={onRequireAuth} />
          ) : (
            <div className="space-y-5">
              <FreeStatusCard
                active={freeStatus}
                open={freeOpen}
                hours={hours}
                note={note}
                busy={freeBusy}
                friendsCount={friends.length}
                onToggleOpen={() => setFreeOpen((value) => !value)}
                onHours={setHours}
                onNote={setNote}
                onEnable={() => void enableFree()}
                onDisable={() => void disableFree()}
              />

              {invites.length ? (
                <section>
                  <SectionTitle title="Takliflar" count={invites.length} />
                  <div className="mt-2 space-y-2">
                    {invites.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-center gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/10 p-3"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/25 text-violet-200">
                          <CalendarPlus size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11.5px] font-bold text-ink">
                            {notification.title}
                          </p>
                          <p className="mt-0.5 truncate text-[10.5px] font-medium text-violet-200/80">
                            {notification.body}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openInviteEvent(notification)}
                          className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold text-ink transition hover:bg-white/15"
                        >
                          Ko&apos;rish
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {incoming.length ? (
                <section>
                  <SectionTitle title="So'rovlar" count={incoming.length} accent />
                  <div className="mt-2 space-y-2">
                    {incoming.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.045] p-3"
                      >
                        <Avatar name={request.user.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-bold text-ink">
                            {request.user.name}
                          </p>
                          <p className="mt-0.5 text-[10px] font-semibold text-muted">
                            Do&apos;st bo&apos;lishni xohlaydi
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            type="button"
                            onClick={() => respond(request.id, true)}
                            disabled={busy === `respond-${request.id}`}
                            className="grid h-8 w-8 place-items-center rounded-full bg-lime text-[#150d24] transition hover:brightness-105 disabled:opacity-60"
                            aria-label="Qabul qilish"
                          >
                            {busy === `respond-${request.id}` ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={15} strokeWidth={3} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => respond(request.id, false)}
                            disabled={busy === `respond-${request.id}`}
                            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-muted transition hover:text-ink disabled:opacity-60"
                            aria-label="Rad etish"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <SectionTitle title="Do'st topish" icon={<UserPlus size={12} />} />
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 focus-within:border-violet-400/60">
                  <Search size={15} className="shrink-0 text-muted" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ism yoki telefon raqam"
                    className="field-bare px-0 py-0 text-[12.5px]"
                    inputMode="search"
                  />
                  {searching ? <Loader2 size={14} className="animate-spin text-muted" /> : null}
                </div>

                {results ? (
                  results.length ? (
                    <div className="mt-2 space-y-2">
                      {results.map((person) => (
                        <SearchResultRow
                          key={person.id}
                          person={person}
                          busy={busy}
                          onAdd={() => requestFriend(person.id)}
                          onAccept={() => {
                            const request = incoming.find((item) => item.user.id === person.id);
                            if (request) respond(request.id, true);
                          }}
                          onBlock={() => blockUser(person.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-3 py-4 text-center text-[11px] font-medium text-muted">
                      Hech kim topilmadi. Do&apos;stingizga shaxsiy havolani yuboring.
                    </p>
                  )
                ) : null}
              </section>

              <section>
                <SectionTitle
                  title="Do'stlarim"
                  count={friends.length}
                  icon={<Users size={12} />}
                />
                {friends.length ? (
                  <div className="mt-2 space-y-2">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="rounded-2xl border border-white/8 bg-white/[0.045] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={friend.name} online={Boolean(friend.freeUntil)} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-bold text-ink">
                              {friend.name}
                            </p>
                            <a
                              href={`tel:${friend.phone}`}
                              className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink-soft hover:text-violet-200"
                            >
                              <Phone size={10} />
                              {prettyPhone(friend.phone)}
                            </a>
                            {friend.freeUntil ? (
                              <p className="mt-1 flex items-center gap-1 overflow-hidden text-[10px] font-bold text-lime">
                                <Sparkles size={10} className="shrink-0" />
                                <span className="shrink-0">
                                  Hozir bo&apos;sh · {untilLabel(friend.freeUntil)}
                                </span>
                                {friend.freeNote ? (
                                  <span className="truncate font-medium text-ink-soft/80">
                                    · {friend.freeNote}
                                  </span>
                                ) : null}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInviteFor(friend)}
                              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-violet-200 transition hover:border-violet-400/40"
                              aria-label="Tadbirga taklif qilish"
                              title="Tadbirga taklif qilish"
                            >
                              <CalendarPlus size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setRemovingId((current) =>
                                  current === friend.id ? null : friend.id,
                                )
                              }
                              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-muted transition hover:text-rose-300"
                              aria-label="Do'stlar ro'yxatidan olib tashlash"
                            >
                              <UserMinus size={14} />
                            </button>
                          </div>
                        </div>

                        {removingId === friend.id ? (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-white/8 pt-2.5">
                            <p className="text-[10.5px] font-semibold text-muted">
                              Ishonchingiz komilmi?
                            </p>
                            <button
                              type="button"
                              onClick={() => removeFriend(friend.id)}
                              className="rounded-full bg-rose-500/15 px-3 py-1.5 text-[10px] font-extrabold text-rose-300"
                            >
                              O&apos;chirish
                            </button>
                            <button
                              type="button"
                              onClick={() => blockUser(friend.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-extrabold text-muted"
                            >
                              <ShieldOff size={11} />
                              Bloklash
                            </button>
                            <button
                              type="button"
                              onClick={() => setRemovingId(null)}
                              className="ml-auto text-[10px] font-bold text-ink-soft"
                            >
                              Bekor
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] px-4 py-7 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-200">
                      <Users size={22} />
                    </span>
                    <p className="mt-3 font-display text-[14px] font-semibold text-ink">
                      Hali do&apos;stlaringiz yo&apos;q
                    </p>
                    <p className="mx-auto mt-1 max-w-[32ch] text-[11.5px] leading-relaxed text-muted">
                      Telefon raqami orqali toping yoki shaxsiy havolani ulashing. Do&apos;stlar
                      &laquo;bo&apos;shman&raquo; holatini xaritada ko&apos;rsatadi.
                    </p>
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-[10.5px] font-extrabold text-ink transition hover:bg-white/15"
                    >
                      <Copy size={12} />
                      Havolani nusxalash
                    </button>
                  </div>
                )}
              </section>

              {outgoing.length ? (
                <section>
                  <SectionTitle title="Yuborilgan so'rovlar" count={outgoing.length} />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {outgoing.map((request) => (
                      <span
                        key={request.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10.5px] font-bold text-ink-soft"
                      >
                        <Clock3 size={11} className="text-muted" />
                        {request.user.name}
                        <span className="text-[9px] font-semibold text-muted">kutilmoqda</span>
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              <p className="pt-1 text-center text-[9.5px] leading-relaxed text-muted/80">
                Shaxsiy yozishmalar yo&apos;q — faqat do&apos;stlik va tadbirga takliflar.
              </p>
            </div>
          )}
        </div>
      </div>

      {inviteFor ? (
        <div className="fixed inset-0 z-[72] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Yopish"
            onClick={() => setInviteFor(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-[3px]"
          />
          <div className="animate-sheet-up relative w-full max-w-md rounded-t-[26px] border border-white/10 bg-[#0f0919] p-4 shadow-[0_-30px_80px_-30px_rgba(0,0,0,1)] sm:rounded-[26px]">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/15 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-muted">
                  Taklif yuborish
                </p>
                <p className="mt-1 font-display text-[16px] font-bold">
                  {inviteFor.name} uchun tadbir tanlang
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInviteFor(null)}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-muted"
                aria-label="Yopish"
              >
                <X size={15} />
              </button>
            </div>
            <div className="scroll-area mt-3 max-h-[52dvh] space-y-2 overflow-y-auto pr-1">
              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => invite(inviteFor, event.id)}
                  disabled={busy === `invite-${inviteFor.id}-${event.id}`}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-2.5 text-left transition hover:border-violet-400/40 hover:bg-white/[0.07] disabled:opacity-60"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[10px] font-extrabold"
                    style={{
                      backgroundColor: `${event.category.color}26`,
                      color: event.category.color,
                    }}
                  >
                    {formatDateShort(event.startsAt)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-bold text-ink">
                      {event.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-muted">
                      <Clock3 size={9} />
                      {formatTime(event.startsAt)}
                      <MapPin size={9} className="ml-1" />
                      <span className="truncate">{event.venue || event.address}</span>
                    </span>
                  </span>
                  {busy === `invite-${inviteFor.id}-${event.id}` ? (
                    <Loader2 size={14} className="animate-spin text-muted" />
                  ) : (
                    <ChevronRight size={15} className="text-muted" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="animate-pop fixed bottom-24 left-1/2 z-[75] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-[#160e28]/97 px-3.5 py-2.5 text-[11px] font-bold text-ink shadow-soft backdrop-blur">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime text-[#150d24]">
            <Check size={12} strokeWidth={3} />
          </span>
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function SectionTitle({
  title,
  count,
  icon,
  accent,
}: {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-muted">
        {icon ? <span className="mr-1 inline-flex align-[-1px] text-violet-300">{icon}</span> : null}
        {title}
      </p>
      {typeof count === "number" && count > 0 ? (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
            accent ? "bg-lime/20 text-lime" : "bg-white/8 text-ink-soft"
          }`}
        >
          {count}
        </span>
      ) : null}
    </div>
  );
}

function Avatar({ name, online }: { name: string; online?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-gradient-to-br from-violet-500 to-fuchsia-600 font-display text-[14px] font-bold text-white">
      {initials}
      {online ? (
        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0f0919] bg-lime" />
      ) : null}
    </span>
  );
}

function SearchResultRow({
  person,
  busy,
  onAdd,
  onAccept,
  onBlock,
}: {
  person: PublicUser;
  busy: string | null;
  onAdd(): void;
  onAccept(): void;
  onBlock(): void;
}) {
  const isBusy = busy === `add-${person.id}` || busy === `block-${person.id}`;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.045] p-3">
      <Avatar name={person.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-bold text-ink">{person.name}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-muted">
          {person.phone
            ? prettyPhone(person.phone)
            : person.relation === "friends"
              ? "Do'stingiz"
              : "Birga foydalanuvchisi"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {person.relation === "friends" ? (
          <span className="rounded-full bg-lime/15 px-2.5 py-1 text-[9.5px] font-extrabold text-lime">
            Do&apos;st
          </span>
        ) : person.relation === "outgoing" ? (
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-[9.5px] font-extrabold text-muted">
            Yuborilgan
          </span>
        ) : person.relation === "incoming" ? (
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1.5 text-[10px] font-extrabold text-white"
          >
            Qabul qilish
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={isBusy}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold text-ink transition hover:bg-white/15 disabled:opacity-60"
          >
            {isBusy ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
            Qo&apos;shish
          </button>
        )}
        {person.relation !== "friends" ? (
          <button
            type="button"
            onClick={onBlock}
            disabled={isBusy}
            className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-muted transition hover:text-rose-300 disabled:opacity-60"
            aria-label="Bloklash"
            title="Bloklash"
          >
            <ShieldOff size={12} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FreeStatusCard({
  active,
  open,
  hours,
  note,
  busy,
  friendsCount,
  onToggleOpen,
  onHours,
  onNote,
  onEnable,
  onDisable,
}: {
  active: { until: string; note: string; lat: number | null; lng: number | null } | null;
  open: boolean;
  hours: number;
  note: string;
  busy: boolean;
  friendsCount: number;
  onToggleOpen(): void;
  onHours(value: number): void;
  onNote(value: string): void;
  onEnable(): void;
  onDisable(): void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-violet-400/25 bg-gradient-to-br from-violet-700/70 via-violet-900/60 to-[#1a0f33] p-4 shadow-[0_24px_60px_-32px_rgba(139,92,246,0.8)]">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-lime/10 blur-3xl" />

      <div className="relative flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/12 text-lime backdrop-blur">
          <Sparkles size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-lime/90">
            Bo&apos;shman holati
          </p>
          {active ? (
            <>
              <p className="mt-1 font-display text-[17px] font-bold leading-tight">
                Hozir bo&apos;shman
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10.5px] font-semibold text-white/80">
                <span>{untilLabel(active.until)} qoldi</span>
                <span className="text-white/40">·</span>
                <span>{timeOf(active.until)} gacha</span>
                {active.note ? (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="text-lime/90">{active.note}</span>
                  </>
                ) : null}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 font-display text-[17px] font-bold leading-tight">
                Do&apos;stlaringizga ko&apos;rin
              </p>
              <p className="mt-1 text-[10.5px] font-medium leading-relaxed text-white/75">
                {friendsCount
                  ? `${friendsCount} do'stingiz sizni xaritada ko'radi`
                  : "Do'st qo'shsangiz, ular sizni xaritada ko'radi"}
              </p>
            </>
          )}
        </div>
        {active ? (
          <button
            type="button"
            onClick={onDisable}
            disabled={busy}
            className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold text-white transition hover:bg-white/15 disabled:opacity-60"
          >
            O&apos;chirish
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleOpen}
            className="shrink-0 rounded-full bg-lime px-3 py-1.5 text-[10px] font-extrabold text-[#150d24] shadow-[0_10px_24px_-12px_rgba(200,255,94,1)]"
          >
            {open ? "Yopish" : "Yoqish"}
          </button>
        )}
      </div>

      {!active && open ? (
        <div className="relative mt-3 space-y-2.5 border-t border-white/15 pt-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/60">
              Davomiylik
            </p>
            <div className="mt-1.5 flex gap-1.5">
              {[2, 4, 8].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onHours(value)}
                  className={`flex-1 rounded-xl py-2 text-[11px] font-extrabold transition ${
                    hours === value
                      ? "bg-lime text-[#150d24]"
                      : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                  }`}
                >
                  {value} soat
                </button>
              ))}
            </div>
          </div>
          <input
            value={note}
            onChange={(event) => onNote(event.target.value.slice(0, 80))}
            placeholder="Nima qilmoqchisiz? (masalan, kompga)"
            className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-[11.5px] font-medium text-white placeholder:text-white/40 focus:border-lime/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={onEnable}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-[11.5px] font-extrabold text-[#150d24] transition hover:brightness-105 disabled:opacity-70"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
            Bo&apos;shman deb belgilash
          </button>
          <p className="text-center text-[9px] font-medium text-white/55">
            Joylashuv ±250 m aniqlikda ko&apos;rsatiladi · faqat do&apos;stlarga
          </p>
        </div>
      ) : null}
    </section>
  );
}

function GuestCard({ onRequireAuth }: { onRequireAuth(): void }) {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.045] p-5 text-center shadow-[0_30px_70px_-40px_rgba(0,0,0,1)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-600/25 blur-3xl" />
      <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-[0_0_36px_-8px_rgba(139,92,246,0.9)]">
        <Users size={26} />
      </span>
      <p className="relative mt-4 font-display text-[18px] font-bold leading-snug">
        Do&apos;stlaringizni xaritada ko&apos;ring
      </p>
      <p className="relative mx-auto mt-2 max-w-[34ch] text-[12px] leading-relaxed text-ink-soft/85">
        Ro&apos;yxatdan o&apos;tib do&apos;st qo&apos;shing: kim&apos;dir
        &laquo;bo&apos;shman&raquo; desa, uning taxminiy joyi xaritada ko&apos;rinadi va siz uni
        tadbirga taklif qilishingiz mumkin.
      </p>
      <button
        type="button"
        onClick={onRequireAuth}
        className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-[12.5px] font-extrabold text-white shadow-[0_16px_36px_-18px_rgba(139,92,246,0.95)]"
      >
        Ro&apos;yxatdan o&apos;tish
        <ChevronRight size={15} />
      </button>
      <p className="relative mt-2 text-[9.5px] font-medium text-muted">
        Shaxsiy yozishmalar yo&apos;q — faqat do&apos;stlik va takliflar
      </p>
    </div>
  );
}
