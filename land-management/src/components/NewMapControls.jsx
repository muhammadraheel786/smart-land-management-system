"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Satellite,
  Layers,
  Navigation,
  Search,
  Loader2,
  ZoomIn,
  ZoomOut
} from "lucide-react";

function MapControls({
  map,
  viewMode,
  setViewMode,
  onCenterOnMe,
  onGoToPlace,
  goToQuery,
  setGoToQuery,
  goToLoading,
}) {
  const [zoom, setZoom] = useState(14);

  useEffect(() => {
    if (!map) return;

    setZoom(map.getZoom());

    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoom);

    return () => map.off('zoomend', handleZoom);
  }, [map]);

  const handleZoomIn = useCallback(() => {
    if (map) map.zoomIn();
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) map.zoomOut();
  }, [map]);

  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-4">
      {/* Layer toggle */}
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl p-1.5 shadow-xl">
        <button
          type="button"
          onClick={() => setViewMode?.("satellite")}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl w-14 h-14 text-[10px] font-bold transition-all ${viewMode === "satellite"
            ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg"
            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/80"
            }`}
        >
          <Satellite className="h-5 w-5" />
          <span>Sat</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode?.("street")}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl w-14 h-14 text-[10px] font-bold transition-all ${viewMode === "street"
            ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg"
            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/80"
            }`}
        >
          <Layers className="h-5 w-5" />
          <span>Map</span>
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl p-1.5 shadow-xl">
        <button
          type="button"
          onClick={() => onCenterOnMe?.()}
          className="rounded-xl p-3 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all flex items-center justify-center"
          title="Center on my location"
        >
          <Navigation className="h-5 w-5" />
        </button>
      </div>

      {/* Zoom controls */}
      <div className="flex flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl p-1.5 shadow-xl">
        <button
          type="button"
          onClick={handleZoomIn}
          className="rounded-xl p-3 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all flex items-center justify-center"
          title="Zoom in"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
        <div className="text-center text-[10px] text-[var(--foreground)] font-bold py-1">
          {zoom}z
        </div>
        <button
          type="button"
          onClick={handleZoomOut}
          className="rounded-xl p-3 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/80 transition-all flex items-center justify-center"
          title="Zoom out"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default MapControls;
