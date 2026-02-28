"use client";

import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLandStore } from "@/lib/store";
import type { GeoFence, LandStatus } from "@/types";
import { statusColors, statusBorderColors } from "@/lib/map-styles";
import {
  Radar,
  MapPin,
  Layers,
  Menu,
  X,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Satellite,
  Map as MapIcon,
  Compass,
  Search,
  Grid3X3,
  BarChart3,
  Upload,
  Download
} from "lucide-react";

export default function SimpleWorkingGeofence() {
  const { fields, addField, deleteField } = useLandStore();
  const [viewMode, setViewMode] = useState<'satellite' | 'street'>('satellite');
  const [mode, setMode] = useState<'view' | 'create' | 'auto'>('view');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const handleMapClick = useCallback(async (e: any) => {
    const { lat, lng } = e.latlng;
    
    if (mode === 'create') {
      // Create a simple field around clicked point
      const newField = {
        name: `Field ${fields.length + 1}`,
        coordinates: [
          { lat: lat - 0.002, lng: lng - 0.002 },
          { lat: lat - 0.002, lng: lng + 0.002 },
          { lat: lat + 0.002, lng: lng + 0.002 },
          { lat: lat + 0.002, lng: lng - 0.002 }
        ],
        area: 5.0,
        status: 'available' as LandStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const result = await addField(newField);
      if (!result) {
        console.error('Failed to add field');
      }
    } else if (mode === 'auto') {
      // Auto-detect field
      const autoField = {
        name: `Auto Field ${fields.length + 1}`,
        coordinates: [
          { lat: lat - 0.0015, lng: lng - 0.0015 },
          { lat: lat - 0.0015, lng: lng + 0.0015 },
          { lat: lat + 0.0015, lng: lng + 0.0015 },
          { lat: lat + 0.0015, lng: lng - 0.0015 }
        ],
        area: 3.0,
        status: 'cultivated' as LandStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const result = await addField(autoField);
      if (!result) {
        console.error('Failed to add auto field');
      }
    }
  }, [mode, fields.length, addField]);

  const MapEvents = () => {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  };

  const mapLayers = {
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    street: "https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${isMenuOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${!isMenuOpen && 'justify-center'}`}>
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              {isMenuOpen && <span className="font-bold text-gray-800">Land Manager</span>}
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mode Selection */}
        {isMenuOpen && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">MODE</h3>
            <div className="space-y-2">
              <button
                onClick={() => setMode('view')}
                className={`w-full p-2 rounded-lg border transition-all ${
                  mode === 'view' ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">View Fields</span>
                </div>
              </button>
              <button
                onClick={() => setMode('create')}
                className={`w-full p-2 rounded-lg border transition-all ${
                  mode === 'create' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Create Field</span>
                </div>
              </button>
              <button
                onClick={() => setMode('auto')}
                className={`w-full p-2 rounded-lg border transition-all ${
                  mode === 'auto' ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Radar className="w-4 h-4" />
                  <span className="text-sm font-medium">Auto Detect</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {isMenuOpen && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">STATS</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Fields:</span>
                <span className="font-medium">{fields.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cultivated:</span>
                <span className="font-medium">{fields.filter(f => f.status === 'cultivated').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available:</span>
                <span className="font-medium">{fields.filter(f => f.status === 'available').length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {isMenuOpen && (
          <div className="p-4 border-t border-gray-200 mt-auto">
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs flex items-center justify-center gap-1">
                <Upload className="w-3 h-3" />
                Import
              </button>
              <button className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs flex items-center justify-center gap-1">
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">
              {mode === 'view' && '🗺️ Field View'}
              {mode === 'create' && '➕ Create Field'}
              {mode === 'auto' && '🤖 Auto Detection'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('satellite')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'satellite' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <Satellite className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('street')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'street' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[31.5204, 74.3587]}
            zoom={13}
            className="w-full h-full"
            style={{ background: '#f3f4f6' }}
          >
            <TileLayer
              attribution='&copy; Contributors'
              url={mapLayers[viewMode]}
            />

            {/* Existing Fields */}
            {fields.map((field) => (
              <Polygon
                key={field.id}
                positions={field.coordinates.map(c => [c.lat, c.lng] as [number, number])}
                pathOptions={{
                  color: statusBorderColors[field.status],
                  fillColor: statusColors[field.status],
                  fillOpacity: 0.4,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => setSelectedField(field.id === selectedField ? null : field.id),
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[200px]">
                    <h4 className="font-bold text-gray-900 mb-2">{field.name}</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium capitalize">{field.status}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Area:</span>
                        <span className="font-medium">{field.area?.toFixed(2)} acres</span>
                      </p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setMode('create')}
                        className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteField(field.id)}
                        className="flex-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ))}

            <MapEvents />
          </MapContainer>

          {/* Instructions */}
          {mode === 'create' && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs border-l-4 border-green-500">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-500" />
                Create Mode
              </h4>
              <p className="text-xs text-gray-600">Click anywhere on the map to create a new field.</p>
            </div>
          )}

          {mode === 'auto' && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs border-l-4 border-purple-500">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Radar className="w-4 h-4 text-purple-500" />
                Auto Detection
              </h4>
              <p className="text-xs text-gray-600">Click anywhere to auto-detect land boundaries.</p>
            </div>
          )}

          {mode === 'view' && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs border-l-4 border-blue-500">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                View Mode
              </h4>
              <p className="text-xs text-gray-600">Click fields to view details and manage.</p>
            </div>
          )}

          {/* Field Counter */}
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{fields.length}</div>
              <div className="text-xs text-gray-600">Total Fields</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
