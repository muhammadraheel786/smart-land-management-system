"use client";

import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLandStore } from "@/lib/store";
import type { GeoFence, LandStatus } from "@/types";
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
  Download,
  Palette,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Droplets,
  Sun,
  Wind
} from "lucide-react";

// Modern color palette
const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  gray: {
    50: '#f9fafb',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
};

const fieldStatusColors = {
  cultivated: colors.success[500],
  available: colors.warning[500],
  uncultivated: colors.gray[400],
  not_usable: colors.gray[600],
  thaka: colors.purple[500],
};

const fieldStatusGradients = {
  cultivated: 'linear-gradient(135deg, #22c55e, #16a34a)',
  available: 'linear-gradient(135deg, #f59e0b, #d97706)',
  uncultivated: 'linear-gradient(135deg, #94a3b8, #64748b)',
  not_usable: 'linear-gradient(135deg, #475569, #1e293b)',
  thaka: 'linear-gradient(135deg, #a855f7, #7e22ce)',
};

export default function BeautifulGeofence() {
  const { fields, addField, deleteField } = useLandStore();
  const [viewMode, setViewMode] = useState<'satellite' | 'street'>('satellite');
  const [mode, setMode] = useState<'view' | 'create' | 'auto'>('view');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const handleMapClick = useCallback((e: any) => {
    const { lat, lng } = e.latlng;
    
    if (mode === 'create') {
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
      addField(newField);
    } else if (mode === 'auto') {
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
      addField(autoField);
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

  const modeButtons = [
    { 
      mode: 'view' as const, 
      icon: Eye, 
      label: 'View Fields', 
      color: colors.primary[500],
      bgColor: colors.primary[50],
      description: 'Explore and manage your fields'
    },
    { 
      mode: 'create' as const, 
      icon: Plus, 
      label: 'Create Field', 
      color: colors.success[500],
      bgColor: colors.success[50],
      description: 'Draw new field boundaries'
    },
    { 
      mode: 'auto' as const, 
      icon: Radar, 
      label: 'Auto Detect', 
      color: colors.purple[500],
      bgColor: colors.purple[50],
      description: 'AI-powered land detection'
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Beautiful Sidebar */}
      <div className={`${isMenuOpen ? 'w-80' : 'w-20'} bg-white/95 backdrop-blur-xl shadow-2xl transition-all duration-500 flex flex-col border-r border-gray-100`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${!isMenuOpen && 'justify-center'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              {isMenuOpen && (
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    TerraFence Pro
                  </h1>
                  <p className="text-xs text-gray-500">Advanced Land Management</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Mode Selection */}
        {isMenuOpen && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-800">Mode Selection</h2>
            </div>
            <div className="space-y-3">
              {modeButtons.map(({ mode, icon: Icon, label, color, bgColor, description }) => (
                <button
                  key={mode}
                  onClick={() => setMode(mode)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    mode === mode
                      ? `border-${color} shadow-lg`
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: mode === mode ? bgColor : 'white',
                    borderColor: mode === mode ? color : undefined
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-2 rounded-xl"
                      style={{ backgroundColor: mode === mode ? color : `${color}20` }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Beautiful Stats */}
        {isMenuOpen && (
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800">Field Statistics</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{fields.length}</div>
                <div className="text-sm text-blue-700">Total Fields</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl border border-green-200">
                <div className="text-3xl font-bold text-green-600">
                  {fields.filter(f => f.status === 'cultivated').length}
                </div>
                <div className="text-sm text-green-700">Cultivated</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-2xl border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">
                  {fields.filter(f => f.status === 'available').length}
                </div>
                <div className="text-sm text-yellow-700">Available</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
                <div className="text-3xl font-bold text-purple-600">
                  {fields.reduce((sum, f) => sum + (f.area || 0), 0).toFixed(1)}
                </div>
                <div className="text-sm text-purple-700">Total Acres</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {isMenuOpen && (
          <div className="p-6 border-t border-gray-100 mt-auto">
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl font-medium shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button className="p-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-medium shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Beautiful Top Bar */}
        <div className="bg-white/80 backdrop-blur-xl shadow-lg p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {mode === 'view' && <Eye className="w-6 h-6 text-blue-500" />}
                {mode === 'create' && <Plus className="w-6 h-6 text-green-500" />}
                {mode === 'auto' && <Radar className="w-6 h-6 text-purple-500" />}
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {mode === 'view' && '🗺️ Field Explorer'}
                  {mode === 'create' && '✨ Create Fields'}
                  {mode === 'auto' && '🤖 AI Detection'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => setViewMode('satellite')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    viewMode === 'satellite' 
                      ? 'bg-white shadow-md text-blue-600' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <Satellite className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('street')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    viewMode === 'street' 
                      ? 'bg-white shadow-md text-blue-600' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Beautiful Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[31.5204, 74.3587]}
            zoom={13}
            className="w-full h-full"
            style={{ background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)' }}
          >
            <TileLayer
              attribution='&copy; Contributors'
              url={mapLayers[viewMode]}
            />

            {/* Beautiful Field Polygons */}
            {fields.map((field) => (
              <Polygon
                key={field.id}
                positions={field.coordinates.map(c => [c.lat, c.lng] as [number, number])}
                pathOptions={{
                  color: fieldStatusColors[field.status as keyof typeof fieldStatusColors],
                  fillColor: fieldStatusColors[field.status as keyof typeof fieldStatusColors],
                  fillOpacity: 0.3,
                  weight: 3,
                  dashArray: field.status === 'available' ? '8, 4' : undefined,
                }}
                eventHandlers={{
                  click: () => setSelectedField(field.id === selectedField ? null : field.id),
                }}
              >
                <Popup>
                  <div className="p-4 min-w-[250px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ 
                          background: fieldStatusGradients[field.status as keyof typeof fieldStatusGradients] 
                        }}
                      >
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{field.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{field.status}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Area:</span>
                        <span className="font-bold text-gray-900">{field.area?.toFixed(2)} acres</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMode('create')}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteField(field.id)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ))}

            <MapEvents />
          </MapContainer>

          {/* Beautiful Instructions */}
          {mode === 'create' && (
            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 max-w-xs border-l-4 border-green-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-800">Create Mode</h3>
              </div>
              <p className="text-sm text-gray-600">Click anywhere on the map to create a new field with beautiful boundaries.</p>
            </div>
          )}

          {mode === 'auto' && (
            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 max-w-xs border-l-4 border-purple-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <Radar className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-800">AI Detection</h3>
              </div>
              <p className="text-sm text-gray-600">Click anywhere to auto-detect land boundaries with AI.</p>
            </div>
          )}

          {mode === 'view' && (
            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 max-w-xs border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-800">View Mode</h3>
              </div>
              <p className="text-sm text-gray-600">Click fields to view details and manage your land.</p>
            </div>
          )}

          {/* Beautiful Field Counter */}
          <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {fields.length}
              </div>
              <div className="text-sm text-gray-600">Total Fields</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
