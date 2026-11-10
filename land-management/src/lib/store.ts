import { create } from 'zustand';
import type { GeoFence, Expense, Income, ThakaRecord, HaariRecord, HaariSettlement, WaterRecord, TemperatureRecord, AIRecommendation, Material, MaterialTransaction, DailyRegisterEntry, Activity } from '@/types';
import { api } from './api';

function dedupeFieldsById(items: GeoFence[]): GeoFence[] {
  const seen = new Set<string>();
  return items.filter((f) => f.id && !seen.has(f.id) && seen.add(f.id));
}

export interface FieldRecommendation {
  fieldId: string;
  fieldName: string;
  reason: string;
  message: string;
  priority: string;
}

interface LandState {
  fields: GeoFence[];
  expenses: Expense[];
  incomes: Income[];
  thakaRecords: ThakaRecord[];
  haariRecords: HaariRecord[];
  haariSettlements: HaariSettlement[];
  waterRecords: WaterRecord[];
  temperatureRecords: TemperatureRecord[];
  aiRecommendations: AIRecommendation[];
  materials: Material[];
  materialTransactions: MaterialTransaction[];
  dailyRegister: DailyRegisterEntry[];
  fieldRecommendations: FieldRecommendation[];
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  addField: (field: Omit<GeoFence, 'id'> & { id?: string }) => Promise<GeoFence | null>;
  updateField: (id: string, updates: Partial<GeoFence>) => Promise<void>;
  deleteField: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'> & { id?: string }) => Promise<Expense | null>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addIncome: (income: Omit<Income, 'id'> & { id?: string }) => Promise<Income | null>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addThakaRecord: (record: Omit<ThakaRecord, 'id'> & { id?: string }) => Promise<ThakaRecord | null>;
  updateThakaRecord: (id: string, updates: Partial<ThakaRecord>) => Promise<void>;
  deleteThakaRecord: (id: string) => Promise<void>;
  addHaariRecord: (record: Omit<HaariRecord, 'id'> & { id?: string }) => Promise<HaariRecord | null>;
  updateHaariRecord: (id: string, updates: Partial<HaariRecord>) => Promise<void>;
  deleteHaariRecord: (id: string) => Promise<void>;
  addHaariSettlement: (settlement: Omit<HaariSettlement, 'id'> & { id?: string }) => Promise<HaariSettlement | null>;
  deleteHaariSettlement: (id: string) => Promise<void>;
  addWaterRecord: (record: Omit<WaterRecord, 'id'> & { id?: string }) => Promise<WaterRecord | null>;
  updateWaterRecord: (id: string, updates: Partial<WaterRecord>) => Promise<void>;
  deleteWaterRecord: (id: string) => Promise<void>;
  addTemperatureRecord: (record: Omit<TemperatureRecord, 'id'> & { id?: string }) => Promise<TemperatureRecord | null>;
  generateAIRecommendations: () => Promise<void>;

  fetchMaterials: () => Promise<void>;
  addMaterial: (material: Omit<Material, 'id'> & { id?: string }) => Promise<Material | null>;
  updateMaterial: (id: string, updates: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  fetchMaterialTransactions: (params?: { dateFrom?: string; dateTo?: string; materialId?: string }) => Promise<void>;
  addMaterialTransaction: (tx: Omit<MaterialTransaction, 'id'> & { id?: string }) => Promise<MaterialTransaction | null>;
  updateMaterialTransaction: (id: string, updates: Partial<MaterialTransaction>) => Promise<void>;
  deleteMaterialTransaction: (id: string) => Promise<void>;

  fetchDailyRegister: (params?: { date?: string; fieldId?: string }) => Promise<void>;
  addDailyRegisterEntry: (entry: Omit<DailyRegisterEntry, 'id'> & { id?: string }) => Promise<DailyRegisterEntry | null>;
  updateDailyRegisterEntry: (id: string, updates: Partial<DailyRegisterEntry>) => Promise<void>;
  deleteDailyRegisterEntry: (id: string) => Promise<void>;

  fetchFieldRecommendations: () => Promise<void>;
  undoDelete: () => Promise<void>;
}

export const useLandStore = create<LandState>((set, get) => ({
  fields: [],
  expenses: [],
  incomes: [],
  thakaRecords: [],
  haariRecords: [],
  haariSettlements: [],
  waterRecords: [],
  temperatureRecords: [],
  aiRecommendations: [],
  materials: [],
  materialTransactions: [],
  dailyRegister: [],
  fieldRecommendations: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.getDashboard();
      let haariRecords = data.haariRecords;
      let haariSettlements = data.haariSettlements;

      if (!haariRecords || !Array.isArray(haariRecords) || haariRecords.length === 0) {
        try {
          const fetchedHaari = await api.getHaariRecords();
          if (fetchedHaari && fetchedHaari.length > 0) {
            haariRecords = fetchedHaari;
          }
        } catch (_) {}
      }
      if (!haariSettlements || !Array.isArray(haariSettlements) || haariSettlements.length === 0) {
        try {
          const fetchedSettlements = await api.getHaariSettlements();
          if (fetchedSettlements && fetchedSettlements.length > 0) {
            haariSettlements = fetchedSettlements;
          }
        } catch (_) {}
      }

      set({
        fields: dedupeFieldsById(data.fields ?? []),
        expenses: data.expenses ?? [],
        incomes: data.incomes ?? [],
        thakaRecords: data.thakaRecords ?? [],
        haariRecords: haariRecords ?? [],
        haariSettlements: haariSettlements ?? [],
        waterRecords: data.waterRecords ?? [],
        temperatureRecords: data.temperatureRecords ?? [],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({
        error: msg,
        fields: [],
        expenses: [],
        incomes: [],
        thakaRecords: [],
        haariRecords: [],
        haariSettlements: [],
        waterRecords: [],
        temperatureRecords: [],
      });
    } finally {
      set({ loading: false });
    }
  },

  addField: async (field) => {
    try {
      const fromApi = await api.addField(field);
      set((s) => ({ fields: dedupeFieldsById([...s.fields, fromApi]) }));
      return fromApi;
    } catch (e) {
      console.error('Add field failed:', e);
      return null;
    }
  },

  updateField: async (id, updates) => {
    try {
      const updated = await api.updateField(id, updates);
      set((s) => ({
        fields: s.fields.map((f) => (f.id === id ? updated : f)),
      }));
    } catch (e) {
      console.error('Update field failed:', e);
    }
  },

  deleteField: async (id) => {
    const prevFields = get().fields;
    set((state) => ({ fields: state.fields.filter((f) => f.id !== id) }));
    try {
      await api.deleteField(id);
      await get().fetchAll();
    } catch (e) {
      console.error('Delete field failed, reverting:', e);
      set({ fields: prevFields });
    }
  },

  addExpense: async (expense) => {
    try {
      const fromApi = await api.addExpense(expense);
      set((s) => ({ expenses: [...s.expenses, fromApi] }));
      return fromApi;
    } catch (e) {
      console.error('Add expense failed:', e);
      return null;
    }
  },
  updateExpense: async (id, updates) => {
    try {
      const updated = await api.updateExpense(id, updates);
      set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? updated : e)) }));
    } catch (e) {
      console.error('Update expense failed:', e);
    }
  },
  deleteExpense: async (id) => {
    const prevExpenses = get().expenses;
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
    try {
      await api.deleteExpense(id);
      await get().fetchAll();
    } catch (e) {
      console.error('Delete expense failed, reverting:', e);
      set({ expenses: prevExpenses });
    }
  },

  addIncome: async (income) => {
    try {
      const fromApi = await api.addIncome(income);
      set((s) => ({ incomes: [...s.incomes, fromApi] }));
      return fromApi;
    } catch (e) {
      console.error('Add income failed:', e);
      return null;
    }
  },
  updateIncome: async (id, updates) => {
    try {
      const updated = await api.updateIncome(id, updates);
      set((s) => ({ incomes: s.incomes.map((i) => (i.id === id ? updated : i)) }));
    } catch (e) {
      console.error('Update income failed:', e);
    }
  },
  deleteIncome: async (id) => {
    const prevIncomes = get().incomes;
    set((state) => ({ incomes: state.incomes.filter((i) => i.id !== id) }));
    try {
      await api.deleteIncome(id);
      await get().fetchAll();
    } catch (e) {
      console.error('Delete income failed, reverting:', e);
      set({ incomes: prevIncomes });
    }
  },

  addThakaRecord: async (record) => {
    try {
      const fromApi = await api.addThakaRecord(record);
      set((s) => ({ thakaRecords: [...s.thakaRecords, fromApi] }));
      return fromApi;
    } catch (e) {
      console.error('Add thaka failed:', e);
      return null;
    }
  },
  updateThakaRecord: async (id, updates) => {
    try {
      const updated = await api.updateThakaRecord(id, updates);
      set((s) => ({ thakaRecords: s.thakaRecords.map((t) => (t.id === id ? updated : t)) }));
    } catch (e) {
      console.error('Update thaka failed:', e);
    }
  },
  deleteThakaRecord: async (id) => {
    const prevThaka = get().thakaRecords;
    set((state) => ({ thakaRecords: state.thakaRecords.filter((r) => r.id !== id) }));
    try {
      await api.deleteThakaRecord(id);
      await get().fetchAll();
    } catch (e) {
      console.error('Delete thaka record failed, reverting:', e);
      set({ thakaRecords: prevThaka });
    }
  },

  addHaariRecord: async (record) => {
    try {
      const fromApi = await api.addHaariRecord(record);
      set((s) => ({ haariRecords: [...s.haariRecords, fromApi] }));
      return fromApi;
    } catch (e) {
      console.error('Add haari failed:', e);
      return null;
    }
  },
  updateHaariRecord: async (id, updates) => {
    try {
      const updated = await api.updateHaariRecord(id, updates);
      set((s) => ({ haariRecords: s.haariRecords.map((h) => (h.id === id ? updated : h)) }));
    } catch (e) {
      console.error('Update haari failed:', e);
    }
  },
  deleteHaariRecord: async (id) => {
    const prevHaari = get().haariRecords;
    set((state) => ({ haariRecords: state.haariRecords.filter((r) => r.id !== id) }));
    try {
      await api.deleteHaariRecord(id);
      await get().fetchAll();
    } catch (e) {
      console.error('Delete haari record failed, reverting:', e);
      set({ haariRecords: prevHaari });
    }
  },

  addHaariSettlement: async (settlement) => {
    try {
      const fromApi = await api.addHaariSettlement(settlement);
      set((s) => ({ haariSettlements: [fromApi, ...s.haariSettlements] }));
      // Refresh to update Khaata balances and contract state
      await get().fetchAll();
      return fromApi;
    } catch (e) {
      console.error('Add haari settlement failed:', e);
      return null;
    }
  },
  deleteHaariSettlement: async (id) => {
    const prevSettlements = get().haariSettlements;
    set((state) => ({ haariSettlements: state.haariSettlements.filter((s) => s.id !== id) }));
    try {
      await api.deleteHaariSettlement(id);
      await get().fetchAll();
    } catch (e) {
      console.error('Delete haari settlement failed, reverting:', e);
      set({ haariSettlements: prevSettlements });
    }
  },

  addWaterRecord: async (record) => {
    try {
      // Prefer unified Activities API so it works even if /water is not deployed.
      const activity = await api.addActivity({
        activity_type: 'irrigation',
        field_id: record.fieldId,
        date: record.date,
        quantity_used: record.durationMinutes,
        notes: record.notes,
      });

      // Map created activity into a WaterRecord shape (same as dashboard shim).
      const waterRecord: WaterRecord = {
        id: activity.id,
        fieldId: activity.field_id,
        date: activity.date,
        durationMinutes: activity.quantity_used ?? 0,
        notes: activity.notes,
      };

      set((s) => ({ waterRecords: [...s.waterRecords, waterRecord] }));
      return waterRecord;
    } catch (e) {
      console.error('Add water record failed:', e);
      return null;
    }
  },
  updateWaterRecord: async (id, updates) => {
    try {
      // Map WaterRecord shape back to Activity payload
      const payload: Partial<Activity> = {};
      if (updates.fieldId) payload.field_id = updates.fieldId;
      if (updates.date) payload.date = updates.date;
      if (updates.durationMinutes !== undefined) payload.quantity_used = updates.durationMinutes;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      // Use unified API so it works for records stored in 'activities'
      await api.updateActivity(id, payload);
      set((s) => ({
        waterRecords: s.waterRecords.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      }));
    } catch (e) {
      console.error('Update water record failed:', e);
    }
  },
  deleteWaterRecord: async (id) => {
    const prevWater = get().waterRecords;
    set((state) => ({ waterRecords: state.waterRecords.filter((r) => r.id !== id) }));
    try {
      // Use unified detail endpoint for delete
      await api.deleteActivity(id);
      await get().fetchAll();
    } catch (e) {
      console.error('Delete water record failed, reverting:', e);
      set({ waterRecords: prevWater });
    }
  },

  addTemperatureRecord: async (record) => {
    try {
      const fromApi = await api.addTemperatureRecord(record);
      set((s) => ({ temperatureRecords: [...s.temperatureRecords, fromApi] }));
      return fromApi;
    } catch (e) {
      console.error('Add temperature failed:', e);
      return null;
    }
  },

  generateAIRecommendations: async () => {
    try {
      const recs = await api.getAIRecommendations();
      set({ aiRecommendations: recs });
    } catch (e) {
      set({ aiRecommendations: [] });
    }
  },

  fetchMaterials: async () => {
    try {
      const list = await api.getMaterials();
      set({ materials: list });
    } catch (e) {
      set({ materials: [] });
    }
  },
  addMaterial: async (material) => {
    try {
      const fromApi = await api.addMaterial(material);
      set((s) => ({ materials: [...s.materials, fromApi] }));
      return fromApi;
    } catch (e) {
      console.error('Add material failed:', e);
      return null;
    }
  },
  updateMaterial: async (id, updates) => {
    try {
      const updated = await api.updateMaterial(id, updates);
      set((s) => ({ materials: s.materials.map((m) => (m.id === id ? updated : m)) }));
    } catch (e) {
      console.error('Update material failed:', e);
    }
  },
  deleteMaterial: async (id) => {
    // Optimistic update: remove from local state immediately
    const prevMaterials = get().materials;
    const prevTransactions = get().materialTransactions;
    set((state) => ({
      materials: state.materials.filter((m) => m.id !== id),
      materialTransactions: state.materialTransactions.filter((tx) => tx.materialId !== id)
    }));

    try {
      await api.deleteMaterial(id);
      // Re-fetch to ensure sync with backend
      await get().fetchMaterials();
      await get().fetchMaterialTransactions();
    } catch (e) {
      console.error('Delete material failed, reverting:', e);
      set({ materials: prevMaterials, materialTransactions: prevTransactions });
    }
  },
  fetchMaterialTransactions: async (params) => {
    try {
      const list = await api.getMaterialTransactions(params);
      set({ materialTransactions: list });
    } catch (e) {
      set({ materialTransactions: [] });
    }
  },
  addMaterialTransaction: async (tx) => {
    try {
      const fromApi = await api.addMaterialTransaction(tx);
      set((s) => ({ materialTransactions: [...s.materialTransactions, fromApi] }));
      await get().fetchMaterials();
      return fromApi;
    } catch (e) {
      console.error('Add material transaction failed:', e);
      return null;
    }
  },
  updateMaterialTransaction: async (id, updates) => {
    try {
      const updated = await api.updateMaterialTransaction(id, updates);
      set((s) => ({ materialTransactions: s.materialTransactions.map((t) => (t.id === id ? updated : t)) }));
      await get().fetchMaterials();
    } catch (e) {
      console.error('Update material transaction failed:', e);
    }
  },
  deleteMaterialTransaction: async (id) => {
    const prevTransactions = get().materialTransactions;
    set((state) => ({
      materialTransactions: state.materialTransactions.filter((tx) => tx.id !== id)
    }));
    try {
      await api.deleteMaterialTransaction(id);
      await get().fetchMaterialTransactions();
      await get().fetchMaterials(); // Transactions affect stock
    } catch (e) {
      console.error('Delete transaction failed, reverting:', e);
      set({ materialTransactions: prevTransactions });
    }
  },

  fetchDailyRegister: async (params) => {
    try {
      const list = await api.getDailyRegister(params);
      set({ dailyRegister: list });
    } catch (e) {
      set({ dailyRegister: [] });
    }
  },
  addDailyRegisterEntry: async (entry) => {
    try {
      const fromApi = await api.addDailyRegisterEntry(entry);
      set((s) => ({ dailyRegister: [...s.dailyRegister, fromApi] }));
      await get().fetchMaterials();
      return fromApi;
    } catch (e) {
      console.error('Add daily register entry failed:', e);
      return null;
    }
  },
  updateDailyRegisterEntry: async (id, updates) => {
    try {
      const updated = await api.updateDailyRegisterEntry(id, updates);
      set((s) => ({ dailyRegister: s.dailyRegister.map((e) => (e.id === id ? updated : e)) }));
      await get().fetchMaterials();
    } catch (e) {
      console.error('Update daily register entry failed:', e);
    }
  },
  deleteDailyRegisterEntry: async (id) => {
    const prevRegister = get().dailyRegister;
    set((state) => ({
      dailyRegister: state.dailyRegister.filter((e) => e.id !== id)
    }));
    try {
      await api.deleteDailyRegisterEntry(id);
      await get().fetchDailyRegister();
      await get().fetchMaterials(); // May revert stock usage
    } catch (e) {
      console.error('Delete register entry failed, reverting:', e);
      set({ dailyRegister: prevRegister });
    }
  },

  fetchFieldRecommendations: async () => {
    try {
      const list = await api.getFieldRecommendations();
      set({ fieldRecommendations: list });
    } catch (e) {
      set({ fieldRecommendations: [] });
      throw e;
    }
  },
  undoDelete: async () => {
    set({ loading: true });
    try {
      await api.undoLastDelete();
      await get().fetchAll();
      await get().fetchMaterials();
      await get().fetchDailyRegister();
    } catch (e) {
      console.error('Undo failed:', e);
    } finally {
      set({ loading: false });
    }
  },
}));
