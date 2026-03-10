"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Package, ArrowDownCircle, ArrowUpCircle,
  Plus, Trash2, Pencil, AlertTriangle,
  Search, CheckCircle2, XCircle, ShoppingCart,
  Minus, Plus as PlusIcon, History
} from "lucide-react";
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
    deleteMaterial,
    deleteMaterialTransaction,
    loading,
    error,
  } = useLandStore();

  // Unified State for "Quick Add"
  const [selectedMatId, setSelectedMatId] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<MaterialCategory>("other");
  const [newUnit, setNewUnit] = useState<MaterialUnit>("kg");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'stock' | 'history'>('stock');

  useEffect(() => {
    fetchAll();
    fetchMaterials();
    fetchMaterialTransactions();
  }, [fetchAll, fetchMaterials, fetchMaterialTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);

    const amount = Number(qty);
    if (!amount || amount <= 0) {
      setSubmitError(t("materialsQuantityRequired"));
      return;
    }

    setSaving(true);
    try {
      let matId = selectedMatId;

      // 1. If "New Material" is selected or typed
      if (matId === "NEW" || (!matId && newName.trim())) {
        const newMat = await addMaterial({
          name: newName.trim(),
          category: newCategory,
          unit: newUnit,
          stock_quantity: 0,
          price_per_unit: cost ? Number(cost) / amount : 0
        });
        if (newMat) {
          matId = (newMat as any).id;
        } else {
          throw new Error("Failed to create material");
        }
      }

      if (!matId) {
        setSubmitError(t("materialsSelectMaterial"));
        return;
      }

      // 2. Record the Purchase (Transaction IN)
      const ok = await addMaterialTransaction({
        materialId: matId,
        type: "in",
        quantity: amount,
        date: date,
        cost: cost ? Number(cost) : undefined,
        notes: "Quick Entry",
      });

      if (ok) {
        setNewName("");
        setQty("");
        setCost("");
        setSelectedMatId("");
        setSuccess(t("materialsPurchaseRecorded"));
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setSubmitError(err.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const quickAdjust = async (matId: string, type: 'in' | 'out', amount: number) => {
    setSaving(true);
    try {
      await addMaterialTransaction({
        materialId: matId,
        type,
        quantity: amount,
        date: format(new Date(), "yyyy-MM-dd"),
        notes: `Quick ${type === 'in' ? 'Addition' : 'Usage'}`,
      });
      setSuccess(`${t("recordUpdated")}`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setSubmitError("Adjustment failed");
    } finally {
      setSaving(false);
    }
  };

  const lowStockCount = useMemo(() => materials.filter((m) => (m.stock_quantity || m.currentStock || 0) < LOW_STOCK_THRESHOLD).length, [materials]);
  const recentTx = useMemo(() => [...materialTransactions].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 50), [materialTransactions]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-theme tracking-tight">{t("materialsTitle")}</h1>
            <p className="text-sm text-theme-muted">{t("materialsSubtitle")}</p>
          </div>
        </div>

        <div className="flex bg-theme-track p-1 rounded-2xl self-start">
          <button
            onClick={() => setViewMode('stock')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'stock' ? 'bg-theme-card text-theme shadow-sm' : 'text-theme-muted hover:text-theme'}`}
          >
            <Package className="w-3.5 h-3.5" /> {t("materialsStock")}
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'history' ? 'bg-theme-card text-theme shadow-sm' : 'text-theme-muted hover:text-theme'}`}
          >
            <History className="w-3.5 h-3.5" /> {t("history")}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Quick Entry Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-theme-card border border-theme rounded-[2.5rem] p-6 shadow-xl sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20">
                <PlusIcon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-theme uppercase tracking-tight">One-Click Entry</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2"><XCircle className="w-4 h-4" /> {submitError}</div>}
              {success && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-theme-muted tracking-widest ml-1">Material Name</label>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full bg-theme-track border border-theme rounded-2xl px-4 py-3.5 text-sm font-bold text-theme outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="">Choose Material...</option>
                  <option value="NEW" className="text-blue-500 font-black">+ ADD NEW ITEM</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.stock_quantity || 0} {m.unit})</option>
                  ))}
                </select>
              </div>

              {(selectedMatId === "NEW" || materials.length === 0) && (
                <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-blue-500 tracking-widest leading-none ml-1">New Material Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Urea 50kg"
                      className="w-full bg-theme-card border border-blue-500/20 rounded-2xl px-4 py-3 text-sm font-bold text-theme placeholder:text-theme-muted focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-theme-muted tracking-widest ml-1">{t("category")}</label>
                      <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)} className="w-full bg-theme-card border border-theme rounded-2xl px-3 py-3 text-sm font-bold text-theme outline-none">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-theme-muted tracking-widest ml-1">{t("materialsUnit")}</label>
                      <select value={newUnit} onChange={(e) => setNewUnit(e.target.value as any)} className="w-full bg-theme-card border border-theme rounded-2xl px-3 py-3 text-sm font-bold text-theme outline-none">
                        {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-theme-muted tracking-widest ml-1">Quantity</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-theme-track border border-theme rounded-2xl pl-4 pr-12 py-3.5 text-lg font-black text-theme focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:opacity-30"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-theme-muted uppercase">
                      {selectedMatId && selectedMatId !== "NEW" ? materials.find(m => m.id === selectedMatId)?.unit : newUnit}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-theme-muted tracking-widest ml-1">Total Price (Rs)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-theme-track border border-theme rounded-2xl px-4 py-3.5 text-lg font-black text-theme focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-[10px] placeholder:font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-theme-muted tracking-widest ml-1">Purchase Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-theme-track border border-theme rounded-2xl px-4 py-3.5 text-sm font-bold text-theme outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving || (!selectedMatId && !newName)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale mt-2 flex items-center justify-center gap-3"
              >
                {saving ? "SAVING..." : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    RECORD ENTRY
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Inventory Lists */}
        <div className="lg:col-span-8 space-y-6">

          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-theme-card border border-theme p-5 rounded-[2rem] shadow-sm">
              <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">Stock Items</p>
              <p className="text-3xl font-black text-theme">{materials.length}</p>
            </div>
            <div className="bg-theme-card border border-theme p-5 rounded-[2rem] shadow-sm">
              <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">Recent Activity</p>
              <p className="text-3xl font-black text-blue-500">{materialTransactions.length}</p>
            </div>
            <div className="bg-theme-card border border-theme p-5 rounded-[2rem] shadow-sm border-amber-500/20">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Low Stock Alerts</p>
              <p className="text-3xl font-black text-amber-500">{lowStockCount}</p>
            </div>
          </div>

          {viewMode === 'stock' ? (
            <div className="bg-theme-card border border-theme rounded-[2.5rem] overflow-hidden shadow-lg animate-in fade-in duration-500">
              <div className="p-6 border-b border-theme flex items-center justify-between">
                <h3 className="font-black text-theme uppercase tracking-tight">Current Inventory</h3>
                <div className="relative hidden md:block">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
                  <input type="text" placeholder="Search items..." className="bg-theme-track border border-theme rounded-xl pl-9 pr-4 py-1.5 text-xs text-theme outline-none focus:ring-1 focus:ring-blue-500 w-48" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-theme-track/30">
                    <tr className="text-[10px] font-black text-theme-muted uppercase tracking-widest border-b border-theme">
                      <th className="px-6 py-4">Item (Category)</th>
                      <th className="px-6 py-4">Current Stock</th>
                      <th className="px-6 py-4 text-right">Rapid Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme/50">
                    {materials.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-20 text-center text-theme-muted font-bold italic">Inventory is empty. Use the form on the left to add items.</td></tr>
                    ) : (
                      materials.map(m => {
                        const stock = m.stock_quantity || m.currentStock || 0;
                        const isLow = stock < LOW_STOCK_THRESHOLD;
                        return (
                          <tr key={m.id} className="hover:bg-theme-track/20 group">
                            <td className="px-6 py-5">
                              <div>
                                <p className="font-black text-theme leading-tight">{m.name}</p>
                                <span className="text-[10px] font-bold text-theme-muted uppercase mt-0.5 inline-block px-2 py-0.5 rounded bg-theme-track border border-theme">{m.category}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <p className={`text-xl font-black ${isLow ? 'text-amber-500' : 'text-theme'}`}>{stock} <span className="text-xs font-bold text-theme-muted uppercase">{m.unit}</span></p>
                                {isLow && <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />}
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center justify-end gap-2">
                                {/* Rapid Adjustment Buttons */}
                                <button
                                  onClick={() => quickAdjust(m.id, 'out', 1)}
                                  disabled={saving || stock <= 0}
                                  className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all active:scale-90"
                                  title="Record 1 unit usage"
                                >
                                  <Minus className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => quickAdjust(m.id, 'in', 1)}
                                  disabled={saving}
                                  className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all active:scale-90"
                                  title="Quickly add 1 unit"
                                >
                                  <PlusIcon className="w-5 h-5" />
                                </button>

                                <div className="w-px h-6 bg-theme mx-1" />

                                <button
                                  onClick={() => deleteMaterial(m.id)}
                                  className="w-10 h-10 rounded-xl text-theme-muted hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* History View */
            <div className="bg-theme-card border border-theme rounded-[2.5rem] overflow-hidden shadow-lg animate-in fade-in duration-500">
              <div className="p-6 border-b border-theme">
                <h3 className="font-black text-theme uppercase tracking-tight">Recent Transactions</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <div className="divide-y divide-theme">
                  {recentTx.length === 0 ? (
                    <div className="p-20 text-center text-theme-muted font-bold italic">No records yet.</div>
                  ) : (
                    recentTx.map(tx => {
                      const mat = materials.find(m => m.id === tx.materialId);
                      const isPurchase = tx.type === 'in';
                      return (
                        <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-theme-track/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPurchase ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              {isPurchase ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-black text-theme text-sm">{mat?.name || 'Unknown'}</p>
                              <p className="text-[10px] font-bold text-theme-muted uppercase">{tx.date} • {tx.notes || 'No notes'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-black ${isPurchase ? 'text-green-500' : 'text-amber-500'}`}>
                              {isPurchase ? '+' : '-'}{tx.quantity} <span className="text-[10px]">{mat?.unit}</span>
                            </p>
                            {isPurchase && tx.cost && <p className="text-[10px] font-bold text-theme-muted tracking-tighter">Rs {tx.cost.toLocaleString()}</p>}
                          </div>
                          <button
                            onClick={() => deleteMaterialTransaction(tx.id)}
                            className="ml-4 p-2 text-theme-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
