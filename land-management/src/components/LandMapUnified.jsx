"use client";

import { useState, useCallback, useEffect } from "react";
import { useMap } from "react-leaflet";
import MapComponent from "./MapComponent";
import DrawControls from "./DrawControls";
import Sidebar from "./Sidebar";
import { useFieldState } from "@/hooks/useFieldState";
import { useMapDraw } from "@/hooks/useMapDraw";
import { 
  Satellite, 
  Layers, 
  Navigation, 
  Search, 
  Loader2, 
  Download,
  ZoomIn,
  ZoomOut
} from "lucide-react";

// Map controls component
function MapControls({ map, viewMode, setViewMode, onCenterOnMe, onGoToPlace, goToQuery, setGoToQuery, goToLoading }) {
  const [zoom, setZoom] = useState(14);

  useEffect(() => {
    if (map) {
      setZoom(map.getZoom());
      
      const handleZoom = () => setZoom(map.getZoom());
      map.on('zoomend', handleZoom);
      
      return () => map.off('zoomend', handleZoom);
    }
  }, [map]);

  const handleZoomIn = () => {
    if (map) map.zoomIn();
  };

  const handleZoomOut = () => {
    if (map) map.zoomOut();
  };

  return (
    <div className="absolute right-4 top-2 z-[1500] flex flex-col gap-2">
      {/* Search bar */}
      <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-black/70 backdrop-blur-md overflow-hidden">
        <Search className="h-4 w-4 ml-3 text-white shrink-0" />
        <input
          type="text"
          value={goToQuery}
          onChange={(e) => setGoToQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onGoToPlace()}
          placeholder="Go to place"
          className="w-48 bg-transparent py-2.5 pr-3 pl-1 text-sm text-white placeholder-gray-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={onGoToPlace}
          disabled={goToLoading}
          className="bg-green-600 px-3 py-2.5 text-white hover:bg-green-500 disabled:opacity-50"
        >
          {goToLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Go"}
        </button>
      </div>

      {/* Layer toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-black/70 p-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setViewMode?.("satellite")}
          className={`flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            viewMode === "satellite" 
              ? "bg-green-500 text-white" 
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
        >
          <Satellite className="h-4 w-4" />
          <span>Satellite</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode?.("street")}
          className={`flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            viewMode === "street" 
              ? "bg-green-500 text-white" 
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Street</span>
        </button>
      </div>

      {/* Zoom controls */}
      <div className="flex flex-col gap-1 rounded-lg border border-white/20 bg-black/70 p-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={handleZoomIn}
          className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="text-center text-xs text-white/60 font-medium">
          {zoom}
        </div>
        <button
          type="button"
          onClick={handleZoomOut}
          className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-1 rounded-lg border border-white/20 bg-black/70 p-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onCenterOnMe?.()}
          className="rounded-lg p-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Center on my location"
        >
          <Navigation className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white"
          title="Export data"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Map wrapper to get map instance
function MapWrapper({ children, onMapReady }) {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return children;
}

export default function LandMapUnified() {
  const fieldState = useFieldState();
  const [mapInstance, setMapInstance] = useState(null);
  const [activeTab, setActiveTab] = useState("search");
  
  const {
    locationQuery,
    setLocationQuery,
    areaAcres,
    setAreaAcres,
    fieldName,
    setFieldName,
    status,
    setStatus,
    loading,
    error,
    saving,
    preview,
    clearPreview,
    drawActive,
    setDrawActive,
    drawShape,
    setDrawShape,
    viewMode,
    setViewMode,
    selectedField,
    setSelectedField,
    goToQuery,
    setGoToQuery,
    goToLoading,
    goToTarget,
    mapCenter,
    mapZoom,
    handleSearch,
    handleMyLocation,
    handleCoordinatesApply,
    handleDrawFinish,
    handleSaveField,
    handleFieldClick,
    handleDeleteField,
    handleGoToPlace,
    handleCenterOnMe,
    fields,
    fieldsCount,
  } = fieldState;

  const drawState = useMapDraw(handleDrawFinish, () => setDrawActive?.(false));

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    if (tabId !== "draw") {
      setDrawActive?.(false);
    }
  }, [setDrawActive]);

  const handleDrawStart = useCallback(() => {
    setDrawActive?.(true);
    drawState.startDrawing();
  }, [drawState, setDrawActive]);

  const handleSidebarToggle = useCallback(() => {
    // This will be handled by the sidebar component itself
  }, []);

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={true}
        onToggle={handleSidebarToggle}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        locationQuery={locationQuery}
        onLocationQueryChange={setLocationQuery}
        areaAcres={areaAcres}
        onAreaAcresChange={setAreaAcres}
        fieldName={fieldName}
        onFieldNameChange={setFieldName}
        status={status}
        onStatusChange={setStatus}
        loading={loading}
        error={error}
        preview={preview}
        saving={saving}
        onSearch={handleSearch}
        onMyLocation={handleMyLocation}
        onCoordinatesApply={handleCoordinatesApply}
        onDrawStart={handleDrawStart}
        onSaveField={handleSaveField}
        onClearPreview={clearPreview}
        fieldsCount={fieldsCount}
      />

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapComponent
          center={mapCenter}
          zoom={mapZoom}
          viewMode={viewMode}
          fields={fields}
          selectedField={selectedField}
          preview={preview}
          onFieldClick={handleFieldClick}
        >
          <MapWrapper onMapReady={setMapInstance}>
            {drawActive && (
              <DrawControls
                isActive={drawActive}
                shape={drawShape}
                onFinish={handleDrawFinish}
                onCancel={() => setDrawActive(false)}
                onShapeChange={setDrawShape}
                drawState={drawState}
              />
            )}
          </MapWrapper>
        </MapComponent>

        {/* Map Controls */}
        {mapInstance && (
          <MapControls
            map={mapInstance}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onCenterOnMe={handleCenterOnMe}
            onGoToPlace={handleGoToPlace}
            goToQuery={goToQuery}
            setGoToQuery={setGoToQuery}
            goToLoading={goToLoading}
          />
        )}

        {/* Field Info Panel */}
        {selectedField && (
          <div className="absolute right-4 top-4 w-80 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-4 text-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">{selectedField.name}</h3>
              <button
                onClick={() => setSelectedField(null)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="capitalize">{selectedField.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Area:</span>
                <span>{selectedField.area?.toFixed(2)} acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Points:</span>
                <span>{selectedField.coordinates?.length || 0}</span>
              </div>
              {selectedField.address && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-gray-400 text-xs mb-1">Address:</div>
                  <div className="text-xs">{selectedField.address}</div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleDeleteField(selectedField.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm"
              >
                Delete Field
              </button>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 text-white text-xs bg-black/50 backdrop-blur-sm rounded px-2 py-1">
          {fieldsCount} field{fieldsCount !== 1 ? "s" : ""} • {viewMode} view
        </div>
      </div>
    </div>
  );
}
