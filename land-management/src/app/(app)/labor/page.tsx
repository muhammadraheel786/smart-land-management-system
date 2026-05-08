"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Users, Plus, Loader2, CheckCircle,
    AlertCircle, X, Printer, Banknote,
    ArrowUpRight, Download, FileText,
    Phone, Calendar
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
    salary_start_date?: string;
    status: string;
    total_salary?: number;
    total_paid?: number;
    balance?: number;
    days_worked?: number;
    photo?: string;
    transactions?: Transaction[];
    attendance?: Attendance[];
}

interface LabourDashboardStats {
    total_labour: number;
    active_labour: number;
    inactive_labour: number;
    total_paid_overall: number;
    paid_this_month: number;
    pending_salary: number;
    advances_given: number;
}

function LaborDashboard() {
    const { isDataEntry } = useAuth();
    const { locale } = useLocale();

    // Data State
    const [labours, setLabours] = useState<Labour[]>([]);
    const [stats, setStats] = useState<LabourDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    // View State
    const [view, setView] = useState<"dashboard" | "profile">("dashboard");
    const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);

    // Modal States
    const [openAddLabour, setOpenAddLabour] = useState(false);
    const [openTransaction, setOpenTransaction] = useState<{ type: 'salary' | 'advance', open: boolean }>({ type: 'salary', open: false });
    const [openAttendance, setOpenAttendance] = useState(false);
    const [openSlip, setOpenSlip] = useState(false);

    // Month-Year Filter for Profile View
    const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Month-Year Filter for Dashboard (makes it dynamic)
    const [dashboardMonthYear, setDashboardMonthYear] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const getPeriodStats = (labour: Labour, monthYear: string) => {
        const baseRate = Number(labour.salary_amount) || 0;
        const isAllTime = !monthYear;
        const [filterYear, filterMonth] = isAllTime ? [0, 0] : monthYear.split('-').map(Number);

        const inMonth = (dateStr: string) => {
            if (isAllTime) return true;
            const d = new Date(dateStr);
            return d.getFullYear() === filterYear && d.getMonth() + 1 === filterMonth;
        };

        const monthAttendance = (labour.attendance || []).filter(a => inMonth(a.date));
        let days = 0;
        monthAttendance.forEach((a: Attendance) => {
            if (a.status === 'present') days += 1;
            else if (a.status === 'half_day') days += 0.5;
        });

        let salary = 0;
        if (labour.salary_type === 'daily') {
            salary = days * baseRate;
        } else {
            if (isAllTime) {
                // All-time: use stored total_salary or calculate from stored days
                salary = Number(labour.total_salary) || baseRate;
            } else {
                salary = baseRate; // Monthly: full month salary
            }
        }

        const monthTxs = (labour.transactions || []).filter(t => inMonth(t.date));
        const paid = monthTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        // Auto-advance: if paid exceeds salary, excess is advance
        const advance = paid > salary ? paid - salary : 0;
        const effectivePaid = paid > salary ? salary : paid;
        const balance = salary - effectivePaid;

        return { days, salary, paid, advance, balance, monthAttendance, monthTxs };
    };

    const dashboardMonthStats = useMemo(() => {
        let totalPaid = 0, totalBalance = 0, totalAdvance = 0;
        labours.forEach(l => {
            const st = getPeriodStats(l, dashboardMonthYear);
            totalPaid += st.paid;
            totalBalance += st.balance;
            totalAdvance += st.advance;
        });
        return { totalPaid, totalBalance, totalAdvance };
    }, [labours, dashboardMonthYear]);

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
        } catch (err: unknown) {
            console.error(err);
            showToast('error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSelectLabour = async (l: Labour | null) => {
        if (!l) return;
        setLoading(true);
        try {
            const profile = await api.getLabourProfile(l.id || l._id || '');
            setSelectedLabour(profile);
            setView("profile");
        } catch (err: unknown) {
            console.error(err);
            showToast('error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const filteredLabours = labours;

    const dynamicStats = stats;

    const profileStats = useMemo(() => {
        if (!selectedLabour) return null;
        const st = getPeriodStats(selectedLabour, selectedMonthYear);
        return { totalSalary: st.salary, totalPaid: st.paid, advance: st.advance, balance: st.balance, days: st.days, monthAttendance: st.monthAttendance, monthTxs: st.monthTxs };
    }, [selectedLabour, selectedMonthYear]);

    const handleExport = () => {
        const data = labours.map(l => {
            const st = getPeriodStats(l, "");
            return {
                "Worker Name": l.name,
                "Work Type": l.work_type,
                "Days Worked": st.days,
                "Salary Rate": Number(l.salary_amount) || 0,
                "Total Salary": st.salary,
                "Paid": st.paid,
                "Advance": st.advance,
                "Balance": st.balance,
                "Status": l.status
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "LabourRecords");
        XLSX.writeFile(wb, `Labour_Full_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-theme-card p-5 md:p-8 rounded-[2rem] shadow-sm border border-theme">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/30 shrink-0">
                                <Users className="w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-theme tracking-tight leading-tight">{locale === 'ur' ? 'لیبر مینجمنٹ' : 'Labour Management'}</h1>
                                <p className="text-theme-muted font-medium text-xs md:text-sm">{locale === 'ur' ? 'مزدوروں کا مکمل حساب کتاب' : 'Complete worker tracking'}</p>
                            </div>
                        </div>
                        {!isDataEntry && (
                            <button onClick={() => setOpenAddLabour(true)} className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 md:px-6 md:py-4 rounded-2xl font-black shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm">
                                <Plus className="w-5 h-5" /> {locale === 'ur' ? 'نیا مزدور' : 'Add Labour'}
                            </button>
                        )}
                    </div>

                    <div className="bg-theme-track/30 p-4 md:p-6 rounded-[2rem] border border-theme border-dashed flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-4 min-w-[200px]">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl shrink-0"><FileText className="w-6 h-6" /></div>
                            <div>
                                <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest leading-none mb-1">Detailed Report</p>
                                <p className="text-sm font-bold text-theme">Excel Export for all records</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1 justify-end">
                            <button onClick={handleExport} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 w-full sm:w-auto shrink-0">
                                <Download className="w-4 h-4" /> Export All Data
                            </button>
                        </div>
                    </div>

                    {/* Month Filter */}
                    <div className="bg-theme-card p-4 rounded-3xl border border-theme shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-orange-500" />
                                <label className="text-xs font-black text-theme-muted uppercase">{locale === 'ur' ? 'مہینہ/سال' : 'Month / Year'}</label>
                            </div>
                            <input
                                type="month"
                                value={dashboardMonthYear}
                                onChange={e => setDashboardMonthYear(e.target.value)}
                                className="flex-1 sm:flex-none bg-theme-track border border-theme p-3 rounded-xl text-theme font-bold focus:outline-none focus:border-orange-500 w-full sm:w-auto"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-theme-card p-5 rounded-3xl border border-theme shadow-sm flex flex-col justify-between hover:border-orange-500/30 transition-all">
                            <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl"><Users className="w-5 h-5" /></div><h3 className="text-xs font-black text-theme-muted uppercase tracking-wider">{locale === 'ur' ? 'کل مزدور' : 'Total Labour'}</h3></div>
                            <div><p className="text-3xl font-black text-theme">{dynamicStats?.total_labour || 0}</p><p className="text-[10px] font-bold text-green-500 mt-1">{dynamicStats?.active_labour || 0} Active • {dynamicStats?.inactive_labour || 0} Inactive</p></div>
                        </div>
                        <div className="bg-theme-card p-5 rounded-3xl border border-theme shadow-sm flex flex-col justify-between hover:border-orange-500/30 transition-all">
                            <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl"><Banknote className="w-5 h-5" /></div><h3 className="text-xs font-black text-theme-muted uppercase tracking-wider">{locale === 'ur' ? 'ادائیگی' : 'Salary Paid'}</h3></div>
                            <div><p className="text-2xl font-black text-theme">Rs {dashboardMonthStats.totalPaid.toLocaleString()}</p><p className="text-[10px] font-bold text-theme-muted mt-1">{locale === 'ur' ? 'اس مہینے' : 'This Month'}</p></div>
                        </div>
                        <div className="bg-red-500/10 p-5 rounded-3xl border border-red-500/20 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-red-500/20 text-red-400 rounded-xl"><AlertCircle className="w-5 h-5" /></div><h3 className="text-xs font-black text-red-400 uppercase tracking-wider">{locale === 'ur' ? 'باقی' : 'Balance'}</h3></div>
                            <div><p className="text-3xl font-black text-red-500">Rs {dashboardMonthStats.totalBalance.toLocaleString()}</p></div>
                        </div>
                        <div className="bg-orange-500/10 p-5 rounded-3xl border border-orange-500/20 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2"><div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl"><ArrowUpRight className="w-5 h-5" /></div><h3 className="text-xs font-black text-orange-400 uppercase tracking-wider">{locale === 'ur' ? 'ایڈوانس' : 'Advance'}</h3></div>
                            <div><p className="text-3xl font-black text-orange-500">Rs {dashboardMonthStats.totalAdvance.toLocaleString()}</p></div>
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
                                        <th className="p-4">{locale === 'ur' ? 'نام' : 'Name'}</th>
                                        <th className="p-4">{locale === 'ur' ? 'تنخواہ' : 'Salary'}</th>
                                        <th className="p-4 text-center">{locale === 'ur' ? 'مدت' : 'Month'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'ادا شدہ' : 'Salary Paid'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'باقی' : 'Balance'}</th>
                                        <th className="p-4 text-right">{locale === 'ur' ? 'ایڈوانس' : 'Advance'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme">
                                    {filteredLabours.map(l => {
                                        const st = getPeriodStats(l, dashboardMonthYear);
                                        return (
                                            <tr key={l.id || l._id} onClick={() => handleSelectLabour(l)} className="hover:bg-theme-track cursor-pointer transition-colors group text-theme">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-theme-track flex items-center justify-center font-bold text-theme-muted uppercase shrink-0 border border-theme overflow-hidden">
                                                            {l.photo ? <img src={l.photo} className="w-full h-full object-cover" alt="" /> : l.name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-theme group-hover:text-orange-500 transition-colors">{l.name}</p>
                                                            <p className="text-[10px] font-bold text-theme-muted">{l.work_type}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm font-bold text-theme">Rs {Number(l.salary_amount || 0).toLocaleString()} <span className="text-[10px] font-black text-theme-muted uppercase">/ {l.salary_type}</span></td>
                                                <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${l.salary_type === 'monthly' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{l.salary_type === 'monthly' ? (locale === 'ur' ? 'ماہانہ' : 'Monthly') : (locale === 'ur' ? 'روزانہ' : 'Daily')}</span></td>
                                                <td className="p-4 text-right text-sm font-bold text-green-500">Rs {st.paid.toLocaleString()}</td>
                                                <td className="p-4 text-right text-sm font-black text-red-500">Rs {st.balance.toLocaleString()}</td>
                                                <td className="p-4 text-right text-sm font-black text-orange-500">Rs {st.advance.toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="md:hidden flex flex-col divide-y divide-theme">
                            {filteredLabours.map(l => {
                                const st = getPeriodStats(l, dashboardMonthYear);
                                return (
                                    <div key={l.id || l._id} onClick={() => handleSelectLabour(l)} className="p-4 hover:bg-theme-track active:bg-theme-track transition-colors flex flex-col gap-3 text-theme">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-theme-track flex items-center justify-center font-black border border-theme overflow-hidden">{l.photo ? <img src={l.photo} className="w-full h-full object-cover" alt="" /> : l.name?.[0]}</div>
                                                <div>
                                                    <p className="font-black text-theme">{l.name}</p>
                                                    <p className="text-[10px] font-bold text-theme-muted">{l.work_type}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${l.salary_type === 'monthly' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{l.salary_type === 'monthly' ? (locale === 'ur' ? 'ماہانہ' : 'Monthly') : (locale === 'ur' ? 'روزانہ' : 'Daily')}</span>
                                        </div>
                                        <div className="text-xs font-bold text-theme">Rs {Number(l.salary_amount || 0).toLocaleString()} / {l.salary_type}</div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-green-500/10 p-2 rounded-xl"><p className="text-[8px] font-black text-green-500 uppercase mb-1">{locale === 'ur' ? 'ادا' : 'Paid'}</p><p className="text-xs font-black text-green-500">Rs {st.paid.toLocaleString()}</p></div>
                                            <div className="bg-red-500/10 p-2 rounded-xl"><p className="text-[8px] font-black text-red-500 uppercase mb-1">{locale === 'ur' ? 'باقی' : 'Bal'}</p><p className="text-xs font-black text-red-500">Rs {st.balance.toLocaleString()}</p></div>
                                            <div className="bg-orange-500/10 p-2 rounded-xl"><p className="text-[8px] font-black text-orange-500 uppercase mb-1">{locale === 'ur' ? 'ایڈوانس' : 'Adv'}</p><p className="text-xs font-black text-orange-500">Rs {st.advance.toLocaleString()}</p></div>
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
                    
                    <div className="bg-theme-card rounded-[2rem] p-5 md:p-8 shadow-sm border border-theme">
                        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1 w-full text-theme">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-theme-track border-2 border-theme flex items-center justify-center text-4xl font-black shrink-0 overflow-hidden shadow-2xl">
                                    {selectedLabour.photo ? <img src={selectedLabour.photo} className="w-full h-full object-cover" alt="" /> : selectedLabour.name?.[0]}
                                </div>
                                <div className="space-y-4 w-full">
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">{selectedLabour.name}</h2>
                                    <div className="flex flex-wrap gap-3">
                                        <span className="bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border border-orange-500/20">{selectedLabour.work_type}</span>
                                        <span className="bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border border-blue-500/20">Rs {selectedLabour.salary_amount} / {selectedLabour.salary_type}</span>
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${selectedLabour.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{selectedLabour.status}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-theme-muted">
                                            <Phone className="w-3.5 h-3.5 text-theme-muted" /> {selectedLabour.phone || '—'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-theme-muted">
                                            <FileText className="w-3.5 h-3.5 text-theme-muted" /> {selectedLabour.cnic || '—'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-theme-muted">
                                            <Calendar className="w-3.5 h-3.5 text-theme-muted" /> {selectedLabour.salary_start_date ? new Date(selectedLabour.salary_start_date).toLocaleDateString() : '—'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {!isDataEntry && (
                                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                    <button onClick={() => setOpenAttendance(true)} className="flex-1 lg:flex-none bg-orange-500 text-white px-6 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-500/20 active:scale-95">Mark Present</button>
                                    <button onClick={() => setOpenSlip(true)} className="flex-1 lg:flex-none bg-theme-track border border-theme hover:bg-theme-card px-6 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95">Salary Slip</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Month-Year Filter */}
                    <div className="bg-theme-card p-4 rounded-3xl border border-theme shadow-sm">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-orange-500" />
                            <label className="text-xs font-black text-theme-muted uppercase">{locale === 'ur' ? 'مہینہ/سال' : 'Month / Year'}</label>
                            <input
                                type="month"
                                value={selectedMonthYear}
                                onChange={e => setSelectedMonthYear(e.target.value)}
                                className="flex-1 bg-theme-track border border-theme p-3 rounded-xl text-theme font-bold focus:outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-sm"><p className="text-[10px] font-black text-theme-muted uppercase mb-1">{locale === 'ur' ? 'کل تنخواہ' : 'Total Salary'}</p><p className="text-2xl font-black text-theme">Rs {profileStats?.totalSalary.toLocaleString()}</p></div>
                        <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-sm"><p className="text-[10px] font-black text-theme-muted uppercase mb-1">{locale === 'ur' ? 'کل ادائیگی' : 'Total Paid'}</p><p className="text-2xl font-black text-green-500">Rs {profileStats?.totalPaid.toLocaleString()}</p></div>
                        <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-sm"><p className="text-[10px] font-black text-theme-muted uppercase mb-1">{locale === 'ur' ? 'ایڈوانس' : 'Advance'}</p><p className="text-2xl font-black text-orange-500">Rs {profileStats?.advance.toLocaleString()}</p></div>
                        <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-sm"><p className="text-[10px] font-black text-theme-muted uppercase mb-1">{locale === 'ur' ? 'باقی' : 'Balance'}</p><p className="text-2xl font-black text-blue-500">Rs {profileStats?.balance.toLocaleString()}</p></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-theme-card rounded-3xl border border-theme shadow-sm overflow-hidden h-fit">
                            <div className="p-6 border-b border-theme bg-theme-track flex justify-between items-center"><h3 className="font-black text-theme text-sm uppercase tracking-widest flex items-center gap-2">Transactions</h3>{!isDataEntry && <button onClick={() => setOpenTransaction({ type: 'salary', open: true })} className="bg-green-500 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all shadow-lg shadow-green-500/20">Pay Salary</button>}</div>
                            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                {profileStats?.monthTxs?.length === 0 && (
                                    <div className="p-4 text-center text-theme-muted text-xs font-bold">{locale === 'ur' ? 'اس مہینے کوئی لین دین نہیں' : 'No transactions this month'}</div>
                                )}
                                {profileStats?.monthTxs?.map((t: Transaction) => (
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
                                {profileStats?.monthAttendance?.length === 0 && (
                                    <div className="p-4 text-center text-theme-muted text-xs font-bold">{locale === 'ur' ? 'اس مہینے کوئی حاضری نہیں' : 'No attendance this month'}</div>
                                )}
                                {profileStats?.monthAttendance?.map((a: Attendance) => (
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

function AddLabourModal({ open, onClose, onSave, locale }: { open: boolean, onClose: () => void, onSave: () => void, locale: string }) {
    if (!open) return null;
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', cnic: '', work_type: 'Helper', salary_type: 'daily' as 'daily' | 'monthly', salary_amount: '', salary_start_date: new Date().toISOString().split('T')[0] });
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); try { await api.addLabour(form); onSave(); } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error saving labour'); } setSaving(false); };
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-theme-card border border-theme rounded-3xl shadow-2xl p-4 md:p-8 text-theme mx-2 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black">{locale === 'ur' ? 'نیا مزدور' : 'Add Labour'}</h2><button onClick={onClose}><X /></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme" />
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme" />
                        <input placeholder="CNIC" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <select value={form.work_type} onChange={e => setForm({...form, work_type: e.target.value})} className="bg-theme-track border border-theme p-4 rounded-xl text-theme"><option>Helper</option><option>Mason</option><option>Driver</option></select>
                        <select value={form.salary_type} onChange={e => setForm({...form, salary_type: e.target.value as 'daily' | 'monthly'})} className="bg-theme-track border border-theme p-4 rounded-xl text-theme"><option value="daily">Daily</option><option value="monthly">Monthly</option></select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input required type="number" placeholder="Amount" value={form.salary_amount} onChange={e => setForm({...form, salary_amount: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme" />
                        <div className="relative flex flex-col justify-center">
                            <span className="absolute -top-2 left-3 bg-theme-card px-1 text-[10px] font-bold text-theme-muted">Start Date</span>
                            <input required type="date" value={form.salary_start_date} onChange={e => setForm({...form, salary_start_date: e.target.value})} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme" />
                        </div>
                    </div>
                    <button disabled={saving} className="w-full bg-green-500 text-white p-5 rounded-xl font-black uppercase mt-2">{saving ? 'Saving...' : 'Save Worker'}</button>
                </form>
            </div>
        </div>
    );
}

function AddTransactionModal({ open, type, labour, onClose, onSave, locale }: { open: boolean, type: 'salary' | 'advance', labour: Labour | null, onClose: () => void, onSave: () => void, locale: string }) {
    if (!open || !labour) return null;
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ amount: '', notes: '', date: new Date().toISOString().split('T')[0] });
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); try { await api.addTransaction(labour.id || labour._id || '', { ...form, type }); onSave(); } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error saving transaction'); } setSaving(false); };
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-theme-card border border-theme rounded-3xl p-5 md:p-8 text-theme mx-2">
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

function AttendanceModal({ open, labour, onClose, onSave, locale }: { open: boolean, labour: Labour | null, onClose: () => void, onSave: () => void, locale: string }) {
    if (!open || !labour) return null;
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const mark = async (status: string) => { setSaving(true); try { await api.markAttendance(labour.id || labour._id || '', { date, status }); onSave(); } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Error marking attendance'); } setSaving(false); };
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm bg-theme-card border border-theme rounded-3xl p-5 md:p-8 text-theme text-center mx-2">
                <h2 className="font-black mb-6">Mark Attendance</h2>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-theme-track border border-theme p-4 rounded-xl text-theme mb-6" />
                <div className="grid grid-cols-2 gap-4"><button onClick={() => mark('present')} className="bg-emerald-500 text-white p-5 rounded-xl font-black uppercase">Present</button><button onClick={() => mark('absent')} className="bg-red-500 text-white p-5 rounded-xl font-black uppercase">Absent</button></div>
            </div>
        </div>
    );
}

function SlipModal({ open, onClose, labour }: { open: boolean, onClose: () => void, labour: Labour | null }) {
    if (!open || !labour) return null;
    const monthlySalary = Number(labour.salary_amount) || 0;
    const totalAdvance = (labour.transactions || []).reduce((sum: number, t: any) => t.type === 'advance' ? sum + (Number(t.amount) || 0) : sum, 0);
    const totalSalaryPaid = (labour.transactions || []).reduce((sum: number, t: any) => t.type === 'salary' ? sum + (Number(t.amount) || 0) : sum, 0);
    const balance = monthlySalary - (totalAdvance + totalSalaryPaid);
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white p-6 sm:p-10 text-slate-900 border-2 sm:border-4 border-double border-slate-900 shadow-2xl overflow-y-auto max-h-[95vh]">
                <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Mashori Farm</h1>
                    <p className="text-[10px] sm:text-sm font-bold uppercase tracking-widest opacity-60">Official Salary Slip</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Worker Name</p>
                        <p className="font-bold text-lg sm:text-xl text-slate-900">{labour.name}</p>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Payment Month</p>
                        <p className="font-bold text-sm text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                <div className="space-y-1 mb-10">
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                        <span className="text-xs font-bold uppercase text-slate-500">Gross Salary</span>
                        <span className="font-black text-slate-900 text-lg">Rs {monthlySalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                        <span className="text-xs font-bold uppercase text-slate-500">Total Advance</span>
                        <span className="font-black text-red-600">- Rs {totalAdvance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                        <span className="text-xs font-bold uppercase text-slate-500">Amount Paid</span>
                        <span className="font-black text-emerald-600">- Rs {totalSalaryPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-5 mt-2 bg-slate-50 px-4 rounded-xl">
                        <span className="text-sm font-black uppercase text-slate-900 tracking-wider">Net Balance</span>
                        <span className={`font-black text-2xl ${balance < 0 ? 'text-green-600' : 'text-red-600'}`}>Rs {Math.abs(balance).toLocaleString()} {balance < 0 ? '(Advance)' : ''}</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-10 mt-16 mb-4">
                    <div className="w-full sm:w-48 border-t border-slate-300 pt-2 text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Signature</p>
                        <p className="text-[10px] font-bold text-slate-900">Farm Manager</p>
                    </div>
                    <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest rotate-[-90deg] origin-right translate-x-4">Mashori Farm Digital Slip</div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-10 print:hidden">
                    <button onClick={() => window.print()} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]">
                        <Printer className="w-4 h-4" /> Print / Save PDF
                    </button>
                    <button onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 p-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-[0.98]">
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LaborDashboard;
