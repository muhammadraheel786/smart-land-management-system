"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Package, ArrowDownCircle, ArrowUpCircle, Plus, Trash2, Pencil, AlertTriangle } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { useLocale } from "@/contexts/LocaleContext";
import type { Material, MaterialCategory, MaterialUnit } from "@/types";

const CATEGORIES: MaterialCategory[] = ["seed", "fertilizer", "pesticide", "fuel", "feed", "other"];
const UNITS: MaterialUnit[] = ["kg", "L", "bag", "pack", "unit"];
const LOW_STOCK_THRESHOLD = 10;

export default function MaterialsPage() {
  const { t } = useLocale();
  const {
    fields,
    materials,
    materialTransactions,
    fetchAll,
    fetchMaterials,
    fetchMaterialTransactions,
    addMaterial,
    updateMaterial,
    addMaterialTransaction,
    updateMaterialTransaction,
    deleteMaterial,
    deleteMaterialTransaction,
    loading,
    error,
  } = useLandStore();

  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("other");
  const [unit, setUnit] = useState<MaterialUnit>("kg");
  const [stock, setStock] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [purchaseMaterialId, setPurchaseMaterialId] = useState("");
  const [purchaseQty, setPurchaseQty] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [deleteConfirmMaterialId, setDeleteConfirmMaterialId] = useState<string | null>(null);
  const [deleteConfirmTxId, setDeleteConfirmTxId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    fetchMaterials();
    fetchMaterialTransactions();
  }, [fetchAll, fetchMaterials, fetchMaterialTransactions]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);
    if (!name.trim()) {
      setSubmitError(t("materialsNameRequired"));
      return;
    }
    setSaving(true);
    try {
      if (editingMaterialId) {
        await updateMaterial(editingMaterialId, {
          name: name.trim(),
          category,
          unit,
          stock_quantity: stock ? Number(stock) : 0,
          price_per_unit: pricePerUnit ? Number(pricePerUnit) : 0
        });
        setEditingMaterialId(null);
        setName("");
        setStock("");
        setShowAddMaterial(false);
        setSuccess(t("recordUpdated"));
        setTimeout(() => setSuccess(null), 3000);
        return;
      }
      const ok = await addMaterial({
        name: name.trim(),
        category,
        unit,
        stock_quantity: stock ? Number(stock) : 0,
        price_per_unit: pricePerUnit ? Number(pricePerUnit) : 0,
      });
      if (ok) {
        setName("");
        setStock("");
        setShowAddMaterial(false);
        setSuccess(t("materialsMaterialAdded"));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setSubmitError(t("materialsAddFailed"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);
    const qty = Number(purchaseQty);
    if (!purchaseMaterialId || !purchaseQty || qty <= 0) {
      setSubmitError(t("materialsQuantityRequired"));
      return;
    }
    setSaving(true);
    try {
      const ok = await addMaterialTransaction({
        materialId: purchaseMaterialId,
        type: "in",
        quantity: qty,
        date: purchaseDate,
        cost: purchaseCost ? Number(purchaseCost) : undefined,
        notes: "Purchase",
      });
      if (ok) {
        setPurchaseMaterialId("");
        setPurchaseQty("");
        setPurchaseCost("");
        setShowPurchase(false);
        setSuccess(t("materialsPurchaseRecorded"));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setSubmitError(t("materialsAddFailed"));
      }
    } finally {
      setSaving(false);
    }
  };

  const lowStockCount = useMemo(() => materials.filter((m) => (m.stock_quantity || m.currentStock || 0) < LOW_STOCK_THRESHOLD).length, [materials]);
  const recentTx = useMemo(() => [...materialTransactions].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 30), [materialTransactions]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-theme tracking-tight">{t("materialsTitle")}</h1>
          </div>
          <p className="text-xs sm:text-sm text-theme-muted ml-[52px] mt-1">{t("materialsSubtitle")}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { setShowAddMaterial(true); setShowPurchase(false); setSubmitError(null); setEditingMaterialId(null); setName(""); setStock(""); setPricePerUnit(""); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> {t("materialsAddMaterial")}
          </button>
          <button
            onClick={() => { setShowPurchase(true); setShowAddMaterial(false); setSubmitError(null); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all active:scale-95 whitespace-nowrap"
          >
            <ArrowDownCircle className="w-4 h-4" /> {t("materialsRecordPurchase")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</div>
      )}
      {success && (
        <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-4 text-green-200">{success}</div>
      )}

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="xs:col-span-1 bg-theme-card border border-theme rounded-2xl p-5 sm:p-6 shadow-sm">
          <p className="text-theme-muted text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">{t("materialsTotalItems")}</p>
          <p className="text-2xl sm:text-3xl font-black text-theme">{materials.length}</p>
        </div>
        <div className="xs:col-span-1 bg-theme-card border border-theme rounded-2xl p-5 sm:p-6 shadow-sm">
          <p className="text-theme-muted text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">{t("materialsTotalTransactions")}</p>
          <p className="text-2xl sm:text-3xl font-black text-indigo-400">{materialTransactions.length}</p>
        </div>
        <div className="xs:col-span-2 lg:col-span-1 bg-theme-card border border-theme rounded-2xl p-5 sm:p-6 shadow-sm">
          <p className="text-theme-muted text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">{t("materialsLowStock")}</p>
          <div className="flex items-center gap-3">
            <p className={`text-2xl sm:text-3xl font-black ${lowStockCount > 0 ? "text-amber-400" : "text-theme"}`}>
              {lowStockCount}
            </p>
            {lowStockCount > 0 && (
              <div className="animate-pulse px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 uppercase">
                {t("materialsAttention")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Removed old buttons as they are now in header */}

      {showAddMaterial && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAddMaterial(false); setEditingMaterialId(null); }} />
          <div className="relative z-10 w-full sm:max-w-md bg-theme-card rounded-t-3xl sm:rounded-2xl shadow-2xl border border-theme flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-theme shrink-0">
              <h3 className="text-lg font-black text-theme tracking-tight uppercase">{editingMaterialId ? t("edit") : t("materialsNewMaterial")}</h3>
              <button onClick={() => { setShowAddMaterial(false); setEditingMaterialId(null); }} className="p-2 rounded-xl hover:bg-theme-track text-theme-muted transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {submitError && <p className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">{submitError}</p>}
              <div>
                <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">{t("materialsName")}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder={t("materialsNamePlaceholder")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">{t("category")}</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as MaterialCategory)} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{t(`matCat${c.charAt(0).toUpperCase() + c.slice(1)}` as keyof typeof t) || c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">{t("materialsUnit")}</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value as MaterialUnit)} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">{t("materialsInitialStock")}</label>
                  <input type="number" min={0} step="0.01" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">{t("materialsPricePerUnit")}</label>
                  <input type="number" min={0} step="0.01" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0.00" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Package className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-[11px] text-theme-muted leading-relaxed">
                  {t("materialsPriceHint")}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50">
                  {saving ? t("materialsSaving") : editingMaterialId ? t("update") : t("save")}
                </button>
                <button type="button" onClick={() => { setShowAddMaterial(false); setEditingMaterialId(null); }} className="px-6 py-3.5 rounded-xl bg-theme-track border border-theme text-theme-muted font-bold text-sm">
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPurchase && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPurchase(false)} />
          <div className="relative z-10 w-full sm:max-w-md bg-theme-card rounded-t-3xl sm:rounded-2xl shadow-2xl border border-theme flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-theme shrink-0">
              <h3 className="text-lg font-black text-theme tracking-tight uppercase">{t("materialsRecordPurchaseTitle")}</h3>
              <button onClick={() => setShowPurchase(false)} className="p-2 rounded-xl hover:bg-theme-track text-theme-muted transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <form onSubmit={handlePurchase} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {submitError && <p className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">{submitError}</p>}
              <div>
                <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">{t("materialsMaterial")}</label>
                <select value={purchaseMaterialId} onChange={(e) => setPurchaseMaterialId(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-green-500 outline-none appearance-none transition-all">
                  <option value="">{t("materialsSelectMaterial")}</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({t("materialsCurrent")}: {(m.stock_quantity || m.currentStock || 0)} {m.unit})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">{t("materialsQty")}</label>
                  <input type="number" min={0} step="0.01" value={purchaseQty} onChange={(e) => setPurchaseQty(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">{t("materialsTotalCost")}</label>
                  <input type="number" min={0} step="0.01" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">{t("date")}</label>
                <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all disabled:opacity-50">
                  {saving ? t("materialsSaving") : t("materialsRecord")}
                </button>
                <button type="button" onClick={() => setShowPurchase(false)} className="px-6 py-3.5 rounded-xl bg-theme-track border border-theme text-theme-muted font-bold text-sm">
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-theme-card border border-theme rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-theme">
            <h2 className="text-lg font-semibold text-theme">{t("materialsStockCurrent")}</h2>
          </div>
          <div className="w-full">
            <div className="hidden md:block overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-theme-muted border-b border-theme">
                    <th className="px-4 py-3">{t("materialsName")}</th>
                    <th className="px-4 py-3">{t("category")}</th>
                    <th className="px-4 py-3">{t("materialsStock")}</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="text-theme">
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-theme-muted">{t("materialsNoMaterialsYet")}</td>
                    </tr>
                  ) : (
                    materials.map((m) => (
                      <tr key={m.id} className={`border-b border-theme/50 hover:bg-theme-track ${(m.stock_quantity || m.currentStock || 0) < LOW_STOCK_THRESHOLD ? "bg-amber-500/5" : ""}`}>
                        <td className="px-4 py-2.5 font-medium">{m.name}</td>
                        <td className="px-4 py-2.5 capitalize">{m.category}</td>
                        <td className="px-4 py-2.5">
                          <span className={(m.stock_quantity || m.currentStock || 0) < LOW_STOCK_THRESHOLD ? "text-amber-400 font-medium" : ""}>{(m.stock_quantity || m.currentStock || 0)} {m.unit}</span>
                        </td>
                        <td className="px-4 py-2.5 text-theme-muted text-xs">
                          {m.price_per_unit ? `Rs ${m.price_per_unit}/${m.unit}` : "—"}
                        </td>
                        <td className="px-4 py-2.5 flex gap-1">
                          <button type="button" onClick={() => { setName(m.name); setCategory(m.category as MaterialCategory); setUnit(m.unit as MaterialUnit); setStock(String((m.stock_quantity || m.currentStock || 0) ?? 0)); setPricePerUnit(String(m.price_per_unit || "")); setEditingMaterialId(m.id); setShowAddMaterial(true); setSubmitError(null); }} className="p-1.5 text-theme-muted hover:bg-white/10 rounded" title={t("edit")}><Pencil className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setDeleteConfirmMaterialId(m.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title={t("delete")}><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-theme">
              {materials.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Package className="w-12 h-12 text-theme-track mx-auto mb-3" />
                  <p className="text-sm text-theme-muted">{t("materialsNoMaterialsYet")}</p>
                </div>
              ) : (
                materials.map((m) => {
                  const isLow = (m.stock_quantity || m.currentStock || 0) < LOW_STOCK_THRESHOLD;
                  return (
                    <div key={m.id} className="p-4 space-y-3 active:bg-theme-track/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-theme tracking-tight">{m.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] uppercase font-bold text-theme-muted px-1.5 py-0.5 rounded bg-theme-track border border-theme capitalize">{m.category}</span>
                            {m.price_per_unit && <span className="text-[10px] text-blue-400 font-medium">Rs {m.price_per_unit}/{m.unit}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-sm font-black ${isLow ? "text-amber-500" : "text-theme"}`}>
                            {(m.stock_quantity || m.currentStock || 0)} {m.unit}
                          </div>
                          {isLow && <p className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter mt-1">Low Stock</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button type="button" onClick={() => { setName(m.name); setCategory(m.category as MaterialCategory); setUnit(m.unit as MaterialUnit); setStock(String((m.stock_quantity || m.currentStock || 0) ?? 0)); setPricePerUnit(String(m.price_per_unit || "")); setEditingMaterialId(m.id); setShowAddMaterial(true); setSubmitError(null); }} className="px-3.5 py-1.5 rounded-xl bg-theme-track border border-theme text-theme-muted text-xs font-bold hover:text-theme transition-colors shadow-sm">{t("edit")}</button>
                        <button type="button" onClick={() => setDeleteConfirmMaterialId(m.id)} className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all shadow-sm">{t("delete")}</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-theme">
            <h2 className="text-lg font-semibold text-theme">{t("materialsRecentTransactions")}</h2>
          </div>
          <div className="w-full">
            <div className="hidden md:block overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-theme-muted border-b border-theme">
                    <th className="px-4 py-3">{t("date")}</th>
                    <th className="px-4 py-3">{t("materialsType")}</th>
                    <th className="px-4 py-3">{t("materialsMaterial")}</th>
                    <th className="px-4 py-3">{t("materialsQty")}</th>
                    <th className="px-4 py-3">{t("materialsFieldOrCost")}</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="text-theme">
                  {recentTx.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-theme-muted">{t("materialsNoTransactionsYet")}</td>
                    </tr>
                  ) : (
                    recentTx.map((tx) => {
                      const mat = materials.find((x) => x.id === tx.materialId);
                      return (
                        <tr key={tx.id} className="border-b border-theme/50">
                          <td className="px-4 py-2.5">{tx.date}</td>
                          <td className="px-4 py-2.5">
                            {tx.type === "in" ? (
                              <span className="text-green-400 flex items-center gap-1"><ArrowDownCircle className="w-3.5 h-3.5" /> In</span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1"><ArrowUpCircle className="w-3.5 h-3.5" /> Out</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">{mat?.name ?? tx.materialId}</td>
                          <td className="px-4 py-2.5">{tx.quantity}</td>
                          <td className="px-4 py-2.5">
                            {tx.type === "in" && tx.cost != null ? `Rs ${tx.cost.toLocaleString()}` : tx.fieldId ? fields.find((f) => f.id === tx.fieldId)?.name ?? tx.fieldId : "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <button type="button" onClick={() => setDeleteConfirmTxId(tx.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title={t("delete")}><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-theme">
              {recentTx.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <ArrowDownCircle className="w-12 h-12 text-theme-track mx-auto mb-3" />
                  <p className="text-sm text-theme-muted">{t("materialsNoTransactionsYet")}</p>
                </div>
              ) : (
                recentTx.map((tx) => {
                  const mat = materials.find((x) => x.id === tx.materialId);
                  const isPurchase = tx.type === "in";
                  return (
                    <div key={tx.id} className="p-4 space-y-3 active:bg-theme-track/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isPurchase ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>
                            {isPurchase ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-theme leading-tight">{mat?.name ?? t("materialsUnknown")}</p>
                            <p className="text-[10px] text-theme-muted mt-0.5">{tx.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${isPurchase ? "text-green-500" : "text-amber-500"}`}>
                            {isPurchase ? "+" : "-"}{tx.quantity} {mat?.unit ?? ""}
                          </p>
                          {isPurchase && tx.cost && <p className="text-[10px] text-theme-muted font-bold">Rs {tx.cost.toLocaleString()}</p>}
                          {!isPurchase && tx.fieldId && <p className="text-[10px] text-theme-muted font-bold">{fields.find(f => f.id === tx.fieldId)?.name ?? "Field"}</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-theme-muted italic line-clamp-1 flex-1 pr-4">{tx.notes || "No notes provided"}</p>
                        <button type="button" onClick={() => setDeleteConfirmTxId(tx.id)} className="p-2.5 rounded-xl text-theme-muted hover:text-red-500 hover:bg-red-500/10 active:bg-theme-track transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modals */}
        {(deleteConfirmMaterialId || deleteConfirmTxId) && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setDeleteConfirmMaterialId(null); setDeleteConfirmTxId(null); }} />
            <div className="relative z-10 bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-theme mb-2">{t("confirmDelete")}</h3>
              <p className="text-theme-muted text-sm mb-8 leading-relaxed">
                {deleteConfirmMaterialId ? t("materialsDeleteWarning") : "Deleting this transaction will revert the associated stock changes. This cannot be undone."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (deleteConfirmMaterialId) {
                      await deleteMaterial(deleteConfirmMaterialId);
                      setDeleteConfirmMaterialId(null);
                    } else if (deleteConfirmTxId) {
                      await deleteMaterialTransaction(deleteConfirmTxId);
                      setDeleteConfirmTxId(null);
                    }
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]"
                >
                  Yes, Delete
                </button>
                <button onClick={() => { setDeleteConfirmMaterialId(null); setDeleteConfirmTxId(null); }} className="flex-1 bg-theme-track border border-theme text-theme-muted py-3.5 rounded-xl font-bold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-20 md:hidden" />
      </div>
    </div>
  );
}
