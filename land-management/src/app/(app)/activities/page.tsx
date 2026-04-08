"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Plus, Loader2, ArrowUpRight, ArrowDownRight, Sprout, TrendingUp,
    Droplet, DollarSign, Leaf, ShoppingCart, Users, Trash2, X,
    CheckCircle, AlertCircle, Filter, ChevronDown, Package, BarChart3,
    Calendar, FileText, Zap, Map as MapIcon, Info, Download, Truck, Fuel
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import type { Activity, GeoFence, Material } from "@/types";
import * as XLSX from "xlsx";

// ─── Helpers ────────────────────────────────────────────────────────────────

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
const API_URL = rawApiUrl.replace(/\/+$/, "").replace(/\/api$/, "");

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("smartland_token") : null;
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
}

async function apiFetch(path: string, opts?: RequestInit) {
    // Ensure path starts with /api if not present, to match api.ts behavior
    const targetPath = path.startsWith("/api") ? path : `/api${path}`;
    const res = await fetch(`${API_URL}${targetPath}`, {
        ...opts,
        headers: { ...getAuthHeaders(), ...(opts?.headers ?? {}) }
    });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `API error ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
}

// ─── Extract custom activity name from notes ────────────────────────────────
// Custom activities save the name as "[Tractor Expense] optional notes"
function extractCustomName(notes?: string | null): string | null {
    if (!notes) return null;
    const match = notes.match(/^\[(.+?)\]/);
    return match ? match[1] : null;
}

function stripCustomName(notes?: string | null): string {
    if (!notes) return "";
    return notes.replace(/^\[.+?\]\s*/, "");
}

// ─── Activity Badge ──────────────────────────────────────────────────────────

function ActivityBadge({ type, meta, labelOverride }: { type: string; meta?: any; labelOverride?: string }) {
    const { locale } = useLocale();
    const defaultMeta = { label: type, icon: <FileText className="w-4 h-4" />, color: "text-theme-muted", bg: "bg-theme-track", border: "border-theme" };
    const m = meta ?? defaultMeta;
    const displayLabel = labelOverride || (locale === "ur" ? (m.desc || m.label) : m.label);
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${m.color} ${m.bg} ${m.border}`}>
            {m.icon} {displayLabel}
        </span>
    );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, gradient, textColor }: {
    label: string; value: string; icon: React.ReactNode; gradient: string; textColor: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 border ${gradient}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium opacity-75 mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">{icon}</div>
            </div>
            {/* Decorative blob */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5" />
        </div>
    );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
    const { locale } = useLocale();
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center mb-2">
                <BarChart3 className="w-9 h-9 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-theme">
                {locale === "ur" ? "ابھی تک کوئی ریکارڈ نہیں ہے" : "No activities yet"}
            </h3>
            <p className="text-theme-muted max-w-sm">
                {locale === "ur" ? "کھیت کے کام درج کرنا شروع کریں - جیسے پانی دینا، اسپرے، بیج بونا اور دیگر۔" : "Start recording your farm activities — irrigation, spraying, sowing and more."}
            </p>
            <button onClick={onAdd} className="mt-2 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95">
                <Plus className="w-4 h-4" /> {locale === "ur" ? "پہلا ریکارڈ درج کریں" : "Record First Activity"}
            </button>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function ActivitiesContent() {
    const { isDataEntry } = useAuth();
    const { t, locale, setLocale } = useLocale();
    const searchParams = useSearchParams();
    const typeFromUrl = searchParams.get("type") || "all";

    const ACTIVITY_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string; desc: string }> = useMemo(() => ({
        irrigation: { label: t("dbIrrigation"), desc: "پانی دینا", icon: <Droplet className="w-8 h-8" />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
        pesticide_spray: { label: t("dbSpraying"), desc: "اسپرے کرنا", icon: <Zap className="w-8 h-8" />, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
        fertilizer_application: { label: t("dbFertilizing"), desc: "کھاد ڈالنا", icon: <Leaf className="w-8 h-8" />, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
        seed_sowing: { label: t("dbSowing"), desc: "بیج بونا", icon: <Sprout className="w-8 h-8" />, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
        harvest: { label: "Harvest & Sale", desc: "کٹائی اور فروخت", icon: <TrendingUp className="w-8 h-8" />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
        labor: { label: t("dbLabor"), desc: "مزدوری", icon: <Users className="w-8 h-8" />, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
        material_purchase: { label: "Buy Material", desc: "مواد کی خریداری", icon: <ShoppingCart className="w-8 h-8" />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
        expense: { label: "Other Bill / Cost", desc: "دیگر بل / خرچہ", icon: <ArrowDownRight className="w-8 h-8" />, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
        income: { label: "Other Cash In", desc: "دیگر آمدنی", icon: <ArrowUpRight className="w-8 h-8" />, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
    }), [t]);

    // Data
    const [activities, setActivities] = useState<Activity[]>([]);
    const [fields, setFields] = useState<GeoFence[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // Filter
    const [filterType, setFilterType] = useState<string>(typeFromUrl);
    const [exportDate, setExportDate] = useState<string>(new Date().toISOString().split("T")[0]);

    useEffect(() => {
        if (typeFromUrl) setFilterType(typeFromUrl);
    }, [typeFromUrl]);

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form fields
    const [activityType, setActivityType] = useState<Activity["activity_type"]>("expense");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [fieldId, setFieldId] = useState("");
    const [materialId, setMaterialId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [cost, setCost] = useState("");
    const [income, setIncome] = useState("");
    const [harvestUnitPrice, setHarvestUnitPrice] = useState("");
    const [notes, setNotes] = useState("");

    // Custom / Generic activity
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customName, setCustomName] = useState("");
    const [customType, setCustomType] = useState<'expense' | 'income'>('expense');
    const [customAmount, setCustomAmount] = useState("");

    // Labour-specific fields
    const [labourName, setLabourName] = useState("");
    const [labourWorkType, setLabourWorkType] = useState("");
    const [labourCount, setLabourCount] = useState("");
    const [labourRate, setLabourRate] = useState("");
    const [labourDays, setLabourDays] = useState("1");

    // Tractor / Fuel specific fields
    const [isTractorMode, setIsTractorMode] = useState(false);
    const [tractorName, setTractorName] = useState("");
    const [tractorHours, setTractorHours] = useState("");
    const [tractorFuelL, setTractorFuelL] = useState("");
    const [tractorFuelRate, setTractorFuelRate] = useState("");

    // Auto-calculate cost from material price × quantity
    const selectedMaterial = useMemo(() => materials.find(m => m.id === materialId), [materials, materialId]);
    const autoCalcCost = useMemo(() => {
        if (!selectedMaterial || !quantity) return null;
        const pricePerUnit = selectedMaterial.price_per_unit ?? 0;
        if (!pricePerUnit) return null;
        return (Number(quantity) * pricePerUnit).toFixed(2);
    }, [selectedMaterial, quantity]);

    useEffect(() => {
        if (autoCalcCost !== null && ["fertilizer_application", "pesticide_spray", "seed_sowing"].includes(activityType)) {
            setCost(autoCalcCost);
        }
    }, [autoCalcCost, activityType]);

    // Auto-calculate harvest income from yield quantity × unit price
    const autoHarvestIncome = useMemo(() => {
        if (activityType !== "harvest") return null;
        if (!quantity || !harvestUnitPrice) return null;
        const qty = Number(quantity);
        const price = Number(harvestUnitPrice);
        if (!isFinite(qty) || !isFinite(price)) return null;
        if (qty <= 0 || price <= 0) return null;
        return (qty * price).toFixed(2);
    }, [activityType, quantity, harvestUnitPrice]);

    useEffect(() => {
        if (activityType !== "harvest") return;
        if (!quantity || !harvestUnitPrice) {
            setIncome("");
            return;
        }
        if (autoHarvestIncome !== null) {
            setIncome(autoHarvestIncome);
        }
    }, [activityType, quantity, harvestUnitPrice, autoHarvestIncome]);

    // Auto-calculate labour cost: workers × rate × days
    useEffect(() => {
        if (activityType !== "labor") return;
        const workers = Number(labourCount);
        const rate = Number(labourRate);
        const days = Number(labourDays) || 1;
        if (workers > 0 && rate > 0) {
            setCost((workers * rate * days).toFixed(0));
        }
    }, [activityType, labourCount, labourRate, labourDays]);

    // Auto-calculate tractor fuel cost: litres × price/litre
    useEffect(() => {
        if (!isTractorMode) return;
        const litres = Number(tractorFuelL);
        const rate = Number(tractorFuelRate);
        if (litres > 0 && rate > 0) {
            setCost((litres * rate).toFixed(0));
        }
    }, [isTractorMode, tractorFuelL, tractorFuelRate]);

    // ── Fetch ──
    const fetchData = async () => {
        setLoading(true);
        try {
            const [acts, flds, mats] = await Promise.all([
                apiFetch("/api/activities"),
                apiFetch("/api/fields"),
                apiFetch("/api/materials"),
            ]);
            setActivities(Array.isArray(acts) ? acts : []);
            setFields(Array.isArray(flds) ? flds : []);
            setMaterials(Array.isArray(mats) ? mats : []);
        } catch {
            setActivities([]); setFields([]); setMaterials([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ── Toast ──
    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Filtered Materials based on Activity ──
    const relevantMaterials = useMemo(() => {
        if (activityType === "seed_sowing") return materials.filter(m => m.category === "seed");
        if (activityType === "fertilizer_application") return materials.filter(m => m.category === "fertilizer");
        if (activityType === "pesticide_spray") return materials.filter(m => m.category === "pesticide");
        // For buying, show everything
        if (activityType === "material_purchase") return materials;
        // Default (other activities usually don't need materials in the same way)
        return materials;
    }, [materials, activityType]);

    // Filtered list ──
    const filtered = useMemo(() =>
        filterType === "all" ? activities : activities.filter(a => a.activity_type === filterType),
        [activities, filterType]
    );

    // ── Stats ──
    const totalIncome = useMemo(() => activities.reduce((s, a) => s + (a.income || 0), 0), [activities]);
    const totalExpense = useMemo(() => activities.reduce((s, a) => s + (a.cost || 0), 0), [activities]);
    const netProfit = totalIncome - totalExpense;

    // ── Reset form ──
    const resetForm = () => {
        setActivityType("expense"); setDate(new Date().toISOString().split("T")[0]);
        setFieldId(""); setMaterialId(""); setQuantity(""); setCost(""); setIncome(""); setHarvestUnitPrice(""); setNotes("");
        setIsCustomMode(false); setCustomName(""); setCustomType("expense"); setCustomAmount("");
        setLabourName(""); setLabourWorkType(""); setLabourCount(""); setLabourRate(""); setLabourDays("1");
        setIsTractorMode(false); setTractorName(""); setTractorHours(""); setTractorFuelL(""); setTractorFuelRate("");
    };

    // ── Submit ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let payload: Partial<Activity> & Record<string, unknown>;

            if (isCustomMode) {
                // Generic / custom activity
                payload = {
                    activity_type: customType === 'expense' ? 'expense' : 'income',
                    date,
                    notes: `[${customName.trim()}]${notes ? ' ' + notes : ''}`,
                };
                if (customAmount) {
                    if (customType === 'expense') payload.cost = Number(customAmount);
                    else payload.income = Number(customAmount);
                }
            } else if (isTractorMode) {
                // Tractor / Fuel entry
                const tractorDetails = [
                    tractorName.trim() && `[🚜 ${tractorName.trim()}]`,
                    tractorHours && `Hours: ${tractorHours}h`,
                    tractorFuelL && `Fuel: ${tractorFuelL}L`,
                    tractorFuelRate && `@Rs${tractorFuelRate}/L`,
                    notes.trim() && notes.trim(),
                ].filter(Boolean).join(' | ');
                payload = {
                    activity_type: 'expense',
                    date,
                    notes: tractorDetails,
                };
                if (fieldId) payload.field_id = fieldId;
                if (cost) payload.cost = Number(cost);
            } else if (activityType === 'labor') {
                // Labour entry – encode details into notes
                const labourDetails = [
                    labourName.trim() && `Worker: ${labourName.trim()}`,
                    labourWorkType.trim() && `Work: ${labourWorkType.trim()}`,
                    labourCount && `Workers: ${labourCount}`,
                    labourRate && `Rate: Rs${labourRate}/day`,
                    labourDays && Number(labourDays) > 1 && `Days: ${labourDays}`,
                    notes.trim() && notes.trim(),
                ].filter(Boolean).join(' | ');
                payload = {
                    activity_type: 'labor',
                    date,
                    notes: labourDetails,
                };
                if (fieldId) payload.field_id = fieldId;
                if (cost) payload.cost = Number(cost);
            } else {
                payload = {
                    activity_type: activityType,
                    date,
                    notes,
                };
                if (fieldId) payload.field_id = fieldId;
                if (materialId) payload.material_id = materialId;
                if (quantity) payload.quantity_used = Number(quantity);
                if (cost) payload.cost = Number(cost);
                if (income) payload.income = Number(income);
            }

            const res = await apiFetch("/api/activities", { method: "POST", body: JSON.stringify(payload) });
            if (res?.id || res?.activity_type) {
                setOpen(false); resetForm(); fetchData();
                showToast("success", locale === "ur" ? "ریکارڈ کامیابی سے محفوظ ہو گیا!" : "Activity recorded successfully!");
            } else {
                showToast("error", locale === "ur" ? "محفوظ کرنے میں غلطی ہوئی۔" : (res?.error ?? "Failed to save activity."));
            }
        } catch {
            showToast("error", "Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ──
    const handleDelete = async (id: string) => {
        try {
            await apiFetch(`/api/activities/${id}`, { method: "DELETE" });
            setDeleteId(null); fetchData();
            showToast("success", "Activity deleted.");
        } catch {
            showToast("error", "Failed to delete.");
        }
    };

    // ── Which form fields to show ──
    const needsField = ["irrigation", "fertilizer_application", "pesticide_spray", "seed_sowing", "harvest", "labor", "expense"].includes(activityType);
    const needsMaterial = ["fertilizer_application", "pesticide_spray", "seed_sowing", "material_purchase"].includes(activityType);
    const needsQuantity = ["fertilizer_application", "pesticide_spray", "seed_sowing", "material_purchase", "irrigation", "harvest"].includes(activityType);
    const needsCost = ["material_purchase", "labor", "expense", "fertilizer_application", "pesticide_spray", "seed_sowing"].includes(activityType);
    const needsIncome = ["harvest", "income"].includes(activityType);

    // ── Export to Excel ──
    const exportToExcel = () => {
        const targetDate = exportDate;
        const dayActivities = activities.filter(a => {
            const actDate = (a.date || "").split("T")[0];
            return actDate === targetDate;
        });

        if (dayActivities.length === 0) {
            showToast("error", locale === "ur" ? `${targetDate} کے لیے کوئی ریکارڈ نہیں ملا` : `No activities found for ${targetDate}`);
            return;
        }

        const rows = dayActivities.map(act => {
            const meta = ACTIVITY_META[act.activity_type];
            const field = fields.find(f => f.id === act.field_id);
            const mat = materials.find(m => m.id === act.material_id);
            const customName = extractCustomName(act.notes);
            const cleanNotes = customName ? stripCustomName(act.notes) : (act.notes || "");
            const baseTypeName = locale === "ur" ? (meta?.desc || meta?.label || act.activity_type) : (meta?.label || act.activity_type);
            const typeName = customName || baseTypeName;

            return {
                "Date": (act.date || "").split("T")[0],
                "Type / قسم": typeName,
                "Field / کھیت": field?.name || "-",
                "Material / مواد": mat ? `${mat.name}${act.quantity_used ? ` × ${act.quantity_used}` : ""}` : "-",
                "Income / آمدنی (Rs)": act.income ?? 0,
                "Expense / خرچہ (Rs)": act.cost ?? 0,
                "Notes / نوٹس": cleanNotes || "-",
            };
        });

        const totalInc = dayActivities.reduce((s, a) => s + (a.income || 0), 0);
        const totalExp = dayActivities.reduce((s, a) => s + (a.cost || 0), 0);

        // Add summary row
        rows.push({
            "Date": "",
            "Type / قسم": "TOTAL",
            "Field / کھیت": "",
            "Material / مواد": "",
            "Income / آمدنی (Rs)": totalInc,
            "Expense / خرچہ (Rs)": totalExp,
            "Notes / نوٹس": `Net: Rs ${(totalInc - totalExp).toLocaleString()}`,
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        // Column widths
        ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 30 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Activities ${targetDate}`);
        XLSX.writeFile(wb, `Farm-Register-${targetDate}.xlsx`);
        showToast("success", locale === "ur" ? "فائل ڈاؤن لوڈ ہو رہی ہے" : `Exported ${dayActivities.length} records for ${targetDate}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-green-500" />
                </div>
                <p className="text-theme-muted text-sm">Loading activities...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-theme">
            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium animate-fade-in
          ${toast.type === "success"
                        ? "bg-green-500/95 text-white border-green-400"
                        : "bg-red-500/95 text-white border-red-400"}`}>
                    {toast.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {toast.msg}
                </div>
            )}

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-theme tracking-tight uppercase">Register</h1>
                        </div>
                        <p className="text-xs sm:text-sm text-theme-muted ml-[52px]">Daily Record • کھاتہ</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-theme-track p-1 rounded-xl border border-theme">
                            <button
                                onClick={() => setLocale("ur")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${locale === "ur" ? "bg-green-500 text-white shadow-md shadow-green-500/20" : "text-theme-muted hover:text-theme"}`}
                            >اردو</button>
                            <button
                                onClick={() => setLocale("en")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${locale === "en" ? "bg-green-500 text-white shadow-md shadow-green-500/20" : "text-theme-muted hover:text-theme"}`}
                            >ENGLISH</button>
                        </div>
                        <button
                            onClick={() => { resetForm(); setOpen(true); }}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-2xl font-black shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-6 h-6" /> {locale === "ur" ? "نیا ریکارڈ" : "NEW RECORD"}
                        </button>
                    </div>
                </div>

                {/* Stats: hidden for Data Entry users */}
                {!isDataEntry && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <StatCard
                                label={t("totalIncome")}
                                value={`Rs ${totalIncome.toLocaleString()}`}
                                icon={<ArrowUpRight className="w-5 h-5 text-white" />}
                                gradient="bg-gradient-to-br from-emerald-600 to-green-700 border-emerald-500/50"
                                textColor="text-white"
                            />
                        </div>
                        <div>
                            <StatCard
                                label={t("totalInvestment")}
                                value={`Rs ${totalExpense.toLocaleString()}`}
                                icon={<ArrowDownRight className="w-5 h-5 text-white" />}
                                gradient="bg-gradient-to-br from-rose-600 to-red-700 border-rose-500/50"
                                textColor="text-white"
                            />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-1">
                            <StatCard
                                label={t("netProfit")}
                                value={`Rs ${netProfit.toLocaleString()}`}
                                icon={<DollarSign className="w-5 h-5 text-white" />}
                                gradient={netProfit >= 0
                                    ? "bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500/50"
                                    : "bg-gradient-to-br from-orange-600 to-red-700 border-orange-500/50"}
                                textColor="text-white"
                            />
                        </div>
                    </div>
                )}

                {/* ── Activity Log Table ── */}
                <div className="rounded-2xl border border-theme bg-theme-card shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="px-4 sm:px-6 py-4 border-b border-theme space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h2 className="text-base font-bold text-theme flex items-center gap-2">
                                <FileText className="w-4 h-4 text-theme-muted shrink-0" /> Activity Log
                                <span className="px-2 py-0.5 rounded-full bg-theme-track border border-theme text-xs text-theme-muted font-medium">{activities.length}</span>
                            </h2>
                        </div>

                        {/* Daily Export Row */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex items-center gap-2 flex-1 bg-theme-track border border-theme rounded-xl px-3 py-2">
                                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                                <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest shrink-0">
                                    {locale === "ur" ? "تاریخ" : "Day"}
                                </label>
                                <input
                                    type="date"
                                    value={exportDate}
                                    onChange={e => setExportDate(e.target.value)}
                                    className="flex-1 bg-transparent text-theme text-sm font-bold focus:outline-none min-w-0"
                                />
                            </div>
                            <button
                                onClick={exportToExcel}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-5 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all whitespace-nowrap"
                            >
                                <Download className="w-4 h-4" />
                                {locale === "ur" ? "ڈاؤن لوڈ Excel" : "Download Excel"}
                            </button>
                        </div>

                        {/* Filter */}
                        <div className="relative w-full min-w-0">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none shrink-0" />
                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                className="w-full min-w-0 pl-10 pr-10 py-3 text-sm rounded-xl bg-theme-track border border-theme text-theme appearance-none focus:ring-2 focus:ring-green-500 focus:outline-none"
                            >
                                <option value="all">{locale === "ur" ? "تمام ریکارڈ" : "All Types"}</option>
                                {Object.entries(ACTIVITY_META)
                                    .filter(([k]) => k !== "material_purchase")
                                    .map(([k, v]) => (
                                        <option key={k} value={k}>{locale === "ur" ? v.desc : v.label}</option>
                                    ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <EmptyState onAdd={() => { resetForm(); setOpen(true); }} />
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-theme bg-theme-track/40 text-xs text-theme-muted uppercase tracking-wider">
                                            <th className="px-6 py-3 text-left font-semibold">{t("dbActivity")}</th>
                                            <th className="px-4 py-3 text-left font-semibold">{t("date")}</th>
                                            <th className="px-4 py-3 text-left font-semibold">{locale === "ur" ? "کھیت" : t("field")}</th>
                                            <th className="px-4 py-3 text-left font-semibold">{locale === "ur" ? "مواد / مقدار" : "Material / Qty"}</th>
                                            <th className="px-4 py-3 text-right font-semibold">{t("purchaseShort")}</th>
                                            <th className="px-4 py-3 text-right font-semibold">{t("saleShort")}</th>
                                            <th className="px-4 py-3 text-left font-semibold">{t("dbNotes")}</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-theme">
                                        {filtered.map(act => {
                                            const field = fields.find(f => f.id === act.field_id);
                                            const mat = materials.find(m => m.id === act.material_id);
                                            const customName = extractCustomName(act.notes);
                                            const cleanNotes = customName ? stripCustomName(act.notes) : (act.notes || "");
                                            return (
                                                <tr key={act.id} className="hover:bg-theme-track/30 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <ActivityBadge
                                                            type={act.activity_type}
                                                            meta={ACTIVITY_META[act.activity_type]}
                                                            labelOverride={customName || undefined}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-theme-muted text-xs">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {act.date?.split("T")[0]}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-theme text-xs font-medium">
                                                        {field?.name ?? <span className="text-theme-muted">—</span>}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs">
                                                        {mat ? (
                                                            <span className="flex items-center gap-1 text-theme">
                                                                <Package className="w-3.5 h-3.5 text-theme-muted" />
                                                                {mat.name} {act.quantity_used ? `× ${act.quantity_used}` : ""}
                                                            </span>
                                                        ) : act.quantity_used ? (
                                                            <span className="text-theme-muted">{act.quantity_used}</span>
                                                        ) : <span className="text-theme-muted">—</span>}
                                                    </td>
                                                    <td className="px-4 py-4 text-right whitespace-nowrap">
                                                        {(act.cost ?? 0) > 0
                                                            ? <span className="text-rose-400 font-semibold">- Rs {(act.cost ?? 0).toLocaleString()}</span>
                                                            : <span className="text-theme-muted">—</span>}
                                                    </td>
                                                    <td className="px-4 py-4 text-right whitespace-nowrap">
                                                        {(act.income ?? 0) > 0
                                                            ? <span className="text-emerald-400 font-semibold">+ Rs {(act.income ?? 0).toLocaleString()}</span>
                                                            : <span className="text-theme-muted">—</span>}
                                                    </td>
                                                    <td className="px-4 py-4 max-w-[180px]">
                                                        <p className="text-theme-muted text-xs truncate">{cleanNotes || "—"}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <button
                                                            onClick={() => setDeleteId(act.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards - App-like experience */}
                            <div className="md:hidden divide-y divide-theme">
                                {filtered.map(act => {
                                    const field = fields.find(f => f.id === act.field_id);
                                    const mat = materials.find(m => m.id === act.material_id);
                                    const meta = ACTIVITY_META[act.activity_type];
                                    const customName = extractCustomName(act.notes);
                                    const cleanNotes = customName ? stripCustomName(act.notes) : (act.notes || "");
                                    return (
                                        <div key={act.id} className="p-4 space-y-3 active:bg-theme-track/50 transition-colors">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl ${meta?.bg || "bg-theme-track"} border ${meta?.border || "border-theme"}`}>
                                                        {meta?.icon || <FileText className="w-4 h-4 text-theme-muted" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-theme leading-tight">
                                                            {customName || (locale === "ur" ? (meta?.desc || meta?.label || act.activity_type) : (meta?.label || act.activity_type))}
                                                        </h4>
                                                        <p className="text-[10px] text-theme-muted mt-0.5">{act.date?.split("T")[0]}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    {(act.income ?? 0) > 0 && <p className="text-sm font-bold text-green-400">+Rs {(act.income ?? 0).toLocaleString()}</p>}
                                                    {(act.cost ?? 0) > 0 && <p className="text-sm font-bold text-red-400">-Rs {(act.cost ?? 0).toLocaleString()}</p>}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                {field && (
                                                    <div className="flex items-center gap-1.5 text-xs text-theme-muted">
                                                        <MapIcon className="w-3.5 h-3.5 text-green-500/70" />
                                                        <span className="font-semibold text-theme">{field.name}</span>
                                                    </div>
                                                )}
                                                {mat && (
                                                    <div className="flex items-center gap-1.5 text-xs text-theme-muted">
                                                        <Package className="w-3.5 h-3.5 text-blue-500/70" />
                                                        <span className="text-theme font-medium">{mat.name} {act.quantity_used ? `× ${act.quantity_used}` : ""}</span>
                                                    </div>
                                                )}
                                                {!mat && act.quantity_used && (
                                                    <div className="flex items-center gap-1.5 text-xs text-theme-muted">
                                                        <BarChart3 className="w-3.5 h-3.5 text-theme-muted" />
                                                        <span className="text-theme font-medium">{act.quantity_used} units</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex-1">
                                                    {cleanNotes && (
                                                        <p className="text-[11px] text-theme-muted italic line-clamp-2">
                                                            "{cleanNotes}"
                                                        </p>
                                                    )}
                                                </div>
                                                <button onClick={() => setDeleteId(act.id)} className="ml-3 p-2.5 rounded-xl text-theme-muted hover:text-red-500 hover:bg-red-500/10 active:bg-theme-track transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* ══════════════ NEW ACTIVITY MODAL ══════════════ */}
                {open && (
                    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                        <div className="relative z-10 w-full sm:max-w-lg bg-theme-card rounded-t-3xl sm:rounded-2xl shadow-2xl border border-theme flex flex-col max-h-[92vh]">

                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-theme shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                        <Plus className="w-4 h-4 text-green-500" />
                                    </div>
                                    <h2 className="text-lg font-bold text-theme">Record Activity</h2>
                                </div>
                                <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-theme-track text-theme-muted transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                                {/* Activity Type - BIG BUTTONS */}
                                <div className="space-y-4">
                                    <label className="block text-xs font-black text-theme-muted uppercase tracking-widest text-center">
                                        {locale === "ur" ? "کیا کام ہوا؟" : "What activity happened?"}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(ACTIVITY_META)
                                            .filter(([k]) => k !== "material_purchase")
                                            .map(([k, v]) => (
                                                <button
                                                    key={k} type="button"
                                                    onClick={() => {
                                                        setIsCustomMode(false);
                                                        setIsTractorMode(false);
                                                        setActivityType(k as Activity["activity_type"]);
                                                        setMaterialId(""); setQuantity(""); setCost(""); setIncome(""); setHarvestUnitPrice("");
                                                    }}
                                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[2rem] border-2 transition-all duration-300
                                                ${!isCustomMode && !isTractorMode && activityType === k
                                                            ? `bg-green-500 border-green-400 text-white shadow-xl shadow-green-500/30 scale-105`
                                                            : "bg-theme-track border-theme text-theme-muted hover:border-theme-muted active:scale-95"}`}
                                                >
                                                    <span className={!isCustomMode && !isTractorMode && activityType === k ? "text-white" : v.color}>{v.icon}</span>
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-black uppercase text-center leading-tight">
                                                            {locale === "ur" ? v.desc : v.label}
                                                        </span>
                                                        {locale !== "ur" && (
                                                            <span className="text-[10px] font-bold opacity-60">{v.desc}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}

                                        {/* ── TRACTOR / FUEL BUTTON ── */}
                                        <button
                                            type="button"
                                            onClick={() => { setIsTractorMode(true); setIsCustomMode(false); setCost(""); setTractorFuelL(""); setTractorFuelRate(""); }}
                                            className={`col-span-2 flex items-center justify-center gap-3 p-4 rounded-[2rem] border-2 transition-all duration-300
                                                ${isTractorMode
                                                    ? "bg-teal-500 border-teal-400 text-white shadow-xl shadow-teal-500/30 scale-[1.02]"
                                                    : "bg-theme-track border-dashed border-theme text-theme-muted hover:border-teal-500/50 hover:text-teal-400 active:scale-95"}`}
                                        >
                                            <Truck className={`w-6 h-6 ${isTractorMode ? 'text-white' : 'text-teal-400'}`} />
                                            <div className="text-left">
                                                <p className="text-xs font-black uppercase">{locale === "ur" ? "ٹریکٹر / ایندھن" : "Tractor / Fuel Entry"}</p>
                                                <p className="text-[10px] opacity-60">{locale === "ur" ? "کونسا ٹریکٹر، کتنا ایندھن..." : "Which tractor, how much fuel..."}</p>
                                            </div>
                                        </button>

                                        {/* ── MORE / CUSTOM ACTIVITY BUTTON ── */}
                                        <button
                                            type="button"
                                            onClick={() => { setIsCustomMode(true); setIsTractorMode(false); setCustomName(""); setCustomAmount(""); setCustomType("expense"); }}
                                            className={`col-span-2 flex items-center justify-center gap-3 p-4 rounded-[2rem] border-2 transition-all duration-300
                                                ${isCustomMode
                                                    ? "bg-purple-500 border-purple-400 text-white shadow-xl shadow-purple-500/30 scale-[1.02]"
                                                    : "bg-theme-track border-dashed border-theme text-theme-muted hover:border-purple-500/50 hover:text-purple-400 active:scale-95"}`}
                                        >
                                            <Plus className={`w-6 h-6 ${isCustomMode ? 'text-white' : 'text-purple-400'}`} />
                                            <div className="text-left">
                                                <p className="text-xs font-black uppercase">{locale === "ur" ? "کوئی بھی کام" : "More / Custom Entry"}</p>
                                                <p className="text-[10px] opacity-60">{locale === "ur" ? "اپنا نام لکھیں" : "Rent, Transport, Other..."}</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-theme border-dashed border-t" />

                                {/* ── TRACTOR FORM ── */}
                                {isTractorMode && (
                                    <div className="p-4 rounded-3xl bg-teal-500/5 border border-teal-500/15 space-y-4 animate-in fade-in duration-300">
                                        <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Truck className="w-3.5 h-3.5" />
                                            {locale === 'ur' ? 'ٹریکٹر و ایندھن تفصیل' : 'Tractor & Fuel Details'}
                                        </p>

                                        {/* Tractor Name */}
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                {locale === 'ur' ? 'ٹریکٹر کا نام / نمبر' : 'Tractor Name / Number'}
                                            </label>
                                            <input type="text" value={tractorName} onChange={e => setTractorName(e.target.value)}
                                                placeholder={locale === 'ur' ? 'مثلاً: ٹریکٹر A, PB-123...' : 'e.g. Tractor A, Old Massey, PB-123...'}
                                                required
                                                className="w-full px-4 py-3.5 rounded-2xl bg-theme-track border border-teal-500/20 text-theme text-sm font-bold focus:ring-2 focus:ring-teal-500/20 focus:outline-none" />
                                        </div>

                                        {/* Field */}
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                {locale === 'ur' ? 'کونسے کھیت میں؟' : 'Which Field?'}
                                            </label>
                                            <select value={fieldId} onChange={e => setFieldId(e.target.value)}
                                                className="w-full px-4 py-4 rounded-2xl bg-theme-track border border-teal-500/20 text-theme text-sm font-bold focus:outline-none">
                                                <option value="">{locale === 'ur' ? 'کھیت منتخب کریں' : 'Select field (optional)'}</option>
                                                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">{locale === 'ur' ? 'تاریخ' : 'Date'}</label>
                                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                                                className="w-full px-4 py-4 rounded-2xl bg-theme-track border border-teal-500/20 text-theme text-sm font-bold focus:outline-none" />
                                        </div>

                                        {/* Hours & Fuel */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                    {locale === 'ur' ? 'گھنٹے' : 'Hours Run'}
                                                </label>
                                                <input type="number" min="0" step="0.5" value={tractorHours}
                                                    onChange={e => setTractorHours(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-teal-500/20 text-theme text-sm font-black text-center focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                    {locale === 'ur' ? 'ایندھن (L)' : 'Fuel (Litres)'}
                                                </label>
                                                <input type="number" min="0" step="any" value={tractorFuelL}
                                                    onChange={e => setTractorFuelL(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-teal-500/20 text-theme text-sm font-black text-center focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                    {locale === 'ur' ? 'Rs/لیٹر' : 'Rs/Litre'}
                                                </label>
                                                <input type="number" min="0" step="any" value={tractorFuelRate}
                                                    onChange={e => setTractorFuelRate(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-teal-500/20 text-theme text-sm font-black text-center focus:outline-none" />
                                            </div>
                                        </div>

                                        {/* Auto fuel cost */}
                                        {tractorFuelL && tractorFuelRate && (
                                            <div className="flex items-center justify-between bg-teal-500/10 border border-teal-500/20 rounded-2xl px-4 py-3">
                                                <span className="text-xs font-black text-teal-400 uppercase flex items-center gap-1.5">
                                                    <Fuel className="w-3.5 h-3.5" />
                                                    {locale === 'ur' ? 'کل ایندھن لاگت (خودکار)' : 'Total Fuel Cost (Auto)'}
                                                </span>
                                                <span className="text-lg font-black text-teal-400">
                                                    Rs {(Number(tractorFuelL) * Number(tractorFuelRate)).toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">Notes / یاد دہانی</label>
                                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                                placeholder="..."
                                                className="w-full px-4 py-4 rounded-2xl bg-theme-track border border-teal-500/20 text-theme text-sm font-bold resize-none focus:outline-none" />
                                        </div>
                                    </div>
                                )}
                                {/* ── CUSTOM ACTIVITY FORM ── */}
                                {isCustomMode && (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* Activity Name */}
                                        <div>
                                            <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 px-1">
                                                {locale === "ur" ? "کام کا نام" : "Activity Name (e.g. Tractor Expense)"}
                                            </label>
                                            <input
                                                type="text"
                                                value={customName}
                                                onChange={e => setCustomName(e.target.value)}
                                                placeholder={locale === "ur" ? "مثلاً: ٹریکٹر خرچہ، کرایہ..." : "e.g. Tractor Expense, Rent, Transport..."}
                                                required
                                                className="w-full px-5 py-4 rounded-2xl bg-theme-track border border-purple-500/30 text-theme text-sm font-bold focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
                                            />
                                        </div>

                                        {/* Expense or Income Toggle */}
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-3 px-1">
                                                {locale === "ur" ? "پیسے ملے یا گئے؟" : "Is this Money In or Money Out?"}
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button type="button" onClick={() => setCustomType('expense')}
                                                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 font-black text-sm transition-all
                                                        ${customType === 'expense' ? 'bg-red-500 text-white border-red-400 shadow-lg' : 'bg-theme-track border-theme text-theme-muted'}`}>
                                                    <ArrowDownRight className="w-5 h-5" />
                                                    {locale === "ur" ? "خرچہ" : "Expense"}
                                                </button>
                                                <button type="button" onClick={() => setCustomType('income')}
                                                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 font-black text-sm transition-all
                                                        ${customType === 'income' ? 'bg-green-500 text-white border-green-400 shadow-lg' : 'bg-theme-track border-theme text-theme-muted'}`}>
                                                    <ArrowUpRight className="w-5 h-5" />
                                                    {locale === "ur" ? "آمدنی" : "Income"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 px-1 ${customType === 'expense' ? 'text-red-400' : 'text-green-400'}`}>
                                                {locale === "ur" ? "رقم (روپے)" : `Amount (Rs)`}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-theme-muted text-lg font-black opacity-30">Rs</span>
                                                <input
                                                    type="number" min="0" step="any"
                                                    value={customAmount}
                                                    onChange={e => setCustomAmount(e.target.value)}
                                                    required placeholder="0"
                                                    className={`w-full pl-16 pr-6 py-6 rounded-[2rem] bg-theme-track border-2 text-theme text-2xl font-black focus:ring-4 focus:outline-none transition-all
                                                        ${customType === 'expense' ? 'border-red-500/30 focus:ring-red-500/10' : 'border-green-500/30 focus:ring-green-500/10'}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Date for custom */}
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">{locale === "ur" ? "تاریخ" : "Date"}</label>
                                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                                                className="w-full px-4 py-4 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold focus:outline-none" />
                                        </div>

                                        {/* Notes for custom */}
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">Notes / یاد دہانی</label>
                                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                                placeholder="..."
                                                className="w-full px-4 py-4 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold resize-none focus:outline-none" />
                                        </div>
                                    </div>
                                )}

                                {/* Date & Field Pair (only for non-custom) */}
                                {!isCustomMode && <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                            {locale === "ur" ? "تاریخ" : "Date"}
                                        </label>
                                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                                            className="w-full px-4 py-4 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold focus:ring-4 focus:ring-green-500/10 focus:outline-none" />
                                    </div>
                                    {needsField && (
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                {locale === "ur" ? "کون سا کھیت؟" : "Select Field"}
                                            </label>
                                            <select value={fieldId} onChange={e => setFieldId(e.target.value)}
                                                required={activityType !== "expense" && activityType !== "income"}
                                                className="w-full px-4 py-4 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold focus:ring-4 focus:ring-green-500/10 focus:outline-none">
                                                <option value="">{locale === "ur" ? "کھیت منتخب کریں" : "Select..."}</option>
                                                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* ── LABOUR DETAIL FORM ── */}
                                {!isCustomMode && activityType === 'labor' && (
                                    <div className="p-4 rounded-3xl bg-orange-500/5 border border-orange-500/15 space-y-4 animate-in fade-in duration-300">
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            {locale === 'ur' ? 'مزدور کی تفصیل' : 'Labour Details'}
                                        </p>

                                        {/* Labour Name */}
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                {locale === 'ur' ? 'مزدور کا نام' : 'Worker Name'}
                                            </label>
                                            <input
                                                type="text"
                                                value={labourName}
                                                onChange={e => setLabourName(e.target.value)}
                                                placeholder={locale === 'ur' ? 'مثلاً: محمد علی' : 'e.g. Ahmed, Ali...'}
                                                className="w-full px-4 py-3.5 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-bold focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                                            />
                                        </div>

                                        {/* Work Type */}
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                {locale === 'ur' ? 'کام کی قسم' : 'Type of Work'}
                                            </label>
                                            <input
                                                type="text"
                                                value={labourWorkType}
                                                onChange={e => setLabourWorkType(e.target.value)}
                                                placeholder={locale === 'ur' ? 'مثلاً: ہل چلانا، فصل کاٹنا...' : 'e.g. Ploughing, Harvesting, Weeding...'}
                                                className="w-full px-4 py-3.5 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-bold focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                                            />
                                        </div>

                                        {/* Workers × Rate × Days */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                    {locale === 'ur' ? 'تعداد' : 'Workers'}
                                                </label>
                                                <input
                                                    type="number" min="1" step="1"
                                                    value={labourCount}
                                                    onChange={e => setLabourCount(e.target.value)}
                                                    placeholder="1"
                                                    className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-black text-center focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                    {locale === 'ur' ? 'روز کی اجرت' : 'Rate/Day (Rs)'}
                                                </label>
                                                <input
                                                    type="number" min="0" step="any"
                                                    value={labourRate}
                                                    onChange={e => setLabourRate(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-black text-center focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                    {locale === 'ur' ? 'دن' : 'Days'}
                                                </label>
                                                <input
                                                    type="number" min="1" step="1"
                                                    value={labourDays}
                                                    onChange={e => setLabourDays(e.target.value)}
                                                    placeholder="1"
                                                    className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-black text-center focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Auto total banner */}
                                        {labourCount && labourRate && (
                                            <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3">
                                                <span className="text-xs font-black text-orange-400 uppercase">
                                                    {locale === 'ur' ? 'کل ادائیگی (خودکار)' : 'Total Pay (Auto)'}
                                                </span>
                                                <span className="text-lg font-black text-orange-400">
                                                    Rs {(Number(labourCount) * Number(labourRate) * (Number(labourDays) || 1)).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Material - SMART FILTERED */}
                                {needsMaterial && (
                                    <div className="p-4 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 px-1">
                                                {activityType === "seed_sowing" ? (locale === "ur" ? "کون سا بیج؟" : "Which Seed?") :
                                                    activityType === "fertilizer_application" ? (locale === "ur" ? "کون سی کھاد؟" : "Which Fertilizer?") :
                                                        activityType === "pesticide_spray" ? (locale === "ur" ? "کون سا اسپرے؟" : "Which Spray?") :
                                                            (locale === "ur" ? "کیا مواد استعمال کیا؟" : "Which Material?")}
                                            </label>
                                            {relevantMaterials.length === 0 ? (
                                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[10px] font-bold text-amber-600">
                                                    {locale === "ur" ? "اس کام کے لیے اسٹاک میں کوئی چیز نہیں ہے۔" : "No items in stock for this activity."}
                                                </div>
                                            ) : (
                                                <select value={materialId} onChange={e => { setMaterialId(e.target.value); setQuantity(""); setCost(""); }}
                                                    required
                                                    className="w-full px-4 py-4 rounded-2xl bg-theme-track border border-blue-500/20 text-theme text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                                    <option value="">{locale === "ur" ? "منتخب کریں..." : "Select..."}</option>
                                                    {relevantMaterials.map(m => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.name} ({m.stock_quantity || 0} {m.unit})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        {selectedMaterial && (
                                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-500/70 bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                                                <Package className="w-3 h-3" />
                                                {locale === "ur" ? "اسٹاک میں موجود" : "CURRENT STOCK"}: {selectedMaterial.stock_quantity ?? 0} {selectedMaterial.unit}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Quantity & Costs Big Inputs */}
                                <div className="space-y-4">
                                    {needsQuantity && (
                                        <div>
                                            <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                {activityType === "irrigation" ? (locale === "ur" ? "کتنے منٹ؟ (پانی)" : "Minutes of Water") :
                                                    activityType === "harvest" ? (locale === "ur" ? "کتنی کٹائی ہوئی؟ (کلو)" : "Yield (kg)") :
                                                        (locale === "ur" ? `کتنی مقدار؟ (${selectedMaterial?.unit || 'یونٹ'})` : "Total Quantity")}
                                            </label>
                                            <input type="number" min="0" step="any" value={quantity}
                                                onChange={e => setQuantity(e.target.value)}
                                                required={activityType !== "irrigation"}
                                                placeholder="0.00"
                                                className="w-full px-6 py-6 rounded-[2rem] bg-theme-track border-2 border-theme text-theme text-2xl font-black placeholder:opacity-20 focus:ring-4 focus:ring-green-500/10 focus:outline-none transition-all" />
                                        </div>
                                    )}

                                    {needsCost && (
                                        <div className="animate-in fade-in duration-500">
                                            <label className="block text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 px-1">
                                                {locale === "ur" ? "کل خرچہ (روپے)" : "Total Cost (Money Out)"}
                                                {autoCalcCost && needsMaterial && <span className="ml-2 font-black text-amber-500 italic uppercase">Auto</span>}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-theme-muted text-lg font-black opacity-30">Rs</span>
                                                <input type="number" min="0" step="any" value={cost}
                                                    onChange={e => setCost(e.target.value)}
                                                    required
                                                    placeholder="0"
                                                    className={`w-full pl-16 pr-6 py-6 rounded-[2rem] bg-theme-track border-2 text-theme text-2xl font-black focus:ring-4 focus:ring-red-500/10 focus:outline-none transition-all
                                                  ${autoCalcCost && needsMaterial ? "border-amber-500 bg-amber-500/5" : "border-theme"}`} />
                                            </div>
                                        </div>
                                    )}

                                    {needsIncome && (
                                        <div className="space-y-4 animate-in fade-in duration-500">
                                            {activityType === "harvest" && (
                                                <div>
                                                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                                        {locale === "ur" ? "ریٹ (روپے فی یونٹ)" : "Per Unit Price (Rate)"}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        value={harvestUnitPrice}
                                                        onChange={e => setHarvestUnitPrice(e.target.value)}
                                                        placeholder="Rate"
                                                        className="w-full px-6 py-4 rounded-2xl bg-theme-track border border-theme text-theme text-lg font-black focus:outline-none"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-[10px] font-black text-green-500 uppercase tracking-widest mb-2 px-1">
                                                    {locale === "ur" ? "کل آمدنی (فروخت)" : "Total Sale Amount (Money In)"}
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-theme-muted text-lg font-black opacity-30">Rs</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        value={income}
                                                        onChange={e => setIncome(e.target.value)}
                                                        required
                                                        placeholder="0"
                                                        className="w-full pl-16 pr-6 py-6 rounded-[2rem] bg-theme-track border-2 border-green-500/30 text-theme text-2xl font-black focus:ring-4 focus:ring-green-500/10 focus:outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">Notes / یاد دہانی</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                        placeholder="..."
                                        className="w-full px-4 py-4 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold resize-none focus:outline-none" />
                                </div>
                                </>}

                                {/* Submit - HUGE SAVE BUTTON */}
                                <div className="flex gap-4 pt-4 pb-8">
                                    <button type="submit" disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-green-500/40 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale">
                                        {saving ? <><Loader2 className="w-6 h-6 animate-spin text-white" /> SAVING...</> : <><CheckCircle className="w-8 h-8" /> {locale === "ur" ? "محفوظ کریں" : "SAVE"}</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ══════════════ DELETE CONFIRM MODAL ══════════════ */}
                {
                    deleteId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                            <div className="relative z-10 bg-theme-card border border-theme rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-6 h-6 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-theme text-center mb-2">Delete Activity?</h3>
                                <p className="text-theme-muted text-sm text-center mb-6">This will also revert any stock quantity changes associated with this activity.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => deleteId && handleDelete(deleteId)}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold transition-colors">
                                        Yes, Delete
                                    </button>
                                    <button onClick={() => setDeleteId(null)}
                                        className="flex-1 bg-theme-track border border-theme text-theme-muted hover:text-theme py-2.5 rounded-xl font-semibold transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
            {/* Padding for BottomNav on mobile */}
            <div className="h-20 md:hidden" />
        </div>
    );
}

export default function ActivitiesPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
                <p className="text-theme-muted">Loading activities...</p>
            </div>
        }>
            <ActivitiesContent />
        </Suspense>
    );
}
