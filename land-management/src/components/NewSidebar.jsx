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
  Menu,
  PanelLeftClose,
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
    <div className={`flex flex-col h-full w-full bg-[var(--card)]/95 backdrop-blur-xl border-r border-[var(--border)] transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--background)]/50">
        {!collapsed && <h2 className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">Add Field</h2>}
        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-all hover:bg-[var(--card-hover)]"
          title={collapsed ? "Expand menu" : "Collapse menu"}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] bg-[var(--card)]/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange?.(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all ${activeTab === tab.id
              ? "text-green-500 border-b-2 border-green-500 bg-[var(--background)]/80"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]/50"
              }`}
          >
            {tab.icon}
            {!collapsed && <span>{tab.label}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-[var(--border)] hover:scrollbar-thumb-gray-500">
        {!collapsed && (
          <>
            {activeTab === "search" && (
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(e) => onLocationQueryChange?.(e.target.value)}
                      placeholder="e.g. New York, USA or 31.52, 74.35"
                      className="w-full rounded-xl bg-[var(--background)] py-3 pl-11 pr-4 text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">Area <span className="font-normal opacity-70">(acres, optional)</span></label>
                  <div className="relative">
                    <Ruler className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="number"
                      value={areaAcres}
                      onChange={(e) => onAreaAcresChange?.(e.target.value)}
                      placeholder="e.g. 5 or 12.5"
                      className="w-full rounded-xl bg-[var(--background)] py-3 pl-11 pr-4 text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSearch?.()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3.5 font-bold text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  {loading ? "Searching..." : "Search & Mark"}
                </button>
              </div>
            )}

            {activeTab === "mylocation" && (
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">Area <span className="font-normal opacity-70">(acres, optional)</span></label>
                  <div className="relative">
                    <Ruler className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="number"
                      value={areaAcres}
                      onChange={(e) => onAreaAcresChange?.(e.target.value)}
                      placeholder="Leave empty to draw shape"
                      className="w-full rounded-xl bg-[var(--background)] py-3 pl-11 pr-4 text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onMyLocation?.()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3.5 font-bold text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5 fill-white" />}
                  {loading ? "Getting Location..." : "Use My Location"}
                </button>
              </div>
            )}

            {activeTab === "coordinates" && (
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">Coordinates</label>
                  <textarea
                    id="coordinates-input"
                    rows={4}
                    placeholder={'31.52, 74.35\n31.53, 74.36\n31.54, 74.35'}
                    className="w-full rounded-xl bg-[var(--background)] px-4 py-3 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all shadow-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onCoordinatesApply?.()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--card-hover)] py-3.5 font-bold text-[var(--foreground)] hover:bg-[var(--border)] border border-[var(--border)] transition-all shadow-sm"
                >
                  <Type className="h-5 w-5" />
                  Apply & Show
                </button>
              </div>
            )}

            {activeTab === "draw" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                  <Pencil className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-[var(--muted)] mb-6 text-sm leading-relaxed">
                  Draw polygon or rectangle directly on map for pinpoint accuracy.
                </p>
                <button
                  type="button"
                  onClick={() => onDrawStart?.()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3.5 px-8 font-bold text-white hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Pencil className="h-5 w-5" />
                  Start Drawing
                </button>
              </div>
            )}

            {/* Common Fields */}
            <div className="space-y-5 border-t border-[var(--border)] pt-5 mt-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">Field Name</label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={fieldName}
                    onChange={(e) => onFieldNameChange?.(e.target.value)}
                    placeholder="e.g. North Wheat Field"
                    className="w-full rounded-xl bg-[var(--background)] py-3 pl-11 pr-4 text-[var(--foreground)] placeholder-[var(--muted)] border border-[var(--border)] focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">Status</label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => onStatusChange?.(e.target.value)}
                    className="w-full appearance-none rounded-xl bg-[var(--background)] px-4 py-3 text-[var(--foreground)] border border-[var(--border)] focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all shadow-sm"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[var(--card)] text-[var(--foreground)]">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm font-medium text-red-500 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  {error}
                </p>
              </div>
            )}

            {/* Preview Actions */}
            {preview && preview.coordinates.length >= 3 && (
              <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-green-500/30 bg-[var(--background)] p-5 shadow-sm">
                <p className="text-sm font-bold text-green-600 text-center flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Preview: {preview.area.toFixed(2)} acres
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => onSaveField?.()}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 px-4 font-bold text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-md"
                  >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {saving ? "Saving..." : "Save Field"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onClearPreview?.()}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center"
                    title="Cancel Preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 pb-2 mt-auto">
              <p className="text-xs font-bold text-[var(--muted)] text-center tracking-wide uppercase">
                Fields Tracked: <span className="text-[var(--foreground)] ml-1">{fieldsCount}</span>
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default Sidebar;
