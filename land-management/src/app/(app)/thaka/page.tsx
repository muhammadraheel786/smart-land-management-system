"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, FileText, Pencil, Trash } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { format, isAfter } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";

export default function ThakaPage() {
  const { t } = useLocale();
  const { fields, thakaRecords, addThakaRecord, updateThakaRecord, deleteThakaRecord, updateField, fetchAll, loading, error } = useLandStore();
  const [tenantName, setTenantName] = useState("");
  const [tenantContact, setTenantContact] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (editingId) {
      const r = thakaRecords.find((x) => x.id === editingId);
      if (r) {
        setFieldId(r.fieldId);
        setTenantName(r.tenantName);
        setTenantContact(r.tenantContact ?? "");
        setStartDate(r.startDate);
        setEndDate(r.endDate);
        setAmount(String(r.amount));
      }
    }
  }, [editingId, thakaRecords]);

  const availableFields = useMemo(() => fields.filter((f) => f.status !== "thaka"), [fields]);
  const noFields = fields.length === 0;
  const allLeased = fields.length > 0 && availableFields.length === 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(false);
    const amt = Number(amount);
    if (!fieldId || !tenantName.trim() || !startDate || !endDate || !amount || amt < 1) {
      setSubmitError(t("thakaFillRequired"));
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setSubmitError(t("thakaEndAfterStart"));
      return;
    }
    if (editingId) {
      await updateThakaRecord(editingId, {
        fieldId,
        tenantName: tenantName.trim(),
        tenantContact: tenantContact.trim() || undefined,
        startDate,
        endDate,
        amount: amt,
        status: "active",
      });
      setEditingId(null);
      setTenantName("");
      setTenantContact("");
      setFieldId("");
      setAmount("");
      setEndDate("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }
    const ok = await addThakaRecord({
      fieldId,
      tenantName: tenantName.trim(),
      tenantContact: tenantContact.trim() || undefined,
      startDate,
      endDate,
      amount: amt,
      status: "active",
    });
    if (ok) {
      try {
        await updateField(fieldId, { status: "thaka" });
      } catch (_) { }
      setTenantName("");
      setTenantContact("");
      setFieldId("");
      setAmount("");
      setEndDate("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setSubmitError(t("thakaAddFailed"));
    }
  };

  const activeRecords = useMemo(() => thakaRecords.filter((r) => r.status === "active" && isAfter(new Date(r.endDate), new Date())), [thakaRecords]);
  const expiredRecords = useMemo(() => thakaRecords.filter((r) => !isAfter(new Date(r.endDate), new Date())), [thakaRecords]);
  const totalActiveAmount = useMemo(() => activeRecords.reduce((a, r) => a + r.amount, 0), [activeRecords]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-theme tracking-tight">{t("thakaManagement")}</h1>
          </div>
          <p className="text-xs sm:text-sm text-theme-muted ml-[52px] mt-1">{t("thakaManagementSubtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">{error}</div>
      )}

      {loading && fields.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-theme-card border border-theme animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-theme-card border border-theme rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">{t("thakaActiveLeases")}</p>
                <p className="text-xl font-black text-theme">{activeRecords.length}</p>
              </div>
            </div>
            <div className="bg-theme-card border border-theme rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">{t("thakaExpired")}</p>
                <p className="text-xl font-black text-theme">{expiredRecords.length}</p>
              </div>
            </div>
            <div className="bg-theme-card border border-theme rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-violet-500" />
              </div>
              <div>
                <p className="text-theme-muted text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">{t("thakaTotalLeaseIncome")}</p>
                <p className="text-xl font-black text-violet-500">Rs {totalActiveAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-theme-card border border-theme rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-theme mb-4">{editingId ? t("edit") : t("thakaNewAgreement")}</h3>
              {noFields ? (
                <p className="text-theme-muted py-4">{t("thakaNoFields")}</p>
              ) : allLeased ? (
                <p className="text-theme-muted py-4">{t("thakaAllFieldsLeased")}</p>
              ) : (
                <form onSubmit={handleAdd} className="space-y-4">
                  {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
                  {success && <p className="text-green-400 text-sm">{editingId ? t("recordUpdated") : t("thakaRecordAdded")}</p>}
                  {editingId && <button type="button" onClick={() => setEditingId(null)} className="text-sm text-theme-muted hover:text-theme">{t("cancel")}</button>}
                  <div>
                    <label className="block text-sm text-theme-muted mb-1">{t("field")}</label>
                    <select value={fieldId} onChange={(e) => setFieldId(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme focus:ring-2 focus:ring-violet-500/50">
                      <option value="">{t("selectField")}</option>
                      {(editingId ? fields : availableFields).map((f) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.area?.toFixed(1)} {t("acres")})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-theme-muted mb-1">{t("tenantName")}</label>
                    <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme" placeholder={t("tenantName")} />
                  </div>
                  <div>
                    <label className="block text-sm text-theme-muted mb-1">{t("thakaContactOptional")}</label>
                    <input type="text" value={tenantContact} onChange={(e) => setTenantContact(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme" placeholder={t("thakaContactPlaceholder")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-theme-muted mb-1">{t("startDate")}</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme" />
                    </div>
                    <div>
                      <label className="block text-sm text-theme-muted mb-1">{t("endDate")}</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-theme-muted mb-1">{t("thakaLeaseAmount")}</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min={1} className="w-full px-4 py-3 rounded-xl bg-theme-track border border-theme text-theme" placeholder="Rs" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 text-theme font-semibold hover:bg-violet-500 disabled:opacity-50 transition flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    {editingId ? t("update") : t("thakaAddRecord")}
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-theme-card border border-theme rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-theme mb-4">{t("thakaActiveLeasesTitle")}</h3>
                {activeRecords.length === 0 ? (
                  <p className="text-theme-muted">{t("thakaNoActive")}</p>
                ) : (
                  <div className="space-y-3 max-h-[320px] overflow-auto">
                    {activeRecords.map((r) => (
                      <div key={r.id} className="flex items-start justify-between gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                        <div>
                          <p className="font-medium text-theme">{fields.find((f) => f.id === r.fieldId)?.name ?? r.fieldId} → {r.tenantName}</p>
                          <p className="text-sm text-theme-muted">{format(new Date(r.startDate), "MMM d, yyyy")} – {format(new Date(r.endDate), "MMM d, yyyy")}</p>
                          <p className="text-green-400 font-semibold mt-1">Rs {r.amount.toLocaleString()}</p>
                          {r.tenantContact && <p className="text-xs text-theme-muted mt-1">{r.tenantContact}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button type="button" onClick={() => { setEditingId(r.id); setSubmitError(null); setSuccess(false); }} className="p-2 rounded-lg text-theme-muted hover:text-theme hover:bg-white/10" title={t("edit")}><Pencil className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setDeleteConfirmId(r.id)} className="p-2 rounded-lg text-theme-muted hover:text-red-400 hover:bg-red-500/10" title={t("delete")}><Trash className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-theme-card border border-theme rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-theme mb-4">{t("thakaExpiredPast")}</h3>
                {expiredRecords.length === 0 ? (
                  <p className="text-theme-muted">{t("thakaNoExpired")}</p>
                ) : (
                  <div className="space-y-3 max-h-[240px] overflow-auto">
                    {expiredRecords.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-theme-track border border-theme opacity-90">
                        <div>
                          <p className="font-medium text-theme">{fields.find((f) => f.id === r.fieldId)?.name ?? r.fieldId} → {r.tenantName}</p>
                          <p className="text-sm text-theme-muted">{t("thakaEnded")} {format(new Date(r.endDate), "MMM d, yyyy")}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button type="button" onClick={() => { setEditingId(r.id); setSubmitError(null); setSuccess(false); }} className="p-2 rounded-lg text-theme-muted hover:text-theme hover:bg-white/10" title={t("edit")}><Pencil className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setDeleteConfirmId(r.id)} className="p-2 rounded-lg text-theme-muted hover:text-red-400 hover:bg-red-500/10" title={t("delete")}><Trash className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {deleteConfirmId && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
              <div className="relative z-10 bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trash className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-theme mb-2">{t("confirmDelete")}</h3>
                <p className="text-theme-muted text-sm mb-8 leading-relaxed">This record will be permanently removed. This cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      await deleteThakaRecord(deleteConfirmId);
                      setDeleteConfirmId(null);
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]"
                  >
                    Yes, Delete
                  </button>
                  <button onClick={() => setDeleteConfirmId(null)} className="flex-1 bg-theme-track border border-theme text-theme-muted py-3.5 rounded-xl font-bold">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div className="h-20 md:hidden" />
    </div>
  );
}
