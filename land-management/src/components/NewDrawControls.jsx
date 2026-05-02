"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Polygon, Polyline, Circle, useMapEvents } from "react-leaflet";
import { Pencil, Square, X, Check } from "lucide-react";

const CLOSE_PIXEL_THRESHOLD = 25;
const DBLCLICK_MS = 350;

function DrawControls({
  isActive,
  shape,
  onFinish,
  onCancel,
  onShapeChange,
  drawState,
}) {
  const points = drawState.points || [];
  const [currentPos, setCurrentPos] = useState(null);

  useMapEvents({
    click(e) {
      if (!isActive) return;

      const now = Date.now();
      const { lat, lng } = e.latlng;

      if (now - drawState.lastClickTimeRef.current < DBLCLICK_MS && points.length >= 3) {
        onFinish(points);
        return;
      }

      drawState.lastClickTimeRef.current = now;

      if (points.length >= 3) {
        const map = e.target;
        const containerPoint = map.latLngToContainerPoint(e.latlng);
        const firstPoint = map.latLngToContainerPoint([points[0].lat, points[0].lng]);
        const distance = Math.sqrt(
          Math.pow(containerPoint.x - firstPoint.x, 2) +
          Math.pow(containerPoint.y - firstPoint.y, 2)
        );

        if (distance <= CLOSE_PIXEL_THRESHOLD) {
          onFinish(points);
          return;
        }
      }

      if (shape === "rectangle" && points.length >= 2) {
        const [a, b] = [points[0], { lat, lng }];
        const rect = [
          { lat: Math.min(a.lat, b.lat), lng: Math.min(a.lng, b.lng) },
          { lat: Math.min(a.lat, b.lat), lng: Math.max(a.lng, b.lng) },
          { lat: Math.max(a.lat, b.lat), lng: Math.max(a.lng, b.lng) },
          { lat: Math.max(a.lat, b.lat), lng: Math.min(a.lng, b.lng) },
        ];
        onFinish(rect);
        return;
      }

      drawState.addPoint(lat, lng);
    },

    mousemove(e) {
      if (!isActive) return;
      setCurrentPos(e.latlng);
    },

    touchstart(e) {
      if (!isActive) return;
      if (e?.latlng) {
        const { lat, lng } = e.latlng;
        drawState.addPoint(lat, lng);
      }
    },

    contextmenu(e) {
      if (!isActive) return;
      e.originalEvent.preventDefault();
      drawState.cancelDrawing();
    },

    dblclick(e) {
      if (!isActive) return;
      e.originalEvent.preventDefault();
      e.originalEvent.stopPropagation();
    },
  });

  const finishDrawing = useCallback(() => {
    if (points.length >= 3) {
      onFinish(points);
    }
  }, [points, onFinish]);

  const undo = useCallback(() => {
    drawState.undoPoint();
  }, [drawState]);

  if (!isActive) return null;

  const previewLine = currentPos && points.length > 0 ? (
    <Polyline
      positions={[points[points.length - 1], currentPos]}
      pathOptions={{ color: "#22c55e", weight: 2, dashArray: "4 4" }}
    />
  ) : null;

  const closingLine = currentPos && points.length >= 2 ? (
    <Polyline
      positions={[currentPos, points[0]]}
      pathOptions={{ color: "#f59e0b", weight: 2, dashArray: "4 4" }}
    />
  ) : null;

  return (
    <>
      {points.map((pt, i) => (
        <Circle
          key={i}
          center={pt}
          radius={8}
          pathOptions={{
            fillColor: i === points.length - 1 ? "#ef4444" : "#22c55e",
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9,
          }}
        />
      ))}
      {previewLine}
      {closingLine}
      {points.length >= 3 && (
        <Polygon
          positions={points}
          pathOptions={{
            color: "#22c55e",
            fillColor: "#22c55e",
            fillOpacity: 0.2,
            weight: 2,
          }}
        />
      )}

      {/* Minimal controls: keep map fully visible */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[2000]">
        <div className="px-3 py-1.5 rounded-full bg-[var(--card)]/85 backdrop-blur border border-[var(--border)] text-[11px] font-bold text-[var(--foreground)] shadow-lg">
          {shape === "polygon" ? "Polygon" : "Rectangle"} • {points.length} pts
        </div>
      </div>

      <div className="absolute bottom-4 right-3 z-[2000] flex flex-col gap-2">
        {shape === "polygon" && (
          <>
            <button
              onClick={undo}
              disabled={points.length === 0}
              className="w-11 h-11 rounded-full bg-[var(--card)]/90 backdrop-blur border border-[var(--border)] text-[var(--foreground)] disabled:opacity-40 shadow-lg flex items-center justify-center"
              title="Undo"
            >
              ↩
            </button>
            <button
              onClick={finishDrawing}
              disabled={points.length < 3}
              className="w-11 h-11 rounded-full bg-green-500/90 border border-green-400/30 text-white disabled:opacity-40 shadow-lg flex items-center justify-center"
              title="Finish"
            >
              <Check className="w-5 h-5" />
            </button>
          </>
        )}

        <button
          onClick={onCancel}
          className="w-11 h-11 rounded-full bg-red-500/90 border border-red-400/30 text-white shadow-lg flex items-center justify-center"
          title="Cancel drawing"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

export default DrawControls;
