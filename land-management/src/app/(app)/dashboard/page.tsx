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
  ChevronDown,
  ArrowRight,
  TrendingDown,
  Calendar,
  Layers,
  Sprout
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, startOfYear } from "date-fns";
import { useLandStore } from "@/lib/store";
import { useLocale } from "@/contexts/LocaleContext";

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

// ── clean modern collapsible section ──────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true, action }: { title: string; icon?: React.ElementType, children: React.ReactNode; defaultOpen?: boolean, action?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-theme-card/50 backdrop-blur-sm border border-theme rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-theme/50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 flex-1 text-left group"
        >
          {Icon && <Icon className="w-5 h-5 text-theme-muted group-hover:text-green-500 transition-colors" />}
          <span className="font-semibold text-theme tracking-wide truncate">{title}</span>
          <ChevronDown className={`w-4 h-4 text-theme-muted transition-transform duration-300 ml-1 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {action && <div className="ml-4">{action}</div>}
      </div>
      <div className={`transition-all duration-300 ease-in-out flex-1 flex flex-col ${isOpen ? "opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <div className="px-5 py-5 flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── elegant stat card ─────────────────────────────────────────────────────────
function StatCard({ href, label, value, subValue, icon: Icon, trend }: { href: string; label: string; value: string; subValue?: string; icon: React.ElementType, trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <Link href={href} className="group flex flex-col justify-between p-5 rounded-3xl bg-theme-card border border-theme hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300 translate-y-0 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-theme-track flex items-center justify-center group-hover:bg-green-500/10 group-hover:text-green-500 transition-colors text-theme-muted">
          <Icon className="w-6 h-6 stroke-[1.5]" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${trend === 'up' ? 'text-green-500 bg-green-500/10' : trend === 'down' ? 'text-red-500 bg-red-500/10' : 'text-theme-muted bg-theme-track'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-theme-muted mb-1">{label}</h3>
        <p className="text-2xl font-bold text-theme tracking-tight">{value}</p>
        {subValue && <p className="text-xs text-theme-muted mt-1 font-medium">{subValue}</p>}
      </div>
    </Link>
  );
}

// ── modern quick-action pill ─────────────────────────────────────────────────
function QuickAction({ href, icon: Icon, label, highlight = false }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300 active:scale-95 ${highlight ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400/50 shadow-lg shadow-green-500/20 text-white hover:shadow-xl hover:shadow-green-500/30' : 'bg-theme-card border-theme text-theme hover:border-green-500/50 hover:bg-theme-track'}`}
    >
      <Icon className={`w-6 h-6 ${highlight ? 'text-white' : 'text-theme-muted group-hover:text-green-500'}`} />
      <span className="text-xs font-semibold text-center leading-tight">{label}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const { t } = useLocale();
  const {
    fields, expenses, incomes, waterRecords, thakaRecords,
    aiRecommendations, fieldRecommendations,
    fetchAll, fetchFieldRecommendations, generateAIRecommendations,
    loading, error,
  } = useLandStore();

  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (fields.length > 0) fetchFieldRecommendations().catch(() => { });
  }, [fields.length, fetchFieldRecommendations]);

  useEffect(() => {
    if (fields.length > 0 || expenses.length > 0 || incomes.length > 0)
      generateAIRecommendations();
  }, [fields.length, expenses.length, incomes.length, generateAIRecommendations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll()
      .then(() => { setLastUpdated(new Date()); return fetchFieldRecommendations().catch(() => { }); })
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    if (!loading && !error && lastUpdated === null) setLastUpdated(new Date());
  }, [loading, error, lastUpdated]);

  const dateFilter = useMemo(() => getDateFilter(timeRange), [timeRange]);

  const totals = useMemo(() => {
    const totalArea = fields.reduce((a, f) => a + (f.area || 0), 0);
    const filteredExp = expenses.filter((e) => dateFilter(e.date || ""));
    const filteredInc = incomes.filter((i) => dateFilter(i.date || ""));
    const filteredWater = waterRecords.filter((w) => dateFilter(w.date || ""));
    const totalExp = filteredExp.reduce((a, e) => a + e.amount, 0);
    const totalInc = filteredInc.reduce((a, i) => a + i.amount, 0);
    const totalWaterMin = filteredWater.reduce((a, w) => a + (w.durationMinutes || 0), 0);
    const activeThaka = thakaRecords.filter((tr) => tr.status === "active").length;
    return { totalArea, totalExp, totalInc, netProfit: totalInc - totalExp, totalWaterMin, activeThaka, waterSessions: filteredWater.length };
  }, [fields, expenses, incomes, waterRecords, thakaRecords, dateFilter]);

  const cultivatedArea = useMemo(() => fields.filter((f) => f.status === "cultivated").reduce((a, f) => a + (f.area || 0), 0), [fields]);
  const thakaArea = useMemo(() => fields.filter((f) => f.status === "thaka").reduce((a, f) => a + (f.area || 0), 0), [fields]);
  const recHigh = useMemo(() => fieldRecommendations.filter((r) => r.priority === "high").length, [fieldRecommendations]);
  const recMedium = useMemo(() => fieldRecommendations.filter((r) => r.priority === "medium").length, [fieldRecommendations]);

  const monthlyData = useMemo(() =>
    Array.from({ length: MONTHS_6 }, (_, i) => {
      const m = subMonths(new Date(), MONTHS_6 - 1 - i);
      const mStr = format(m, "yyyy-MM");
      const exp = expenses.filter((e) => (e.date || "").slice(0, 7) === mStr).reduce((a, e) => a + e.amount, 0);
      const inc = incomes.filter((i) => (i.date || "").slice(0, 7) === mStr).reduce((a, i) => a + i.amount, 0);
      return { month: format(m, "MMM"), expense: exp, income: inc };
    }), [expenses, incomes]);

  const recentActivity = useMemo(() => {
    const combined = [
      ...expenses.map((e) => ({ date: e.date || "", amount: e.amount, type: "expense" as const, id: e.id || `e-${e.date}` })),
      ...incomes.map((i) => ({ date: i.date || "", amount: i.amount, type: "income" as const, id: i.id || `i-${i.date}` })),
    ];
    return combined.filter((x) => x.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [expenses, incomes]);

  const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--foreground)", padding: "12px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" };

  // ── loading skeleton ────────────────────────────────────────────────────────
  if (loading && fields.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center pb-4">
          <div className="h-8 w-48 bg-theme-track rounded-lg"></div>
          <div className="h-8 w-10 bg-theme-track rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded-3xl bg-theme-track" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-3xl bg-theme-track" />
          <div className="h-80 rounded-3xl bg-theme-track" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── PAGE HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-theme tracking-tight flex items-center gap-3">
            {t("dashboard")}
            {refreshing && <RefreshCw className="w-5 h-5 text-green-500 animate-spin" />}
          </h1>
          <p className="text-sm text-theme-muted mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {lastUpdated ? `${t("lastUpdated")}: ${format(lastUpdated, "MMM do, HH:mm")}` : 'Up to date'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-theme-track border border-theme text-sm font-medium text-theme focus:ring-2 focus:ring-green-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">{t("timeRangeAll")}</option>
              <option value="this_year">{t("timeRangeThisYear")}</option>
              <option value="last_6_months">{t("timeRangeLast6Months")}</option>
              <option value="this_month">{t("timeRangeThisMonth")}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2.5 rounded-xl bg-theme-track border border-theme hover:bg-theme-card hover:border-green-500/50 transition-all text-theme-muted active:scale-95"
            aria-label="Refresh Data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-500 font-medium flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{t("dashboardError")}: {error}</span>
        </div>
      )}

      {/* ── STAT CARDS GRID ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard href="/fields" icon={Map} label={t("totalLandArea")} value={`${totals.totalArea.toFixed(1)} ${t("acres")}`} subValue={`${fields.length} Active Fields`} />
        <StatCard href="/expenses" icon={Wallet} label={t("totalInvestment")} value={`Rs ${totals.totalExp.toLocaleString()}`} trend="down" />
        <StatCard href="/expenses?tab=income" icon={TrendingUp} label={t("totalIncome")} value={`Rs ${totals.totalInc.toLocaleString()}`} trend="up" />
        <StatCard href="/expenses" icon={Activity} label={t("netProfit")} value={`Rs ${totals.netProfit.toLocaleString()}`} trend={totals.netProfit >= 0 ? "up" : "down"} />
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-bold text-theme mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-500" /> Quick Actions
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-9 gap-3 sm:gap-4">
          <QuickAction href="/map" icon={Map} label={t("viewMap")} highlight />
          <QuickAction href="/activities" icon={Activity} label={t("activities")} />
          <QuickAction href="/expenses" icon={Wallet} label={t("addExpense")} />
          <QuickAction href="/expenses?tab=income" icon={TrendingUp} label={t("addIncome")} />
          <QuickAction href="/water" icon={Droplets} label={t("logWater")} />
          <QuickAction href="/thaka" icon={ClipboardList} label={t("thakaRecords")} />
          <QuickAction href="/field-recommendations" icon={Sprout} label={t("fieldRecommendations")} />
          <QuickAction href="/predictions" icon={BarChart3} label={t("predictions")} />
          <QuickAction href="/chatbot" icon={MessageSquare} label={t("askAI")} />
        </div>
      </div>

      {/* ── MAIN DASHBOARD LAYOUT ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (Charts & AI) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Section
            title={t("monthlyIncomeVsExpense")}
            icon={BarChart3}
            action={
              <Link href="/statistics" className="text-sm font-medium text-green-500 hover:text-green-600 flex items-center gap-1">
                Details <ArrowRight className="w-4 h-4" />
              </Link>
            }
          >
            <div className="w-full h-[300px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted)" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `Rs ${value / 1000}k`} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} formatter={(value: number | undefined) => `Rs ${(value ?? 0).toLocaleString()}`} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                  <Bar dataKey="income" name={t("incomeShort")} fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expense" name={t("expenseShort")} fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* AI Recommendations */}
          {aiRecommendations.length > 0 && (
            <Section title={t("aiRecommendations")} icon={AlertTriangle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aiRecommendations.slice(0, 4).map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-theme-track border border-theme flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-theme text-sm flex items-center gap-2">
                        {r.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Sprout className="w-4 h-4 text-green-500" />}
                        {r.title}
                      </h4>
                    </div>
                    <p className="text-sm text-theme-muted leading-relaxed line-clamp-3">{r.message}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right Column (Distribution & Activities) */}
        <div className="flex flex-col gap-6">
          <Section title={t("landDistribution")} icon={Layers}>
            <div className="space-y-6 pt-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-black text-theme">{totals.totalArea.toFixed(1)}</p>
                  <p className="text-sm text-theme-muted font-medium">{t("totalLandArea")} ({t("acres")})</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Map className="w-6 h-6 text-green-500" />
                </div>
              </div>

              <div className="space-y-5">
                {[
                  { label: t("cultivated"), area: cultivatedArea, color: "bg-green-500", text: "text-green-500" },
                  { label: "On Thaka", area: thakaArea, color: "bg-blue-500", text: "text-blue-500" },
                ].map((row) => {
                  const percentage = totals.totalArea ? Math.round((row.area / totals.totalArea) * 100) : 0;
                  return (
                    <div key={row.label}>
                      <div className="flex justify-between items-center mb-2 font-medium">
                        <span className="text-sm text-theme-muted">{row.label}</span>
                        <span className={`text-sm ${row.text}`}>{percentage}% — {row.area.toFixed(1)} ac</span>
                      </div>
                      <div className="w-full bg-theme-track rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section
            title={t("recentExpensesIncome")}
            icon={Activity}
            action={
              <Link href="/expenses" className="text-sm font-medium text-theme-muted hover:text-theme flex items-center gap-1">
                View All
              </Link>
            }
          >
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Wallet className="w-10 h-10 text-theme-muted opacity-50 mb-3" />
                <p className="text-theme font-medium">No Recent Activity</p>
                <p className="text-sm text-theme-muted">{t("noRecentActivity")}</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {recentActivity.map((item) => (
                  <li key={item.id} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {item.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-theme capitalize truncate">{item.type}</p>
                      <p className="text-xs text-theme-muted">{item.date ? format(new Date(item.date + "T12:00:00"), "MMM do, yyyy") : "—"}</p>
                    </div>
                    <div className={`font-bold whitespace-nowrap ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {item.type === 'income' ? '+' : '−'} Rs {item.amount.toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
