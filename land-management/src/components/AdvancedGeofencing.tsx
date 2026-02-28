"use client";

import { useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Circle, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLandStore } from "@/lib/store";
import type { GeoFence, LandStatus } from "@/types";
import { statusColors, statusBorderColors, statusGradients } from "@/lib/map-styles";
import { autoLandDetection, DetectedLandParcel } from "@/lib/auto-detection";
import {
  Radar,
  MapPin,
  Layers,
  Settings,
  Menu,
  X,
  Zap,
  Shield,
  Database,
  BarChart3,
  Users,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  Edit3,
  Trash2,
  Plus,
  Grid3X3,
  List,
  Eye,
  EyeOff,
  Compass,
  Satellite,
  Map as MapIcon,
  Thermometer,
  Droplets,
  Sun,
  Wind,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Navigation,
  Maximize2,
  Minimize2,
  Wrench
} from "lucide-react";

interface AdvancedGeofenceProps {
  onModeChange?: (mode: string) => void;
}

type ViewMode = 'map' | 'satellite' | 'terrain' | 'hybrid';
type MenuSection = 'fields' | 'analytics' | 'tools' | 'settings' | 'exports';
type GeofenceMode = 'view' | 'create' | 'edit' | 'analyze' | 'auto-detect';

export default function AdvancedGeofencing({ onModeChange }: AdvancedGeofenceProps) {
  const { fields, addField, updateField, deleteField } = useLandStore();
  const [viewMode, setViewMode] = useState<ViewMode>('satellite');
  const [activeMenu, setActiveMenu] = useState<MenuSection>('fields');
  const [geofenceMode, setGeofenceMode] = useState<GeofenceMode>('view');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detectedParcels, setDetectedParcels] = useState<DetectedLandParcel[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [weatherLayer, setWeatherLayer] = useState(false);

  const filteredFields = useMemo(() => {
    return fields.filter(field => 
      field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [fields, searchQuery]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    if (geofenceMode === 'auto-detect') {
      try {
        const parcel = await autoLandDetection.quickDetect(lat, lng);
        if (parcel) {
          setDetectedParcels(prev => [...prev, parcel]);
        }
      } catch (error) {
        console.error('Auto-detection failed:', error);
      }
    }
  }, [geofenceMode]);

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        handleMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const menuItems = [
    {
      section: 'fields' as MenuSection,
      icon: Grid3X3,
      label: 'Fields',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      section: 'analytics' as MenuSection,
      icon: BarChart3,
      label: 'Analytics',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      section: 'tools' as MenuSection,
      icon: Wrench,
      label: 'Tools',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      section: 'settings' as MenuSection,
      icon: Settings,
      label: 'Settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      section: 'exports' as MenuSection,
      icon: Database,
      label: 'Exports',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const geofenceModes = [
    { mode: 'view' as GeofenceMode, icon: Eye, label: 'View Mode', description: 'View and analyze fields' },
    { mode: 'create' as GeofenceMode, icon: Plus, label: 'Create Mode', description: 'Draw new field boundaries' },
    { mode: 'edit' as GeofenceMode, icon: Edit3, label: 'Edit Mode', description: 'Modify existing fields' },
    { mode: 'analyze' as GeofenceMode, icon: BarChart3, label: 'Analyze Mode', description: 'Deep field analysis' },
    { mode: 'auto-detect' as GeofenceMode, icon: Radar, label: 'Auto Detect', description: 'AI-powered detection' }
  ];

  const viewModes = [
    { mode: 'satellite' as ViewMode, icon: Satellite, label: 'Satellite' },
    { mode: 'hybrid' as ViewMode, icon: Layers, label: 'Hybrid' },
    { mode: 'terrain' as ViewMode, icon: Compass, label: 'Terrain' },
    { mode: 'map' as ViewMode, icon: MapIcon, label: 'Street' }
  ];

  const mapLayers = {
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    hybrid: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    terrain: "https://{s}.tile.opentopomap.org/{z}/{y}/{x}.png",
    map: "https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Advanced Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur-md border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left Section - Logo and Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Navigation className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Advanced GeoFencing</h1>
            </div>
          </div>

          {/* Center Section - Search and Filters */}
          <div className="flex items-center gap-3 flex-1 max-w-2xl mx-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search fields, locations, or coordinates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Right Section - View Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              {viewModes.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded transition-colors ${
                    viewMode === mode ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </header>

      {/* Advanced Sidebar Menu */}
      <aside className={`absolute left-0 top-16 bottom-0 z-[999] bg-slate-900 border-r border-slate-700 transition-all duration-300 ${
        isMenuOpen ? 'w-80' : 'w-0'
      } overflow-hidden`}>
        <div className="p-4 space-y-6">
          {/* Geofence Mode Selector */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Mode</h3>
            <div className="space-y-2">
              {geofenceModes.map(({ mode, icon: Icon, label, description }) => (
                <button
                  key={mode}
                  onClick={() => setGeofenceMode(mode)}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    geofenceMode === mode
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <div className="text-left">
                      <p className="font-medium">{label}</p>
                      <p className={`text-xs ${geofenceMode === mode ? 'text-blue-100' : 'text-gray-500'}`}>
                        {description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Sections */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sections</h3>
            <div className="space-y-1">
              {menuItems.map(({ section, icon: Icon, label, color, bgColor }) => (
                <button
                  key={section}
                  onClick={() => setActiveMenu(section)}
                  className={`w-full p-3 rounded-lg transition-all ${
                    activeMenu === section
                      ? `${bgColor} ${color} border-l-4`
                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <Upload className="w-3 h-3" />
                <span className="text-xs">Import</span>
              </button>
              <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <Download className="w-3 h-3" />
                <span className="text-xs">Export</span>
              </button>
              <button className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <Shield className="w-3 h-3" />
                <span className="text-xs">Secure</span>
              </button>
              <button className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <Bell className="w-3 h-3" />
                <span className="text-xs">Alerts</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Advanced Map Container */}
      <main className={`absolute inset-0 pt-16 transition-all duration-300 ${
        isMenuOpen ? 'ml-80' : 'ml-0'
      }`}>
        <MapContainer
          center={[31.5204, 74.3587]}
          zoom={13}
          className="w-full h-full"
          style={{ background: '#0f172a' }}
        >
          <TileLayer
            attribution='&copy; Contributors'
            url={mapLayers[viewMode]}
          />
          
          {/* Hybrid Overlay */}
          {viewMode === 'hybrid' && (
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
              opacity={0.4}
            />
          )}

          {/* Weather Overlay */}
          {weatherLayer && (
            <div className="absolute top-4 right-4 z-[1000] bg-slate-800/90 backdrop-blur-md rounded-lg p-3">
              <div className="flex items-center gap-2 text-white">
                <Thermometer className="w-4 h-4 text-red-400" />
                <span className="text-sm">28°C</span>
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-sm">65%</span>
                <Wind className="w-4 h-4 text-gray-400" />
                <span className="text-sm">12 km/h</span>
              </div>
            </div>
          )}

          {/* Field Polygons */}
          {filteredFields.map((field) => (
            <Polygon
              key={field.id}
              positions={field.coordinates.map(c => [c.lat, c.lng] as [number, number])}
              pathOptions={{
                color: selectedFields.has(field.id) ? '#3B82F6' : statusBorderColors[field.status],
                fillColor: selectedFields.has(field.id) ? '#3B82F6' : statusColors[field.status],
                fillOpacity: selectedFields.has(field.id) ? 0.6 : 0.4,
                weight: selectedFields.has(field.id) ? 4 : 2,
                dashArray: geofenceMode === 'edit' ? '8, 4' : undefined,
              }}
              eventHandlers={{
                click: () => {
                  if (geofenceMode === 'view') {
                    setSelectedFields(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(field.id)) {
                        newSet.delete(field.id);
                      } else {
                        newSet.add(field.id);
                      }
                      return newSet;
                    });
                  }
                },
              }}
            >
              <Popup>
                <div className="p-3 bg-white rounded-lg shadow-lg min-w-[200px]">
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
                      onClick={() => setGeofenceMode('edit')}
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

          {/* Detected Parcels */}
          {detectedParcels.map((parcel) => (
            <Polygon
              key={parcel.id}
              positions={parcel.coordinates.map(c => [c.lat, c.lng] as [number, number])}
              pathOptions={{
                color: '#10B981',
                fillColor: '#10B981',
                fillOpacity: 0.3,
                weight: 3,
                dashArray: '12, 6',
              }}
            >
              <Popup>
                <div className="p-3 bg-white rounded-lg shadow-lg">
                  <h4 className="font-bold text-green-700 mb-2">Detected Land</h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Area:</span>
                      <span className="font-medium">{parcel.area.toFixed(2)} acres</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{parcel.landType}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-medium">{(parcel.confidence * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      addField({
                        name: `Auto-detected Field ${new Date().toLocaleTimeString()}`,
                        coordinates: parcel.coordinates,
                        area: parcel.area,
                        status: 'available',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      });
                      setDetectedParcels(prev => prev.filter(p => p.id !== parcel.id));
                    }}
                    className="w-full mt-3 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Add to Fields
                  </button>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Grid implementation would go here */}
            </div>
          )}

          <MapClickHandler />
        </MapContainer>
      </main>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-3 rounded-full shadow-lg transition-all ${
            showGrid ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Toggle Grid"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setWeatherLayer(!weatherLayer)}
          className={`p-3 rounded-full shadow-lg transition-all ${
            weatherLayer ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Toggle Weather"
        >
          <Thermometer className="w-5 h-5" />
        </button>
        <button
          onClick={() => setDetectedParcels([])}
          className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
          title="Clear Detections"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-slate-900/90 backdrop-blur-md border-t border-slate-700">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Fields: {filteredFields.length}</span>
            <span>Selected: {selectedFields.size}</span>
            <span>Mode: {geofenceMode}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>View: {viewMode}</span>
            <span>Grid: {showGrid ? 'On' : 'Off'}</span>
            <span>Weather: {weatherLayer ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
