"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { LocateFixed, MapPin, Minus, Plus, RotateCcw } from "lucide-react";
import type { MapApi, MapComponentProps } from "./map-types";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <MapLoading />,
});

const GoogleMap = dynamic(() => import("./GoogleMap"), {
  ssr: false,
  loading: () => <MapLoading />,
});

interface MapCanvasProps extends MapComponentProps {
  apiKey: string;
  mapId: string;
}

const controlClass =
  "grid h-9 w-9 place-items-center text-ink/75 transition hover:bg-white/10 hover:text-ink";

export function MapCanvas({ apiKey, mapId, ...rest }: MapCanvasProps) {
  const [googleFailed, setGoogleFailed] = useState(false);
  const apiRef = useRef<MapApi | null>(null);
  const handleReady = useCallback((api: MapApi) => {
    apiRef.current = api;
  }, []);
  const useGoogle = Boolean(apiKey) && !googleFailed;

  return (
    <div className="relative h-full w-full">
      {useGoogle ? (
        <GoogleMap
          {...rest}
          apiKey={apiKey}
          mapId={mapId}
          onReady={handleReady}
          onError={() => setGoogleFailed(true)}
        />
      ) : (
        <LeafletMap {...rest} onReady={handleReady} />
      )}

      <div className="absolute bottom-14 right-3 z-20 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f0919]/90 shadow-card backdrop-blur">
        <button
          type="button"
          onClick={() => apiRef.current?.zoomIn()}
          className={controlClass}
          aria-label="Yaqinlashtirish"
          title="Yaqinlashtirish"
        >
          <Plus size={16} />
        </button>
        <span className="mx-auto h-px w-5 bg-line" />
        <button
          type="button"
          onClick={() => apiRef.current?.zoomOut()}
          className={controlClass}
          aria-label="Uzoqlashtirish"
          title="Uzoqlashtirish"
        >
          <Minus size={16} />
        </button>
        <span className="mx-auto h-px w-5 bg-line" />
        <button
          type="button"
          onClick={() => apiRef.current?.locate()}
          className={controlClass}
          aria-label="Mening joylashuvim"
          title="Mening joylashuvim"
        >
          <LocateFixed size={15} />
        </button>
        <span className="mx-auto h-px w-5 bg-line" />
        <button
          type="button"
          onClick={() => apiRef.current?.reset()}
          className={controlClass}
          aria-label="Tuman markaziga qaytish"
          title="Tuman markaziga qaytish"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {googleFailed ? (
        <div className="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-[#0f0919]/95 px-3 py-1.5 text-[10px] font-bold text-ink-soft shadow-card">
          Google Maps yuklanmadi — OpenStreetMap ko&apos;rsatilmoqda
        </div>
      ) : null}
    </div>
  );
}

function MapLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-cream-deep">
      <div className="dot-grid absolute inset-0 opacity-40" />
      <div className="relative flex flex-col items-center gap-2 text-muted">
        <span className="grid h-10 w-10 animate-pulse place-items-center rounded-full bg-violet-500/20 text-violet-200 shadow-card">
          <MapPin size={18} />
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-[0.2em]">
          Xarita yuklanmoqda
        </span>
      </div>
    </div>
  );
}
