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

      {/* Controls moved to sidebar draw menu */}
    </>
  );
}

export default DrawControls;
