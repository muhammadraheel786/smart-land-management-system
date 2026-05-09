import { API_BASE_URL } from "@/config/api";

/** API client.
 * - All requests go directly to the Django backend origin (no Next.js /api proxy).
 * - API base: `${API_BASE_URL}/api`, where API_BASE_URL comes from NEXT_PUBLIC_API_URL
 *   or defaults to http://localhost:8000 in development.
 * - All API paths must have NO trailing slash to match Django (APPEND_SLASH = False).
 */
const API_BASE = `${API_BASE_URL.replace(/\/$/, "")}/api`;

type LabourMeta = {
  name?: string;
  phone?: string;
  cnic?: string;
  work_type?: string;
  salary_type?: string;
  salary_amount?: number;
  salary_start_date?: string;
};

function buildLabourNotes(meta: LabourMeta): string {
  return `LABOUR_META::${JSON.stringify(meta)}`;
}

function parseLabourNotes(notes?: string): LabourMeta | null {
  if (!notes || !notes.startsWith("LABOUR_META::")) return null;
  try {
    const raw = notes.replace("LABOUR_META::", "");
    return JSON.parse(raw) as LabourMeta;
  } catch {
    return null;
  }
}

function parseLabourTxNotes(notes?: string): { labourId: string; tx: any } | null {
  if (!notes || !notes.startsWith("LABOUR_TX::")) return null;
  try {
    const raw = notes.replace("LABOUR_TX::", "");
    const idx = raw.indexOf("::");
    if (idx <= 0) return null;
    const labourId = raw.slice(0, idx);
    const tx = JSON.parse(raw.slice(idx + 2));
    return { labourId, tx };
  } catch {
    return null;
  }
}

function parseLabourAttNotes(notes?: string): { labourId: string; attendance: any } | null {
  if (!notes || !notes.startsWith("LABOUR_ATT::")) return null;
  try {
    const raw = notes.replace("LABOUR_ATT::", "");
    const idx = raw.indexOf("::");
    if (idx <= 0) return null;
    const labourId = raw.slice(0, idx);
    const attendance = JSON.parse(raw.slice(idx + 2));
    return { labourId, attendance };
  } catch {
    return null;
  }
}

function mapActivityToLabour(a: any): any {
  const meta = parseLabourNotes(a?.notes);
  return {
    id: a?.id,
    _id: a?.id,
    name: meta?.name || "Labour",
    phone: meta?.phone || "",
    cnic: meta?.cnic || "",
    work_type: meta?.work_type || "Helper",
    salary_type: meta?.salary_type || "daily",
    salary_amount: Number(meta?.salary_amount || a?.cost || 0),
    salary_start_date: meta?.salary_start_date || a?.date || new Date().toISOString().split("T")[0],
    days_worked: 0,
    total_salary: Number(meta?.salary_amount || a?.cost || 0),
    total_paid: 0,
    balance: -Number(meta?.salary_amount || a?.cost || 0), // Paid (0) - Salary
    status: "Active",
    transactions: [],
    attendance: [],
  };
}

function computeFallbackLabourRows(activities: any[]): any[] {
  const profileRows = (activities || [])
    .filter((a) => parseLabourNotes(a?.notes))
    .map(mapActivityToLabour);

  const txRows = (activities || [])
    .map((a) => {
      const parsed = parseLabourTxNotes(a?.notes);
      if (!parsed) return null;
      return {
        labourId: parsed.labourId,
        type: parsed.tx?.type || "salary",
        amount: Number(parsed.tx?.amount || 0),
      };
    })
    .filter(Boolean) as Array<{ labourId: string; type: string; amount: number }>;

  const attRows = (activities || [])
    .map((a) => {
      const parsed = parseLabourAttNotes(a?.notes);
      if (!parsed) return null;
      return {
        labourId: parsed.labourId,
        status: parsed.attendance?.status || "present",
      };
    })
    .filter(Boolean) as Array<{ labourId: string; status: string }>;

  return profileRows.map((l) => {
    const labourId = l.id || l._id;
    const labourTx = txRows.filter((t) => t.labourId === labourId);
    const paid = labourTx
      .filter((t) => t.type === "salary")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const advances = labourTx
      .filter((t) => t.type === "advance")
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const days = attRows.filter((a) => a.labourId === labourId && a.status === "present").length;
    const halfDays = attRows.filter((a) => a.labourId === labourId && a.status === "half_day").length;

    const salaryType = l.salary_type || "daily";
    const baseSalary = Number(l.salary_amount || 0);
    let totalSalary = 0;
    
    if (salaryType === "daily") {
      totalSalary = (days + (halfDays * 0.5)) * baseSalary;
    } else {
      const startDate = l.salary_start_date ? new Date(l.salary_start_date) : new Date();
      const today = new Date();
      let months = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
      if (today.getDate() >= startDate.getDate()) months++;
      months = Math.max(1, months);
      totalSalary = months * baseSalary;
    }

    return {
      ...l,
      days_worked: days,
      total_salary: totalSalary,
      total_paid: paid + advances, // Include advances in total paid
      balance: (paid + advances) - totalSalary,
    };
  });
}

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
    if (typeof window !== "undefined") {
      localStorage.removeItem("smartland_token");
      localStorage.removeItem("smartland_email");
    }
  }

  if (!res.ok) {
    let errorMsg = `API error ${res.status}`;
    try {
      const data = await res.json();
      errorMsg = data?.error || data?.detail || errorMsg;
      if (typeof errorMsg !== "string") errorMsg = JSON.stringify(errorMsg);
    } catch {
      // Ignored: fallback to status code
    }
    throw new Error(errorMsg);
  }

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

  // Legacy water endpoints (kept for backward compatibility in case the backend exposes /water)
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

  /**
   * Unified Activities endpoint.
   * Used by Water Management to log irrigation as activities when /water is not available on backend.
   */
  async addActivity(payload: {
    activity_type: string;
    field_id: string;
    date: string;
    quantity_used?: number;
    cost?: number;
    income?: number;
    notes?: string;
  }) {
    return fetchJson<any>('/activities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async updateActivity(id: string, payload: Partial<import('@/types').Activity>) {
    return fetchJson<any>(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async deleteActivity(id: string) {
    return fetchJson<void>(`/activities/${id}`, { method: 'DELETE' });
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
  
  // Labour Management
  async getLabours() {
    try {
      return await fetchJson<any[]>('/labours');
    } catch (e) {
      if (e instanceof Error && e.message.includes("404")) {
        // Fallback to unified activities (activity_type=labor)
        const activities = await fetchJson<any[]>('/activities');
        return computeFallbackLabourRows(activities || []);
      }
      throw e;
    }
  },
  async getLabourDashboard() {
    try {
      return await fetchJson<any>('/labours/dashboard');
    } catch (e) {
      if (e instanceof Error && e.message.includes("404")) {
        const [labours, activities] = await Promise.all([
          api.getLabours(),
          fetchJson<any[]>('/activities'),
        ]);
        const txRows = (activities || [])
          .map((a) => parseLabourTxNotes(a?.notes))
          .filter(Boolean) as Array<{ labourId: string; tx: any }>;
        const total = labours.length;
        const totalSalary = labours.reduce((s, l) => s + (Number(l.total_salary) || 0), 0);
        const totalPaid = txRows
          .filter((r) => r.tx?.type === "salary")
          .reduce((s, r) => s + (Number(r.tx?.amount) || 0), 0);
        const advances = txRows
          .filter((r) => r.tx?.type === "advance")
          .reduce((s, r) => s + (Number(r.tx?.amount) || 0), 0);
        const totalPaidOverall = totalPaid + advances;
        const pending = totalPaidOverall - totalSalary;
        return {
          total_labour: total,
          active_labour: total,
          inactive_labour: 0,
          total_paid_overall: totalPaidOverall,
          paid_this_month: totalPaidOverall,
          pending_salary: pending,
          advances_given: advances,
        };
      }
      throw e;
    }
  },
  async addLabour(labour: any) {
    try {
      return await fetchJson<any>('/labours', {
        method: 'POST',
        body: JSON.stringify(labour),
      });
    } catch (e) {
      if (e instanceof Error && e.message.includes("404")) {
        // Fallback: store labour as a labor activity record
        const created = await fetchJson<any>('/activities', {
          method: 'POST',
          body: JSON.stringify({
            activity_type: "labor",
            date: labour?.salary_start_date || new Date().toISOString().split("T")[0],
            cost: Number(labour?.salary_amount || 0),
            notes: buildLabourNotes({
              name: labour?.name,
              phone: labour?.phone,
              cnic: labour?.cnic,
              work_type: labour?.work_type,
              salary_type: labour?.salary_type,
              salary_amount: Number(labour?.salary_amount || 0),
              salary_start_date: labour?.salary_start_date,
            }),
          }),
        });
        return mapActivityToLabour(created);
      }
      throw e;
    }
  },
  async getLabourProfile(id: string) {
    try {
      const lData = await fetchJson<any>(`/labours/${id}`);
      const tData = await fetchJson<any[]>(`/labours/${id}/transactions`);
      const aData = await fetchJson<any[]>(`/labours/${id}/attendance`);
      return { ...lData, transactions: tData, attendance: aData };
    } catch (e) {
      if (e instanceof Error && e.message.includes("404")) {
        const [labours, activities] = await Promise.all([
          api.getLabours(),
          fetchJson<any[]>('/activities'),
        ]);
        const found = labours.find((l) => (l.id || l._id) === id) || { id, _id: id, name: "Labour" };
        const txData = (activities || [])
          .map((a) => {
            const parsed = parseLabourTxNotes(a?.notes);
            if (!parsed || parsed.labourId !== id) return null;
            return {
              id: a?.id,
              type: parsed.tx?.type || "salary",
              amount: Number(parsed.tx?.amount || 0),
              date: parsed.tx?.date || a?.date,
              notes: parsed.tx?.notes || "",
            };
          })
          .filter(Boolean);
        const attData = (activities || [])
          .map((a) => {
            const parsed = parseLabourAttNotes(a?.notes);
            if (!parsed || parsed.labourId !== id) return null;
            return {
              id: a?.id,
              status: parsed.attendance?.status || "present",
              date: parsed.attendance?.date || a?.date,
            };
          })
          .filter(Boolean);
        const totalPaid = txData
          .filter((t: any) => t.type === "salary")
          .reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        const advances = txData
          .filter((t: any) => t.type === "advance")
          .reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        
        let totalSalary = Number(found.salary_amount || 0);
        if (found.salary_type === "monthly") {
          const startDate = found.salary_start_date ? new Date(found.salary_start_date) : new Date();
          const today = new Date();
          let months = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
          if (today.getDate() >= startDate.getDate()) months++;
          months = Math.max(1, months);
          totalSalary = months * Number(found.salary_amount || 0);
        } else {
           totalSalary = Number(found.total_salary || 0);
        }

        return {
          ...found,
          total_salary: totalSalary,
          total_paid: totalPaid + advances,
          balance: (totalPaid + advances) - totalSalary,
          transactions: txData,
          attendance: attData,
        };
      }
      throw e;
    }
  },
  async addTransaction(labourId: string, tx: any) {
    try {
      return await fetchJson<any>(`/labours/${labourId}/transactions`, {
        method: 'POST',
        body: JSON.stringify(tx),
      });
    } catch (e) {
      if (e instanceof Error && e.message.includes("404")) {
        // Fallback: log transaction as labor activity note
        const current = await api.getLabourProfile(labourId);
        const rawAmount = Number(tx?.amount || 0);
        const safeAmount = Number.isFinite(rawAmount) ? Math.max(0, rawAmount) : 0;
        const date = tx?.date || new Date().toISOString().split("T")[0];

        // If salary payment exceeds payable balance, split automatically:
        // remaining payable part as salary + extra as advance.
        if ((tx?.type || "salary") === "salary") {
          const balance = Number(current?.balance || 0);
          const salaryPart = balance > 0 ? Math.min(safeAmount, balance) : 0;
          const advancePart = safeAmount - salaryPart;

          if (salaryPart > 0) {
            await fetchJson<any>(`/activities`, {
              method: 'POST',
              body: JSON.stringify({
                activity_type: "labor",
                date,
                notes: `LABOUR_TX::${labourId}::${JSON.stringify({ ...tx, type: "salary", amount: salaryPart, notes: `${tx?.notes || ""}${tx?.notes ? " " : ""}(auto split)` })}`,
              }),
            });
          }

          if (advancePart > 0) {
            await fetchJson<any>(`/activities`, {
              method: 'POST',
              body: JSON.stringify({
                activity_type: "labor",
                date,
                cost: advancePart,
                notes: `LABOUR_TX::${labourId}::${JSON.stringify({ ...tx, type: "advance", amount: advancePart, notes: `${tx?.notes || ""}${tx?.notes ? " " : ""}(auto extra as advance)` })}`,
              }),
            });
            return { status: "split", salary: salaryPart, advance: advancePart };
          }

          return { status: "salary", salary: salaryPart, advance: 0 };
        }

        return fetchJson<any>(`/activities`, {
          method: 'POST',
          body: JSON.stringify({
            activity_type: "labor",
            date,
            cost: tx?.type === "advance" ? safeAmount : 0,
            notes: `LABOUR_TX::${labourId}::${JSON.stringify({ ...tx, amount: safeAmount })}`,
          }),
        });
      }
      throw e;
    }
  },
  async markAttendance(labourId: string, attendance: any) {
    try {
      return await fetchJson<any>(`/labours/${labourId}/attendance`, {
        method: 'POST',
        body: JSON.stringify(attendance),
      });
    } catch (e) {
      if (e instanceof Error && e.message.includes("404")) {
        // Fallback: log attendance as labor activity note
        return fetchJson<any>(`/activities`, {
          method: 'POST',
          body: JSON.stringify({
            activity_type: "labor",
            date: attendance?.date || new Date().toISOString().split("T")[0],
            notes: `LABOUR_ATT::${labourId}::${JSON.stringify(attendance)}`,
          }),
        });
      }
      throw e;
    }
  },
};
