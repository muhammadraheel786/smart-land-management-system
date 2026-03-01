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
        await updateMaterial(editingMaterialId, { name: name.trim(), category, unit, currentStock: stock ? Number(stock) : 0 });
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
        currentStock: stock ? Number(stock) : 0,
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

  const lowStockCount = useMemo(() => materials.filter((m) => m.currentStock < LOW_STOCK_THRESHOLD).length, [materials]);
  const recentTx = useMemo(() => [...materialTransactions].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 30), [materialTransactions]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
          <Package className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-theme">{t("materials")}</h1>
          <p className="text-theme-muted">{t("materialsSubtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</div>
      )}
      {success && (
        <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-4 text-green-200">{success}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <p className="text-theme-muted text-sm">{t("materialsTotalItems")}</p>
          <p className="text-2xl font-bold text-theme">{materials.length}</p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <p className="text-theme-muted text-sm">{t("materialsTotalTransactions")}</p>
          <p className="text-2xl font-bold text-blue-400">{materialTransactions.length}</p>
        </div>
        <div className="bg-theme-card border border-theme rounded-2xl p-6">
          <p className="text-theme-muted text-sm">{t("materialsLowStock")}</p>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? "text-amber-400" : "text-theme"}`}>
            {lowStockCount}
            {lowStockCount > 0 && <AlertTriangle className="w-5 h-5 inline-block ml-1 align-middle" />}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => { setShowAddMaterial(true); setShowPurchase(false); setSubmitError(null); setEditingMaterialId(null); setName(""); setStock(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30"
        >
          <Plus className="w-4 h-4" /> {t("materialsAddMaterial")}
        </button>
        <button
          onClick={() => { setShowPurchase(true); setShowAddMaterial(false); setSubmitError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30"
        >
          <ArrowDownCircle className="w-4 h-4" /> {t("materialsRecordPurchase")}
        </button>
      </div>

      {showAddMaterial && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6 max-w-md">
          <h3 className="text-lg font-semibold text-theme mb-4">{editingMaterialId ? t("edit") : t("materialsNewMaterial")}</h3>
          <form onSubmit={handleAddMaterial} className="space-y-4">
            {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
            <div>
              <label className="block text-sm text-theme-muted mb-1">{t("materialsName")}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme" placeholder={t("materialsNamePlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-theme-muted mb-1">{t("category")}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as MaterialCategory)} className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{t(`matCat${c.charAt(0).toUpperCase() + c.slice(1)}` as keyof typeof t) || c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-theme-muted mb-1">{t("materialsUnit")}</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value as MaterialUnit)} className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme">
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">{t("materialsInitialStock")}</label>
              <input type="number" min={0} step="0.01" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-green-600 text-theme font-medium disabled:opacity-50">{saving ? t("materialsSaving") : editingMaterialId ? t("update") : t("save")}</button>
              <button type="button" onClick={() => { setShowAddMaterial(false); setEditingMaterialId(null); }} className="px-4 py-2.5 rounded-xl bg-theme-track text-theme-muted">{t("cancel")}</button>
            </div>
          </form>
        </div>
      )}

      {showPurchase && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6 max-w-md">
          <h3 className="text-lg font-semibold text-theme mb-4">{t("materialsRecordPurchaseTitle")}</h3>
          <form onSubmit={handlePurchase} className="space-y-4">
            {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
            <div>
              <label className="block text-sm text-theme-muted mb-1">{t("materialsMaterial")}</label>
              <select value={purchaseMaterialId} onChange={(e) => setPurchaseMaterialId(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme">
                <option value="">{t("materialsSelectMaterial")}</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({t("materialsCurrent")}: {m.currentStock} {m.unit})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-theme-muted mb-1">{t("materialsQuantity")}</label>
                <input type="number" min="0.01" step="0.01" value={purchaseQty} onChange={(e) => setPurchaseQty(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme" />
              </div>
              <div>
                <label className="block text-sm text-theme-muted mb-1">{t("materialsCost")}</label>
                <input type="number" min={0} value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">{t("date")}</label>
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-blue-600 text-theme font-medium disabled:opacity-50">{saving ? t("materialsSaving") : t("materialsRecordPurchase")}</button>
              <button type="button" onClick={() => setShowPurchase(false)} className="px-4 py-2.5 rounded-xl bg-theme-track text-theme-muted">{t("cancel")}</button>
            </div>
          </form>
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
                      <tr key={m.id} className={`border-b border-theme/50 hover:bg-theme-track ${m.currentStock < LOW_STOCK_THRESHOLD ? "bg-amber-500/5" : ""}`}>
                        <td className="px-4 py-2.5 font-medium">{m.name}</td>
                        <td className="px-4 py-2.5 capitalize">{m.category}</td>
                        <td className="px-4 py-2.5">
                          <span className={m.currentStock < LOW_STOCK_THRESHOLD ? "text-amber-400 font-medium" : ""}>{m.currentStock} {m.unit}</span>
                        </td>
                        <td className="px-4 py-2.5 flex gap-1">
                          <button type="button" onClick={() => { setName(m.name); setCategory(m.category); setUnit(m.unit); setStock(String(m.currentStock ?? 0)); setEditingMaterialId(m.id); setShowAddMaterial(true); setSubmitError(null); }} className="p-1.5 text-theme-muted hover:bg-white/10 rounded" title={t("edit")}><Pencil className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setDeleteConfirmMaterialId(m.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title={t("delete")}><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-4 space-y-3 bg-theme-track/30 max-h-[400px] overflow-y-auto">
              {materials.length === 0 ? (
                <div className="text-center py-6 text-sm text-theme-muted bg-theme-card rounded-xl border border-theme">
                  {t("materialsNoMaterialsYet")}
                </div>
              ) : (
                materials.map((m) => (
                  <div key={m.id} className={`bg-theme-card border rounded-xl p-4 shadow-sm flex items-center justify-between gap-2 ${m.currentStock < LOW_STOCK_THRESHOLD ? "border-amber-500/30 bg-amber-500/5" : "border-theme"}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-theme truncate">{m.name}</p>
                      <p className="text-sm text-theme-muted capitalize mt-0.5">{m.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-sm font-bold ${m.currentStock < LOW_STOCK_THRESHOLD ? "text-amber-400" : "text-theme"}`}>
                        {m.currentStock} {m.unit}
                      </span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => { setName(m.name); setCategory(m.category); setUnit(m.unit); setStock(String(m.currentStock ?? 0)); setEditingMaterialId(m.id); setShowAddMaterial(true); setSubmitError(null); }} className="p-1.5 text-theme-muted bg-theme-track hover:text-theme border border-theme rounded-lg" title={t("edit")}><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setDeleteConfirmMaterialId(m.id)} className="p-1.5 text-red-500 hover:text-white bg-red-500/10 border border-red-500/20 rounded-lg" title={t("delete")}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))
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

            <div className="md:hidden p-4 space-y-3 bg-theme-track/30 max-h-[400px] overflow-y-auto">
              {recentTx.length === 0 ? (
                <div className="text-center py-6 text-sm text-theme-muted bg-theme-card rounded-xl border border-theme">
                  {t("materialsNoTransactionsYet")}
                </div>
              ) : (
                recentTx.map((tx) => {
                  const mat = materials.find((x) => x.id === tx.materialId);
                  return (
                    <div key={tx.id} className="bg-theme-card border border-theme rounded-xl p-4 shadow-sm relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-theme text-base truncate">{mat?.name ?? tx.materialId}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {tx.type === "in" ? (
                              <span className="text-green-400 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10"><ArrowDownCircle className="w-3 h-3" /> IN</span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10"><ArrowUpCircle className="w-3 h-3" /> OUT</span>
                            )}
                            <span className="text-xs text-theme-muted">{tx.date}</span>
                          </div>
                        </div>
                        <button type="button" onClick={() => setDeleteConfirmTxId(tx.id)} className="absolute top-4 right-4 p-1.5 text-red-500 hover:text-white bg-red-500/10 border border-red-500/20 rounded-lg" title={t("delete")}><Trash2 className="w-4 h-4" /></button>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 mt-4 text-sm mt-3 border-t border-theme pt-3">
                        <div>
                          <span className="text-theme-muted block text-xs mb-0.5">{t("materialsQty")}</span>
                          <span className="text-theme font-medium">{tx.quantity} {mat?.unit ?? ""}</span>
                        </div>
                        <div>
                          <span className="text-theme-muted block text-xs mb-0.5">{t("materialsFieldOrCost")}</span>
                          <span className="text-theme text-sm">{tx.type === "in" && tx.cost != null ? `Rs ${tx.cost.toLocaleString()}` : tx.fieldId ? (fields.find((f) => f.id === tx.fieldId)?.name ?? tx.fieldId) : "—"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {(deleteConfirmMaterialId || deleteConfirmTxId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setDeleteConfirmMaterialId(null); setDeleteConfirmTxId(null); }}>
          <div className="bg-theme-card border border-theme rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-theme mb-4">{t("confirmDelete")}</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setDeleteConfirmMaterialId(null); setDeleteConfirmTxId(null); }} className="px-4 py-2 rounded-xl border border-theme text-theme-muted hover:text-theme">{t("cancel")}</button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteConfirmMaterialId) {
                    await deleteMaterial(deleteConfirmMaterialId);
                    setDeleteConfirmMaterialId(null);
                  } else if (deleteConfirmTxId) {
                    await deleteMaterialTransaction(deleteConfirmTxId);
                    setDeleteConfirmTxId(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-theme hover:bg-red-500"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
