import { API_BASE_URL } from "@/config/api";

/** API client.
 * - All requests go directly to the Django backend origin (no Next.js /api proxy).
 * - API base: `${API_BASE_URL}/api`, where API_BASE_URL comes from NEXT_PUBLIC_API_URL
 *   or defaults to http://localhost:8000 in development.
 * - All API paths must have NO trailing slash to match Django (APPEND_SLASH = False).
 */
const API_BASE = `${API_BASE_URL.replace(/\/$/, "")}/api`;

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = localStorage.getItem("smartland_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...options?.headers },
  });
  if (res.status === 401) {
    // Do not hard-redirect; let callers decide how to handle 401.
    if (typeof window !== "undefined") {
      localStorage.removeItem("smartland_token");
      localStorage.removeItem("smartland_email");
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  /** Login: sends { email, password }, returns { token, email }. Uses credentials for cookies if ever needed. */
  async login(email: string, password: string): Promise<{ token: string; email: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error ?? data?.detail ?? `API error ${res.status}`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return data as { token: string; email: string };
  },

  async getDashboard() {
    return fetchJson<{
      fields: import('@/types').GeoFence[];
      expenses: import('@/types').Expense[];
      incomes: import('@/types').Income[];
      thakaRecords: import('@/types').ThakaRecord[];
      waterRecords: import('@/types').WaterRecord[];
      temperatureRecords: import('@/types').TemperatureRecord[];
    }>('/dashboard');
  },

  async getFields() {
    return fetchJson<import('@/types').GeoFence[]>('/fields');
  },
  async addField(field: Omit<import('@/types').GeoFence, 'id'> & { id?: string }) {
    return fetchJson<import('@/types').GeoFence>('/fields', {
      method: 'POST',
      body: JSON.stringify(field),
    });
  },
  async updateField(id: string, updates: Partial<import('@/types').GeoFence>) {
    return fetchJson<import('@/types').GeoFence>(`/fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  async deleteField(id: string) {
    return fetchJson<void>(`/fields/${id}`, { method: 'DELETE' });
  },

  async getExpenses() {
    return fetchJson<import('@/types').Expense[]>('/expenses');
  },
  async addExpense(expense: Omit<import('@/types').Expense, 'id'> & { id?: string }) {
    return fetchJson<import('@/types').Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },
  async updateExpense(id: string, updates: Partial<import('@/types').Expense>) {
    return fetchJson<import('@/types').Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  async deleteExpense(id: string) {
    return fetchJson<void>(`/expenses/${id}`, { method: 'DELETE' });
  },

  async getIncomes() {
    return fetchJson<import('@/types').Income[]>('/incomes');
  },
  async addIncome(income: Omit<import('@/types').Income, 'id'> & { id?: string }) {
    return fetchJson<import('@/types').Income>('/incomes', {
      method: 'POST',
      body: JSON.stringify(income),
    });
  },
  async updateIncome(id: string, updates: Partial<import('@/types').Income>) {
    return fetchJson<import('@/types').Income>(`/incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  async deleteIncome(id: string) {
    return fetchJson<void>(`/incomes/${id}`, { method: 'DELETE' });
  },

  async getThakaRecords() {
    return fetchJson<import('@/types').ThakaRecord[]>('/thaka');
  },
  async addThakaRecord(record: Omit<import('@/types').ThakaRecord, 'id'> & { id?: string }) {
    return fetchJson<import('@/types').ThakaRecord>('/thaka', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },
  async updateThakaRecord(id: string, updates: Partial<import('@/types').ThakaRecord>) {
    return fetchJson<import('@/types').ThakaRecord>(`/thaka/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  async deleteThakaRecord(id: string) {
    return fetchJson<void>(`/thaka/${id}`, { method: 'DELETE' });
  },

  async getWaterRecords() {
    return fetchJson<import('@/types').WaterRecord[]>('/water');
  },
  async addWaterRecord(record: Omit<import('@/types').WaterRecord, 'id'> & { id?: string }) {
    return fetchJson<import('@/types').WaterRecord>('/water', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },
  async updateWaterRecord(id: string, updates: Partial<import('@/types').WaterRecord>) {
    return fetchJson<import('@/types').WaterRecord>(`/water/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  async deleteWaterRecord(id: string) {
    return fetchJson<void>(`/water/${id}`, { method: 'DELETE' });
  },

  /** Water management: AI analysis, warnings, and next-water suggestions per field. */
  async getWaterAnalysis(): Promise<import('@/types').WaterAnalysisResponse> {
    return fetchJson<import('@/types').WaterAnalysisResponse>('/water/analysis');
  },

  async getAIRecommendations() {
    return fetchJson<import('@/types').AIRecommendation[]>('/ai/recommendations');
  },

  /** Generate AI insights via OpenAI (backend). Returns summary + recommendations. */
  async getAIInsights(): Promise<{
    summary: string;
    recommendations: import('@/types').AIRecommendation[];
    model: string;
  }> {
    return fetchJson<{
      summary: string;
      recommendations: import('@/types').AIRecommendation[];
      model: string;
    }>('/ai/insights', {
      method: 'POST',
      body: '{}',
    });
  },

  /** Chat with same AI as insights (Kimi / Gemini / OpenAI). */
  async getAIChat(message: string): Promise<{ reply: string; model: string }> {
    return fetchJson<{ reply: string; model: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  /** Production: database readiness (collections, indexes). No trailing slash. */
  async getReady(): Promise<{ ready: boolean; mongo: string; collections: Record<string, boolean>; indexes_ok: boolean; error?: string }> {
    return fetchJson<{ ready: boolean; mongo: string; collections: Record<string, boolean>; indexes_ok: boolean; error?: string }>('/ready');
  },

  async getTemperatureRecords() {
    return fetchJson<import('@/types').TemperatureRecord[]>('/temperature');
  },
  async addTemperatureRecord(record: Omit<import('@/types').TemperatureRecord, 'id'> & { id?: string }) {
    return fetchJson<import('@/types').TemperatureRecord>('/temperature', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  async predict(
    type: string,
    fieldId: string,
    data: Record<string, unknown>,
    options?: { includeAiSummary?: boolean }
  ) {
    return fetchJson<unknown>('/predict', {
      method: 'POST',
      body: JSON.stringify({
        type,
        fieldId,
        data,
        ...(options?.includeAiSummary && { includeAiSummary: true }),
      }),
    });
  },

  /** Get AI-generated summary for a field (yield, health, water, price outlook). */
  async predictAiSummary(fieldId: string) {
    return fetchJson<{ fieldId: string; aiSummary: string; model: string }>('/predict', {
      method: 'POST',
      body: JSON.stringify({ type: 'prediction_ai_summary', fieldId, data: {} }),
    });
  },

  // Data Bank & Materials
  async getMaterials() {
    return fetchJson<import('@/types').Material[]>('/materials');
  },
  async addMaterial(material: Omit<import('@/types').Material, 'id'> & { id?: string }) {
    return fetchJson<import('@/types').Material>('/materials', {
      method: 'POST',
      body: JSON.stringify(material),
    });
  },
  async updateMaterial(id: string, updates: Partial<import('@/types').Material>) {
    return fetchJson<import('@/types').Material>(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  async deleteMaterial(id: string) {
    return fetchJson<void>(`/materials/${id}`, { method: 'DELETE' });
  },
  async getMaterialTransactions(params?: { dateFrom?: string; dateTo?: string; materialId?: string }) {
    const sp = new URLSearchParams();
    if (params?.dateFrom) sp.set('dateFrom', params.dateFrom);
    if (params?.dateTo) sp.set('dateTo', params.dateTo);
    if (params?.materialId) sp.set('materialId', params.materialId);
    const q = sp.toString();
    return fetchJson<import('@/types').MaterialTransaction[]>(`/material-transactions${q ? `?${q}` : ''}`);
  },
  async addMaterialTransaction(tx: Omit<import('@/types').MaterialTransaction, 'id'> & { id?: string }) {
    return fetchJson<import('@/types').MaterialTransaction>('/material-transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    });
  },
  async updateMaterialTransaction(id: string, updates: Partial<import('@/types').MaterialTransaction>) {
    return fetchJson<import('@/types').MaterialTransaction>(`/material-transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  async deleteMaterialTransaction(id: string) {
    return fetchJson<void>(`/material-transactions/${id}`, { method: 'DELETE' });
  },
  async getDailyRegister(params?: { date?: string; fieldId?: string }) {
    const sp = new URLSearchParams();
    if (params?.date) sp.set('date', params.date);
    if (params?.fieldId) sp.set('fieldId', params.fieldId);
    const q = sp.toString();
    return fetchJson<import('@/types').DailyRegisterEntry[]>(`/daily-register${q ? `?${q}` : ''}`);
  },
  async addDailyRegisterEntry(entry: Omit<import('@/types').DailyRegisterEntry, 'id'> & { id?: string }) {
    return fetchJson<import('@/types').DailyRegisterEntry>('/daily-register', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },
  async updateDailyRegisterEntry(id: string, updates: Partial<import('@/types').DailyRegisterEntry>) {
    return fetchJson<import('@/types').DailyRegisterEntry>(`/daily-register/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  async deleteDailyRegisterEntry(id: string) {
    return fetchJson<void>(`/daily-register/${id}`, { method: 'DELETE' });
  },
  async getFieldRecommendations() {
    return fetchJson<{ fieldId: string; fieldName: string; reason: string; message: string; priority: string }[]>('/field-recommendations');
  },
};
