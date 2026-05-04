"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import {
    Users, Plus, Loader2, Search, MapPin, CheckCircle,
    AlertCircle, X, FileText, Printer, Phone, Volume2, Clock, Banknote, ListTodo,
    ArrowUpRight, ArrowDownRight, ChevronRight, Download
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { api } from "@/lib/api";

// --- Types ---
interface Transaction {
    id?: string;
    _id?: string;
    type: 'salary' | 'advance';
    amount: number;
    date: string;
    notes?: string;
    transaction_id?: string;
}

interface Attendance {
    id?: string;
    _id?: string;
    status: 'present' | 'absent' | 'half_day';
    date: string;
    overtime_hours?: number;
}

interface Labour {
    id: string;
    _id?: string;
    name: string;
    phone?: string;
    cnic?: string;
    work_type: string;
    salary_type: 'daily' | 'monthly';
    salary_amount: number;
    status: string;
    total_salary?: number;
    total_paid?: number;
    balance?: number;
    days_worked?: number;
    photo?: string;
    transactions?: Transaction[];
    attendance?: Attendance[];
}

function LaborDashboard() {
    const { isDataEntry } = useAuth();
    const { locale } = useLocale();

    // Data State
    const [labours, setLabours] = useState<Labour[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // View State
    const [view, setView] = useState<"dashboard" | "profile">("dashboard");
    const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);

    // Modal States
    const [openAddLabour, setOpenAddLabour] = useState(false);
    const [openTransaction, setOpenTransaction] = useState<{ type: 'salary' | 'advance', open: boolean }>({ type: 'salary', open: false });
    const [openAttendance, setOpenAttendance] = useState(false);
    const [openSlip, setOpenSlip] = useState(false);

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
            setLabours(Array.isArray(lData) ? lData : []);
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

    const handleSelectLabour = async (l: any) => {
        setLoading(true);
        try {
            const profile = await api.getLabourProfile(l.id || l._id);
            setSelectedLabour(profile);
            setView("profile");
        } catch (err) {
            showToast('error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    // --- Search & Filter ---
    const [searchTerm, setSearchTerm] = useState("");
    const filteredLabours = useMemo(() => {
        return labours.filter(l => l.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [labours, searchTerm]);

    const profileStats = useMemo(() => {
        if (!selectedLabour) return null;
        const monthlySalary = Number(selectedLabour.salary_amount) || 0;
        
        const totalAdvance = (selectedLabour.transactions || []).reduce((sum, t) => {
            return t.type === 'advance' ? sum + (Number(t.amount) || 0) : sum;
        }, 0);
        
        const totalSalaryPaid = (selectedLabour.transactions || []).reduce((sum, t) => {
            return t.type === 'salary' ? sum + (Number(t.amount) || 0) : sum;
        }, 0);
        
        const balance = monthlySalary - (totalAdvance + totalSalaryPaid);
        
        return { monthlySalary, totalAdvance, totalSalaryPaid, balance };
    }, [selectedLabour]);

    const handleExport = () => {
        const data = filteredLabours.map(l => ({
            "Worker Name": l.name,
            "Phone": l.phone || "N/A",
            "CNIC": l.cnic || "N/A",
            "Work Type": l.work_type,
            "Salary Type": l.salary_type,
            "Base Rate": l.salary_amount,
            "Days Worked": l.days_worked || 0,
            "Total Salary": l.total_salary || l.salary_amount,
            "Total Paid": l.total_paid || 0,
            "Remaining Balance": l.balance || 0,
            "Status": l.status
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "LabourRecords");
        XLSX.writeFile(wb, `Labour_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-theme text-theme"><Loader2 className="w-12 h-12 animate-spin text-orange-500" /></div>;
    }

    return (
        <div className="min-h-screen bg-theme pb-20 text-theme">
            {/* TOAST */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200]">
                    <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-white text-sm animate-bounce ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-50'}`}>
                        {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {toast.msg}
                    </div>
                </div>
            )}

            {view === "dashboard" && (
                <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-theme-card p-6 rounded-3xl shadow-sm border border-theme">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                                <Users className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-theme tracking-tight">{locale === 'ur' ? 'لیبر مینجمنٹ' : 'Labour Management'}</h1>
                                <p className="text-theme-muted font-medium text-sm flex items-center gap-1">
                                    {locale === 'ur' ? 'مزدوروں کا مکمل حساب کتاب' : 'Complete worker tracking'}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {!isDataEntry && (
                                <button onClick={() => setOpenAddLabour(true)} className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                                    <Plus className="w-5 h-5" /> {locale === 'ur' ? 'نیا مزدور' : 'Add Labour'}
                                </button>
                            )}
                            <button onClick={handleExport} className="flex-1 md:flex-none bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                                <Download className="w-5 h-5" /> {locale === 'ur' ? 'ایکسل رپورٹ' : 'Export Excel'}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-theme-card p-5 rounded-3xl border border-theme shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl"><Users className="w-5 h-5" /></div>
                                <h3 className="text-xs font-black text-theme-muted uppercase tracking-wider">{locale === 'ur' ? 'کل مزدور' : 'Total Labour'}</h3>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-theme">{stats?.total_labour || 0}</p>
                                <p className="text-[10px] font-bold text-green-500 mt-1">{stats?.active_labour || 0} Active • {stats?.inactive_labour || 0} Inactive</p>
                            </div>
                        </div>
                        <div className="bg-theme-card p-5 rounded-3xl border border-theme shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><Banknote className="w-5 h-5" /></div>
                                <h3 className="text-xs font-black text-theme-muted uppercase tracking-wider">{locale === 'ur' ? 'ادائیگی' : 'Total Paid'}</h3>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-theme">Rs {stats?.total_paid_overall?.toLocaleString() || 0}</p>
                                <p className="text-[10px] font-bold text-theme-muted mt-1">This Month: Rs {stats?.paid_this_month?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                        <div className="bg-red-500/10 p-5 rounded-3xl border border-red-500/20 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-red-500/20 text-red-400 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
                                <h3 className="text-xs font-black text-red-400 uppercase tracking-wider">{locale === 'ur' ? 'باقی تنخواہ' : 'Pending Salary'}</h3>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-red-500">Rs {stats?.pending_salary?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                        <div className="bg-orange-500/10 p-5 rounded-3xl border border-orange-500/20 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div>
                                <h3 className="text-xs font-black text-orange-400 uppercase tracking-wider">{locale === 'ur' ? 'ایڈوانس' : 'Advances Given'}</h3>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-orange-500">Rs {stats?.advances_given?.toLocaleString() || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Workers List */}
                    <div className="bg-theme-card rounded-3xl shadow-sm border border-theme overflow-hidden">
                        <div className="p-4 border-b border-theme flex flex-col md:flex-row items-center gap-4 bg-theme-track">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                                <input type="text" placeholder={locale === 'ur' ? 'مزدور کا نام تلاش کریں...' : 'Search labour name...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-theme-card border border-theme rounded-2xl text-sm font-bold text-theme placeholder-theme focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" />
                            </div>
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-theme-track text-[10px] uppercase tracking-widest text-theme-muted font-black border-b border-theme">
                                        <th className="p-4">{locale === 'ur' ? 'مزدور' : 'Worker'}</th>
                                        <th className="p-4">{locale === 'ur' ? 'کام' : 'Type'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'دن' : 'Days'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'کل تنخواہ' : 'Total Salary'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'ادا شدہ' : 'Paid'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'باقی' : 'Remaining'}</th>
                                        <th className="p-4 text-center">{locale === 'ur' ? 'حالت' : 'Status'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme">
                                    {filteredLabours.map(l => (
                                        <tr key={l.id || l._id} onClick={() => handleSelectLabour(l)} className="hover:bg-theme-track cursor-pointer transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-theme-track flex items-center justify-center font-bold text-theme-muted uppercase shrink-0 overflow-hidden border border-theme">
                                                        {l.photo ? <img src={l.photo} className="w-full h-full object-cover" alt="" /> : l.name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-theme group-hover:text-orange-500 transition-colors">{l.name}</p>
                                                        <p className="text-[10px] font-bold text-theme-muted uppercase">{l.phone || 'No Phone'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-bold text-theme-muted">{l.work_type}</td>
                                            <td className="p-4 text-right text-sm font-bold text-theme-muted">{l.days_worked || 0}</td>
                                            <td className="p-4 text-right text-sm font-bold text-theme">Rs {l.salary_amount?.toLocaleString() || 0}</td>
                                            <td className="p-4 text-right text-sm font-bold text-green-500">Rs {l.total_paid?.toLocaleString() || 0}</td>
                                            <td className="p-4 text-right text-sm font-black text-red-500">Rs {l.balance?.toLocaleString() || 0}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${l.status === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-theme-track text-theme-muted border border-theme'}`}>
                                                    {l.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden flex flex-col divide-y divide-theme">
                            {filteredLabours.map(l => (
                                <div key={l.id || l._id} onClick={() => handleSelectLabour(l)} className="p-4 hover:bg-theme-track cursor-pointer active:bg-theme transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-theme-track flex items-center justify-center font-black text-theme-muted uppercase shrink-0 overflow-hidden border border-theme">
                                            {l.photo ? <img src={l.photo} className="w-full h-full object-cover" alt="" /> : l.name?.[0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-theme">{l.name}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${l.status === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-theme-track text-theme-muted border border-theme'}`}>
                                                    {l.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-theme-muted mt-0.5">{l.work_type}</p>
                                            <p className="text-xs font-bold mt-1">
                                                <span className="text-green-500">Paid: Rs {l.total_paid?.toLocaleString() || 0}</span>
                                                {' | '}
                                                <span className="text-red-500">Bal: Rs {l.balance?.toLocaleString() || 0}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-theme-muted" />
                                </div>
                            ))}
                        </div>

                        {filteredLabours.length === 0 && (
                            <div className="p-12 text-center text-theme-muted font-bold">
                                {locale === 'ur' ? 'کوئی ریکارڈ نہیں ملا۔' : 'No records found.'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Profile View */}
            {view === "profile" && selectedLabour && (
                <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <button onClick={() => { setView("dashboard"); fetchData(); }} className="flex items-center gap-2 text-theme-muted hover:text-theme font-bold mb-4 bg-theme-card px-4 py-2 rounded-xl shadow-sm border border-theme w-fit">
                        <ArrowUpRight className="w-5 h-5 rotate-[-135deg]" /> Back to Dashboard
                    </button>
                    
                    <div className="bg-theme-card rounded-3xl p-6 shadow-sm border border-theme">
                        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1 w-full">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-theme-track border-2 border-theme flex items-center justify-center text-4xl font-black text-theme-muted uppercase shrink-0 overflow-hidden shadow-xl">
                                    {selectedLabour.photo ? <img src={selectedLabour.photo} className="w-full h-full object-cover" alt="" /> : selectedLabour.name?.[0]}
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl sm:text-4xl font-black text-theme tracking-tight">{selectedLabour.name}</h2>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                                            <Volume2 className="w-3.5 h-3.5" /> {selectedLabour.work_type}
                                        </span>
                                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                                            <Banknote className="w-3.5 h-3.5" /> Rs {selectedLabour.salary_amount} / {selectedLabour.salary_type}
                                        </span>
                                        {selectedLabour.phone && (
                                            <a href={`tel:${selectedLabour.phone}`} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all">
                                                <Phone className="w-3.5 h-3.5" /> {selectedLabour.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!isDataEntry && (
                                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                                    <button onClick={() => setOpenAttendance(true)} className="flex-1 lg:flex-none bg-theme-card border-2 border-theme hover:border-orange-500 hover:text-orange-500 px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap">
                                        <Clock className="w-4 h-4" /> Mark Present
                                    </button>
                                    <button onClick={() => setOpenSlip(true)} className="flex-1 lg:flex-none bg-theme-card border-2 border-theme hover:border-blue-400 hover:text-blue-400 px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 whitespace-nowrap">
                                        <FileText className="w-4 h-4" /> Salary Slip
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-theme-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-theme shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[9px] sm:text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">Total Salary</p>
                            <p className="text-lg sm:text-2xl font-black text-theme">Rs {profileStats?.monthlySalary.toLocaleString()}</p>
                        </div>
                        <div className="bg-theme-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-theme shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[9px] sm:text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">Advance Taken</p>
                            <p className="text-lg sm:text-2xl font-black text-orange-500">Rs {profileStats?.totalAdvance.toLocaleString()}</p>
                        </div>
                        <div className="bg-theme-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-theme shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[9px] sm:text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">Salary Paid</p>
                            <p className="text-lg sm:text-2xl font-black text-green-500">Rs {profileStats?.totalSalaryPaid.toLocaleString()}</p>
                        </div>
                        <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border shadow-sm hover:shadow-md transition-shadow ${
                            profileStats?.balance && profileStats.balance < 0 ? 'bg-red-500/10 border-red-500/30' : 
                            profileStats?.balance && profileStats.balance > 0 ? 'bg-green-500/10 border-green-500/30' : 
                            'bg-theme-card border-theme'
                        }`}>
                            <p className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 ${
                                profileStats?.balance && profileStats.balance < 0 ? 'text-red-500' : 
                                profileStats?.balance && profileStats.balance > 0 ? 'text-green-600' : 
                                'text-theme-muted'
                            }`}>Balance</p>
                            <p className={`text-lg sm:text-2xl font-black ${
                                profileStats?.balance && profileStats.balance < 0 ? 'text-red-600' : 
                                profileStats?.balance && profileStats.balance > 0 ? 'text-green-500' : 
                                'text-theme'
                            }`}>
                                Rs {Math.abs(profileStats?.balance || 0).toLocaleString()}
                                {profileStats?.balance && profileStats.balance < 0 && <span className="text-[8px] sm:text-xs font-bold ml-1 sm:ml-2 opacity-80">(Overpaid)</span>}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Transaction History */}
                        <div className="bg-theme-card rounded-3xl border border-theme shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 sm:p-6 border-b border-theme bg-theme-track flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <h3 className="font-black text-theme text-sm sm:text-base uppercase tracking-widest flex items-center gap-2"><ListTodo className="w-5 h-5 text-theme-muted" /> Transactions</h3>
                                {!isDataEntry && (
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button onClick={() => setOpenTransaction({ type: 'salary', open: true })} className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white text-[10px] font-black px-3 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-500/20 flex items-center justify-center gap-1.5"><ArrowDownRight className="w-3.5 h-3.5" /> Pay Salary</button>
                                        <button onClick={() => setOpenTransaction({ type: 'advance', open: true })} className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black px-3 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5"><ArrowUpRight className="w-3.5 h-3.5" /> Give Advance</button>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                {selectedLabour.transactions?.map((t: any) => {
                                    const dateObj = new Date(t.date);
                                    const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                    return (
                                        <div key={t.id || t._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-theme-track rounded-2xl border border-theme group hover:border-theme-muted hover:shadow-md transition-all gap-4">
                                            <div className="flex items-start sm:items-center gap-4">
                                                <div className={`p-3 rounded-xl shrink-0 ${t.type === 'salary' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                    {t.type === 'salary' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-theme text-sm uppercase tracking-wider">{t.type}</p>
                                                    <p className="text-xs font-bold text-blue-500">{monthYear}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-theme-muted bg-theme-card px-2 py-0.5 rounded-md border border-theme">{dateObj.toLocaleDateString()}</span>
                                                        {t.transaction_id && <span className="text-[10px] font-mono text-theme-muted bg-theme-card px-2 py-0.5 rounded-md border border-theme">ID: {t.transaction_id}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="sm:text-right flex flex-col sm:items-end ml-14 sm:ml-0">
                                                <p className={`font-black text-lg ${t.type === 'salary' ? 'text-green-500' : 'text-orange-500'}`}>Rs {t.amount?.toLocaleString()}</p>
                                                {t.notes && <p className="text-[11px] font-bold text-theme-muted italic mt-1 line-clamp-2 max-w-[200px]">{t.notes}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!selectedLabour.transactions || selectedLabour.transactions.length === 0) && <p className="text-center py-10 text-theme-muted font-bold uppercase tracking-widest text-xs">No transactions yet</p>}
                            </div>
                        </div>

                        {/* Attendance History */}
                        <div className="bg-theme-card rounded-3xl border border-theme shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 sm:p-6 border-b border-theme bg-theme-track flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <h3 className="font-black text-theme text-sm sm:text-base uppercase tracking-widest flex items-center gap-2"><MapPin className="w-5 h-5 text-theme-muted" /> Attendance History</h3>
                            </div>
                            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                {selectedLabour.attendance?.map((a: any) => {
                                    const dateObj = new Date(a.date);
                                    const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                                    return (
                                        <div key={a.id || a._id} className="flex items-center justify-between p-4 bg-theme-track rounded-2xl border border-theme group hover:border-theme-muted hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl shrink-0 ${a.status === 'present' ? 'bg-emerald-500/10 text-emerald-500' : a.status === 'absent' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-400/10 text-yellow-500'}`}>
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-theme text-sm uppercase tracking-wider">{a.status}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-blue-500">{monthYear}</span>
                                                        <span className="text-theme-muted text-[10px]">•</span>
                                                        <span className="text-[10px] font-bold text-theme-muted">{dateObj.toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {a.overtime_hours && a.overtime_hours > 0 && (
                                                <div className="text-right">
                                                    <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 px-2 py-1 rounded-lg border border-blue-500/20">+{a.overtime_hours} hrs OT</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {(!selectedLabour.attendance || selectedLabour.attendance.length === 0) && <p className="text-center py-10 text-theme-muted font-bold uppercase tracking-widest text-xs">No attendance marked</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            <AddLabourModal open={openAddLabour} onClose={() => setOpenAddLabour(false)} onSave={() => { setOpenAddLabour(false); fetchData(); showToast('success', locale === 'ur' ? 'مزدور شامل کر دیا گیا' : 'Labour Added Successfully'); }} locale={locale} />
            <AddTransactionModal 
                open={openTransaction.open} 
                type={openTransaction.type} 
                labour={selectedLabour} 
                onClose={() => setOpenTransaction(prev => ({...prev, open: false}))} 
                onSave={() => { setOpenTransaction(prev => ({...prev, open: false})); handleSelectLabour(selectedLabour); showToast('success', 'Transaction recorded'); }} 
                locale={locale} 
            />
            <AttendanceModal 
                open={openAttendance} 
                labour={selectedLabour} 
                onClose={() => setOpenAttendance(false)} 
                onSave={() => { setOpenAttendance(false); handleSelectLabour(selectedLabour); showToast('success', 'Attendance marked'); }} 
                locale={locale} 
            />
            <SlipModal 
                open={openSlip} 
                labour={selectedLabour} 
                onClose={() => setOpenSlip(false)} 
                locale={locale} 
            />
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-theme-card border border-theme rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-theme-track border-b border-theme p-6 flex justify-between items-center text-theme">
                    <h2 className="text-xl font-black">{locale === 'ur' ? 'نیا مزدور شامل کریں' : 'Add New Labour'}</h2>
                    <button onClick={onClose} className="p-2 bg-theme border border-theme hover:bg-theme-hover rounded-xl transition-colors"><X className="w-5 h-5 text-theme-muted" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-black text-theme-muted uppercase mb-2">{locale === 'ur' ? 'پورا نام' : 'Full Name'}</label>
                        <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-2xl text-lg font-bold text-theme focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 placeholder-theme" placeholder="Ali Raza" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-theme-muted uppercase mb-2">{locale === 'ur' ? 'فون نمبر' : 'Phone Number'}</label>
                            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-2xl font-bold text-theme focus:outline-none focus:border-orange-500 placeholder-theme" placeholder="0300..." />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-theme-muted uppercase mb-2">CNIC</label>
                            <input type="text" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-2xl font-bold text-theme focus:outline-none focus:border-orange-500 placeholder-theme" placeholder="Optional" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-theme-muted uppercase mb-2">{locale === 'ur' ? 'کام کی قسم' : 'Work Type'}</label>
                            <select value={form.work_type} onChange={e => setForm({...form, work_type: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-2xl font-bold text-theme focus:outline-none focus:border-orange-500 appearance-none">
                                <option className="bg-theme-card">Helper</option>
                                <option className="bg-theme-card">Mason</option>
                                <option className="bg-theme-card">Driver</option>
                                <option className="bg-theme-card">Guard</option>
                                <option className="bg-theme-card">Plumber</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-theme-muted uppercase mb-2">{locale === 'ur' ? 'تنخواہ کی قسم' : 'Salary Type'}</label>
                            <select value={form.salary_type} onChange={e => setForm({...form, salary_type: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-2xl font-bold text-theme focus:outline-none focus:border-orange-500 appearance-none">
                                <option value="daily" className="bg-theme-card">{locale === 'ur' ? 'روزانہ (Daily)' : 'Daily Wage'}</option>
                                <option value="monthly" className="bg-theme-card">{locale === 'ur' ? 'ماہانہ (Monthly)' : 'Monthly Salary'}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-theme-muted uppercase mb-2">{locale === 'ur' ? 'رقم' : 'Base Salary Amount'}</label>
                        <input required type="number" value={form.salary_amount} onChange={e => setForm({...form, salary_amount: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-2xl text-xl font-black text-orange-600 focus:outline-none focus:border-orange-500 placeholder-theme" placeholder="Rs" />
                    </div>
                    <button type="submit" disabled={saving} className="w-full bg-green-500 hover:bg-green-600 text-white p-5 rounded-2xl font-black text-xl shadow-xl shadow-green-500/20 active:scale-95 transition-all mt-4 flex justify-center items-center gap-2">
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle className="w-6 h-6" /> Save Worker</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

function AddTransactionModal({ open, type, labour, onClose, onSave, locale }: any) {
    if (!open || !labour) return null;
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] });

    const title = type === 'salary' ? (locale === 'ur' ? 'تنخواہ کی ادائیگی' : 'Pay Salary') : (locale === 'ur' ? 'ایڈوانس کی ادائیگی' : 'Give Advance');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.addTransaction(labour.id || labour._id, { ...form, type });
            onSave();
        } catch (err: any) {
            alert(err.message);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-theme-card border border-theme rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-theme-track border-b border-theme p-6 flex justify-between items-center text-theme">
                    <h2 className="text-xl font-black tracking-tight">{title}</h2>
                    <button onClick={onClose} className="p-2 bg-theme border border-theme hover:bg-theme-hover rounded-xl transition-colors"><X className="w-5 h-5 text-theme-muted" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-black text-theme-muted uppercase mb-2">{locale === 'ur' ? 'رقم' : 'Amount'}</label>
                        <input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-2xl text-2xl font-black text-theme focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 placeholder-theme" placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-theme-muted uppercase mb-2">{locale === 'ur' ? 'تاریخ' : 'Date'}</label>
                        <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-2xl font-bold text-theme focus:outline-none focus:border-green-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-theme-muted uppercase mb-2">{locale === 'ur' ? 'تفصیل' : 'Notes / Details'}</label>
                        <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-2xl font-bold text-theme focus:outline-none focus:border-green-500 placeholder-theme" placeholder="..." />
                    </div>
                    <button type="submit" disabled={saving} className="w-full bg-green-500 hover:bg-green-600 text-white p-5 rounded-2xl font-black text-xl shadow-xl shadow-green-500/20 active:scale-95 transition-all mt-4">
                        {saving ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Confirm Transaction'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function AttendanceModal({ open, labour, onClose, onSave, locale }: any) {
    if (!open || !labour) return null;
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const mark = async (status: string) => {
        setSaving(true);
        try {
            await api.markAttendance(labour.id || labour._id, { date, status });
            onSave();
        } catch (err: any) {
            alert(err.message);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-theme-card border border-theme rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-theme-track border-b border-theme p-6 flex justify-between items-center text-theme">
                    <h2 className="text-xl font-black tracking-tight">{locale === 'ur' ? 'حاضری' : 'Attendance'} - {labour?.name}</h2>
                    <button onClick={onClose} className="p-2 bg-theme border border-theme hover:bg-theme-hover rounded-xl transition-colors"><X className="w-5 h-5 text-theme-muted" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-theme-muted uppercase mb-2">{locale === 'ur' ? 'تاریخ' : 'Date'}</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-theme-track border border-theme p-4 rounded-2xl font-bold text-theme focus:outline-none focus:border-orange-500" />
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

    // Recalculate stats based on client rules
    const monthlySalary = Number(labour.salary_amount) || 0;
    const totalAdvance = (labour.transactions || []).reduce((sum: number, t: any) => t.type === 'advance' ? sum + (Number(t.amount) || 0) : sum, 0);
    const totalSalaryPaid = (labour.transactions || []).reduce((sum: number, t: any) => t.type === 'salary' ? sum + (Number(t.amount) || 0) : sum, 0);
    const balance = monthlySalary - (totalAdvance + totalSalaryPaid);
    const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl bg-theme-card border border-theme rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-theme bg-theme-track shrink-0">
                    <h2 className="text-xl font-black text-theme flex items-center gap-2"><FileText className="w-6 h-6 text-theme-muted" /> Salary Slip Preview</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20"><Printer className="w-4 h-4" /> Print PDF</button>
                        <button onClick={onClose} className="p-2 hover:bg-theme-track rounded-xl transition-colors"><X className="w-5 h-5 text-theme-muted" /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-theme">
                    <div id="payment-slip" className="border-2 border-slate-900 p-8 min-h-[600px] flex flex-col bg-white text-slate-900">
                        <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between">
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter">Mashori Farm</h1>
                                <p className="text-sm font-bold text-slate-500">Official Labour Payment Slip</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Month</p>
                                <p className="text-sm font-black text-blue-600">{currentMonthYear}</p>
                                <p className="text-[10px] text-slate-400 mt-1">Generated: {new Date().toLocaleDateString()}</p>
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
                                        <td className="py-4 font-black text-slate-500 uppercase text-xs tracking-widest">Total Salary</td>
                                        <td className="py-4 text-right font-black text-xl">Rs {monthlySalary.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 font-black text-slate-500 uppercase text-xs tracking-widest">Advance Taken</td>
                                        <td className="py-4 text-right font-black text-xl text-orange-500">Rs {totalAdvance.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="py-4 font-black text-slate-500 uppercase text-xs tracking-widest">Salary Paid</td>
                                        <td className="py-4 text-right font-black text-xl text-green-600">Rs {totalSalaryPaid.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-auto border-t-2 border-slate-900 pt-6 flex justify-between items-end">
                            <div className={`${balance < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} px-6 py-4 rounded-2xl border ${balance < 0 ? 'border-red-100' : 'border-emerald-100'}`}>
                                <p className="text-xs font-black uppercase tracking-widest mb-1">Final Balance</p>
                                <p className="text-3xl font-black">Rs {Math.abs(balance).toLocaleString()} {balance < 0 ? '(Negative)' : ''}</p>
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
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-theme"><Loader2 className="w-12 h-12 animate-spin text-orange-500" /></div>}>
            <LaborDashboard />
        </Suspense>
    );
}
