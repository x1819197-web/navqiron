"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import { markerHtml } from "@/lib/marker";
import { transitPopupHtml, transitStopHtml } from "@/lib/transit-view";
import type { MapComponentProps } from "./map-types";

interface GoogleMapProps extends MapComponentProps {
  apiKey: string;
  mapId: string;
}

export default function GoogleMap({
  apiKey,
  mapId,
  points,
  stops,
  selectedKey,
  boundary,
  onSelect,
  onMapClick,
  onReady,
  onError,
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const googleRef = useRef<typeof google | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const transitRef = useRef<{
    markers: google.maps.marker.AdvancedMarkerElement[];
    info: google.maps.InfoWindow | null;
    zoomListener: google.maps.MapsEventListener | null;
  }>({ markers: [], info: null, zoomListener: null });
  const lastMarkerClick = useRef(0);
  const [ready, setReady] = useState(false);

  const callbacks = useRef({ onSelect, onMapClick, onReady, onError });
  callbacks.current = { onSelect, onMapClick, onReady, onError };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const g = await loadGoogleMaps(apiKey);
        if (cancelled || !containerRef.current) return;

        const center = boundary
          ? { lat: boundary.center[1], lng: boundary.center[0] }
          : { lat: 41.356, lng: 69.286 };

        containerRef.current.innerHTML = "";
        const map = new g.maps.Map(containerRef.current, {
          center,
          zoom: 12,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          keyboardShortcuts: false,
          mapId: mapId || "DEMO_MAP_ID",
          backgroundColor: "#ece6d8",
          minZoom: 10,
          maxZoom: 18,
        });

        map.addListener("click", () => {
          if (Date.now() - lastMarkerClick.current < 350) return;
          callbacks.current.onMapClick();
        });

        let bounds: google.maps.LatLngBounds | null = null;
        if (boundary) {
          const path = boundary.coordinates.map(([lng, lat]) => ({ lat, lng }));
          const world = [
            { lat: -85, lng: -180 },
            { lat: -85, lng: 180 },
            { lat: 85, lng: 180 },
            { lat: 85, lng: -180 },
          ];
          new g.maps.Polygon({
            paths: [world, path],
            strokeOpacity: 0,
            fillColor: "#0c352a",
            fillOpacity: 0.12,
            clickable: false,
          }).setMap(map);
          new g.maps.Polygon({
            paths: path,
            strokeColor: "#fffdf7",
            strokeOpacity: 0.7,
            strokeWeight: 6,
            fillColor: "#d8f47b",
            fillOpacity: 0.14,
            clickable: false,
          }).setMap(map);
          new g.maps.Polygon({
            paths: path,
            strokeColor: "#0c352a",
            strokeOpacity: 0.55,
            strokeWeight: 1.8,
            fillOpacity: 0,
            clickable: false,
          }).setMap(map);
          bounds = new g.maps.LatLngBounds();
          for (const position of path) bounds.extend(position);
          map.fitBounds(bounds, 36);
        }

        mapRef.current = map;
        googleRef.current = g;

        callbacks.current.onReady({
          zoomIn: () => map.setZoom((map.getZoom() ?? 12) + 1),
          zoomOut: () => map.setZoom((map.getZoom() ?? 12) - 1),
          reset: () => {
            if (bounds) map.fitBounds(bounds, 36);
            else {
              map.setCenter(center);
              map.setZoom(12);
            }
          },
          locate: () => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
              (position) => {
                map.panTo({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
                map.setZoom(15);
              },
              () => undefined,
              { enableHighAccuracy: true, timeout: 8000 },
            );
          },
        });

        setReady(true);
      } catch (error) {
        callbacks.current.onError?.(
          error instanceof Error ? error.message : "Google Maps yuklanmadi",
        );
      }
    })();

    return () => {
      cancelled = true;
      const transit = transitRef.current;
      transit.markers.forEach((marker) => {
        marker.map = null;
      });
      transit.markers = [];
      transit.info?.close();
      transit.info = null;
      if (transit.zoomListener && window.google?.maps?.event) {
        window.google.maps.event.removeListener(transit.zoomListener);
      }
      transit.zoomListener = null;
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];
      const map = mapRef.current;
      if (map && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(map);
      }
      mapRef.current = null;
      googleRef.current = null;
      setReady(false);
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, mapId, boundary]);

  useEffect(() => {
    const g = googleRef.current;
    const map = mapRef.current;
    if (!ready || !g || !map) return;

    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];

    for (const point of points) {
      const content = document.createElement("div");
      content.className = "gm-marker";
      content.innerHTML = markerHtml(point, selectedKey === point.key);
      content.addEventListener("click", (event) => {
        event.stopPropagation();
        lastMarkerClick.current = Date.now();
        callbacks.current.onSelect(point);
      });
      const marker = new g.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: point.lat, lng: point.lng },
        content,
        title: point.title,
        zIndex: selectedKey === point.key ? 100 : undefined,
      });
      markersRef.current.push(marker);
    }

    if (selectedKey) {
      const point = points.find((item) => item.key === selectedKey);
      if (point) {
        const zoom = Math.max(map.getZoom() ?? 13, 14);
        const isDesktop =
          typeof window !== "undefined" &&
          window.matchMedia("(min-width: 1024px)").matches;
        const degPerPixel = 360 / (256 * Math.pow(2, zoom));
        const offset = isDesktop ? degPerPixel * 175 : 0;
        map.setZoom(zoom);
        map.panTo({ lat: point.lat, lng: point.lng + offset });
      }
    }
  }, [points, selectedKey, ready]);

  useEffect(() => {
    const g = googleRef.current;
    const map = mapRef.current;
    if (!ready || !g || !map) return;

    const transit = transitRef.current;
    transit.markers = [];
    transit.info = new g.maps.InfoWindow();

    const metro: google.maps.marker.AdvancedMarkerElement[] = [];
    const bus: google.maps.marker.AdvancedMarkerElement[] = [];

    for (const stop of stops) {
      const isMetro = stop.kind === "metro";
      const size = isMetro ? 22 : 18;
      const content = document.createElement("div");
      content.className = "transit-marker";
      content.style.width = `${size}px`;
      content.style.height = `${size}px`;
      // AdvancedMarkerElement anchors content at bottom-center; recenter the pin.
      content.style.transform = "translateY(50%)";
      content.innerHTML = transitStopHtml(stop.kind);
      content.addEventListener("click", (event) => {
        event.stopPropagation();
        lastMarkerClick.current = Date.now();
        transit.info?.setContent(transitPopupHtml(stop));
        transit.info?.open({ map, anchor: marker });
      });
      const marker = new g.maps.marker.AdvancedMarkerElement({
        position: { lat: stop.lat, lng: stop.lng },
        content,
        title: stop.name,
        zIndex: 20,
      });
      (isMetro ? metro : bus).push(marker);
    }

    for (const marker of metro) marker.map = map;
    transit.markers = [...metro, ...bus];

    const syncBusVisibility = () => {
      const visible = (map.getZoom() ?? 12) >= 13.5;
      for (const marker of bus) marker.map = visible ? map : null;
    };
    transit.zoomListener = map.addListener("zoom_changed", syncBusVisibility);
    syncBusVisibility();

    return () => {
      transit.info?.close();
      transit.info = null;
      if (transit.zoomListener) g.maps.event.removeListener(transit.zoomListener);
      transit.zoomListener = null;
      for (const marker of transit.markers) marker.map = null;
      transit.markers = [];
    };
  }, [stops, ready]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      aria-label="Yunusobod tumani xaritasi"
    />
  );
}
