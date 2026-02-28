"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Lightbulb, Droplets, Activity, RefreshCw, BookOpen } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { useLocale } from "@/contexts/LocaleContext";
import type { FieldRecommendation } from "@/lib/store";

export default function FieldRecommendationsPage() {
  const { t } = useLocale();
  const { fields, fieldRecommendations, fetchFieldRecommendations, error } = useLandStore();
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium">("all");
  const [filterReason, setFilterReason] = useState<"all" | "irrigation" | "activity">("all");

  const loadRecommendations = () => {
    setLoading(true);
    setFetchError(null);
    fetchFieldRecommendations()
      .catch((e) => setFetchError(e instanceof Error ? e.message : t("frLoadFailed")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecommendations();
  }, [fetchFieldRecommendations]);

  const filtered = useMemo(() => {
    let list = fieldRecommendations;
    if (filterPriority !== "all") list = list.filter((r) => r.priority === filterPriority);
    if (filterReason !== "all") list = list.filter((r) => r.reason === filterReason);
    return [...list].sort((a, b) => {
      const pOrder = { high: 0, medium: 1 };
      const pa = pOrder[a.priority as keyof typeof pOrder] ?? 1;
      const pb = pOrder[b.priority as keyof typeof pOrder] ?? 1;
      if (pa !== pb) return pa - pb;
      const rOrder = { irrigation: 0, activity: 1 };
      const ra = rOrder[a.reason as keyof typeof rOrder] ?? 1;
      const rb = rOrder[b.reason as keyof typeof rOrder] ?? 1;
      if (ra !== rb) return ra - rb;
      return (a.fieldName || "").localeCompare(b.fieldName || "");
    });
  }, [fieldRecommendations, filterPriority, filterReason]);

  const summary = useMemo(() => {
    const high = fieldRecommendations.filter((r) => r.priority === "high").length;
    const medium = fieldRecommendations.filter((r) => r.priority === "medium").length;
    return { high, medium, total: fieldRecommendations.length };
  }, [fieldRecommendations]);

  const noFields = fields.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-theme">{t("fieldRecommendations")}</h1>
            <p className="text-theme-muted">{t("frSubtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadRecommendations}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme-muted hover:text-theme hover:border-amber-500/40 disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? t("frLoading") : t("frRefresh")}
        </button>
      </div>

      {(error || fetchError) && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">{fetchError || error}</div>
      )}

      {noFields ? (
        <div className="bg-theme-card border border-theme rounded-2xl p-8 text-center text-theme-muted">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t("frNoFields")}</p>
          <Link href="/map" className="mt-4 inline-block text-amber-500 hover:underline">{t("goToMap")}</Link>
        </div>
      ) : (
        <>
          {fieldRecommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-theme-card border border-theme rounded-2xl p-4">
                <p className="text-theme-muted text-sm">{t("frHighPriority")}</p>
                <p className="text-xl font-bold text-red-500 dark:text-red-400">{summary.high}</p>
              </div>
              <div className="bg-theme-card border border-theme rounded-2xl p-4">
                <p className="text-theme-muted text-sm">{t("frMediumPriority")}</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary.medium}</p>
              </div>
              <div className="bg-theme-card border border-theme rounded-2xl p-4">
                <p className="text-theme-muted text-sm">{t("frTotal")}</p>
                <p className="text-xl font-bold text-theme">{summary.total}</p>
              </div>
            </div>
          )}

          {fieldRecommendations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-theme-muted text-sm py-1.5">{t("frFilterBy")}:</span>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)} className="px-3 py-1.5 rounded-lg bg-theme-track border border-theme text-theme text-sm">
                <option value="all">{t("frPriorityAll")}</option>
                <option value="high">{t("frPriorityHigh")}</option>
                <option value="medium">{t("frPriorityMedium")}</option>
              </select>
              <select value={filterReason} onChange={(e) => setFilterReason(e.target.value as typeof filterReason)} className="px-3 py-1.5 rounded-lg bg-theme-track border border-theme text-theme text-sm">
                <option value="all">{t("frReasonAll")}</option>
                <option value="irrigation">{t("frReasonIrrigation")}</option>
                <option value="activity">{t("frReasonActivity")}</option>
              </select>
            </div>
          )}

          {loading && fieldRecommendations.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-theme-card border border-theme animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-theme-card border border-theme rounded-2xl p-8 text-center text-theme-muted">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{fieldRecommendations.length === 0 ? t("frEmpty") : t("frNoMatch")}</p>
              {fieldRecommendations.length === 0 && (
                <p className="mt-2 text-sm">{t("frEmptyHint")}</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((rec: FieldRecommendation, i: number) => (
                <div
                  key={`${rec.fieldId}-${rec.reason}-${i}`}
                  className={`rounded-2xl border p-5 flex flex-wrap items-start gap-4 ${
                    rec.priority === "high" ? "bg-red-500/10 border-red-500/40" : "bg-theme-card border-theme"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {rec.reason === "irrigation" ? (
                      <Droplets className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                    ) : (
                      <Activity className="w-8 h-8 text-green-500 dark:text-green-400" />
                    )}
                    <div>
                      <p className="font-semibold text-theme">{rec.fieldName}</p>
                      <p className="text-sm text-theme-muted">
                        {rec.reason === "irrigation" ? t("frReasonIrrigation") : t("frReasonActivity")} · {rec.priority === "high" ? t("frPriorityHigh") : t("frPriorityMedium")}
                      </p>
                    </div>
                  </div>
                  <p className="text-theme-muted flex-1 min-w-[200px]">{rec.message}</p>
                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {rec.reason === "irrigation" && (
                      <Link href="/water" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30 text-sm font-medium">
                        <Droplets className="w-4 h-4" />
                        {t("frLogWater")}
                      </Link>
                    )}
                    <Link
                      href={`/data-bank?field=${rec.fieldId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 text-sm font-medium"
                    >
                      <BookOpen className="w-4 h-4" />
                      {t("frOpenDataBank")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
