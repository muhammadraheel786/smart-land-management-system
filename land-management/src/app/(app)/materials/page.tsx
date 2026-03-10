"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Package, ArrowDownCircle, ArrowUpCircle,
  Plus, Trash2, Search, CheckCircle2, XCircle, ShoppingCart,
  Minus, History, Edit2
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
    loading
  } = useLandStore();

  // Form State
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

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<MaterialCategory>("other");
  const [editUnit, setEditUnit] = useState<MaterialUnit>("kg");

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    const unitPrice = Number(cost) || 0;
    const totalCost = amount * unitPrice;

    if (!amount || amount <= 0) {
      setSubmitError(t("materialsQuantityRequired"));
      return;
    }

    setSaving(true);
    try {
      let matId = selectedMatId;

      if (matId === "NEW" || (!matId && newName.trim())) {
        const newMat = await addMaterial({
          name: newName.trim(),
          category: newCategory,
          unit: newUnit,
          stock_quantity: 0,
          price_per_unit: unitPrice
        });
        if (newMat) matId = (newMat as any).id;
        else throw new Error("Failed to create material");
      }

      if (!matId) {
        setSubmitError(t("materialsSelectMaterial"));
        return;
      }

      const ok = await addMaterialTransaction({
        materialId: matId,
        type: "in",
        quantity: amount,
        date: date,
        cost: totalCost > 0 ? totalCost : undefined,
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
    const currentMat = materials.find(m => m.id === matId);
    if (!currentMat) return;

    const originalStock = currentMat.stock_quantity || 0;
    const newStock = type === 'in' ? originalStock + amount : Math.max(0, originalStock - amount);

    // Optimistic UI
    useLandStore.setState(state => ({
      materials: state.materials.map(m => m.id === matId ? { ...m, stock_quantity: newStock } : m)
    }));

    try {
      await addMaterialTransaction({
        materialId: matId,
        type,
        quantity: amount,
        date: format(new Date(), "yyyy-MM-dd"),
        notes: `Quick ${type === 'in' ? 'Addition' : 'Usage'}`,
      });
    } catch (e) {
      // Revert
      useLandStore.setState(state => ({
        materials: state.materials.map(m => m.id === matId ? { ...m, stock_quantity: originalStock } : m)
      }));
      setSubmitError("Adjustment failed");
    }
  };

  const openEditModal = (m: Material) => {
    setEditingMaterial(m);
    setEditName(m.name);
    setEditCategory(m.category as any);
    setEditUnit(m.unit as any);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingMaterial) return;
    setSaving(true);
    try {
      await updateMaterial(editingMaterial.id, {
        name: editName,
        category: editCategory,
        unit: editUnit
      });
      setIsEditModalOpen(false);
      setSuccess("Updated");
      setTimeout(() => setSuccess(null), 2000);
    } catch (e) {
      setSubmitError("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const fastDelete = async (id: string) => {
    setDeleteConfirmId(null);
    try {
      await deleteMaterial(id);
      setSuccess("Deleted");
      setTimeout(() => setSuccess(null), 1500);
    } catch (e) {
      setSubmitError("Delete failed");
    }
  };

  const lowStockCount = useMemo(() => materials.filter((m) => (m.stock_quantity || 0) < LOW_STOCK_THRESHOLD).length, [materials]);
  const recentTx = useMemo(() => [...materialTransactions].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 50), [materialTransactions]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
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
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'stock' ? 'bg-theme-card text-theme shadow-sm' : 'text-theme-muted'}`}
          >
            <Package className="w-3.5 h-3.5" /> STOCKS
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'history' ? 'bg-theme-card text-theme shadow-sm' : 'text-theme-muted'}`}
          >
            <History className="w-3.5 h-3.5" /> HISTORY
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-theme-card border border-theme rounded-[2.5rem] p-6 shadow-xl sticky top-6">
            <h2 className="text-lg font-black text-theme uppercase tracking-tight mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" /> One-Click Entry
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2 tracking-tight"><XCircle className="w-4 h-4 shrink-0" /> {submitError}</div>}
              {success && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-theme-muted tracking-widest ml-1">Material</label>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full bg-theme-track border border-theme rounded-2xl px-4 py-3.5 text-sm font-bold text-theme outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose Material...</option>
                  <option value="NEW" className="text-blue-500">+ ADD NEW ITEM</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.stock_quantity || 0} {m.unit})</option>
                  ))}
                </select>
              </div>

              {selectedMatId === "NEW" && (
                <div className="p-4 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Material Name"
                    className="w-full bg-theme-card border border-blue-500/20 rounded-2xl px-4 py-3 text-sm font-bold text-theme"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as any)} className="bg-theme-card border border-theme rounded-2xl px-3 py-3 text-xs font-black text-theme">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </select>
                    <select value={newUnit} onChange={(e) => setNewUnit(e.target.value as any)} className="bg-theme-card border border-theme rounded-2xl px-3 py-3 text-xs font-black text-theme">
                      {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" className="w-full bg-theme-track border border-theme rounded-2xl px-4 py-3.5 text-lg font-black text-theme focus:ring-2 focus:ring-green-500" />
                <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Rate" className="w-full bg-theme-track border border-theme rounded-2xl px-4 py-3.5 text-lg font-black text-theme focus:ring-2 focus:ring-blue-500" />
              </div>

              <button
                type="submit"
                disabled={saving || (!selectedMatId && !newName)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-30"
              >
                {saving ? "SAVING..." : "RECORD ENTRY"}
              </button>
            </form>
          </div>
        </div>

        {/* Inventory List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-theme-card border border-theme p-4 md:p-5 rounded-3xl shadow-sm">
              <p className="text-[9px] md:text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">STOCKS</p>
              <p className="text-xl md:text-3xl font-black text-theme">{materials.length}</p>
            </div>
            <div className="bg-theme-card border border-theme p-4 md:p-5 rounded-3xl shadow-sm">
              <p className="text-[9px] md:text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">ALERTS</p>
              <p className="text-xl md:text-3xl font-black text-amber-500">{lowStockCount}</p>
            </div>
            <div className="bg-theme-card border border-theme p-4 md:p-5 rounded-3xl shadow-sm">
              <p className="text-[9px] md:text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">LOGS</p>
              <p className="text-xl md:text-3xl font-black text-blue-500">{materialTransactions.length}</p>
            </div>
          </div>

          {viewMode === 'stock' ? (
            <div className="bg-theme-card border border-theme rounded-[2.5rem] overflow-hidden shadow-lg">
              <div className="p-6 border-b border-theme flex items-center justify-between">
                <h3 className="font-black text-theme uppercase tracking-tight">Stock List</h3>
                <Search className="w-4 h-4 text-theme-muted" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left hidden sm:table">
                  <thead className="bg-theme-track/30 border-b border-theme text-[10px] font-black text-theme-muted uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4">Current Stock</th>
                      <th className="px-6 py-4 text-right">Adjust</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme/50">
                    {materials.map(m => {
                      const stock = m.stock_quantity || 0;
                      return (
                        <tr key={m.id} className="hover:bg-theme-track/10 group">
                          <td className="px-6 py-5">
                            <p className="font-black text-theme">{m.name}</p>
                            <span className="text-[9px] font-black text-theme-muted uppercase px-1.5 py-0.5 rounded bg-theme-track border border-theme">{m.category}</span>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-xl font-black text-theme">{stock} <span className="text-xs font-bold text-theme-muted uppercase">{m.unit}</span></p>
                          </td>
                          <td className="px-6 py-5 text-right space-x-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => quickAdjust(m.id, 'out', 1)} disabled={stock <= 0} className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 active:scale-90 transition-all font-black">-</button>
                            <button onClick={() => quickAdjust(m.id, 'in', 1)} className="w-9 h-9 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 active:scale-90 transition-all font-black">+</button>
                            <button onClick={() => openEditModal(m)} className="p-2 text-theme-muted hover:text-blue-500"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteConfirmId(m.id)} className="p-2 text-theme-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile View */}
                <div className="sm:hidden divide-y divide-theme">
                  {materials.map(m => (
                    <div key={m.id} className="p-5 flex justify-between items-center group">
                      <div>
                        <p className="font-black text-theme text-base">{m.name}</p>
                        <p className="text-xs font-bold text-theme-muted">Stock: <span className="text-theme">{m.stock_quantity || 0} {m.unit}</span></p>
                      </div>
                      <div className="flex gap-2.5">
                        <button onClick={() => quickAdjust(m.id, 'out', 1)} className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black">-</button>
                        <button onClick={() => quickAdjust(m.id, 'in', 1)} className="w-11 h-11 rounded-xl bg-green-500/10 text-green-500 border border-green-500/30 font-black">+</button>
                        <button onClick={() => openEditModal(m)} className="w-11 h-11 rounded-xl bg-theme-track border border-theme text-theme-muted flex items-center justify-center"><Edit2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {materials.length === 0 && <div className="p-10 text-center font-bold text-theme-muted italic text-sm">Empty Inventory</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-theme-card border border-theme rounded-[2.5rem] overflow-hidden shadow-lg">
              <div className="p-6 border-b border-theme font-black text-theme uppercase tracking-tight">Recent Logs</div>
              <div className="divide-y divide-theme max-h-[500px] overflow-y-auto">
                {recentTx.map(tx => (
                  <div key={tx.id} className="p-5 flex justify-between items-center hover:bg-theme-track/20">
                    <div className="flex gap-4 items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {tx.type === 'in' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-black text-theme text-sm">{materials.find(m => m.id === tx.materialId)?.name || 'Deleted Item'}</p>
                        <p className="text-[10px] font-bold text-theme-muted">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className={`font-black text-lg ${tx.type === 'in' ? 'text-green-500' : 'text-amber-500'}`}>{tx.type === 'in' ? '+' : '-'}{tx.quantity}</p>
                      <button onClick={() => deleteMaterialTransaction(tx.id)} className="p-2 text-theme-muted hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-theme-card border border-theme w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <h3 className="font-black text-theme text-xl uppercase tracking-tighter">Edit Material</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-theme-muted uppercase ml-1">Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-theme-track border border-theme rounded-2xl px-4 py-3.5 font-bold text-theme outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-theme-muted uppercase ml-1">Category</label>
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value as any)} className="w-full bg-theme-track border border-theme rounded-2xl px-3 py-3 font-bold text-theme">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-theme-muted uppercase ml-1">Unit</label>
                  <select value={editUnit} onChange={e => setEditUnit(e.target.value as any)} className="w-full bg-theme-track border border-theme rounded-2xl px-3 py-3 font-bold text-theme">
                    {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleUpdate} className="flex-1 bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">SAVE</button>
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-theme-track text-theme-muted font-black py-4 rounded-2xl active:scale-95 transition-all">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-theme-card border border-theme w-full max-w-xs rounded-[2.5rem] p-8 text-center shadow-2xl space-y-6">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><Trash2 className="w-10 h-10" /></div>
            <div>
              <h3 className="font-black text-theme text-lg uppercase">Delete Permanently?</h3>
              <p className="text-xs font-bold text-theme-muted mt-1 px-4 leading-relaxed">This will remove all stock and history records. Operation is irreversible.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => deleteConfirmId && fastDelete(deleteConfirmId)} className="bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest">Delete Now</button>
              <button onClick={() => setDeleteConfirmId(null)} className="text-theme-muted font-black text-xs uppercase tracking-widest py-2">Keep Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
