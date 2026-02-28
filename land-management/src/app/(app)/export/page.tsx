"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { format } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";

export default function ExportPage() {
  const { t } = useLocale();
  const { fields, expenses, incomes, thakaRecords, waterRecords, temperatureRecords } = useLandStore();
  const [formatType, setFormatType] = useState<"json" | "csv">("csv");

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
      rows.push(["Type", "Field", "Date", "Amount", "Category/Details"]);
      expenses.forEach((e) => {
        const f = fields.find((x) => x.id === e.fieldId);
        rows.push(["Expense", f?.name ?? "", e.date, String(e.amount), e.category]);
      });
      incomes.forEach((i) => {
        const f = fields.find((x) => x.id === i.fieldId);
        rows.push(["Income", f?.name ?? "", i.date, String(i.amount), i.type]);
      });
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
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
      <div>
        <h1 className="text-3xl font-bold text-theme mb-2">{t("exportData")}</h1>
        <p className="text-theme-muted">Download your land management data</p>
      </div>

      <div className="bg-theme-card border border-theme rounded-2xl p-8 max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-theme-muted mb-2">Format</label>
            <select value={formatType} onChange={(e) => setFormatType(e.target.value as "json" | "csv")} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme">
              <option value="csv">CSV (Excel-friendly)</option>
              <option value="json">JSON (Full data)</option>
            </select>
          </div>
          <button onClick={exportData} className="w-full py-3 rounded-xl bg-green-500 text-theme font-semibold hover:bg-green-600 flex items-center justify-center gap-2">
            <Download className="w-5 h-5" />
            Download Export
          </button>
        </div>
        <p className="text-sm text-theme-muted mt-4">
          {fields.length} fields, {expenses.length} expenses, {incomes.length} incomes, {waterRecords.length} water, {temperatureRecords.length} temp
        </p>
      </div>
    </div>
  );
}
