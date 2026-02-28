"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAPBOX_TOKEN, getMapboxTileUrl } from "@/lib/mapbox";
import { getArea } from "@/lib/field-utils";

const SATELLITE_URL = MAPBOX_TOKEN 
  ? getMapboxTileUrl("satellite") 
  : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET_URL = MAPBOX_TOKEN 
  ? getMapboxTileUrl("streets") 
  : "https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png";

const MAP_LAYERS = [
  { 
    id: "satellite", 
    url: SATELLITE_URL, 
    name: "Satellite", 
    attribution: MAPBOX_TOKEN ? "&copy; Mapbox &copy; OpenStreetMap" : "&copy; Esri",
    maxZoom: 22,
    maxNativeZoom: MAPBOX_TOKEN ? 22 : 19,
    tileSize: MAPBOX_TOKEN ? 512 : 256,
    zoomOffset: MAPBOX_TOKEN ? -1 : 0,
  },
  {
    id: "street",
    url: STREET_URL,
    name: "Street",
    attribution: MAPBOX_TOKEN ? "&copy; Mapbox &copy; OpenStreetMap" : "&copy; OpenStreetMap",
    maxZoom: 22,
    maxNativeZoom: MAPBOX_TOKEN ? 22 : 19,
    tileSize: MAPBOX_TOKEN ? 512 : 256,
    zoomOffset: MAPBOX_TOKEN ? -1 : 0,
  },
];

// Fallback tile layer if Mapbox token is missing
const FALLBACK_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

function MapCenterer({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

function FitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length < 2) return;
    const bounds = L.latLngBounds(coords.map((c) => [c.lat, c.lng]));
    map.fitBounds(bounds.pad(0.15));
  }, [map, coords]);
  return null;
}

export default function MapComponent({
  center = [31.52, 74.35],
  zoom = 14,
  viewMode = "satellite",
  fields = [],
  selectedField,
  preview,
  onFieldClick,
  children,
}) {
  const activeLayer = useMemo(
    () => MAP_LAYERS.find((l) => l.id === viewMode) ?? MAP_LAYERS[0],
    [viewMode]
  );

  const statusColors = {
    cultivated: { color: "#22c55e", fillColor: "#22c55e" },
    available: { color: "#f59e0b", fillColor: "#f59e0b" },
    uncultivated: { color: "#94a3b8", fillColor: "#94a3b8" },
    not_usable: { color: "#ef4444", fillColor: "#ef4444" },
    thaka: { color: "#a855f7", fillColor: "#a855f7" },
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={3}
        maxZoom={22}
        zoomControl={false}
        className="h-full w-full"
        style={{ background: "#0d1117" }}
      >
        {preview && <MapCenterer center={preview.center} zoom={16} />}
        {preview && preview.coordinates.length >= 2 && <FitBounds coords={preview.coordinates} />}
        
        <TileLayer
          attribution={activeLayer.attribution}
          url={activeLayer.url || FALLBACK_URL}
          maxZoom={activeLayer.maxZoom}
          maxNativeZoom={activeLayer.maxNativeZoom}
          tileSize={activeLayer.tileSize}
          zoomOffset={activeLayer.zoomOffset}
          errorTileUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {fields?.filter(field => field?.coordinates?.length > 0).map((field, index) => {
          const colors = statusColors[field.status] || statusColors.cultivated;
          const isSelected = selectedField?.id === field.id;
          
          return (
            <Polygon
              key={field.id ? `${field.id}-${index}` : `f-${index}`}
              positions={field.coordinates.map((c) => [c.lat, c.lng]).filter(coord => coord && coord.length === 2)}
              pathOptions={{
                color: colors.color,
                fillColor: colors.fillColor,
                fillOpacity: isSelected ? 0.45 : 0.3,
                weight: isSelected ? 4 : 3,
                opacity: 0.9,
              }}
              eventHandlers={{
                click: () => onFieldClick?.(field),
              }}
            >
              <Popup>
                <div className="p-2 text-center text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">{field.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Click to view details</p>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {preview && preview.coordinates.length >= 3 && (
          <Polygon
            positions={preview.coordinates.map((c) => [c.lat, c.lng])}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.4,
              weight: 4,
              dashArray: "10 5",
              opacity: 1,
            }}
          >
            <Popup>
              <div className="p-3">
                <p className="text-sm font-bold text-blue-600 mb-2">📍 Preview Field</p>
                <p className="text-sm text-gray-700">
                  Area: <span className="font-medium">{preview.area.toFixed(2)} acres</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Click "Save Field" to add this field.
                </p>
              </div>
            </Popup>
          </Polygon>
        )}

        {preview && preview.coordinates.length === 0 && preview.center && (
          <Circle
            center={preview.center}
            radius={250}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.35,
              weight: 2,
            }}
          >
            <Popup>
              <p className="text-sm">
                Your location preview. Draw boundary to mark the exact field.
              </p>
            </Popup>
          </Circle>
        )}

        {children}
      </MapContainer>
    </div>
  );
}
