"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Explorer } from "@/components/explorer/Explorer";
import type { Tab } from "@/components/explorer/types";
import type {
  Boundary,
  Category,
  EventItem,
  FriendsOverview,
  PlaceItem,
  UserAccount,
} from "@/lib/types";
import { FriendsScreen } from "./FriendsScreen";
import { MobileNav, type NavKey } from "./MobileNav";
import { ProfileSheet } from "./ProfileSheet";
import { WelcomeScreen } from "./WelcomeScreen";

const GUEST_KEY = "navqiron_guest";

interface AppExperienceProps {
  user: UserAccount | null;
  events: EventItem[];
  places: PlaceItem[];
  categories: Category[];
  boundary: Boundary | null;
  googleApiKey: string;
  googleMapId: string;
}

export function AppExperience({
  user: initialUser,
  events,
  places,
  categories,
  boundary,
  googleApiKey,
  googleMapId,
}: AppExperienceProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserAccount | null>(initialUser);
  const [booted, setBooted] = useState(false);
  const [entered, setEntered] = useState(Boolean(initialUser));
  const [tab, setTab] = useState<Tab>("events");
  const [nav, setNav] = useState<NavKey>("events");
  const [profileOpen, setProfileOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [overview, setOverview] = useState<FriendsOverview | null>(null);
  const [focusEventId, setFocusEventId] = useState<number | null>(null);
  const previousNav = useRef<NavKey>("events");
  const inviteHandled = useRef(false);

  const refreshFriends = useCallback(async () => {
    if (!user) {
      setOverview(null);
      return;
    }
    try {
      const response = await fetch("/api/friends");
      if (!response.ok) return;
      const payload = (await response.json()) as { data?: FriendsOverview } | null;
      if (payload?.data) setOverview(payload.data);
    } catch {
      // offline — keep the previous overview
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setOverview(null);
      return;
    }
    void refreshFriends();
  }, [user, refreshFriends]);

  useEffect(() => {
    if (!user || inviteHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const invite = Number(params.get("invite"));
    if (!invite || invite === user.id) return;
    inviteHandled.current = true;
    params.delete("invite");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
    void (async () => {
      try {
        await fetch("/api/friends/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: invite }),
        });
      } catch {
        // network failure — the request can be retried from the search field
      }
      await refreshFriends();
      openFriends();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshFriends]);

  useEffect(() => {
    let guest = false;
    try {
      guest = window.localStorage.getItem(GUEST_KEY) === "1";
    } catch {
      guest = false;
    }
    const params = new URLSearchParams(window.location.search);
    const deepLink = params.has("event") || params.has("place");
    if (initialUser || guest || deepLink) {
      setEntered(true);
      if (deepLink) setNav("map");
    }
    setBooted(true);
  }, [initialUser]);

  function scrollToId(id: string) {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }

  function handleAuthenticated(next: UserAccount) {
    try {
      window.localStorage.removeItem(GUEST_KEY);
    } catch {
      // storage may be unavailable
    }
    setUser(next);
    setEntered(true);
    setTab("events");
    setNav("events");
    router.refresh();
  }

  function handleGuest() {
    try {
      window.localStorage.setItem(GUEST_KEY, "1");
    } catch {
      // storage may be unavailable
    }
    setEntered(true);
    setNav("map");
    scrollToId("map-section");
  }

  async function handleLogout() {
    try {
      await fetch("/api/user/logout", { method: "POST" });
    } catch {
      // ignore network failure — session cookie will expire anyway
    }
    try {
      window.localStorage.removeItem(GUEST_KEY);
    } catch {
      // storage may be unavailable
    }
    setProfileOpen(false);
    setFriendsOpen(false);
    setOverview(null);
    setFocusEventId(null);
    setEntered(false);
    setUser(null);
    setNav("events");
    setTab("events");
    router.refresh();
  }

  function openProfile() {
    previousNav.current = nav;
    setNav("profile");
    setProfileOpen(true);
  }

  function closeProfile() {
    setProfileOpen(false);
    setNav(previousNav.current === "profile" ? "events" : previousNav.current);
  }

  function openFriends() {
    previousNav.current = nav === "friends" ? previousNav.current : nav;
    setProfileOpen(false);
    setNav("friends");
    setFriendsOpen(true);
    void refreshFriends();
  }

  function closeFriends() {
    setFriendsOpen(false);
    setNav(previousNav.current === "profile" ? "events" : previousNav.current);
  }

  function handleOpenEvent(eventId: number) {
    setFriendsOpen(false);
    setTab("events");
    setNav("events");
    setFocusEventId(eventId);
    void refreshFriends();
  }

  function handleRequireAuth() {
    setFriendsOpen(false);
    setProfileOpen(false);
    setEntered(false);
  }

  if (!booted) {
    return (
      <div className="app-bg grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-3">
          <span className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-[0_0_44px_-8px_rgba(139,92,246,0.9)]">
            <Sparkles size={26} />
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.24em] text-muted">
            Navqiron yuklanmoqda
          </span>
        </div>
      </div>
    );
  }

  if (!entered) {
    return <WelcomeScreen onAuthenticated={handleAuthenticated} onGuest={handleGuest} />;
  }

  return (
    <>
      <Explorer
        events={events}
        places={places}
        categories={categories}
        boundary={boundary}
        googleApiKey={googleApiKey}
        googleMapId={googleMapId}
        tab={tab}
        onTabChange={(next) => {
          setTab(next);
          setNav(next);
        }}
        user={user}
        onProfile={openProfile}
        freeFriends={user ? overview?.free ?? [] : []}
        onOpenFriends={openFriends}
        focusEventId={focusEventId}
        onFocusHandled={() => setFocusEventId(null)}
      />

      <MobileNav
        active={nav}
        badge={Boolean(user && overview && overview.unread + overview.incoming.length > 0)}
        onMap={() => {
          setNav("map");
          scrollToId("map-section");
        }}
        onEvents={() => {
          setTab("events");
          setNav("events");
          scrollToId("list-section");
        }}
        onFriends={openFriends}
        onProfile={openProfile}
      />

      {profileOpen ? (
        <ProfileSheet
          user={user}
          friendsCount={overview ? overview.friends.length : null}
          onFriends={openFriends}
          onClose={closeProfile}
          onLogout={handleLogout}
          onRegister={() => {
            setProfileOpen(false);
            setEntered(false);
          }}
        />
      ) : null}

      {friendsOpen ? (
        <FriendsScreen
          user={user}
          overview={overview}
          events={events}
          onClose={closeFriends}
          onRefresh={() => {
            void refreshFriends();
          }}
          onRequireAuth={handleRequireAuth}
          onOpenEvent={handleOpenEvent}
        />
      ) : null}
    </>
  );
}
