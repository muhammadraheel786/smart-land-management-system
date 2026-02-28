"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLandStore } from "@/lib/store";
import type { GeoFence, LandStatus } from "@/types";
// Demo data imports removed as per user request to clean up seed data
import { MAPBOX_TOKEN, getMapboxTileUrl } from "@/lib/mapbox";
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
  Wind,
  DollarSign,
  Calendar,
  Activity,
  Users,
  Settings,
  Bell,
  Filter,
  Database,
  Shield,
  ChevronDown
} from "lucide-react";

// Enhanced modern color palette
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

export default function ProfessionalGeofence() {
  const { fields, addField, deleteField, expenses, incomes, waterRecords } = useLandStore();
  const [viewMode, setViewMode] = useState<'satellite' | 'street'>('satellite');
  const [mode, setMode] = useState<'view' | 'create' | 'auto'>('view');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const demoSeededRef = useRef(false);

  // Removed demo seeding as per user request to remove all seed data
  useEffect(() => {
    demoSeededRef.current = true;
  }, []);

  const handleMapClick = useCallback(async (e: any) => {
    const { lat, lng } = e.latlng;

    // Import reverseGeocode dynamically or use from scope if already imported
    const { reverseGeocode } = await import("@/lib/geo");
    const result = await reverseGeocode(lat, lng);
    const addressString = result?.humanAddress || `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    if (mode === 'create') {
      const newField = {
        name: `Field ${fields.length + 1}`,
        address: addressString, // Simplified "Place, City"
        locationName: addressString.split(',')[0], // Primary location name
        detailedAddress: result ? {
          displayName: result.displayName, // Key added for full display if needed
          road: result.road,
          suburb: result.suburb,
          city: result.city,
          village: result.village,
          state: result.state,
          postcode: result.postcode,
          country: result.country
        } : undefined,
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
        address: addressString, // Store the full location
        locationName: addressString.split(',')[0],
        detailedAddress: result ? {
          road: result.road,
          suburb: result.suburb,
          city: result.city,
          village: result.village,
          state: result.state,
          postcode: result.postcode,
          country: result.country
        } : undefined,
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
    satellite: MAPBOX_TOKEN
      ? getMapboxTileUrl("satellite")
      : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    street: MAPBOX_TOKEN
      ? getMapboxTileUrl("streets")
      : "https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png",
  };

  const tileLayerOptions = {
    maxZoom: 22,
    maxNativeZoom: MAPBOX_TOKEN ? 22 : 19,
    tileSize: MAPBOX_TOKEN ? 512 : 256,
    zoomOffset: MAPBOX_TOKEN ? -1 : 0, // Adjust for 512px tiles
  };

  // Calculate statistics
  const stats = {
    totalFields: fields.length,
    cultivatedFields: fields.filter(f => f.status === 'cultivated').length,
    availableFields: fields.filter(f => f.status === 'available').length,
    totalAcres: fields.reduce((sum, f) => sum + (f.area || 0), 0),
    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    totalIncome: incomes.reduce((sum, i) => sum + i.amount, 0),
    netProfit: incomes.reduce((sum, i) => sum + i.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Professional Sidebar */}
      <div className={`${isMenuOpen ? 'w-96' : 'w-20'} bg-white/95 backdrop-blur-xl shadow-2xl transition-all duration-500 flex flex-col border-r border-gray-100`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${!isMenuOpen && 'justify-center'}`}>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              {isMenuOpen && (
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    TerraFence Pro
                  </h1>
                  <p className="text-sm text-gray-500">Advanced Land Management System</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200"
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
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${mode === mode
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
                      className="p-3 rounded-xl"
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

        {/* Search and Filters */}
        {isMenuOpen && (
          <div className="p-6 border-t border-gray-100">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search fields, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full p-3 rounded-xl border-2 transition-all duration-200 ${showFilters ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>Advanced Filters</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Professional Statistics */}
        {isMenuOpen && (
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800">Field Analytics</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{stats.totalFields}</div>
                <div className="text-sm text-blue-700">Total Fields</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl border border-green-200">
                <div className="text-3xl font-bold text-green-600">{stats.cultivatedFields}</div>
                <div className="text-sm text-green-700">Cultivated</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-2xl border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">{stats.availableFields}</div>
                <div className="text-sm text-yellow-700">Available</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
                <div className="text-3xl font-bold text-purple-600">{stats.totalAcres.toFixed(1)}</div>
                <div className="text-sm text-purple-700">Total Acres</div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Financial Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Income:</span>
                  <span className="font-bold text-green-600">${stats.totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Expenses:</span>
                  <span className="font-bold text-red-600">${stats.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Net Profit:</span>
                  <span className={`font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${stats.netProfit.toLocaleString()}
                  </span>
                </div>
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
              <button className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl font-medium shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                Secure
              </button>
              <button className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl font-medium shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2">
                <Bell className="w-4 h-4" />
                Alerts
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Professional Top Bar */}
        <div className="bg-white/90 backdrop-blur-xl shadow-lg p-6 border-b border-gray-100">
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
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Live</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => setViewMode('satellite')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${viewMode === 'satellite'
                    ? 'bg-white shadow-md text-blue-600'
                    : 'hover:bg-gray-200 text-gray-600'
                    }`}
                >
                  <Satellite className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('street')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${viewMode === 'street'
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
            zoom={15}
            minZoom={3}
            maxZoom={22}
            zoomControl={true}
            className="w-full h-full"
            style={{ background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)' }}
          >
            <TileLayer
              attribution={MAPBOX_TOKEN ? "&copy; Mapbox &copy; OpenStreetMap" : "&copy; OpenStreetMap"}
              url={mapLayers[viewMode]}
              maxZoom={tileLayerOptions.maxZoom}
              maxNativeZoom={tileLayerOptions.maxNativeZoom}
              tileSize={tileLayerOptions.tileSize}
              zoomOffset={tileLayerOptions.zoomOffset}
            />

            {/* Beautiful Field Polygons */}
            {fields.map((field, index) => (
              <Polygon
                key={field.id ? `${field.id}-${index}` : `field-${index}`}
                positions={field.coordinates.map(c => [c.lat, c.lng] as [number, number])}
                pathOptions={{
                  color: fieldStatusColors[field.status as keyof typeof fieldStatusColors],
                  fillColor: fieldStatusColors[field.status as keyof typeof fieldStatusColors],
                  fillOpacity: 0.4,
                  weight: 3,
                  dashArray: field.status === 'available' ? '8, 4' : undefined,
                }}
                eventHandlers={{
                  click: () => setSelectedField(field.id === selectedField ? null : field.id),
                }}
              >
                <Popup>
                  <div className="p-4 min-w-[320px] max-h-[500px] overflow-y-auto no-scrollbar">
                    {/* Header Card */}
                    <div className="flex items-center gap-4 mb-4 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-110"
                        style={{
                          background: fieldStatusGradients[field.status as keyof typeof fieldStatusGradients]
                        }}
                      >
                        <Target className="w-7 h-7 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-xl truncate">{field.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${field.status === 'cultivated' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{field.status.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Address Card */}
                    {field.address && (
                      <div className="mb-4 space-y-2">
                        <div className="p-3 bg-blue-50/50 backdrop-blur-sm border border-blue-100 rounded-2xl flex items-start gap-3 group transition-all hover:bg-blue-100/50">
                          <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-[11px] text-blue-900 leading-relaxed font-bold mb-1">Detailed Geographic Profile</p>
                            <p className="text-[10px] text-blue-800 leading-relaxed font-medium">{field.address}</p>
                          </div>
                        </div>

                        {field.detailedAddress && (
                          <div className="grid grid-cols-2 gap-2 pl-1">
                            {field.detailedAddress.village && (
                              <div className="text-[9px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                <span className="font-bold uppercase text-gray-400 mr-1">Village:</span> {field.detailedAddress.village}
                              </div>
                            )}
                            {field.detailedAddress.city && (
                              <div className="text-[9px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                <span className="font-bold uppercase text-gray-400 mr-1">City:</span> {field.detailedAddress.city}
                              </div>
                            )}
                            {field.detailedAddress.suburb && (
                              <div className="text-[9px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                <span className="font-bold uppercase text-gray-400 mr-1">Area:</span> {field.detailedAddress.suburb}
                              </div>
                            )}
                            {field.detailedAddress.state && (
                              <div className="text-[9px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                <span className="font-bold uppercase text-gray-400 mr-1">State:</span> {field.detailedAddress.state}
                              </div>
                            )}
                            {field.detailedAddress.country && (
                              <div className="text-[9px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                <span className="font-bold uppercase text-gray-400 mr-1">Country:</span> {field.detailedAddress.country}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Grid3X3 className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-bold tracking-tighter">Area</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{field.area?.toFixed(2)} <span className="text-[10px] text-gray-400">Acres</span></div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-bold tracking-tighter">Created</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{new Date(field.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                      </div>
                    </div>

                    {/* Financial Performance Section */}
                    {(() => {
                      const fExp = expenses.filter(e => e.fieldId === field.id).reduce((s, e) => s + e.amount, 0);
                      const fInc = incomes.filter(i => i.fieldId === field.id).reduce((s, i) => s + i.amount, 0);
                      const net = fInc - fExp;
                      return (
                        <div className="mb-4 space-y-2 p-3 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2">Financial Performance</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center px-2">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-xs text-gray-600">Total Revenue</span>
                              </div>
                              <span className="text-xs font-bold text-green-600">Rs {fInc.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-xs text-gray-600">Total Investment</span>
                              </div>
                              <span className="text-xs font-bold text-red-500">Rs {fExp.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-gray-200 my-1 mx-2"></div>
                            <div className="flex justify-between items-center px-2 py-1 bg-white rounded-xl shadow-sm">
                              <span className="text-xs font-bold text-gray-700">Net Profit</span>
                              <span className={`text-sm font-black ${net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                Rs {net.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Operational Insights */}
                    {(() => {
                      const fWater = waterRecords.filter(w => w.fieldId === field.id).sort((a, b) => b.date.localeCompare(a.date));
                      const last = fWater[0];
                      return (
                        <div className="mb-6 p-4 bg-blue-500/5 rounded-2xl border border-blue-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <h5 className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">Irrigation Status</h5>
                          </div>
                          {last ? (
                            <div className="flex justify-between items-center">
                              <div className="text-[10px] text-gray-500 bg-white px-2 py-1 rounded-lg border border-blue-50 shadow-sm">
                                Last: <span className="font-bold text-blue-600">{new Date(last.date).toLocaleDateString()}</span>
                              </div>
                              <div className="text-[10px] text-gray-500 bg-white px-2 py-1 rounded-lg border border-blue-50 shadow-sm">
                                Duration: <span className="font-bold text-blue-600">{last.durationMinutes} min</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No irrigation records found for this sector.</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode('create')}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/20 transform active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        EDIT
                      </button>
                      <button
                        onClick={() => deleteField(field.id)}
                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-red-500/20 transform active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        DELETE
                      </button>
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
                {stats.totalFields}
              </div>
              <div className="text-sm text-gray-600">Total Fields</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
