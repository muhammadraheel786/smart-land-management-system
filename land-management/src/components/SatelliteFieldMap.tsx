"use client";

import { useState, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLandStore } from "@/lib/store";
import type { GeoFence, LandStatus } from "@/types";
import { geocodeLocation, polygonFromCenterAndArea } from "@/lib/geo";
import {
  MapPin,
  Satellite,
  Search,
  Save,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Ruler,
  FileText,
} from "lucide-react";
import { MAPBOX_TOKEN, getMapboxTileUrl } from "@/lib/mapbox";

const SATELLITE_URL = MAPBOX_TOKEN ? getMapboxTileUrl("satellite") : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET_URL = MAPBOX_TOKEN ? getMapboxTileUrl("streets") : "https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png";

const statusOptions: { value: LandStatus; label: string }[] = [
  { value: "cultivated", label: "Cultivated" },
  { value: "available", label: "Available" },
  { value: "uncultivated", label: "Uncultivated" },
  { value: "thaka", label: "Thaka (Leased)" },
  { value: "not_usable", label: "Not usable" },
];

function MapCenterer({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function SatelliteFieldMap() {
  const { fields, addField, deleteField } = useLandStore();
  const [locationQuery, setLocationQuery] = useState("");
  const [areaAcres, setAreaAcres] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [status, setStatus] = useState<LandStatus>("cultivated");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ coordinates: { lat: number; lng: number }[]; center: [number, number] } | null>(null);
  const [viewMode, setViewMode] = useState<"satellite" | "street">("satellite");
  const [panelOpen, setPanelOpen] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setError("Location not found. Try a different name or address.");
        setPreview(null);
        return;
      }
      setAddress(result.displayName);
      const coordinates = polygonFromCenterAndArea(result.lat, result.lng, acres);
      setPreview({
        coordinates,
        center: [result.lat, result.lng],
      });
    } catch (e) {
      setError("Search failed. Check your connection and try again.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [locationQuery, areaAcres]);

  const handleSaveField = useCallback(async () => {
    if (!preview) return;
    const name = fieldName.trim() || address || "My field";
    const acres = areaAcres ? parseFloat(areaAcres) : 0;
    setSaving(true);
    try {
      await addField({
        name,
        coordinates: preview.coordinates,
        area: acres,
        status,
        address: address || locationQuery.trim() || undefined,
        locationName: address || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setPreview(null);
      setFieldName("");
      setLocationQuery("");
      setAreaAcres("");
      setAddress("");
      setError(null);
    } catch (e) {
      setError("Could not save field. Try again.");
    } finally {
      setSaving(false);
    }
  }, [preview, fieldName, areaAcres, status, address, locationQuery, addField]);

  const defaultCenter: [number, number] = fields.length > 0 && fields[0].coordinates?.length
    ? [fields[0].coordinates[0].lat, fields[0].coordinates[0].lng]
    : [31.52, 74.35];
  const defaultZoom = 14;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 rounded-2xl border border-theme bg-theme-card overflow-hidden md:flex-row">
      {/* Left panel: Add field by location */}
      <div
        className={`flex shrink-0 flex-col border-theme bg-theme-track md:w-[320px] md:border-r ${
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
            {panelOpen && "Add my field by location"}
          </span>
          {panelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {panelOpen && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <p className="text-sm text-theme-muted">
              Enter your land location and area. We will find it on the map and mark the boundary.
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
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-medium text-theme hover:bg-green-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                {loading ? "Searching…" : "Search & mark on map"}
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={handleSaveField}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl border border-green-500/50 bg-green-500/20 py-3 font-medium text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {saving ? "Saving…" : "Save as my field"}
                </button>
              )}
            </div>
            <div className="mt-auto border-t border-theme pt-4">
              <p className="text-xs text-theme-muted">
                My fields: <span className="font-medium text-theme">{fields.length}</span>
                {fields.length > 0 && (
                  <span className="text-theme-muted"> — All data (temperature, expenses, etc.) is linked to these fields.</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative min-h-[400px] flex-1">
        <MapContainer
          center={preview?.center ?? defaultCenter}
          zoom={preview ? 15 : defaultZoom}
          className="h-full w-full rounded-xl"
          style={{ background: "#0d1117" }}
        >
          {preview && <MapCenterer center={preview.center} zoom={15} />}
          <TileLayer
            attribution='&copy; Esri, Maxar, Earthstar'
            url={viewMode === "satellite" ? SATELLITE_URL : STREET_URL}
          />
          {/* Saved fields — original view on satellite */}
          {fields.map((field, index) => (
            <Polygon
              key={field.id ? `${field.id}-${index}` : `f-${index}`}
              positions={field.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
              pathOptions={{
                color: "#22c55e",
                fillColor: "#22c55e",
                fillOpacity: 0.25,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-2 text-sm">
                  <p className="font-semibold text-gray-900">{field.name}</p>
                  <p className="text-gray-600">{field.area != null ? `${field.area} acres` : ""}</p>
                  {field.address && <p className="text-gray-500 truncate max-w-[200px]">{field.address}</p>}
                </div>
              </Popup>
            </Polygon>
          ))}
          {/* Preview polygon (before save) */}
          {preview && (
            <Polygon
              positions={preview.coordinates.map((c) => [c.lat, c.lng] as [number, number])}
              pathOptions={{
                color: "#f59e0b",
                fillColor: "#f59e0b",
                fillOpacity: 0.35,
                weight: 3,
                dashArray: "8 4",
              }}
            >
              <Popup>
                <p className="text-sm font-medium">Preview — click &quot;Save as my field&quot; to add.</p>
              </Popup>
            </Polygon>
          )}
        </MapContainer>
        {/* Layer toggle */}
        <div className="absolute right-3 top-3 flex rounded-xl border border-theme bg-theme-card/95 p-1 shadow-lg">
          <button
            type="button"
            onClick={() => setViewMode("satellite")}
            className={`rounded-lg px-3 py-2 ${viewMode === "satellite" ? "bg-green-500/30 text-green-400" : "text-theme-muted hover:text-theme"}`}
            title="Satellite (original view)"
          >
            <Satellite className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("street")}
            className={`rounded-lg px-3 py-2 ${viewMode === "street" ? "bg-green-500/30 text-green-400" : "text-theme-muted hover:text-theme"}`}
            title="Street map"
          >
            <Layers className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 rounded-lg border border-theme bg-theme-card/95 px-3 py-2 text-sm text-theme-muted">
          <span className="font-medium text-theme">{fields.length}</span> field{fields.length !== 1 ? "s" : ""} — satellite view
        </div>
      </div>
    </div>
  );
}
