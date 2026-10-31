"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, MapPin } from "lucide-react";
import { FiltersPanel } from "./FiltersPanel";
import { HeaderPanel } from "./HeaderPanel";
import { ListPanel } from "./ListPanel";
import { MapSection } from "./MapSection";
import { RegisterDialog } from "./RegisterDialog";
import type { DateRange, LayerState, Selected, Tab } from "./types";
import type {
  Boundary,
  Category,
  EventItem,
  FreeFriend,
  MapPoint,
  PlaceItem,
  TransitStop,
  UserAccount,
} from "@/lib/types";
import {
  formatDateShort,
  formatTime,
  isToday,
  isUpcoming,
  isWithinDays,
  normalizeText,
} from "@/lib/format";

interface ExplorerProps {
  events: EventItem[];
  places: PlaceItem[];
  categories: Category[];
  boundary: Boundary | null;
  googleApiKey: string;
  googleMapId: string;
  tab: Tab;
  onTabChange(tab: Tab): void;
  user: UserAccount | null;
  onProfile(): void;
  freeFriends: FreeFriend[];
  onOpenFriends(): void;
  focusEventId: number | null;
  onFocusHandled(): void;
}

export function Explorer({
  events,
  places,
  categories,
  boundary,
  googleApiKey,
  googleMapId,
  tab,
  onTabChange,
  user,
  onProfile,
  freeFriends,
  onOpenFriends,
  focusEventId,
  onFocusHandled,
}: ExplorerProps) {
  const [eventList, setEventList] = useState<EventItem[]>(events);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [query, setQuery] = useState("");
  const [layers, setLayers] = useState<LayerState>({ event: true, place: true, friend: true });
  const [selected, setSelected] = useState<{ kind: "event" | "place"; id: number } | null>(
    null,
  );
  const [registerEvent, setRegisterEvent] = useState<EventItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [stops, setStops] = useState<TransitStop[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/transit")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { data?: TransitStop[] } | null) => {
        if (!cancelled && Array.isArray(payload?.data)) setStops(payload.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingEvents = useMemo(
    () => eventList.filter((event) => isUpcoming(event.startsAt)),
    [eventList],
  );

  const normalizedQuery = normalizeText(query);

  const eventCategories = useMemo(
    () => categories.filter((category) => category.kind === "event"),
    [categories],
  );
  const placeCategories = useMemo(
    () => categories.filter((category) => category.kind === "place"),
    [categories],
  );
  const activeCategories = tab === "events" ? eventCategories : placeCategories;

  const filteredEvents = useMemo(() => {
    const categorySlug = tab === "events" ? activeCategory : null;
    const range = tab === "events" ? dateRange : "all";
    return upcomingEvents
      .filter((event) => {
        if (categorySlug && event.category.slug !== categorySlug) return false;
        if (
          normalizedQuery &&
          !normalizeText(
            [
              event.title,
              event.venue,
              event.address,
              event.description,
              event.organizer,
              event.category.name,
            ].join(" "),
          ).includes(normalizedQuery)
        ) {
          return false;
        }
        if (range === "today" && !isToday(event.startsAt)) return false;
        if (range === "week" && !isWithinDays(event.startsAt, 7)) return false;
        if (range === "month" && !isWithinDays(event.startsAt, 30)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [upcomingEvents, tab, activeCategory, dateRange, normalizedQuery]);

  const filteredPlaces = useMemo(() => {
    const categorySlug = tab === "places" ? activeCategory : null;
    return places.filter((place) => {
      if (categorySlug && place.category.slug !== categorySlug) return false;
      if (
        normalizedQuery &&
        !normalizeText(
          [place.name, place.address, place.description, place.category.name].join(" "),
        ).includes(normalizedQuery)
      ) {
        return false;
      }
      return true;
    });
  }, [places, tab, activeCategory, normalizedQuery]);

  const stats = useMemo(() => {
    const youth = upcomingEvents.reduce((sum, event) => sum + event.registered, 0);
    return { events: upcomingEvents.length, places: places.length, youth };
  }, [upcomingEvents, places]);

  const points = useMemo<MapPoint[]>(() => {
    const result: MapPoint[] = [];
    if (layers.event) {
      for (const event of filteredEvents) {
        result.push({
          key: `event-${event.id}`,
          kind: "event",
          entityId: event.id,
          slug: event.slug,
          title: event.title,
          lat: event.lat,
          lng: event.lng,
          color: event.category.color,
          icon: event.category.icon,
          categoryName: event.category.name,
          meta: `${formatDateShort(event.startsAt)} · ${formatTime(event.startsAt)}`,
        });
      }
    }
    if (layers.place) {
      for (const place of filteredPlaces) {
        result.push({
          key: `place-${place.id}`,
          kind: "place",
          entityId: place.id,
          slug: place.slug,
          title: place.name,
          lat: place.lat,
          lng: place.lng,
          color: place.category.color,
          icon: place.category.icon,
          categoryName: place.category.name,
          meta: place.workingHours || place.address,
        });
      }
    }
    return result;
  }, [layers, filteredEvents, filteredPlaces]);

  const selectedItem = useMemo<Selected | null>(() => {
    if (!selected) return null;
    if (selected.kind === "event") {
      const item = eventList.find((event) => event.id === selected.id);
      return item ? { kind: "event", item } : null;
    }
    const item = places.find((place) => place.id === selected.id);
    return item ? { kind: "place", item } : null;
  }, [selected, eventList, places]);

  const selectedKey = selectedItem
    ? `${selectedItem.kind}-${selectedItem.item.id}`
    : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventSlug = params.get("event");
    const placeSlug = params.get("place");
    if (eventSlug) {
      const item = eventList.find((event) => event.slug === eventSlug);
      if (item) {
        setSelected({ kind: "event", id: item.id });
        return;
      }
    }
    if (placeSlug) {
      const item = places.find((place) => place.slug === placeSlug);
      if (item) setSelected({ kind: "place", id: item.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("event");
    url.searchParams.delete("place");
    if (selectedItem) {
      url.searchParams.set(
        selectedItem.kind,
        selectedItem.item.slug,
      );
    }
    window.history.replaceState(null, "", url.toString());
  }, [selectedItem]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!focusEventId) return;
    const item = eventList.find((event) => event.id === focusEventId);
    if (item) {
      setSelected({ kind: "event", id: item.id });
      window.setTimeout(() => {
        document
          .getElementById("map-section")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    }
    onFocusHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusEventId]);

  function handleTabChange(nextTab: Tab) {
    onTabChange(nextTab);
    setActiveCategory(null);
    setLayers((current) => ({
      ...current,
      [nextTab === "events" ? "event" : "place"]: true,
    }));
  }

  function handleToggleLayer(kind: "event" | "place" | "friend") {
    setLayers((current) => ({ ...current, [kind]: !current[kind] }));
  }

  function handleResetFilters() {
    setQuery("");
    setActiveCategory(null);
    setDateRange("all");
  }

  function handleSelectPoint(point: MapPoint) {
    setSelected({ kind: point.kind, id: point.entityId });
  }

  function handleShare() {
    if (!selectedItem) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("event");
    url.searchParams.delete("place");
    url.searchParams.set(selectedItem.kind, selectedItem.item.slug);
    const title =
      selectedItem.kind === "event" ? selectedItem.item.title : selectedItem.item.name;
    const share = async () => {
      try {
        if (navigator.share) {
          await navigator.share({ title, url: url.toString() });
        } else {
          await navigator.clipboard.writeText(url.toString());
          setToast("Havola nusxalandi");
        }
      } catch {
        // user cancelled the share sheet
      }
    };
    void share();
  }

  function handleRegistered(value: number) {
    if (!registerEvent) return;
    const id = registerEvent.id;
    setEventList((current) =>
      current.map((event) => (event.id === id ? { ...event, registered: value } : event)),
    );
    setRegisterEvent((current) =>
      current && current.id === id ? { ...current, registered: value } : current,
    );
    setToast("Ro'yxatdan muvaffaqiyatli o'tdingiz!");
  }

  return (
    <main className="min-h-dvh bg-cream pb-[92px] lg:h-dvh lg:overflow-hidden lg:p-3">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1720px] flex-col lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[430px_minmax(0,1fr)] lg:gap-3">
        <aside className="contents lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:rounded-[30px] lg:border lg:border-line/80 lg:bg-paper lg:shadow-soft">
          <HeaderPanel
            query={query}
            onQueryChange={setQuery}
            stats={stats}
            user={user}
            onProfile={onProfile}
            onFriends={onOpenFriends}
          />

          <div id="list-section" className="order-3 flex flex-col lg:min-h-0 lg:flex-1">
            <FiltersPanel
              tab={tab}
              onTabChange={handleTabChange}
              counts={{ events: upcomingEvents.length, places: places.length }}
              categories={activeCategories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />

            <ListPanel
              tab={tab}
              events={filteredEvents}
              places={filteredPlaces}
              selected={selectedItem}
              query={query}
              onSelectEvent={(id) => setSelected({ kind: "event", id })}
              onSelectPlace={(id) => setSelected({ kind: "place", id })}
              onResetFilters={handleResetFilters}
            />

            <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line/70 px-4 py-3 sm:px-6 lg:px-5">
              <p className="text-[10px] font-semibold text-muted">
                © 2026 Navqiron
              </p>
              <p className="flex items-center gap-1 text-[10px] font-medium text-muted">
                <MapPin size={11} className="text-pine-soft" />
                Yunusobod tumani, Toshkent
              </p>
            </footer>
          </div>
        </aside>

        <MapSection
          points={points}
          stops={stops}
          friends={freeFriends}
          friendsEnabled={Boolean(user)}
          selectedKey={selectedKey}
          selected={selectedItem}
          boundary={boundary}
          apiKey={googleApiKey}
          mapId={googleMapId}
          onSelect={handleSelectPoint}
          onSelectFriend={onOpenFriends}
          onCloseDetail={() => setSelected(null)}
          onRegister={() => {
            if (selectedItem?.kind === "event") setRegisterEvent(selectedItem.item);
          }}
          onShare={handleShare}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          counts={{ events: filteredEvents.length, places: filteredPlaces.length }}
          legendCategories={activeCategories}
        />
      </div>

      {registerEvent ? (
        <RegisterDialog
          event={registerEvent}
          user={user}
          onClose={() => setRegisterEvent(null)}
          onSuccess={handleRegistered}
        />
      ) : null}

      {toast ? (
        <div className="animate-pop fixed bottom-24 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#160e28]/95 px-4 py-2.5 text-[11.5px] font-bold text-ink shadow-soft backdrop-blur lg:bottom-6">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-lime text-[#150d24]">
            <Check size={12} strokeWidth={3} />
          </span>
          {toast}
        </div>
      ) : null}
    </main>
  );
}
