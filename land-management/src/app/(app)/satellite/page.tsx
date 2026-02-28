"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Satellite,
  Layers,
  MapPin,
  Loader2,
  RefreshCw,
  Activity,
  Droplets,
  Thermometer,
  TrendingUp,
  AlertCircle,
  Cloud,
} from "lucide-react";
import { useLandStore } from "@/lib/store";
import { format } from "date-fns";
import { centroid } from "@/lib/geo";
import { fetchLiveWeather, clearWeatherCache, type LiveWeatherResult } from "@/lib/weather";
import { computeFieldActivity, type FieldActivityStats } from "@/lib/fieldActivity";
import type { GeoFence } from "@/types";

const DEFAULT_CENTER: [number, number] = [31.5204, 74.3587];

type FieldLive = {
  field: GeoFence;
  center: { lat: number; lng: number };
  loading: boolean;
  data: LiveWeatherResult | null;
};

function useLiveWeatherForFields(fields: GeoFence[]) {
  const [live, setLive] = useState<FieldLive[]>([]);
  const fieldIdsWithCoords = fields
    .filter((f) => f.coordinates?.length)
    .map((f) => f.id)
    .sort()
    .join(",");

  const fetchAll = useCallback(
    async (bypassCache = false) => {
      if (bypassCache) clearWeatherCache();
      const withCenter = fields.filter(
        (f) => f.coordinates?.length
      ) as (GeoFence & { coordinates: { lat: number; lng: number }[] })[];
      const next: FieldLive[] = withCenter
        .map((field) => {
          const center = centroid(field.coordinates);
          if (!center) return null;
          return { field, center, loading: true, data: null };
        })
        .filter(Boolean) as FieldLive[];
      setLive(next);
      await Promise.all(
        next.map(async (item, i) => {
          const result = await fetchLiveWeather(item.center.lat, item.center.lng);
          setLive((prev) => {
            const copy = [...prev];
            if (copy[i]) copy[i] = { ...copy[i], loading: false, data: result };
            return copy;
          });
        })
      );
    },
    [fieldIdsWithCoords, fields]
  );

  useEffect(() => {
    if (fieldIdsWithCoords) fetchAll(false);
    else setLive([]);
  }, [fieldIdsWithCoords]);

  return { live, refresh: () => fetchAll(true) };
}

const MapComponent = dynamic(
  () => import("@/components/SatelliteMap").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[480px] w-full items-center justify-center rounded-2xl border border-theme bg-theme-card text-theme-muted">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-green-500" />
          <span>Loading satellite imagery…</span>
        </div>
      </div>
    ),
  }
);

export default function SatellitePage() {
  const {
    fields,
    waterRecords,
    expenses,
    temperatureRecords,
    dailyRegister,
    loading: storeLoading,
  } = useLandStore();

  const [layer, setLayer] = useState<"satellite" | "hybrid" | "street">("satellite");
  const [weatherRefreshing, setWeatherRefreshing] = useState(false);

  const { live: liveWeather, refresh: refreshWeather } = useLiveWeatherForFields(fields);

  const fieldLiveTemp = useMemo(() => {
    const out: Record<string, number> = {};
    liveWeather.forEach((item) => {
      if (item.data && !item.data.error && item.data.temperatureC != null) {
        out[item.field.id] = item.data.temperatureC;
      }
    });
    return out;
  }, [liveWeather]);

  const activityStats = useMemo(
    () =>
      computeFieldActivity(
        fields,
        waterRecords,
        expenses,
        temperatureRecords,
        dailyRegister
      ),
    [fields, waterRecords, expenses, temperatureRecords, dailyRegister]
  );

  const fieldsWithCoords = fields.filter(
    (f) => f.coordinates && f.coordinates.length >= 3
  );

  const handleRefreshWeather = async () => {
    setWeatherRefreshing(true);
    await refreshWeather();
    setWeatherRefreshing(false);
  };

  const activityByFieldId = useMemo(() => {
    const m = new Map<string, FieldActivityStats>();
    activityStats.forEach((a) => m.set(a.fieldId, a));
    return m;
  }, [activityStats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-theme">
            <Satellite className="h-8 w-8 text-green-400" />
            Satellite Monitoring
          </h1>
          <p className="text-theme-muted">
            Real satellite imagery with your field boundaries. Live weather and activity from your data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshWeather}
            disabled={weatherRefreshing || fieldsWithCoords.length === 0}
            className="flex items-center gap-2 rounded-xl border border-theme bg-theme-card px-4 py-2 text-sm font-medium text-theme hover:bg-theme-track disabled:opacity-50"
          >
            {weatherRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh live weather
          </button>
          <div className="flex rounded-xl border border-theme bg-theme-card p-1">
            {(
              [
                { id: "satellite" as const, icon: Satellite, label: "Satellite" },
                { id: "hybrid" as const, icon: Layers, label: "Hybrid" },
                { id: "street" as const, icon: MapPin, label: "Street" },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setLayer(id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  layer === id
                    ? "bg-green-500/20 text-green-400"
                    : "text-theme-muted hover:text-theme"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {storeLoading ? (
        <div className="flex h-[480px] items-center justify-center rounded-2xl border border-theme bg-theme-card">
          <Loader2 className="h-10 w-10 animate-spin text-green-500" />
        </div>
      ) : fields.length === 0 ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-12 w-12 text-amber-400" />
          <h3 className="mb-2 text-lg font-semibold text-theme">No fields yet</h3>
          <p className="text-theme-muted">
            Add fields on the Map (with location and area) to see them here with satellite imagery and live data.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl overflow-hidden border border-theme bg-theme-track">
            <div className="h-[480px] w-full">
              <MapComponent
                layer={layer}
                fields={fields}
                fieldLiveTemp={Object.keys(fieldLiveTemp).length > 0 ? fieldLiveTemp : undefined}
              />
            </div>
            <div className="border-t border-theme px-4 py-2 text-xs text-theme-muted">
              {fieldsWithCoords.length} field{fieldsWithCoords.length !== 1 ? "s" : ""} on map
              {Object.keys(fieldLiveTemp).length > 0 &&
                ` · Live weather for ${Object.keys(fieldLiveTemp).length} location(s)`}
            </div>
          </div>

          <div className="rounded-2xl border border-theme bg-theme-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-theme">
              <Activity className="h-5 w-5 text-green-400" />
              Field health & activity (real data)
            </h3>
            <p className="mb-4 text-sm text-theme-muted">
              Activity score from your records: water, expenses, temperature, and data bank. Live temperature from weather API where available.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activityStats.map((stat) => {
                const liveTemp = fieldLiveTemp[stat.fieldId];
                return (
                  <div
                    key={stat.fieldId}
                    className="rounded-xl border border-theme bg-theme-track p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-medium text-theme">{stat.fieldName}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          stat.activityScore >= 70
                            ? "bg-green-500/20 text-green-400"
                            : stat.activityScore >= 40
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {stat.activityScore}% activity
                      </span>
                    </div>
                    {stat.areaAcres != null && (
                      <p className="mb-2 text-xs text-theme-muted">
                        {stat.areaAcres.toFixed(1)} acres · {stat.status}
                      </p>
                    )}
                    <div className="space-y-1.5 text-xs text-theme-muted">
                      {liveTemp != null && (
                        <p className="flex items-center gap-2 text-orange-300">
                          <Cloud className="h-3.5 w-3.5" />
                          Live: {liveTemp.toFixed(1)} °C
                        </p>
                      )}
                      {stat.lastWaterDate && (
                        <p className="flex items-center gap-2">
                          <Droplets className="h-3.5 w-3.5" />
                          Last water: {format(new Date(stat.lastWaterDate), "MMM d")} ({stat.waterCount} records)
                        </p>
                      )}
                      {stat.lastExpenseDate && (
                        <p className="flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Last expense: {format(new Date(stat.lastExpenseDate), "MMM d")} ({stat.expenseCount})
                        </p>
                      )}
                      {stat.latestTempC != null && !liveTemp && (
                        <p className="flex items-center gap-2">
                          <Thermometer className="h-3.5 w-3.5" />
                          Saved temp: {stat.latestTempC.toFixed(1)} °C
                        </p>
                      )}
                      {stat.hasRecentActivity && (
                        <span className="inline-block rounded bg-green-500/20 px-1.5 py-0.5 text-green-400">
                          Recent activity (30 days)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
