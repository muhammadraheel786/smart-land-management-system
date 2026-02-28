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
  drawState, // Add drawState prop
}) {
  // Use shared state from drawState instead of local state
  const points = drawState.points || [];
  const [currentPos, setCurrentPos] = useState(null);

  useMapEvents({
    click(e) {
      if (!isActive) return;
      
      const now = Date.now();
      const { lat, lng } = e.latlng;
      
      // Check for double click to finish
      if (now - drawState.lastClickTimeRef.current < DBLCLICK_MS && points.length >= 3) {
        onFinish(points);
        return;
      }
      
      drawState.lastClickTimeRef.current = now;
      
      // Check if clicking near first point to close polygon
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
      
      // Handle rectangle mode
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
      
      // Add new point using drawState method
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
      // Prevent map zoom on double click when drawing
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

  const clear = useCallback(() => {
    drawState.cancelDrawing();
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
      
      {/* Floating controls - positioned at left side to avoid conflicts with drawing points and map controls */}
      <div className="absolute top-20 left-4 z-[2000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 space-y-3 border-2 border-green-500 min-w-[280px] max-w-sm">
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            🎨 Drawing Mode: {shape === "polygon" ? "Polygon" : "Rectangle"}
          </div>
          <div className="text-xs text-gray-600 mb-3">
            {shape === "polygon" 
              ? `📍 Points: ${points.length} (min 3 required)`
              : "📍 Click two opposite corners"
            }
          </div>
          {shape === "polygon" && (
            <div className="text-xs text-blue-600 mb-2">
              💡 Double-click or click near first point to finish
            </div>
          )}
        </div>
        
        <div className="flex gap-2 justify-center flex-wrap">
          {shape === "polygon" && (
            <>
              <button
                onClick={undo}
                disabled={points.length === 0}
                className="px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 font-medium transition-colors"
              >
                ↩️ Undo
              </button>
              <button
                onClick={finishDrawing}
                disabled={points.length < 3}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 font-medium shadow-lg transition-colors"
              >
                ✅ Finish ({points.length})
              </button>
            </>
          )}
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 font-medium transition-colors"
          >
            ❌ Cancel
          </button>
        </div>
        
        <div className="border-t pt-2">
          {shape === "polygon" && points.length >= 3 && (
            <div className="text-center">
              <button
                onClick={() => onShapeChange("rectangle")}
                className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                🔄 Switch to Rectangle
              </button>
            </div>
          )}
          {shape === "rectangle" && (
            <div className="text-center">
              <button
                onClick={() => onShapeChange("polygon")}
                className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
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
