"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Handshake,
  Plus,
  Pencil,
  Trash,
  Calculator,
  History,
  FileText,
  User,
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
} from "lucide-react";
import { useLandStore } from "@/lib/store";
import { format, isAfter } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";
import type { ExpenseSharingMode, HaariRecord, HaariSettlement } from "@/types";

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
  const [allocatedArea, setAllocatedArea] = useState("");
  const [crop, setCrop] = useState("Wheat");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [landownerShare, setLandownerShare] = useState<number>(50);
  const [expenseSharingMode, setExpenseSharingMode] = useState<ExpenseSharingMode>("SHARED_BY_PERCENTAGE");
  const [advanceLoanAmount, setAdvanceLoanAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSettlementId, setDeleteSettlementId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Settlement Modal States
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [settleCrop, setSettleCrop] = useState("Wheat");
  const [settleDate, setSettleDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [yieldQuantity, setYieldQuantity] = useState<string>("100");
  const [yieldUnit, setYieldUnit] = useState<string>("maunds");
  const [marketRate, setMarketRate] = useState<string>("4000");
  const [inputExpenses, setInputExpenses] = useState<string>("50000");
  const [advanceToDeduct, setAdvanceToDeduct] = useState<string>("0");
  const [settleNotes, setSettleNotes] = useState("");
  const [settleSubmitting, setSettleSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // When editing contract, populate form
  useEffect(() => {
    if (editingId) {
      const c = haariRecords.find((x) => x.id === editingId);
      if (c) {
        setFieldId(c.fieldId);
        setHariName(c.hariName);
        setHariContact(c.hariContact || "");
        setHariCnic(c.hariCnic || "");
        setAllocatedArea(c.allocatedArea ? String(c.allocatedArea) : "");
        setCrop(c.crop || "Wheat");
        setStartDate(c.startDate);
        setEndDate(c.endDate);
        setLandownerShare(c.landownerSharePercentage || 50);
        setExpenseSharingMode(c.expenseSharingMode || "SHARED_BY_PERCENTAGE");
        setAdvanceLoanAmount(c.advanceLoanAmount ? String(c.advanceLoanAmount) : "");
        setNotes(c.notes || "");
      }
    }
  }, [editingId, haariRecords]);

  // When field changes, auto-populate allocated area with field area if empty
  const handleFieldChange = (id: string) => {
    setFieldId(id);
    const selectedField = fields.find((f) => f.id === id);
    if (selectedField?.area && !allocatedArea) {
      setAllocatedArea(String(selectedField.area));
    }
  };

  // Auto-calculated Hari share percentage
  const hariShare = useMemo(() => 100 - landownerShare, [landownerShare]);

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
    () => activeContracts.reduce((sum, r) => sum + (Number(r.allocatedArea) || 0), 0),
    [activeContracts]
  );
  const totalOutstandingKhaata = useMemo(
    () => activeContracts.reduce((sum, r) => sum + (Number(r.advanceLoanAmount) || 0), 0),
    [activeContracts]
  );

  const availableFields = useMemo(
    () => fields.filter((f) => f.status !== "thaka" && f.status !== "haari"),
    [fields]
  );

  // Reset contract form
  const resetForm = () => {
    setEditingId(null);
    setFieldId("");
    setHariName("");
    setHariContact("");
    setHariCnic("");
    setAllocatedArea("");
    setCrop("Wheat");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate("");
    setLandownerShare(50);
    setExpenseSharingMode("SHARED_BY_PERCENTAGE");
    setAdvanceLoanAmount("");
    setNotes("");
    setFormError(null);
  };

  // Submit contract form
  const handleSubmitContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fieldId || !hariName.trim() || !startDate) {
      setFormError(t("thakaFillRequired") || "Please fill all required fields.");
      return;
    }
    if (endDate && new Date(endDate) < new Date(startDate)) {
      setFormError(t("thakaEndAfterStart") || "End date must be on or after start date.");
      return;
    }

    const payload = {
      fieldId,
      hariName: hariName.trim(),
      hariContact: hariContact.trim() || undefined,
      hariCnic: hariCnic.trim() || undefined,
      allocatedArea: allocatedArea ? Number(allocatedArea) : undefined,
      crop: crop.trim() || "Wheat",
      startDate,
      endDate: endDate || startDate,
      landownerSharePercentage: landownerShare,
      hariSharePercentage: hariShare,
      expenseSharingMode,
      advanceLoanAmount: advanceLoanAmount ? Number(advanceLoanAmount) : 0,
      status: "active" as const,
      notes: notes.trim() || undefined,
    };

    if (editingId) {
      await updateHaariRecord(editingId, payload);
      setSuccessMsg(t("recordUpdated") || "Record updated.");
      resetForm();
      setTimeout(() => setSuccessMsg(null), 4000);
      return;
    }

    const ok = await addHaariRecord(payload);
    if (ok) {
      try {
        await updateField(fieldId, { status: "haari" });
      } catch (_) {}
      setSuccessMsg(t("haariContractAdded") || "Haari agreement added successfully.");
      resetForm();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setFormError(t("haariAddFailed") || "Failed to save Haari contract.");
    }
  };

  // Open Settlement Calculator for a contract
  const openSettlementModal = (contractId?: string) => {
    const targetId = contractId || (activeContracts[0]?.id ?? "");
    setSelectedContractId(targetId);
    const contract = haariRecords.find((c) => c.id === targetId);
    if (contract) {
      setSettleCrop(contract.crop || "Wheat");
      setAdvanceToDeduct(String(contract.advanceLoanAmount || 0));
    } else {
      setAdvanceToDeduct("0");
    }
    setSettlementModalOpen(true);
  };

  // Live Settlement Calculations
  const selectedContract = useMemo(
    () => haariRecords.find((c) => c.id === selectedContractId) || null,
    [haariRecords, selectedContractId]
  );

  const settlementCalculations = useMemo(() => {
    const qty = Number(yieldQuantity) || 0;
    const rate = Number(marketRate) || 0;
    const grossValue = qty * rate;
    const expenses = Number(inputExpenses) || 0;

    const lPercent = selectedContract ? selectedContract.landownerSharePercentage : 50;
    const hPercent = 100 - lPercent;
    const mode: ExpenseSharingMode = selectedContract ? selectedContract.expenseSharingMode : "SHARED_BY_PERCENTAGE";

    // Physical yield split
    const landownerPhysicalYield = (qty * lPercent) / 100;
    const hariPhysicalYield = (qty * hPercent) / 100;

    let landownerExpenseShare = 0;
    let hariExpenseShare = 0;
    let landownerGross = (grossValue * lPercent) / 100;
    let hariGross = (grossValue * hPercent) / 100;
    let landownerNet = 0;
    let hariNet = 0;

    if (mode === "SHARED_BY_PERCENTAGE") {
      landownerExpenseShare = (expenses * lPercent) / 100;
      hariExpenseShare = (expenses * hPercent) / 100;
      landownerNet = landownerGross - landownerExpenseShare;
      hariNet = hariGross - hariExpenseShare;
    } else if (mode === "LANDOWNER_BEARS_ALL") {
      landownerExpenseShare = expenses;
      hariExpenseShare = 0;
      landownerNet = landownerGross - expenses;
      hariNet = hariGross;
    } else if (mode === "HARI_BEARS_ALL") {
      landownerExpenseShare = 0;
      hariExpenseShare = expenses;
      landownerNet = landownerGross;
      hariNet = hariGross - expenses;
    }

    const currentKhaata = selectedContract ? Number(selectedContract.advanceLoanAmount || 0) : 0;
    const advanceDeducted = Math.min(currentKhaata, Math.max(0, Number(advanceToDeduct) || 0));
    const hariNetPayable = hariNet - advanceDeducted;
    const remainingKhaata = Math.max(0, currentKhaata - advanceDeducted);

    return {
      grossValue,
      lPercent,
      hPercent,
      landownerPhysicalYield,
      hariPhysicalYield,
      landownerExpenseShare,
      hariExpenseShare,
      landownerGross,
      hariGross,
      landownerNet,
      hariNet,
      advanceDeducted,
      hariNetPayable,
      remainingKhaata,
      currentKhaata,
      mode,
    };
  }, [yieldQuantity, marketRate, inputExpenses, advanceToDeduct, selectedContract]);

  // Submit Settlement
  const handleFinalizeSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    setSettleSubmitting(true);
    try {
      await addHaariSettlement({
        haariId: selectedContract.id,
        fieldId: selectedContract.fieldId,
        hariName: selectedContract.hariName,
        crop: settleCrop,
        date: settleDate,
        yieldQuantity: Number(yieldQuantity) || 0,
        yieldUnit,
        marketRate: Number(marketRate) || 0,
        grossHarvestValue: settlementCalculations.grossValue,
        totalInputExpenses: Number(inputExpenses) || 0,
        expenseSharingMode: selectedContract.expenseSharingMode,
        landownerSharePercentage: settlementCalculations.lPercent,
        hariSharePercentage: settlementCalculations.hPercent,
        landownerExpenseShare: settlementCalculations.landownerExpenseShare,
        hariExpenseShare: settlementCalculations.hariExpenseShare,
        landownerGrossShare: settlementCalculations.landownerGross,
        hariGrossShare: settlementCalculations.hariGross,
        landownerNetShare: settlementCalculations.landownerNet,
        hariNetShare: settlementCalculations.hariNet,
        advanceDeducted: settlementCalculations.advanceDeducted,
        hariNetPayable: settlementCalculations.hariNetPayable,
        notes: settleNotes.trim() || undefined,
        status: "finalized",
      });

      setSettlementModalOpen(false);
      setSuccessMsg(t("haariSettlementRecorded") || "Harvest settlement recorded successfully.");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error("Failed to finalize settlement:", err);
    } finally {
      setSettleSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
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
            {t("haariManagementSubtitle")}
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
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Wheat className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-theme-muted text-[10px] font-black uppercase tracking-widest mb-1 truncate">
              {t("haariTotalAllocatedArea")}
            </p>
            <p className="text-2xl font-black text-theme">
              {totalAllocatedArea.toFixed(1)} <span className="text-sm font-normal text-theme-muted">{t("acres")}</span>
            </p>
          </div>
        </div>

        {/* Outstanding Khaata */}
        <div className="bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <Coins className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <p className="text-theme-muted text-[10px] font-black uppercase tracking-widest mb-1 truncate">
              {t("haariTotalKhaata")}
            </p>
            <p className="text-2xl font-black text-blue-500">
              Rs {totalOutstandingKhaata.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Harvest Settlements Recorded */}
        <div className="bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <Scale className="w-7 h-7 text-purple-500" />
          </div>
          <div>
            <p className="text-theme-muted text-[10px] font-black uppercase tracking-widest mb-1 truncate">
              {t("haariSettlements")}
            </p>
            <p className="text-2xl font-black text-purple-500">
              {haariSettlements.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main View Tabs */}
      <div className="flex border-b border-theme gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("contracts")}
          className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "contracts"
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-theme-muted hover:text-theme"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t("haariAgreementsList")}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-theme-track text-theme-muted">
            {haariRecords.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settlements")}
          className={`pb-3 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "settlements"
              ? "border-amber-500 text-amber-500"
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
          {/* Create / Edit Contract Form (5 columns on lg) */}
          <div className="lg:col-span-5 bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-theme">
                {editingId ? t("edit") : t("haariNewAgreement")}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-theme-muted hover:text-theme underline"
                >
                  {t("cancel")}
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
                  onChange={(e) => handleFieldChange(e.target.value)}
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

              {/* Hari Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                  {t("haariHariName")} *
                </label>
                <input
                  type="text"
                  value={hariName}
                  onChange={(e) => setHariName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                  placeholder="e.g. Allah Dino / Ghulam Rasool"
                />
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

              {/* Crop & Allocated Area */}
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                    {t("haariAllocatedArea")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={allocatedArea}
                    onChange={(e) => setAllocatedArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                    placeholder="Acres"
                  />
                </div>
              </div>

              {/* Percentage Split Slider & Inputs */}
              <div className="p-4 rounded-2xl bg-theme-track/60 border border-theme space-y-3">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-theme-muted">
                  <span>{t("haariLandownerShare")}: <span className="text-amber-500 text-sm font-black">{landownerShare}%</span></span>
                  <span>{t("haariHariShare")}: <span className="text-emerald-500 text-sm font-black">{hariShare}%</span></span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={landownerShare}
                  onChange={(e) => setLandownerShare(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-theme-muted">
                  <span>Landowner: {landownerShare}%</span>
                  <span>Auto-balanced (100%)</span>
                  <span>Hari: {hariShare}%</span>
                </div>
              </div>

              {/* Expense Sharing Mode */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                  {t("haariExpenseSharingMode")}
                </label>
                <select
                  value={expenseSharingMode}
                  onChange={(e) => setExpenseSharingMode(e.target.value as ExpenseSharingMode)}
                  className="w-full px-3 py-2.5 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                >
                  <option value="SHARED_BY_PERCENTAGE">{t("haariExpenseSharedPercent")}</option>
                  <option value="LANDOWNER_BEARS_ALL">{t("haariExpenseLandownerAll")}</option>
                  <option value="HARI_BEARS_ALL">{t("haariExpenseHariAll")}</option>
                </select>
              </div>

              {/* Advance Loan / Khaata */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                  {t("haariAdvanceLoan")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={advanceLoanAmount}
                  onChange={(e) => setAdvanceLoanAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                  placeholder="Rs 0"
                />
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

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                  {t("description")}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm focus:ring-2 focus:ring-amber-500/40 outline-none"
                  placeholder="Optional agreement notes (e.g. seeds provided, tube-well sharing terms)"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
              >
                <Plus className="w-5 h-5" />
                {editingId ? t("update") : t("haariAddContract")}
              </button>
            </form>
          </div>

          {/* Contracts List (7 columns on lg) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm">
              <h3 className="text-lg font-black text-theme uppercase tracking-tight mb-4 flex items-center justify-between">
                <span>{t("haariActiveContracts")}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {activeContracts.length} Active
                </span>
              </h3>

              {activeContracts.length === 0 ? (
                <p className="text-theme-muted text-center py-10 italic uppercase text-xs tracking-widest font-bold">
                  {t("haariNoActive")}
                </p>
              ) : (
                <div className="space-y-4">
                  {activeContracts.map((c) => {
                    const field = fields.find((f) => f.id === c.fieldId);
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
                              {field?.name || c.fieldId} ({c.allocatedArea || field?.area || 0} acres)
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

                          {/* Share & Khaata Summary Pills */}
                          <div className="flex items-center gap-3 pt-1 flex-wrap text-xs">
                            <div className="px-2.5 py-1 rounded-lg bg-theme-track border border-theme font-medium text-theme">
                              Split: <span className="text-amber-500 font-bold">{c.landownerSharePercentage}% L</span> /{" "}
                              <span className="text-emerald-500 font-bold">{c.hariSharePercentage}% H</span>
                            </div>
                            <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 font-medium text-blue-500">
                              Khaata Advance: <span className="font-bold">Rs {(c.advanceLoanAmount || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openSettlementModal(c.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
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
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="p-2 rounded-xl text-theme-muted hover:text-blue-500 hover:bg-blue-500/10 transition"
                              title={t("edit")}
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
                          onClick={() => setEditingId(c.id)}
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

      {/* Settlements History Tab */}
      {activeTab === "settlements" && (
        <div className="bg-theme-card border border-theme rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-lg font-black text-theme uppercase tracking-tight">
              {t("haariSettlementHistory")}
            </h3>
            <button
              type="button"
              onClick={() => openSettlementModal()}
              disabled={activeContracts.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs self-start sm:self-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Settlement</span>
            </button>
          </div>

          {haariSettlements.length === 0 ? (
            <p className="text-theme-muted text-center py-12 italic uppercase text-xs tracking-widest font-bold">
              {t("haariNoSettlementsYet")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {haariSettlements.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl bg-theme-track/50 border border-theme space-y-3 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-base text-theme">{s.hariName}</p>
                      <p className="text-xs text-theme-muted">
                        {s.crop} • {format(new Date(s.date), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Finalized
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteSettlementId(s.id)}
                        className="p-1 rounded-lg text-theme-muted hover:text-red-500 transition"
                        title={t("delete")}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-theme/60">
                    <div>
                      <span className="text-theme-muted block">Harvest Yield</span>
                      <span className="font-bold text-theme">
                        {s.yieldQuantity} {s.yieldUnit} @ Rs {s.marketRate}
                      </span>
                    </div>
                    <div>
                      <span className="text-theme-muted block">Gross Value</span>
                      <span className="font-bold text-theme">
                        Rs {(s.grossHarvestValue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-theme-muted block">Input Expenses</span>
                      <span className="font-bold text-red-400">
                        Rs {(s.totalInputExpenses || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-theme-muted block">Khaata Recovered</span>
                      <span className="font-bold text-blue-400">
                        Rs {(s.advanceDeducted || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-theme-muted block">Landowner Net</span>
                      <span className="font-black text-amber-500 text-sm">
                        Rs {(s.landownerNetShare || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-theme-muted block">Net Paid to Hari</span>
                      <span className="font-black text-emerald-500 text-sm">
                        Rs {(s.hariNetPayable || 0).toLocaleString()}
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

      {/* Harvest Settlement Interactive Modal */}
      {settlementModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSettlementModalOpen(false)}
          />
          <div className="relative z-10 bg-theme-card border border-theme rounded-3xl p-5 sm:p-8 max-w-2xl w-full shadow-2xl my-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-theme">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-theme">
                    {t("haariSettlementCalculator")}
                  </h3>
                  <p className="text-xs text-theme-muted">
                    Calculate Gross Harvest, Expense Split & Khaata Deductions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettlementModalOpen(false)}
                className="p-2 rounded-xl text-theme-muted hover:text-theme hover:bg-theme-track"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizeSettlement} className="space-y-5 mt-5">
              {/* Contract Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                  {t("haariSelectContract")} *
                </label>
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
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

              {/* Total Input Expenses & Khaata Deduction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                    {t("haariTotalInputExpenses")} (Seeds, Fert, Water)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inputExpenses}
                    onChange={(e) => setInputExpenses(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm outline-none"
                    placeholder="Rs 0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                    Deduct Advance / Khaata (Max: Rs {settlementCalculations.currentKhaata.toLocaleString()})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={settlementCalculations.currentKhaata}
                    value={advanceToDeduct}
                    onChange={(e) => setAdvanceToDeduct(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm outline-none"
                    placeholder="Rs 0"
                  />
                </div>
              </div>

              {/* Interactive Live Calculation Breakdown Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-theme-track to-theme-track border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-theme/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                    {t("haariGrossValue")}
                  </span>
                  <span className="text-base font-black text-theme">
                    Rs {settlementCalculations.grossValue.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* Landowner Column */}
                  <div className="space-y-1 p-3 rounded-xl bg-theme-card/80 border border-theme">
                    <p className="font-black text-amber-500 uppercase text-[10px] tracking-wider">
                      Landowner ({settlementCalculations.lPercent}%)
                    </p>
                    <p className="text-theme-muted">
                      Physical: <span className="font-bold text-theme">{settlementCalculations.landownerPhysicalYield.toFixed(1)} {yieldUnit}</span>
                    </p>
                    <p className="text-theme-muted">
                      Gross: <span className="font-bold text-theme">Rs {settlementCalculations.landownerGross.toLocaleString()}</span>
                    </p>
                    <p className="text-red-400">
                      Expense: -Rs {settlementCalculations.landownerExpenseShare.toLocaleString()}
                    </p>
                    <p className="font-black text-sm text-theme pt-1 border-t border-theme/40">
                      Net: Rs {settlementCalculations.landownerNet.toLocaleString()}
                    </p>
                  </div>

                  {/* Hari Column */}
                  <div className="space-y-1 p-3 rounded-xl bg-theme-card/80 border border-theme">
                    <p className="font-black text-emerald-500 uppercase text-[10px] tracking-wider">
                      Hari ({settlementCalculations.hPercent}%)
                    </p>
                    <p className="text-theme-muted">
                      Physical: <span className="font-bold text-theme">{settlementCalculations.hariPhysicalYield.toFixed(1)} {yieldUnit}</span>
                    </p>
                    <p className="text-theme-muted">
                      Gross: <span className="font-bold text-theme">Rs {settlementCalculations.hariGross.toLocaleString()}</span>
                    </p>
                    <p className="text-red-400">
                      Expense: -Rs {settlementCalculations.hariExpenseShare.toLocaleString()}
                    </p>
                    <p className="text-blue-400">
                      Khaata: -Rs {settlementCalculations.advanceDeducted.toLocaleString()}
                    </p>
                    <p className="font-black text-sm text-emerald-500 pt-1 border-t border-theme/40">
                      Payable: Rs {settlementCalculations.hariNetPayable.toLocaleString()}
                    </p>
                  </div>
                </div>

                {settlementCalculations.remainingKhaata > 0 && (
                  <p className="text-[11px] text-blue-400 font-medium">
                    * Remaining Hari Khaata balance after this settlement: Rs {settlementCalculations.remainingKhaata.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Settlement Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-theme-muted mb-1">
                  Settlement Notes / Remarks
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-theme-track border border-theme text-theme text-sm outline-none"
                  placeholder="e.g. Rabi 2024 Wheat harvest finalized"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={settleSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-amber-500/20"
                >
                  {settleSubmitting ? "Finalizing…" : t("haariFinalizeSettlement")}
                </button>
                <button
                  type="button"
                  onClick={() => setSettlementModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-theme-track border border-theme text-theme-muted font-bold hover:text-theme"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Contract Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative z-10 bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-theme mb-2">{t("confirmDelete")}</h3>
            <p className="text-theme-muted text-sm mb-6 leading-relaxed">
              This Haari contract will be archived. You can undo this action from the activities logger.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  await deleteHaariRecord(deleteConfirmId);
                  setDeleteConfirmId(null);
                  setSuccessMsg(t("recordDeleted") || "Record deleted.");
                  setTimeout(() => setSuccessMsg(null), 5000);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-red-500/20"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-theme-track border border-theme text-theme-muted py-3 rounded-xl font-bold"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Settlement Confirmation Modal */}
      {deleteSettlementId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteSettlementId(null)}
          />
          <div className="relative z-10 bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-theme mb-2">Delete Settlement?</h3>
            <p className="text-theme-muted text-sm mb-6 leading-relaxed">
              Are you sure you want to remove this harvest settlement record?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  await deleteHaariSettlement(deleteSettlementId);
                  setDeleteSettlementId(null);
                  setSuccessMsg("Settlement record deleted.");
                  setTimeout(() => setSuccessMsg(null), 4000);
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteSettlementId(null)}
                className="flex-1 bg-theme-track border border-theme text-theme-muted py-3 rounded-xl font-bold"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-20 md:hidden" />
    </div>
  );
}
