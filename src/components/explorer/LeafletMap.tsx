"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletInstance } from "leaflet";
import { markerHtml } from "@/lib/marker";
import { transitPopupHtml, transitStopHtml } from "@/lib/transit-view";
import type { MapComponentProps } from "./map-types";

const TILE_SOURCES = [
  {
    url: "https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    maxZoom: 19,
  },
  {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 19,
  },
  {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19,
  },
];

export default function LeafletMap({
  points,
  stops,
  selectedKey,
  boundary,
  onSelect,
  onMapClick,
  onReady,
  onError,
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletInstance | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const lastMarkerClick = useRef(0);
  const [ready, setReady] = useState(false);

  const callbacks = useRef({ onSelect, onMapClick, onReady, onError });
  callbacks.current = { onSelect, onMapClick, onReady, onError };

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      try {
        const L = await import("leaflet");
        if (cancelled || !containerRef.current) return;

        const center: [number, number] = boundary
          ? [boundary.center[1], boundary.center[0]]
          : [41.356, 69.286];

        const map = L.map(containerRef.current, {
          center,
          zoom: 12,
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: true,
          zoomSnap: 0.25,
          zoomDelta: 0.5,
          minZoom: 10,
          maxZoom: 18,
        });

        let tileIndex = 0;
        let tileErrors = 0;

        const addTiles = () => {
          const source = TILE_SOURCES[tileIndex];
          tileErrors = 0;
          const layer = L.tileLayer(source.url, {
            maxZoom: source.maxZoom,
            subdomains: "subdomains" in source ? source.subdomains : "abc",
          }).addTo(map);
          layer.on("tileerror", () => {
            tileErrors += 1;
            if (tileErrors < 6 || tileIndex >= TILE_SOURCES.length - 1) return;
            map.removeLayer(layer);
            tileIndex += 1;
            addTiles();
          });
        };
        addTiles();

        let latlngs: [number, number][] | null = null;
        if (boundary) {
          latlngs = boundary.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
          const world: [number, number][] = [
            [-85, -180],
            [-85, 180],
            [85, 180],
            [85, -180],
          ];
          L.polygon([world, latlngs], {
            stroke: false,
            fillColor: "#0c352a",
            fillOpacity: 0.12,
            interactive: false,
          }).addTo(map);
          L.polygon(latlngs, {
            color: "#fffdf7",
            weight: 6,
            opacity: 0.7,
            fillColor: "#d8f47b",
            fillOpacity: 0.14,
            interactive: false,
          }).addTo(map);
          L.polygon(latlngs, {
            color: "#0c352a",
            weight: 1.8,
            opacity: 0.55,
            fill: false,
            className: "district-edge",
            interactive: false,
          }).addTo(map);
        }

        layerRef.current = L.layerGroup().addTo(map);
        map.on("click", () => {
          if (Date.now() - lastMarkerClick.current < 350) return;
          callbacks.current.onMapClick();
        });

        const reset = () => {
          if (latlngs) map.fitBounds(latlngs, { padding: [28, 28] });
          else map.setView(center, 12);
        };

        mapRef.current = map;
        leafletRef.current = L;
        callbacks.current.onReady({
          zoomIn: () => map.zoomIn(0.5),
          zoomOut: () => map.zoomOut(0.5),
          reset,
          locate: () => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
              (position) => {
                map.flyTo(
                  [position.coords.latitude, position.coords.longitude],
                  15,
                  { duration: 0.8 },
                );
              },
              () => undefined,
              { enableHighAccuracy: true, timeout: 8000 },
            );
          },
        });

        setReady(true);
        window.setTimeout(() => {
          map.invalidateSize();
          if (latlngs) map.fitBounds(latlngs, { padding: [28, 28] });
        }, 100);

        resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(containerRef.current);
      } catch (error) {
        callbacks.current.onError?.(
          error instanceof Error ? error.message : "Xaritani yuklab bo'lmadi",
        );
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      leafletRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundary]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;

    layer.clearLayers();
    for (const point of points) {
      const icon = L.divIcon({
        className: "youth-marker",
        html: markerHtml(point, selectedKey === point.key),
        iconSize: [46, 46],
        iconAnchor: [23, 38],
      });
      const marker = L.marker([point.lat, point.lng], {
        icon,
        title: point.title,
        riseOnHover: true,
        keyboard: false,
      });
      marker.on("click", (event) => {
        lastMarkerClick.current = Date.now();
        if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
        callbacks.current.onSelect(point);
      });
      marker.addTo(layer);
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
        map.flyTo([point.lat, point.lng + offset], zoom, { duration: 0.65 });
      }
    }
  }, [points, selectedKey, ready]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map || stops.length === 0) return;

    const metroLayer = L.layerGroup().addTo(map);
    const busLayer = L.layerGroup();

    for (const stop of stops) {
      const isMetro = stop.kind === "metro";
      const icon = L.divIcon({
        className: "transit-marker",
        html: transitStopHtml(stop.kind),
        iconSize: isMetro ? [22, 22] : [18, 18],
        iconAnchor: isMetro ? [11, 11] : [9, 9],
      });
      const marker = L.marker([stop.lat, stop.lng], {
        icon,
        title: stop.name,
        zIndexOffset: -1000,
      });
      marker.on("click", (event) => {
        lastMarkerClick.current = Date.now();
        if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
      });
      marker.bindPopup(transitPopupHtml(stop), {
        className: "transit-popup",
        closeButton: false,
        offset: [0, isMetro ? -12 : -10],
        maxWidth: 240,
      });
      marker.addTo(isMetro ? metroLayer : busLayer);
    }

    const syncBusVisibility = () => {
      const visible = (map.getZoom() ?? 12) >= 13.5;
      if (visible && !map.hasLayer(busLayer)) busLayer.addTo(map);
      if (!visible && map.hasLayer(busLayer)) map.removeLayer(busLayer);
    };
    syncBusVisibility();
    map.on("zoomend", syncBusVisibility);

    return () => {
      map.off("zoomend", syncBusVisibility);
      if (!mapRef.current) return;
      metroLayer.clearLayers();
      busLayer.clearLayers();
      if (map.hasLayer(metroLayer)) map.removeLayer(metroLayer);
      if (map.hasLayer(busLayer)) map.removeLayer(busLayer);
    };
  }, [stops, ready]);

  return <div ref={containerRef} className="absolute inset-0 z-0" aria-label="Yunusobod tumani xaritasi" />;
}
