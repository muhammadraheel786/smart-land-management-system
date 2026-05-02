"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import {
    Users, Plus, Loader2, Search, MapPin, CheckCircle,
    AlertCircle, X, FileText, Printer, Phone, Volume2, Clock, Banknote, ListTodo,
    ArrowUpRight, ArrowDownRight, ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { api } from "@/lib/api";

function LaborDashboard() {
    const { isDataEntry } = useAuth();
    const { locale } = useLocale();

    // Data State
    const [labours, setLabours] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // View State
    const [view, setView] = useState<"dashboard" | "profile">("dashboard");
    const [selectedLabour, setSelectedLabour] = useState<any>(null);

    // Modal States
    const [openAddLabour, setOpenAddLabour] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = async () => {
        try {
            const [lData, sData] = await Promise.all([
                api.getLabours(),
                api.getLabourDashboard()
            ]);
            setLabours(lData);
            setStats(sData);
        } catch (err: any) {
            console.error(err);
            showToast('error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSelectLabour = (l: any) => {
        setSelectedLabour(l);
        setView("profile");
    };

    // --- Search & Filter ---
    const [searchTerm, setSearchTerm] = useState("");
    const filteredLabours = useMemo(() => {
        return labours.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [labours, searchTerm]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-orange-500" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* TOAST */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200]">
                    <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-white text-sm animate-bounce ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {toast.msg}
                    </div>
                </div>
            )}

            {view === "dashboard" && (
                <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                                <Users className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{locale === 'ur' ? 'لیبر مینجمنٹ' : 'Labour Management'}</h1>
                                <p className="text-slate-500 font-medium text-sm flex items-center gap-1">
                                    {locale === 'ur' ? 'مزدوروں کا مکمل حساب کتاب' : 'Complete worker tracking'}
                                </p>
                            </div>
                        </div>
                        {!isDataEntry && (
                            <button onClick={() => setOpenAddLabour(true)} className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-lg">
                                <Plus className="w-6 h-6" /> {locale === 'ur' ? 'نیا مزدور شامل کریں' : 'Add Labour'}
                            </button>
                        )}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Users className="w-5 h-5" /></div>
                                <h3 className="text-xs font-black text-slate-400 uppercase">{locale === 'ur' ? 'کل مزدور' : 'Total Labour'}</h3>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900">{stats?.total_labour || 0}</p>
                                <p className="text-xs font-bold text-green-500 mt-1">{stats?.active_labour || 0} Active • {stats?.inactive_labour || 0} Inactive</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Banknote className="w-5 h-5" /></div>
                                <h3 className="text-xs font-black text-slate-400 uppercase">{locale === 'ur' ? 'ادائیگی' : 'Total Paid'}</h3>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-900">Rs {stats?.total_paid_overall?.toLocaleString() || 0}</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">This Month: Rs {stats?.paid_this_month?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                        <div className="bg-red-50 p-5 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-red-100 text-red-600 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
                                <h3 className="text-xs font-black text-red-500/70 uppercase">{locale === 'ur' ? 'باقی تنخواہ' : 'Pending Salary'}</h3>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-red-600">Rs {stats?.pending_salary?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                        <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
                                <h3 className="text-xs font-black text-orange-500/70 uppercase">{locale === 'ur' ? 'ایڈوانس' : 'Advances Given'}</h3>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-orange-600">Rs {stats?.advances_given?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Workers List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 bg-slate-50/50">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type="text" placeholder={locale === 'ur' ? 'مزدور کا نام تلاش کریں...' : 'Search labour name...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" />
                            </div>
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                                        <th className="p-4">{locale === 'ur' ? 'مزدور' : 'Worker'}</th>
                                        <th className="p-4">{locale === 'ur' ? 'کام' : 'Type'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'دن' : 'Days'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'کل تنخواہ' : 'Total Salary'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'ادا شدہ' : 'Paid'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'باقی' : 'Remaining'}</th>
                                        <th className="p-4 text-center">{locale === 'ur' ? 'حالت' : 'Status'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredLabours.map(l => (
                                        <tr key={l.id} onClick={() => handleSelectLabour(l)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase shrink-0 overflow-hidden">
                                                        {l.photo ? <img src={l.photo} className="w-full h-full object-cover" /> : l.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-orange-500 transition-colors">{l.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{l.phone || 'No Phone'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-bold text-slate-600">{l.work_type}</td>
                                            <td className="p-4 text-right text-sm font-bold text-slate-600">{l.days_worked || 0}</td>
                                            <td className="p-4 text-right text-sm font-bold text-slate-900">Rs {l.total_salary.toLocaleString()}</td>
                                            <td className="p-4 text-right text-sm font-bold text-green-600">Rs {l.total_paid.toLocaleString()}</td>
                                            <td className="p-4 text-right text-sm font-black text-red-500">Rs {l.balance.toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${l.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {l.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredLabours.length === 0 && (
                            <div className="p-12 text-center text-slate-400 font-bold">
                                {locale === 'ur' ? 'کوئی ریکارڈ نہیں ملا۔' : 'No records found.'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Profile View */}
            {view === "profile" && selectedLabour && (
                <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <button onClick={() => { setView("dashboard"); fetchData(); }} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 w-fit">
                        <ArrowUpRight className="w-5 h-5 rotate-[-135deg]" /> Back to Dashboard
                    </button>
                    
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-black text-slate-900 mb-6">{selectedLabour.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-bold text-slate-500">Work Type: {selectedLabour.work_type}</p>
                                <p className="text-sm font-bold text-slate-500">Salary: Rs {selectedLabour.salary_amount} / {selectedLabour.salary_type}</p>
                                <p className="text-sm font-bold text-slate-500">Phone: {selectedLabour.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500">Total Salary: Rs {selectedLabour.total_salary.toLocaleString()}</p>
                                <p className="text-sm font-bold text-slate-500">Total Paid: Rs {selectedLabour.total_paid.toLocaleString()}</p>
                                <p className="text-sm font-bold text-slate-500">Balance: Rs {selectedLabour.balance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            <AddLabourModal open={openAddLabour} onClose={() => setOpenAddLabour(false)} onSave={() => { setOpenAddLabour(false); fetchData(); showToast('success', locale === 'ur' ? 'مزدور شامل کر دیا گیا' : 'Labour Added Successfully'); }} locale={locale} />
        </div>
    );
}

// Add Labour Modal
function AddLabourModal({ open, onClose, onSave, locale }: any) {
    if (!open) return null;
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', phone: '', cnic: '', work_type: 'Helper', salary_type: 'daily', salary_amount: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.addLabour(form);
            onSave();
        } catch (err: any) {
            console.error("Save Labour Error:", err);
            alert(`Could not save: ${err.message}`);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <h2 className="text-xl font-black">{locale === 'ur' ? 'نیا مزدور شامل کریں' : 'Add New Labour'}</h2>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">{locale === 'ur' ? 'پورا نام' : 'Full Name'}</label>
                        <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-lg font-bold focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" placeholder="Ali Raza" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2">{locale === 'ur' ? 'فون نمبر' : 'Phone Number'}</label>
                            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold focus:outline-none focus:border-orange-500" placeholder="0300..." />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2">CNIC</label>
                            <input type="text" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold focus:outline-none focus:border-orange-500" placeholder="Optional" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2">{locale === 'ur' ? 'کام کی قسم' : 'Work Type'}</label>
                            <select value={form.work_type} onChange={e => setForm({...form, work_type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold focus:outline-none focus:border-orange-500 appearance-none">
                                <option>Helper</option>
                                <option>Mason</option>
                                <option>Driver</option>
                                <option>Guard</option>
                                <option>Plumber</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2">{locale === 'ur' ? 'تنخواہ کی قسم' : 'Salary Type'}</label>
                            <select value={form.salary_type} onChange={e => setForm({...form, salary_type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold focus:outline-none focus:border-orange-500 appearance-none">
                                <option value="daily">{locale === 'ur' ? 'روزانہ (Daily)' : 'Daily Wage'}</option>
                                <option value="monthly">{locale === 'ur' ? 'ماہانہ (Monthly)' : 'Monthly Salary'}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">{locale === 'ur' ? 'رقم' : 'Base Salary Amount'}</label>
                        <input required type="number" value={form.salary_amount} onChange={e => setForm({...form, salary_amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xl font-black text-orange-600 focus:outline-none focus:border-orange-500" placeholder="Rs" />
                    </div>
                    <button type="submit" disabled={saving} className="w-full bg-green-500 hover:bg-green-600 text-white p-5 rounded-2xl font-black text-xl shadow-xl shadow-green-500/20 active:scale-95 transition-all mt-4 flex justify-center items-center gap-2">
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle className="w-6 h-6" /> Save Worker</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function LaborPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-orange-500" /></div>}>
            <LaborDashboard />
        </Suspense>
    );
}
