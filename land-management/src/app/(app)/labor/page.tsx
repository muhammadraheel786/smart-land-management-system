"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import {
    Users, Plus, Loader2, Search, MapPin, CheckCircle,
    AlertCircle, X, FileText, Printer, Phone, Volume2, Clock, Banknote, ListTodo,
    ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Utility API caller
async function apiFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    if (!res.ok) {
        let err;
        try { err = await res.json(); } catch { err = { error: res.statusText }; }
        throw new Error(err.error || "API Error");
    }
    if (res.status !== 204) {
        return res.json();
    }
    return null;
}

function LaborDashboard() {
    const { isDataEntry } = useAuth();
    const locale: string = "en"; // default locale; can be wired to context later

    // Data State
    const [labours, setLabours] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // View State
    const [view, setView] = useState<"dashboard" | "profile">("dashboard");
    const [selectedLabour, setSelectedLabour] = useState<any>(null);

    // Modal States
    const [openAddLabour, setOpenAddLabour] = useState(false);
    const [openAddPayment, setOpenAddPayment] = useState(false);
    const [openAddAdvance, setOpenAddAdvance] = useState(false);
    const [openAttendance, setOpenAttendance] = useState(false);
    const [openSlip, setOpenSlip] = useState(false);
    const [slipWorker, setSlipWorker] = useState<any>(null);

    // Toast
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        if(type === 'success') speak(msg); // Speak success messages
        setTimeout(() => setToast(null), 3000);
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = locale === 'ur' ? 'ur-PK' : 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    const fetchData = async () => {
        try {
            const [lData, sData] = await Promise.all([
                apiFetch("/api/labours"),
                apiFetch("/api/labours/dashboard")
            ]);
            setLabours(lData);
            setStats(sData);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchProfile = async (id: string) => {
        try {
            const lData = await apiFetch(`/api/labours/${id}`);
            const tData = await apiFetch(`/api/labours/${id}/transactions`);
            const aData = await apiFetch(`/api/labours/${id}/attendance`);
            setSelectedLabour({ ...lData, transactions: tData, attendance: aData });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectLabour = (l: any) => {
        fetchProfile(l.id);
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
                                <p className="text-slate-500 font-medium text-sm flex items-center gap-1 cursor-pointer" onClick={() => speak(locale === 'ur' ? 'یہ لیبر مینجمنٹ سیکشن ہے۔ یہاں آپ اپنے مزدوروں کا حساب کتاب رکھ سکتے ہیں۔' : 'This is the Labour Management section.')}>
                                    <Volume2 className="w-4 h-4 text-orange-500" />
                                    {locale === 'ur' ? 'مزدوروں کا مکمل حساب کتاب' : 'Complete worker tracking'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setOpenAddLabour(true)} className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-lg">
                            <Plus className="w-6 h-6" /> {locale === 'ur' ? 'نیا مزدور شامل کریں' : 'Add Labour'}
                        </button>
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
                        <div className="bg-red-50 p-5 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
                            <AlertCircle className="absolute -bottom-4 -right-4 w-24 h-24 text-red-500/5" />
                            <div className="flex items-center gap-2 mb-2 relative z-10">
                                <div className="p-2 bg-red-100 text-red-600 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
                                <h3 className="text-xs font-black text-red-500/70 uppercase">{locale === 'ur' ? 'باقی تنخواہ' : 'Pending Salary'}</h3>
                            </div>
                            <div className="relative z-10">
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

                    {/* Table / List */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type="text" placeholder={locale === 'ur' ? 'مزدور کا نام تلاش کریں...' : 'Search labour name...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400 font-black border-b border-slate-100">
                                        <th className="p-4">Worker</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4 text-right">Days</th>
                                        <th className="p-4 text-right">Total Salary</th>
                                        <th className="p-4 text-right">Paid</th>
                                        <th className="p-4 text-right">Remaining</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredLabours.map(l => (
                                        <tr key={l.id} onClick={() => handleSelectLabour(l)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase">
                                                        {l.photo ? <img src={l.photo} className="w-full h-full object-cover rounded-full" /> : l.name[0]}
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
                                    {filteredLabours.length === 0 && (
                                        <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-bold">No records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile View */}
            {view === "profile" && selectedLabour && (
                <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <button onClick={() => { setView("dashboard"); fetchData(); }} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 w-fit">
                        <ArrowUpRight className="w-5 h-5 rotate-[-135deg]" /> Back to Dashboard
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Profile Info Card */}
                        <div className="md:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-orange-400 to-red-500" />
                            <div className="relative z-10 w-24 h-24 mx-auto bg-white rounded-full p-1 shadow-xl mb-4 mt-6">
                                <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-3xl font-black text-slate-400">
                                    {selectedLabour.name[0]}
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedLabour.name}</h2>
                            <p className="text-sm font-bold text-slate-500 mb-6">{selectedLabour.work_type} • {selectedLabour.salary_type.toUpperCase()}</p>
                            
                            <div className="space-y-3 text-left">
                                <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">{selectedLabour.phone || 'No Phone'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700 truncate">{selectedLabour.address || 'No Address'}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-400 uppercase">Base Salary</span>
                                    <span className="text-sm font-black text-slate-900">Rs {selectedLabour.salary_amount} / {selectedLabour.salary_type === 'daily' ? 'Day' : 'Month'}</span>
                                </div>
                            </div>

                            <button className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors">
                                <Printer className="w-5 h-5" /> {locale === 'ur' ? 'پروفائل پرنٹ کریں' : 'Print Profile'}
                            </button>
                        </div>

                        {/* Financials & Actions */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Salary Summary Box */}
                            <div className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Banknote className="w-5 h-5" /> {locale === 'ur' ? 'تنخواہ کا حساب' : 'Salary Summary'}
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase mb-1">Total Generated</p>
                                        <p className="text-2xl font-black">Rs {selectedLabour.total_salary.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase mb-1">Total Paid</p>
                                        <p className="text-2xl font-black text-emerald-400">Rs {selectedLabour.total_paid.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase mb-1">Remaining Balance</p>
                                        <p className="text-3xl font-black text-red-400">Rs {selectedLabour.balance.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase mb-1">Advance Pending</p>
                                        <p className="text-3xl font-black text-orange-400">Rs {selectedLabour.advance_balance.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Huge Action Buttons */}
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setOpenAddPayment(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/30 flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 group">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Banknote className="w-6 h-6" /></div>
                                    <span className="font-black text-lg">{locale === 'ur' ? 'تنخواہ دیں' : 'Pay Salary'}</span>
                                </button>
                                <button onClick={() => setOpenAttendance(true)} className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/30 flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 group">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Clock className="w-6 h-6" /></div>
                                    <span className="font-black text-lg">{locale === 'ur' ? 'حاضری لگائیں' : 'Mark Attendance'}</span>
                                </button>
                                <button onClick={() => setOpenAddAdvance(true)} className="bg-orange-500 hover:bg-orange-600 text-white p-6 rounded-3xl shadow-lg shadow-orange-500/30 flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 group">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><ArrowDownRight className="w-6 h-6" /></div>
                                    <span className="font-black text-lg">{locale === 'ur' ? 'ایڈوانس دیں' : 'Add Advance'}</span>
                                </button>
                                <button onClick={() => { setOpenSlip(true); setSlipWorker(selectedLabour); }} className="bg-slate-800 hover:bg-slate-900 text-white p-6 rounded-3xl shadow-lg shadow-slate-900/30 flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 group">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><FileText className="w-6 h-6" /></div>
                                    <span className="font-black text-lg">{locale === 'ur' ? 'سلپ بنائیں' : 'Print Slip'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Transactions Log */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><ListTodo className="w-5 h-5 text-slate-400" /> Transaction History</h3>
                        <div className="space-y-4">
                            {selectedLabour.transactions?.map((t: any) => (
                                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.type === 'salary' ? 'bg-emerald-100 text-emerald-600' : t.type === 'advance' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {t.type === 'salary' ? <Banknote className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 capitalize">{t.type}</p>
                                            <p className="text-xs font-bold text-slate-500">{t.date} • {t.notes || 'No notes'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-lg ${t.type === 'salary' ? 'text-emerald-500' : t.type === 'advance' ? 'text-orange-500' : 'text-blue-500'}`}>
                                            Rs {t.amount.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.payment_method}</p>
                                    </div>
                                </div>
                            ))}
                            {(!selectedLabour.transactions || selectedLabour.transactions.length === 0) && (
                                <p className="text-center text-slate-400 font-bold py-8">No transactions yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            
            {/* Add Labour Modal */}
            <AddLabourModal open={openAddLabour} onClose={() => setOpenAddLabour(false)} onSave={() => { setOpenAddLabour(false); fetchData(); showToast('success', locale === 'ur' ? 'مزدور شامل کر دیا گیا' : 'Labour Added Successfully'); }} locale={locale} />
            
            {/* Add Payment Modal */}
            <AddTransactionModal open={openAddPayment} onClose={() => setOpenAddPayment(false)} type="salary" labour={selectedLabour} onSave={() => { setOpenAddPayment(false); fetchProfile(selectedLabour.id); fetchData(); showToast('success', 'Payment Added!'); }} locale={locale} />
            
            {/* Add Advance Modal */}
            <AddTransactionModal open={openAddAdvance} onClose={() => setOpenAddAdvance(false)} type="advance" labour={selectedLabour} onSave={() => { setOpenAddAdvance(false); fetchProfile(selectedLabour.id); fetchData(); showToast('success', 'Advance Added!'); }} locale={locale} />
            
            {/* Mark Attendance Modal */}
            <AttendanceModal open={openAttendance} onClose={() => setOpenAttendance(false)} labour={selectedLabour} onSave={() => { setOpenAttendance(false); fetchProfile(selectedLabour.id); fetchData(); showToast('success', 'Attendance Marked!'); }} locale={locale} />
            
            {/* Slip Modal */}
            <SlipModal open={openSlip} onClose={() => setOpenSlip(false)} labour={slipWorker} />
        </div>
    );
}

// ---------------------------------------------------------
// MODAL COMPONENTS
// ---------------------------------------------------------

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
            await apiFetch('/api/labours', { method: 'POST', body: JSON.stringify(form) });
            onSave();
        } catch (err) {
            alert("Error saving labour");
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

function AddTransactionModal({ open, onClose, onSave, type, labour, locale }: any) {
    if (!open || !labour) return null;
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] });

    const isSalary = type === 'salary';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiFetch(`/api/labours/${labour.id}/transactions`, { method: 'POST', body: JSON.stringify({...form, type}) });
            onSave();
        } catch (err) {
            alert("Error saving");
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
                <div className={`p-6 flex justify-between items-center text-white ${isSalary ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                    <h2 className="text-xl font-black">{isSalary ? (locale === 'ur' ? 'تنخواہ دیں' : 'Pay Salary') : (locale === 'ur' ? 'ایڈوانس دیں' : 'Give Advance')}</h2>
                    <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {isSalary && labour.balance > 0 && (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between font-bold">
                            <span>Pending Due:</span>
                            <span className="text-xl">Rs {labour.balance.toLocaleString()}</span>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2 text-center">{locale === 'ur' ? 'رقم درج کریں' : 'Enter Amount'}</label>
                        <input required type="number" autoFocus value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className={`w-full bg-slate-50 border-2 p-6 rounded-3xl text-center text-4xl font-black focus:outline-none transition-colors ${isSalary ? 'text-emerald-600 border-emerald-100 focus:border-emerald-500' : 'text-orange-600 border-orange-100 focus:border-orange-500'}`} placeholder="0" />
                    </div>
                    {isSalary && Number(form.amount) > labour.balance && labour.balance > 0 && (
                        <p className="text-xs font-bold text-orange-500 text-center animate-pulse">
                            Extra amount (Rs {Number(form.amount) - labour.balance}) will auto-convert to Advance.
                        </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Date</label>
                            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Notes</label>
                            <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold focus:outline-none" placeholder="..." />
                        </div>
                    </div>
                    <button type="submit" disabled={saving || !form.amount} className={`w-full text-white p-5 rounded-2xl font-black text-xl shadow-xl transition-all flex justify-center items-center gap-2 ${!form.amount ? 'opacity-50 grayscale' : ''} ${isSalary ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'}`}>
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle className="w-6 h-6" /> Confirm {isSalary ? 'Payment' : 'Advance'}</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

function AttendanceModal({ open, onClose, onSave, labour, locale }: any) {
    if (!open || !labour) return null;
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const mark = async (status: string) => {
        setSaving(true);
        try {
            await apiFetch(`/api/labours/${labour.id}/attendance`, { method: 'POST', body: JSON.stringify({ date, status }) });
            onSave();
        } catch (err) {
            alert("Error saving");
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
                <div className="p-6 flex justify-between items-center text-slate-900 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-xl font-black">{locale === 'ur' ? 'حاضری' : 'Attendance'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-black text-center text-lg focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => mark('present')} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white p-5 rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                            {locale === 'ur' ? 'حاضر' : 'Present'}
                        </button>
                        <button onClick={() => mark('absent')} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white p-5 rounded-2xl font-black text-lg shadow-lg shadow-red-500/20 active:scale-95 transition-all">
                            {locale === 'ur' ? 'غیر حاضر' : 'Absent'}
                        </button>
                        <button onClick={() => mark('half_day')} disabled={saving} className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 p-5 rounded-2xl font-black text-lg shadow-lg shadow-yellow-400/20 active:scale-95 transition-all col-span-2">
                            {locale === 'ur' ? 'آدھا دن' : 'Half Day'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SlipModal({ open, onClose, labour }: any) {
    if (!open || !labour) return null;

    const handlePrint = () => {
        const content = document.getElementById('payment-slip');
        if (!content) return;
        
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) return;

        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.outerHTML).join('');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Payment Slip - ${labour.name}</title>
                    ${styles}
                    <style>
                        body { background: white !important; color: black !important; padding: 20px !important; }
                        #payment-slip { border: 2px solid #000 !important; max-width: 800px !important; margin: 0 auto !important; }
                    </style>
                </head>
                <body>
                    ${content.outerHTML}
                    <script>
                        setTimeout(() => { window.print(); window.close(); }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><FileText className="w-6 h-6 text-slate-400" /> Salary Slip Preview</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Printer className="w-4 h-4" /> Print PDF</button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl"><X className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    <div id="payment-slip" className="border-2 border-slate-900 p-8 min-h-[600px] flex flex-col bg-white">
                        <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between">
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter">Mashori Farm</h1>
                                <p className="text-sm font-bold text-slate-500">Official Labour Payment Slip</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Date</p>
                                <p className="text-sm font-black">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Worker Name</p>
                                <p className="text-xl font-black uppercase">{labour.name}</p>
                                <p className="text-xs font-bold text-slate-500 mt-1">{labour.work_type}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase">Salary Basis</p>
                                <p className="text-xl font-black uppercase">{labour.salary_type}</p>
                                <p className="text-xs font-bold text-slate-500 mt-1">Rs {labour.salary_amount} / {labour.salary_type === 'daily' ? 'Day' : 'Month'}</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="py-4 font-black text-slate-500 uppercase text-xs tracking-widest">Total Earned</td>
                                        <td className="py-4 text-right font-black text-xl">Rs {labour.total_salary.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 font-black text-slate-500 uppercase text-xs tracking-widest">Total Paid</td>
                                        <td className="py-4 text-right font-black text-xl text-green-600">Rs {labour.total_paid.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 font-black text-slate-500 uppercase text-xs tracking-widest">Advances Balance</td>
                                        <td className="py-4 text-right font-black text-xl text-orange-500">Rs {labour.advance_balance.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-auto border-t-2 border-slate-900 pt-6 flex justify-between items-end">
                            <div className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-100">
                                <p className="text-xs font-black uppercase tracking-widest mb-1">Payable Balance Due</p>
                                <p className="text-3xl font-black">Rs {labour.balance.toLocaleString()}</p>
                            </div>
                            <div className="w-48 border-t-2 border-slate-400 pt-2 text-center text-xs font-black uppercase text-slate-400">
                                Manager Signature
                            </div>
                        </div>
                    </div>
                </div>
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
