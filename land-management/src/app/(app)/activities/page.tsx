"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Search, Filter, Loader2, ArrowUpRight, ArrowDownRight, Sprout, TrendingUp, Droplet, DollarSign, Leaf, ShoppingCart } from "lucide-react";

// Inline Card Component 
function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return <div className={`bg-theme-card rounded-2xl shadow-sm border border-theme ${className}`}>{children}</div>;
}
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Activity, GeoFence, Material } from "@/types";

export default function ActivitiesPage() {
    const { isLoggedIn } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [fields, setFields] = useState<GeoFence[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [activityType, setActivityType] = useState<Activity['activity_type']>('irrigation');
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [fieldId, setFieldId] = useState("");
    const [materialId, setMaterialId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [cost, setCost] = useState("");
    const [income, setIncome] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [actRes, fldRes, matRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/activities`).then(r => r.json()),
                api.getFields(),
                api.getMaterials()
            ]);
            setActivities(actRes || []);
            setFields(fldRes || []);
            setMaterials(matRes || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: Partial<Activity> = {
                activity_type: activityType,
                date: date,
                notes: notes,
            };

            if (fieldId) payload.field_id = fieldId;
            if (materialId) payload.material_id = materialId;
            if (quantity) payload.quantity_used = Number(quantity);
            if (cost) payload.cost = Number(cost);
            if (income) payload.income = Number(income);

            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/activities`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Failed to save activity", error);
            alert("Error saving. See console.");
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setActivityType('irrigation');
        setDate(format(new Date(), "yyyy-MM-dd"));
        setFieldId("");
        setMaterialId("");
        setQuantity("");
        setCost("");
        setIncome("");
        setNotes("");
    };

    const deleteActivity = async (id: string) => {
        if (!confirm("Delete this activity?")) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/activities/${id}`, {
                method: "DELETE"
            });
            fetchData();
        } catch (error) {
            console.error("Error deleting", error);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'irrigation': return <Droplet className="text-blue-500 w-5 h-5" />;
            case 'fertilizer_application':
            case 'pesticide_spray': return <Leaf className="text-emerald-500 w-5 h-5" />;
            case 'seed_sowing': return <Sprout className="text-green-500 w-5 h-5" />;
            case 'harvest': return <TrendingUp className="text-yellow-500 w-5 h-5" />;
            case 'material_purchase': return <ShoppingCart className="text-purple-500 w-5 h-5" />;
            case 'expense':
            case 'labor': return <ArrowDownRight className="text-red-500 w-5 h-5" />;
            case 'income': return <ArrowUpRight className="text-green-500 w-5 h-5" />;
            default: return <Leaf className="text-theme-muted w-5 h-5" />;
        }
    };

    const totalIncome = activities.reduce((acc, a) => acc + (a.income || 0), 0);
    const totalExpense = activities.reduce((acc, a) => acc + (a.cost || 0), 0);
    const netProfit = totalIncome - totalExpense;

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in p-2 sm:p-4 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-theme">Farm Activities</h1>
                    <p className="text-theme-muted mt-1">Unified ledger for all your farm operations</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Activity</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <Card className="p-6 bg-gradient-to-br from-white to-green-50 dark:from-theme-card dark:to-green-950/20 border-green-500/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-theme-muted mb-1">Total Income</p>
                            <h3 className="text-2xl font-bold text-green-500">Rs {totalIncome.toLocaleString()}</h3>
                        </div>
                        <div className="p-2.5 bg-green-500/10 rounded-xl"><ArrowUpRight className="w-5 h-5 text-green-500" /></div>
                    </div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-white to-red-50 dark:from-theme-card dark:to-red-950/20 border-red-500/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-theme-muted mb-1">Total Expenses</p>
                            <h3 className="text-2xl font-bold text-red-500">Rs {totalExpense.toLocaleString()}</h3>
                        </div>
                        <div className="p-2.5 bg-red-500/10 rounded-xl"><ArrowDownRight className="w-5 h-5 text-red-500" /></div>
                    </div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-theme-card to-theme-card relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-sm font-medium text-theme-muted mb-1">Net Profit</p>
                            <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                Rs {netProfit.toLocaleString()}
                            </h3>
                        </div>
                        <div className={`p-2.5 rounded-xl ${netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <DollarSign className={`w-5 h-5 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden bg-theme-card border-theme shadow-sm">
                <div className="p-5 sm:p-6 border-b border-theme flex flex-col sm:flex-row gap-4 justify-between">
                    <h2 className="text-lg font-bold text-theme">Activity Log</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-theme-track/50 text-theme-muted uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Activity</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Field / Material</th>
                                <th className="px-6 py-4 font-semibold text-right">Financial Impact</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                            {activities.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-theme-muted">
                                        No activities recorded yet. Clean slate!
                                    </td>
                                </tr>
                            ) : (
                                activities.map(act => (
                                    <tr key={act.id} className="hover:bg-theme-track/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-theme-track rounded-lg border border-theme">
                                                    {getActivityIcon(act.activity_type)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-theme capitalize">{act.activity_type.replace('_', ' ')}</p>
                                                    <p className="text-xs text-theme-muted max-w-[200px] truncate">{act.notes}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-theme-muted">
                                            {act.date?.split('T')[0]}
                                        </td>
                                        <td className="px-6 py-4">
                                            {act.field_id && <p className="text-theme">Field: <span className="font-medium">{fields.find(f => f.id === act.field_id)?.name || 'Unknown'}</span></p>}
                                            {act.material_id && <p className="text-theme-muted text-xs mt-0.5">Material: {materials.find(m => m.id === act.material_id)?.name} ({act.quantity_used})</p>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                                            {(act.cost || 0) > 0 && <span className="text-red-500 block">- Rs {act.cost?.toLocaleString()}</span>}
                                            {(act.income || 0) > 0 && <span className="text-green-500 block">+ Rs {act.income?.toLocaleString()}</span>}
                                            {((!act.cost || act.cost === 0) && (!act.income || act.income === 0)) && <span className="text-theme-muted">-</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button onClick={() => deleteActivity(act.id)} className="text-red-500 hover:text-red-600 text-sm font-medium">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Dynamic Activity Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-theme/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <Card className="relative z-10 w-full max-w-lg bg-theme-card border-theme shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-theme shrink-0 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-theme">Record Activity</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-theme-muted hover:text-red-500 transition-colors text-2xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-4">

                                <div>
                                    <label className="block text-sm font-medium text-theme mb-1">Activity Type</label>
                                    <select
                                        value={activityType}
                                        onChange={e => setActivityType(e.target.value as any)}
                                        className="w-full rounded-xl bg-theme-track border border-theme text-theme px-4 py-2.5 focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="irrigation">Irrigation</option>
                                        <option value="fertilizer_application">Fertilizer Application</option>
                                        <option value="pesticide_spray">Pesticide Spray</option>
                                        <option value="seed_sowing">Seed Sowing</option>
                                        <option value="harvest">Harvest</option>
                                        <option value="material_purchase">Material Purchase</option>
                                        <option value="labor">Labor</option>
                                        <option value="expense">Other Expense</option>
                                        <option value="income">Other Income</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-theme mb-1">Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                                        className="w-full rounded-xl bg-theme-track border border-theme text-theme px-4 py-2.5" />
                                </div>

                                {/* Conditional Fields based on Activity Type */}

                                {['irrigation', 'fertilizer_application', 'pesticide_spray', 'seed_sowing', 'harvest', 'labor', 'expense'].includes(activityType) && (
                                    <div>
                                        <label className="block text-sm font-medium text-theme mb-1">Field</label>
                                        <select value={fieldId} onChange={e => setFieldId(e.target.value)} required={activityType !== 'expense'}
                                            className="w-full rounded-xl bg-theme-track border border-theme text-theme px-4 py-2.5">
                                            <option value="">Select a field...</option>
                                            {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {['fertilizer_application', 'pesticide_spray', 'seed_sowing', 'material_purchase'].includes(activityType) && (
                                    <div>
                                        <label className="block text-sm font-medium text-theme mb-1">Material</label>
                                        <select value={materialId} onChange={e => setMaterialId(e.target.value)} required
                                            className="w-full rounded-xl bg-theme-track border border-theme text-theme px-4 py-2.5">
                                            <option value="">Select material...</option>
                                            {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.stock_quantity || m.currentStock || 0} in stock)</option>)}
                                        </select>
                                    </div>
                                )}

                                {['fertilizer_application', 'pesticide_spray', 'seed_sowing', 'material_purchase', 'irrigation', 'harvest'].includes(activityType) && (
                                    <div>
                                        <label className="block text-sm font-medium text-theme mb-1">
                                            {activityType === 'irrigation' ? 'Duration (minutes)' :
                                                activityType === 'harvest' ? 'Yield Quantity (kg)' : 'Quantity'}
                                        </label>
                                        <input type="number" min="0" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} required={activityType !== 'irrigation'}
                                            className="w-full rounded-xl bg-theme-track border border-theme text-theme px-4 py-2.5" />
                                    </div>
                                )}

                                {['material_purchase', 'labor', 'expense'].includes(activityType) && (
                                    <div>
                                        <label className="block text-sm font-medium text-theme mb-1">Total Cost (Rs)</label>
                                        <input type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} required
                                            className="w-full rounded-xl bg-theme-track border border-theme text-theme px-4 py-2.5" />
                                    </div>
                                )}

                                {['harvest', 'income'].includes(activityType) && (
                                    <div>
                                        <label className="block text-sm font-medium text-theme mb-1">Total Income Generated (Rs)</label>
                                        <input type="number" min="0" value={income} onChange={e => setIncome(e.target.value)} required
                                            className="w-full rounded-xl bg-theme-track border border-theme text-theme px-4 py-2.5" />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-theme mb-1">Notes</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                        className="w-full rounded-xl bg-theme-track border border-theme text-theme px-4 py-2" placeholder="Optional notes..."></textarea>
                                </div>

                                <div className="pt-4 border-t border-theme sticky bottom-0 bg-theme-card flex gap-3">
                                    <button type="submit" disabled={saving}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50">
                                        {saving ? 'Saving...' : 'Save Activity'}
                                    </button>
                                    <button type="button" onClick={() => setIsModalOpen(false)}
                                        className="flex-1 bg-theme-track text-theme hover:bg-theme-track/80 py-2.5 rounded-xl font-semibold transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
