"use client";

import { useState, useCallback, useEffect } from "react";
import { useFieldState } from "@/hooks/useFieldState";
import { useMapDraw } from "@/hooks/useMapDraw";
import { Menu, TrendingUp, DollarSign, Activity, Calendar, MapPin, Grid3X3, Droplets, Trash2, X } from "lucide-react";
import { useLandStore } from "@/lib/store";
import MapComponent from "./NewMapComponent";
import Sidebar from "./NewSidebar";
import MapControls from "./NewMapControls";
import DrawControls from "./NewDrawControls";

export default function MapView() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);
  const [activeTab, setActiveTab] = useState("search");

  const fetchAll = useLandStore((state) => state.fetchAll);

  // Extract everything from land store for reactivity
  const {
    expenses,
    incomes,
    thakaRecords,
    waterRecords,
    updateField
  } = useLandStore();

  useEffect(() => {
    fetchAll();
    if (typeof window !== "undefined" && window.innerWidth >= 640) {
      setSidebarCollapsed(false);
    }
  }, [fetchAll]);

  const fieldState = useFieldState();
  const drawState = useMapDraw(fieldState.handleDrawFinish, () => fieldState.setDrawActive(false));

  const {
    locationQuery, setLocationQuery,
    areaAcres, setAreaAcres,
    fieldName, setFieldName,
    status, setStatus,
    loading, error,
    preview, clearPreview,
    drawActive, setDrawActive,
    drawShape, setDrawShape,
    viewMode, setViewMode,
    selectedField, setSelectedField,
    goToQuery, setGoToQuery,
    goToLoading, goToTarget,
    mapCenter, mapZoom,
    handleSearch, handleMyLocation,
    handleCoordinatesApply, handleDrawFinish,
    handleSaveField, handleFieldClick,
    handleGoToPlace, handleCenterOnMe,
    fields, fieldsCount,
  } = fieldState;

  const handleDetectAddress = useCallback(async () => {
    if (!selectedField || !selectedField.coordinates?.length) return;
    const center = selectedField.coordinates[0];
    const { reverseGeocode } = await import("@/lib/geo");
    const result = await reverseGeocode(center.lat, center.lng);
    if (result) {
      await updateField(selectedField.id, {
        address: result.humanAddress,
        detailedAddress: {
          displayName: result.displayName,
          village: result.village,
          city: result.city,
          state: result.state,
          country: result.country
        }
      });
      // Update local selection to reflect change immediately
      setSelectedField(prev => prev ? {
        ...prev,
        address: result.humanAddress,
        detailedAddress: result
      } : null);
    }
  }, [selectedField, updateField, setSelectedField]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    if (tabId !== "draw") {
      setDrawActive?.(false);
    }
  }, [setDrawActive]);

  const handleDrawStartWrap = useCallback(() => {
    setDrawActive?.(true);
    drawState.startDrawing();
    if (window.innerWidth < 640) setSidebarCollapsed(true);
  }, [drawState, setDrawActive]);

  const onSearchWrap = useCallback(async () => {
    if (handleSearch) await handleSearch();
    if (window.innerWidth < 640) setSidebarCollapsed(true);
  }, [handleSearch]);

  const onMyLocationWrap = useCallback(async () => {
    if (handleMyLocation) await handleMyLocation();
    if (window.innerWidth < 640) setSidebarCollapsed(true);
  }, [handleMyLocation]);

  const onCoordinatesApplyWrap = useCallback(() => {
    if (handleCoordinatesApply) handleCoordinatesApply();
    if (window.innerWidth < 640) setSidebarCollapsed(true);
  }, [handleCoordinatesApply]);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <div className="-mx-4 -my-4 sm:-mx-6 sm:-my-6 md:-mx-8 md:-my-8 h-[calc(100vh-73px)] flex relative overflow-hidden bg-[var(--background)]">
      {/* Universal Toggle Button */}
      {sidebarCollapsed && (
        <button
          onClick={handleSidebarToggle}
          className="absolute top-4 left-4 z-[1001] p-3 rounded-xl bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] shadow-xl text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all animate-in fade-in zoom-in duration-200"
          title="Open Add Field Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Sidebar - Inside Map Container */}
      <div
        className={`absolute top-0 bottom-0 left-0 z-[1000] flex-shrink-0 transition-all duration-300 ease-in-out shadow-2xl ${sidebarCollapsed
            ? "-translate-x-full"
            : "w-full sm:w-[360px] md:w-[400px] translate-x-0"
          }`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
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
          saving={fieldState.saving}
          onSearch={onSearchWrap}
          onMyLocation={onMyLocationWrap}
          onCoordinatesApply={onCoordinatesApplyWrap}
          onDrawStart={handleDrawStartWrap}
          onSaveField={handleSaveField}
          onClearPreview={clearPreview}
          fieldsCount={fieldsCount}
        />
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <MapComponent
          mapInstance={mapInstance}
          setMapInstance={setMapInstance}
          center={mapCenter}
          zoom={mapZoom}
          viewMode={viewMode}
          fields={fields}
          selectedField={selectedField}
          preview={preview}
          onFieldClick={handleFieldClick}
          sidebarCollapsed={sidebarCollapsed}
        >
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
        </MapComponent>

        {/* Map Controls */}
        {mapInstance && (
          <div className={!sidebarCollapsed ? "hidden sm:block" : "block"}>
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
          </div>
        )}

        {/* Field Info Panel */}
        {selectedField && (
          <div className="absolute top-4 right-4 z-[1000] w-80 md:w-96 bg-[var(--card)]/95 backdrop-blur-2xl border border-[var(--border)] rounded-[2rem] shadow-2xl p-6 text-[var(--foreground)] animate-in slide-in-from-right-8 duration-500 overflow-y-auto max-h-[calc(100vh-120px)] no-scrollbar">
            {/* Header */}
            <div className="relative -mx-6 -mt-6 mb-6 p-6 rounded-t-[2rem] bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border-b border-[var(--border)]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent truncate pr-4">
                    {selectedField.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase text-[var(--muted)] tracking-[0.2em]">{selectedField.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedField(null)}
                  className="bg-[var(--background)]/80 hover:bg-red-500/20 text-[var(--muted)] hover:text-red-500 p-2 rounded-xl transition-all shadow-sm group"
                >
                  <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Primary Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--background)]/50 border border-[var(--border)] p-4 rounded-2xl group hover:border-emerald-500/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Grid3X3 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Area</span>
                  </div>
                  <div className="text-lg font-black">{selectedField.area?.toFixed(2)} <span className="text-xs font-normal text-[var(--muted)]">Acres</span></div>
                </div>
                <div className="bg-[var(--background)]/50 border border-[var(--border)] p-4 rounded-2xl group hover:border-blue-500/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Nodes</span>
                  </div>
                  <div className="text-lg font-black">{selectedField.coordinates?.length || 0} <span className="text-xs font-normal text-[var(--muted)]">Points</span></div>
                </div>
                <div className="col-span-2 bg-[var(--background)]/30 border border-[var(--border)] p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-[var(--muted)] uppercase">Lat:</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-500">{selectedField.coordinates?.[0]?.lat?.toFixed(6) || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-[var(--muted)] uppercase">Lng:</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-500">{selectedField.coordinates?.[0]?.lng?.toFixed(6) || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">Human-Readable Location</span>
                    {selectedField.address ? (
                      <p className="text-xs font-semibold leading-relaxed text-[var(--foreground)]">{selectedField.address}</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[10px] text-[var(--muted)] italic">No address set. Detect words form location?</p>
                        <button
                          onClick={handleDetectAddress}
                          className="text-[10px] font-black text-blue-500 uppercase hover:underline flex items-center gap-1"
                        >
                          <Activity className="w-3 h-3" />
                          Detect Address
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedField.detailedAddress && (
                  <div className="space-y-3">
                    {selectedField.detailedAddress.displayName && (
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <span className="text-[9px] font-black text-blue-400 uppercase block mb-1">Absolute Full Address (System Record)</span>
                        <p className="text-[10px] text-[var(--muted)] leading-tight italic">{selectedField.detailedAddress.displayName}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {selectedField.detailedAddress.village && (
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-[9px] font-black text-blue-400 uppercase block">Village</span>
                          <span className="text-[11px] font-bold truncate block">{selectedField.detailedAddress.village}</span>
                        </div>
                      )}
                      {selectedField.detailedAddress.city && (
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="text-[9px] font-black text-blue-400 uppercase block">City/Town</span>
                          <span className="text-[11px] font-bold truncate block">{selectedField.detailedAddress.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Dashboard */}
              {(() => {
                const fExp = expenses.filter(e => e.fieldId === selectedField.id).reduce((s, e) => s + e.amount, 0);
                const fInc = incomes.filter(i => i.fieldId === selectedField.id).reduce((s, i) => s + i.amount, 0);
                const net = fInc - fExp;
                return (
                  <div className="space-y-3 bg-[var(--background)]/30 border border-[var(--border)] p-4 rounded-3xl">
                    <h4 className="text-[11px] font-black text-[var(--muted)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Financial Pulse
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-[var(--muted)]">Total Revenue</span>
                        <span className="text-sm font-black text-emerald-500">Rs {fInc.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-[var(--muted)]">Total Investment</span>
                        <span className="text-sm font-black text-red-500">Rs {fExp.toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-[var(--border)] my-2"></div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-2xl border border-[var(--border)]">
                        <span className="text-xs font-black text-[var(--foreground)]">NET PROFIT</span>
                        <span className={`text-lg font-black ${net >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                          Rs {net.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Thaka (Lease) Details */}
              <div className="bg-purple-500/5 border border-purple-500/10 p-5 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <h4 className="text-[11px] font-black text-purple-500 uppercase tracking-widest">Lease (Thaka) Details</h4>
                </div>
                {(() => {
                  const fThaka = thakaRecords.filter(t => t.fieldId === selectedField.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
                  const activeThaka = fThaka[0];
                  if (activeThaka) {
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                          <div>
                            <span className="text-[9px] font-bold text-purple-400 uppercase block mb-0.5">Tenant</span>
                            <span className="text-base font-black text-[var(--foreground)]">{activeThaka.tenantName}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${activeThaka.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                            {activeThaka.status}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                            <span className="text-[9px] font-bold text-purple-400 uppercase">Lease Value</span>
                            <span className="text-sm font-black text-purple-500 text-right">Rs {activeThaka.amount.toLocaleString()}</span>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <span className="text-[9px] font-bold text-purple-400 uppercase block mb-1">Agreement Span</span>
                            <span className="text-xs font-bold text-[var(--muted)]">{new Date(activeThaka.startDate).toLocaleDateString()} - {new Date(activeThaka.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return <div className="text-xs font-medium text-purple-400 italic">No historical lease data for this field.</div>;
                  }
                })()}
              </div>

              {/* Water Info */}
              <div className="bg-cyan-500/5 border border-cyan-500/10 p-5 rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <Droplets className="w-5 h-5 text-cyan-500" />
                  <h4 className="text-[11px] font-black text-cyan-500 uppercase tracking-widest">Water Intelligence</h4>
                </div>
                {(() => {
                  const fWater = waterRecords.filter(w => w.fieldId === selectedField.id).sort((a, b) => b.date.localeCompare(a.date));
                  const last = fWater[0];
                  if (last) {
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[9px] font-bold text-cyan-400 uppercase block mb-1">Last Date</span>
                          <span className="text-xs font-black">{new Date(last.date).toLocaleDateString()}</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <span className="text-[9px] font-bold text-cyan-400 uppercase block mb-1">Duration</span>
                          <span className="text-xs font-black">{last.durationMinutes} Min</span>
                        </div>
                      </div>
                    );
                  } else {
                    return <div className="text-xs font-medium text-cyan-400 italic">No water records found.</div>;
                  }
                })()}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <button
                onClick={() => fieldState.handleDeleteField(selectedField.id)}
                className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Destroy Record
              </button>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div
          className="hidden sm:block absolute bottom-6 left-[384px] z-[1000] text-[var(--foreground)] text-xs font-bold bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] rounded-full px-4 py-2 shadow-xl transition-all duration-300"
          style={{ left: sidebarCollapsed ? '96px' : '424px' }}
        >
          {fieldsCount} field{fieldsCount !== 1 ? "s" : ""} recorded • {viewMode} active
        </div>
      </div>
    </div>
  );
}
