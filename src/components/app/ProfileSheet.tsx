"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Loader2,
  LogIn,
  LogOut,
  Phone,
  Settings2,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { UserAccount } from "@/lib/types";

interface ProfileSheetProps {
  user: UserAccount | null;
  friendsCount?: number | null;
  onFriends(): void;
  onClose(): void;
  onLogout(): Promise<void> | void;
  onRegister(): void;
}

function prettyPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }
  return phone;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function memberSince(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

export function ProfileSheet({
  user,
  friendsCount,
  onFriends,
  onClose,
  onLogout,
  onRegister,
}: ProfileSheetProps) {
  const [registrations, setRegistrations] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);

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
    if (!user) return;
    let alive = true;
    fetch("/api/user/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { data?: { registrations?: number } } | null) => {
        if (alive && typeof payload?.data?.registrations === "number") {
          setRegistrations(payload.data.registrations);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [user]);

  async function handleLogout() {
    setLeaving(true);
    try {
      await onLogout();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center">
      <button
        type="button"
        aria-label="Yopish"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-[3px]"
      />
      <div className="animate-sheet-up relative w-full max-w-md overflow-hidden rounded-t-[30px] border border-white/10 bg-[#0f0919] shadow-[0_-30px_80px_-30px_rgba(0,0,0,1)] sm:rounded-[30px] lg:max-w-lg">
        <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-violet-600/25 blur-3xl" />

        <div className="relative px-5 pb-5 pt-3">
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/15" />

          <div className="flex items-start justify-between">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-muted">
              Profil
            </p>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-muted transition hover:text-ink"
              aria-label="Yopish"
            >
              <X size={15} />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3.5">
            <span className="relative grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-gradient-to-br from-violet-500 via-violet-600 to-fuchsia-600 font-display text-[22px] font-bold text-white shadow-[0_14px_36px_-14px_rgba(139,92,246,1)]">
              {user ? initials(user.name) : <Sparkles size={24} />}
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#0f0919] bg-lime text-[#150d24]">
                {user ? <ShieldCheck size={12} /> : <LogIn size={11} />}
              </span>
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[19px] font-bold leading-tight">
                {user ? user.name : "Mehmon foydalanuvchi"}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-semibold text-muted">
                <Phone size={11} />
                {user ? prettyPhone(user.phone) : "Hisobga kirmagansiz"}
              </p>
              <span
                className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] ${
                  user
                    ? "bg-lime/15 text-lime"
                    : "bg-amber-400/10 text-amber-300"
                }`}
              >
                {user ? "Tasdiqlangan hisob" : "Mehmon rejimi"}
              </span>
            </div>
          </div>

          {user ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  <Ticket size={11} className="text-violet-300" />
                  Tadbirlarim
                </p>
                <p className="mt-1 font-display text-[20px] font-bold leading-none">
                  {registrations === null ? "—" : registrations}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  <Sparkles size={11} className="text-lime" />
                  A&apos;zo bo&apos;lgan
                </p>
                <p className="mt-1 font-display text-[13px] font-bold leading-none">
                  {user.createdAt ? memberSince(user.createdAt) : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-3 text-[11.5px] leading-relaxed text-ink-soft">
              Ro&apos;yxatdan o&apos;tib, tadbirlarga bir bosishda yoziling va
              tanlangan joylaringizni saqlang.
            </p>
          )}

          <div className="mt-4 space-y-2">
            {!user ? (
              <button
                type="button"
                onClick={onRegister}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-[12.5px] font-extrabold text-white shadow-[0_16px_36px_-18px_rgba(139,92,246,0.95)]"
              >
                <UserPlus size={15} />
                Ro&apos;yxatdan o&apos;tish
              </button>
            ) : null}

            {user ? (
              <button
                type="button"
                onClick={onFriends}
                className="flex w-full items-center justify-between rounded-2xl border border-violet-400/25 bg-violet-500/[0.08] px-4 py-3 text-[12px] font-bold text-ink-soft transition hover:border-violet-400/50 hover:text-ink"
              >
                <span className="flex items-center gap-2">
                  <Users size={15} className="text-violet-300" />
                  Do&apos;stlar va takliflar
                </span>
                <span className="flex items-center gap-1.5">
                  {typeof friendsCount === "number" ? (
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-violet-200">
                      {friendsCount}
                    </span>
                  ) : null}
                  <ChevronRight size={15} className="text-muted" />
                </span>
              </button>
            ) : null}

            <Link
              href="/admin"
              className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-[12px] font-bold text-ink-soft transition hover:border-violet-400/30 hover:text-ink"
            >
              <span className="flex items-center gap-2">
                <Settings2 size={15} className="text-violet-300" />
                Admin panel
              </span>
              <ChevronRight size={15} className="text-muted" />
            </Link>

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={leaving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-[12px] font-extrabold text-rose-300 transition hover:bg-rose-500/15 disabled:opacity-60"
              >
                {leaving ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                Hisobdan chiqish
              </button>
            ) : null}
          </div>

          <p className="mt-4 pb-[max(0.25rem,env(safe-area-inset-bottom))] text-center text-[9px] font-medium text-muted/80">
            Navqiron · Yunusobod yoshlar platformasi
          </p>
        </div>
      </div>
    </div>
  );
}
