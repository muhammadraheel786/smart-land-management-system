"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Map,
  TrendingUp,
  Wallet,
  Droplets,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  MessageSquare,
  ClipboardList,
  Target,
  Activity,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, startOfYear } from "date-fns";
import { useLandStore } from "@/lib/store";
import { useLocale } from "@/contexts/LocaleContext";
import StatsCard from "@/components/StatsCard";

const MONTHS_6 = 6;

type TimeRangeKey = "all" | "this_year" | "last_6_months" | "this_month";

function getDateFilter(range: TimeRangeKey): (dateStr: string) => boolean {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  if (range === "all") return () => true;
  if (range === "this_month") {
    const start = format(startOfMonth(now), "yyyy-MM-dd");
    return (d) => d >= start && d <= today;
  }
  if (range === "this_year") {
    const start = format(startOfYear(now), "yyyy-MM-dd");
    return (d) => d >= start && d <= today;
  }
  const start = format(subMonths(now, 6), "yyyy-MM-dd");
  return (d) => d >= start && d <= today;
}

export default function DashboardPage() {
  const { t } = useLocale();
  const {
    fields,
    expenses,
    incomes,
    waterRecords,
    thakaRecords,
    aiRecommendations,
    fieldRecommendations,
    fetchAll,
    fetchFieldRecommendations,
    generateAIRecommendations,
    loading,
    error,
  } = useLandStore();

  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (fields.length > 0) {
      fetchFieldRecommendations().catch(() => {});
    }
  }, [fields.length, fetchFieldRecommendations]);

  useEffect(() => {
    if (fields.length > 0 || expenses.length > 0 || incomes.length > 0) {
      generateAIRecommendations();
    }
  }, [fields.length, expenses.length, incomes.length, generateAIRecommendations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll()
      .then(() => {
        setLastUpdated(new Date());
        return fetchFieldRecommendations().catch(() => {});
      })
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    if (!loading && !error && lastUpdated === null) {
      setLastUpdated(new Date());
    }
  }, [loading, error, lastUpdated]);

  const dateFilter = useMemo(() => getDateFilter(timeRange), [timeRange]);

  const totals = useMemo(() => {
    const totalArea = fields.reduce((a, f) => a + (f.area || 0), 0);
    const filteredExpenses = expenses.filter((e) => dateFilter(e.date || ""));
    const filteredIncomes = incomes.filter((i) => dateFilter(i.date || ""));
    const filteredWater = waterRecords.filter((w) => dateFilter(w.date || ""));
    const totalExp = filteredExpenses.reduce((a, e) => a + e.amount, 0);
    const totalInc = filteredIncomes.reduce((a, i) => a + i.amount, 0);
    const totalWaterMins = filteredWater.reduce((a, w) => a + (w.durationMinutes || 0), 0);
    const activeThaka = thakaRecords.filter((tr) => tr.status === "active").length;
    return {
      totalArea,
      totalExp,
      totalInc,
      netProfit: totalInc - totalExp,
      totalWaterMins,
      activeThaka,
      waterSessionCount: filteredWater.length,
    };
  }, [fields, expenses, incomes, waterRecords, thakaRecords, dateFilter]);

  const cultivatedArea = useMemo(
    () => fields.filter((f) => f.status === "cultivated").reduce((a, f) => a + (f.area || 0), 0),
    [fields]
  );
  const thakaArea = useMemo(
    () => fields.filter((f) => f.status === "thaka").reduce((a, f) => a + (f.area || 0), 0),
    [fields]
  );

  const recHigh = useMemo(() => fieldRecommendations.filter((r) => r.priority === "high").length, [fieldRecommendations]);
  const recMedium = useMemo(
    () => fieldRecommendations.filter((r) => r.priority === "medium").length,
    [fieldRecommendations]
  );

  const monthlyData = useMemo(() => {
    return Array.from({ length: MONTHS_6 }, (_, i) => {
      const m = subMonths(new Date(), MONTHS_6 - 1 - i);
      const mStr = format(m, "yyyy-MM");
      const exp = expenses
        .filter((e) => (e.date || "").slice(0, 7) === mStr)
        .reduce((a, e) => a + e.amount, 0);
      const inc = incomes
        .filter((i) => (i.date || "").slice(0, 7) === mStr)
        .reduce((a, i) => a + i.amount, 0);
      return { month: format(m, "MMM yy"), expense: exp, income: inc };
    });
  }, [expenses, incomes]);

  const recentActivity = useMemo(() => {
    const combined: { date: string; amount: number; type: "expense" | "income"; fieldId?: string; id: string }[] = [
      ...expenses.map((e) => ({
        date: e.date || "",
        amount: e.amount,
        type: "expense" as const,
        fieldId: e.fieldId,
        id: e.id || `e-${e.date}`,
      })),
      ...incomes.map((i) => ({
        date: i.date || "",
        amount: i.amount,
        type: "income" as const,
        fieldId: i.fieldId,
        id: i.id || `i-${i.date}`,
      })),
    ];
    return combined
      .filter((x) => x.date)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [expenses, incomes]);

  const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)" };

  if (loading && fields.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="h-10 w-64 rounded bg-theme-card animate-pulse" />
          <div className="h-10 w-28 rounded bg-theme-card animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-theme-card border border-theme animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-theme-card border border-theme animate-pulse" />
          <div className="h-64 rounded-2xl bg-theme-card border border-theme animate-pulse" />
        </div>
        <div className="h-72 rounded-2xl bg-theme-card border border-theme animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-theme mb-2">{t("dashboard")}</h1>
          <p className="text-theme-muted">{t("dashboardSubtitle")}</p>
          {lastUpdated && (
            <p className="text-xs text-theme-muted mt-1">
              {t("lastUpdated")}: {format(lastUpdated, "dd MMM yyyy, HH:mm")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}
            className="px-3 py-2 rounded-xl bg-theme-card border border-theme text-theme text-sm"
          >
            <option value="all">{t("timeRangeAll")}</option>
            <option value="this_year">{t("timeRangeThisYear")}</option>
            <option value="last_6_months">{t("timeRangeLast6Months")}</option>
            <option value="this_month">{t("timeRangeThisMonth")}</option>
          </select>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-card border border-theme text-theme-muted hover:text-theme hover:border-green-500/50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || loading ? "animate-spin" : ""}`} />
            {t("dashboardRefresh")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {t("dashboardError")}: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 [&>*]:min-w-0">
        <StatsCard
          href="/fields"
          title={t("totalLandArea")}
          value={`${totals.totalArea.toFixed(1)} ${t("acres")}`}
          subtitle={`${fields.length} ${t("fieldsCount").toLowerCase()}`}
          icon={Map}
          color="green"
        />
        <StatsCard
          href="/expenses"
          title={t("totalInvestment")}
          value={`Rs ${totals.totalExp.toLocaleString()}`}
          icon={Wallet}
          color="blue"
        />
        <StatsCard
          href="/expenses?tab=income"
          title={t("totalIncome")}
          value={`Rs ${totals.totalInc.toLocaleString()}`}
          icon={TrendingUp}
          color="yellow"
        />
        <StatsCard
          href="/expenses"
          title={t("netProfit")}
          value={`Rs ${totals.netProfit.toLocaleString()}`}
          trend={totals.netProfit >= 0 ? "up" : "down"}
          trendUpLabel={t("trendUp")}
          trendDownLabel={t("trendDown")}
          icon={TrendingUp}
          color={totals.netProfit >= 0 ? "green" : "red"}
        />
        <StatsCard
          href="/water"
          title={t("totalIrrigation")}
          value={`${totals.totalWaterMins} ${t("minutes")}`}
          subtitle={totals.waterSessionCount ? `${totals.waterSessionCount} ${t("sessions")}` : undefined}
          icon={Droplets}
          color="blue"
        />
        <StatsCard
          href="/fields"
          title={t("fieldsCount")}
          value={fields.length}
          subtitle={totals.activeThaka > 0 ? `${totals.activeThaka} ${t("thaka")}` : undefined}
          icon={Activity}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">{t("landDistribution")}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-theme-muted">{t("cultivated")}</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {totals.totalArea ? ((cultivatedArea / totals.totalArea) * 100).toFixed(0) : 0}% — {cultivatedArea.toFixed(1)} {t("acres")}
                </span>
              </div>
              <div className="w-full bg-theme-track rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-green-500 transition-all"
                  style={{ width: `${totals.totalArea ? (cultivatedArea / totals.totalArea) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-theme-muted">{t("onThaka")}</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {totals.totalArea ? ((thakaArea / totals.totalArea) * 100).toFixed(0) : 0}% — {thakaArea.toFixed(1)} {t("acres")}
                </span>
              </div>
              <div className="w-full bg-theme-track rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${totals.totalArea ? (thakaArea / totals.totalArea) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">{t("quickActions")}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link
              href="/map"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-theme-track hover:opacity-90 transition border border-theme text-center text-theme"
            >
              <Map className="w-5 h-5 text-green-500" />
              <span className="text-sm">{t("viewMap")}</span>
            </Link>
            <Link
              href="/expenses"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-theme-track hover:opacity-90 transition border border-theme text-center text-theme"
            >
              <Wallet className="w-5 h-5 text-blue-500" />
              <span className="text-sm">{t("addExpense")}</span>
            </Link>
            <Link
              href="/expenses?tab=income"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-theme-track hover:opacity-90 transition border border-theme text-center text-theme"
            >
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm">{t("addIncome")}</span>
            </Link>
            <Link
              href="/water"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-theme-track hover:opacity-90 transition border border-theme text-center text-theme"
            >
              <Droplets className="w-5 h-5 text-cyan-500" />
              <span className="text-sm">{t("logWater")}</span>
            </Link>
            <Link
              href="/thaka"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-theme-track hover:opacity-90 transition border border-theme text-center text-theme"
            >
              <ClipboardList className="w-5 h-5 text-yellow-500" />
              <span className="text-sm">{t("thakaRecords")}</span>
            </Link>
            <Link
              href="/data-bank"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-theme-track hover:opacity-90 transition border border-theme text-center text-theme"
            >
              <Activity className="w-5 h-5 text-emerald-500" />
              <span className="text-sm">{t("dataBankShort")}</span>
            </Link>
            <Link
              href="/field-recommendations"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-theme-track hover:opacity-90 transition border border-theme text-center text-theme"
            >
              <Target className="w-5 h-5 text-orange-500" />
              <span className="text-sm">{t("fieldRecommendations")}</span>
            </Link>
            <Link
              href="/predictions"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-theme-track hover:opacity-90 transition border border-theme text-center text-theme"
            >
              <BarChart3 className="w-5 h-5 text-violet-500" />
              <span className="text-sm">{t("predictions")}</span>
            </Link>
            <Link
              href="/chatbot"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-theme-track hover:opacity-90 transition border border-theme text-center text-theme"
            >
              <MessageSquare className="w-5 h-5 text-green-500" />
              <span className="text-sm">{t("askAI")}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-theme">{t("recommendationsSummary")}</h3>
            <Link
              href="/field-recommendations"
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              {t("viewAllRecommendations")}
            </Link>
          </div>
          {fieldRecommendations.length === 0 ? (
            <p className="text-theme-muted text-sm">
              {fields.length === 0 ? t("frNoFields") : t("frEmptyHint")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {recHigh > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-300 text-sm">
                  {recHigh} {t("frHighPriority")}
                </span>
              )}
              {recMedium > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-600 dark:text-yellow-300 text-sm">
                  {recMedium} {t("frMediumPriority")}
                </span>
              )}
              <span className="text-theme-muted text-sm">
                {t("frTotal")}: {fieldRecommendations.length}
              </span>
            </div>
          )}
        </div>

        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-theme">{t("recentExpensesIncome")}</h3>
            <Link
              href="/expenses"
              className="text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              {t("expensesIncome")}
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-theme-muted text-sm">{t("noRecentActivity")}</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-theme last:border-0 text-sm"
                >
                  <span className="text-theme-muted">
                    {item.date ? format(new Date(item.date + "T12:00:00"), "dd MMM yyyy") : "—"}
                  </span>
                  <span className={item.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                    {item.type === "income" ? "+" : "−"} Rs {item.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-theme-card border border-theme rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-theme">{t("monthlyIncomeVsExpense")}</h3>
          <Link
            href="/statistics"
            className="text-sm text-green-600 dark:text-green-400 hover:underline inline-flex items-center gap-1"
          >
            {t("viewAllStats")}
          </Link>
        </div>
        <p className="text-theme-muted text-sm mb-4">{t("last6Months")}</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--muted)" />
            <YAxis stroke="var(--muted)" />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined) => `Rs ${Number(value ?? 0).toLocaleString()}`}
            />
            <Legend />
            <Bar dataKey="income" name={t("incomeShort")} fill="var(--primary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name={t("expenseShort")} fill="var(--not-usable)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-theme-card border border-theme rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          {t("aiRecommendations")}
        </h3>
        {aiRecommendations.length === 0 ? (
          <p className="text-theme-muted">{t("aiRecommendationsEmpty")}</p>
        ) : (
          <div className="space-y-3">
            {aiRecommendations.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-xl border-l-4 ${
                  r.type === "warning" ? "border-red-500 bg-red-500/10" : "border-yellow-500 bg-yellow-500/10"
                }`}
              >
                <p className="font-medium text-theme">{r.title}</p>
                <p className="text-sm text-theme-muted">{r.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
