"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLandStore } from "@/lib/store";
import { Map as MapIcon, ChevronRight, Search, BarChart2, Droplets, Thermometer } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

type SortKey = "name" | "area" | "profit" | "status";

export default function FieldsPage() {
  const { t } = useLocale();
  const { fields, expenses, incomes, waterRecords, temperatureRecords, fetchAll, loading, error } = useLandStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fieldStats = useMemo(() => {
    return fields.map((f) => {
      const exp = expenses.filter((e) => e.fieldId === f.id).reduce((a, e) => a + e.amount, 0);
      const inc = incomes.filter((i) => i.fieldId === f.id).reduce((a, i) => a + i.amount, 0);
      const profit = inc - exp;
      const waterCount = waterRecords.filter((w) => w.fieldId === f.id).length;
      const tempCount = temperatureRecords.filter((t) => t.fieldId === f.id).length;
      return { field: f, exp, inc, profit, waterCount, tempCount };
    });
  }, [fields, expenses, incomes, waterRecords, temperatureRecords]);

  const filteredAndSorted = useMemo(() => {
    let list = fieldStats;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(({ field }) => field.name.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.field.name || "").localeCompare(b.field.name || "");
        case "area":
          return (b.field.area ?? 0) - (a.field.area ?? 0);
        case "profit":
          return b.profit - a.profit;
        case "status":
          return (a.field.status || "").localeCompare(b.field.status || "");
        default:
          return 0;
      }
    });
    return list;
  }, [fieldStats, search, sortBy]);

  const totals = useMemo(() => {
    const totalArea = fields.reduce((a, f) => a + (f.area ?? 0), 0);
    const totalExp = expenses.reduce((a, e) => a + e.amount, 0);
    const totalInc = incomes.reduce((a, i) => a + i.amount, 0);
    return { totalArea, totalExp, totalInc, netProfit: totalInc - totalExp };
  }, [fields, expenses, incomes]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-theme mb-2">{t("fieldAnalytics")}</h1>
        <p className="text-theme-muted">{t("fieldAnalyticsSubtitle")}</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {loading && fields.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-theme-card border border-theme animate-pulse" />
          ))}
        </div>
      ) : fields.length > 0 ? (
        <>
          <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 scrollbar-none snap-x">
            <div className="flex-shrink-0 w-[200px] sm:w-full bg-theme-card border border-theme rounded-2xl p-5 snap-start">
              <p className="text-theme-muted text-xs font-medium uppercase tracking-wider">{t("fieldsCount")}</p>
              <p className="text-2xl font-bold text-theme">{fields.length}</p>
            </div>
            <div className="flex-shrink-0 w-[200px] sm:w-full bg-theme-card border border-theme rounded-2xl p-5 snap-start">
              <p className="text-theme-muted text-xs font-medium uppercase tracking-wider">{t("totalLandArea")}</p>
              <p className="text-2xl font-bold text-theme">{totals.totalArea.toFixed(1)} <span className="text-sm font-normal text-theme-muted">{t("acres")}</span></p>
            </div>
            <div className="flex-shrink-0 w-[200px] sm:w-full bg-theme-card border border-theme rounded-2xl p-5 snap-start">
              <p className="text-theme-muted text-xs font-medium uppercase tracking-wider">{t("totalInvestment")}</p>
              <p className="text-2xl font-bold text-red-400">Rs {totals.totalExp.toLocaleString()}</p>
            </div>
            <div className="flex-shrink-0 w-[200px] sm:w-full bg-theme-card border border-theme rounded-2xl p-5 snap-start">
              <p className="text-theme-muted text-xs font-medium uppercase tracking-wider">{t("netProfit")}</p>
              <p className={`text-2xl font-bold ${totals.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                Rs {totals.netProfit.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
              <input
                type="text"
                placeholder={t("searchFields")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-theme-track border border-theme text-theme placeholder-[#8b949e] focus:ring-2 focus:ring-green-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-theme-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme focus:ring-2 focus:ring-green-500/50"
              >
                <option value="name">{t("sortByName")}</option>
                <option value="area">{t("sortByArea")}</option>
                <option value="profit">{t("sortByProfit")}</option>
                <option value="status">{t("sortByStatus")}</option>
              </select>
            </div>
          </div>
        </>
      ) : null}

      {!loading && fields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSorted.map(({ field: f, exp, inc, profit, waterCount, tempCount }) => (
            <Link
              key={f.id}
              href={`/fields/${f.id}`}
              className="bg-theme-card border border-theme rounded-2xl p-5 hover:border-green-500/50 transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 group-hover:bg-green-500/20 transition-colors">
                    <MapIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-theme leading-tight group-hover:text-green-400 transition-colors">{f.name}</h3>
                    <p className="text-[11px] text-theme-muted font-medium uppercase tracking-wider">
                      {f.area?.toFixed(1) ?? "—"} {t("acres")} • {t(f.status as keyof typeof t) || f.status}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-theme-muted group-hover:text-green-400 transition-transform group-hover:translate-x-1" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-theme-track/40 p-3 rounded-xl border border-theme/30">
                  <p className="text-[10px] text-theme-muted font-bold uppercase mb-1">{t("expShort")}</p>
                  <p className="text-sm font-black text-red-400">Rs {exp.toLocaleString()}</p>
                </div>
                <div className="bg-theme-track/40 p-3 rounded-xl border border-theme/30">
                  <p className="text-[10px] text-theme-muted font-bold uppercase mb-1">{t("incShort")}</p>
                  <p className="text-sm font-black text-green-400">Rs {inc.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-theme/30 pt-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-theme-muted font-medium">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    {waterCount}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-theme-muted font-medium">
                    <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    {tempCount}
                  </div>
                </div>
                <div className={`text-xs font-black px-2 py-1 rounded-lg ${profit >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  Rs {profit.toLocaleString()} {t("netShort")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )
      }

      {
        !loading && fields.length > 0 && filteredAndSorted.length === 0 && (
          <div className="text-center py-12 text-theme-muted">
            <p>{t("noFieldsMatchSearch")}</p>
          </div>
        )
      }

      {
        !loading && fields.length === 0 && (
          <div className="text-center py-16 text-theme-muted">
            <MapIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>{t("fieldAnalyticsNoFields")}</p>
            <Link href="/map" className="mt-4 inline-block text-green-400 hover:underline">{t("goToMap")}</Link>
          </div>
        )
      }
    </div >
  );
}
