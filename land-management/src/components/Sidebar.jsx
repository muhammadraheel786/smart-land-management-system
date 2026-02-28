"use client";

import { useState } from "react";
import { 
  MapPin, 
  Search, 
  Save, 
  Navigation, 
  Type, 
  Pencil, 
  FileText, 
  Ruler, 
  Loader2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";

const statusOptions = [
  { value: "cultivated", label: "Cultivated" },
  { value: "available", label: "Available" },
  { value: "uncultivated", label: "Uncultivated" },
  { value: "thaka", label: "Thaka (Leased)" },
  { value: "not_usable", label: "Not usable" },
];

function Sidebar({
  isOpen,
  onToggle,
  activeTab,
  onTabChange,
  locationQuery,
  onLocationQueryChange,
  areaAcres,
  onAreaAcresChange,
  fieldName,
  onFieldNameChange,
  status,
  onStatusChange,
  loading,
  error,
  preview,
  saving,
  onSearch,
  onMyLocation,
  onCoordinatesApply,
  onDrawStart,
  onSaveField,
  onClearPreview,
  fieldsCount,
}) {
  const tabs = [
    { id: "search", label: "Search Location", icon: <Search className="h-4 w-4" /> },
    { id: "mylocation", label: "My Location", icon: <Navigation className="h-4 w-4" /> },
    { id: "coordinates", label: "Coordinates", icon: <Type className="h-4 w-4" /> },
    { id: "draw", label: "Draw on Map", icon: <Pencil className="h-4 w-4" /> },
  ];

  return (
    <div
      className={`flex shrink-0 flex-col border-theme bg-theme-track md:w-80 md:border-r transition-all duration-300 ${
        isOpen ? "block" : "hidden md:block md:w-14"
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between border-b border-theme px-4 py-3 text-left text-theme hover:bg-theme-card md:justify-center"
      >
        <span className="flex items-center gap-2 font-medium">
          <MapPin className="h-5 w-5 text-green-400" />
          {isOpen && "Add Field"}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1 rounded-lg bg-theme-card p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-green-500/30 text-green-400"
                    : "text-theme-muted hover:text-theme hover:bg-theme-track"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "search" && (
            <div className="space-y-4">
              <p className="text-sm text-theme-muted">
                Enter address or place name to find location and set area.
              </p>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-theme">Location</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => onLocationQueryChange(e.target.value)}
                    placeholder="e.g. Lahore, Pakistan"
                    className="w-full rounded-xl border border-theme bg-theme-card py-2.5 pl-10 pr-3 text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-theme">Area (acres)</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={areaAcres}
                    onChange={(e) => onAreaAcresChange(e.target.value)}
                    placeholder="e.g. 5 or 12.5"
                    className="w-full rounded-xl border border-theme bg-theme-card py-2.5 pl-10 pr-3 text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onSearch}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-medium text-theme hover:bg-green-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                {loading ? "Searching..." : "Search & Mark"}
              </button>
            </div>
          )}

          {activeTab === "mylocation" && (
            <div className="space-y-4">
              <p className="text-sm text-theme-muted">
                Use your device's GPS to mark current location.
              </p>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-theme">Area (acres, optional)</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={areaAcres}
                    onChange={(e) => onAreaAcresChange(e.target.value)}
                    placeholder="Leave empty to draw shape"
                    className="w-full rounded-xl border border-theme bg-theme-card py-2.5 pl-10 pr-3 text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onMyLocation}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-medium text-theme hover:bg-green-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
                {loading ? "Getting Location..." : "Use My Location"}
              </button>
            </div>
          )}

          {activeTab === "coordinates" && (
            <div className="space-y-4">
              <p className="text-sm text-theme-muted">
                Enter coordinates manually. One per line for polygon.
              </p>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-theme">Coordinates</label>
                <textarea
                  id="coordinates-input"
                  rows={4}
                  placeholder={'31.52, 74.35\n31.53, 74.36\n31.54, 74.35'}
                  className="w-full rounded-xl border border-theme bg-theme-card px-3 py-2.5 font-mono text-sm text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <button
                type="button"
                onClick={onCoordinatesApply}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-medium text-theme hover:bg-green-500"
              >
                <Type className="h-5 w-5" />
                Apply & Show
              </button>
            </div>
          )}

          {activeTab === "draw" && (
            <div className="space-y-4">
              <p className="text-sm text-theme-muted">
                Draw polygon or rectangle directly on the map.
              </p>
              
              <button
                type="button"
                onClick={onDrawStart}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-medium text-theme hover:bg-green-500"
              >
                <Pencil className="h-5 w-5" />
                Start Drawing
              </button>
            </div>
          )}

          {/* Common Fields */}
          <div className="space-y-4 border-t border-theme pt-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-theme">Field Name</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => onFieldNameChange(e.target.value)}
                  placeholder="e.g. North Wheat Field"
                  className="w-full rounded-xl border border-theme bg-theme-card py-2.5 pl-10 pr-3 text-theme placeholder-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-theme">Status</label>
              <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full rounded-xl border border-theme bg-theme-card px-3 py-2.5 text-theme focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview Actions */}
          {preview && preview.coordinates.length >= 3 && (
            <div className="flex flex-col gap-2 rounded-xl border border-green-500/40 bg-green-500/10 p-3">
              <p className="text-sm text-green-200">
                Preview: {preview.area.toFixed(2)} acres
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSaveField}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 font-medium text-theme hover:bg-green-500 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {saving ? "Saving..." : "Save Field"}
                </button>
                <button
                  type="button"
                  onClick={onClearPreview}
                  className="rounded-xl border border-theme bg-theme-card px-3 py-2.5 text-theme-muted hover:text-theme"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto border-t border-theme pt-4">
            <p className="text-xs text-theme-muted">
              Fields: <span className="font-medium text-theme">{fieldsCount}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
