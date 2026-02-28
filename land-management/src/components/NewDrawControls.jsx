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

      {/* Floating controls */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl p-5 space-y-4 min-w-[320px] max-w-sm animate-in slide-in-from-top-4">
        <div className="text-center">
          <div className="text-sm font-bold text-[var(--foreground)] mb-2 flex items-center justify-center gap-2">
            <Pencil className="w-4 h-4 text-green-500" />
            Drawing Mode: {shape === "polygon" ? "Polygon" : "Rectangle"}
          </div>
          <div className="text-xs text-[var(--muted)] mb-3 font-semibold">
            {shape === "polygon"
              ? `📍 Points: ${points.length} (min 3 required)`
              : "📍 Click two opposite corners"
            }
          </div>
          {shape === "polygon" && (
            <div className="text-xs text-blue-500 bg-blue-500/10 py-1.5 px-3 rounded-full inline-block mb-1">
              💡 Double-click or click near first point to finish
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center flex-wrap pt-2">
          {shape === "polygon" && (
            <>
              <button
                onClick={undo}
                disabled={points.length === 0}
                className="px-4 py-2.5 text-sm bg-[var(--background)]/50 border border-[var(--border)] rounded-xl hover:bg-[var(--card-hover)] disabled:opacity-50 font-bold transition-all text-[var(--muted)] hover:text-[var(--foreground)] shadow-sm"
              >
                ↩️ Undo
              </button>
              <button
                onClick={finishDrawing}
                disabled={points.length < 3}
                className="px-5 py-2.5 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-bold shadow-md transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Finish ({points.length})
              </button>
            </>
          )}
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500/20 hover:text-red-600 font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>

        <div className="border-t border-[var(--border)] pt-3 mt-4">
          {shape === "polygon" && points.length >= 3 && (
            <div className="text-center">
              <button
                onClick={() => onShapeChange("rectangle")}
                className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                🔄 Switch to Rectangle
              </button>
            </div>
          )}
          {shape === "rectangle" && (
            <div className="text-center">
              <button
                onClick={() => onShapeChange("polygon")}
                className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                🔄 Switch to Polygon
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DrawControls;
