import { create } from 'zustand';
import type { GeoFence, Expense, Income, ThakaRecord, WaterRecord, TemperatureRecord, AIRecommendation, Material, MaterialTransaction, DailyRegisterEntry } from '@/types';
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
}

export const useLandStore = create<LandState>((set, get) => ({
  fields: [],
  expenses: [],
  incomes: [],
  thakaRecords: [],
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
      set({
        fields: dedupeFieldsById(data.fields ?? []),
        expenses: data.expenses ?? [],
        incomes: data.incomes ?? [],
        thakaRecords: data.thakaRecords ?? [],
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

  addWaterRecord: async (record) => {
    try {
      const fromApi = await api.addWaterRecord(record);
      set((s) => ({ waterRecords: [...s.waterRecords, fromApi] }));
      return fromApi;
    } catch (e) {
      console.error('Add water record failed:', e);
      return null;
    }
  },
  updateWaterRecord: async (id, updates) => {
    try {
      const updated = await api.updateWaterRecord(id, updates);
      set((s) => ({ waterRecords: s.waterRecords.map((w) => (w.id === id ? updated : w)) }));
    } catch (e) {
      console.error('Update water record failed:', e);
    }
  },
  deleteWaterRecord: async (id) => {
    const prevWater = get().waterRecords;
    set((state) => ({ waterRecords: state.waterRecords.filter((r) => r.id !== id) }));
    try {
      await api.deleteWaterRecord(id);
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
}));
