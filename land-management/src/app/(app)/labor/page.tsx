"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import {
    Users, Plus, Loader2, Search, MapPin, CheckCircle,
    AlertCircle, X, FileText, Printer, Phone, Volume2, Clock, Banknote, ListTodo,
    ArrowUpRight, ArrowDownRight, ChevronRight, Download, Calendar, Filter
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
    const [viewStartDate, setViewStartDate] = useState<string>("");
    const [viewEndDate, setViewEndDate] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);

    // Modal States
    const [openAddLabour, setOpenAddLabour] = useState(false);
    const [openTransaction, setOpenTransaction] = useState<{ type: 'salary' | 'advance', open: boolean }>({ type: 'salary', open: false });
    const [openAttendance, setOpenAttendance] = useState(false);
    const [openSlip, setOpenSlip] = useState(false);

    // Export Range
    const [exportStartDate, setExportStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [exportEndDate, setExportEndDate] = useState<string>(new Date().toISOString().split("T")[0]);

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

    const isFilterActive = useMemo(() => {
        return !!viewStartDate || !!viewEndDate || !!searchTerm;
    }, [viewStartDate, viewEndDate, searchTerm]);

    const getDaysInRange = (labour: Labour, startStr: string, endStr: string) => {
        if (!startStr || !endStr) return labour.days_worked ?? 0;
        const start = new Date(startStr);
        const end = new Date(endStr);
        let count = 0;
        (labour.attendance || []).forEach((a: any) => {
            const d = new Date(a.date);
            if (d >= start && d <= end) {
                if (a.status === 'present') count += 1;
                else if (a.status === 'half_day') count += 0.5;
            }
        });
        return count;
    };

    const filteredLabours = useMemo(() => {
        if (!isFilterActive) return labours; 
        return labours.filter(l => {
            const matchesName = l.name?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesName) return false;
            
            if (viewStartDate && viewEndDate) {
                const start = new Date(viewStartDate);
                const end = new Date(viewEndDate);
                const hasAttendanceInRange = (l.attendance || []).some((a: any) => {
                    const d = new Date(a.date);
                    return d >= start && d <= end;
                });
                const hasTransactionsInRange = (l.transactions || []).some((t: any) => {
                    const d = new Date(t.date);
                    return d >= start && d <= end;
                });
                return hasAttendanceInRange || hasTransactionsInRange;
            }
            return true;
        });
    }, [labours, searchTerm, viewStartDate, viewEndDate, isFilterActive]);

    const dynamicStats = useMemo(() => {
        const list = filteredLabours;
        if (!isFilterActive) return stats;
        
        let totalPaid = 0;
        let totalSalary = 0;
        let advances = 0;

        list.forEach(l => {
            const days = getDaysInRange(l, viewStartDate, viewEndDate);
            const baseRate = Number(l.salary_amount) || 0;
            const periodSalary = l.salary_type === 'daily' ? days * baseRate : baseRate;
            
            const start = viewStartDate ? new Date(viewStartDate) : null;
            const end = viewEndDate ? new Date(viewEndDate) : null;
            const filterByDate = (dateStr: string) => {
                if (!start || !end) return true;
                const d = new Date(dateStr);
                return d >= start && d <= end;
            };

            const periodPaid = (l.transactions || []).filter((t: any) => t.type === 'salary' && filterByDate(t.date)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const periodAdvance = (l.transactions || []).filter((t: any) => t.type === 'advance' && filterByDate(t.date)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

            totalSalary += periodSalary;
            totalPaid += periodPaid;
            advances += periodAdvance;
        });

        return {
            total_labour: list.length,
            active_labour: list.filter(l => l.status === 'Active').length,
            inactive_labour: list.filter(l => l.status !== 'Active').length,
            total_paid_overall: totalPaid,
            paid_this_month: totalPaid,
            pending_salary: Math.max(0, totalSalary - (totalPaid + advances)),
            advances_given: advances,
        };
    }, [filteredLabours, stats, isFilterActive, viewStartDate, viewEndDate]);

    const profileStats = useMemo(() => {
        if (!selectedLabour) return null;
        const days = getDaysInRange(selectedLabour, viewStartDate, viewEndDate);
        const baseRate = Number(selectedLabour.salary_amount) || 0;
        const totalSalary = selectedLabour.salary_type === 'daily' ? days * baseRate : baseRate;
        
        const start = viewStartDate ? new Date(viewStartDate) : null;
        const end = viewEndDate ? new Date(viewEndDate) : null;
        const filterByDate = (dateStr: string) => {
            if (!start || !end) return true;
            const d = new Date(dateStr);
            return d >= start && d <= end;
        };

        const totalAdvance = (selectedLabour.transactions || []).filter((t: any) => t.type === 'advance' && filterByDate(t.date)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const totalSalaryPaid = (selectedLabour.transactions || []).filter((t: any) => t.type === 'salary' && filterByDate(t.date)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const balance = totalSalary - (totalAdvance + totalSalaryPaid);

        return { totalSalary, totalAdvance, totalSalaryPaid, balance, days };
    }, [selectedLabour, viewStartDate, viewEndDate]);

    const handleExport = () => {
        const start = exportStartDate;
        const end = exportEndDate;
        if (!start || !end) return;

        const data = labours.map(l => {
            const days = getDaysInRange(l, start, end);
            const baseRate = Number(l.salary_amount) || 0;
            const totalSalary = l.salary_type === 'daily' ? days * baseRate : baseRate;
            
            const rangeStart = new Date(start);
            const rangeEnd = new Date(end);
            const txs = (l.transactions || []).filter((t: any) => {
                const d = new Date(t.date);
                return d >= rangeStart && d <= rangeEnd;
            });

            const paid = txs.filter((t: any) => t.type === 'salary').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const advances = txs.filter((t: any) => t.type === 'advance').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
            const balance = totalSalary - (paid + advances);

            return {
                "Worker Name": l.name,
                "Work Type": l.work_type,
                "Period": `${start} to ${end}`,
                "Days Worked": days,
                "Salary Rate": baseRate,
                "Period Salary": totalSalary,
                "Paid": paid,
                "Advance": advances,
                "Balance": balance,
                "Status": l.status
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "LabourRecords");
        XLSX.writeFile(wb, `Labour_Report_${start}_to_${end}.xlsx`);
        showToast('success', 'Excel Report Downloaded');
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-theme text-theme"><Loader2 className="w-12 h-12 animate-spin text-orange-500" /></div>;
    }

    return (
        <div className="min-h-screen bg-theme pb-20 text-theme">
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-theme-card p-6 rounded-3xl shadow-sm border border-theme">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                                <Users className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-theme tracking-tight">{locale === 'ur' ? 'لیبر مینجمنٹ' : 'Labour Management'}</h1>
                                <p className="text-theme-muted font-medium text-sm flex items-center gap-1">{locale === 'ur' ? 'مزدوروں کا مکمل حساب کتاب' : 'Complete worker tracking'}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                            <div className="flex bg-theme-track p-1 rounded-2xl border border-theme">
                                <button onClick={() => { const today = new Date().toISOString().split("T")[0]; setViewStartDate(today); setViewEndDate(today); }} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewStartDate === new Date().toISOString().split("T")[0] ? "bg-orange-500 text-white shadow-lg" : "text-theme-muted hover:text-theme"}`}>TODAY</button>
                                {isFilterActive && <button onClick={() => { setViewStartDate(""); setViewEndDate(""); setSearchTerm(""); }} className="px-4 py-2 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-500/10 transition-all">CLEAR</button>}
                            </div>
                            {!isDataEntry && (
                                <button onClick={() => setOpenAddLabour(true)} className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-95">
                                    <Plus className="w-5 h-5" /> {locale === 'ur' ? 'نیا مزدور' : 'Add Labour'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-theme-card p-4 rounded-3xl border border-theme shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted group-focus-within:text-orange-500 transition-colors" />
                            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={locale === 'ur' ? 'مزدور تلاش کریں...' : 'Search worker name...'} className="w-full pl-12 pr-4 py-3 bg-theme-track border border-theme rounded-2xl text-sm font-bold text-theme focus:outline-none focus:border-orange-500 transition-all" />
                        </div>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                            <input type="date" value={viewStartDate} onChange={e => setViewStartDate(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-theme-track border border-theme rounded-2xl text-sm font-bold text-theme focus:outline-none focus:border-orange-500 transition-all" />
                            {!viewStartDate && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-theme-muted uppercase tracking-widest pointer-events-none">From</span>}
                        </div>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                            <input type="date" value={viewEndDate} onChange={e => setViewEndDate(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-theme-track border border-theme rounded-2xl text-sm font-bold text-theme focus:outline-none focus:border-orange-500 transition-all" />
                            {!viewEndDate && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-theme-muted uppercase tracking-widest pointer-events-none">To</span>}
                        </div>
                    </div>

                    <div className="bg-theme-track/30 p-4 rounded-3xl border border-theme border-dashed flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl"><FileText className="w-5 h-5" /></div>
                            <div><p className="text-[10px] font-black text-theme-muted uppercase tracking-widest leading-none mb-1">Detailed Report</p><p className="text-xs font-bold text-theme">Excel Export for any period</p></div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-theme-card border border-theme rounded-xl px-3 py-1.5 flex-1 md:flex-none">
                                <span className="text-[9px] font-black text-theme-muted uppercase">From:</span>
                                <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="bg-transparent text-[11px] font-bold text-theme focus:outline-none" />
                            </div>
                            <div className="flex items-center gap-2 bg-theme-card border border-theme rounded-xl px-3 py-1.5 flex-1 md:flex-none">
                                <span className="text-[9px] font-black text-theme-muted uppercase">To:</span>
                                <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="bg-transparent text-[11px] font-bold text-theme focus:outline-none" />
                            </div>
                            <button onClick={handleExport} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-500/20 transition-all"><Download className="w-4 h-4" /> Export</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-theme-card p-5 rounded-3xl border border-theme shadow-sm flex flex-col justify-between hover:border-orange-500/30 transition-all">
                            <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl"><Users className="w-5 h-5" /></div><h3 className="text-xs font-black text-theme-muted uppercase tracking-wider">{locale === 'ur' ? 'کل مزدور' : 'Total Labour'}</h3></div>
                            <div><p className="text-3xl font-black text-theme">{dynamicStats?.total_labour || 0}</p><p className="text-[10px] font-bold text-green-500 mt-1">{dynamicStats?.active_labour || 0} Active • {dynamicStats?.inactive_labour || 0} Inactive</p></div>
                        </div>
                        <div className="bg-theme-card p-5 rounded-3xl border border-theme shadow-sm flex flex-col justify-between hover:border-orange-500/30 transition-all">
                            <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><Banknote className="w-5 h-5" /></div><h3 className="text-xs font-black text-theme-muted uppercase tracking-wider">{isFilterActive ? 'Period Paid' : (locale === 'ur' ? 'ادائیگی' : 'Total Paid')}</h3></div>
                            <div><p className="text-2xl font-black text-theme">Rs {dynamicStats?.total_paid_overall?.toLocaleString() || 0}</p><p className="text-[10px] font-bold text-theme-muted mt-1">{isFilterActive ? 'Range Total' : `This Month: Rs ${dynamicStats?.paid_this_month?.toLocaleString() || 0}`}</p></div>
                        </div>
                        <div className="bg-red-500/10 p-5 rounded-3xl border border-red-500/20 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-red-500/20 text-red-400 rounded-xl"><AlertCircle className="w-5 h-5" /></div><h3 className="text-xs font-black text-red-400 uppercase tracking-wider">{isFilterActive ? 'Period Payable' : (locale === 'ur' ? 'باقی تنخواہ' : 'Pending Salary')}</h3></div>
                            <div><p className="text-3xl font-black text-red-500">Rs {dynamicStats?.pending_salary?.toLocaleString() || 0}</p></div>
                        </div>
                        <div className="bg-orange-500/10 p-5 rounded-3xl border border-orange-500/20 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div><h3 className="text-xs font-black text-orange-400 uppercase tracking-wider">{isFilterActive ? 'Period Advance' : (locale === 'ur' ? 'ایڈوانس' : 'Advances Given')}</h3></div>
                            <div><p className="text-3xl font-black text-orange-500">Rs {dynamicStats?.advances_given?.toLocaleString() || 0}</p></div>
                        </div>
                    </div>

                    <div className="bg-theme-card rounded-3xl shadow-sm border border-theme overflow-hidden">
                        <div className="p-4 border-b border-theme flex items-center justify-between bg-theme-track">
                            <h2 className="text-sm font-black text-theme uppercase tracking-widest flex items-center gap-2"><Users className="w-4 h-4 text-orange-500" /> Worker Records <span className="px-2 py-0.5 rounded-lg bg-theme-card border border-theme text-[10px] text-theme-muted font-black">{filteredLabours.length}</span></h2>
                        </div>
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
                                    {filteredLabours.map(l => {
                                        const d = getDaysInRange(l, viewStartDate, viewEndDate);
                                        const r = Number(l.salary_amount) || 0;
                                        const s = l.salary_type === 'daily' ? d * r : r;
                                        const p = (l.total_paid || 0);
                                        return (
                                            <tr key={l.id || l._id} onClick={() => handleSelectLabour(l)} className="hover:bg-theme-track cursor-pointer transition-colors group text-theme">
                                                <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-theme-track flex items-center justify-center font-bold text-theme-muted uppercase shrink-0 border border-theme overflow-hidden">{l.photo ? <img src={l.photo} className="w-full h-full object-cover" alt="" /> : l.name?.[0]}</div><div><p className="font-bold text-theme group-hover:text-orange-500 transition-colors">{l.name}</p><p className="text-[10px] font-bold text-theme-muted">{l.phone}</p></div></div></td>
                                                <td className="p-4 text-sm font-bold text-theme-muted">{l.work_type}</td>
                                                <td className="p-4 text-right text-sm font-bold text-theme-muted">{d}</td>
                                                <td className="p-4 text-right text-sm font-bold text-theme">Rs {s.toLocaleString()}</td>
                                                <td className="p-4 text-right text-sm font-bold text-green-500">Rs {p.toLocaleString()}</td>
                                                <td className="p-4 text-right text-sm font-black text-red-500">Rs {(s - p).toLocaleString()}</td>
                                                <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${l.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-theme-track text-theme-muted'}`}>{l.status}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="md:hidden flex flex-col divide-y divide-theme">
                            {filteredLabours.map(l => {
                                const d = getDaysInRange(l, viewStartDate, viewEndDate);
                                const r = Number(l.salary_amount) || 0;
                                const s = l.salary_type === 'daily' ? d * r : r;
                                const p = (l.total_paid || 0);
                                const bal = s - p;
                                return (
                                    <div key={l.id || l._id} onClick={() => handleSelectLabour(l)} className="p-4 hover:bg-theme-track active:bg-theme-track transition-colors flex flex-col gap-4 text-theme">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-theme-track flex items-center justify-center font-black border border-theme overflow-hidden">{l.photo ? <img src={l.photo} className="w-full h-full object-cover" alt="" /> : l.name?.[0]}</div>
                                                <div><p className="font-black text-theme">{l.name}</p><p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">{l.work_type} • {l.salary_type}</p></div>
                                            </div>
                                            <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${l.status === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-theme-track text-theme-muted'}`}>{l.status}</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-theme-track/50 p-2 rounded-xl"><p className="text-[8px] font-black text-theme-muted uppercase mb-1">Days</p><p className="text-xs font-black">{d}</p></div>
                                            <div className="bg-theme-track/50 p-2 rounded-xl"><p className="text-[8px] font-black text-theme-muted uppercase mb-1">Salary</p><p className="text-xs font-black">Rs {s}</p></div>
                                            <div className={`${bal > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'} p-2 rounded-xl`}><p className="text-[8px] font-black opacity-60 uppercase mb-1">Bal</p><p className="text-xs font-black">Rs {bal}</p></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {filteredLabours.length === 0 && <div className="p-12 text-center text-theme-muted font-bold uppercase tracking-widest text-xs">No records found</div>}
                    </div>
                </div>
            )}



            {view === "profile" && selectedLabour && (
                <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
                    <button onClick={() => { setView("dashboard"); fetchData(); }} className="flex items-center gap-2 text-theme-muted hover:text-theme font-bold bg-theme-card px-4 py-2 rounded-xl border border-theme">
                        <ArrowUpRight className="w-5 h-5 rotate-[-135deg]" /> Back to Dashboard
                    </button>
                    
                    <div className="bg-theme-card rounded-3xl p-6 shadow-sm border border-theme">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="flex flex-col sm:flex-row items-center gap-6 flex-1 w-full text-theme">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-theme-track border-2 border-theme flex items-center justify-center text-4xl font-black shrink-0 overflow-hidden">{selectedLabour.photo ? <img src={selectedLabour.photo} className="w-full h-full object-cover" alt="" /> : selectedLabour.name?.[0]}</div>
                                <div className="space-y-3"><h2 className="text-3xl font-black">{selectedLabour.name}</h2><div className="flex flex-wrap gap-2"><span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">{selectedLabour.work_type}</span><span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">Rs {selectedLabour.salary_amount} / {selectedLabour.salary_type}</span></div></div>
                            </div>
                            {!isDataEntry && (
                                <div className="flex gap-2 w-full lg:w-auto">
                                    <button onClick={() => setOpenAttendance(true)} className="flex-1 lg:flex-none bg-theme-card border border-theme hover:text-orange-500 px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm">Mark Present</button>
                                    <button onClick={() => setOpenSlip(true)} className="flex-1 lg:flex-none bg-theme-card border border-theme hover:text-blue-400 px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm">Salary Slip</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-sm"><p className="text-[10px] font-black text-theme-muted uppercase mb-1">Period Days</p><p className="text-2xl font-black text-blue-500">{profileStats?.days} Days</p></div>
                        <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-sm"><p className="text-[10px] font-black text-theme-muted uppercase mb-1">Period Salary</p><p className="text-2xl font-black text-theme">Rs {profileStats?.totalSalary.toLocaleString()}</p></div>
                        <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-sm"><p className="text-[10px] font-black text-theme-muted uppercase mb-1">Advance Taken</p><p className="text-2xl font-black text-orange-500">Rs {profileStats?.totalAdvance.toLocaleString()}</p></div>
                        <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-sm"><p className="text-[10px] font-black text-theme-muted uppercase mb-1">Salary Paid</p><p className="text-2xl font-black text-green-500">Rs {profileStats?.totalSalaryPaid.toLocaleString()}</p></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-theme-card rounded-3xl border border-theme shadow-sm overflow-hidden h-fit">
                            <div className="p-6 border-b border-theme bg-theme-track flex justify-between items-center"><h3 className="font-black text-theme text-sm uppercase tracking-widest flex items-center gap-2">Transactions</h3>{!isDataEntry && <div className="flex gap-2"><button onClick={() => setOpenTransaction({ type: 'salary', open: true })} className="bg-green-500 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all shadow-lg shadow-green-500/20">Pay Salary</button><button onClick={() => setOpenTransaction({ type: 'advance', open: true })} className="bg-orange-500 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all shadow-lg shadow-orange-500/20">Give Advance</button></div>}</div>
                            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                {selectedLabour.transactions?.map((t: any) => (
                                    <div key={t.id || t._id} className="flex justify-between p-4 bg-theme-track rounded-2xl border border-theme text-theme text-sm">
                                        <div><p className="font-black uppercase">{t.type}</p><p className="text-[10px] font-bold text-theme-muted">{new Date(t.date).toLocaleDateString()}</p></div>
                                        <p className={`font-black ${t.type === 'salary' ? 'text-green-500' : 'text-orange-500'}`}>Rs {t.amount?.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-theme-card rounded-3xl border border-theme shadow-sm overflow-hidden h-fit">
                            <div className="p-6 border-b border-theme bg-theme-track"><h3 className="font-black text-theme text-sm uppercase tracking-widest">Attendance History</h3></div>
                            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                {selectedLabour.attendance?.map((a: any) => (
                                    <div key={a.id || a._id} className="flex justify-between p-4 bg-theme-track rounded-2xl border border-theme text-theme text-sm">
                                        <div><p className="font-black uppercase">{a.status}</p><p className="text-[10px] font-bold text-theme-muted">{new Date(a.date).toLocaleDateString()}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <AddLabourModal open={openAddLabour} onClose={() => setOpenAddLabour(false)} onSave={() => { setOpenAddLabour(false); fetchData(); showToast('success', 'Labour Added'); }} locale={locale} />
            <AddTransactionModal open={openTransaction.open} type={openTransaction.type} labour={selectedLabour} onClose={() => setOpenTransaction(prev => ({...prev, open: false}))} onSave={() => { setOpenTransaction(prev => ({...prev, open: false})); handleSelectLabour(selectedLabour); showToast('success', 'Transaction saved'); }} locale={locale} />
            <AttendanceModal open={openAttendance} labour={selectedLabour} onClose={() => setOpenAttendance(false)} onSave={() => { setOpenAttendance(false); handleSelectLabour(selectedLabour); showToast('success', 'Attendance marked'); }} locale={locale} />
            <SlipModal open={openSlip} labour={selectedLabour} onClose={() => setOpenSlip(false)} />
        </div>
    );
}

function AddLabourModal({ open, onClose, onSave, locale }: any) {
    if (!open) return null;
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', cnic: '', work_type: 'Helper', salary_type: 'daily', salary_amount: '' });
    const handleSubmit = async (e: any) => { e.preventDefault(); setSaving(true); try { await api.addLabour(form); onSave(); } catch (err: any) { alert(err.message); } setSaving(false); };
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-theme-card border border-theme rounded-3xl shadow-2xl p-6 text-theme">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">{locale === 'ur' ? 'نیا مزدور' : 'Add Labour'}</h2><button onClick={onClose}><X /></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme" />
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme" />
                        <select value={form.work_type} onChange={e => setForm({...form, work_type: e.target.value})} className="bg-theme-track border border-theme p-4 rounded-xl text-theme"><option>Helper</option><option>Mason</option><option>Driver</option></select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <select value={form.salary_type} onChange={e => setForm({...form, salary_type: e.target.value})} className="bg-theme-track border border-theme p-4 rounded-xl text-theme"><option value="daily">Daily</option><option value="monthly">Monthly</option></select>
                        <input required type="number" placeholder="Amount" value={form.salary_amount} onChange={e => setForm({...form, salary_amount: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme" />
                    </div>
                    <button disabled={saving} className="w-full bg-green-500 text-white p-5 rounded-xl font-black uppercase">{saving ? 'Saving...' : 'Save Worker'}</button>
                </form>
            </div>
        </div>
    );
}

function AddTransactionModal({ open, type, labour, onClose, onSave, locale }: any) {
    if (!open || !labour) return null;
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] });
    const handleSubmit = async (e: any) => { e.preventDefault(); setSaving(true); try { await api.addTransaction(labour.id || labour._id, { ...form, type }); onSave(); } catch (err: any) { alert(err.message); } setSaving(false); };
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-theme-card border border-theme rounded-3xl p-6 text-theme">
                <div className="flex justify-between items-center mb-6"><h2 className="font-black uppercase">{type}</h2><button onClick={onClose}><X /></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme text-2xl font-black" />
                    <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme" />
                    <button disabled={saving} className="w-full bg-green-500 text-white p-5 rounded-xl font-black uppercase">Confirm</button>
                </form>
            </div>
        </div>
    );
}

function AttendanceModal({ open, labour, onClose, onSave, locale }: any) {
    if (!open || !labour) return null;
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const mark = async (status: string) => { setSaving(true); try { await api.markAttendance(labour.id || labour._id, { date, status }); onSave(); } catch (err: any) { alert(err.message); } setSaving(false); };
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-theme-card border border-theme rounded-3xl p-6 text-theme text-center">
                <h2 className="font-black mb-6">Mark Attendance</h2>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme mb-6" />
                <div className="grid grid-cols-2 gap-4"><button onClick={() => mark('present')} className="bg-emerald-500 text-white p-5 rounded-xl font-black uppercase">Present</button><button onClick={() => mark('absent')} className="bg-red-500 text-white p-5 rounded-xl font-black uppercase">Absent</button></div>
            </div>
        </div>
    );
}

function SlipModal({ open, onClose, labour }: any) {
    if (!open || !labour) return null;
    const monthlySalary = Number(labour.salary_amount) || 0;
    const totalAdvance = (labour.transactions || []).reduce((sum: number, t: any) => t.type === 'advance' ? sum + (Number(t.amount) || 0) : sum, 0);
    const totalSalaryPaid = (labour.transactions || []).reduce((sum: number, t: any) => t.type === 'salary' ? sum + (Number(t.amount) || 0) : sum, 0);
    const balance = monthlySalary - (totalAdvance + totalSalaryPaid);
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white p-10 text-slate-900 border-4 border-double border-slate-900">
                <div className="text-center border-b-2 border-slate-900 pb-4 mb-6"><h1 className="text-3xl font-black uppercase">Mashori Farm</h1><p className="text-sm font-bold uppercase">Salary Slip</p></div>
                <div className="mb-6"><p><strong>Worker:</strong> {labour.name}</p><p><strong>Month:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p></div>
                <table className="w-full border-collapse mb-10"><tbody className="divide-y divide-slate-300">
                    <tr><td className="py-2 font-bold uppercase text-xs">Total Salary</td><td className="py-2 text-right font-black">Rs {monthlySalary.toLocaleString()}</td></tr>
                    <tr><td className="py-2 font-bold uppercase text-xs">Advance</td><td className="py-2 text-right font-black text-red-600">- Rs {totalAdvance.toLocaleString()}</td></tr>
                    <tr><td className="py-2 font-bold uppercase text-xs">Paid</td><td className="py-2 text-right font-black text-emerald-600">- Rs {totalSalaryPaid.toLocaleString()}</td></tr>
                    <tr className="border-t-2 border-slate-900"><td className="py-4 font-black uppercase text-sm">Balance</td><td className="py-4 text-right font-black text-xl">Rs {balance.toLocaleString()}</td></tr>
                </tbody></table>
                <div className="mt-20 border-t border-slate-400 pt-2 w-48 text-center text-[10px] font-bold uppercase">Manager Signature</div>
                <button onClick={onClose} className="mt-10 w-full bg-slate-900 text-white p-3 font-black uppercase print:hidden">Close Preview</button>
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
