"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
} from "lucide-react";
import type { AdminUser } from "@/lib/types";
import { api } from "./client";

const NAV = [
  { href: "/admin", label: "Umumiy", icon: LayoutDashboard },
  { href: "/admin/events", label: "Tadbirlar", icon: CalendarDays },
  { href: "/admin/places", label: "Joylar", icon: MapPin },
];

export function AdminShell({
  admin,
  children,
}: {
  admin: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function logout() {
    setLeaving(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-dvh bg-cream">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col gap-4 p-3 lg:flex-row lg:p-6">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:w-64 lg:shrink-0">
          <div className="flex items-center justify-between rounded-3xl border border-line bg-paper p-4 lg:flex-col lg:items-stretch lg:gap-6 lg:p-5">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-pine text-lg font-black text-lime">
                N
              </span>
              <span>
                <span className="block font-display text-base leading-tight font-bold">
                  Navqiron
                </span>
                <span className="block text-[11px] font-semibold tracking-wide text-muted uppercase">
                  Admin panel
                </span>
              </span>
            </Link>

            <nav className="flex items-center gap-1 overflow-x-auto lg:flex-col lg:items-stretch lg:gap-1.5">
              {NAV.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold whitespace-nowrap transition ${
                      active
                        ? "bg-pine text-paper"
                        : "text-ink-soft hover:bg-cream-deep"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden flex-1 flex-col justify-end gap-3 lg:flex">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between rounded-2xl border border-line bg-paper px-4 py-3 text-sm font-bold text-ink-soft transition hover:border-pine/30 hover:text-pine"
            >
              Saytni ko&apos;rish
              <ArrowUpRight className="size-4" />
            </Link>
            <div className="rounded-2xl border border-line bg-paper p-4">
              <p className="truncate text-sm font-bold text-ink">{admin.name}</p>
              <p className="truncate text-xs text-muted">{admin.email}</p>
              <button
                type="button"
                onClick={logout}
                disabled={leaving}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cream px-3 py-2 text-xs font-bold text-ink-soft transition hover:bg-cream-deep disabled:opacity-60"
              >
                {leaving ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                Chiqish
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 lg:hidden">
            <span className="truncate text-xs font-semibold text-muted">{admin.email}</span>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="grid size-9 place-items-center rounded-xl border border-line bg-paper text-ink-soft"
                aria-label="Saytni ko'rish"
              >
                <ArrowUpRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={logout}
                disabled={leaving}
                className="grid size-9 place-items-center rounded-xl border border-line bg-paper text-ink-soft"
                aria-label="Chiqish"
              >
                {leaving ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
