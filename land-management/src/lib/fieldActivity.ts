/**
 * Real field activity and health metrics from app data.
 * Used for satellite monitoring and dashboards.
 */

import type { GeoFence, WaterRecord, Expense, TemperatureRecord, DailyRegisterEntry } from "@/types";

export interface FieldActivityStats {
  fieldId: string;
  fieldName: string;
  areaAcres?: number;
  status: string;
  lastWaterDate: string | null;
  lastExpenseDate: string | null;
  lastRegisterDate: string | null;
  waterCount: number;
  expenseCount: number;
  tempRecordCount: number;
  registerCount: number;
  latestTempC: number | null;
  activityScore: number; // 0-100 from real activity
  hasRecentActivity: boolean; // activity in last 30 days
}

const RECENT_DAYS = 30;

function parseDate(s: string): number {
  const d = new Date(s);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function daysAgo(isoDate: string): number {
  const t = parseDate(isoDate);
  if (!t) return 999;
  return (Date.now() - t) / (24 * 60 * 60 * 1000);
}

export function computeFieldActivity(
  fields: GeoFence[],
  waterRecords: WaterRecord[],
  expenses: { date: string; fieldId: string }[],
  temperatureRecords: TemperatureRecord[],
  dailyRegister: DailyRegisterEntry[] = []
): FieldActivityStats[] {
  const byField = new Map<string, FieldActivityStats>();

  for (const f of fields) {
    const waters = waterRecords.filter((r) => r.fieldId === f.id);
    const fieldExpenses = expenses.filter((e) => e.fieldId === f.id);
    const temps = temperatureRecords.filter((r) => r.fieldId === f.id);
    const register = dailyRegister.filter((r) => r.fieldId === f.id);

    const lastWater = waters.length
      ? waters.reduce((a, b) => (a.date >= b.date ? a : b))
      : null;
    const lastExpense = fieldExpenses.length
      ? fieldExpenses.reduce((a, b) => (a.date >= b.date ? a : b))
      : null;
    const lastRegister = register.length
      ? register.reduce((a, b) => (a.date >= b.date ? a : b))
      : null;

    const latestTemp = temps.length
      ? temps.reduce((a, b) => (a.date >= b.date ? a : b))
      : null;

    const lastDates = [
      lastWater?.date,
      lastExpense?.date,
      lastRegister?.date,
      latestTemp?.date,
    ].filter(Boolean) as string[];
    const mostRecent = lastDates.length
      ? lastDates.reduce((a, b) => (a >= b ? a : b))
      : null;
    const hasRecentActivity = mostRecent ? daysAgo(mostRecent) <= RECENT_DAYS : false;

    let activityScore = 0;
    if (f.status === "cultivated") activityScore += 35;
    else if (f.status === "available") activityScore += 20;
    else if (f.status === "thaka") activityScore += 25;
    else activityScore += 10;

    if (waters.length > 0) activityScore += Math.min(20, waters.length * 4);
    if (fieldExpenses.length > 0) activityScore += Math.min(15, fieldExpenses.length * 3);
    if (temps.length > 0) activityScore += Math.min(15, temps.length * 3);
    if (register.length > 0) activityScore += Math.min(15, register.length * 2);
    if (hasRecentActivity) activityScore = Math.min(100, activityScore + 10);

    activityScore = Math.round(Math.min(100, activityScore));

    byField.set(f.id, {
      fieldId: f.id,
      fieldName: f.name,
      areaAcres: f.area,
      status: f.status,
      lastWaterDate: lastWater?.date ?? null,
      lastExpenseDate: lastExpense?.date ?? null,
      lastRegisterDate: lastRegister?.date ?? null,
      waterCount: waters.length,
      expenseCount: fieldExpenses.length,
      tempRecordCount: temps.length,
      registerCount: register.length,
      latestTempC: latestTemp ? latestTemp.temperatureC : null,
      activityScore,
      hasRecentActivity,
    });
  }

  return Array.from(byField.values());
}
