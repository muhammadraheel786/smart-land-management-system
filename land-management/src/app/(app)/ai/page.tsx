"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Loader2,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLandStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { AIRecommendation } from "@/types";

export default function AIPage() {
  const {
    fields,
    expenses,
    incomes,
    aiRecommendations,
    generateAIRecommendations,
    waterRecords,
    temperatureRecords,
    thakaRecords,
  } = useLandStore();

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiRecs, setAiRecs] = useState<AIRecommendation[]>([]);
  const [aiModel, setAiModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRuleBased, setShowRuleBased] = useState(false);

  useEffect(() => {
    generateAIRecommendations();
  }, [generateAIRecommendations]);

  const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
  const totalInc = incomes.reduce((a, i) => a + i.amount, 0);
  const netProfit = totalInc - totalExp;
  const cultivatedCount = fields.filter((f) => f.status === "cultivated").length;
  const unusedCount = fields.filter(
    (f) => f.status === "available" || f.status === "uncultivated"
  ).length;

  const handleGenerateInsights = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.getAIInsights();
      setAiSummary(result.summary);
      setAiRecs(result.recommendations);
      setAiModel(result.model);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setAiSummary(null);
      setAiRecs([]);
      setAiModel(null);
    } finally {
      setLoading(false);
    }
  };

  const displayRecs = aiRecs.length > 0 ? aiRecs : aiRecommendations;
  const isAIRecs = aiRecs.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-theme tracking-tight">AI Insights</h1>
          </div>
          <p className="text-xs sm:text-sm text-theme-muted ml-[52px] mt-1">
            Smart analysis and strategic recommendations from your farm's performance data.
          </p>
        </div>
      </div>

      {/* Generate AI insights — production CTA */}
      <div className="rounded-2xl border border-theme bg-theme-card p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-500/20 flex items-center justify-center shadow-inner">
              <Sparkles className="h-7 w-7 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-theme tracking-tight">Analyze farm data</h3>
              <p className="text-sm text-theme-muted font-medium">
                Optimize yields using AI analysis.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateInsights}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3.5 font-black text-white hover:shadow-lg hover:shadow-green-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            {loading ? "Analyzing..." : "Run Analysis"}
          </button>
        </div>
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">Analysis currently unavailable. Please verify data records.</p>
          </div>
        )}
        {aiModel && (
          <p className="mt-3 text-xs text-theme-muted font-medium uppercase tracking-wider">
            Smart Optimizer Active
          </p>
        )}
      </div>

      {/* AI summary (when available) */}
      {aiSummary && (
        <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-600/5 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-green-500/20 p-2">
              <Brain className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-theme">AI summary</h3>
          </div>
          <p className="text-theme leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Quick stats (always) */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-theme bg-theme-card p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-1">Net profit</p>
          <p className={`text-2xl font-black ${netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            Rs {netProfit.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-theme bg-theme-card p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-1">Cultivated</p>
          <p className="text-2xl font-black text-theme">{cultivatedCount} <span className="text-xs font-normal text-theme-muted">fields</span></p>
        </div>
        <div className="rounded-2xl border border-theme bg-theme-card p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-1">Unused</p>
          <p className="text-2xl font-black text-amber-500">{unusedCount} <span className="text-xs font-normal text-theme-muted">available</span></p>
        </div>
        <div className="rounded-2xl border border-theme bg-theme-card p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted mb-1">Thaka</p>
          <p className="text-2xl font-black text-blue-500">
            {thakaRecords.filter((t) => t.status === "active").length} <span className="text-xs font-normal text-theme-muted">active</span>
          </p>
        </div>
      </div>

      {/* Rule-based summary (collapsible) */}
      <div className="rounded-2xl border border-theme bg-theme-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRuleBased(!showRuleBased)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <span className="flex items-center gap-2 text-theme-muted">
            <Info className="h-4 w-4" />
            Quick analysis (rule-based)
          </span>
          {showRuleBased ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showRuleBased && (
          <ul className="space-y-2 border-t border-theme px-6 pb-4 pt-2 text-sm text-theme">
            {netProfit < 0 && (
              <li>• Overall farm is currently at a loss. Review high-expense fields.</li>
            )}
            {unusedCount > 0 && (
              <li>• {unusedCount} field(s) are unused. Consider Thaka or cultivation.</li>
            )}
            {cultivatedCount > 0 && (
              <li>• {cultivatedCount} field(s) are under active cultivation.</li>
            )}
            {fields.some((f) => f.status === "thaka") && (
              <li>• Thaka income is being tracked.</li>
            )}
            {waterRecords.length > 0 && (
              <li>• {waterRecords.length} water record(s). Monitor irrigation.</li>
            )}
            {temperatureRecords.length > 0 && (
              <li>• Temperature data available for field-level insights.</li>
            )}
            {totalExp === 0 && totalInc === 0 && (
              <li>• Add expense and income records for better insights.</li>
            )}
          </ul>
        )}
      </div>

      {/* Recommendations list */}
      <div className="rounded-2xl border border-theme bg-theme-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-theme">
          {isAIRecs ? (
            <>
              <Sparkles className="h-5 w-5 text-green-400" />
              AI recommendations
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Recommendations
            </>
          )}
        </h3>
        {displayRecs.length === 0 ? (
          <p className="text-theme-muted">
            No recommendations yet. Click &quot;Generate AI insights&quot; for AI analysis, or add more data (expenses, income, water, fields) for rule-based suggestions.
          </p>
        ) : (
          <div className="space-y-3">
            {displayRecs.map((r) => (
              <div
                key={r.id}
                className={`flex gap-4 rounded-xl border-l-4 p-4 ${r.type === "warning"
                  ? "border-red-500 bg-red-500/5"
                  : r.type === "suggestion"
                    ? "border-yellow-500 bg-yellow-500/5"
                    : "border-blue-500/50 bg-blue-500/5"
                  }`}
              >
                {r.type === "warning" ? (
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
                ) : r.type === "suggestion" ? (
                  <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5 text-yellow-400" />
                ) : (
                  <Brain className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-theme">{r.title}</p>
                  <p className="text-sm text-theme-muted">{r.message}</p>
                  {r.fieldId && (
                    <p className="mt-1 text-xs text-theme-muted">Field ID: {r.fieldId}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${r.priority === "high"
                    ? "bg-red-500/20 text-red-400"
                    : r.priority === "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-theme-track text-theme-muted"
                    }`}
                >
                  {r.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
