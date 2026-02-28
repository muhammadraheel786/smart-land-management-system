"use client";

import { useState, useCallback } from "react";
import { Polygon, useMapEvents, Circle, Polyline } from "react-leaflet";
import { DRAW_PREVIEW, HOVER_STYLE } from "@/lib/map-styles";
import { MapPin, MousePointer, Square, RotateCw } from "lucide-react";

interface DrawingToolsProps {
  mode: "draw" | "area" | null;
  onFinish: (coords: { lat: number; lng: number }[]) => void;
  onCancel: () => void;
  areaCenter?: { lat: number; lng: number } | null;
  landAreaAcres?: string;
  onAreaClick?: (e: { latlng: { lat: number; lng: number } }) => void;
}

interface PointMarkerProps {
  position: { lat: number; lng: number };
  index: number;
  isLast: boolean;
}

function PointMarker({ position, index, isLast }: PointMarkerProps) {
  return (
    <>
      <Circle
        center={position}
        radius={8}
        pathOptions={{
          fillColor: isLast ? "#FF6347" : "#00FF00",
          color: "#FFFFFF",
          weight: 2,
          fillOpacity: 0.8,
        }}
      />
      {index > 0 && (
        <Circle
          center={position}
          radius={3}
          pathOptions={{
            fillColor: "#FFFFFF",
            color: "#FFFFFF",
            weight: 1,
            fillOpacity: 1,
          }}
        />
      )}
    </>
  );
}

function DrawingGuide({ points }: { points: { lat: number; lng: number }[] }) {
  if (points.length < 2) return null;

  const guideLines = [];
  for (let i = 0; i < points.length - 1; i++) {
    guideLines.push(
      <Polyline
        key={`guide-${i}`}
        positions={[points[i], points[i + 1]]}
        pathOptions={{
          color: "#00FF00",
          weight: 2,
          dashArray: "5, 5",
          opacity: 0.8,
        }}
      />
    );
  }

  // Close the polygon if we have 3+ points
  if (points.length >= 3) {
    guideLines.push(
      <Polyline
        key="guide-close"
        positions={[points[points.length - 1], points[0]]}
        pathOptions={{
          color: "#FF6347",
          weight: 2,
          dashArray: "5, 5",
          opacity: 0.8,
        }}
      />
    );
  }

  return <>{guideLines}</>;
}

function MapDrawer({ 
  onFinish, 
  onCancel,
  showHelp = true 
}: { 
  onFinish: (coords: { lat: number; lng: number }[]) => void;
  onCancel: () => void;
  showHelp?: boolean;
}) {
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPoints((p) => {
        const next = [...p, { lat, lng }];
        if (next.length >= 3) {
          onFinish(next);
        }
        return next;
      });
    },
    mousemove(e) {
      setCurrentPos(e.latlng);
    },
    contextmenu(e) {
      e.originalEvent.preventDefault();
      if (points.length > 0) {
        setPoints([]);
      }
    },
  });

  const handleUndo = useCallback(() => {
    setPoints(p => p.slice(0, -1));
  }, []);

  const handleFinish = useCallback(() => {
    if (points.length >= 3) {
      onFinish(points);
    }
  }, [points, onFinish]);

  // Preview line from last point to current mouse position
  const previewLine = currentPos && points.length > 0 ? (
    <Polyline
      positions={[points[points.length - 1], currentPos]}
      pathOptions={{
        color: "#FFD700",
        weight: 2,
        dashArray: "3, 3",
        opacity: 0.7,
      }}
    />
  ) : null;

  // Closing line preview
  const closingLine = currentPos && points.length >= 2 ? (
    <Polyline
      positions={[currentPos, points[0]]}
      pathOptions={{
        color: "#FF6347",
        weight: 2,
        dashArray: "3, 3",
        opacity: 0.7,
      }}
    />
  ) : null;

  return (
    <>
      {/* Drawing guides and preview */}
      <DrawingGuide points={points} />
      {previewLine}
      {closingLine}
      
      {/* Point markers */}
      {points.map((point, index) => (
        <PointMarker
          key={index}
          position={point}
          index={index}
          isLast={index === points.length - 1}
        />
      ))}

      {/* Preview polygon */}
      {points.length >= 3 && (
        <Polygon
          positions={points}
          pathOptions={{
            ...DRAW_PREVIEW,
            fillOpacity: 0.2,
          }}
        />
      )}

      {/* Drawing controls */}
      {points.length > 0 && (
        <div className="leaflet-top leaflet-right" style={{ marginTop: '80px' }}>
          <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">
            <button
              onClick={handleUndo}
              disabled={points.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              Undo
            </button>
            {points.length >= 3 && (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
              >
                <Square className="w-4 h-4" />
                Finish
              </button>
            )}
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Help text */}
      {showHelp && points.length === 0 && (
        <div className="leaflet-bottom leaflet-left">
          <div className="bg-white/95 rounded-lg shadow-lg p-3 m-3 max-w-xs">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              Drawing Mode
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Click to add points (min 3)</li>
              <li>• Right-click to clear all points</li>
              <li>• Green line shows next edge</li>
              <li>• Red line shows closing edge</li>
              <li>• Auto-finishes after 3+ points</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function AreaMarker({ 
  center, 
  acres, 
  onConfirm, 
  onCancel 
}: { 
  center: { lat: number; lng: number }; 
  acres: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const coords = getRectFromCenterAndArea(center.lat, center.lng, acres);
  
  return (
    <>
      <Polygon
        positions={coords.map((c) => [c.lat, c.lng] as [number, number])}
        pathOptions={{
          ...DRAW_PREVIEW,
          fillOpacity: 0.25,
          weight: 3,
        }}
      />
      
      {/* Center marker */}
      <Circle
        center={center}
        radius={10}
        pathOptions={{
          fillColor: "#FF6347",
          color: "#FFFFFF",
          weight: 3,
          fillOpacity: 0.8,
        }}
      />

      {/* Controls */}
      <div className="leaflet-top leaflet-right" style={{ marginTop: '80px' }}>
        <div className="bg-white rounded-lg shadow-lg p-2 space-y-2">
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            <Square className="w-4 h-4" />
            Place Field
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="leaflet-bottom leaflet-left">
        <div className="bg-white/95 rounded-lg shadow-lg p-3 m-3 max-w-xs">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Area Placement
          </h4>
          <p className="text-xs text-gray-600">
            Field: {acres.toFixed(1)} acres<br/>
            Click "Place Field" to confirm or move the marker to reposition
          </p>
        </div>
      </div>
    </>
  );
}

// Helper function to create rectangle from center and area
function getRectFromCenterAndArea(lat: number, lng: number, acres: number) {
  // Convert acres to approximate dimensions (rough approximation)
  // 1 acre ≈ 208.71 feet × 208.71 feet
  // 1 degree latitude ≈ 69 miles
  // 1 degree longitude ≈ 69 miles * cos(latitude)
  const feetPerDegreeLat = 69 * 5280;
  const feetPerDegreeLng = feetPerDegreeLat * Math.cos(lat * Math.PI / 180);
  
  const sideFeet = Math.sqrt(acres * 43560); // Square feet for the area
  const halfSideLat = sideFeet / 2 / feetPerDegreeLat;
  const halfSideLng = sideFeet / 2 / feetPerDegreeLng;
  
  return [
    { lat: lat - halfSideLat, lng: lng - halfSideLng },
    { lat: lat - halfSideLat, lng: lng + halfSideLng },
    { lat: lat + halfSideLat, lng: lng + halfSideLng },
    { lat: lat + halfSideLat, lng: lng - halfSideLng },
  ];
}

export default function DrawingTools({ 
  mode, 
  onFinish, 
  onCancel, 
  areaCenter, 
  landAreaAcres, 
  onAreaClick 
}: DrawingToolsProps) {
  if (mode === "draw") {
    return (
      <MapDrawer 
        onFinish={onFinish} 
        onCancel={onCancel}
        showHelp={true}
      />
    );
  }

  if (mode === "area" && areaCenter && landAreaAcres) {
    const acres = parseFloat(landAreaAcres);
    if (acres > 0) {
      return (
        <AreaMarker
          center={areaCenter}
          acres={acres}
          onConfirm={() => onFinish(getRectFromCenterAndArea(areaCenter.lat, areaCenter.lng, acres))}
          onCancel={onCancel}
        />
      );
    }
  }

  return null;
}
