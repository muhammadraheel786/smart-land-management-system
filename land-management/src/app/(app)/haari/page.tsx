"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Handshake,
  Plus,
  Minus,
  Pencil,
  Trash,
  Trash2,
  Calculator,
  History,
  FileText,
  User,
  Users,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Coins,
  Scale,
  Sparkles,
  X,
  Wheat,
  Calendar,
  Layers,
  Receipt,
  ArrowRight,
  ArrowDownRight,
} from "lucide-react";
import { useLandStore } from "@/lib/store";
import { format, isAfter } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";
import type { HaariRecord, HaariSettlement, HaariLoanEntry } from "@/types";

export default function HaariPage() {
  const { t } = useLocale();
  const {
    fields,
    haariRecords,
    haariSettlements,
    addHaariRecord,
    updateHaariRecord,
    deleteHaariRecord,
    addHaariSettlement,
    deleteHaariSettlement,
    updateField,
    fetchAll,
    loading,
    error,
  } = useLandStore();

  // Tab state: "contracts" | "settlements"
  const [activeTab, setActiveTab] = useState<"contracts" | "settlements">("contracts");

  // Form states for Contract
  const [fieldId, setFieldId] = useState("");
  const [hariName, setHariName] = useState("");
  const [hariContact, setHariContact] = useState("");
  const [hariCnic, setHariCnic] = useState("");
  const [crop, setCrop] = useState("Wheat");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [landownerShare, setLandownerShare] = useState<number>(50);

  // Dynamic Loan Ledger State
  const [loans, setLoans] = useState<HaariLoanEntry[]>([]);
  const [newLoanAmount, setNewLoanAmount] = useState("");
  const [newLoanType, setNewLoanType] = useState<"business" | "personal">("business");
  const [newLoanDate, setNewLoanDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newLoanRemarks, setNewLoanRemarks] = useState("");

  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSettlementId, setDeleteSettlementId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Quick Loan Adjustment Modal State (+ / - buttons on cards)
  const [loanAdjustModalOpen, setLoanAdjustModalOpen] = useState(false);
  const [adjustContractId, setAdjustContractId] = useState<string>("");
  const [adjustLoanType, setAdjustLoanType] = useState<"business" | "personal">("business");
  const [adjustAction, setAdjustAction] = useState<"add" | "deduct">("add");
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustDate, setAdjustDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [adjustRemarks, setAdjustRemarks] = useState<string>("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Settlement Modal States
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [settleCrop, setSettleCrop] = useState("Wheat");
  const [settleDate, setSettleDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [yieldQuantity, setYieldQuantity] = useState<string>("100");
  const [yieldUnit, setYieldUnit] = useState<string>("maunds");
  const [marketRate, setMarketRate] = useState<string>("4000");

  // Formula states (as handwritten: Profit = Total Amount, Total - Business Loan, split by %, from hari take return personal loan)
  const [settleBusinessLoan, setSettleBusinessLoan] = useState<string>("0");
  const [settlePersonalLoan, setSettlePersonalLoan] = useState<string>("0");
  const [settleLandownerPercent, setSettleLandownerPercent] = useState<number>(50);
  const [settleNotes, setSettleNotes] = useState("");
  const [settleSubmitting, setSettleSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Compute unique existing Haris so user can allocate multiple lands to the same person
  const existingHaris = useMemo(() => {
    const map: Record<string, { name: string; contact?: string; cnic?: string; count: number; fields: string[] }> = {};
    haariRecords.forEach((r) => {
      const trimmed = r.hariName.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      const fName = fields.find((f) => f.id === r.fieldId)?.name || r.fieldId;
      if (!map[key]) {
        map[key] = {
          name: trimmed,
          contact: r.hariContact,
          cnic: r.hariCnic,
          count: 1,
          fields: fName ? [fName] : [],
        };
      } else {
        map[key].count += 1;
        if (!map[key].contact && r.hariContact) map[key].contact = r.hariContact;
        if (!map[key].cnic && r.hariCnic) map[key].cnic = r.hariCnic;
        if (fName && !map[key].fields.includes(fName)) map[key].fields.push(fName);
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [haariRecords, fields]);

  // When editing contract, populate form
  useEffect(() => {
    if (editingId) {
      const c = haariRecords.find((x) => x.id === editingId);
      if (c) {
        setFieldId(c.fieldId);
        setHariName(c.hariName);
        setHariContact(c.hariContact || "");
        setHariCnic(c.hariCnic || "");
        setCrop(c.crop || "Wheat");
        setStartDate(c.startDate);
        setEndDate(c.endDate || "");
        setLandownerShare(c.landownerSharePercentage || 50);
        setNotes(c.notes || "");

        if (Array.isArray(c.loans) && c.loans.length > 0) {
          setLoans(c.loans);
        } else {
          // Backward compatibility fallback from existing single advance / loan fields
          const initLoans: HaariLoanEntry[] = [];
          if ((c as any).businessLoanAmount) {
            initLoans.push({
              id: "loan_b_init",
              type: "business",
              amount: Number((c as any).businessLoanAmount),
              date: c.startDate || format(new Date(), "yyyy-MM-dd"),
              remarks: "Initial business loan",
            });
          }
          if ((c as any).personalLoanAmount) {
            initLoans.push({
              id: "loan_p_init",
              type: "personal",
              amount: Number((c as any).personalLoanAmount),
              date: c.startDate || format(new Date(), "yyyy-MM-dd"),
              remarks: "Initial personal loan",
            });
          }
          if (initLoans.length === 0 && c.advanceLoanAmount) {
            initLoans.push({
              id: "loan_adv_init",
              type: "business",
              amount: Number(c.advanceLoanAmount),
              date: c.startDate || format(new Date(), "yyyy-MM-dd"),
              remarks: "Starting advance",
            });
          }
          setLoans(initLoans);
        }
      }
    }
  }, [editingId, haariRecords]);

  // Auto-calculated Hari share percentage
  const hariShare = useMemo(() => 100 - landownerShare, [landownerShare]);

  // Loan totals
  const totalBusinessLoans = useMemo(
    () => loans.filter((l) => l.type === "business").reduce((s, l) => s + (Number(l.amount) || 0), 0),
    [loans]
  );
  const totalPersonalLoans = useMemo(
    () => loans.filter((l) => l.type === "personal").reduce((s, l) => s + (Number(l.amount) || 0), 0),
    [loans]
  );
  const totalAdvanceLoan = useMemo(() => totalBusinessLoans + totalPersonalLoans, [totalBusinessLoans, totalPersonalLoans]);

  // Add a loan item to the ledger
  const handleAddLoan = () => {
    const amt = Number(newLoanAmount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      setFormError("Please enter a valid positive loan amount.");
      return;
    }
    const item: HaariLoanEntry = {
      id: "loan_" + Date.now(),
      type: newLoanType,
      amount: amt,
      date: newLoanDate || format(new Date(), "yyyy-MM-dd"),
      remarks: newLoanRemarks.trim(),
    };
    setLoans((prev) => [...prev, item]);
    setNewLoanAmount("");
    setNewLoanRemarks("");
    setFormError(null);
  };

  // Remove a loan from ledger
  const handleRemoveLoan = (id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
  };

  // Active vs Expired/Completed contracts
  const activeContracts = useMemo(
    () => haariRecords.filter((r) => r.status === "active" && (!r.endDate || isAfter(new Date(r.endDate), new Date()))),
    [haariRecords]
  );
  const completedContracts = useMemo(
    () => haariRecords.filter((r) => r.status !== "active" || (r.endDate && !isAfter(new Date(r.endDate), new Date()))),
    [haariRecords]
  );

  // Summary Metrics
  const totalAllocatedArea = useMemo(
    () => activeContracts.reduce((sum, r) => sum + (fields.find((f) => f.id === r.fieldId)?.area || Number(r.allocatedArea) || 0), 0),
    [activeContracts, fields]
  );
  const totalOutstandingKhaata = useMemo(
    () =>
      activeContracts.reduce(
        (sum, r) =>
          sum +
          (r.loans
            ? r.loans.reduce((acc, l) => acc + (Number(l.amount) || 0), 0)
            : Number(r.advanceLoanAmount || 0)),
        0
      ),
    [activeContracts]
  );

  const availableFields = useMemo(
    () => fields.filter((f) => f.status !== "thaka" && f.status !== "haari"),
    [fields]
  );

  // Reset form
  const resetForm = () => {
    setFieldId("");
    setHariName("");
    setHariContact("");
    setHariCnic("");
    setCrop("Wheat");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate("");
    setLandownerShare(50);
    setLoans([]);
    setNewLoanAmount("");
    setNewLoanType("business");
    setNewLoanDate(format(new Date(), "yyyy-MM-dd"));
    setNewLoanRemarks("");
    setNotes("");
    setEditingId(null);
    setFormError(null);
  };

  // Submit contract form (create or edit)
  const handleSubmitContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fieldId || !hariName.trim() || !startDate) {
      setFormError("Please select a field, enter Hari name, and choose start date.");
      return;
    }
    if (endDate && new Date(endDate) < new Date(startDate)) {
      setFormError("End date must be on or after start date.");
      return;
    }

    const payload: Partial<HaariRecord> = {
      fieldId,
      hariName: hariName.trim(),
      hariContact: hariContact.trim() || undefined,
      hariCnic: hariCnic.trim() || undefined,
      crop: crop.trim() || "Wheat",
      startDate,
      endDate: endDate || startDate,
      landownerSharePercentage: Number(landownerShare) || 50,
      hariSharePercentage: Number(hariShare) || 50,
      expenseSharingMode: "SHARED_BY_PERCENTAGE",
      advanceLoanAmount: totalAdvanceLoan,
      businessLoanAmount: totalBusinessLoans,
      personalLoanAmount: totalPersonalLoans,
      loans,
      status: "active",
      notes: notes.trim() || undefined,
    };

    try {
      if (editingId) {
        await updateHaariRecord(editingId, payload);
        setSuccessMsg("Haari agreement updated successfully!");
        resetForm();
        setTimeout(() => setSuccessMsg(null), 4000);
        return;
      }

      const ok = await addHaariRecord(payload as any);
      if (ok) {
        try {
          await updateField(fieldId, { status: "haari" });
        } catch (_) {}
        setSuccessMsg("Haari agreement created successfully.");
        resetForm();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setFormError("Failed to save Haari contract. Try again.");
      }
    } catch (err: any) {
      console.error("Haari contract submit error:", err);
      setFormError(err?.message || "Failed to save Haari contract. Try again.");
    }
  };

  // ── Quick Loan Adjustment Logic (+ / - buttons on cards) ──
  const openLoanAdjust = (
    contract: HaariRecord,
    loanType: "business" | "personal",
    action: "add" | "deduct"
  ) => {
    setAdjustContractId(contract.id);
    setAdjustLoanType(loanType);
    setAdjustAction(action);
    setAdjustAmount("");
    setAdjustDate(format(new Date(), "yyyy-MM-dd"));
    setAdjustRemarks(
      action === "add"
        ? loanType === "business"
          ? "Fertilizer / seed advance"
          : "Personal cash advance"
        : `${loanType === "business" ? "Business" : "Personal"} loan deduction / return`
    );
    setLoanAdjustModalOpen(true);
  };

  const contractToAdjust = useMemo(
    () => haariRecords.find((c) => c.id === adjustContractId) || null,
    [haariRecords, adjustContractId]
  );

  const currentAdjustBalance = useMemo(() => {
    if (!contractToAdjust) return 0;
    if (adjustLoanType === "business") {
      return contractToAdjust.loans
        ? contractToAdjust.loans.filter((l) => l.type === "business").reduce((s, l) => s + (Number(l.amount) || 0), 0)
        : Number((contractToAdjust as any).businessLoanAmount || contractToAdjust.advanceLoanAmount || 0);
    } else {
      return contractToAdjust.loans
        ? contractToAdjust.loans.filter((l) => l.type === "personal").reduce((s, l) => s + (Number(l.amount) || 0), 0)
        : Number((contractToAdjust as any).personalLoanAmount || 0);
    }
  }, [contractToAdjust, adjustLoanType]);

  const handleConfirmLoanAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(adjustAmount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      alert("Please enter a valid positive amount.");
      return;
    }
    if (!contractToAdjust) return;
    setAdjustSubmitting(true);

    const existingLoans: HaariLoanEntry[] =
      Array.isArray(contractToAdjust.loans) && contractToAdjust.loans.length > 0
        ? [...contractToAdjust.loans]
        : [
            ...((contractToAdjust as any).businessLoanAmount
              ? [
                  {
                    id: "b_init_" + contractToAdjust.id,
                    type: "business" as const,
                    amount: Number((contractToAdjust as any).businessLoanAmount),
                    date: contractToAdjust.startDate || format(new Date(), "yyyy-MM-dd"),
                    remarks: "Initial business loan",
                  },
                ]
              : []),
            ...((contractToAdjust as any).personalLoanAmount
              ? [
                  {
                    id: "p_init_" + contractToAdjust.id,
                    type: "personal" as const,
                    amount: Number((contractToAdjust as any).personalLoanAmount),
                    date: contractToAdjust.startDate || format(new Date(), "yyyy-MM-dd"),
                    remarks: "Initial personal loan",
                  },
                ]
              : []),
            ...(!((contractToAdjust as any).businessLoanAmount || (contractToAdjust as any).personalLoanAmount) &&
            contractToAdjust.advanceLoanAmount
              ? [
                  {
                    id: "adv_init_" + contractToAdjust.id,
                    type: "business" as const,
                    amount: Number(contractToAdjust.advanceLoanAmount),
                    date: contractToAdjust.startDate || format(new Date(), "yyyy-MM-dd"),
                    remarks: "Starting advance",
                  },
                ]
              : []),
          ];

    const finalAmount = adjustAction === "add" ? amt : -amt;
    const newEntry: HaariLoanEntry = {
      id: "loan_" + Date.now(),
      type: adjustLoanType,
      amount: finalAmount,
      date: adjustDate || format(new Date(), "yyyy-MM-dd"),
      remarks:
        adjustRemarks.trim() ||
        (adjustAction === "add" ? `${adjustLoanType} loan added` : `${adjustLoanType} loan deducted`),
    };

    const updatedLoans = [...existingLoans, newEntry];
    const newBizTotal = updatedLoans.filter((l) => l.type === "business").reduce((s, l) => s + (Number(l.amount) || 0), 0);
    const newPersonalTotal = updatedLoans.filter((l) => l.type === "personal").reduce((s, l) => s + (Number(l.amount) || 0), 0);
    const newAdvanceTotal = Math.max(0, newBizTotal + newPersonalTotal);

    try {
      await updateHaariRecord(contractToAdjust.id, {
        loans: updatedLoans,
        businessLoanAmount: Math.max(0, newBizTotal),
        personalLoanAmount: Math.max(0, newPersonalTotal),
        advanceLoanAmount: newAdvanceTotal,
      });
      setLoanAdjustModalOpen(false);
      setSuccessMsg(
        `${adjustLoanType === "business" ? "Business" : "Personal"} loan ${
          adjustAction === "add" ? "increased" : "decreased"
        } by Rs ${amt.toLocaleString()} for ${contractToAdjust.hariName}`
      );
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (err: any) {
      alert(err?.message || "Failed to update loan balance.");
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Open Settlement Calculator for a contract
  const openSettlementModal = (contractId?: string) => {
    const targetId = contractId || (activeContracts[0]?.id ?? "");
    setSelectedContractId(targetId);
    const contract = haariRecords.find((c) => c.id === targetId);
    if (contract) {
      setSettleCrop(contract.crop || "Wheat");

      // Pre-fill business loan from contract's business loans
      const bLoans = contract.loans
        ? contract.loans.filter((l) => l.type === "business").reduce((s, l) => s + (Number(l.amount) || 0), 0)
        : Number((contract as any).businessLoanAmount || contract.advanceLoanAmount || 0);

      // Pre-fill personal loan from contract's personal loans
      const pLoans = contract.loans
        ? contract.loans.filter((l) => l.type === "personal").reduce((s, l) => s + (Number(l.amount) || 0), 0)
        : Number((contract as any).personalLoanAmount || 0);

      setSettleBusinessLoan(String(bLoans));
      setSettlePersonalLoan(String(pLoans));
      setSettleLandownerPercent(contract.landownerSharePercentage || 50);
    } else {
      setSettleBusinessLoan("0");
      setSettlePersonalLoan("0");
      setSettleLandownerPercent(50);
    }
    setSettlementModalOpen(true);
  };

  // Live Settlement Calculations exactly matching the handwritten formula:
  // 1. Profit = Total Amount (Yield Quantity * Market Rate)
  // 2. Remaining Amount = Total Amount - Business Loan
  // 3. Divided by share percentages (Landowner % and Hari %)
  // 4. From Hari Amount take return personal loan -> Hari Net Payable
  const settlementCalculations = useMemo(() => {
    const qty = Number(yieldQuantity) || 0;
    const rate = Number(marketRate) || 0;
    const totalAmount = qty * rate; // Profit = Total Amount

    const bLoan = Number(settleBusinessLoan) || 0; // Total Amount - Business Loan
    const remainingAmount = Math.max(0, totalAmount - bLoan); // Remaining Amount after business loan

    const lPercent = settleLandownerPercent;
    const hPercent = 100 - lPercent;

    // Split remaining amount
    const landownerShareAmount = (remainingAmount * lPercent) / 100;
    const hariShareAmount = (remainingAmount * hPercent) / 100;

    // From hari Amount take return personal loan
    const pLoan = Number(settlePersonalLoan) || 0;
    const pLoanDeducted = Math.min(hariShareAmount, pLoan);
    const hariNetPayable = Math.max(0, hariShareAmount - pLoanDeducted);
    const remainingPersonalLoan = Math.max(0, pLoan - pLoanDeducted);

    // Landowner total return: Crop Share + Recovered Business Loan + Recovered Personal Loan
    const landownerTotalReceived = landownerShareAmount + bLoan + pLoanDeducted;

    return {
      totalAmount,
      bLoan,
      remainingAmount,
      lPercent,
      hPercent,
      landownerShareAmount,
      hariShareAmount,
      pLoan,
      pLoanDeducted,
      hariNetPayable,
      remainingPersonalLoan,
      landownerTotalReceived,
    };
  }, [yieldQuantity, marketRate, settleBusinessLoan, settlePersonalLoan, settleLandownerPercent]);

  // Finalize settlement
  const handleFinalizeSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId) return;
    setSettleSubmitting(true);

    const contract = haariRecords.find((c) => c.id === selectedContractId);
    if (!contract) {
      setSettleSubmitting(false);
      return;
    }

    const payload: Partial<HaariSettlement> = {
      haariId: contract.id,
      fieldId: contract.fieldId,
      hariName: contract.hariName,
      crop: settleCrop,
      date: settleDate,
      yieldQuantity: Number(yieldQuantity) || 0,
      yieldUnit,
      marketRate: Number(marketRate) || 0,
      grossHarvestValue: settlementCalculations.totalAmount,
      totalInputExpenses: settlementCalculations.bLoan,
      expenseSharingMode: "SHARED_BY_PERCENTAGE",
      landownerSharePercentage: settlementCalculations.lPercent,
      hariSharePercentage: settlementCalculations.hPercent,
      landownerExpenseShare: 0,
      hariExpenseShare: 0,
      landownerGrossShare: settlementCalculations.landownerShareAmount,
      hariGrossShare: settlementCalculations.hariShareAmount,
      landownerNetShare: settlementCalculations.landownerTotalReceived,
      hariNetShare: settlementCalculations.hariNetPayable,
      advanceDeducted: settlementCalculations.pLoanDeducted,
      hariNetPayable: settlementCalculations.hariNetPayable,
      notes: settleNotes
        ? `[Settlement: BizLoan=${settlementCalculations.bLoan}, PersonalLoan=${settlementCalculations.pLoanDeducted}] ${settleNotes}`
        : `[Settlement: BizLoan=${settlementCalculations.bLoan}, PersonalLoan=${settlementCalculations.pLoanDeducted}]`,
      status: "finalized",
    };

    try {
      await addHaariSettlement(payload as any);
      setSettlementModalOpen(false);
      setActiveTab("settlements");
      setSuccessMsg("Harvest settlement finalized and recorded.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to finalize settlement.");
    } finally {
      setSettleSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Handshake className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-theme tracking-tight">
              {t("haariManagement")}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-theme-muted ml-[52px] mt-1">
            Manage Pakistani sharecropping contracts, dynamic loan ledger, quick +/- adjustments & harvest settlements
          </p>
        </div>

        {/* Action Tabs / Launch Calculator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => openSettlementModal()}
            disabled={activeContracts.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md shadow-amber-500/20 hover:opacity-95 transition disabled:opacity-50 text-sm"
          >
            <Calculator className="w-4 h-4" />
            <span>{t("haariSettlementCalculator")}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 text-sm font-bold">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Active Contracts */}
        <div className="bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <Handshake className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <p className="text-theme-muted text-[10px] font-black uppercase tracking-widest mb-1 truncate">
              {t("haariActiveContracts")}
            </p>
            <p className="text-2xl font-black text-theme">{activeContracts.length}</p>
          </div>
        </div>

        {/* Allocated Area */}
        <div className="bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <Scale className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-theme-muted text-[10px] font-black uppercase tracking-widest mb-1 truncate">
              {t("haariAllocatedArea")}
            </p>
            <p className="text-2xl font-black text-theme">
              {totalAllocatedArea.toFixed(1)} <span className="text-xs font-bold text-theme-muted">{t("acres")}</span>
            </p>
          </div>
        </div>

        {/* Total Outstanding Khaata */}
        <div className="bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <Coins className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <p className="text-theme-muted text-[10px] font-black uppercase tracking-widest mb-1 truncate">
              Total Starting Loans / Advances
            </p>
            <p className="text-2xl font-black text-blue-400">Rs {totalOutstandingKhaata.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-theme gap-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("contracts")}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === "contracts"
              ? "border-amber-500 text-amber-500 font-bold"
              : "border-transparent text-theme-muted hover:text-theme"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t("haariAgreements")}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-theme-track text-theme-muted">
            {haariRecords.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settlements")}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === "settlements"
              ? "border-amber-500 text-amber-500 font-bold"
              : "border-transparent text-theme-muted hover:text-theme"
          }`}
        >
          <History className="w-4 h-4" />
          <span>{t("haariSettlementHistory")}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-theme-track text-theme-muted">
            {haariSettlements.length}
          </span>
        </button>
      </div>

      {activeTab === "contracts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ══════════ CREATE / EDIT CONTRACT FORM (5 cols) ══════════ */}
          <div
            id="haari-contract-form"
            className={`lg:col-span-5 bg-theme-card border rounded-[2rem] p-6 shadow-sm h-fit transition-all ${
              editingId ? "border-amber-500 ring-2 ring-amber-500/30 shadow-xl shadow-amber-500/10" : "border-theme"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-theme">
                  {editingId ? "✏️ Edit Haari Agreement" : t("haariNewAgreement")}
                </h3>
                {editingId && (
                  <p className="text-xs text-amber-500 font-bold mt-0.5">
                    Modifying agreement for {hariName || "selected Hari"}
                  </p>
                )}
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1 rounded-xl bg-theme-track border border-theme text-xs font-bold text-theme-muted hover:text-theme transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 mb-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitContract} className="space-y-4">
              {/* Field Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                  {t("field")} *
                </label>
                <select
                  value={fieldId}
                  onChange={(e) => setFieldId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                >
                  <option value="">{t("selectField")}</option>
                  {(editingId ? fields : availableFields).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.area?.toFixed(1)} {t("acres")})
                    </option>
                  ))}
                </select>
              </div>

              {/* ══════════ HARI SELECTOR & NAME (Assign Multiple Lands) ══════════ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted">
                    {t("haariHariName")} *
                  </label>
                  {existingHaris.length > 0 && (
                    <span className="text-[10px] font-bold text-amber-500">
                      {existingHaris.length} registered farmer{existingHaris.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Existing Hari Dropdown */}
                {existingHaris.length > 0 && (
                  <select
                    value={existingHaris.some((h) => h.name.toLowerCase() === hariName.trim().toLowerCase()) ? hariName : ""}
                    onChange={(e) => {
                      const selected = existingHaris.find((h) => h.name === e.target.value);
                      if (selected) {
                        setHariName(selected.name);
                        if (selected.contact) setHariContact(selected.contact);
                        if (selected.cnic) setHariCnic(selected.cnic);
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-amber-500/30 text-theme text-xs font-bold focus:ring-2 focus:ring-amber-500/40 outline-none"
                  >
                    <option value="">-- Select Existing Hari (یا نیچے نیا نام لکھیں) --</option>
                    {existingHaris.map((h) => (
                      <option key={h.name} value={h.name}>
                        {h.name} ({h.count} active land{h.count > 1 ? "s" : ""}) {h.contact ? `· ${h.contact}` : ""}
                      </option>
                    ))}
                  </select>
                )}

                {/* Quick chips for existing Haris */}
                {existingHaris.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[9px] font-black uppercase text-theme-muted">Quick Pick:</span>
                    {existingHaris.slice(0, 4).map((h) => (
                      <button
                        key={h.name}
                        type="button"
                        onClick={() => {
                          setHariName(h.name);
                          if (h.contact) setHariContact(h.contact);
                          if (h.cnic) setHariCnic(h.cnic);
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border transition ${
                          hariName === h.name
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : "bg-theme-track border-theme text-theme-muted hover:text-theme"
                        }`}
                      >
                        {h.name} ({h.count})
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={hariName}
                  onChange={(e) => setHariName(e.target.value)}
                  required
                  list="existing-haris-datalist"
                  className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none font-bold"
                  placeholder="e.g. Allah Dino / Ghulam Rasool"
                />
                <datalist id="existing-haris-datalist">
                  {existingHaris.map((h) => (
                    <option key={h.name} value={h.name} />
                  ))}
                </datalist>
              </div>

              {/* Phone & CNIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                    {t("haariContact")}
                  </label>
                  <input
                    type="text"
                    value={hariContact}
                    onChange={(e) => setHariContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                    placeholder="0300-XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                    {t("haariCnic")}
                  </label>
                  <input
                    type="text"
                    value={hariCnic}
                    onChange={(e) => setHariCnic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                    placeholder="41302-XXXXXXX-X"
                  />
                </div>
              </div>

              {/* Crop */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                  {t("haariCrop")}
                </label>
                <input
                  type="text"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                  placeholder="Wheat, Cotton, Rice..."
                />
              </div>

              {/* Percentage Split - Two Input Boxes + Slider */}
              <div className="p-4 rounded-2xl bg-theme-track/60 border border-theme space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                  {t("haariLandownerShare")} / {t("haariHariShare")} — <span className="text-amber-500">Must total 100%</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                      {t("haariLandownerShare")}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={landownerShare}
                        onChange={(e) => {
                          const v = Math.min(100, Math.max(0, Number(e.target.value)));
                          setLandownerShare(v);
                        }}
                        className="w-full px-3 py-3 rounded-xl bg-theme-track border border-amber-500/40 text-amber-400 text-xl font-black text-center focus:ring-2 focus:ring-amber-500/40 outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500/60 font-black text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">
                      {t("haariHariShare")}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={hariShare}
                        onChange={(e) => {
                          const v = Math.min(100, Math.max(0, Number(e.target.value)));
                          setLandownerShare(100 - v);
                        }}
                        className="w-full px-3 py-3 rounded-xl bg-theme-track border border-emerald-500/40 text-emerald-400 text-xl font-black text-center focus:ring-2 focus:ring-emerald-500/40 outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/60 font-black text-sm">%</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-theme-muted">
                    Landowner: <strong className="text-amber-500">{landownerShare}%</strong>
                  </span>
                  <span
                    className={`text-[10px] font-black ${
                      landownerShare + hariShare === 100 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    Total: {landownerShare + hariShare}% {landownerShare + hariShare === 100 ? "✓" : "⚠ Must = 100"}
                  </span>
                  <span className="text-[10px] text-theme-muted">
                    Hari: <strong className="text-emerald-500">{hariShare}%</strong>
                  </span>
                </div>
                {/* Slider for quick adjustment */}
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={landownerShare}
                  onChange={(e) => setLandownerShare(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* ══════════ DYNAMIC LOAN / ADVANCE LEDGER SECTION ══════════ */}
              <div className="p-4 sm:p-5 rounded-2xl bg-theme-track/60 border border-theme space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-theme">
                      Loan & Advance Ledger (قرضہ / کھاتہ)
                    </h4>
                    <p className="text-[10px] text-theme-muted">
                      Track starting business loans (seed, fertilizer) and personal loans
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                      Biz: Rs {totalBusinessLoans.toLocaleString()}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px]">
                      Personal: Rs {totalPersonalLoans.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Added loans list */}
                {loans.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {loans.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-theme-card border border-theme text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider shrink-0 ${
                              item.type === "business"
                                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                            }`}
                          >
                            {item.type === "business" ? "Business Loan" : "Personal Loan"}
                          </span>
                          <div className="min-w-0">
                            <span className="font-black text-theme">
                              {item.amount < 0 ? `-Rs ${Math.abs(item.amount).toLocaleString()}` : `Rs ${item.amount.toLocaleString()}`}
                            </span>
                            {item.remarks && <p className="text-[11px] text-theme-muted truncate">{item.remarks}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-theme-muted">{item.date}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLoan(item.id)}
                            className="p-1 rounded-lg text-theme-muted hover:text-red-400 hover:bg-red-500/10 transition"
                            title="Remove loan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-center text-xs text-theme-muted font-bold opacity-60 bg-theme-card/50 rounded-xl border border-dashed border-theme">
                    No starting loans recorded yet. Add using the fields below:
                  </div>
                )}

                {/* Dynamic Entry Inputs */}
                <div className="pt-2 border-t border-theme/60 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted">
                    Add Loan / Advance Entry:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-theme-muted mb-1">
                        Amount (Rs) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newLoanAmount}
                        onChange={(e) => setNewLoanAmount(e.target.value)}
                        placeholder="e.g. 25000"
                        className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-theme-muted mb-1">
                        Loan Type *
                      </label>
                      <select
                        value={newLoanType}
                        onChange={(e) => setNewLoanType(e.target.value as "business" | "personal")}
                        className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/40"
                      >
                        <option value="business">Business Loan (کھاد / بیج / کاروبار)</option>
                        <option value="personal">Personal Loan (ذاتی قرضہ / راشن)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-theme-muted mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newLoanDate}
                        onChange={(e) => setNewLoanDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-xs font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-theme-muted mb-1">
                        Remarks / Description
                      </label>
                      <input
                        type="text"
                        value={newLoanRemarks}
                        onChange={(e) => setNewLoanRemarks(e.target.value)}
                        placeholder="e.g. Fertilizer advance, Home expenses"
                        className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-xs font-bold outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddLoan}
                    className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add More
                  </button>
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                    {t("startDate")} *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                    {t("endDate")}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                  />
                </div>
              </div>

              {/* Optional Description Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                  Optional Description / Agreement Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                  placeholder="Optional agreement notes (e.g. tube-well sharing terms, water turn details...)"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/30 hover:opacity-95 transition active:scale-95"
              >
                {editingId ? "Update Haari Agreement" : "Save Haari Agreement"}
              </button>
            </form>
          </div>

          {/* ══════════ CONTRACTS LIST & CARDS (7 cols) ══════════ */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-theme">
                  {t("haariActiveContracts")} ({activeContracts.length})
                </h3>
              </div>

              {activeContracts.length === 0 ? (
                <div className="text-center py-12 text-theme-muted text-sm space-y-2">
                  <Handshake className="w-10 h-10 mx-auto opacity-30 text-amber-500 mb-2" />
                  <p className="font-bold">No active Haari agreements</p>
                  <p className="text-xs">Use the form on the left to register your first Haari contract.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeContracts.map((c) => {
                    const field = fields.find((f) => f.id === c.fieldId);
                    const bLoans = c.loans
                      ? c.loans.filter((l) => l.type === "business").reduce((s, l) => s + (Number(l.amount) || 0), 0)
                      : Number((c as any).businessLoanAmount || c.advanceLoanAmount || 0);
                    const pLoans = c.loans
                      ? c.loans.filter((l) => l.type === "personal").reduce((s, l) => s + (Number(l.amount) || 0), 0)
                      : Number((c as any).personalLoanAmount || 0);

                    return (
                      <div
                        key={c.id}
                        className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-theme text-base tracking-tight">
                              {c.hariName}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-bold">
                              {c.crop || "Wheat"}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-theme-track text-theme-muted font-medium">
                              {field?.name || c.fieldId} ({field?.area ? `${field.area.toFixed(1)} acres` : "Field"})
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-theme-muted flex-wrap">
                            {c.hariContact && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                {c.hariContact}
                              </span>
                            )}
                            {c.hariCnic && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3.5 h-3.5" />
                                {c.hariCnic}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(c.startDate), "MMM d, yyyy")} –{" "}
                              {c.endDate ? format(new Date(c.endDate), "MMM d, yyyy") : "Ongoing"}
                            </span>
                          </div>

                          {/* Share & Loan Summary Pills with Quick +/- Buttons */}
                          <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                            <div className="px-2.5 py-1.5 rounded-xl bg-theme-track border border-theme font-medium text-theme">
                              Split: <span className="text-amber-500 font-bold">{c.landownerSharePercentage}% L</span> /{" "}
                              <span className="text-emerald-500 font-bold">{c.hariSharePercentage}% H</span>
                            </div>

                            {/* Biz Loan with +/- buttons */}
                            <div className="flex items-center bg-blue-500/10 border border-blue-500/30 rounded-xl overflow-hidden shadow-sm">
                              <span className="px-2.5 py-1 font-black text-blue-400 text-xs">
                                Biz Loan: Rs {bLoans.toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => openLoanAdjust(c, "business", "add")}
                                className="px-2 py-1 bg-blue-500/20 hover:bg-emerald-500 hover:text-white text-blue-400 font-black border-l border-blue-500/30 transition active:scale-90"
                                title="Add to Business Loan (+)"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => openLoanAdjust(c, "business", "deduct")}
                                className="px-2 py-1 bg-blue-500/20 hover:bg-amber-500 hover:text-white text-blue-400 font-black border-l border-blue-500/30 transition active:scale-90"
                                title="Deduct from Business Loan (-)"
                              >
                                -
                              </button>
                            </div>

                            {/* Personal Loan with +/- buttons */}
                            <div className="flex items-center bg-purple-500/10 border border-purple-500/30 rounded-xl overflow-hidden shadow-sm">
                              <span className="px-2.5 py-1 font-black text-purple-400 text-xs">
                                Personal: Rs {pLoans.toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => openLoanAdjust(c, "personal", "add")}
                                className="px-2 py-1 bg-purple-500/20 hover:bg-emerald-500 hover:text-white text-purple-400 font-black border-l border-purple-500/30 transition active:scale-90"
                                title="Add to Personal Loan (+)"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => openLoanAdjust(c, "personal", "deduct")}
                                className="px-2 py-1 bg-purple-500/20 hover:bg-amber-500 hover:text-white text-purple-400 font-black border-l border-purple-500/30 transition active:scale-90"
                                title="Deduct from Personal Loan (-)"
                              >
                                -
                              </button>
                            </div>
                          </div>

                          {/* Individual loans list preview if multiple */}
                          {c.loans && c.loans.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {c.loans.map((l, idx) => (
                                <span
                                  key={l.id || idx}
                                  className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${
                                    l.type === "business"
                                      ? "bg-blue-500/5 border-blue-500/20 text-blue-400"
                                      : "bg-purple-500/5 border-purple-500/20 text-purple-400"
                                  }`}
                                >
                                  {l.type === "business" ? "Biz" : "Personal"}: {l.amount < 0 ? `-Rs ${Math.abs(l.amount).toLocaleString()}` : `Rs ${l.amount.toLocaleString()}`}
                                  {l.remarks ? ` (${l.remarks})` : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openSettlementModal(c.id)}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
                            title="Settle Harvest"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Settle</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(c.id);
                                const formEl = document.getElementById("haari-contract-form");
                                if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                              className="p-2 rounded-xl text-theme-muted hover:text-blue-500 hover:bg-blue-500/10 transition"
                              title="Edit Full Contract & Details"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(c.id)}
                              className="p-2 rounded-xl text-theme-muted hover:text-red-500 hover:bg-red-500/10 transition"
                              title={t("delete")}
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Completed / Past Contracts */}
            {completedContracts.length > 0 && (
              <div className="bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm">
                <h3 className="text-base font-bold text-theme mb-3 text-theme-muted">
                  Past / Completed Contracts ({completedContracts.length})
                </h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {completedContracts.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-theme-track border border-theme flex items-center justify-between opacity-80 hover:opacity-100 transition"
                    >
                      <div>
                        <p className="font-bold text-sm text-theme">{c.hariName} ({c.crop || "Crop"})</p>
                        <p className="text-xs text-theme-muted">
                          Ended: {c.endDate ? format(new Date(c.endDate), "MMM d, yyyy") : "Completed"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(c.id);
                            const formEl = document.getElementById("haari-contract-form");
                            if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className="p-1.5 rounded-lg text-theme-muted hover:text-theme"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="p-1.5 rounded-lg text-theme-muted hover:text-red-400"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ QUICK LOAN ADJUSTMENT MODAL (+ / -) ══════════ */}
      {loanAdjustModalOpen && contractToAdjust && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setLoanAdjustModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-theme-card border border-theme rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-theme pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                    adjustAction === "add"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                  }`}
                >
                  {adjustAction === "add" ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-theme">
                    {adjustAction === "add" ? "Add to" : "Deduct from"}{" "}
                    {adjustLoanType === "business" ? "Business Loan" : "Personal Loan"}
                  </h3>
                  <p className="text-xs text-theme-muted font-bold">
                    {contractToAdjust.hariName} · Current Balance: Rs {currentAdjustBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoanAdjustModalOpen(false)}
                className="p-2 rounded-xl text-theme-muted hover:bg-theme-track transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmLoanAdjust} className="space-y-4">
              {/* Quick Amount Chips */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-theme-muted mb-2">
                  Quick Amount Presets:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5000, 10000, 25000, 50000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAdjustAmount(String(preset))}
                      className="py-2 rounded-xl bg-theme-track border border-theme text-theme text-xs font-black hover:border-amber-500/50 hover:text-amber-500 transition active:scale-95"
                    >
                      +{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                  Amount (Rs) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted font-black text-base opacity-40">
                    Rs
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    required
                    placeholder="e.g. 15000"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-theme-track border-2 border-theme text-theme text-xl font-black outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-theme-muted mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={adjustDate}
                  onChange={(e) => setAdjustDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold outline-none"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-theme-muted mb-1">
                  Remarks / Purpose
                </label>
                <input
                  type="text"
                  value={adjustRemarks}
                  onChange={(e) => setAdjustRemarks(e.target.value)}
                  placeholder={
                    adjustLoanType === "business"
                      ? "e.g. Urea fertilizer bag, Tractor diesel"
                      : "e.g. Ration advance, Medical aid, Cash return"
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-theme-track border border-theme text-theme text-sm font-bold outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLoanAdjustModalOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-theme-track border border-theme text-theme font-black text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className={`flex-[2] py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition active:scale-95 disabled:opacity-50 ${
                    adjustAction === "add"
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30"
                      : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                  }`}
                >
                  {adjustSubmitting
                    ? "Updating..."
                    : adjustAction === "add"
                    ? `Confirm + Add ${adjustLoanType === "business" ? "Biz" : "Personal"} Loan`
                    : `Confirm - Deduct ${adjustLoanType === "business" ? "Biz" : "Personal"} Loan`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ SETTLEMENT HISTORY TAB ══════════ */}
      {activeTab === "settlements" && (
        <div className="bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-theme">{t("haariSettlementHistory")}</h3>
              <p className="text-xs text-theme-muted">
                Audit trail of finalized harvest settlements with business loan deductions & personal loan returns
              </p>
            </div>
          </div>

          {haariSettlements.length === 0 ? (
            <div className="text-center py-16 text-theme-muted text-sm space-y-2">
              <History className="w-10 h-10 mx-auto opacity-30 text-amber-500 mb-2" />
              <p className="font-bold">No harvest settlements recorded yet</p>
              <p className="text-xs">
                Launch the Settlement Calculator from an active contract to split harvest yields.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {haariSettlements.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-theme-track/50 border border-theme hover:border-amber-500/30 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-theme/60 pb-3">
                    <div>
                      <span className="font-black text-theme text-base mr-2">{s.hariName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-bold">
                        {s.crop}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-theme-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {s.date ? format(new Date(s.date), "MMM d, yyyy") : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteSettlementId(s.id)}
                        className="text-red-400 hover:text-red-500 transition p-1"
                        title={t("delete")}
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Settlement Breakdown Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-theme-card border border-theme">
                      <span className="text-theme-muted block text-[10px] uppercase font-bold">Yield</span>
                      <span className="font-black text-theme text-sm">
                        {s.yieldQuantity} {s.yieldUnit} @ Rs {s.marketRate}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-theme-card border border-theme">
                      <span className="text-theme-muted block text-[10px] uppercase font-bold">Total Amount</span>
                      <span className="font-black text-theme text-sm">
                        Rs {(s.grossHarvestValue || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-theme-card border border-theme">
                      <span className="text-theme-muted block text-[10px] uppercase font-bold">Biz Loan Deducted</span>
                      <span className="font-black text-rose-400 text-sm">
                        -Rs {(s.totalInputExpenses || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-emerald-500 block text-[10px] uppercase font-bold">Net Paid to Hari</span>
                      <span className="font-black text-emerald-400 text-sm">
                        Rs {(s.hariNetPayable || s.hariNetShare || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {s.notes && (
                    <p className="text-[11px] text-theme-muted italic border-t border-theme/40 pt-2">
                      &quot;{s.notes}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ HARVEST SETTLEMENT INTERACTIVE MODAL ══════════ */}
      {settlementModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSettlementModalOpen(false)}
          />
          <div className="relative z-10 bg-theme-card border border-theme rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col my-4 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-theme shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-theme truncate">
                    {t("haariSettlementCalculator")}
                  </h3>
                  <p className="text-xs text-theme-muted truncate">
                    Profit = Total Amount - Business Loan, Split by %, Return Personal Loan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettlementModalOpen(false)}
                className="p-2 rounded-xl text-theme-muted hover:text-theme hover:bg-theme-track transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizeSettlement}>
              {/* Form Body */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {/* Contract Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                    {t("haariSelectContract")} *
                  </label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSelectedContractId(cid);
                      const c = haariRecords.find((x) => x.id === cid);
                      if (c) {
                        setSettleCrop(c.crop || "Wheat");
                        const bLoans = c.loans
                          ? c.loans.filter((l) => l.type === "business").reduce((s, l) => s + (Number(l.amount) || 0), 0)
                          : Number((c as any).businessLoanAmount || c.advanceLoanAmount || 0);
                        const pLoans = c.loans
                          ? c.loans.filter((l) => l.type === "personal").reduce((s, l) => s + (Number(l.amount) || 0), 0)
                          : Number((c as any).personalLoanAmount || 0);
                        setSettleBusinessLoan(String(bLoans));
                        setSettlePersonalLoan(String(pLoans));
                        setSettleLandownerPercent(c.landownerSharePercentage || 50);
                      }
                    }}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                  >
                    {haariRecords.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.hariName} — {c.crop || "Crop"} ({fields.find((f) => f.id === c.fieldId)?.name || c.fieldId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Crop & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                      {t("haariCrop")}
                    </label>
                    <input
                      type="text"
                      value={settleCrop}
                      onChange={(e) => setSettleCrop(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                      {t("date")}
                    </label>
                    <input
                      type="date"
                      value={settleDate}
                      onChange={(e) => setSettleDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Yield Quantity, Unit, & Market Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                      {t("haariYieldQuantity")} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={yieldQuantity}
                      onChange={(e) => setYieldQuantity(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm outline-none"
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                      {t("haariYieldUnit")}
                    </label>
                    <select
                      value={yieldUnit}
                      onChange={(e) => setYieldUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm outline-none"
                    >
                      <option value="maunds">{t("haariUnitMaunds")}</option>
                      <option value="bags">{t("haariUnitBags")}</option>
                      <option value="kg">{t("haariUnitKg")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                      {t("haariMarketRate")} *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={marketRate}
                      onChange={(e) => setMarketRate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm outline-none"
                      placeholder="Rs / unit"
                    />
                  </div>
                </div>

                {/* ══════════ FORMULA LOAN DEDUCTIONS ══════════ */}
                <div className="p-4 rounded-2xl bg-theme-track/60 border border-theme space-y-3">
                  <p className="text-xs font-black uppercase tracking-wider text-theme">
                    Loan Deductions (حساب کتاب کے قرضے)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">
                        1. Business Loan (Deducted from Total Amount)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settleBusinessLoan}
                        onChange={(e) => setSettleBusinessLoan(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-theme-card border border-blue-500/30 text-theme text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/40"
                        placeholder="Rs 0"
                      />
                      <p className="text-[10px] text-theme-muted mt-0.5">
                        Seed, fertilizer & tractor expenses taken off top
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">
                        2. Personal Loan (Return from Hari Share)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settlePersonalLoan}
                        onChange={(e) => setSettlePersonalLoan(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-theme-card border border-purple-500/30 text-theme text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500/40"
                        placeholder="Rs 0"
                      />
                      <p className="text-[10px] text-theme-muted mt-0.5">
                        Deducted directly from Hari&apos;s share of the crop
                      </p>
                    </div>
                  </div>
                </div>

                {/* ══════════ LIVE CALCULATION BREAKDOWN CARD ══════════ */}
                <div className="p-4 sm:p-5 rounded-2xl bg-theme-track/80 border border-amber-500/30 space-y-4">
                  {/* Total Harvest & Business Loan Deduction */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-theme/60 pb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                        Total Amount (Gross Crop Value):
                      </span>
                      <p className="text-xl font-black text-theme">
                        Rs {settlementCalculations.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    {settlementCalculations.bLoan > 0 && (
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-rose-400 font-bold block">
                          - Business Loan: Rs {settlementCalculations.bLoan.toLocaleString()}
                        </span>
                        <span className="text-xs text-amber-500 font-bold">
                          = Remaining to Split: Rs {settlementCalculations.remainingAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Two Columns: Landowner vs Hari */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Landowner Share */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs">
                      <span className="text-amber-500 font-black uppercase tracking-wider text-[11px] block">
                        Landowner ({settlementCalculations.lPercent}%)
                      </span>
                      <div className="flex justify-between">
                        <span className="text-theme-muted">Crop Share:</span>
                        <span className="font-bold text-theme">
                          Rs {settlementCalculations.landownerShareAmount.toLocaleString()}
                        </span>
                      </div>
                      {settlementCalculations.bLoan > 0 && (
                        <div className="flex justify-between text-blue-400">
                          <span>+ Business Loan Recovered:</span>
                          <span className="font-bold">Rs {settlementCalculations.bLoan.toLocaleString()}</span>
                        </div>
                      )}
                      {settlementCalculations.pLoanDeducted > 0 && (
                        <div className="flex justify-between text-purple-400">
                          <span>+ Personal Loan Recovered:</span>
                          <span className="font-bold">Rs {settlementCalculations.pLoanDeducted.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="border-t border-amber-500/20 pt-1 flex justify-between font-black text-amber-400 text-sm">
                        <span>Total Landowner Return:</span>
                        <span>Rs {settlementCalculations.landownerTotalReceived.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Hari Share */}
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs">
                      <span className="text-emerald-500 font-black uppercase tracking-wider text-[11px] block">
                        Hari ({settlementCalculations.hPercent}%)
                      </span>
                      <div className="flex justify-between">
                        <span className="text-theme-muted">Gross Crop Share:</span>
                        <span className="font-bold text-theme">
                          Rs {settlementCalculations.hariShareAmount.toLocaleString()}
                        </span>
                      </div>
                      {settlementCalculations.pLoanDeducted > 0 && (
                        <div className="flex justify-between text-rose-400">
                          <span>- Personal Loan Return:</span>
                          <span className="font-bold">
                            -Rs {settlementCalculations.pLoanDeducted.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-emerald-500/20 pt-1 flex justify-between font-black text-emerald-400 text-sm">
                        <span>Net Payable to Hari:</span>
                        <span>Rs {settlementCalculations.hariNetPayable.toLocaleString()}</span>
                      </div>
                      {settlementCalculations.remainingPersonalLoan > 0 && (
                        <p className="text-[10px] text-amber-500 mt-0.5">
                          Remaining Personal Loan: Rs {settlementCalculations.remainingPersonalLoan.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Settlement Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                    Settlement Remarks / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-xs outline-none"
                    placeholder="Optional notes regarding market rate, grain quality, deduction details..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 pt-3 border-t border-theme flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSettlementModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme text-xs font-bold hover:bg-theme-muted/10 transition"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={settleSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-amber-500/30 transition active:scale-95 disabled:opacity-50"
                >
                  {settleSubmitting ? "Finalizing..." : "Finalize & Record Settlement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Contract Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative z-10 bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme">Delete Haari Agreement?</h3>
              <p className="text-xs text-theme-muted mt-1">
                This will delete the agreement and free up the allocated land parcel.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-theme-track text-theme text-xs font-bold"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteConfirmId) {
                    await deleteHaariRecord(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Settlement Modal */}
      {deleteSettlementId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteSettlementId(null)}
          />
          <div className="relative z-10 bg-theme-card border border-theme rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme">Delete Settlement Record?</h3>
              <p className="text-xs text-theme-muted mt-1">
                This will remove this historical harvest settlement entry from the audit history.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteSettlementId(null)}
                className="flex-1 py-2.5 rounded-xl bg-theme-track text-theme text-xs font-bold"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteSettlementId) {
                    await deleteHaariSettlement(deleteSettlementId);
                    setDeleteSettlementId(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
