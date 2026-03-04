"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { format } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";

export default function ExportPage() {
  const { t } = useLocale();
  const { fields, expenses, incomes, thakaRecords, waterRecords, temperatureRecords, fetchAll, loading } = useLandStore();
  const [formatType, setFormatType] = useState<"json" | "csv">("csv");

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `land-management-export-${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows: string[][] = [];
      rows.push(["Type", "Field", "Date", "Amount/Value", "Category/Details", "Notes"]);

      expenses.forEach((e) => {
        const f = fields.find((x) => x.id === e.fieldId);
        rows.push(["Expense", f?.name ?? "", e.date || "", String(e.amount), e.category, e.description || ""]);
      });

      incomes.forEach((i) => {
        const f = fields.find((x) => x.id === i.fieldId);
        rows.push(["Income", f?.name ?? "", i.date || "", String(i.amount), i.type, i.description || ""]);
      });

      thakaRecords.forEach((tr) => {
        const f = fields.find((x) => x.id === tr.fieldId);
        rows.push(["Thaka", f?.name ?? "", tr.startDate || "", String(tr.amount), tr.tenantName, tr.status]);
      });

      waterRecords.forEach((wr) => {
        const f = fields.find((x) => x.id === wr.fieldId);
        rows.push(["Water", f?.name ?? "", wr.date || "", `${wr.durationMinutes} min`, "Irrigation", wr.notes || ""]);
      });

      temperatureRecords.forEach((tr) => {
        const f = fields.find((x) => x.id === tr.fieldId);
        rows.push(["Temperature", f?.name ?? "", tr.date || "", `${tr.temperatureC}°C`, "Climate", tr.notes || ""]);
      });

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
            { label: 'Temp', count: temperatureRecords.length }
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
