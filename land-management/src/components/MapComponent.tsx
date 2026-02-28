"use client";

import { useCallback, useState } from "react";
import { MapContainer, TileLayer, Polygon, useMapEvents, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLandStore } from "@/lib/store";
import type { GeoFence, LandStatus } from "@/types";
import {
  statusColors,
  statusBorderColors,
  BORDER_COLOR,
  BORDER_WEIGHT,
  FILL_OPACITY,
  DASHED_BORDER,
  HOVER_STYLE,
  SELECTED_STYLE,
  DRAW_PREVIEW,
} from "@/lib/map-styles";
import { getArea, rectFromCenterAndArea } from "@/lib/field-utils";
import { useLocale } from "@/contexts/LocaleContext";
import LandPopup from "./LandPopup";
import DrawingTools from "./DrawingTools";
import AutoDetection from "./AutoDetection";
import FieldSidePanel from "./FieldSidePanel";
import { LandStatusLegend } from "./LandStatusIndicator";
import { 
  MapPin, 
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Square,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Radar,
  Sparkles
} from "lucide-react";
import { MAPBOX_TOKEN, getMapboxTileUrl } from "@/lib/mapbox";

const statusLabels: Record<LandStatus, string> = {
  cultivated: "Cultivated",
  available: "Available",
  uncultivated: "Uncultivated",
  not_usable: "Not Usable",
  thaka: "Thaka (Leased)",
};

const mapLayers = [
  {
    id: "satellite",
    name: "Satellite",
    url: MAPBOX_TOKEN ? getMapboxTileUrl("satellite") : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: MAPBOX_TOKEN ? "&copy; Mapbox &copy; OpenStreetMap" : "&copy; Esri",
  },
  {
    id: "hybrid",
    name: "Hybrid",
    url: MAPBOX_TOKEN ? getMapboxTileUrl("satellite-streets") : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: MAPBOX_TOKEN ? "&copy; Mapbox &copy; OpenStreetMap" : "&copy; Esri",
  },
  {
    id: "street",
    name: "Street",
    url: MAPBOX_TOKEN ? getMapboxTileUrl("streets") : "https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png",
    attribution: MAPBOX_TOKEN ? "&copy; Mapbox &copy; OpenStreetMap" : "&copy; OSM",
  },
  {
    id: "terrain",
    name: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{y}/{x}.png",
    attribution: "&copy; OpenTopoMap",
  },
];

function MapDrawer({ onFinish }: { onFinish: (coords: { lat: number; lng: number }[]) => void }) {
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPoints((p) => {
        const next = [...p, { lat, lng }];
        if (next.length >= 3) onFinish(next);
        return next;
      });
    },
  });

  return points.length >= 3 ? (
    <Polygon
      positions={points}
      pathOptions={{
        ...DRAW_PREVIEW,
        color: BORDER_COLOR,
        lineJoin: "round",
        lineCap: "round",
      }}
    />
  ) : null;
}

function AreaMarker({ center, acres }: { center: { lat: number; lng: number }; acres: number }) {
  const coords = rectFromCenterAndArea(center.lat, center.lng, acres);
  return (
    <Polygon
      positions={coords.map((c) => [c.lat, c.lng] as [number, number])}
      pathOptions={{
        ...DRAW_PREVIEW,
        color: BORDER_COLOR,
        lineJoin: "round",
        lineCap: "round",
        dashArray: "4, 4",
      }}
    />
  );
}

export default function MapComponent() {
  const { t } = useLocale();
  const { fields, addField, updateField, deleteField } = useLandStore();
  const [mode, setMode] = useState<"draw" | "area" | "auto" | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [landAreaAcres, setLandAreaAcres] = useState("");
  const [newStatus, setNewStatus] = useState<LandStatus>("cultivated");
  const [areaCenter, setAreaCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [currentLayer, setCurrentLayer] = useState('satellite');
  const [showLegend, setShowLegend] = useState(true);
  const [editingField, setEditingField] = useState<GeoFence | null>(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedFieldDetails, setSelectedFieldDetails] = useState<GeoFence | null>(null);

  const handleDrawFinish = useCallback(
    async (coords: { lat: number; lng: number }[]) => {
      const name = newFieldName || `Field ${fields.length + 1}`;
      const area = landAreaAcres ? parseFloat(landAreaAcres) : getArea(coords);
      const ok = await addField({
        name,
        coordinates: coords,
        area: area || getArea(coords),
        status: newStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (ok) {
        setMode(null);
        setNewFieldName("");
        setLandAreaAcres("");
      }
    },
    [addField, fields.length, newFieldName, newStatus, landAreaAcres]
  );

  const handleEditField = useCallback(async (field: GeoFence) => {
    setEditingField(field);
    setNewFieldName(field.name);
    setNewStatus(field.status);
    setMode(null);
  }, []);

  const handleDeleteField = useCallback(async (fieldId: string) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      await deleteField(fieldId);
      setSelectedField(null);
    }
  }, [deleteField]);

  const handleUpdateField = useCallback(async () => {
    if (!editingField) return;
    
    await updateField(editingField.id, {
      name: newFieldName || editingField.name,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    
    setEditingField(null);
    setNewFieldName("");
    setNewStatus("cultivated");
  }, [editingField, newFieldName, newStatus, updateField]);

  const handleAreaClick = useCallback(
    (e: { latlng: { lat: number; lng: number } }) => {
      if (mode !== "area" || !landAreaAcres) return;
      const acres = parseFloat(landAreaAcres);
      if (acres <= 0) return;
      setAreaCenter(e.latlng);
    },
    [mode, landAreaAcres]
  );

  const handleAreaConfirm = useCallback(async () => {
    if (!areaCenter || !landAreaAcres) return;
    const acres = parseFloat(landAreaAcres);
    if (acres <= 0) return;
    const coords = rectFromCenterAndArea(areaCenter.lat, areaCenter.lng, acres);
    const name = newFieldName || `Field ${fields.length + 1}`;
    const ok = await addField({
      name,
      coordinates: coords,
      area: acres,
      status: newStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (ok) {
      setMode(null);
      setNewFieldName("");
      setLandAreaAcres("");
      setAreaCenter(null);
    }
  }, [areaCenter, landAreaAcres, newFieldName, newStatus, fields.length, addField]);

  const defaultCenter: [number, number] = [31.5204, 74.3587];

  const selectedLayer = mapLayers.find(layer => layer.id === currentLayer) || mapLayers[0];

  return (
    <div className="relative w-full h-full bg-gray-900">
      <MapContainer
        center={defaultCenter}
        zoom={mapZoom}
        className="w-full h-full"
        style={{ background: "#0d1117" }}
      >
        <TileLayer
          attribution={selectedLayer.attribution}
          url={selectedLayer.url}
        />
        
        {currentLayer === 'hybrid' && (
          <TileLayer 
            attribution='&copy; OSM' 
            url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png" 
            opacity={0.35} 
          />
        )}

        {fields.map((f) => {
          const isUnfenced = f.status === "available" || f.status === "uncultivated";
          const isSelected = selectedField === f.id;
          const isHovered = hoveredField === f.id;
          
          return (
            <Polygon
              key={f.id}
              positions={f.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
              pathOptions={{
                color: isSelected ? SELECTED_STYLE.color : (isHovered ? HOVER_STYLE.color : statusBorderColors[f.status] || BORDER_COLOR),
                fillColor: statusColors[f.status],
                fillOpacity: isSelected ? SELECTED_STYLE.fillOpacity : (isHovered ? HOVER_STYLE.fillOpacity : FILL_OPACITY),
                weight: isSelected ? SELECTED_STYLE.weight : (isHovered ? HOVER_STYLE.weight : BORDER_WEIGHT),
                lineJoin: "round",
                lineCap: "round",
                dashArray: isSelected ? SELECTED_STYLE.dashArray : (isUnfenced ? DASHED_BORDER : undefined),
              }}
              eventHandlers={{
                click: () => {
                  setSelectedFieldDetails(f);
                },
                mouseover: () => setHoveredField(f.id),
                mouseout: () => setHoveredField(null),
              }}
            >
              <Popup>
                <LandPopup 
                  field={f} 
                  onEdit={handleEditField}
                  onDelete={handleDeleteField}
                />
              </Popup>
            </Polygon>
          );
        })}

        <DrawingTools
          mode={mode === "draw" || mode === "area" ? mode : null}
          onFinish={handleDrawFinish}
          onCancel={() => {
            setMode(null);
            setAreaCenter(null);
          }}
          areaCenter={areaCenter}
          landAreaAcres={landAreaAcres}
          onAreaClick={handleAreaClick}
        />
        
        {mode === "auto" && (
          <AutoDetection
            onDetectionComplete={(parcels) => {
              setMode(null);
            }}
            onCancel={() => setMode(null)}
          />
        )}
      </MapContainer>

      {/* Enhanced Top Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-3">
        {/* Auto Detection Button - Prominent */}
        <button
          onClick={() => setMode(mode === "auto" ? null : "auto")}
          className={`px-6 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg ${
            mode === "auto" 
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse" 
              : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
          }`}
        >
          <Radar className="w-5 h-5 inline mr-2" />
          Auto Detect Land
        </button>

        {/* Manual Drawing Tools - Smaller */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode(mode === "draw" ? null : "draw")}
            className={`px-3 py-2 rounded-lg font-medium transition-all transform hover:scale-105 text-sm ${
              mode === "draw" 
                ? "bg-gray-700 text-white" 
                : "bg-gray-800/90 text-white border border-gray-600 hover:bg-gray-700/90 backdrop-blur-sm"
            }`}
          >
            <Edit3 className="w-3 h-3 inline mr-1" />
            Draw
          </button>
          <button
            onClick={() => setMode(mode === "area" ? null : "area")}
            className={`px-3 py-2 rounded-lg font-medium transition-all transform hover:scale-105 text-sm ${
              mode === "area" 
                ? "bg-gray-700 text-white" 
                : "bg-gray-800/90 text-white border border-gray-600 hover:bg-gray-700/90 backdrop-blur-sm"
            }`}
          >
            <Square className="w-3 h-3 inline mr-1" />
            Area
          </button>
        </div>

        {/* Field Input Form */}
        {(mode === "draw" || mode === "area" || editingField) && (
          <div className="bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-xl p-4 space-y-3 w-72 shadow-2xl">
            <h3 className="text-white font-semibold flex items-center gap-2">
              {editingField ? (
                <><Edit3 className="w-4 h-4" /> Edit Field</>
              ) : (
                <><MapPin className="w-4 h-4" /> Manual Field</>
              )}
            </h3>
            
            <input
              type="text"
              placeholder={t("fieldName")}
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white text-sm focus:border-blue-400 focus:outline-none"
            />
            
            {!editingField && (
              <input
                type="number"
                placeholder={t("landAreaAcres")}
                value={landAreaAcres}
                onChange={(e) => setLandAreaAcres(e.target.value)}
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white text-sm focus:border-blue-400 focus:outline-none"
              />
            )}
            
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as LandStatus)}
              className="w-full px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-white text-sm focus:border-blue-400 focus:outline-none"
            >
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            
            <p className="text-xs text-gray-400">
              {mode === "draw" ? t("drawPolygon") : mode === "area" ? t("clickToPlace") : "Edit field properties"}
            </p>
            
            <div className="flex gap-2">
              {editingField ? (
                <>
                  <button
                    onClick={handleUpdateField}
                    className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => {
                      setEditingField(null);
                      setNewFieldName("");
                      setNewStatus("cultivated");
                    }}
                    className="flex-1 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {mode === "area" && areaCenter && (
                    <button
                      onClick={handleAreaConfirm}
                      className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      {t("save")}
                    </button>
                  )}
                  <button
                    onClick={() => { 
                      setMode(null); 
                      setAreaCenter(null);
                      setEditingField(null);
                    }}
                    className="flex-1 py-2 rounded-lg bg-red-500/80 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    {t("cancel")}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Side Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3">
        {/* Map Layer Selector */}
        <div className="bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-xl p-3 shadow-2xl">
          <h4 className="text-white text-xs font-semibold mb-2 flex items-center gap-2">
            <Layers className="w-3 h-3" />
            Map Layers
          </h4>
          <div className="space-y-1">
            {mapLayers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => setCurrentLayer(layer.id)}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                  currentLayer === layer.id
                    ? "bg-blue-500 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
              >
                {layer.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-xl p-2 shadow-2xl">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              title="Toggle Legend"
            >
              {showLegend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              title="Reset Map"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <LandStatusLegend compact={true} showStats={false} />
        </div>
      )}

      {/* Selected Field Info */}
      {selectedField && (() => {
        const field = fields.find(f => f.id === selectedField);
        if (!field) return null;
        return (
          <div className="bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-xl p-4 shadow-2xl max-w-xs">
            <h4 className="text-white font-semibold mb-2">{field.name}</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-300">
                Status: <span className="font-medium" style={{ color: statusColors[field.status] }}>
                  {statusLabels[field.status]}
                </span>
              </p>
              {field.area && (
                <p className="text-gray-300">
                  Area: <span className="font-medium">{field.area.toFixed(2)} acres</span>
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleEditField(field)}
                className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteField(field.id)}
                className="flex-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })()}
      {/* Field Details Side Panel - User Friendly */}
      {selectedFieldDetails && (
        <FieldSidePanel
          field={selectedFieldDetails}
          onClose={() => setSelectedFieldDetails(null)}
          onEdit={(field) => {
            setSelectedFieldDetails(null);
            handleEditField(field);
          }}
        />
      )}
    </div>
  );
}

function AreaClickHandler({ onClick }: { onClick: (e: { latlng: { lat: number; lng: number } }) => void }) {
  useMapEvents({ click: onClick });
  return null;
}
