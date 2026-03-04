"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useLandStore } from "@/lib/store";
import { format, subMonths } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";
import { BarChart3, Download } from "lucide-react";

const MONTHS_6 = 6;
const MONTHS_12 = 12;

const LAND_STATUS_ORDER = ["cultivated", "available", "thaka", "uncultivated", "not_usable"] as const;
const LAND_COLORS: Record<string, string> = {
  cultivated: "#22c55e",
  available: "#eab308",
  thaka: "#3b82f6",
  uncultivated: "#f97316",
  not_usable: "#ef4444",
};

export default function StatisticsPage() {
  const { t } = useLocale();
  const { fields, expenses, incomes, temperatureRecords, waterRecords, thakaRecords, fetchAll, loading, error } = useLandStore();
  const [monthRange, setMonthRange] = useState<number>(MONTHS_6);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totals = useMemo(() => {
    const totalArea = fields.reduce((a, f) => a + (f.area || 0), 0);
    const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
    const activityInc = incomes.reduce((a, i) => a + i.amount, 0);
    const thakaIncAmount = thakaRecords.filter((tr) => tr.status === "active").reduce((a, tr) => a + (tr.amount || 0), 0);
    const totalInc = activityInc + thakaIncAmount;
    const totalWaterMins = waterRecords.reduce((a, w) => a + (w.durationMinutes || 0), 0);
    const activeThakaCount = thakaRecords.filter((tr) => tr.status === "active").length;
    return { totalArea, totalExp, totalInc, netProfit: totalInc - totalExp, totalWaterMins, activeThaka: activeThakaCount };
  }, [fields, expenses, incomes, waterRecords, thakaRecords]);

  const landPieData = useMemo(() => {
    const byStatus: Record<string, number> = {};
    LAND_STATUS_ORDER.forEach((s) => { byStatus[s] = 0; });
    fields.forEach((f) => {
      const s = f.status || "available";
      byStatus[s] = (byStatus[s] ?? 0) + (f.area || 0);
    });
    return LAND_STATUS_ORDER.map((key) => ({
      name: t(key as keyof typeof t) || key,
      value: byStatus[key] ?? 0,
      color: LAND_COLORS[key] ?? "#6b7280",
    })).filter((d) => d.value > 0);
  }, [fields, t]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const monthlyData = useMemo(() => {
    const n = monthRange;
    return Array.from({ length: n }, (_, i) => {
      const m = subMonths(new Date(), n - 1 - i);
      const mStr = format(m, "yyyy-MM");
      const exp = expenses.filter((e) => (e.date || "").slice(0, 7) === mStr).reduce((a, e) => a + e.amount, 0);
      const activityIncome = incomes.filter((i) => (i.date || "").slice(0, 7) === mStr).reduce((a, i) => a + i.amount, 0);
      const thakaIncome = thakaRecords.filter((tr) => (tr.startDate || "").slice(0, 7) === mStr).reduce((a, t) => a + t.amount, 0);
      const inc = activityIncome + thakaIncome;
      return { month: format(m, "MMM yy"), expense: exp, income: inc, profit: inc - exp };
    });
  }, [expenses, incomes, monthRange]);

  const locationData = useMemo(() => {
    const regions: Record<string, { area: number; count: number; names: string[] }> = {};
    fields.forEach((f) => {
      if (f.coordinates?.length) {
        const lat = f.coordinates.reduce((a, c) => a + c.lat, 0) / f.coordinates.length;
        const lng = f.coordinates.reduce((a, c) => a + c.lng, 0) / f.coordinates.length;
        const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
        if (!regions[key]) regions[key] = { area: 0, count: 0, names: [] };
        regions[key].area += f.area || 0;
        regions[key].count += 1;
        regions[key].names.push(f.name);
      }
    });
    return Object.entries(regions).map(([loc, d]) => ({
      name: `${t("region")} ${loc}`,
      area: d.area,
      count: d.count,
    }));
  }, [fields, t]);

  const tempChartData = useMemo(() => {
    const byField: Record<string, number[]> = {};
    temperatureRecords.forEach((r) => {
      if (!byField[r.fieldId]) byField[r.fieldId] = [];
      byField[r.fieldId].push(r.temperatureC);
    });
    return Object.entries(byField)
      .map(([fid, temps]) => ({
        name: fields.find((f) => f.id === fid)?.name ?? fid,
        avgTemp: temps.length ? temps.reduce((a, t) => a + t, 0) / temps.length : 0,
      }))
      .filter((d) => d.avgTemp > 0)
      .sort((a, b) => b.avgTemp - a.avgTemp);
  }, [temperatureRecords, fields]);

  const fieldProfitData = useMemo(() => {
    return fields
      .map((f) => {
        const exp = expenses.filter((e) => e.fieldId === f.id).reduce((a, e) => a + e.amount, 0);
        const activityIncome = incomes.filter((i) => i.fieldId === f.id).reduce((a, i) => a + i.amount, 0);
        const thakaIncAmount = thakaRecords.filter((t) => t.fieldId === f.id && t.status === "active").reduce((a, t) => a + (t.amount || 0), 0);
        const inc = activityIncome + thakaIncAmount;
        return { name: f.name, profit: inc - exp, expense: exp, income: inc };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [fields, expenses, incomes, thakaRecords]);

  const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)" };

  if (loading && fields.length === 0) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 rounded bg-theme-card animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-theme-card border border-theme animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-theme-card border border-theme animate-pulse" />
          <div className="h-80 rounded-2xl bg-theme-card border border-theme animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-theme tracking-tight">{t("statisticsReports")}</h1>
          </div>
          <p className="text-xs sm:text-sm text-theme-muted ml-[52px] mt-1">{t("statisticsSubtitle")}</p>
        </div>
        <Link
          href="/export"
          className="flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl bg-theme-track border border-theme text-theme-muted hover:text-theme hover:border-blue-500/50 transition-all font-bold text-sm shadow-sm active:scale-95"
        >
          <Download className="w-4 h-4" />
          {t("exportData")}
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</div>
      )}

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-theme-card border border-theme rounded-2xl p-5 shadow-sm">
          <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1 truncate">{t("fieldsCount")}</p>
          <p className="text-2xl font-black text-theme">{fields.length}</p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-5 shadow-sm">
          <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1 truncate">{t("totalLandArea")}</p>
          <p className="text-2xl font-black text-blue-400">{totals.totalArea.toFixed(1)} <span className="text-xs font-normal text-theme-muted">{t("acres")}</span></p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-5 shadow-sm">
          <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1 truncate">{t("totalInvestment")}</p>
          <p className="text-2xl font-black text-rose-500">Rs {(totals.totalExp / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-5 shadow-sm">
          <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1 truncate">{t("totalIncome")}</p>
          <p className="text-2xl font-black text-emerald-500">Rs {(totals.totalInc / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-5 shadow-sm">
          <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1 truncate">{t("netProfit")}</p>
          <p className={`text-2xl font-black ${totals.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            Rs {(totals.netProfit / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-5 shadow-sm">
          <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1 truncate">{t("totalIrrigation")}</p>
          <p className="text-2xl font-black text-cyan-500">{totals.totalWaterMins} <span className="text-xs font-normal text-theme-muted">min</span></p>
        </div>
      </div>

      {totals.activeThaka > 0 && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-sm font-bold text-theme">{t("statisticsActiveThaka")}</p>
          </div>
          <p className="text-lg font-black text-blue-500">{totals.activeThaka} {t("thaka")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">{t("landDistribution")}</h3>
          {landPieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[280px] text-theme-muted">
              <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
              <p>{t("statisticsAddFieldsForDistribution")}</p>
            </div>
          ) : (
            <div className="w-full h-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={landPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {landPieData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number | undefined) => `${Number(v ?? 0).toFixed(1)} ${t("acres")}`} contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">{t("expenseByCategory")}</h3>
          {expenseByCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[280px] text-theme-muted">
              <p>{t("statisticsNoExpensesRecorded")}</p>
            </div>
          ) : (
            <div className="w-full h-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={expenseByCategory} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="#8b949e" />
                  <YAxis type="category" dataKey="name" stroke="#8b949e" width={80} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => `Rs ${Number(v ?? 0).toLocaleString()}`} />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-theme-card border border-theme rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-theme">{t("monthlyIncomeVsExpense")}</h3>
          <select
            value={monthRange}
            onChange={(e) => setMonthRange(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-theme-track border border-theme text-theme text-sm"
          >
            <option value={MONTHS_6}>6 {t("monthsShort")}</option>
            <option value={MONTHS_12}>12 {t("monthsShort")}</option>
          </select>
        </div>
        <div className="w-full h-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="#8b949e" />
              <YAxis stroke="#8b949e" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => `Rs ${Number(v ?? 0).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="income" name={t("incomeShort")} fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name={t("expenseShort")} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {locationData.length > 0 && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">{t("locationBasedAnalytics")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locationData.map((loc, i) => (
              <div key={i} className="p-4 rounded-xl bg-theme-track">
                <p className="text-theme-muted text-sm">{loc.name}</p>
                <p className="text-theme font-bold">{loc.area.toFixed(1)} {t("acres")}</p>
                <p className="text-sm text-theme-muted">{loc.count} {t("statisticsFieldsCount")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-theme-card border border-theme rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-theme mb-4">{t("profitByField")}</h3>
        {fieldProfitData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-theme-muted">
            <p>{t("statisticsAddFieldsForProfit")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="w-full h-full min-w-0 overflow-hidden">
              <p className="text-xs text-theme-muted mb-2 uppercase font-bold tracking-wider">Net Profit by Field</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fieldProfitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="#8b949e" />
                  <YAxis stroke="#8b949e" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => `Rs ${Number(v ?? 0).toLocaleString()}`} />
                  <Bar dataKey="profit" name={t("netProfit")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full h-full min-w-0 overflow-hidden">
              <p className="text-xs text-theme-muted mb-2 uppercase font-bold tracking-wider">Sales vs Purchases by Field</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fieldProfitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="#8b949e" />
                  <YAxis stroke="#8b949e" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => `Rs ${Number(v ?? 0).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="income" name={t("totalSales")} fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name={t("totalPurchases")} fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {tempChartData.length > 0 && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">{t("avgTempByField")}</h3>
          <div className="w-full h-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tempChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => `${Number(v ?? 0).toFixed(1)} °C`} />
                <Bar dataKey="avgTemp" name="°C" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
