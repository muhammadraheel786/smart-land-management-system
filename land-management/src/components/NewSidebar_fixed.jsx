"use client";

import { useState, useCallback, useEffect } from "react";
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
  collapsed,
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
    { id: "search", label: "Search", icon: <Search className="h-4 w-4" /> },
    { id: "mylocation", label: "My Location", icon: <Navigation className="h-4 w-4" /> },
    { id: "coordinates", label: "Coordinates", icon: <Type className="h-4 w-4" /> },
    { id: "draw", label: "Draw", icon: <Pencil className="h-4 w-4" /> },
  ];

  return (
    <div className={`flex flex-col bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
      collapsed ? "w-[72px]" : "w-[360px]"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <h2 className="text-lg font-semibold text-white">Add Field</h2>}
        <button
          type="button"
          onClick={onToggle}
          className="p-1 rounded text-gray-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange?.(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-green-400 border-b-2 border-green-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.icon}
            {!collapsed && <span>{tab.label}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!collapsed && (
          <>
            {activeTab === "search" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(e) => onLocationQueryChange?.(e.target.value)}
                      placeholder="e.g. New York, USA or 31.52, 74.35"
                      className="w-full rounded-lg bg-gray-700 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 border border-gray-600 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Area (acres, optional)</label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={areaAcres}
                      onChange={(e) => onAreaAcresChange?.(e.target.value)}
                      placeholder="e.g. 5 or 12.5"
                      className="w-full rounded-lg bg-gray-700 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 border border-gray-600 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSearch?.()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  {loading ? "Searching..." : "Search & Mark"}
                </button>
              </div>
            )}

            {activeTab === "mylocation" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Area (acres, optional)</label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={areaAcres}
                      onChange={(e) => onAreaAcresChange?.(e.target.value)}
                      placeholder="Leave empty to draw shape"
                      className="w-full rounded-lg bg-gray-700 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 border border-gray-600 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onMyLocation?.()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
                  {loading ? "Getting Location..." : "Use My Location"}
                </button>
              </div>
            )}

            {activeTab === "coordinates" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Coordinates</label>
                  <textarea
                    id="coordinates-input"
                    rows={4}
                    placeholder={'31.52, 74.35\n31.53, 74.36\n31.54, 74.35'}
                    className="w-full rounded-lg bg-gray-700 px-3 py-2.5 font-mono text-sm text-white placeholder-gray-400 border border-gray-600 focus:border-green-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onCoordinatesApply?.()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-500 transition-colors"
                >
                  <Type className="h-5 w-5" />
                  Apply & Show
                </button>
              </div>
            )}

            {activeTab === "draw" && (
              <div className="text-center">
                <p className="text-gray-300 mb-4">
                  Draw polygon or rectangle directly on map.
                </p>
                <button
                  type="button"
                  onClick={() => onDrawStart?.()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 px-6 font-medium text-white hover:bg-green-500 transition-colors"
                >
                  <Pencil className="h-5 w-5" />
                  Start Drawing
                </button>
              </div>
            )}

            {/* Common Fields */}
            <div className="space-y-4 border-t border-gray-700 pt-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Field Name</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => onFieldNameChange?.(e.target.value)}
                    placeholder="e.g. North Wheat Field"
                    className="w-full rounded-lg bg-gray-700 py-2.5 pl-10 pr-3 text-white placeholder-gray-400 border border-gray-600 focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Status</label>
                <select
                  value={status}
                  onChange={(e) => onStatusChange?.(e.target.value)}
                  className="w-full rounded-lg bg-gray-700 px-3 py-2.5 text-white border border-gray-600 focus:border-green-500 focus:outline-none"
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
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3">
                <p className="text-sm text-red-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}

            {/* Preview Actions */}
            {preview && preview.coordinates.length >= 3 && (
              <div className="flex flex-col gap-3 rounded-lg border border-green-500/40 bg-green-500/10 p-3">
                <p className="text-sm text-green-200 text-center">
                  📍 Preview: {preview.area.toFixed(2)} acres
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => onSaveField?.()}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 px-4 font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {saving ? "Saving..." : "Save Field"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onClearPreview?.()}
                    className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2.5 text-gray-300 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400 text-center">
                Fields: <span className="font-medium text-gray-300">{fieldsCount}</span>
              </p>
            </div>
          </>
        )}

        {/* Test Button - Always Visible */}
        <div className="p-4 border-t border-gray-700">
          <button
            type="button"
            onClick={() => {
              console.log("Test button clicked!");
              alert("Test button works! Functions should be working.");
            }}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Test Functions
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
