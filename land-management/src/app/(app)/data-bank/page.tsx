"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { BookOpen, Plus, Trash2, Pencil } from "lucide-react";
import { useLandStore } from "@/lib/store";
import { useLocale } from "@/contexts/LocaleContext";
import type { DailyActivityType, MaterialUsed } from "@/types";

const ACTIVITIES: { value: DailyActivityType; labelKey: string }[] = [
  { value: "ploughing", labelKey: "dbPloughing" },
  { value: "sowing", labelKey: "dbSowing" },
  { value: "irrigation", labelKey: "dbIrrigation" },
  { value: "spraying", labelKey: "dbSpraying" },
  { value: "fertilizing", labelKey: "dbFertilizing" },
  { value: "weeding", labelKey: "dbWeeding" },
  { value: "harvesting", labelKey: "dbHarvesting" },
  { value: "other", labelKey: "dbOther" },
];

function DataBankContent() {
  const { t } = useLocale();
  const {
    fields,
    materials,
    dailyRegister,
    fetchAll,
    fetchMaterials,
    fetchDailyRegister,
    addDailyRegisterEntry,
    updateDailyRegisterEntry,
    deleteDailyRegisterEntry,
    error,
  } = useLandStore();

  const searchParams = useSearchParams();
  const fieldFromUrl = searchParams.get("field") ?? "";
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fieldId, setFieldId] = useState("");
  const [activity, setActivity] = useState<DailyActivityType>("other");
  const [laborCost, setLaborCost] = useState("");
  const [waterMinutes, setWaterMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [materialRows, setMaterialRows] = useState<{ materialId: string; quantity: string }[]>([{ materialId: "", quantity: "" }]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filterFieldId, setFilterFieldId] = useState<string>("");
  const [otherActivityText, setOtherActivityText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    fetchMaterials();
  }, [fetchAll, fetchMaterials]);

  useEffect(() => {
    fetchDailyRegister({ date: selectedDate });
  }, [selectedDate, fetchDailyRegister]);

  useEffect(() => {
    if (fieldFromUrl && fields.some((f) => f.id === fieldFromUrl)) setFieldId(fieldFromUrl);
  }, [fieldFromUrl, fields]);

  const addMaterialRow = () => setMaterialRows((r) => [...r, { materialId: "", quantity: "" }]);
  const removeMaterialRow = (i: number) => setMaterialRows((r) => r.filter((_, idx) => idx !== i));
  const updateMaterialRow = (i: number, key: "materialId" | "quantity", value: string) => {
    setMaterialRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(false);
    if (!fieldId) {
      setSubmitError(t("dbFieldRequired"));
      return;
    }
    if (activity === "other" && !otherActivityText.trim()) {
      setSubmitError(t("dbOtherActivityRequired"));
      return;
    }
    const materialsUsed: MaterialUsed[] = materialRows
      .filter((r) => r.materialId && r.quantity && Number(r.quantity) > 0)
      .map((r) => ({ materialId: r.materialId, quantity: Number(r.quantity) }));
    const combinedNotes = activity === "other" && otherActivityText.trim()
      ? [t("dbOther") + ": " + otherActivityText.trim(), notes.trim()].filter(Boolean).join(" | ")
      : notes.trim() || undefined;
    setSaving(true);
    try {
      if (editingId) {
        await updateDailyRegisterEntry(editingId, {
          date: selectedDate,
          fieldId,
          activity,
          materialsUsed,
          laborCost: laborCost ? Number(laborCost) : undefined,
          waterMinutes: waterMinutes ? Number(waterMinutes) : undefined,
          notes: combinedNotes,
        });
        setEditingId(null);
        setLaborCost("");
        setWaterMinutes("");
        setNotes("");
        setOtherActivityText("");
        setMaterialRows([{ materialId: "", quantity: "" }]);
        fetchDailyRegister({ date: selectedDate });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        return;
      }
      const ok = await addDailyRegisterEntry({
        date: selectedDate,
        fieldId,
        activity,
        materialsUsed,
        laborCost: laborCost ? Number(laborCost) : undefined,
        waterMinutes: waterMinutes ? Number(waterMinutes) : undefined,
        notes: combinedNotes,
      });
      if (ok) {
        setLaborCost("");
        setWaterMinutes("");
        setNotes("");
        setOtherActivityText("");
        setMaterialRows([{ materialId: "", quantity: "" }]);
        fetchDailyRegister({ date: selectedDate });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setSubmitError(t("dbSaveFailed"));
      }
    } finally {
      setSaving(false);
    }
  };

  const entriesForDate = useMemo(() => {
    let list = dailyRegister.filter((e) => e.date === selectedDate);
    if (filterFieldId) list = list.filter((e) => e.fieldId === filterFieldId);
    return list;
  }, [dailyRegister, selectedDate, filterFieldId]);

  const daySummary = useMemo(() => {
    const list = dailyRegister.filter((e) => e.date === selectedDate);
    const totalLabor = list.reduce((a, e) => a + (e.laborCost ?? 0), 0);
    const totalWater = list.reduce((a, e) => a + (e.waterMinutes ?? 0), 0);
    return { totalLabor, totalWater, count: list.length };
  }, [dailyRegister, selectedDate]);

  const cultivableFields = useMemo(() => {
    const seen = new Set<string>();
    return fields.filter((f) => f.status !== "not_usable" && f.id && !seen.has(f.id) && seen.add(f.id));
  }, [fields]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-theme">{t("dataBank")}</h1>
          <p className="text-theme-muted">{t("dataBankSubtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-600 dark:text-red-200">{error}</div>
      )}
      {success && (
        <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-4 text-green-700 dark:text-green-200">{t("dbEntrySaved")}</div>
      )}

      <div className="rounded-2xl border-2 border-theme bg-theme-card shadow-xl overflow-hidden">
        <div className="bg-theme-track border-b border-theme px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-theme font-medium">{t("date")}</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-lg bg-theme-card border border-theme text-theme font-mono"
            />
          </div>
          <div className="flex items-center gap-4 text-theme-muted text-sm">
            <span>{t("dbEntriesCount")}: <strong className="text-theme">{daySummary.count}</strong></span>
            {daySummary.totalLabor > 0 && <span>{t("dbTotalLabor")}: <strong className="text-theme">Rs {daySummary.totalLabor.toLocaleString()}</strong></span>}
            {daySummary.totalWater > 0 && <span>{t("dbTotalWater")}: <strong className="text-theme">{daySummary.totalWater} {t("minutes")}</strong></span>}
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-theme mb-4">{editingId ? t("edit") : t("dbNewEntry")}</h2>
          <form onSubmit={handleSaveEntry} className="space-y-4">
            {submitError && <p className="text-red-500 dark:text-red-400 text-sm">{submitError}</p>}
            {editingId && <button type="button" onClick={() => setEditingId(null)} className="text-sm text-theme-muted hover:text-theme">{t("cancel")}</button>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-theme-muted mb-1">{t("field")}</label>
                <select value={fieldId} onChange={(e) => setFieldId(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg bg-theme-track border border-theme text-theme">
                  <option value="">{t("selectField")}</option>
                  {cultivableFields.map((f, idx) => (
                    <option key={f.id ? `${f.id}-${idx}` : `field-${idx}`} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-theme-muted mb-1">{t("dbActivity")}</label>
                <select value={activity} onChange={(e) => { setActivity(e.target.value as DailyActivityType); setOtherActivityText(""); }} className="w-full px-4 py-2.5 rounded-lg bg-theme-track border border-theme text-theme">
                  {ACTIVITIES.map((a) => (
                    <option key={a.value} value={a.value}>{t(a.labelKey as keyof typeof t)}</option>
                  ))}
                </select>
              </div>
            </div>

            {activity === "other" && (
              <div>
                <label className="block text-sm text-theme-muted mb-1">{t("dbSpecifyActivity")} <span className="text-amber-500">*</span></label>
                <input
                  type="text"
                  value={otherActivityText}
                  onChange={(e) => setOtherActivityText(e.target.value)}
                  placeholder={t("dbSpecifyActivityPlaceholder")}
                  className="w-full px-4 py-2.5 rounded-lg bg-theme-track border border-theme text-theme placeholder-theme"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-theme-muted">{t("dbMaterialsUsed")}</label>
                <button type="button" onClick={addMaterialRow} className="text-xs text-amber-500 dark:text-amber-400 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> {t("dbAddMaterial")}
                </button>
              </div>
              {materials.length === 0 ? (
                <p className="text-theme-muted text-sm py-2">{t("dbNoMaterialsHint")}</p>
              ) : null}
              <div className="space-y-2">
                {materialRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap">
                    <select
                      value={row.materialId}
                      onChange={(e) => updateMaterialRow(i, "materialId", e.target.value)}
                      className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-theme-track border border-theme text-theme text-sm"
                      aria-label={t("dbMaterialsUsed")}
                    >
                      <option value="">{t("materialsSelectMaterial")}</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — {m.currentStock} {m.unit}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={t("materialsQty")}
                      value={row.quantity}
                      onChange={(e) => updateMaterialRow(i, "quantity", e.target.value)}
                      className="w-24 px-3 py-2 rounded-lg bg-theme-track border border-theme text-theme text-sm placeholder-theme"
                    />
                    {materialRows.length > 1 && (
                      <button type="button" onClick={() => removeMaterialRow(i)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-500/20 rounded" aria-label={t("cancel")}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-theme-muted mb-1">{t("dbLaborCost")}</label>
                <input type="number" min="0" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-theme-track border border-theme text-theme" />
              </div>
              <div>
                <label className="block text-sm text-theme-muted mb-1">{t("dbWaterMinutes")}</label>
                <input type="number" min="0" value={waterMinutes} onChange={(e) => setWaterMinutes(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-theme-track border border-theme text-theme" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-1">{t("dbNotes")}</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("dbNotesPlaceholder")} className="w-full px-4 py-2.5 rounded-lg bg-theme-track border border-theme text-theme placeholder-theme" />
            </div>
            <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-50">
              {saving ? t("materialsSaving") : t("dbSaveEntry")}
            </button>
          </form>
        </div>

        <div className="border-t border-theme">
          <div className="px-6 py-3 bg-theme-track flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-semibold text-theme">{t("dbEntriesFor")} {selectedDate}</h3>
            {fields.length > 0 && (
              <select value={filterFieldId} onChange={(e) => setFilterFieldId(e.target.value)} className="px-3 py-1.5 rounded-lg bg-theme-card border border-theme text-theme text-sm">
                <option value="">{t("dbAllFields")}</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-theme bg-theme-track text-theme-muted">
                  <th className="px-4 py-3 font-medium">{t("field")}</th>
                  <th className="px-4 py-3 font-medium">{t("dbActivity")}</th>
                  <th className="px-4 py-3 font-medium">{t("dbMaterials")}</th>
                  <th className="px-4 py-3 font-medium">{t("dbLabor")}</th>
                  <th className="px-4 py-3 font-medium">{t("dbWater")}</th>
                  <th className="px-4 py-3 font-medium">{t("dbNotes")}</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="text-theme">
                {entriesForDate.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-theme-muted">{t("dbNoEntriesForDate")}</td>
                  </tr>
                ) : (
                  entriesForDate.map((entry, idx) => (
                    <tr key={entry.id ? `${entry.id}-${idx}` : `entry-${idx}`} className="border-b border-theme hover:bg-theme-track">
                      <td className="px-4 py-2.5">{fields.find((f) => f.id === entry.fieldId)?.name ?? entry.fieldId}</td>
                      <td className="px-4 py-2.5">
                        {entry.activity === "other" && entry.notes?.startsWith(t("dbOther") + ": ")
                          ? entry.notes.slice((t("dbOther") + ": ").length).split(" | ")[0]
                          : (t(ACTIVITIES.find((a) => a.value === entry.activity)?.labelKey as keyof typeof t) || entry.activity)}
                      </td>
                      <td className="px-4 py-2.5">
                        {entry.materialsUsed?.length ? entry.materialsUsed.map((mu) => { const m = materials.find((x) => x.id === mu.materialId); return m ? `${m.name} ${mu.quantity}${m.unit}` : mu.quantity; }).join(", ") : "—"}
                      </td>
                      <td className="px-4 py-2.5">{entry.laborCost != null ? `Rs ${entry.laborCost.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-2.5">{entry.waterMinutes != null ? `${entry.waterMinutes} ${t("minutes")}` : "—"}</td>
                      <td className="px-4 py-2.5 max-w-[120px] truncate">
                        {entry.activity === "other" && entry.notes
                          ? (entry.notes.includes(" | ") ? entry.notes.split(" | ").slice(1).join(" | ") : "—")
                          : (entry.notes || "—")}
                      </td>
                      <td className="px-4 py-2.5 flex gap-1">
                        <button type="button" onClick={() => { const e = entry; setFieldId(e.fieldId); setSelectedDate(e.date); setActivity(e.activity as DailyActivityType); setLaborCost(e.laborCost != null ? String(e.laborCost) : ""); setWaterMinutes(e.waterMinutes != null ? String(e.waterMinutes) : ""); if (e.activity === "other" && e.notes?.startsWith(t("dbOther") + ": ")) { setOtherActivityText(e.notes.slice((t("dbOther") + ": ").length).split(" | ")[0] || ""); setNotes(e.notes.includes(" | ") ? e.notes.split(" | ").slice(1).join(" | ") : ""); } else { setOtherActivityText(""); setNotes(e.notes || ""); } setMaterialRows(e.materialsUsed?.length ? e.materialsUsed.map((mu) => ({ materialId: mu.materialId, quantity: String(mu.quantity) })) : [{ materialId: "", quantity: "" }]); setEditingId(e.id); setSubmitError(null); }} className="p-1.5 text-theme-muted hover:bg-theme-track rounded" title={t("edit")}><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setDeleteConfirmId(entry.id)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-500/20 rounded" title={t("delete")}><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-theme-card border border-theme rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-theme mb-4">{t("confirmDelete")}</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl border border-theme text-theme-muted hover:text-theme">
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteDailyRegisterEntry(deleteConfirmId);
                  setDeleteConfirmId(null);
                  fetchDailyRegister({ date: selectedDate });
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-theme hover:bg-red-500"
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

export default function DataBankPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[200px] items-center justify-center text-theme-muted">Loading…</div>}>
      <DataBankContent />
    </Suspense>
  );
}
