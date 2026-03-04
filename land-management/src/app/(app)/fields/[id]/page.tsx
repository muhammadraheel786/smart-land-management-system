"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Map, Droplets, TrendingUp, FileText, Plus } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { format, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useLocale } from "@/contexts/LocaleContext";

const MONTHS_6 = 6;
const MONTHS_12 = 12;

export default function FieldDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLocale();
  const {
    fields,
    expenses,
    incomes,
    waterRecords,
    temperatureRecords,
    thakaRecords,
    dailyRegister,
    fetchAll,
    fetchDailyRegister,
    loading,
    error,
  } = useLandStore();
  const [monthRange, setMonthRange] = useState<number>(MONTHS_6);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (id) fetchDailyRegister({ fieldId: id });
  }, [id, fetchDailyRegister]);

  const field = fields.find((f) => f.id === id);

  const fieldExpenses = useMemo(() => expenses.filter((e) => e.fieldId === id), [expenses, id]);
  const fieldIncomes = useMemo(() => incomes.filter((i) => i.fieldId === id), [incomes, id]);
  const fieldWater = useMemo(() => waterRecords.filter((w) => w.fieldId === id), [waterRecords, id]);
  const fieldTemp = useMemo(() => temperatureRecords.filter((r) => r.fieldId === id), [temperatureRecords, id]);
  const fieldThaka = useMemo(() => thakaRecords.filter((tr) => tr.fieldId === id), [thakaRecords, id]);
  const fieldDaily = useMemo(() => dailyRegister.filter((d) => d.fieldId === id), [dailyRegister, id]);

  const totalExp = fieldExpenses.reduce((a, e) => a + e.amount, 0);
  const activityInc = fieldIncomes.reduce((a, i) => a + i.amount, 0);
  const thakaInc = fieldThaka.filter(t => t.status === 'active').reduce((a, t) => a + (t.amount || 0), 0);
  const totalInc = activityInc + thakaInc;
  const profit = totalInc - totalExp;
  const totalWaterMins = fieldWater.reduce((a, w) => a + (w.durationMinutes || 0), 0);
  const lastWater = fieldWater.length > 0
    ? fieldWater.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0]
    : null;

  const expenseByCategory = useMemo(
    () =>
      fieldExpenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>),
    [fieldExpenses]
  );

  const incomeByType = useMemo(
    () =>
      fieldIncomes.reduce((acc, i) => {
        const type = (i as { type?: string }).type ?? "crop";
        acc[type] = (acc[type] || 0) + i.amount;
        return acc;
      }, {} as Record<string, number>),
    [fieldIncomes]
  );

  const monthlyData = useMemo(() => {
    const n = monthRange;
    return Array.from({ length: n }, (_, i) => {
      const m = subMonths(new Date(), n - 1 - i);
      const mStr = format(m, "yyyy-MM");
      const exp = fieldExpenses.filter((e) => (e.date || "").slice(0, 7) === mStr).reduce((a, e) => a + e.amount, 0);
      const activityIncome = fieldIncomes.filter((i) => (i.date || "").slice(0, 7) === mStr).reduce((a, i) => a + i.amount, 0);
      // For thaka, we might want to distribute it or just count it in the start/end month.
      // Usually users want to see it when it was paid.
      const thakaIncome = fieldThaka.filter((t) => (t.startDate || "").slice(0, 7) === mStr).reduce((a, t) => a + t.amount, 0);
      const inc = activityIncome + thakaIncome;
      return { month: format(m, "MMM yy"), expense: exp, income: inc };
    });
  }, [fieldExpenses, fieldIncomes, monthRange]);

  const tempData = useMemo(
    () =>
      fieldTemp
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 12)
        .reverse()
        .map((r) => ({
          date: format(new Date(r.date), "MMM d"),
          temp: r.temperatureC,
        })),
    [fieldTemp]
  );

  const waterChartData = useMemo(
    () =>
      fieldWater
        .slice()
        .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
        .slice(-12)
        .map((w) => ({
          date: format(new Date(w.date), "MMM d"),
          minutes: w.durationMinutes || 0,
        })),
    [fieldWater]
  );

  const recentDaily = useMemo(
    () =>
      fieldDaily
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 10),
    [fieldDaily]
  );

  if (loading && fields.length === 0) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 rounded bg-theme-card animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-theme-card border border-theme animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!field && !loading) {
    return (
      <div className="text-center py-16">
        <p className="text-theme-muted">{t("fieldNotFound")}</p>
        <Link href="/fields" className="text-green-400 hover:underline mt-4 inline-block">{t("backToFields")}</Link>
      </div>
    );
  }

  if (!field) return null;

  return (
    <div className="space-y-8">
      <Link href="/fields" className="inline-flex items-center gap-2 text-theme-muted hover:text-theme transition">
        <ArrowLeft className="w-4 h-4" />
        {t("backToFields")}
      </Link>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</div>
      )}

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 shrink-0">
            <Map className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-theme tracking-tight mb-2">{field.name}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-bold">
              <span className="text-theme bg-theme-track px-2 py-1 rounded-lg">
                {field.area?.toFixed(1) ?? "—"} {t("acres")}
              </span>
              <span className={`px-2 py-1 rounded-lg ${field.status === 'cultivated' ? 'bg-green-500/10 text-green-500' :
                field.status === 'available' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-theme-track text-theme-muted'
                }`}>
                {t((field.status as keyof typeof t) || field.status) || field.status}
              </span>
              {field.address && <span className="text-theme-muted">{field.address}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
          <Link
            href="/map"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme font-bold text-xs hover:border-green-500/50 transition-all active:scale-95"
          >
            <Map className="w-4 h-4 text-green-500" />
            {t("viewOnMap")}
          </Link>
          <Link
            href="/predictions"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme font-bold text-xs hover:border-violet-500/50 transition-all active:scale-95"
          >
            <TrendingUp className="w-4 h-4 text-violet-500" />
            Insights
          </Link>
          <Link
            href="/activities"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme font-bold text-xs hover:border-amber-500/50 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            Activity
          </Link>
          <Link
            href="/water"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme font-bold text-xs hover:border-blue-500/50 transition-all active:scale-95"
          >
            <Droplets className="w-4 h-4 text-blue-500" />
            Water
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-sm">
          <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1">{t("totalInvestment")}</p>
          <p className="text-2xl font-black text-rose-500">Rs {totalExp.toLocaleString()}</p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-sm">
          <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1">{t("totalIncome")}</p>
          <p className="text-2xl font-black text-emerald-500">Rs {totalInc.toLocaleString()}</p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-sm">
          <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1">{t("netProfit")}</p>
          <p className={`text-2xl font-black ${profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            Rs {profit.toLocaleString()}
          </p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-sm">
          <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-1">{t("records")}</p>
          <p className="text-2xl font-black text-theme">
            {fieldExpenses.length + fieldIncomes.length + fieldWater.length + fieldTemp.length}
          </p>
        </div>
      </div>

      {fieldThaka.length > 0 && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            {t("thaka")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fieldThaka.map((tr) => (
              <div key={tr.id} className="p-4 rounded-xl bg-theme-track border border-theme">
                <p className="font-medium text-theme">{tr.tenantName}</p>
                <p className="text-sm text-theme-muted">
                  {t("startDate")}: {tr.startDate} • {t("endDate")}: {tr.endDate}
                </p>
                <p className="text-green-400 font-medium">Rs {tr.amount.toLocaleString()}</p>
                <p className="text-xs text-theme-muted capitalize">{tr.status}</p>
              </div>
            ))}
          </div>
        </div>
      )
      }

      {
        (fieldWater.length > 0 || totalWaterMins > 0) && (
          <div className="bg-theme-card border border-theme rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              {t("waterUsage")}
            </h3>
            <div className="flex flex-wrap gap-6 mb-4">
              <div>
                <p className="text-theme-muted text-sm">{t("totalIrrigation")}</p>
                <p className="text-xl font-bold text-blue-400">{totalWaterMins} {t("minutes")}</p>
              </div>
              {lastWater && (
                <div>
                  <p className="text-theme-muted text-sm">{t("lastIrrigation")}</p>
                  <p className="text-xl font-bold text-theme">{lastWater.date}</p>
                </div>
              )}
            </div>
            {waterChartData.length > 0 && (
              <div className="w-full h-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={waterChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="#8b949e" />
                    <YAxis stroke="#8b949e" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)" }} />
                    <Bar dataKey="minutes" name={t("minutes")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )
      }

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)" }} formatter={(v: number | undefined) => `Rs ${Number(v ?? 0).toLocaleString()}`} />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">{t("expenseByCategory")}</h3>
          <div className="space-y-2">
            {Object.entries(expenseByCategory).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between items-center">
                <span className="text-theme-muted capitalize">{cat}</span>
                <span className="text-theme font-medium">Rs {amt.toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(expenseByCategory).length === 0 && <p className="text-theme-muted">{t("noExpenses")}</p>}
          </div>
        </div>
      </div>

      {
        Object.keys(incomeByType).length > 0 && (
          <div className="bg-theme-card border border-theme rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-theme mb-4">{t("incomeByType")}</h3>
            <div className="space-y-2">
              {Object.entries(incomeByType).map(([type, amt]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-theme-muted capitalize">{type}</span>
                  <span className="text-green-400 font-medium">Rs {amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {
        tempData.length > 0 && (
          <div className="bg-theme-card border border-theme rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-theme mb-4">{t("temperatureTrend")}</h3>
            <div className="w-full h-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={tempData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="#8b949e" />
                  <YAxis stroke="#8b949e" />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
                  <Line type="monotone" dataKey="temp" name="°C" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      }

      {
        recentDaily.length > 0 && (
          <div className="bg-theme-card border border-theme rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-theme mb-4">{t("recentActivity")}</h3>
            <div className="space-y-2">
              {recentDaily.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center py-2 border-b border-theme last:border-0">
                  <span className="text-theme">{entry.activity || "—"}</span>
                  <span className="text-theme-muted text-sm">{entry.date}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }
    </div >
  );
}
