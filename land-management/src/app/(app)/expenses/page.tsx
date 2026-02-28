"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, TrendingDown, TrendingUp, Pencil, Trash } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { format } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";
import type { Expense, Income } from "@/types";

const expenseCategories: { value: Expense["category"]; labelKey: string }[] = [
  { value: "seeds", labelKey: "expCatSeeds" },
  { value: "fertilizer", labelKey: "expCatFertilizer" },
  { value: "labor", labelKey: "expCatLabor" },
  { value: "water", labelKey: "expCatWater" },
  { value: "fencing", labelKey: "expCatFencing" },
  { value: "equipment", labelKey: "expCatEquipment" },
  { value: "other", labelKey: "expCatOther" },
];

export default function ExpensesPage() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const { fields, expenses, incomes, addExpense, addIncome, updateExpense, updateIncome, deleteExpense, deleteIncome, fetchAll, loading, error } = useLandStore();
  const tabFromUrl = searchParams.get("tab") === "income" ? "income" : "expense";
  const [tab, setTab] = useState<"expense" | "income">(tabFromUrl);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);
  const [amount, setAmount] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [category, setCategory] = useState<Expense["category"]>("seeds");
  const [type, setType] = useState<Income["type"]>("crop");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filterFieldId, setFilterFieldId] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"expense" | "income" | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<"expense" | "income" | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (editingId && editingType === "expense") {
      const e = expenses.find((x) => x.id === editingId);
      if (e) {
        setFieldId(e.fieldId);
        setCategory(e.category);
        setAmount(String(e.amount));
        setDate(e.date);
        setDesc(e.description ?? "");
      }
    } else if (editingId && editingType === "income") {
      const i = incomes.find((x) => x.id === editingId);
      if (i) {
        setFieldId(i.fieldId);
        setType(i.type);
        setAmount(String(i.amount));
        setDate(i.date);
        setDesc(i.description ?? "");
      }
    }
  }, [editingId, editingType, expenses, incomes]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(false);
    const amt = Number(amount);
    if (!fieldId || !amount || amt < 1) {
      setSubmitError(t("expensesAmountRequired"));
      return;
    }
    if (editingId && editingType === "expense") {
      await updateExpense(editingId, { fieldId, category, amount: amt, description: desc.trim() || undefined, date });
      setEditingId(null);
      setEditingType(null);
      setAmount("");
      setDesc("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }
    const ok = await addExpense({ fieldId, category, amount: amt, description: desc.trim() || undefined, date });
    if (ok) {
      setAmount("");
      setDesc("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setSubmitError(t("expensesAddFailed"));
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(false);
    const amt = Number(amount);
    if (!fieldId || !amount || amt < 1) {
      setSubmitError(t("expensesAmountRequired"));
      return;
    }
    if (editingId && editingType === "income") {
      await updateIncome(editingId, { fieldId, type, amount: amt, description: desc.trim() || undefined, date });
      setEditingId(null);
      setEditingType(null);
      setAmount("");
      setDesc("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }
    const ok = await addIncome({ fieldId, type, amount: amt, description: desc.trim() || undefined, date });
    if (ok) {
      setAmount("");
      setDesc("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setSubmitError(t("expensesAddFailed"));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId || !deleteConfirmType) return;
    if (deleteConfirmType === "expense") await deleteExpense(deleteConfirmId);
    else await deleteIncome(deleteConfirmId);
    setDeleteConfirmId(null);
    setDeleteConfirmType(null);
  };

  const totalExp = useMemo(() => expenses.reduce((a, e) => a + e.amount, 0), [expenses]);
  const totalInc = useMemo(() => incomes.reduce((a, i) => a + i.amount, 0), [incomes]);
  const netProfit = totalInc - totalExp;

  const combinedRecords = useMemo(() => {
    const exp = expenses.map((e) => ({ ...e, _t: "expense" as const }));
    const inc = incomes.map((i) => ({ ...i, _t: "income" as const }));
    let list = [...exp, ...inc].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filterFieldId) list = list.filter((r) => r.fieldId === filterFieldId);
    if (filterType === "expense") list = list.filter((r) => r._t === "expense");
    if (filterType === "income") list = list.filter((r) => r._t === "income");
    return list.slice(0, 50);
  }, [expenses, incomes, filterFieldId, filterType]);

  const noFields = fields.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-theme mb-2">{t("expensesIncome")}</h1>
        <p className="text-[#8b949e]">{t("expensesSubtitle")}</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</div>
      )}

      {loading && fields.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-theme-card border border-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-theme-card border border-theme rounded-2xl p-6">
              <p className="text-[#8b949e] text-sm">{t("totalInvestment")}</p>
              <p className="text-2xl font-bold text-red-400">Rs {totalExp.toLocaleString()}</p>
            </div>
            <div className="bg-theme-card border border-theme rounded-2xl p-6">
              <p className="text-[#8b949e] text-sm">{t("totalIncome")}</p>
              <p className="text-2xl font-bold text-green-400">Rs {totalInc.toLocaleString()}</p>
            </div>
            <div className="bg-theme-card border border-theme rounded-2xl p-6">
              <p className="text-[#8b949e] text-sm">{t("netProfit")}</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                Rs {netProfit.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setTab("expense"); setSuccess(false); setSubmitError(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${tab === "expense" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-theme-track text-theme-muted border border-theme hover:border-red-500/30"}`}
            >
              <TrendingDown className="w-4 h-4" />
              {t("addExpense")}
            </button>
            <button
              onClick={() => { setTab("income"); setSuccess(false); setSubmitError(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${tab === "income" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-theme-track text-theme-muted border border-theme hover:border-green-500/30"}`}
            >
              <TrendingUp className="w-4 h-4" />
              {t("addIncome")}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-theme-card border border-theme rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-theme mb-4">
                {editingId ? t("edit") : tab === "expense" ? t("expensesNewExpense") : t("expensesNewIncome")}
              </h3>
              {noFields ? (
                <p className="text-[#8b949e] py-4">{t("expensesNoFields")}</p>
              ) : (
                <form onSubmit={tab === "expense" ? handleAddExpense : handleAddIncome} className="space-y-4">
                  {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
                  {success && <p className="text-green-400 text-sm">{editingId ? t("recordUpdated") : t("expensesRecordAdded")}</p>}
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setEditingType(null); setAmount(""); setDesc(""); }} className="text-sm text-[#8b949e] hover:text-theme">
                      {t("cancel")} — {t("edit")}
                    </button>
                  )}
                  <div>
                    <label className="block text-sm text-[#8b949e] mb-1">{t("field")}</label>
                    <select value={fieldId} onChange={(e) => setFieldId(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme focus:ring-2 focus:ring-green-500/50">
                      <option value="">{t("selectField")}</option>
                      {fields.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.area?.toFixed(1)} {t("acres")})</option>
                      ))}
                    </select>
                  </div>
                  {tab === "expense" ? (
                    <div>
                      <label className="block text-sm text-[#8b949e] mb-1">{t("category")}</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value as Expense["category"])} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme">
                        {expenseCategories.map((c) => (
                          <option key={c.value} value={c.value}>{t(c.labelKey as keyof typeof t)}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm text-[#8b949e] mb-1">{t("expensesIncomeType")}</label>
                      <select value={type} onChange={(e) => setType(e.target.value as Income["type"])} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme">
                        <option value="crop">{t("expensesCropIncome")}</option>
                        <option value="thaka">{t("expensesThakaIncome")}</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm text-[#8b949e] mb-1">{t("amount")} (Rs)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min={1} step={1} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#8b949e] mb-1">{t("date")}</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#8b949e] mb-1">{t("description")} ({t("expensesOptional")})</label>
                    <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("expensesNotesPlaceholder")} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme placeholder-theme" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-green-600 text-theme font-semibold hover:bg-green-500 disabled:opacity-50 transition flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    {editingId ? t("update") : tab === "expense" ? t("addExpense") : t("addIncome")}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-theme-card border border-theme rounded-2xl p-6 overflow-auto max-h-[560px]">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-theme">{t("expensesRecentRecords")}</h3>
                <div className="flex gap-2">
                  <select value={filterFieldId} onChange={(e) => setFilterFieldId(e.target.value)} className="px-3 py-1.5 rounded-lg bg-theme-track border border-theme text-theme text-sm">
                    <option value="">{t("expensesAllFields")}</option>
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)} className="px-3 py-1.5 rounded-lg bg-theme-track border border-theme text-theme text-sm">
                    <option value="all">{t("expensesAllTypes")}</option>
                    <option value="expense">{t("addExpense")}</option>
                    <option value="income">{t("addIncome")}</option>
                  </select>
                </div>
              </div>
              {combinedRecords.length === 0 ? (
                <p className="text-[#8b949e] py-8">{t("expensesNoRecordsYet")}</p>
              ) : (
                <div className="space-y-2">
                  {combinedRecords.map((r) => (
                    <div key={r.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${r._t === "expense" ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"}`}>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-theme">{fields.find((f) => f.id === r.fieldId)?.name ?? t("field")}</p>
                        <p className="text-xs text-[#8b949e]">{format(new Date(r.date), "MMM d, yyyy")} • {r._t === "expense" ? t(expenseCategories.find((c) => c.value === (r as Expense).category)?.labelKey as keyof typeof t) || (r as Expense).category : (r as Income).type === "crop" ? t("expensesCropIncome") : t("expensesThakaIncome")}</p>
                      </div>
                      <p className={`font-semibold shrink-0 ${r._t === "expense" ? "text-red-400" : "text-green-400"}`}>
                        {r._t === "expense" ? "−" : "+"} Rs {r.amount.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => { setTab(r._t); setEditingId(r.id); setEditingType(r._t); setSubmitError(null); setSuccess(false); }}
                          className="p-2 rounded-lg text-[#8b949e] hover:text-theme hover:bg-white/10 transition"
                          title={t("edit")}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDeleteConfirmId(r.id); setDeleteConfirmType(r._t); }}
                          className="p-2 rounded-lg text-[#8b949e] hover:text-red-400 hover:bg-red-500/10 transition"
                          title={t("delete")}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {deleteConfirmId && deleteConfirmType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteConfirmId(null)}>
              <div className="bg-theme-card border border-theme rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                <p className="text-theme mb-4">{t("confirmDelete")}</p>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl border border-theme text-[#8b949e] hover:text-theme">
                    {t("cancel")}
                  </button>
                  <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 rounded-xl bg-red-600 text-theme hover:bg-red-500">
                    {t("delete")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
