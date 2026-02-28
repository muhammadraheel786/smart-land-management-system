"use client";

import { useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLandStore } from "@/lib/store";
import type { GeoFence, LandStatus } from "@/types";
import { statusColors, statusBorderColors } from "@/lib/map-styles";
import {
  Radar,
  MapPin,
  Layers,
  Settings,
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
  Filter,
  Grid3X3,
  BarChart3,
  Database,
  Upload,
  Download,
  Bell
} from "lucide-react";

interface WorkingGeofenceProps {
  onModeChange?: (mode: string) => void;
}

type ViewMode = 'satellite' | 'hybrid' | 'terrain' | 'street';
type WorkingMode = 'view' | 'create' | 'edit' | 'auto-detect';

export default function WorkingGeofence({ onModeChange }: WorkingGeofenceProps) {
  const { fields, addField, updateField, deleteField } = useLandStore();
  const [viewMode, setViewMode] = useState<ViewMode>('satellite');
  const [workingMode, setWorkingMode] = useState<WorkingMode>('view');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const filteredFields = useMemo(() => {
    return fields.filter(field => 
      field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [fields, searchQuery]);

  const handleMapClick = useCallback(async (e: any) => {
    const { lat, lng } = e.latlng;
    
    if (workingMode === 'create' && isDrawing) {
      setDrawingPoints(prev => [...prev, [lat, lng]]);
    } else if (workingMode === 'auto-detect') {
      const newField = {
        name: `Auto Field ${new Date().toLocaleTimeString()}`,
        coordinates: [
          { lat: lat - 0.001, lng: lng - 0.001 },
          { lat: lat - 0.001, lng: lng + 0.001 },
          { lat: lat + 0.001, lng: lng + 0.001 },
          { lat: lat + 0.001, lng: lng - 0.001 }
        ],
        area: 2.5,
        status: 'available' as LandStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const result = await addField(newField);
      if (!result) {
        console.error('Failed to add auto field');
      }
    } else if (workingMode === 'view') {
      // Find clicked field
      const clickedField = fields.find(field => {
        const coords = field.coordinates.map(c => [c.lat, c.lng] as [number, number]);
        return isPointInPolygon([lat, lng], coords);
      });
      if (clickedField) {
        setSelectedField(clickedField.id);
      }
    }
  }, [workingMode, isDrawing, fields, addField]);

  const isPointInPolygon = (point: [number, number], polygon: [number, number][]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      const intersect = ((yi > point[1]) !== (yj > point[1]))
          && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const finishDrawing = async () => {
    if (drawingPoints.length >= 3) {
      const newField = {
        name: `Manual Field ${new Date().toLocaleTimeString()}`,
        coordinates: drawingPoints.map(([lat, lng]) => ({ lat, lng })),
        area: calculateArea(drawingPoints),
        status: 'available' as LandStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const result = await addField(newField);
      if (!result) {
        console.error('Failed to add manual field');
      }
      setDrawingPoints([]);
      setIsDrawing(false);
    }
  };

  const calculateArea = (points: [number, number][]) => {
    // Simple area calculation
    return Math.random() * 10 + 1; // Placeholder
  };

  const MapEvents = () => {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  };

  const mapLayers = {
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    hybrid: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    terrain: "https://{s}.tile.opentopomap.org/{z}/{y}/{x}.png",
    street: "https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
  };

  const menuItems = [
    { icon: Grid3X3, label: 'Fields', count: fields.length },
    { icon: BarChart3, label: 'Analytics', count: null },
    { icon: Database, label: 'Database', count: null },
    { icon: Settings, label: 'Settings', count: null }
  ];

  const workingModes = [
    { mode: 'view' as WorkingMode, icon: Eye, label: 'View Fields' },
    { mode: 'create' as WorkingMode, icon: Plus, label: 'Create Field' },
    { mode: 'edit' as WorkingMode, icon: Edit3, label: 'Edit Fields' },
    { mode: 'auto-detect' as WorkingMode, icon: Radar, label: 'Auto Detect' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isMenuOpen ? 'w-80' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${!isMenuOpen && 'justify-center'}`}>
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              {isMenuOpen && <span className="font-bold text-gray-800">GeoFence Pro</span>}
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Working Mode */}
        {isMenuOpen && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">MODE</h3>
            <div className="space-y-2">
              {workingModes.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setWorkingMode(mode);
                    if (mode === 'create') {
                      setIsDrawing(true);
                      setDrawingPoints([]);
                    } else {
                      setIsDrawing(false);
                      setDrawingPoints([]);
                    }
                  }}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    workingMode === mode
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        {isMenuOpen && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map(({ icon: Icon, label, count }) => (
              <button
                key={label}
                className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <Icon className="w-4 h-4 text-gray-600" />
                {isMenuOpen && (
                  <>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    {count !== null && (
                      <span className="ml-auto bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                        {count}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isMenuOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs flex items-center justify-center gap-1">
                <Upload className="w-3 h-3" />
                Import
              </button>
              <button className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs flex items-center justify-center gap-1">
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
              {workingMode === 'view' && 'Field View'}
              {workingMode === 'create' && 'Create Field'}
              {workingMode === 'edit' && 'Edit Fields'}
              {workingMode === 'auto-detect' && 'Auto Detection'}
            </h1>
            {workingMode === 'create' && isDrawing && (
              <button
                onClick={finishDrawing}
                disabled={drawingPoints.length < 3}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg text-sm"
              >
                Finish ({drawingPoints.length} points)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {Object.entries(mapLayers).map(([mode, url]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as ViewMode)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === mode ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  {mode === 'satellite' && <Satellite className="w-4 h-4" />}
                  {mode === 'street' && <MapIcon className="w-4 h-4" />}
                  {mode === 'terrain' && <Compass className="w-4 h-4" />}
                  {mode === 'hybrid' && <Layers className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[31.5204, 74.3587]}
            zoom={13}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; Contributors'
              url={mapLayers[viewMode]}
            />
            
            {viewMode === 'hybrid' && (
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
                opacity={0.4}
              />
            )}

            {/* Existing Fields */}
            {filteredFields.map((field) => (
              <Polygon
                key={field.id}
                positions={field.coordinates.map(c => [c.lat, c.lng] as [number, number])}
                pathOptions={{
                  color: selectedField === field.id ? '#3B82F6' : statusBorderColors[field.status],
                  fillColor: selectedField === field.id ? '#3B82F6' : statusColors[field.status],
                  fillOpacity: selectedField === field.id ? 0.6 : 0.4,
                  weight: selectedField === field.id ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => setSelectedField(field.id === selectedField ? null : field.id),
                }}
              >
                <Popup>
                  <div className="p-3">
                    <h4 className="font-bold">{field.name}</h4>
                    <p className="text-sm text-gray-600">Status: {field.status}</p>
                    <p className="text-sm text-gray-600">Area: {field.area?.toFixed(2)} acres</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setWorkingMode('edit')}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteField(field.id)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Drawing Preview */}
            {drawingPoints.length > 0 && (
              <Polygon
                positions={drawingPoints}
                pathOptions={{
                  color: '#10B981',
                  fillColor: '#10B981',
                  fillOpacity: 0.3,
                  weight: 2,
                  dashArray: '5, 5',
                }}
              />
            )}

            {/* Drawing Points */}
            {drawingPoints.map((point, index) => (
              <Marker
                key={index}
                position={point}
                icon={L.divIcon({
                  html: '<div class="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>',
                  className: 'custom-marker',
                  iconSize: [12, 12],
                } as any)}
              />
            ))}

            <MapEvents />
          </MapContainer>

          {/* Instructions */}
          {workingMode === 'create' && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
              <h4 className="font-semibold text-sm mb-2">Drawing Mode</h4>
              <p className="text-xs text-gray-600">Click on the map to add points. Click "Finish" when done.</p>
            </div>
          )}

          {workingMode === 'auto-detect' && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
              <h4 className="font-semibold text-sm mb-2">Auto Detection</h4>
              <p className="text-xs text-gray-600">Click anywhere on the map to auto-detect land area.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
