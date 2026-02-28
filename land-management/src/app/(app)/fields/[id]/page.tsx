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
  const totalInc = fieldIncomes.reduce((a, i) => a + i.amount, 0);
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
      const inc = fieldIncomes.filter((i) => (i.date || "").slice(0, 7) === mStr).reduce((a, i) => a + i.amount, 0);
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

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-theme mb-2">{field.name}</h1>
          <p className="text-theme-muted">
            {field.area?.toFixed(1) ?? "—"} {t("acres")} • {t((field.status as keyof typeof t) || field.status) || field.status}
            {field.address && ` • ${field.address}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/map"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
          >
            <Map className="w-4 h-4" />
            {t("viewOnMap")}
          </Link>
          <Link
            href="/predictions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30"
          >
            <TrendingUp className="w-4 h-4" />
            {t("goToPredictions")}
          </Link>
          <Link
            href="/expenses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
          >
            <Plus className="w-4 h-4" />
            {t("addExpenseForField")}
          </Link>
          <Link
            href="/water"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
          >
            <Droplets className="w-4 h-4" />
            {t("addWaterForField")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <p className="text-theme-muted text-sm">{t("totalInvestment")}</p>
          <p className="text-2xl font-bold text-red-400">Rs {totalExp.toLocaleString()}</p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <p className="text-theme-muted text-sm">{t("totalIncome")}</p>
          <p className="text-2xl font-bold text-green-400">Rs {totalInc.toLocaleString()}</p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <p className="text-theme-muted text-sm">{t("netProfit")}</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
            Rs {profit.toLocaleString()}
          </p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <p className="text-theme-muted text-sm">{t("records")}</p>
          <p className="text-2xl font-bold text-theme">
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
      )}

      {(fieldWater.length > 0 || totalWaterMins > 0) && (
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
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={waterChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)" }} />
                <Bar dataKey="minutes" name={t("minutes")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

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

      {Object.keys(incomeByType).length > 0 && (
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
      )}

      {tempData.length > 0 && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">{t("temperatureTrend")}</h3>
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
      )}

      {recentDaily.length > 0 && (
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
      )}
    </div>
  );
}
