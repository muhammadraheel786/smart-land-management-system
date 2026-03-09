"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { format } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";

export default function ExportPage() {
  const { t } = useLocale();
  const {
    fields,
    expenses,
    incomes,
    thakaRecords,
    waterRecords,
    temperatureRecords,
    materials,
    materialTransactions,
    dailyRegister,
    fetchAll,
    fetchMaterials,
    fetchMaterialTransactions,
    fetchDailyRegister,
    loading
  } = useLandStore();
  const [formatType, setFormatType] = useState<"json" | "csv">("csv");

  useEffect(() => {
    fetchAll();
    fetchMaterials();
    fetchMaterialTransactions();
    fetchDailyRegister();
  }, [fetchAll, fetchMaterials, fetchMaterialTransactions, fetchDailyRegister]);

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      fields,
      expenses,
      incomes,
      thakaRecords,
      waterRecords,
      temperatureRecords,
    };

    if (formatType === "json") {
      const data = {
        exportedAt: new Date().toISOString(),
        fields,
        expenses,
        incomes,
        thakaRecords,
        waterRecords,
        temperatureRecords,
        materials,
        materialTransactions,
        dailyRegister,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `land-management-export-${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows: string[][] = [];

      // 1. GENERAL SUMMARY SECTION
      rows.push(["LAND MANAGEMENT OVERALL SUMMARY"]);
      rows.push(["Export Date", format(new Date(), "yyyy-MM-dd HH:mm:ss")]);
      rows.push([]);

      const totalExp = expenses.reduce((a, b) => a + (Number(b.amount) || 0), 0) + materialTransactions.filter(t => t.type === 'out').reduce((a, b) => a + (Number(b.cost) || 0), 0);
      const totalInc = incomes.reduce((a, b) => a + (Number(b.amount) || 0), 0);
      const totalThaka = thakaRecords.reduce((a, b) => a + (Number(b.amount) || 0), 0);
      const totalWater = waterRecords.reduce((a, b) => a + (Number(b.durationMinutes) || 0), 0);

      rows.push(["Metric", "Total Value"]);
      rows.push(["Total Expenses", String(totalExp)]);
      rows.push(["Total Income", String(totalInc)]);
      rows.push(["Net Profit", String(totalInc - totalExp)]);
      rows.push(["Total Thaka Amount", String(totalThaka)]);
      rows.push(["Total Water Minutes", String(totalWater)]);
      rows.push([]);

      // 2. EXPENSES SECTION
      if (expenses.length > 0) {
        rows.push(["EXPENSES DETAIL"]);
        rows.push(["Field", "Date", "Amount", "Category", "Description"]);
        expenses.forEach((e) => {
          const f = fields.find((x) => x.id === e.fieldId);
          rows.push([f?.name ?? "", e.date || "", String(e.amount), e.category, e.description || ""]);
        });
        rows.push(["TOTAL EXPENSES", "", String(expenses.reduce((a, b) => a + Number(b.amount), 0))]);
        rows.push([]);
      }

      // 3. INCOMES SECTION
      if (incomes.length > 0) {
        rows.push(["INCOMES DETAIL"]);
        rows.push(["Field", "Date", "Amount", "Type", "Description"]);
        incomes.forEach((i) => {
          const f = fields.find((x) => x.id === i.fieldId);
          rows.push([f?.name ?? "", i.date || "", String(i.amount), i.type, i.description || ""]);
        });
        rows.push(["TOTAL INCOMES", "", String(incomes.reduce((a, b) => a + Number(b.amount), 0))]);
        rows.push([]);
      }

      // 4. THAKA SECTION
      if (thakaRecords.length > 0) {
        rows.push(["THAKA (LEASE) RECORDS"]);
        rows.push(["Field", "Start Date", "Amount", "Tenant Name", "Status"]);
        thakaRecords.forEach((tr) => {
          const f = fields.find((x) => x.id === tr.fieldId);
          rows.push([f?.name ?? "", tr.startDate || "", String(tr.amount), tr.tenantName, tr.status]);
        });
        rows.push([]);
      }

      // 5. WATER SECTION
      if (waterRecords.length > 0) {
        rows.push(["WATER (IRRIGATION) LOGS"]);
        rows.push(["Field", "Date", "Duration (Min)", "Notes"]);
        waterRecords.forEach((wr) => {
          const f = fields.find((x) => x.id === wr.fieldId);
          rows.push([f?.name ?? "", wr.date || "", String(wr.durationMinutes), wr.notes || ""]);
        });
        rows.push(["TOTAL WATER TIME", "", String(totalWater)]);
        rows.push([]);
      }

      // 6. MATERIAL TRANSACTIONS
      if (materialTransactions.length > 0) {
        rows.push(["MATERIAL TRANSACTIONS (STOCK)"]);
        rows.push(["Material", "Type", "Quantity", "Date", "Cost", "Notes"]);
        materialTransactions.forEach((t) => {
          const m = materials.find(x => x.id === t.materialId);
          rows.push([m?.name ?? "Unknown", t.type.toUpperCase(), String(t.quantity), t.date || "", String(t.cost || 0), t.notes || ""]);
        });
        rows.push([]);
      }

      // 7. DAILY REGISTER
      if (dailyRegister.length > 0) {
        rows.push(["DAILY FIELD REGISTER"]);
        rows.push(["Field", "Date", "Activity", "Labor Cost", "Water (Min)", "Notes"]);
        dailyRegister.forEach((d) => {
          const f = fields.find(x => x.id === d.fieldId);
          rows.push([f?.name ?? "", d.date || "", d.activity, String(d.laborCost || 0), String(d.waterMinutes || 0), d.notes || ""]);
        });
        rows.push([]);
      }

      const csvContent = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `land-management-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Download className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-theme tracking-tight">{t("exportData")}</h1>
          </div>
          <p className="text-xs sm:text-sm text-theme-muted ml-[52px] mt-1">Download your land management records for external use.</p>
        </div>
      </div>

      <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-10 max-w-xl shadow-xl">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-theme-muted mb-3 italic">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormatType('csv')}
                className={`py-4 rounded-2xl border font-bold text-sm transition-all ${formatType === 'csv'
                  ? 'bg-green-500/10 border-green-500 text-green-500 shadow-lg shadow-green-500/10'
                  : 'bg-theme-track border-theme text-theme-muted hover:border-theme-muted'
                  }`}
              >
                CSV (Excel)
              </button>
              <button
                onClick={() => setFormatType('json')}
                className={`py-4 rounded-2xl border font-bold text-sm transition-all ${formatType === 'json'
                  ? 'bg-green-500/10 border-green-500 text-green-500 shadow-lg shadow-green-500/10'
                  : 'bg-theme-track border-theme text-theme-muted hover:border-theme-muted'
                  }`}
              >
                JSON (Full)
              </button>
            </div>
          </div>

          <button
            onClick={exportData}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Download className="w-6 h-6" />
            Download Data
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-theme grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Fields', count: fields.length },
            { label: 'Exp', count: expenses.length },
            { label: 'Inc', count: incomes.length },
            { label: 'Water', count: waterRecords.length },
            { label: 'Stock', count: materialTransactions.length },
            { label: 'Daily', count: dailyRegister.length }
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-xl font-black text-theme">{item.count}</p>
              <p className="text-[10px] font-bold text-theme-muted uppercase">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
