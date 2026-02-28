"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents, useMap, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLandStore } from "@/lib/store";
import type { GeoFence, LandStatus } from "@/types";
import {
  geocodeLocation,
  polygonFromCenterAndArea,
  reverseGeocode,
  getCurrentPosition,
  parseCoordinates,
} from "@/lib/geo";
import { getArea } from "@/lib/field-utils";
import {
  MapPin,
  Satellite,
  Search,
  Save,
  Layers,
  Loader2,
  AlertCircle,
  Ruler,
  FileText,
  Navigation,
  Type,
  Pencil,
  Square,
  MousePointer2,
  ChevronDown,
  ChevronUp,
  X,
  Mountain,
  ClipboardList,
  Download,
  Trash2,
  Calendar,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";

const FieldDetailsModal = dynamic(() => import("@/components/FieldDetails"), { ssr: false });

import { MAPBOX_TOKEN, getMapboxTileUrl } from "@/lib/mapbox";

// Enhanced map layers with Mapbox high-resolution tiles
const SATELLITE_URL = MAPBOX_TOKEN 
  ? getMapboxTileUrl("satellite") 
  : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET_URL = MAPBOX_TOKEN 
  ? getMapboxTileUrl("streets") 
  : "https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png";
const HYBRID_URL = MAPBOX_TOKEN 
  ? getMapboxTileUrl("satellite-streets") 
  : SATELLITE_URL;
const TERRAIN_URL = "https://{s}.tile.opentopomap.org/{z}/{y}/{x}.png";

const MAP_LAYERS = [
  { 
    id: "satellite" as const, 
    url: SATELLITE_URL, 
    name: "Satellite", 
    attribution: MAPBOX_TOKEN ? "&copy; Mapbox &copy; OpenStreetMap" : "&copy; Esri",
    maxZoom: 22,
    maxNativeZoom: MAPBOX_TOKEN ? 22 : 19,
    tileSize: MAPBOX_TOKEN ? 512 : 256,
    zoomOffset: MAPBOX_TOKEN ? -1 : 0,
  },
  { 
    id: "hybrid" as const, 
    url: HYBRID_URL, 
    name: "Hybrid", 
    attribution: MAPBOX_TOKEN ? "&copy; Mapbox &copy; OpenStreetMap" : "&copy; Esri",
    maxZoom: 22,
    maxNativeZoom: MAPBOX_TOKEN ? 22 : 19,
    tileSize: MAPBOX_TOKEN ? 512 : 256,
    zoomOffset: MAPBOX_TOKEN ? -1 : 0,
  },
  {
    id: "street" as const,
    url: STREET_URL,
    name: "Street",
    attribution: MAPBOX_TOKEN ? "&copy; Mapbox &copy; OpenStreetMap" : "&copy; OpenStreetMap",
    maxZoom: 22,
    maxNativeZoom: MAPBOX_TOKEN ? 22 : 19,
    tileSize: MAPBOX_TOKEN ? 512 : 256,
    zoomOffset: MAPBOX_TOKEN ? -1 : 0,
  },
  { 
    id: "terrain" as const, 
    url: TERRAIN_URL, 
    name: "Terrain", 
    attribution: "&copy; OpenTopoMap",
    maxZoom: 17,
    maxNativeZoom: 17,
    tileSize: 256,
    zoomOffset: 0,
  },
];

const statusOptions: { value: LandStatus; label: string }[] = [
  { value: "cultivated", label: "Cultivated" },
  { value: "available", label: "Available" },
  { value: "uncultivated", label: "Uncultivated" },
  { value: "thaka", label: "Thaka (Leased)" },
  { value: "not_usable", label: "Not usable" },
];

type AddTab = "search" | "mylocation" | "coordinates" | "draw";

function MapCenterer({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

function FitBounds({ coords }: { coords: { lat: number; lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length < 2) return;
    const bounds = L.latLngBounds(coords.map((c) => [c.lat, c.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.15));
  }, [map, coords]);
  return null;
}

/** Bottom-left: Lat/Lng display (cursor or center). */
function MapCoordDisplay({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap();
  const [pos, setPos] = useState(() => map.getCenter());
  useMapEvents({
    mousemove(e) {
      setPos(e.latlng);
    },
    moveend() {
      setPos(map.getCenter());
    },
  });
  const p = coords ?? pos;
  return (
    <div className="absolute bottom-12 left-4 z-[1000] rounded border border-theme bg-theme-card/95 px-3 py-1.5 font-mono text-xs text-theme-muted shadow-lg">
      Lat: {p.lat.toFixed(5)}, Lng: {p.lng.toFixed(5)}
    </div>
  );
}

/** Attach Leaflet scale control (bottom-right like reference). */
function MapScale() {
  const map = useMap();
  useEffect(() => {
    const scale = L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);
    return () => {
      scale.remove();
    };
  }, [map]);
  return null;
}

/** Fly map to a place when target is set (e.g. after "Go to place" search). */
function FlyToPlace({ target, onArrived }: { target: [number, number] | null; onArrived: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, 15, { duration: 0.8 });
    const t = setTimeout(onArrived, 900);
    return () => clearTimeout(t);
  }, [map, target, onArrived]);
  return null;
}

/** Fly to field bounds when a field is selected. */
function FlyToField({ field, onArrived }: { field: GeoFence | null; onArrived: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!field?.coordinates?.length) return;
    if (field.coordinates.length === 1) {
      map.flyTo([field.coordinates[0].lat, field.coordinates[0].lng], 16, { duration: 0.6 });
    } else {
      const bounds = L.latLngBounds(
        field.coordinates.map((c) => [c.lat, c.lng] as [number, number])
      );
      map.flyToBounds(bounds.pad(0.2), { duration: 0.6, maxZoom: 16 });
    }
    const t = setTimeout(onArrived, 700);
    return () => clearTimeout(t);
  }, [map, field?.id, onArrived]);
  return null;
}

/** Draw layer: polygon (click points, min 3) or rectangle (2 clicks = opposite corners). */
function DrawLayer({
  shape,
  onFinish,
  onCancel,
}: {
  shape: "polygon" | "rectangle";
  onFinish: (coords: { lat: number; lng: number }[]) => void;
  onCancel: () => void;
}) {
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (shape === "rectangle" && points.length >= 2) return;
      setPoints((p) => {
        const next = [...p, { lat, lng }];
        if (shape === "rectangle" && next.length === 2) {
          const [a, b] = next;
          const rect = [
            { lat: Math.min(a.lat, b.lat), lng: Math.min(a.lng, b.lng) },
            { lat: Math.min(a.lat, b.lat), lng: Math.max(a.lng, b.lng) },
            { lat: Math.max(a.lat, b.lat), lng: Math.max(a.lng, b.lng) },
            { lat: Math.max(a.lat, b.lat), lng: Math.min(a.lng, b.lng) },
          ];
          onFinish(rect);
        }
        return next;
      });
    },
    mousemove(e) {
      setCurrentPos(e.latlng);
    },
    contextmenu(e) {
      e.originalEvent.preventDefault();
      if (points.length > 0) setPoints([]);
    },
  });

  const finishPolygon = useCallback(() => {
    if (points.length >= 3) onFinish(points);
  }, [points, onFinish]);

  const undo = useCallback(() => setPoints((p) => p.slice(0, -1)), []);

  const previewLine =
    currentPos && points.length > 0 ? (
      <Polyline
        positions={[points[points.length - 1], currentPos]}
        pathOptions={{ color: "#22c55e", weight: 2, dashArray: "4 4" }}
      />
    ) : null;
  const closingLine =
    currentPos && points.length >= 2 ? (
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
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap gap-2 rounded-xl border border-theme bg-theme-card/95 p-3 shadow-lg">
        <p className="w-full text-xs text-theme-muted">
          {shape === "polygon"
            ? "Click to add points (min 3). Right-click to clear. Then click Finish."
            : "Click two opposite corners of the field."}
        </p>
        {shape === "polygon" && (
          <>
            <span className="text-sm text-theme">{points.length} points</span>
            <button
              type="button"
              onClick={undo}
              disabled={points.length === 0}
              className="rounded-lg bg-theme-track px-3 py-1.5 text-sm text-theme hover:bg-theme-track disabled:opacity-50"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={finishPolygon}
              disabled={points.length < 3}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-theme hover:bg-green-500 disabled:opacity-50"
            >
              Finish
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-red-600/80 px-3 py-1.5 text-sm text-theme hover:bg-red-500"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

const STATUS_LABELS: Record<LandStatus, string> = {
  cultivated: "Cultivated",
  available: "Available",
  uncultivated: "Uncultivated",
  not_usable: "Not usable",
  thaka: "Thaka (Leased)",
};

export default function LandMapUnified() {
  const { fields, addField, deleteField, expenses, incomes, waterRecords } = useLandStore();
  const [panelOpen, setPanelOpen] = useState(true);
  const [addTab, setAddTab] = useState<AddTab>("search");
  const [viewMode, setViewMode] = useState<"satellite" | "hybrid" | "street" | "terrain">("satellite");
  const [drawShape, setDrawShape] = useState<"polygon" | "rectangle">("polygon");
  const [goToQuery, setGoToQuery] = useState("");
  const [goToLoading, setGoToLoading] = useState(false);
  const [goToTarget, setGoToTarget] = useState<[number, number] | null>(null);
  const [selectedField, setSelectedField] = useState<GeoFence | null>(null);
  const [showFullDetailsModal, setShowFullDetailsModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Search
  const [locationQuery, setLocationQuery] = useState("");
  const [areaAcres, setAreaAcres] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [status, setStatus] = useState<LandStatus>("cultivated");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    coordinates: { lat: number; lng: number }[];
    center: [number, number];
    area: number;
    address?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [drawActive, setDrawActive] = useState(false);

  const defaultCenter: [number, number] =
    fields.length > 0 && fields[0].coordinates?.length
      ? [fields[0].coordinates[0].lat, fields[0].coordinates[0].lng]
      : [31.52, 74.35];
  const defaultZoom = 14;
  const mapCenter = preview?.center ?? defaultCenter;
  const mapZoom = preview ? 15 : defaultZoom;

  const activeLayer = useMemo(
    () => MAP_LAYERS.find((l) => l.id === viewMode) ?? MAP_LAYERS[0],
    [viewMode]
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
    setDrawActive(false);
  }, []);

  const handleSearch = useCallback(async () => {
    const query = locationQuery.trim();
    const acres = areaAcres ? parseFloat(areaAcres) : 0;
    if (!query) {
      setError("Enter a location (e.g. city, address, or place name).");
      return;
    }
    if (acres <= 0) {
      setError("Enter area in acres (e.g. 5 or 10.5).");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await geocodeLocation(query);
      if (!result) {
        setError("Location not found. Try a different name, or use Coordinates / Draw on map.");
        setPreview(null);
        return;
      }
      setAddress(result.displayName);
      const coordinates = polygonFromCenterAndArea(result.lat, result.lng, acres);
      setPreview({
        coordinates,
        center: [result.lat, result.lng],
        area: acres,
        address: result.displayName,
      });
    } catch {
      setError("Search failed. Check your connection and try again.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [locationQuery, areaAcres]);

  const handleMyLocation = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { lat, lng } = await getCurrentPosition();
      const displayName = await reverseGeocode(lat, lng);
      setAddress(displayName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      setPreview({
        coordinates: [],
        center: [lat, lng],
        area: 0,
        address: displayName || undefined,
      });
      const acres = areaAcres ? parseFloat(areaAcres) : 0;
      if (acres > 0) {
        const coordinates = polygonFromCenterAndArea(lat, lng, acres);
        setPreview((p) => (p ? { ...p, coordinates, area: acres } : null));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not get location.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [areaAcres]);

  const handleCoordinatesApply = useCallback(() => {
    const raw = (document.getElementById("coordinates-input") as HTMLTextAreaElement | null)?.value?.trim();
    if (!raw) {
      setError("Enter at least one coordinate (lat,lng) or multiple lines for a polygon.");
      return;
    }
    const coords = parseCoordinates(raw);
    if (coords.length === 0) {
      setError("Invalid format. Use: lat,lng (e.g. 31.52, 74.35) or one per line for polygon.");
      return;
    }
    setError(null);
    if (coords.length === 1) {
      const acres = areaAcres ? parseFloat(areaAcres) : 0;
      if (acres <= 0) {
        setError("For a single point, enter area in acres.");
        return;
      }
      const coordinates = polygonFromCenterAndArea(coords[0].lat, coords[0].lng, acres);
      const center: [number, number] = [coords[0].lat, coords[0].lng];
      setPreview({ coordinates, center, area: acres });
    } else if (coords.length >= 3) {
      const area = getArea(coords);
      const centerLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
      const centerLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
      setPreview({
        coordinates: coords,
        center: [centerLat, centerLng],
        area,
      });
    } else {
      setError("Polygon needs at least 3 points.");
    }
  }, [areaAcres]);

  const handleCenterOnMe = useCallback(async () => {
    try {
      const { lat, lng } = await getCurrentPosition();
      setGoToTarget([lat, lng]);
    } catch {
      setError("Could not get your location.");
    }
  }, []);

  const handleGoToPlace = useCallback(async () => {
    const q = goToQuery.trim();
    if (!q) return;
    setGoToLoading(true);
    setError(null);
    try {
      const result = await geocodeLocation(q);
      if (result) {
        setGoToTarget([result.lat, result.lng]);
      } else {
        setError("Place not found. Try a different name or address.");
      }
    } catch {
      setError("Search failed. Try again.");
    } finally {
      setGoToLoading(false);
    }
  }, [goToQuery]);

  const handleDrawFinish = useCallback(
    (coords: { lat: number; lng: number }[]) => {
      const area = getArea(coords);
      const centerLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
      const centerLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
      setPreview({
        coordinates: coords,
        center: [centerLat, centerLng],
        area,
      });
      setDrawActive(false);
    },
    []
  );

  const handleSaveField = useCallback(async () => {
    if (!preview) return;
    const name = fieldName.trim() || address || preview.address || "My field";
    const area = preview.area || getArea(preview.coordinates);
    setSaving(true);
    try {
      await addField({
        name,
        coordinates: preview.coordinates,
        area,
        status,
        address: address || preview.address || undefined,
        locationName: address || preview.address || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      clearPreview();
      setFieldName("");
      setLocationQuery("");
      setAreaAcres("");
      setAddress("");
      setError(null);
    } catch {
      setError("Could not save field. Try again.");
    } finally {
      setSaving(false);
    }
  }, [preview, fieldName, address, status, addField, clearPreview]);

  const handleFieldClick = useCallback((field: GeoFence) => {
    setSelectedField((prev) => (prev?.id === field.id ? null : field));
    setDeleteConfirm(false);
  }, []);

  const handleDeleteField = useCallback(async () => {
    if (!selectedField?.id) return;
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteField(selectedField.id);
      setSelectedField(null);
      setDeleteConfirm(false);
      setError(null);
    } catch {
      setError("Could not delete field. Try again.");
    } finally {
      setDeleting(false);
    }
  }, [selectedField?.id, deleteConfirm, deleteField]);

  const selectedFieldStats = useMemo(() => {
    if (!selectedField) return null;
    const fieldExpenses = expenses.filter((e) => e.fieldId === selectedField.id);
    const fieldIncomes = incomes.filter((i) => i.fieldId === selectedField.id);
    const fieldWater = waterRecords.filter((w) => w.fieldId === selectedField.id);
    return {
      totalExpenses: fieldExpenses.reduce((s, e) => s + e.amount, 0),
      totalIncome: fieldIncomes.reduce((s, i) => s + i.amount, 0),
      expenseCount: fieldExpenses.length,
      incomeCount: fieldIncomes.length,
      waterSessions: fieldWater.length,
    };
  }, [selectedField?.id, expenses, incomes, waterRecords]);

  const tabs: { id: AddTab; label: string; icon: React.ReactNode }[] = [
    { id: "search", label: "Search address", icon: <Search className="h-4 w-4" /> },
    { id: "mylocation", label: "My location", icon: <Navigation className="h-4 w-4" /> },
    { id: "coordinates", label: "Coordinates", icon: <Type className="h-4 w-4" /> },
    { id: "draw", label: "Draw on map", icon: <Pencil className="h-4 w-4" /> },
  ];

  return (
    <>
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 rounded-2xl border border-theme bg-theme-card overflow-hidden md:flex-row">
        {/* Left panel */}
        <div
        className={`flex shrink-0 flex-col border-theme bg-theme-track md:w-[340px] md:border-r ${
          panelOpen ? "block" : "hidden md:block md:w-14"
        }`}
      >
        <button
          type="button"
          onClick={() => setPanelOpen(!panelOpen)}
          className="flex items-center justify-between border-b border-theme px-4 py-3 text-left text-theme hover:bg-theme-card md:justify-center"
        >
          <span className="flex items-center gap-2 font-medium">
            <MapPin className="h-5 w-5 text-green-400" />
            {panelOpen && "Add field"}
          </span>
          {panelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {panelOpen && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <div className="flex flex-wrap gap-1 rounded-lg bg-theme-card p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setAddTab(tab.id);
                    setError(null);
                    if (tab.id !== "draw") setDrawActive(false);
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                    addTab === tab.id
                      ? "bg-green-500/30 text-green-400"
                      : "text-theme-muted hover:text-theme hover:bg-theme-track"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {addTab === "search" && (
              <>
                <p className="text-sm text-theme-muted">
                  Enter address or place name. We’ll find it and you can set the area.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#c9d1d9]">Location</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      placeholder="e.g. Lahore, Pakistan or full address"
                      className="w-full rounded-xl border border-theme bg-theme-card py-2.5 pl-10 pr-3 text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#c9d1d9]">Area (acres)</label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={areaAcres}
                      onChange={(e) => setAreaAcres(e.target.value)}
                      placeholder="e.g. 5 or 12.5"
                      className="w-full rounded-xl border border-theme bg-theme-card py-2.5 pl-10 pr-3 text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-medium text-theme hover:bg-green-500 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  {loading ? "Searching…" : "Search & mark on map"}
                </button>
              </>
            )}

            {addTab === "mylocation" && (
              <>
                <p className="text-sm text-theme-muted">
                  Use your device’s GPS to mark your current location, then set area or draw.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#c9d1d9]">Area (acres, optional)</label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={areaAcres}
                      onChange={(e) => setAreaAcres(e.target.value)}
                      placeholder="Leave empty to draw shape later"
                      className="w-full rounded-xl border border-theme bg-theme-card py-2.5 pl-10 pr-3 text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleMyLocation}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-medium text-theme hover:bg-green-500 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
                  {loading ? "Getting location…" : "Use my location"}
                </button>
                {preview?.center && preview.coordinates.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const acres = areaAcres ? parseFloat(areaAcres) : 0;
                      if (acres <= 0) return;
                      const coordinates = polygonFromCenterAndArea(
                        preview.center[0],
                        preview.center[1],
                        acres
                      );
                      setPreview((p) => (p ? { ...p, coordinates, area: acres } : null));
                    }}
                    disabled={!areaAcres || parseFloat(areaAcres) <= 0}
                    className="flex items-center justify-center gap-2 rounded-xl border border-green-500/50 bg-green-500/20 py-2.5 text-sm font-medium text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                  >
                    Apply area to preview
                  </button>
                )}
              </>
            )}

            {addTab === "coordinates" && (
              <>
                <p className="text-sm text-theme-muted">
                  One line: <code className="text-green-400">lat,lng</code> (we’ll use area below). Multiple lines: one{" "}
                  <code className="text-green-400">lat,lng</code> per line for a polygon.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#c9d1d9]">Coordinates</label>
                  <textarea
                    id="coordinates-input"
                    rows={4}
                    placeholder={'31.52, 74.35\n31.53, 74.36\n31.54, 74.35'}
                    className="w-full rounded-xl border border-theme bg-theme-card px-3 py-2.5 font-mono text-sm text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#c9d1d9]">Area (acres, for single point)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={areaAcres}
                    onChange={(e) => setAreaAcres(e.target.value)}
                    placeholder="Required if one coordinate only"
                    className="w-full rounded-xl border border-theme bg-theme-card py-2.5 px-3 text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCoordinatesApply}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-medium text-theme hover:bg-green-500"
                >
                  <Type className="h-5 w-5" />
                  Apply & show on map
                </button>
              </>
            )}

            {addTab === "draw" && (
              <>
                <p className="text-sm text-theme-muted">
                  Draw a polygon (any shape) or a rectangle on the map. Area is calculated automatically.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDrawShape("polygon")}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${
                      drawShape === "polygon"
                        ? "bg-green-500/30 text-green-400"
                        : "border border-theme text-theme-muted hover:text-theme"
                    }`}
                  >
                    <MousePointer2 className="h-4 w-4 inline mr-1" />
                    Polygon
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawShape("rectangle")}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${
                      drawShape === "rectangle"
                        ? "bg-green-500/30 text-green-400"
                        : "border border-theme text-theme-muted hover:text-theme"
                    }`}
                  >
                    <Square className="h-4 w-4 inline mr-1" />
                    Rectangle
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawActive(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-medium text-theme hover:bg-green-500"
                >
                  <Pencil className="h-5 w-5" />
                  Start drawing on map
                </button>
              </>
            )}

            {/* Shared: field name, status, save */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#c9d1d9]">Field name</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g. North wheat field"
                  className="w-full rounded-xl border border-theme bg-theme-card py-2.5 pl-10 pr-3 text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#c9d1d9]">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LandStatus)}
                className="w-full rounded-xl border border-theme bg-theme-card px-3 py-2.5 text-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {preview && preview.coordinates.length < 3 && (
              <button
                type="button"
                onClick={clearPreview}
                className="rounded-xl border border-theme bg-theme-card px-3 py-2 text-sm text-theme-muted hover:text-theme"
              >
                Clear location preview
              </button>
            )}
            {preview && preview.coordinates.length >= 3 && (
              <div className="flex flex-col gap-2 rounded-xl border border-green-500/40 bg-green-500/10 p-3">
                <p className="text-sm text-green-200">
                  Preview: {preview.area > 0 ? `${preview.area.toFixed(2)} acres` : "—"} • Click Save to add field
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveField}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 font-medium text-theme hover:bg-green-500 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {saving ? "Saving…" : "Save as my field"}
                  </button>
                  <button
                    type="button"
                    onClick={clearPreview}
                    className="rounded-xl border border-theme bg-theme-card px-3 py-2.5 text-theme-muted hover:text-theme"
                    aria-label="Clear preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            <div className="mt-auto border-t border-theme pt-4">
              <p className="text-xs text-theme-muted">
                My fields: <span className="font-medium text-theme">{fields.length}</span>
                {fields.length > 0 && " — Expenses, temperature & data link to these fields."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative min-h-[400px] flex-1">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={3}
          maxZoom={22}
          zoomControl={true}
          className="h-full w-full rounded-xl"
          style={{ background: "#0d1117" }}
        >
          {preview && <MapCenterer center={preview.center} zoom={16} />}
          {preview && preview.coordinates.length >= 2 && <FitBounds coords={preview.coordinates} />}
          {goToTarget && <FlyToPlace target={goToTarget} onArrived={() => setGoToTarget(null)} />}
          {selectedField && (
            <FlyToField field={selectedField} onArrived={() => {}} />
          )}
          <TileLayer
            attribution={activeLayer.attribution}
            url={activeLayer.url}
            maxZoom={activeLayer.maxZoom}
            maxNativeZoom={activeLayer.maxNativeZoom}
            tileSize={activeLayer.tileSize}
            zoomOffset={activeLayer.zoomOffset}
          />
          {fields.map((field, index) => {
            const statusColors = {
              cultivated: { color: "#22c55e", fillColor: "#22c55e" },
              available: { color: "#f59e0b", fillColor: "#f59e0b" },
              uncultivated: { color: "#94a3b8", fillColor: "#94a3b8" },
              not_usable: { color: "#ef4444", fillColor: "#ef4444" },
              thaka: { color: "#a855f7", fillColor: "#a855f7" },
            };
            const colors = statusColors[field.status as keyof typeof statusColors] || statusColors.cultivated;
            const isSelected = selectedField?.id === field.id;
            return (
              <Polygon
                key={field.id ? `${field.id}-${index}` : `f-${index}`}
                positions={field.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
                pathOptions={{
                  color: colors.color,
                  fillColor: colors.fillColor,
                  fillOpacity: isSelected ? 0.45 : 0.3,
                  weight: isSelected ? 4 : 3,
                  opacity: 0.9,
                }}
                eventHandlers={{
                  click: () => handleFieldClick(field),
                }}
              >
                <Popup>
                  <div className="p-2 text-center text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">{field.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Click to open details in panel →</p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
          {preview && preview.coordinates.length >= 3 && (
            <Polygon
              positions={preview.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
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
                    Click "Save as my field" in the panel to add this field.
                  </p>
                </div>
              </Popup>
            </Polygon>
          )}
          {preview && preview.coordinates.length === 0 && preview.center && (
            <Circle
              center={preview.center}
              // Larger, more visible radius like the reference screenshot
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
                  Your location preview. Adjust area or switch to Draw to mark the exact boundary.
                </p>
              </Popup>
            </Circle>
          )}
          {drawActive && (
            <DrawLayer
              shape={drawShape}
              onFinish={handleDrawFinish}
              onCancel={() => setDrawActive(false)}
            />
          )}
          <MapCoordDisplay coords={null} />
          <MapScale />
        </MapContainer>

        {/* Top-right: Go to place + layers + toolbar (high-contrast, clearer icons) */}
        <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
          {/* Go to place */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/20 bg-black/70 shadow-xl overflow-hidden backdrop-blur-md">
            <Search className="h-4 w-4 ml-3 text-white shrink-0" />
            <input
              type="text"
              value={goToQuery}
              onChange={(e) => setGoToQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGoToPlace()}
              placeholder="Go to place"
              className="w-44 bg-transparent py-2.5 pr-3 pl-1 text-sm text-white placeholder-theme focus:outline-none"
            />
            <button
              type="button"
              onClick={handleGoToPlace}
              disabled={goToLoading}
              className="rounded-l-none rounded-r-2xl bg-green-600 px-4 py-2.5 text-white hover:bg-green-500 disabled:opacity-50"
              title="Go"
            >
              {goToLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
            </button>
          </div>
          {/* Base layer picker */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/20 bg-black/70 p-1.5 shadow-xl backdrop-blur-md">
            {MAP_LAYERS.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => setViewMode(layer.id)}
                className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  viewMode === layer.id 
                    ? "bg-green-500 text-white shadow-md" 
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                title={layer.name}
              >
                {layer.id === "terrain" && <Mountain className="h-4 w-4" />}
                {layer.id === "street" && <Layers className="h-4 w-4" />}
                {layer.id === "satellite" && <Satellite className="h-4 w-4" />}
                {layer.id === "hybrid" && (
                  <div className="flex items-center gap-1">
                    <Satellite className="h-4 w-4" />
                    <Layers className="h-3 w-3" />
                  </div>
                )}
                <span className="hidden sm:inline">{layer.name}</span>
              </button>
            ))}
          </div>
          {/* Tools bar */}
          <div className="flex items-center gap-1 rounded-2xl border border-white/20 bg-black/70 p-1.5 shadow-xl backdrop-blur-md">
            {preview && preview.coordinates.length >= 3 && (
              <span className="flex items-center gap-1.5 px-2 text-xs text-white/90" title="Measurement">
                <ClipboardList className="h-4 w-4 text-green-400" />
                <span className="font-medium">{preview.area.toFixed(2)} acres</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleCenterOnMe}
              className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-white"
              title="Center on my location"
            >
              <Navigation className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => { setAddTab("draw"); setDrawActive(true); setPanelOpen(true); }}
              className={`rounded-xl p-2 ${
                drawActive
                  ? "bg-green-500 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
              title="Draw on map"
            >
              <Pencil className="h-5 w-5" />
            </button>
            <a
              href="/export"
              className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-white"
              title="Export data"
            >
              <Download className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Bottom bar: attribution + field count + Mapbox status */}
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
          <div className="rounded border border-theme bg-theme-card/95 px-2.5 py-1 text-xs text-theme-muted shadow-lg">
            <span className="text-[#c9d1d9]">Leaflet</span>
            <span className="mx-1">|</span>
            {MAPBOX_TOKEN ? (
              <span className="text-green-400">Mapbox HD ✓</span>
            ) : (
              <span>© OpenStreetMap</span>
            )}
            {viewMode === "terrain" && <span>, © OpenTopoMap</span>}
            {viewMode === "satellite" && !MAPBOX_TOKEN && <span>, © Esri</span>}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-theme-muted">
              <span className="font-medium text-theme">{fields.length}</span> field{fields.length !== 1 ? "s" : ""}
            </span>
            {fields.length > 0 && !selectedField && (
              <span className="text-xs text-theme-muted italic">Click a field to view details</span>
            )}
            {MAPBOX_TOKEN && (
              <span className="text-xs text-green-400">
                Zoom: 3-22 levels
              </span>
            )}
          </div>
        </div>
      </div>

        {/* Right panel: Field details when a field is selected */}
        {selectedField && (
          <div className="flex shrink-0 flex-col w-full max-w-md border-l border-theme bg-[#0f172a]/98 backdrop-blur-xl shadow-xl overflow-hidden rounded-r-2xl md:w-[320px]">
          <div className="flex items-center justify-between border-b border-theme px-4 py-3 bg-theme-track">
            <h3 className="font-semibold text-theme flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-400" />
              Field details
            </h3>
            <button
              type="button"
              onClick={() => { setSelectedField(null); setDeleteConfirm(false); }}
              className="rounded-lg p-2 text-theme-muted hover:bg-theme-card hover:text-theme"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div>
              <h4 className="text-lg font-bold text-theme mb-1">{selectedField.name}</h4>
              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 capitalize">
                {STATUS_LABELS[selectedField.status] ?? selectedField.status}
              </span>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-start gap-2">
                <dt className="text-theme-muted flex items-center gap-1.5">
                  <Ruler className="h-4 w-4" /> Area
                </dt>
                <dd className="font-medium text-theme text-right">
                  {selectedField.area != null ? `${selectedField.area.toFixed(2)} acres` : "—"}
                </dd>
              </div>
              <div className="flex justify-between items-start gap-2">
                <dt className="text-theme-muted flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Boundary points
                </dt>
                <dd className="font-medium text-theme">{selectedField.coordinates?.length ?? 0}</dd>
              </div>
              {(selectedField.address || selectedField.locationName) && (
                <div className="flex flex-col gap-1">
                  <dt className="text-theme-muted flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> Address
                  </dt>
                  <dd className="text-theme text-sm pl-6">{selectedField.address || selectedField.locationName}</dd>
                </div>
              )}
              <div className="flex justify-between items-center gap-2">
                <dt className="text-theme-muted flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Created
                </dt>
                <dd className="text-theme">
                  {new Date(selectedField.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </dd>
              </div>
              <div className="flex justify-between items-center gap-2">
                <dt className="text-theme-muted flex items-center gap-1.5">Updated</dt>
                <dd className="text-theme">
                  {new Date(selectedField.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </dd>
              </div>
              {selectedField.notUsableReason && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
                  <p className="text-xs text-amber-200">{selectedField.notUsableReason}</p>
                </div>
              )}
            </dl>
            {selectedFieldStats && (
              <div className="rounded-xl border border-theme bg-theme-card/50 p-3 space-y-2">
                <p className="text-xs font-medium text-theme-muted flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" /> Linked data
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-theme-muted">Expenses</span>
                  <span className="text-theme font-medium">{selectedFieldStats.expenseCount} (${selectedFieldStats.totalExpenses.toLocaleString()})</span>
                  <span className="text-theme-muted">Income</span>
                  <span className="text-theme font-medium">{selectedFieldStats.incomeCount} (${selectedFieldStats.totalIncome.toLocaleString()})</span>
                  <span className="text-theme-muted">Water sessions</span>
                  <span className="text-theme font-medium">{selectedFieldStats.waterSessions}</span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFullDetailsModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-green-500/50 bg-green-500/20 py-2.5 text-sm font-medium text-green-400 hover:bg-green-500/30"
              >
                <ExternalLink className="h-4 w-4" />
                View full report
              </button>
              <button
                type="button"
                onClick={handleDeleteField}
                disabled={deleting}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium ${
                  deleteConfirm
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : "border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                } disabled:opacity-50`}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleteConfirm ? "Confirm delete" : "Delete field"}
              </button>
              {deleteConfirm && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="rounded-xl border border-theme bg-theme-card py-2 text-sm text-theme-muted hover:text-theme"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Full details modal */}
      {showFullDetailsModal && selectedField && (
        <FieldDetailsModal
          field={selectedField}
          onClose={() => setShowFullDetailsModal(false)}
          onEdit={() => {}}
        />
      )}
    </>
  );
}
