"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Droplets, Pencil, Trash, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { WaterAnalysisResponse } from "@/types";
import { format } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";

export default function WaterPage() {
  const { t } = useLocale();
  const { fields, waterRecords, addWaterRecord, updateWaterRecord, deleteWaterRecord, fetchAll, loading, error } = useLandStore();
  const [fieldId, setFieldId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filterFieldId, setFilterFieldId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WaterAnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setAnalysisError(null);
    setAnalysisLoading(true);
    try {
      const data = await api.getWaterAnalysis();
      setAnalysis(data);
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : "Failed to load analysis");
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (editingId) {
      const r = waterRecords.find((x) => x.id === editingId);
      if (r) {
        setFieldId(r.fieldId);
        setDate(r.date);
        setDuration(String(r.durationMinutes ?? ""));
        setNotes(r.notes ?? "");
      }
    }
  }, [editingId, waterRecords]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(false);
    const mins = Number(duration);
    if (!fieldId || !duration || mins < 1) {
      setSubmitError(t("waterDurationMin"));
      return;
    }
    if (editingId) {
      await updateWaterRecord(editingId, { fieldId, date, durationMinutes: mins, notes: notes.trim() || undefined });
      setEditingId(null);
      setDuration("");
      setNotes("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }
    const ok = await addWaterRecord({
      fieldId,
      date,
      durationMinutes: mins,
      notes: notes.trim() || undefined,
    });
    if (ok) {
      setDuration("");
      setNotes("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setSubmitError(t("waterAddFailed"));
    }
  };

  const totalMinutes = useMemo(() => waterRecords.reduce((a, r) => a + (r.durationMinutes || 0), 0), [waterRecords]);
  const recentRecords = useMemo(() => {
    let list = [...waterRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filterFieldId) list = list.filter((r) => r.fieldId === filterFieldId);
    return list.slice(0, 25);
  }, [waterRecords, filterFieldId]);
  const noFields = fields.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-theme mb-2">{t("waterManagement")}</h1>
        <p className="text-theme-muted">{t("waterManagementSubtitle")}</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</div>
      )}

      {loading && fields.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-theme-card border border-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-theme-card border border-theme rounded-2xl p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Droplets className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-theme-muted text-sm">{t("waterTotalSessions")}</p>
                <p className="text-2xl font-bold text-theme">{waterRecords.length}</p>
              </div>
            </div>
            <div className="bg-theme-card border border-theme rounded-2xl p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Droplets className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-theme-muted text-sm">{t("waterTotalDuration")}</p>
                <p className="text-2xl font-bold text-theme">{totalMinutes} {t("minutes")}</p>
              </div>
            </div>
            <div className="bg-theme-card border border-theme rounded-2xl p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Droplets className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-theme-muted text-sm">{t("waterHours")}</p>
                <p className="text-2xl font-bold text-theme">{(totalMinutes / 60).toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* Warnings & AI analysis: next water suggestions */}
          <div className="bg-theme-card border border-theme rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-theme flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                {t("waterWarningsAndAnalysis")}
              </h3>
              <button
                type="button"
                onClick={fetchAnalysis}
                disabled={analysisLoading || noFields}
                className="px-4 py-2 rounded-xl bg-amber-600/80 text-theme font-medium hover:bg-amber-500 disabled:opacity-50 flex items-center gap-2"
              >
                {analysisLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t("waterAnalysisLoading")}
                  </>
                ) : analysis ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {t("waterRefreshAnalysis")}
                  </>
                ) : (
                  t("waterGetAnalysis")
                )}
              </button>
            </div>
            {analysisError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-red-200 text-sm mb-4">{analysisError}</div>
            )}
            {!analysis && !analysisLoading && (
              <p className="text-theme-muted text-sm py-2">{t("waterNoAnalysisYet")}</p>
            )}
            {analysis && (
              <div className="space-y-4">
                {analysis.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {t("waterWarningsTitle")}
                    </h4>
                    <ul className="space-y-2">
                      {analysis.warnings.map((w, i) => (
                        <li
                          key={`${w.fieldId}-${w.type}-${i}`}
                          className={`rounded-xl border p-3 text-sm ${
                            w.priority === "high"
                              ? "border-red-500/40 bg-red-500/10 text-red-200"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                          }`}
                        >
                          <span className="font-medium">{w.fieldName}:</span> {w.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rounded-xl border border-theme bg-theme-track/50 p-4">
                  <h4 className="text-sm font-medium text-theme-muted mb-2">{t("waterAIAnalysisTitle")}</h4>
                  <p className="text-theme text-sm leading-relaxed">{analysis.analysis}</p>
                  {analysis.model && analysis.model !== "built-in" && (
                    <p className="text-theme-muted text-xs mt-2">Powered by {analysis.model}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.perField.map((p, idx) => (
                    <div
                      key={`${p.fieldId}-${idx}`}
                      className={`rounded-xl border p-4 ${
                        p.warning ? "border-amber-500/30 bg-amber-500/5" : "border-theme bg-theme-track/50"
                      }`}
                    >
                      <p className="font-medium text-theme mb-2">{p.fieldName}</p>
                      {p.lastWaterDate ? (
                        <p className="text-xs text-theme-muted mb-1">
                          {t("waterLastWater")}: {format(new Date(p.lastWaterDate), "MMM d, yyyy")} ({p.lastDurationMinutes} min)
                        </p>
                      ) : (
                        <p className="text-xs text-amber-400 mb-1">{t("waterLastWater")}: —</p>
                      )}
                      <p className="text-sm text-blue-400 font-medium mt-2">
                        {t("waterNextSuggested")}: {format(new Date(p.suggestedNextDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-theme-muted">
                        {t("waterSuggestedDuration")}: ~{p.suggestedMinutes} min
                      </p>
                      {p.aiNote && (
                        <p className="text-xs text-theme-muted mt-2 pt-2 border-t border-theme italic">{p.aiNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-theme-card border border-theme rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-theme mb-4">{editingId ? t("edit") : t("waterLogSession")}</h3>
              {noFields ? (
                <p className="text-theme-muted py-4">{t("waterNoFields")}</p>
              ) : (
                <form onSubmit={handleAdd} className="space-y-4">
                  {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
                  {success && <p className="text-green-400 text-sm">{editingId ? t("recordUpdated") : t("waterRecordAdded")}</p>}
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setDuration(""); setNotes(""); }} className="text-sm text-theme-muted hover:text-theme">{t("cancel")}</button>
                  )}
                  <div>
                    <label className="block text-sm text-theme-muted mb-1">{t("field")}</label>
                    <select value={fieldId} onChange={(e) => setFieldId(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme focus:ring-2 focus:ring-blue-500/50">
                      <option value="">{t("selectField")}</option>
                      {fields.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-theme-muted mb-1">{t("date")}</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme" />
                  </div>
                  <div>
                    <label className="block text-sm text-theme-muted mb-1">{t("waterDurationMinutes")}</label>
                    <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={1} max={999} placeholder="45" className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme placeholder-theme" />
                  </div>
                  <div>
                    <label className="block text-sm text-theme-muted mb-1">{t("waterNotesOptional")}</label>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("waterNotesPlaceholder")} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme placeholder-theme" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-blue-600 text-theme font-semibold hover:bg-blue-500 disabled:opacity-50 transition flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    {editingId ? t("update") : t("waterAddRecord")}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-theme-card border border-theme rounded-2xl p-6 overflow-auto max-h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-theme">{t("waterRecentRecords")}</h3>
                {fields.length > 0 && (
                  <select value={filterFieldId} onChange={(e) => setFilterFieldId(e.target.value)} className="px-3 py-1.5 rounded-lg bg-theme-track border border-theme text-theme text-sm">
                    <option value="">{t("waterAllFields")}</option>
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                )}
              </div>
              {waterRecords.length === 0 ? (
                <p className="text-theme-muted">{t("waterNoRecordsYet")}</p>
              ) : (
                <div className="space-y-3">
                  {recentRecords.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-theme">{fields.find((f) => f.id === r.fieldId)?.name || t("field")}</p>
                        <p className="text-sm text-theme-muted">{format(new Date(r.date), "MMM d, yyyy")}{r.notes ? ` • ${r.notes}` : ""}</p>
                      </div>
                      <p className="text-blue-400 font-semibold shrink-0">{r.durationMinutes} {t("minutes")}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => { setEditingId(r.id); setSubmitError(null); setSuccess(false); }} className="p-2 rounded-lg text-theme-muted hover:text-theme hover:bg-white/10" title={t("edit")}><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setDeleteConfirmId(r.id)} className="p-2 rounded-lg text-theme-muted hover:text-red-400 hover:bg-red-500/10" title={t("delete")}><Trash className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteConfirmId(null)}>
              <div className="bg-theme-card border border-theme rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                <p className="text-theme mb-4">{t("confirmDelete")}</p>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl border border-theme text-theme-muted hover:text-theme">{t("cancel")}</button>
                  <button type="button" onClick={async () => { await deleteWaterRecord(deleteConfirmId); setDeleteConfirmId(null); }} className="px-4 py-2 rounded-xl bg-red-600 text-theme hover:bg-red-500">{t("delete")}</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
