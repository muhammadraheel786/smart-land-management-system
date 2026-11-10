"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Store,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Wallet,
  Scale,
  TrendingUp,
  Receipt,
  Calendar,
  Phone,
  User,
  Search,
  Trash2,
  FileText,
  DollarSign,
  Package,
  RotateCcw,
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    headers: { ...getAuthHeaders(), ...(opts?.headers ?? {}) },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || `API error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivityRaw {
  id: string;
  activity_type: string;
  date?: string;
  notes?: string;
  income?: number;
  cost?: number;
  quantity_used?: number;
  field_id?: string;
}

interface VendorSale {
  id: string;
  date: string;
  fieldName: string;
  quantity: number;
  amount: number;
  notes: string;
}

interface VendorPayment {
  id: string;
  date: string;
  amount: number;
  notes: string;
}

interface VendorProfile {
  name: string;
  phone?: string;
  sales: VendorSale[];
  payments: VendorPayment[];
  totalSaleValue: number;
  totalWeightSold: number;
  totalPaid: number;
  balance: number; // totalSaleValue - totalPaid  (positive = vendor still owes us)
}

// ─── Parse vendor name from activity notes ────────────────────────────────────
// Format stored: "[Vendor: VendorName] rest of notes"
function extractVendorFromNotes(notes?: string | null): string | null {
  if (!notes) return null;
  const m = notes.match(/^\[Vendor:\s*(.+?)\]/i);
  return m ? m[1].trim() : null;
}

// Parse payment notes format: "VENDOR_PAYMENT::VendorName::rest"
function extractVendorPayment(notes?: string | null): { vendorName: string; payNotes: string } | null {
  if (!notes || !notes.startsWith("VENDOR_PAYMENT::")) return null;
  const rest = notes.replace("VENDOR_PAYMENT::", "");
  const idx = rest.indexOf("::");
  if (idx < 0) return { vendorName: rest, payNotes: "" };
  return { vendorName: rest.slice(0, idx), payNotes: rest.slice(idx + 2) };
}

// Parse vendor profile metadata stored in localStorage
const LS_KEY = "vendor_profiles_meta";
function getVendorMeta(): Record<string, { phone?: string }> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch { return {}; }
}
function saveVendorMeta(meta: Record<string, { phone?: string }>) {
  localStorage.setItem(LS_KEY, JSON.stringify(meta));
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${color} flex items-start gap-4`}>
      <div className="p-3 rounded-xl bg-white/10 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-0.5">{label}</p>
        <p className="text-2xl font-black leading-tight">{value}</p>
        {sub && <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendorsPage() {
  const { locale } = useLocale();

  const [activities, setActivities] = useState<ActivityRaw[]>([]);
  const [fields, setFields] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorMeta, setVendorMeta] = useState<Record<string, { phone?: string }>>({});

  // UI state
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Add payment modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payVendorName, setPayVendorName] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes] = useState("");
  const [paying, setPaying] = useState(false);

  // Add/Edit vendor profile modal
  const [editVendorOpen, setEditVendorOpen] = useState(false);
  const [editVendorName, setEditVendorName] = useState("");
  const [editVendorPhone, setEditVendorPhone] = useState("");

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch ──
  const fetchData = async () => {
    setLoading(true);
    try {
      const [acts, flds] = await Promise.all([
        apiFetch("/api/activities"),
        apiFetch("/api/fields"),
      ]);
      setActivities(Array.isArray(acts) ? acts : []);
      setFields(Array.isArray(flds) ? flds : []);
    } catch {
      setActivities([]); setFields([]);
    } finally {
      setLoading(false);
    }
    setVendorMeta(getVendorMeta());
  };

  useEffect(() => { fetchData(); }, []);

  // ── Build vendor profiles from activities ──
  const vendors = useMemo<VendorProfile[]>(() => {
    const map: Record<string, VendorProfile> = {};

    activities.forEach((act) => {
      // Sales (harvest / income with [Vendor: Name])
      if (act.activity_type === "harvest" || act.activity_type === "income") {
        const vendorName = extractVendorFromNotes(act.notes);
        if (!vendorName) return;
        if (!map[vendorName]) {
          map[vendorName] = {
            name: vendorName,
            phone: vendorMeta[vendorName]?.phone,
            sales: [],
            payments: [],
            totalSaleValue: 0,
            totalWeightSold: 0,
            totalPaid: 0,
            balance: 0,
          };
        }
        const fieldName = fields.find(f => f.id === act.field_id)?.name || "—";
        // Strip vendor tag from notes for display
        const cleanNotes = (act.notes || "").replace(/^\[Vendor:\s*.+?\]\s*/i, "");
        map[vendorName].sales.push({
          id: act.id,
          date: (act.date || "").split("T")[0],
          fieldName,
          quantity: act.quantity_used || 0,
          amount: act.income || 0,
          notes: cleanNotes,
        });
        map[vendorName].totalSaleValue += act.income || 0;
        map[vendorName].totalWeightSold += act.quantity_used || 0;
      }

      // Payments (expense activity with VENDOR_PAYMENT:: note)
      if (act.activity_type === "expense" || act.activity_type === "income") {
        const payData = extractVendorPayment(act.notes);
        if (!payData) return;
        const vendorName = payData.vendorName;
        if (!map[vendorName]) {
          map[vendorName] = {
            name: vendorName,
            phone: vendorMeta[vendorName]?.phone,
            sales: [],
            payments: [],
            totalSaleValue: 0,
            totalWeightSold: 0,
            totalPaid: 0,
            balance: 0,
          };
        }
        map[vendorName].payments.push({
          id: act.id,
          date: (act.date || "").split("T")[0],
          amount: act.income || act.cost || 0,
          notes: payData.payNotes,
        });
        map[vendorName].totalPaid += act.income || act.cost || 0;
      }
    });

    // Calculate balance for each vendor
    Object.values(map).forEach(v => {
      v.balance = v.totalSaleValue - v.totalPaid;
      v.phone = vendorMeta[v.name]?.phone || v.phone;
      // Sort sales/payments by date desc
      v.sales.sort((a, b) => b.date.localeCompare(a.date));
      v.payments.sort((a, b) => b.date.localeCompare(a.date));
    });

    return Object.values(map).sort((a, b) => b.totalSaleValue - a.totalSaleValue);
  }, [activities, fields, vendorMeta]);

  const filteredVendors = useMemo(() =>
    vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase())),
    [vendors, search]
  );

  const selectedProfile = useMemo(() =>
    vendors.find(v => v.name === selectedVendor) || null,
    [vendors, selectedVendor]
  );

  // ── Overall stats ──
  const totalSaleValue = useMemo(() => vendors.reduce((s, v) => s + v.totalSaleValue, 0), [vendors]);
  const totalReceived = useMemo(() => vendors.reduce((s, v) => s + v.totalPaid, 0), [vendors]);
  const totalOutstanding = useMemo(() => vendors.reduce((s, v) => s + Math.max(0, v.balance), 0), [vendors]);

  // ── Record Payment ──
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payVendorName || !payAmount) return;
    setPaying(true);
    try {
      const payload = {
        activity_type: "income",
        date: payDate,
        income: Number(payAmount),
        notes: `VENDOR_PAYMENT::${payVendorName}::${payNotes}`,
      };
      await apiFetch("/api/activities", { method: "POST", body: JSON.stringify(payload) });
      showToast("success", `Payment of Rs ${Number(payAmount).toLocaleString()} recorded for ${payVendorName}`);
      setPayModalOpen(false);
      setPayAmount(""); setPayNotes(""); setPayDate(new Date().toISOString().split("T")[0]);
      fetchData();
    } catch {
      showToast("error", "Failed to record payment. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  // ── Save vendor profile (phone etc.) ──
  const handleSaveVendorProfile = () => {
    const meta = getVendorMeta();
    meta[editVendorName] = { phone: editVendorPhone };
    saveVendorMeta(meta);
    setVendorMeta({ ...meta });
    setEditVendorOpen(false);
    showToast("success", "Vendor profile updated");
  };

  // ── Open payment modal pre-filled ──
  const openPayModal = (vendorName: string) => {
    setPayVendorName(vendorName);
    setPayAmount("");
    setPayNotes("");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-500 mx-auto mb-3" />
          <p className="text-theme-muted font-bold text-sm uppercase tracking-widest">Loading Vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme pb-24 md:pb-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border animate-in slide-in-from-top-2 duration-300 max-w-sm
          ${toast.type === "success" ? "bg-emerald-500/90 border-emerald-400 text-white" : "bg-red-500/90 border-red-400 text-white"}`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="font-bold text-sm">{toast.msg}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-6">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-theme uppercase tracking-tight">Vendor Profiles</h1>
              <p className="text-xs text-theme-muted font-bold">{vendors.length} vendors · Track sales, payments & balance</p>
            </div>
          </div>
          <button
            onClick={() => { setPayVendorName(""); openPayModal(""); setPayModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total Sales Value"
            value={`Rs ${totalSaleValue.toLocaleString()}`}
            sub={`Across ${vendors.length} vendors`}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border-blue-500/30 text-theme"
          />
          <StatCard
            label="Total Received"
            value={`Rs ${totalReceived.toLocaleString()}`}
            sub="Payments collected"
            icon={<Wallet className="w-5 h-5 text-white" />}
            color="bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-emerald-500/30 text-theme"
          />
          <StatCard
            label="Outstanding Balance"
            value={`Rs ${totalOutstanding.toLocaleString()}`}
            sub="Still to be collected"
            icon={<Receipt className="w-5 h-5 text-white" />}
            color={`bg-gradient-to-br ${totalOutstanding > 0 ? "from-amber-500/20 to-orange-600/20 border-amber-500/30" : "from-slate-500/10 to-slate-600/10 border-theme"} text-theme`}
          />
        </div>

        {vendors.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Store className="w-9 h-9 text-blue-500 opacity-60" />
            </div>
            <div>
              <h3 className="text-xl font-black text-theme mb-2">No Vendors Yet</h3>
              <p className="text-theme-muted text-sm max-w-xs mx-auto">
                Vendors are automatically created when you record a <strong>Harvest</strong> or <strong>Sale</strong> activity with a Vendor / Buyer Name.
              </p>
            </div>
            <div className="bg-theme-track border border-theme rounded-2xl px-6 py-4 text-left max-w-sm">
              <p className="text-xs font-black text-theme-muted uppercase tracking-widest mb-2">How to add vendors:</p>
              <ol className="text-sm text-theme-muted space-y-1 list-decimal list-inside">
                <li>Go to <strong className="text-theme">Activities</strong></li>
                <li>Add a <strong className="text-theme">Harvest</strong> or <strong className="text-theme">Income</strong> activity</li>
                <li>Fill in the <strong className="text-amber-500">Vendor / Buyer Name</strong> field</li>
              </ol>
            </div>
          </div>
        ) : selectedProfile ? (
          /* ── Vendor Detail View ── */
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Back button */}
            <button onClick={() => setSelectedVendor(null)} className="flex items-center gap-2 text-theme-muted hover:text-theme mb-5 text-sm font-bold transition-colors group">
              <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Back to All Vendors
            </button>

            {/* Vendor Header Card */}
            <div className="bg-theme-card border border-theme rounded-3xl p-6 mb-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <User className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-theme">{selectedProfile.name}</h2>
                    {selectedProfile.phone ? (
                      <p className="text-sm text-theme-muted flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5" /> {selectedProfile.phone}
                      </p>
                    ) : (
                      <p className="text-xs text-theme-muted/60 italic">No phone number</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setEditVendorName(selectedProfile.name); setEditVendorPhone(selectedProfile.phone || ""); setEditVendorOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-track border border-theme text-theme-muted hover:text-theme text-xs font-black uppercase tracking-widest transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                  <button
                    onClick={() => openPayModal(selectedProfile.name)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" /> Record Payment
                  </button>
                </div>
              </div>

              {/* Balance Summary Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Sales</p>
                  <p className="text-xl font-black text-blue-400">Rs {selectedProfile.totalSaleValue.toLocaleString()}</p>
                  <p className="text-[10px] text-blue-400/60 mt-0.5">{selectedProfile.sales.length} transactions</p>
                </div>
                <div className="bg-theme-track border border-theme rounded-2xl p-4">
                  <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest mb-1">Weight Sold</p>
                  <p className="text-xl font-black text-theme">{selectedProfile.totalWeightSold.toLocaleString()}</p>
                  <p className="text-[10px] text-theme-muted mt-0.5">kg / units</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Received</p>
                  <p className="text-xl font-black text-emerald-400">Rs {selectedProfile.totalPaid.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-400/60 mt-0.5">{selectedProfile.payments.length} payments</p>
                </div>
                <div className={`${selectedProfile.balance > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"} border rounded-2xl p-4`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedProfile.balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {selectedProfile.balance > 0 ? "Outstanding" : "Fully Paid"}
                  </p>
                  <p className={`text-xl font-black ${selectedProfile.balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    Rs {Math.abs(selectedProfile.balance).toLocaleString()}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${selectedProfile.balance > 0 ? "text-amber-400/60" : "text-emerald-400/60"}`}>
                    {selectedProfile.balance > 0 ? "Still to collect" : selectedProfile.balance < 0 ? "Overpaid" : "Settled"}
                  </p>
                </div>
              </div>

              {/* Balance Progress Bar */}
              {selectedProfile.totalSaleValue > 0 && (
                <div className="mt-5">
                  <div className="flex justify-between text-xs font-bold text-theme-muted mb-1.5">
                    <span>Payment Progress</span>
                    <span>{Math.min(100, Math.round((selectedProfile.totalPaid / selectedProfile.totalSaleValue) * 100))}% collected</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-theme-track overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700"
                      style={{ width: `${Math.min(100, (selectedProfile.totalPaid / selectedProfile.totalSaleValue) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sale History */}
            <div className="bg-theme-card border border-theme rounded-3xl p-5 mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="font-black text-theme uppercase tracking-tight">Sale History</h3>
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-black">{selectedProfile.sales.length}</span>
              </div>

              {selectedProfile.sales.length === 0 ? (
                <p className="text-theme-muted text-sm text-center py-6 font-bold opacity-50">No sales recorded</p>
              ) : (
                <div className="space-y-2">
                  {selectedProfile.sales.map(sale => (
                    <div key={sale.id} className="flex items-center gap-4 p-4 rounded-2xl bg-theme-track/50 border border-theme hover:border-blue-500/30 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-theme">Rs {sale.amount.toLocaleString()}</span>
                          {sale.quantity > 0 && (
                            <span className="text-[10px] bg-theme-track border border-theme px-2 py-0.5 rounded-full text-theme-muted font-bold">
                              {sale.quantity} kg/units
                            </span>
                          )}
                          {sale.fieldName !== "—" && (
                            <span className="text-[10px] bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full text-green-500 font-bold">
                              {sale.fieldName}
                            </span>
                          )}
                        </div>
                        {sale.notes && <p className="text-xs text-theme-muted mt-0.5 truncate">{sale.notes}</p>}
                        {sale.quantity > 0 && sale.amount > 0 && (
                          <p className="text-[10px] text-theme-muted mt-0.5">
                            Rate: Rs {(sale.amount / sale.quantity).toFixed(0)}/unit
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-theme-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {sale.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="bg-theme-card border border-theme rounded-3xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="font-black text-theme uppercase tracking-tight">Payment History</h3>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black">{selectedProfile.payments.length}</span>
              </div>

              {selectedProfile.payments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-theme-muted text-sm font-bold opacity-50 mb-3">No payments recorded yet</p>
                  <button
                    onClick={() => openPayModal(selectedProfile.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-black uppercase hover:bg-emerald-500/20 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Record First Payment
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProfile.payments.map(pay => (
                    <div key={pay.id} className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-emerald-400">Rs {pay.amount.toLocaleString()} received</p>
                        {pay.notes && <p className="text-xs text-theme-muted mt-0.5">{pay.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-theme-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {pay.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Vendor List View ── */
          <>
            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search vendors..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-theme-card border border-theme text-theme text-sm font-bold placeholder:font-normal focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 outline-none transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Vendor Cards */}
            <div className="space-y-3">
              {filteredVendors.map(vendor => {
                const pct = vendor.totalSaleValue > 0 ? Math.min(100, Math.round((vendor.totalPaid / vendor.totalSaleValue) * 100)) : 0;
                return (
                  <div
                    key={vendor.name}
                    onClick={() => setSelectedVendor(vendor.name)}
                    className="bg-theme-card border border-theme rounded-3xl p-5 cursor-pointer hover:border-blue-500/40 hover:shadow-lg transition-all duration-200 group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Store className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-black text-theme text-base truncate group-hover:text-blue-500 transition-colors">{vendor.name}</h3>
                            {vendor.phone && (
                              <p className="text-xs text-theme-muted flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" /> {vendor.phone}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-theme-muted shrink-0 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                        </div>

                        {/* Stats row */}
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs font-black text-blue-400">Rs {vendor.totalSaleValue.toLocaleString()}</span>
                            <span className="text-[10px] text-theme-muted">total sales</span>
                          </div>
                          <div className="w-px h-3 bg-theme-muted/30" />
                          <div className="flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 text-theme-muted" />
                            <span className="text-xs font-black text-theme">{vendor.totalWeightSold.toLocaleString()}</span>
                            <span className="text-[10px] text-theme-muted">kg sold</span>
                          </div>
                          <div className="w-px h-3 bg-theme-muted/30" />
                          <div className={`flex items-center gap-1.5 ${vendor.balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                            {vendor.balance > 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            <span className="text-xs font-black">
                              {vendor.balance > 0 ? `Rs ${vendor.balance.toLocaleString()} due` : "Settled"}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {vendor.totalSaleValue > 0 && (
                          <div className="mt-3">
                            <div className="w-full h-1.5 rounded-full bg-theme-track overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-theme-muted mt-0.5 font-bold">{pct}% paid · {vendor.sales.length} sales · {vendor.payments.length} payments</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Record Payment Modal ── */}
      {payModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPayModalOpen(false)} />
          <div className="relative z-10 w-full sm:max-w-md bg-theme-card border border-theme rounded-t-3xl sm:rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-theme">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="font-black text-theme">Record Payment Received</h3>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="p-2 rounded-xl text-theme-muted hover:bg-theme-track transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2">Vendor Name *</label>
                <input
                  type="text"
                  value={payVendorName}
                  onChange={e => setPayVendorName(e.target.value)}
                  required
                  placeholder="Enter vendor name..."
                  list="vendor-names-list"
                  className="w-full px-4 py-3 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none"
                />
                <datalist id="vendor-names-list">
                  {vendors.map(v => <option key={v.name} value={v.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Amount Received (Rs) *</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-muted text-lg font-black opacity-30">Rs</span>
                  <input
                    type="number"
                    min="1"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full pl-14 pr-5 py-5 rounded-2xl bg-theme-track border-2 border-emerald-500/30 text-theme text-2xl font-black focus:ring-4 focus:ring-emerald-500/10 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2">Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2">Notes</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                    placeholder="Optional..."
                    className="w-full px-3 py-3 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={paying}
                className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50"
              >
                {paying ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><CheckCircle className="w-5 h-5" /> Save Payment</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Vendor Profile Modal ── */}
      {editVendorOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditVendorOpen(false)} />
          <div className="relative z-10 w-full max-w-sm bg-theme-card border border-theme rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-theme">Edit Vendor Profile</h3>
              <button onClick={() => setEditVendorOpen(false)} className="p-2 rounded-xl text-theme-muted hover:bg-theme-track transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2">Vendor Name</label>
                <input
                  type="text"
                  value={editVendorName}
                  onChange={e => setEditVendorName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-theme-muted uppercase tracking-widest mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                  <input
                    type="tel"
                    value={editVendorPhone}
                    onChange={e => setEditVendorPhone(e.target.value)}
                    placeholder="0300-XXXXXXX"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveVendorProfile}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-sm transition-all active:scale-95"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
