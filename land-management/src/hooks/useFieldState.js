"use client";

import { useState, useCallback } from "react";
import { useLandStore } from "@/lib/store";
import {
  geocodeLocation,
  polygonFromCenterAndArea,
  reverseGeocode,
  getCurrentPosition,
  parseCoordinates
} from "@/lib/geo";
import { getArea } from "@/lib/field-utils";

export function useFieldState() {
  const { fields, addField, deleteField } = useLandStore();

  // Form state
  const [locationQuery, setLocationQuery] = useState("");
  const [areaAcres, setAreaAcres] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [status, setStatus] = useState("cultivated");
  const [address, setAddress] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  // Drawing state
  const [drawActive, setDrawActive] = useState(false);
  const [drawShape, setDrawShape] = useState("polygon");

  // Map state
  const [viewMode, setViewMode] = useState("satellite");
  const [selectedField, setSelectedField] = useState(null);
  const [goToQuery, setGoToQuery] = useState("");
  const [goToLoading, setGoToLoading] = useState(false);
  const [goToTarget, setGoToTarget] = useState(null);

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
    setDrawActive(false);
  }, []);

  const handleSearch = useCallback(async () => {
    console.log("handleSearch called");
    console.log("Location query:", locationQuery);
    console.log("Area acres:", areaAcres);

    const query = locationQuery.trim();
    const acres = areaAcres ? parseFloat(areaAcres) : 0;

    if (!query) {
      console.log("No location query provided");
      setError("Enter a location (e.g. city, address, or place name).");
      return;
    }
    if (acres <= 0) {
      console.log("Invalid area:", acres);
      setError("Enter area in acres (e.g. 5 or 10.5).");
      return;
    }

    console.log("Starting search for:", { query, acres });
    setError(null);
    setLoading(true);

    try {
      console.log("Geocoding location...");
      const result = await geocodeLocation(query);
      console.log("Geocoding result:", result);

      if (!result) {
        console.log("Location not found");
        setError("Location not found. Try a different name.");
        setPreview(null);
        return;
      }

      setAddress(result.detailedAddress.humanAddress);
      const coordinates = polygonFromCenterAndArea(result.lat, result.lng, acres);
      console.log("Generated coordinates:", coordinates);

      setPreview({
        coordinates,
        center: [result.lat, result.lng],
        area: acres,
        address: result.detailedAddress.humanAddress,
        detailedAddress: result.detailedAddress,
      });
      console.log("Preview set successfully");
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed. Check your connection and try again.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [locationQuery, areaAcres]);

  const handleMyLocation = useCallback(async () => {
    console.log("handleMyLocation called");
    setError(null);
    setLoading(true);

    try {
      console.log("Getting current position...");
      const { lat, lng } = await getCurrentPosition();
      console.log("Position obtained:", { lat, lng });

      console.log("Reverse geocoding...");
      const result = await reverseGeocode(lat, lng);
      console.log("Address obtained:", result?.displayName);

      setAddress(result?.displayName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);

      setPreview({
        coordinates: [],
        center: [lat, lng],
        area: 0,
        address: result?.displayName || undefined,
        detailedAddress: result ? {
          road: result.road,
          suburb: result.suburb,
          city: result.city,
          village: result.village,
          state: result.state,
          postcode: result.postcode,
          country: result.country
        } : undefined,
      });

      const acres = areaAcres ? parseFloat(areaAcres) : 0;
      if (acres > 0) {
        const coordinates = polygonFromCenterAndArea(lat, lng, acres);
        setPreview((p) => (p ? { ...p, coordinates, area: acres } : null));
      }
    } catch (e) {
      console.error("Location error:", e);
      setError(e instanceof Error ? e.message : "Could not get location.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [areaAcres]);

  const handleCoordinatesApply = useCallback(() => {
    const raw = document.getElementById("coordinates-input")?.value?.trim();
    if (!raw) {
      setError("Enter at least one coordinate (lat,lng) or multiple lines for a polygon.");
      return;
    }

    const coords = parseCoordinates(raw);
    if (coords.length === 0) {
      setError("Invalid format. Use: lat,lng (e.g. 31.52, 74.35) or one per line for polygon.");
      return;
    }

    setError(null);

    if (coords.length === 1) {
      const acres = areaAcres ? parseFloat(areaAcres) : 0;
      if (acres <= 0) {
        setError("For a single point, enter area in acres.");
        return;
      }
      const coordinates = polygonFromCenterAndArea(coords[0].lat, coords[0].lng, acres);
      const center = [coords[0].lat, coords[0].lng];
      setPreview({ coordinates, center, area: acres });
    } else if (coords.length >= 3) {
      const area = getArea(coords);
      const centerLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
      const centerLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
      setPreview({
        coordinates: coords,
        center: [centerLat, centerLng],
        area,
      });
    } else {
      setError("Polygon needs at least 3 points.");
    }
  }, [areaAcres]);

  const handleDrawFinish = useCallback(async (coords) => {
    console.log("handleDrawFinish called with coords:", coords);
    const area = getArea(coords);
    const centerLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
    const centerLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;

    console.log("Setting preview and fetching address...");

    // Fetch human-readable address for the center of the drawn area
    const result = await reverseGeocode(centerLat, centerLng);
    const addressStr = result?.humanAddress || `Location at ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}`;

    setAddress(addressStr);
    setPreview({
      coordinates: coords,
      center: [centerLat, centerLng],
      area,
      address: addressStr,
      detailedAddress: result || undefined
    });
    setDrawActive(false);
  }, []);

  const handleSaveField = useCallback(async () => {
    console.log("handleSaveField called");
    if (!preview) {
      console.log("No preview to save.");
      return;
    }
    if (!fieldName.trim()) {
      setError("Please provide a Field Name before saving.");
      return;
    }
    console.log("Saving field with preview:", preview);
    setSaving(true);
    setError(null);

    try {
      const fieldData = {
        id: "field_" + Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: fieldName.trim(),
        status: status || "cultivated",
        address: address,
        detailedAddress: preview.detailedAddress,
        coordinates: preview.coordinates,
        area: preview.area || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addField(fieldData);

      console.log("Field saved successfully!");
      clearPreview();
      setFieldName("");
      setLocationQuery("");
      setAreaAcres("");
      setAddress("");
      setError(null);
    } catch (e) {
      console.error("Error saving field:", e);
      setError(e instanceof Error ? e.message : "Failed to save field. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [preview, fieldName, status, address, addField, clearPreview]);

  const handleFieldClick = useCallback((field) => {
    setSelectedField((prev) => (prev?.id === field.id ? null : field));
  }, []);

  const handleDeleteField = useCallback(async (fieldId) => {
    if (!window.confirm("Are you sure you want to delete this field and all its associated records? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteField(fieldId);
      setSelectedField(null);
      setError(null);
    } catch {
      setError("Could not delete field. Try again.");
    }
  }, [deleteField]);

  const handleGoToPlace = useCallback(async () => {
    const q = goToQuery.trim();
    if (!q) return;

    setGoToLoading(true);
    setError(null);

    try {
      const result = await geocodeLocation(q);
      if (result) {
        setGoToTarget([result.lat, result.lng]);
      } else {
        setError("Place not found. Try a different name or address.");
      }
    } catch {
      setError("Search failed. Try again.");
    } finally {
      setGoToLoading(false);
    }
  }, [goToQuery]);

  const handleCenterOnMe = useCallback(async () => {
    try {
      const { lat, lng } = await getCurrentPosition();
      setGoToTarget([lat, lng]);
    } catch {
      setError("Could not get your location.");
    }
  }, []);

  // Default map center and zoom
  const defaultCenter = fields.length > 0 && fields[0].coordinates?.length
    ? [fields[0].coordinates[0].lat, fields[0].coordinates[0].lng]
    : [31.52, 74.35];
  const defaultZoom = 14;
  const mapCenter = preview?.center ?? defaultCenter;
  const mapZoom = preview ? 15 : defaultZoom;

  return {
    // Form state
    locationQuery,
    setLocationQuery,
    areaAcres,
    setAreaAcres,
    fieldName,
    setFieldName,
    status,
    setStatus,
    address,
    setAddress,

    // UI state
    loading,
    error,
    saving,
    preview,
    clearPreview,

    // Drawing state
    drawActive,
    setDrawActive,
    drawShape,
    setDrawShape,

    // Map state
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

    // Actions
    handleSearch,
    handleMyLocation,
    handleCoordinatesApply,
    handleDrawFinish,
    handleSaveField,
    handleFieldClick,
    handleDeleteField,
    handleGoToPlace,
    handleCenterOnMe,

    // Data
    fields,
    fieldsCount: fields.length,
  };
}
