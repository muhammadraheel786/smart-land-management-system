"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Popup, Circle, useMap } from "react-leaflet";
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

function MapInstanceHandler({ setMapInstance }) {
  const map = useMap();
  useEffect(() => {
    if (map && setMapInstance) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);
  return null;
}

export default function MapComponent({
  mapInstance,
  setMapInstance,
  center = [31.52, 74.35],
  zoom = 14,
  viewMode = "satellite",
  fields = [],
  selectedField,
  preview,
  onFieldClick,
  sidebarCollapsed,
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
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={3}
        maxZoom={22}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: "#0d1117" }}
      >
        <MapInstanceHandler setMapInstance={setMapInstance} />

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
              <Popup maxWidth={350} minWidth={300}>
                <div className="p-4 max-h-[500px] overflow-y-auto no-scrollbar font-sans">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-md bg-gradient-to-br from-green-500 to-emerald-600">
                      <span className="text-xl font-bold">L</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-lg truncate mb-0.5">{field.name}</h4>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.color }}></span>
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{field.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  {field.address && (
                    <div className="mb-4 p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5">
                      <div className="p-1.5 bg-blue-500 rounded-md shadow-sm">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <p className="text-[11px] text-blue-900 leading-tight font-medium">{field.address}</p>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                      <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Total Area</div>
                      <div className="text-sm font-black text-slate-800">{field.area?.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">Acres</span></div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                      <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1">Points</div>
                      <div className="text-sm font-black text-slate-800">{field.coordinates?.length || 0} <span className="text-[10px] font-normal text-slate-500">Nodes</span></div>
                    </div>
                  </div>

                  {/* Operational Details - Simple placeholder for financials since context is local */}
                  <div className="mt-4 p-3 bg-gray-900 rounded-xl shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Field Intelligence</span>
                      <div className="px-2 py-0.5 bg-green-500/10 rounded-full border border-green-500/20">
                        <span className="text-[8px] font-black text-green-500 uppercase">System Ready</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-300 italic mb-2">
                      Detailed analytics, financials, and water reports are available in the dashboard and records section.
                    </p>
                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[75%] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="mt-4 text-center">
                    <p className="text-[10px] font-bold text-blue-500 uppercase hover:underline cursor-pointer tracking-widest animate-pulse">
                      Click Field for interactive controls
                    </p>
                  </div>
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
