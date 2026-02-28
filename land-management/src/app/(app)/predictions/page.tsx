"use client";

import { useState } from "react";
import { TrendingUp, Wheat, Droplets, Leaf, Sparkles } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useLocale } from "@/contexts/LocaleContext";

const CROPS = ["wheat", "rice", "cotton", "sugarcane", "maize"];

type CropHealthResult = {
  fieldId: string;
  healthScore: number;
  ndvi: number;
  recommendation: string;
  factorsUsed?: string[];
  aiSummary?: string;
};

type YieldResult = {
  fieldId: string;
  predictedYieldKg: number;
  confidence: number;
  factorsUsed?: string[];
  aiSummary?: string;
};

type PriceResult = {
  fieldId: string;
  cropType: string;
  predictedPricePerKg: number;
  confidence: number;
  factorsUsed?: string[];
  aiSummary?: string;
};

type WaterForecastResult = {
  fieldId: string;
  suggestedIrrigationMinutes: number;
  nextRecommendedDate: string;
  factorsUsed?: string[];
  aiSummary?: string;
};

export default function PredictionsPage() {
  const { t } = useLocale();
  const { fields } = useLandStore();
  const [fieldId, setFieldId] = useState("");
  const [cropType, setCropType] = useState("wheat");
  const [cropHealth, setCropHealth] = useState<CropHealthResult | null>(null);
  const [yieldPred, setYieldPred] = useState<YieldResult | null>(null);
  const [pricePred, setPricePred] = useState<PriceResult | null>(null);
  const [waterForecast, setWaterForecast] = useState<WaterForecastResult | null>(null);
  const [aiSummary, setAiSummary] = useState<{ text: string; model: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const runCropHealth = async () => {
    if (!fieldId) return;
    setLoading("crop_health");
    setCropHealth(null);
    setError(null);
    try {
      const res = await api.predict("crop_health", fieldId, {}, { includeAiSummary: true }) as CropHealthResult;
      setCropHealth(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setLoading(null);
    }
  };

  const runYieldPrediction = async () => {
    if (!fieldId) return;
    setLoading("yield");
    setYieldPred(null);
    setError(null);
    try {
      const field = fields.find((f) => f.id === fieldId);
      const res = await api.predict("yield_prediction", fieldId, {
        area: field?.area || 1,
        historicalYield: 500,
      }, { includeAiSummary: true }) as YieldResult;
      setYieldPred(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setLoading(null);
    }
  };

  const runPricePrediction = async () => {
    if (!fieldId) return;
    setLoading("price");
    setPricePred(null);
    setError(null);
    try {
      const res = await api.predict("price_prediction", fieldId, { cropType }, { includeAiSummary: true }) as PriceResult;
      setPricePred(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setLoading(null);
    }
  };

  const runWaterForecast = async () => {
    if (!fieldId) return;
    setLoading("water");
    setWaterForecast(null);
    setError(null);
    try {
      const res = await api.predict("water_forecast", fieldId, {}, { includeAiSummary: true }) as WaterForecastResult;
      setWaterForecast(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setLoading(null);
    }
  };

  const runAiSummary = async () => {
    if (!fieldId) return;
    setLoading("ai_summary");
    setAiSummary(null);
    setError(null);
    try {
      const res = await api.predictAiSummary(fieldId);
      setAiSummary({ text: res.aiSummary, model: res.model });
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI summary failed");
    } finally {
      setLoading(null);
    }
  };

  const anyLoading = loading !== null;
  const fieldSelect = (
    <div>
      <label className="block text-sm text-theme-muted mb-1">{t("field")}</label>
      <select
        value={fieldId}
        onChange={(e) => { setFieldId(e.target.value); setError(null); }}
        className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme focus:ring-2 focus:ring-green-500/50"
      >
        <option value="">{t("selectField")}</option>
        {fields.map((f) => (
          <option key={f.id} value={f.id}>{f.name} ({f.area?.toFixed(1)} ac)</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-theme mb-2">{t("predictions")}</h1>
        <p className="text-theme-muted">{t("predictionsSubtitle")}</p>
      </div>

      {fields.length === 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-200">
          <p>{t("predictionsNoFields")}</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 flex items-center justify-between text-red-200">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="text-red-400 hover:text-red-300 underline">{t("cancel")}</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop Health */}
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            {t("cropHealth")}
          </h3>
          <div className="space-y-4">
            {fieldSelect}
            <button
              onClick={runCropHealth}
              disabled={anyLoading || !fieldId}
              className="w-full py-3 rounded-xl bg-emerald-600 text-theme font-semibold hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading === "crop_health" ? t("predicting") : t("predictCropHealth")}
            </button>
            {cropHealth && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <p className="text-emerald-400 font-bold">{cropHealth.healthScore}% {t("healthScore")}</p>
                <p className="text-sm text-theme-muted">NDVI: {cropHealth.ndvi}</p>
                <p className="text-sm text-theme">{cropHealth.recommendation}</p>
                {cropHealth.factorsUsed?.length ? (
                  <p className="text-xs text-theme-muted">{t("factorsUsed")}: {cropHealth.factorsUsed.join(", ")}</p>
                ) : null}
                {cropHealth.aiSummary && (
                  <p className="text-xs text-emerald-300/90 border-t border-emerald-500/20 pt-2 mt-2">{cropHealth.aiSummary}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Yield */}
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            {t("yieldPrediction")}
          </h3>
          <div className="space-y-4">
            {fieldSelect}
            <button
              onClick={runYieldPrediction}
              disabled={anyLoading || !fieldId}
              className="w-full py-3 rounded-xl bg-green-600 text-theme font-semibold hover:bg-green-500 disabled:opacity-50"
            >
              {loading === "yield" ? t("predicting") : t("predictYield")}
            </button>
            {yieldPred && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-1">
                <p className="text-green-400 font-bold">{yieldPred.predictedYieldKg.toLocaleString()} kg</p>
                <p className="text-sm text-theme-muted">{t("confidence")}: {(yieldPred.confidence * 100).toFixed(0)}%</p>
                {yieldPred.factorsUsed?.length ? (
                  <p className="text-xs text-theme-muted">{t("factorsUsed")}: {yieldPred.factorsUsed.join(", ")}</p>
                ) : null}
                {yieldPred.aiSummary && (
                  <p className="text-xs text-green-300/90 border-t border-green-500/20 pt-2 mt-2">{yieldPred.aiSummary}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <Wheat className="w-5 h-5 text-yellow-400" />
            {t("pricePrediction")}
          </h3>
          <div className="space-y-4">
            {fieldSelect}
            <div>
              <label className="block text-sm text-theme-muted mb-1">{t("cropType")}</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              onClick={runPricePrediction}
              disabled={anyLoading || !fieldId}
              className="w-full py-3 rounded-xl bg-yellow-600 text-theme font-semibold hover:bg-yellow-500 disabled:opacity-50"
            >
              {loading === "price" ? t("predicting") : t("predictPrice")}
            </button>
            {pricePred && (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 space-y-1">
                <p className="text-yellow-400 font-bold">Rs {pricePred.predictedPricePerKg}/kg</p>
                <p className="text-sm text-theme-muted">{t("confidence")}: {(pricePred.confidence * 100).toFixed(0)}%</p>
                {pricePred.factorsUsed?.length ? (
                  <p className="text-xs text-theme-muted">{t("factorsUsed")}: {pricePred.factorsUsed.join(", ")}</p>
                ) : null}
                {pricePred.aiSummary && (
                  <p className="text-xs text-yellow-300/90 border-t border-yellow-500/20 pt-2 mt-2">{pricePred.aiSummary}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Water Forecast */}
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-400" />
            {t("waterForecast")}
          </h3>
          <div className="space-y-4">
            {fieldSelect}
            <button
              onClick={runWaterForecast}
              disabled={anyLoading || !fieldId}
              className="w-full py-3 rounded-xl bg-blue-600 text-theme font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {loading === "water" ? t("predicting") : t("predictWaterForecast")}
            </button>
            {waterForecast && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1">
                <p className="text-blue-400 font-bold">{waterForecast.suggestedIrrigationMinutes} {t("minutes")}</p>
                <p className="text-sm text-theme">{t("nextIrrigation")}: {waterForecast.nextRecommendedDate}</p>
                {waterForecast.factorsUsed?.length ? (
                  <p className="text-xs text-theme-muted">{t("factorsUsed")}: {waterForecast.factorsUsed.join(", ")}</p>
                ) : null}
                {waterForecast.aiSummary && (
                  <p className="text-xs text-blue-300/90 border-t border-blue-500/20 pt-2 mt-2">{waterForecast.aiSummary}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Summary (full field outlook) */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          {t("aiSummary")}
        </h3>
        <div className="space-y-4">
          {fieldSelect}
          <button
            onClick={runAiSummary}
            disabled={anyLoading || !fieldId}
            className="w-full py-3 rounded-xl bg-violet-600 text-theme font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            {loading === "ai_summary" ? t("generating") : t("getAiSummary")}
          </button>
          {aiSummary && (
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
              <p className="text-violet-200 whitespace-pre-wrap">{aiSummary.text}</p>
              <p className="text-xs text-theme-muted mt-2">{t("model")}: {aiSummary.model}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
