"use client";

import { CalendarDays, Map, User, Users } from "lucide-react";

export type NavKey = "map" | "events" | "places" | "friends" | "profile";

interface MobileNavProps {
  active: NavKey;
  badge?: boolean;
  onMap(): void;
  onEvents(): void;
  onFriends(): void;
  onProfile(): void;
}

export function MobileNav({ active, badge, onMap, onEvents, onFriends, onProfile }: MobileNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="flex w-full max-w-sm items-center justify-between gap-0.5 rounded-[24px] border border-white/12 bg-[rgba(14,8,26,0.86)] p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,1)] backdrop-blur-2xl">
        <NavItem
          active={active === "map"}
          icon={<Map size={17} />}
          label="Xarita"
          onClick={onMap}
        />
        <NavItem
          active={active === "events"}
          icon={<CalendarDays size={17} />}
          label="Tadbirlar"
          onClick={onEvents}
        />
        <NavItem
          active={active === "friends"}
          icon={<Users size={17} />}
          label="Do'stlar"
          badge={badge}
          onClick={onFriends}
        />
        <NavItem
          active={active === "profile"}
          icon={<User size={17} />}
          label="Profil"
          onClick={onProfile}
        />
      </div>
    </nav>
  );
}

function NavItem({
  active,
  icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: boolean;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex flex-1 flex-col items-center gap-1 rounded-[18px] px-1 py-1.5 transition ${
        active ? "text-ink" : "text-muted active:text-ink"
      }`}
    >
      <span
        className={`relative grid h-9 w-full max-w-[52px] place-items-center rounded-[13px] transition ${
          active
            ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-[0_10px_22px_-10px_rgba(139,92,246,1)]"
            : "bg-transparent group-active:bg-white/5"
        }`}
      >
        {icon}
        {badge ? (
          <span className="absolute right-2.5 top-1.5 h-2 w-2 rounded-full bg-lime shadow-[0_0_10px_rgba(200,255,94,0.9)]" />
        ) : null}
      </span>
      <span
        className={`text-[8.5px] font-extrabold uppercase tracking-[0.08em] ${
          active ? "text-ink" : "text-muted"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
