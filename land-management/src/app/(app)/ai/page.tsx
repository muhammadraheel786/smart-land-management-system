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
      <div>
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-theme">
          <Brain className="h-8 w-8 text-green-400" />
          AI Insights
        </h1>
        <p className="text-theme-muted">
          Smart analysis and strategic recommendations derived from your farm's performance data.
        </p>
      </div>

      {/* Generate AI insights — production CTA */}
      <div className="rounded-2xl border border-theme bg-theme-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-500/20 p-3">
              <Sparkles className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-theme">AI-powered analysis</h3>
              <p className="text-sm text-theme-muted">
                Analyze your crops, expenses, and soil metrics for optimal yields.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateInsights}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-medium text-theme hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            {loading ? "Generating…" : "Generate AI insights"}
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-theme bg-theme-card p-4">
          <p className="text-xs text-theme-muted">Net profit</p>
          <p className={`text-xl font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
            Rs {netProfit.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-theme bg-theme-card p-4">
          <p className="text-xs text-theme-muted">Cultivated</p>
          <p className="text-xl font-bold text-theme">{cultivatedCount} fields</p>
        </div>
        <div className="rounded-xl border border-theme bg-theme-card p-4">
          <p className="text-xs text-theme-muted">Unused / available</p>
          <p className="text-xl font-bold text-yellow-400">{unusedCount} fields</p>
        </div>
        <div className="rounded-xl border border-theme bg-theme-card p-4">
          <p className="text-xs text-theme-muted">Thaka</p>
          <p className="text-xl font-bold text-theme">
            {thakaRecords.filter((t) => t.status === "active").length} active
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
