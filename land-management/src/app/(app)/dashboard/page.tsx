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
  ChevronUp,
  ArrowRight,
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

// ── tiny mobile-only collapsible section ──────────────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-theme-card border border-theme rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-theme-track/40 transition-colors group"
      >
        <span className="text-xs font-bold text-theme uppercase tracking-widest truncate">{title}</span>
        <div className={`p-1 rounded-lg bg-theme-track/60 border border-theme transform transition-transform duration-300 flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDown className="w-3.5 h-3.5 text-theme-muted group-hover:text-green-400" />
        </div>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[1500px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          }`}
      >
        <div className="px-4 pb-4 border-t border-theme/30 pt-3">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── compact stat chip ─────────────────────────────────────────────────────────
function StatChip({ href, label, value, color }: { href: string; label: string; value: string; color: "green" | "blue" | "yellow" | "red" }) {
  const colorCls = color === "green" ? "bg-green-500/10 text-green-400 border-green-500/20" : color === "blue" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : color === "yellow" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-red-500/10 text-red-400 border-red-500/20";
  return (
    <Link href={href} className={`flex-shrink-0 flex flex-col justify-center px-4 py-2.5 rounded-2xl border ${colorCls} min-w-[120px] active:scale-95 transition-transform scroll-ml-4`}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5 truncate">{label}</span>
      <span className="text-sm font-black truncate">{value}</span>
    </Link>
  );
}

// ── quick-action pill ─────────────────────────────────────────────────────────
function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-theme-track border border-theme hover:border-green-500/40 hover:bg-green-500/5 transition-all active:scale-95 min-w-[72px] flex-shrink-0 scroll-ml-4"
    >
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-[10px] font-semibold text-[var(--muted)] text-center leading-tight truncate px-1 max-w-[70px]">{label}</span>
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
      return { month: format(m, "MMM yy"), expense: exp, income: inc };
    }), [expenses, incomes]);

  const recentActivity = useMemo(() => {
    const combined = [
      ...expenses.map((e) => ({ date: e.date || "", amount: e.amount, type: "expense" as const, id: e.id || `e-${e.date}` })),
      ...incomes.map((i) => ({ date: i.date || "", amount: i.amount, type: "income" as const, id: i.id || `i-${i.date}` })),
    ];
    return combined.filter((x) => x.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [expenses, incomes]);

  const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)" };

  // ── loading skeleton ────────────────────────────────────────────────────────
  if (loading && fields.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 w-36 flex-shrink-0 rounded-2xl bg-theme-card border border-theme animate-pulse" />)}
        </div>
        <div className="h-48 rounded-2xl bg-theme-card border border-theme animate-pulse" />
        <div className="h-40 rounded-2xl bg-theme-card border border-theme animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">

      {/* ── PAGE HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-theme leading-tight truncate">{t("dashboard")}</h1>
          {lastUpdated && (
            <p className="text-[10px] md:text-xs text-[var(--muted)] mt-0.5 truncate">
              {t("lastUpdated")}: {format(lastUpdated, "dd MMM, HH:mm")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRangeKey)}
            className="text-xs md:text-sm px-2 py-1.5 md:px-3 md:py-2 rounded-xl bg-theme-card border border-theme text-theme max-w-[150px] truncate"
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
            className="p-1.5 md:p-2 rounded-xl bg-theme-card border border-theme text-[var(--muted)] hover:text-theme hover:border-green-500/40 transition disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-red-200 text-sm">
          {t("dashboardError")}: {error}
        </div>
      )}

      {/* ── STAT CHIPS — horizontal scroll on mobile, grid on desktop ──── */}
      <div className="w-[calc(100%+24px)] -ml-3 md:ml-0 md:w-full md:hidden">
        <div className="flex gap-2.5 overflow-x-auto pb-2 px-3 scrollbar-none snap-x pointer-events-auto">
          <StatChip href="/fields" label={t("totalLandArea")} value={`${totals.totalArea.toFixed(1)} ac`} color="green" />
          <StatChip href="/expenses" label={t("totalInvestment")} value={`Rs ${totals.totalExp.toLocaleString()}`} color="blue" />
          <StatChip href="/expenses?tab=income" label={t("totalIncome")} value={`Rs ${totals.totalInc.toLocaleString()}`} color="yellow" />
          <StatChip href="/expenses" label={t("netProfit")} value={`Rs ${totals.netProfit.toLocaleString()}`} color={totals.netProfit >= 0 ? "green" : "red"} />
          <StatChip href="/water" label={t("totalIrrigation")} value={`${totals.totalWaterMin} min`} color="blue" />
          <StatChip href="/fields" label={t("fieldsCount")} value={`${fields.length} fields`} color="green" />
        </div>
      </div>

      {/* Desktop stat grid (unchanged from before) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {(
          [
            { href: "/fields", title: t("totalLandArea"), value: `${totals.totalArea.toFixed(1)} ${t("acres")}`, subtitle: `${fields.length} ${t("fieldsCount").toLowerCase()}`, color: "green" },
            { href: "/expenses", title: t("totalInvestment"), value: `Rs ${totals.totalExp.toLocaleString()}`, color: "blue" },
            { href: "/expenses?tab=income", title: t("totalIncome"), value: `Rs ${totals.totalInc.toLocaleString()}`, color: "yellow" },
            { href: "/expenses", title: t("netProfit"), value: `Rs ${totals.netProfit.toLocaleString()}`, color: totals.netProfit >= 0 ? "green" : "red" },
            { href: "/water", title: t("totalIrrigation"), value: `${totals.totalWaterMin} ${t("minutes")}`, subtitle: totals.waterSessions ? `${totals.waterSessions} ${t("sessions")}` : undefined, color: "blue" },
            { href: "/fields", title: t("fieldsCount"), value: String(fields.length), subtitle: totals.activeThaka > 0 ? `${totals.activeThaka} Thaka` : undefined, color: "green" },
          ] as { href: string; title: string; value: string; subtitle?: string; color: "green" | "blue" | "yellow" | "red" }[]
        ).map((s) => {
          const borderCls = s.color === "green" ? "border-green-500/25 bg-gradient-to-br from-green-500/10 to-emerald-600/5" : s.color === "blue" ? "border-blue-500/25 bg-gradient-to-br from-blue-500/10 to-cyan-600/5" : s.color === "yellow" ? "border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-yellow-600/5" : "border-red-500/25 bg-gradient-to-br from-red-500/10 to-rose-600/5";
          const textCls = s.color === "green" ? "text-green-400" : s.color === "blue" ? "text-blue-400" : s.color === "yellow" ? "text-amber-400" : "text-red-400";
          return (
            <Link key={s.title} href={s.href} className={`block rounded-2xl border bg-theme-card p-5 shadow-sm transition hover:-translate-y-0.5 ${borderCls}`}>
              <p className="text-xs text-[var(--muted)] mb-2 truncate">{s.title}</p>
              <p className={`text-xl font-bold ${textCls}`}>{s.value}</p>
              {s.subtitle && <p className={`text-xs mt-1 opacity-80 ${textCls}`}>{s.subtitle}</p>}
            </Link>
          );
        })}
      </div>

      {/* ── QUICK ACTIONS — horizontal scroll on mobile ─────────────────── */}
      <div>
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 truncate">{t("quickActions")}</p>
        <div className="w-[calc(100%+24px)] -ml-3 md:ml-0 md:w-full overflow-hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 px-3 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-none snap-x">
            <QuickAction href="/map" icon={Map} label={t("viewMap")} color="text-green-500" />
            <QuickAction href="/activities" icon={Activity} label={t("activities")} color="text-emerald-500" />
            <QuickAction href="/expenses" icon={Wallet} label={t("addExpense")} color="text-blue-500" />
            <QuickAction href="/expenses?tab=income" icon={TrendingUp} label={t("addIncome")} color="text-green-500" />
            <QuickAction href="/water" icon={Droplets} label={t("logWater")} color="text-cyan-500" />
            <QuickAction href="/thaka" icon={ClipboardList} label={t("thakaRecords")} color="text-yellow-500" />
            <QuickAction href="/field-recommendations" icon={Target} label={t("fieldRecommendations")} color="text-orange-500" />
            <QuickAction href="/predictions" icon={BarChart3} label={t("predictions")} color="text-violet-500" />
            <QuickAction href="/chatbot" icon={MessageSquare} label={t("askAI")} color="text-green-500" />
          </div>
        </div>
      </div>

      {/* ── LAND DISTRIBUTION + RECENT ACTIVITY (collapsed sections on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Section title={t("landDistribution")}>
          <div className="space-y-4">
            {[
              { label: t("cultivated"), area: cultivatedArea, color: "bg-green-500", textColor: "text-green-400" },
              { label: t("onThaka"), area: thakaArea, color: "bg-blue-500", textColor: "text-blue-400" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between items-center mb-1.5 text-sm gap-2">
                  <span className="text-[var(--muted)] text-xs truncate flex-shrink-0 max-w-[50%]">{row.label}</span>
                  <span className={`${row.textColor} font-medium text-xs flex-shrink-0 text-right`}>
                    {totals.totalArea ? ((row.area / totals.totalArea) * 100).toFixed(0) : 0}% — {row.area.toFixed(1)} {t("acres")}
                  </span>
                </div>
                <div className="w-full bg-theme-track rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${row.color} transition-all`}
                    style={{ width: `${totals.totalArea ? (row.area / totals.totalArea) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("recentExpensesIncome")}>
          {recentActivity.length === 0 ? (
            <p className="text-[var(--muted)] text-sm">{t("noRecentActivity")}</p>
          ) : (
            <ul className="space-y-0 divide-y divide-theme">
              {recentActivity.slice(0, 5).map((item) => (
                <li key={item.id} className="flex justify-between items-center py-2.5 text-sm gap-2">
                  <span className="text-[var(--muted)] text-xs flex-shrink-0 w-12 truncate">
                    {item.date ? format(new Date(item.date + "T12:00:00"), "dd MMM") : "—"}
                  </span>
                  <span className={`font-semibold flex-1 text-right truncate ${item.type === "income" ? "text-green-400" : "text-red-400"}`}>
                    {item.type === "income" ? "+" : "−"} Rs {item.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/expenses" className="flex items-center gap-1 text-xs text-green-500 hover:text-green-400 font-medium transition-colors mt-3">
            {t("expensesIncome")} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Section>
      </div>

      {/* ── FIELD RECOMMENDATIONS BADGE ─────────────────────────────────── */}
      {fieldRecommendations.length > 0 && (
        <div className="bg-theme-card border border-theme rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-theme">{t("recommendationsSummary")}</span>
            <Link href="/field-recommendations" className="text-xs text-green-500 hover:underline flex items-center gap-1">
              {t("viewAllRecommendations")} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {recHigh > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">
                {recHigh} {t("frHighPriority")}
              </span>
            )}
            {recMedium > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium">
                {recMedium} {t("frMediumPriority")}
              </span>
            )}
            <span className="text-[var(--muted)] text-xs self-center">{t("frTotal")}: {fieldRecommendations.length}</span>
          </div>
        </div>
      )}

      {/* ── MONTHLY CHART ───────────────────────────────────────────────── */}
      <Section title={t("monthlyIncomeVsExpense")}>
        <p className="text-[var(--muted)] text-xs mb-3">{t("last6Months")}</p>
        <div className="w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted)" tick={{ fontSize: 10 }} />
              <YAxis stroke="var(--muted)" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number | undefined) => `Rs ${Number(value ?? 0).toLocaleString()}`}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="income" name={t("incomeShort")} fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name={t("expenseShort")} fill="var(--not-usable)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Link href="/statistics" className="flex items-center gap-1 text-xs text-green-500 hover:underline mt-1.5">
          {t("viewAllStats")} <ArrowRight className="w-3 h-3" />
        </Link>
      </Section>

      {/* ── AI RECOMMENDATIONS ──────────────────────────────────────────── */}
      {aiRecommendations.length > 0 && (
        <Section title={t("aiRecommendations")} defaultOpen={false}>
          <div className="space-y-2.5">
            {aiRecommendations.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className={`px-3 py-2.5 rounded-xl border-l-4 ${r.type === "warning" ? "border-red-500 bg-red-500/10" : "border-amber-500 bg-amber-500/10"}`}
              >
                <p className="font-semibold text-theme text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                  {r.title}
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{r.message}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
