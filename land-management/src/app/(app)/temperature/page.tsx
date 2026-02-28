"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Thermometer, RefreshCw, MapPin, Loader2, AlertCircle, Save, Cloud } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { format } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";
import { centroid } from "@/lib/geo";
import { fetchLiveWeather, clearWeatherCache, type LiveWeatherResult } from "@/lib/weather";
import type { GeoFence } from "@/types";

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

export default function TemperaturePage() {
  const { t } = useLocale();
  const { fields, temperatureRecords, addTemperatureRecord } = useLandStore();
  const [fieldId, setFieldId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [temp, setTemp] = useState("");
  const [minTemp, setMinTemp] = useState("");
  const [maxTemp, setMaxTemp] = useState("");
  const [notes, setNotes] = useState("");

  const { live, refresh } = useLiveWeatherForFields(fields);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldId || !temp) return;
    await addTemperatureRecord({
      fieldId,
      date,
      temperatureC: Number(temp),
      minTempC: minTemp ? Number(minTemp) : undefined,
      maxTempC: maxTemp ? Number(maxTemp) : undefined,
      notes: notes || undefined,
    });
    setTemp("");
    setMinTemp("");
    setMaxTemp("");
    setNotes("");
  };

  const handleSaveLiveAsRecord = async (fieldId: string, data: LiveWeatherResult) => {
    if (data.error) return;
    await addTemperatureRecord({
      fieldId,
      date: format(new Date(), "yyyy-MM-dd"),
      temperatureC: data.temperatureC,
      minTempC: data.minTempC,
      maxTempC: data.maxTempC,
      notes: `Live (${data.source})`,
    });
  };

  const avgTemp = temperatureRecords.length
    ? temperatureRecords.reduce((a, r) => a + r.temperatureC, 0) / temperatureRecords.length
    : 0;

  const fieldsWithCoords = fields.filter((f) => f.coordinates?.length);
  const noLocationMessage = fields.length === 0
    ? "Add fields on the Map (with location) to see live temperature here."
    : "Add fields with location on the Map to see live temperature by location.";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-theme">{t("temperatureManagement")}</h1>
        <p className="text-[#8b949e]">
          Live temperature by field location (exact coordinates) and manual records for crop management.
        </p>
      </div>

      {/* Live temperature by location */}
      <div className="rounded-2xl border border-theme bg-theme-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-theme">
            <Cloud className="h-5 w-5 text-sky-400" />
            Live temperature by location
          </h2>
          {fieldsWithCoords.length > 0 && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-theme bg-theme-track px-4 py-2 text-sm font-medium text-theme hover:bg-theme-track disabled:opacity-50"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh all
            </button>
          )}
        </div>
        {fieldsWithCoords.length === 0 ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {noLocationMessage}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((item) => (
              <div
                key={item.field.id}
                className="rounded-xl border border-theme bg-theme-track p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-theme">
                  <MapPin className="h-4 w-4 text-green-400" />
                  <span className="font-medium">{item.field.name}</span>
                </div>
                <p className="mb-3 text-xs text-[#8b949e]">
                  {item.center.lat.toFixed(4)}°, {item.center.lng.toFixed(4)}°
                </p>
                {item.loading ? (
                  <div className="flex items-center gap-2 py-4 text-[#8b949e]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Fetching live data…</span>
                  </div>
                ) : item.data?.error ? (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{item.data.error}</span>
                  </div>
                ) : item.data ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-orange-400">
                        {item.data.temperatureC.toFixed(1)} °C
                      </span>
                      <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs font-medium text-green-400">
                        Live
                      </span>
                    </div>
                    {(item.data.minTempC != null || item.data.maxTempC != null) && (
                      <p className="mt-1 text-sm text-[#8b949e]">
                        Min {item.data.minTempC?.toFixed(0) ?? "—"} °C
                        {" · "}
                        Max {item.data.maxTempC?.toFixed(0) ?? "—"} °C
                      </p>
                    )}
                    {item.data.relativeHumidity != null && (
                      <p className="text-sm text-[#8b949e]">Humidity {item.data.relativeHumidity}%</p>
                    )}
                    <p className="mt-2 text-xs text-[#484f58]">
                      Updated {format(new Date(item.data.updatedAt), "MMM d, HH:mm")} · {item.data.source}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSaveLiveAsRecord(item.field.id, item.data!)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 py-2 text-sm font-medium text-green-400 hover:bg-green-500/20"
                    >
                      <Save className="h-4 w-4" />
                      Save as record
                    </button>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-theme bg-theme-card p-6">
          <div className="rounded-xl bg-orange-500/20 p-3">
            <Thermometer className="h-8 w-8 text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-[#8b949e]">Saved records</p>
            <p className="text-2xl font-bold text-theme">{temperatureRecords.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-theme bg-theme-card p-6">
          <div className="rounded-xl bg-orange-500/20 p-3">
            <Thermometer className="h-8 w-8 text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-[#8b949e]">Avg (saved)</p>
            <p className="text-2xl font-bold text-theme">{avgTemp.toFixed(1)} °C</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-theme bg-theme-card p-6">
          <div className="rounded-xl bg-sky-500/20 p-3">
            <MapPin className="h-8 w-8 text-sky-400" />
          </div>
          <div>
            <p className="text-sm text-[#8b949e]">Fields with location</p>
            <p className="text-2xl font-bold text-theme">{fieldsWithCoords.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-theme bg-theme-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-theme">{t("addRecord")}</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-[#8b949e]">{t("field")}</label>
              <select
                value={fieldId}
                onChange={(e) => setFieldId(e.target.value)}
                required
                className="w-full rounded-xl border border-theme bg-theme-track px-4 py-3 text-theme"
              >
                <option value="">Select field</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#8b949e]">{t("date")}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-theme bg-theme-track px-4 py-3 text-theme"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm text-[#8b949e]">{t("tempCelsius")}</label>
                <input
                  type="number"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  required
                  step="0.1"
                  placeholder="25"
                  className="w-full rounded-xl border border-theme bg-theme-track px-4 py-3 text-theme"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#8b949e]">Min °C</label>
                <input
                  type="number"
                  value={minTemp}
                  onChange={(e) => setMinTemp(e.target.value)}
                  step="0.1"
                  className="w-full rounded-xl border border-theme bg-theme-track px-4 py-3 text-theme"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#8b949e]">Max °C</label>
                <input
                  type="number"
                  value={maxTemp}
                  onChange={(e) => setMaxTemp(e.target.value)}
                  step="0.1"
                  className="w-full rounded-xl border border-theme bg-theme-track px-4 py-3 text-theme"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[#8b949e]">{t("description")}</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-theme bg-theme-track px-4 py-3 text-theme"
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-semibold text-theme transition hover:bg-green-600"
            >
              <Plus className="h-5 w-5" />
              {t("addRecord")}
            </button>
          </form>
        </div>

        <div className="max-h-[500px] overflow-auto rounded-2xl border border-theme bg-theme-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-theme">Recent records</h3>
          {temperatureRecords.length === 0 ? (
            <p className="text-[#8b949e]">No temperature records yet.</p>
          ) : (
            <div className="space-y-3">
              {[...temperatureRecords]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 15)
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/10 p-3"
                  >
                    <div>
                      <p className="font-medium text-theme">
                        {fields.find((f) => f.id === r.fieldId)?.name}
                      </p>
                      <p className="text-sm text-[#8b949e]">{format(new Date(r.date), "MMM d, yyyy")}</p>
                    </div>
                    <p className="font-bold text-orange-400">{r.temperatureC} °C</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
