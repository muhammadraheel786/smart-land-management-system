"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import {
    Users, Plus, Loader2, Search, Building2, MapPin, CheckCircle,
    AlertCircle, Briefcase, Calendar, DollarSign, ArrowUpRight,
    ArrowDownRight, MoreVertical, X, Info, Download, Trash2, ShieldCheck, Mail, FileText, Printer, ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
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

function LaborContent() {
    const { t, locale, setLocale } = useLocale();

    // Data
    const [activities, setActivities] = useState<any[]>([]); // Using 'any' since we only care about labor specific structure inside notes
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    // Modal
    const [openAdd, setOpenAdd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form Variables
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [labourName, setLabourName] = useState("");
    const [labourWorkType, setLabourWorkType] = useState("");
    const [labourCount, setLabourCount] = useState("");
    const [labourRate, setLabourRate] = useState("");
    const [labourDays, setLabourDays] = useState("1");
    const [labourStartDate, setLabourStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [labourEndDate, setLabourEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [labourStatus, setLabourStatus] = useState("Paid");
    const [notes, setNotes] = useState("");

    // Read Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const acts = await apiFetch("/api/activities");
            if (Array.isArray(acts)) {
                setActivities(acts.filter(a => a.activity_type === 'labor'));
            }
        } catch {
            setActivities([]);
            showToast("error", "Failed to load labor data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    // Calculate Unique Workers and their Stats
    const workerStats = useMemo(() => {
        const stats: Record<string, { totalPaid: number, totalUnpaid: number, lastWorked: string, name: string, events: any[] }> = {};
        
        activities.forEach(a => {
            if (!a.notes) return;
            const nameMatch = a.notes.match(/Worker:\s*([^|]+)/);
            if (!nameMatch) return;
            const name = nameMatch[1].trim();

            if (!stats[name]) {
                stats[name] = { totalPaid: 0, totalUnpaid: 0, lastWorked: "", name, events: [] };
            }

            stats[name].events.push(a);

            const isUnpaid = a.notes.includes('Status: Unpaid');
            if (isUnpaid) {
                stats[name].totalUnpaid += (a.cost || 0);
            } else {
                stats[name].totalPaid += (a.cost || 0);
            }

            const aDate = a.date?.split("T")[0];
            if (!stats[name].lastWorked || aDate > stats[name].lastWorked) {
                stats[name].lastWorked = aDate;
            }
        });

        // Ensure events are sorted by date
        Object.values(stats).forEach(stat => {
            stat.events.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        });

        // Sort workers alphabetically
        return Object.values(stats).sort((a, b) => a.name.localeCompare(b.name));
    }, [activities]);

    const uniqueWorkerNames = useMemo(() => workerStats.map(w => w.name), [workerStats]);

    // Active worker for detailed modal
    const [activeWorkerInfo, setActiveWorkerInfo] = useState<any | null>(null);

    // Slip Generation State
    const [openSlip, setOpenSlip] = useState(false);
    const [slipWorker, setSlipWorker] = useState<any | null>(null);
    const [slipMonth, setSlipMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [slipStartDate, setSlipStartDate] = useState("");
    const [slipEndDate, setSlipEndDate] = useState("");
    const [slipMode, setSlipMode] = useState<"monthly" | "range">("monthly");

    // Helpers
    const resetForm = () => {
        setDate(new Date().toISOString().split("T")[0]);
        setLabourName(""); setLabourWorkType(""); setLabourCount(""); setLabourRate(""); setLabourDays("1");
        setLabourStartDate(new Date().toISOString().split("T")[0]); setLabourEndDate(new Date().toISOString().split("T")[0]); setLabourStatus("Paid");
        setNotes("");
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const labourDetails = [
                labourName.trim() && `Worker: ${labourName.trim()}`,
                labourWorkType.trim() && `Work: ${labourWorkType.trim()}`,
                labourCount && `Workers: ${labourCount}`,
                labourRate && `Rate: Rs${labourRate}/day`,
                labourDays && Number(labourDays) > 1 && `Days: ${labourDays}`,
                (labourStartDate && labourEndDate) ? `Period: ${labourStartDate} to ${labourEndDate}` : '',
                labourStatus && `Status: ${labourStatus}`,
                notes.trim() && notes.trim(),
            ].filter(Boolean).join(' | ');

            const workers = Number(labourCount) || 0;
            const rate = Number(labourRate) || 0;
            const days = Number(labourDays) || 1;
            const totalCost = workers * rate * days;

            const payload = {
                activity_type: 'labor',
                date,
                notes: labourDetails,
                cost: totalCost
            };

            const res = await apiFetch("/api/activities", { method: "POST", body: JSON.stringify(payload) });
            if (res?.id || res?.activity_type) {
                setOpenAdd(false); resetForm(); fetchData();
                showToast("success", locale === "ur" ? "ریکارڈ کامیابی سے محفوظ ہو گیا!" : "Labor recorded successfully!");
            } else {
                showToast("error", locale === "ur" ? "محفوظ کرنے میں غلطی ہوئی۔" : "Failed to save labor activity.");
            }
        } catch {
            showToast("error", "Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await apiFetch(`/api/activities/${id}`, { method: "DELETE" });
            setDeleteId(null); 
            setActiveWorkerInfo(null);
            fetchData();
            showToast("success", "Activity deleted.");
        } catch {
            showToast("error", "Failed to delete.");
        }
    };

    const slipData = useMemo(() => {
        if (!slipWorker) return null;
        let filtered = slipWorker.events;
        if (slipMode === "monthly") {
            filtered = slipWorker.events.filter((ev: any) => ev.date?.startsWith(slipMonth));
        } else if (slipStartDate && slipEndDate) {
            filtered = slipWorker.events.filter((ev: any) => {
                const d = ev.date?.split('T')[0];
                return d >= slipStartDate && d <= slipEndDate;
            });
        }

        const total = filtered.reduce((acc: number, curr: any) => acc + (curr.cost || 0), 0);
        const paid = filtered.reduce((acc: number, curr: any) => acc + (curr.notes.includes('Status: Unpaid') ? 0 : (curr.cost || 0)), 0);
        const unpaid = total - paid;

        return {
            workerName: slipWorker.name,
            events: filtered,
            total,
            paid,
            unpaid,
            period: slipMode === "monthly" ? slipMonth : `${slipStartDate} to ${slipEndDate}`
        };
    }, [slipWorker, slipMonth, slipStartDate, slipEndDate, slipMode]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-theme">
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium animate-fade-in
          ${toast.type === "success" ? "bg-green-500/95 text-white border-green-400" : "bg-red-500/95 text-white border-red-400"}`}>
                    {toast.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {toast.msg}
                </div>
            )}

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-theme tracking-tight uppercase">Labor Hub</h1>
                        </div>
                        <p className="text-xs sm:text-sm text-theme-muted ml-[52px]">Employees & Manpower • مزدور</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-theme-track p-1 rounded-xl border border-theme">
                            <button
                                onClick={() => setLocale("ur")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${locale === "ur" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-theme-muted hover:text-theme"}`}
                            >اردو</button>
                            <button
                                onClick={() => setLocale("en")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${locale === "en" ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-theme-muted hover:text-theme"}`}
                            >ENGLISH</button>
                        </div>
                        <button
                            onClick={() => { resetForm(); setOpenAdd(true); }}
                            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-3 rounded-2xl font-black shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:from-orange-400 hover:to-red-500 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus className="w-6 h-6" /> {locale === "ur" ? "نیا ریکارڈ" : "ADD LABOR"}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
                        </div>
                        <p className="text-theme-muted text-sm">Loading labor register...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {workerStats.map(worker => (
                                <div key={worker.name} className="group relative bg-theme-card border border-theme rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center text-xl font-bold uppercase border border-orange-500/20">
                                                {worker.name[0]}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-theme">{worker.name}</h3>
                                                <p className="text-xs text-theme-muted flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" /> {locale === "ur" ? "آخری کام" : "Last Entry"}: {worker.lastWorked}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setActiveWorkerInfo(worker)} className="p-2 rounded-xl bg-theme-track text-theme-muted hover:text-orange-500 transition-colors border border-theme hover:border-orange-500/30">
                                            <Info className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                                            <p className="text-[10px] font-black uppercase text-green-600/70 mb-1">{locale === "ur" ? "کل ادائیگیاں" : "Total Paid"}</p>
                                            <p className="text-lg font-black text-green-500">Rs {worker.totalPaid.toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                            <p className="text-[10px] font-black uppercase text-red-600/70 mb-1">{locale === "ur" ? "کل بقایا" : "Total Unpaid"}</p>
                                            <p className="text-lg font-black text-red-500">Rs {worker.totalUnpaid.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveWorkerInfo(worker)}
                                        className="w-full mt-4 py-2 rounded-xl font-bold text-sm bg-theme-track border border-theme text-theme hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/30 transition-all"
                                    >
                                        {locale === "ur" ? "تفصیلات دیکھیں" : "View Full History"}
                                    </button>
                                </div>
                            ))}

                            {workerStats.length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 flex items-center justify-center mb-4">
                                        <Users className="w-10 h-10 text-orange-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-theme mb-2">{locale === "ur" ? "کوئی مزدور درج نہیں" : "No Labor Profiles Yet"}</h3>
                                    <p className="text-theme-muted max-w-sm mx-auto mb-6">
                                        {locale === "ur" ? "مزدور اور عملے کا ریکارڈ شامل کرنا شروع کریں۔" : "Start adding your workers and staff records to build their history."}
                                    </p>
                                    <button onClick={() => { resetForm(); setOpenAdd(true); }} className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25">
                                        <Plus className="w-5 h-5" /> {locale === "ur" ? "نیا عملہ" : "Add Labor"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ══════════════ ADD NEW RECORD MODAL ══════════════ */}
            {openAdd && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpenAdd(false)} />
                    <div className="relative z-10 w-full sm:max-w-lg bg-theme-card rounded-t-3xl sm:rounded-2xl shadow-2xl border border-theme flex flex-col max-h-[92vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-theme shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-orange-500" />
                                </div>
                                <h2 className="text-lg font-bold text-theme">{locale === "ur" ? "مزدور کا ریکارڈ" : "Record Labor"}</h2>
                            </div>
                            <button onClick={() => setOpenAdd(false)} className="p-2 rounded-xl hover:bg-theme-track text-theme-muted transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            
                            {/* Same Labour Form as previously on activity page */}
                            <div className="space-y-4">
                                {/* Worker Name (Datalist) */}
                                <div>
                                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                        {locale === 'ur' ? 'مزدور کا نام' : 'Worker Name'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            list="worker-names"
                                            value={labourName}
                                            onChange={e => setLabourName(e.target.value)}
                                            placeholder={locale === 'ur' ? 'مثلاً: محمد علی' : 'Select or type e.g. Ahmed...'}
                                            required
                                            className="w-full px-4 py-3.5 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-bold focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                                        />
                                        <datalist id="worker-names">
                                            {uniqueWorkerNames.map(w => (
                                                <option key={w} value={w} />
                                            ))}
                                        </datalist>
                                        
                                        {workerStats.find(w => w.name === labourName.trim()) && (
                                            <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl animate-fade-in">
                                                <p className="text-[11px] font-black text-orange-600 mb-2 uppercase flex items-center gap-1.5">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    {locale === 'ur' ? 'اس مزدور کا پرانا کھاتہ موجود ہے' : 'Existing Worker Profile Found'}
                                                </p>
                                                <div className="flex justify-between items-center text-xs font-semibold text-theme">
                                                    <span>Total Unpaid:</span>
                                                    <span className="text-red-500">Rs {workerStats.find(w => w.name === labourName.trim())?.totalUnpaid.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                        required
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
                                            required
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
                                            required
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
                                            required
                                            placeholder="1"
                                            className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-black text-center focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Period & Status */}
                                <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                            {locale === 'ur' ? 'کب سے (From)' : 'From Date'}
                                        </label>
                                        <input
                                            type="date"
                                            value={labourStartDate}
                                            onChange={e => setLabourStartDate(e.target.value)}
                                            className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-bold focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                            {locale === 'ur' ? 'کب تک (To)' : 'To Date'}
                                        </label>
                                        <input
                                            type="date"
                                            value={labourEndDate}
                                            onChange={e => setLabourEndDate(e.target.value)}
                                            className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-bold focus:outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2 xs:col-span-1">
                                        <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                            {locale === 'ur' ? 'ادائیگی' : 'Status'}
                                        </label>
                                        <select
                                            value={labourStatus}
                                            onChange={e => setLabourStatus(e.target.value)}
                                            className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-bold focus:outline-none"
                                        >
                                            <option value="Paid">{locale === 'ur' ? 'ادا کر دیا (Paid)' : 'Paid'}</option>
                                            <option value="Unpaid">{locale === 'ur' ? 'باقی (Unpaid)' : 'Unpaid'}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1">
                                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">
                                        {locale === 'ur' ? 'ریکارڈ شامل کرنے کی تاریخ' : 'Entry Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-orange-500/20 text-theme text-sm font-bold focus:outline-none"
                                    />
                                </div>

                                {/* Custom Notes */}
                                <div>
                                    <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2 px-1">Notes / یاد دہانی</label>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                        placeholder="..."
                                        className="w-full px-4 py-4 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold resize-none focus:outline-none" />
                                </div>

                                {labourCount && labourRate && (
                                    <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-4 mt-4">
                                        <span className="text-xs font-black text-orange-400 uppercase">
                                            {locale === 'ur' ? 'کل ادائیگی (خودکار)' : 'Total Cost'}
                                        </span>
                                        <span className="text-2xl font-black text-orange-500">
                                            Rs {((Number(labourCount) || 0) * (Number(labourRate) || 0) * (Number(labourDays) || 1)).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-4 pt-4 pb-8">
                                <button type="submit" disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-orange-500/40 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale">
                                    {saving ? <><Loader2 className="w-6 h-6 animate-spin text-white" /> SAVING...</> : <><CheckCircle className="w-6 h-6" /> {locale === "ur" ? "محفوظ کریں" : "SAVE LABOR"}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════ WORKER DETAIL MODAL ══════════════ */}
            {activeWorkerInfo && (
                <div className="fixed inset-0 z-[105] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveWorkerInfo(null)} />
                    <div className="relative z-10 w-full sm:max-w-2xl bg-theme-card rounded-t-3xl sm:rounded-3xl shadow-2xl border border-theme flex flex-col max-h-[92vh]">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-theme shrink-0 bg-theme-track/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-xl font-bold uppercase border border-orange-500/30">
                                    {activeWorkerInfo.name[0]}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-theme tracking-tight">{activeWorkerInfo.name}</h2>
                                    <p className="text-xs font-semibold text-theme-muted uppercase tracking-widest mt-0.5">Worker Profile</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setSlipWorker(activeWorkerInfo); setOpenSlip(true); }} className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border border-orange-500/20 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold">
                                    <FileText className="w-4 h-4" /> {locale === "ur" ? "سلپ بنائیں" : "Generate Slip"}
                                </button>
                                <button onClick={() => setActiveWorkerInfo(null)} className="p-2.5 rounded-xl hover:bg-theme-track border border-transparent hover:border-theme text-theme-muted transition-all active:scale-95">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-600/70 mb-2">Total Cleared</p>
                                    <p className="text-2xl font-black text-green-500">Rs {activeWorkerInfo.totalPaid.toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-center relative overflow-hidden">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600/70 mb-2">Remaining Unpaid</p>
                                    <p className="text-2xl font-black text-red-500">Rs {activeWorkerInfo.totalUnpaid.toLocaleString()}</p>
                                    {activeWorkerInfo.totalUnpaid > 0 && <AlertCircle className="absolute -bottom-4 -right-4 w-16 h-16 text-red-500/10 pointer-events-none" />}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-black text-theme mb-4 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-theme-muted" /> Job History 
                                    <span className="px-2 py-0.5 rounded-full bg-theme-track border border-theme text-[10px] font-black text-theme-muted">{activeWorkerInfo.events.length}</span>
                                </h4>
                                <div className="space-y-3">
                                    {activeWorkerInfo.events.map((ev: any) => {
                                        const cleanNotes = ev.notes.replace(/Worker:\s*[^|]+\|\s*/, '') || "-"; 
                                        const isUnpaid = ev.notes.includes('Status: Unpaid');
                                        return (
                                            <div key={ev.id} className="relative pl-6 py-2 border-l-2 border-theme-track last:border-transparent group">
                                                <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-4 border-theme-card ${isUnpaid ? 'bg-red-500' : 'bg-green-500'}`} />
                                                <div className="bg-theme-track/30 border border-theme rounded-2xl p-4 hover:border-theme-muted transition-colors">
                                                    <div className="flex justify-between items-start mb-2 gap-4">
                                                        <span className="text-xs font-bold text-theme-muted bg-theme-track px-2 py-1 rounded-lg border border-theme">
                                                            {ev.date?.split('T')[0]}
                                                        </span>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-base font-black text-theme">Rs {ev.cost?.toLocaleString()}</span>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isUnpaid ? 'text-red-500' : 'text-green-500'}`}>{isUnpaid ? 'Unpaid' : 'Paid'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-medium text-theme/90 space-y-1">
                                                        {cleanNotes.split('|').map((part: string, idx: number) => {
                                                            const partT = part.trim();
                                                            if(!partT) return null;
                                                            if(partT.startsWith('Status:')) return null;
                                                            return <div key={idx} className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-theme-muted/30 shrink-0 mt-1.5" /> <span>{partT}</span></div>
                                                        })}
                                                    </div>
                                                    <div className="mt-4 pt-3 border-t border-theme-track flex justify-end">
                                                         <button onClick={() => setDeleteId(ev.id)} className="p-1.5 rounded-lg text-theme-muted hover:text-red-500 hover:bg-red-500/10 active:bg-theme-track transition-colors flex items-center gap-1.5 text-xs font-bold">
                                                            <Trash2 className="w-3.5 h-3.5" /> Delete Entry
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative z-10 bg-theme-card border border-theme rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-theme text-center mb-2">Delete Labor Entry?</h3>
                        <p className="text-theme-muted text-sm text-center mb-6">This record will be permanently removed.</p>
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
            )}

            {/* ══════════════ PAYMENT SLIP MODAL ══════════════ */}
            {openSlip && slipWorker && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 print:p-0 print:static print:z-0 print-container">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md print:hidden" onClick={() => setOpenSlip(false)} />
                    <div className="relative z-10 w-full max-w-2xl bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] print:max-h-none print:h-auto print:shadow-none print:rounded-none">
                        
                        {/* Control Header - Hide on print */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 print:hidden shrink-0">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Printer className="w-5 h-5" />
                                <h3 className="font-bold">Payment Slip Preview</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={handlePrint} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                                    <Printer className="w-4 h-4" /> Print
                                </button>
                                <button onClick={() => setOpenSlip(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Slip Settings - Hide on print */}
                        <div className="p-6 bg-slate-50/50 border-b border-slate-100 space-y-4 print:hidden shrink-0">
                            <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit">
                                <button onClick={() => setSlipMode("monthly")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${slipMode === "monthly" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"}`}>Monthly Slip</button>
                                <button onClick={() => setSlipMode("range")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${slipMode === "range" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"}`}>Date Range</button>
                            </div>
                            <div className="flex flex-wrap gap-4 items-end">
                                {slipMode === "monthly" ? (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Select Month</label>
                                        <input type="month" value={slipMonth} onChange={e => setSlipMonth(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">From</label>
                                            <input type="date" value={slipStartDate} onChange={e => setSlipStartDate(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">To</label>
                                            <input type="date" value={slipEndDate} onChange={e => setSlipEndDate(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ACTUAL PRINTABLE SLIP CONTENT */}
                        <div className="flex-1 overflow-y-auto p-10 print:overflow-visible print:p-0">
                            <div id="payment-slip" className="bg-white border-[3px] border-slate-200 rounded-px p-8 min-h-[600px] flex flex-col print:border-none print:p-2">
                                {/* Slip Header */}
                                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                                    <div>
                                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">Mashori Farm</h1>
                                        <p className="text-sm font-bold text-slate-500">Labor Payment Statement • ریکارڈ ادائیگی</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</div>
                                        <div className="text-sm font-black text-slate-900">{new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>

                                {/* Worker Info Box */}
                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Employee Name / نام</div>
                                        <div className="text-xl font-black text-slate-900 uppercase">{slipData?.workerName}</div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Period / دورانیہ</div>
                                        <div className="text-xl font-black text-slate-900 uppercase">{slipData?.period}</div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="flex-1">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b-2 border-slate-900">
                                                <th className="py-3 text-[10px] font-black text-slate-400 uppercase">Date</th>
                                                <th className="py-3 text-[10px] font-black text-slate-400 uppercase">Description / Details</th>
                                                <th className="py-3 text-right text-[10px] font-black text-slate-400 uppercase">Status</th>
                                                <th className="py-3 text-right text-[10px] font-black text-slate-400 uppercase">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {slipData?.events.length === 0 ? (
                                                <tr><td colSpan={4} className="py-10 text-center text-slate-400 font-bold">No entries found for this period.</td></tr>
                                            ) : (
                                                slipData?.events.map((ev: any) => (
                                                    <tr key={ev.id} className="text-sm font-bold">
                                                        <td className="py-4 text-slate-500 whitespace-nowrap">{ev.date?.split('T')[0]}</td>
                                                        <td className="py-4 text-slate-900">
                                                            <div>{ev.notes.split('|').find((p: string) => p.includes('Work:'))?.replace('Work:', '').trim() || "Farm Labor"}</div>
                                                            <div className="text-[10px] text-slate-400 font-black">{ev.notes.split('|').find((p: string) => p.includes('Period:'))?.trim() || ""}</div>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <span className={`text-[10px] uppercase font-black ${ev.notes.includes('Status: Unpaid') ? 'text-red-500' : 'text-green-600'}`}>
                                                                {ev.notes.includes('Status: Unpaid') ? 'Unpaid' : 'Paid'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right text-slate-900">Rs {ev.cost?.toLocaleString()}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary Box */}
                                <div className="mt-8 border-t-2 border-slate-900 pt-8 flex justify-end">
                                    <div className="w-64 space-y-3">
                                        <div className="flex justify-between items-center text-sm font-bold text-slate-500 px-2">
                                            <span>Sub Total:</span>
                                            <span>Rs {slipData?.total.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-black text-green-600 px-2 bg-green-50 rounded-lg py-2">
                                            <span>Cleared:</span>
                                            <span>Rs {slipData?.paid.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-lg font-black text-white px-3 bg-red-600 rounded-xl py-3 shadow-lg shadow-red-500/20">
                                            <span>Payable:</span>
                                            <span>Rs {slipData?.unpaid.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Note */}
                                <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-end">
                                    <div className="max-w-[200px]">
                                        <div className="h-[2px] bg-slate-900 w-full mb-2"></div>
                                        <div className="text-xs font-black text-slate-900 text-center uppercase tracking-wide">Manager's Signature</div>
                                    </div>
                                    <div className="text-right text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        This is a computer generated document
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <style dangerouslySetInnerHTML={{ __html: `
                        @media print {
                            /* Hide everything by default */
                            body * {
                                display: none !important;
                            }
                            /* Show only the slip and its parents necessary for rendering */
                            .print-container, .print-container * {
                                display: block !important;
                                visibility: visible !important;
                            }
                            #payment-slip, #payment-slip * {
                                display: block !important;
                                visibility: visible !important;
                            }
                            /* Ensure table cells and flex containers show correctly */
                            #payment-slip table, #payment-slip tr, #payment-slip td, #payment-slip th {
                                display: table-cell !important;
                                border-bottom: 1px solid #e2e8f0 !important;
                            }
                            #payment-slip thead, #payment-slip tbody {
                                display: table-header-group !important;
                            }
                            #payment-slip thead th {
                                display: table-cell !important;
                            }
                            #payment-slip .flex {
                                display: flex !important;
                            }
                            #payment-slip .grid {
                                display: grid !important;
                                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                            }
                            /* Position the slip for full page print */
                            .print-container {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: white !important;
                            }
                            /* Remove extra margins/paddings from body */
                            @page {
                                margin: 1cm;
                            }
                        }
                    ` }} />
                </div>
            )}
            <div className="h-20 md:hidden" />
        </div>
    );
}

export default function LaborPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                <p className="text-theme-muted">Loading labor hub...</p>
            </div>
        }>
            <LaborContent />
        </Suspense>
    );
}
