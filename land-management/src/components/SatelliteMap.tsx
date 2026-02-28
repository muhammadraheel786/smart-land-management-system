"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoFence } from "@/types";
import { centroid } from "@/lib/geo";
import {
  statusColors,
  statusBorderColors,
  BORDER_COLOR,
  BORDER_WEIGHT,
  FILL_OPACITY,
  DASHED_BORDER,
} from "@/lib/map-styles";
import LandPopup from "./LandPopup";
import { MAPBOX_TOKEN, getMapboxTileUrl } from "@/lib/mapbox";

const DEFAULT_CENTER: [number, number] = [31.5204, 74.3587];
const DEFAULT_ZOOM = 14;

const MAP_LAYERS: Record<string, string> = {
  satellite: MAPBOX_TOKEN ? getMapboxTileUrl("satellite") : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  hybrid: MAPBOX_TOKEN ? getMapboxTileUrl("satellite-streets") : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  street: MAPBOX_TOKEN ? getMapboxTileUrl("streets") : "https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png",
  terrain: "https://{s}.tile.opentopomap.org/{z}/{y}/{x}.png",
};

function FitBoundsToFields({ fields }: { fields: GeoFence[] }) {
  const map = useMap();
  const bounded = useMemo(() => {
    const withCoords = fields.filter(
      (f) => f.coordinates && f.coordinates.length >= 3
    );
    if (withCoords.length === 0) return null;
    return L.latLngBounds(
      withCoords.flatMap((f) =>
        f.coordinates!.map((c) => [c.lat, c.lng] as L.LatLngExpression)
      )
    );
  }, [fields]);

  useEffect(() => {
    if (bounded && bounded.isValid()) {
      map.fitBounds(bounded, { padding: [24, 24], maxZoom: 16 });
    }
  }, [map, bounded]);
  return null;
}

export interface SatelliteMapProps {
  layer: string;
  fields: GeoFence[];
  fieldLiveTemp?: Record<string, number>;
  onZoomToFields?: () => void;
}

export default function SatelliteMap({
  layer,
  fields,
  fieldLiveTemp,
}: SatelliteMapProps) {
  const center = useMemo(() => {
    const withCoords = fields.filter(
      (f) => f.coordinates && f.coordinates.length >= 3
    );
    if (withCoords.length === 0) return DEFAULT_CENTER;
    const c = centroid(withCoords[0].coordinates!);
    return c ? ([c.lat, c.lng] as [number, number]) : DEFAULT_CENTER;
  }, [fields]);

  const layerUrl = MAP_LAYERS[layer] || MAP_LAYERS.satellite;
  const fieldsWithCoords = fields.filter(
    (f) => f.coordinates && f.coordinates.length >= 3
  );

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full min-h-[400px]"
      style={{ background: "#0d1117" }}
    >
      <TileLayer attribution="&copy; Esri" url={layerUrl} />
      {layer === "hybrid" && (
        <TileLayer
          attribution="&copy; OSM"
          url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
          opacity={0.35}
        />
      )}
      {fieldsWithCoords.length > 0 && <FitBoundsToFields fields={fieldsWithCoords} />}
      {fieldsWithCoords.map((f) => {
        const isUnfenced =
          f.status === "available" || f.status === "uncultivated";
        const positions = f.coordinates!.map((c) => [c.lat, c.lng] as [number, number]);
        return (
          <Polygon
            key={f.id}
            positions={positions}
            pathOptions={{
              color: statusBorderColors[f.status] || BORDER_COLOR,
              fillColor: statusColors[f.status] || "#2d6a4f",
              fillOpacity: FILL_OPACITY,
              weight: BORDER_WEIGHT,
              lineJoin: "round",
              lineCap: "round",
              dashArray: isUnfenced ? DASHED_BORDER : undefined,
            }}
          >
            <Popup>
              <LandPopup
                field={f}
                liveTempC={fieldLiveTemp?.[f.id]}
              />
            </Popup>
          </Polygon>
        );
      })}
    </MapContainer>
  );
}
