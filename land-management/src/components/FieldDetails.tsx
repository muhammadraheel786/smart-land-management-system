"use client";

import { useMemo } from "react";
import { GeoFence, Expense, Income, ThakaRecord, WaterRecord } from "@/types";
import { useLandStore } from "@/lib/store";
import { statusColors, statusBorderColors } from "@/lib/map-styles";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Droplets,
  Calendar,
  Wheat,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Sun
} from "lucide-react";

interface FieldDetailsProps {
  field: GeoFence;
  onClose: () => void;
  onEdit: (field: GeoFence) => void;
}

interface FieldAnalytics {
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
  profitMargin: number;
  expenseByCategory: Record<string, number>;
  incomeByType: Record<string, number>;
  monthlyTrend: { month: string; income: number; expenses: number; profit: number }[];
  waterUsage: { totalHours: number; avgPerSession: number; sessions: number };
  thakaInfo: ThakaRecord | null;
  lastActivity: string;
  efficiency: number;
}

export default function FieldDetails({ field, onClose, onEdit }: FieldDetailsProps) {
  const { expenses, incomes, thakaRecords, waterRecords } = useLandStore();

  const analytics = useMemo((): FieldAnalytics => {
    // Filter data for this specific field
    const fieldExpenses = expenses.filter(e => e.fieldId === field.id);
    const fieldIncomes = incomes.filter(i => i.fieldId === field.id);
    const fieldWaterRecords = waterRecords.filter(w => w.fieldId === field.id);
    const fieldThaka = thakaRecords.find(t => t.fieldId === field.id) || null;

    // Calculate financials
    const totalExpenses = fieldExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = fieldIncomes.reduce((sum, i) => sum + i.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Group expenses by category
    const expenseByCategory = fieldExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Group income by type
    const incomeByType = fieldIncomes.reduce((acc, income) => {
      acc[income.type] = (acc[income.type] || 0) + income.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthExpenses = fieldExpenses
        .filter(e => new Date(e.date).getMonth() === monthDate.getMonth() && 
                      new Date(e.date).getFullYear() === monthDate.getFullYear())
        .reduce((sum, e) => sum + e.amount, 0);
      
      const monthIncome = fieldIncomes
        .filter(i => new Date(i.date).getMonth() === monthDate.getMonth() && 
                     new Date(i.date).getFullYear() === monthDate.getFullYear())
        .reduce((sum, i) => sum + i.amount, 0);
      
      monthlyTrend.push({
        month: monthStr,
        income: monthIncome,
        expenses: monthExpenses,
        profit: monthIncome - monthExpenses
      });
    }

    // Water usage analytics
    const totalHours = fieldWaterRecords.reduce((sum, w) => sum + w.durationMinutes, 0) / 60;
    const sessions = fieldWaterRecords.length;
    const avgPerSession = sessions > 0 ? totalHours / sessions : 0;

    // Last activity
    const allDates = [
      ...fieldExpenses.map(e => new Date(e.date)),
      ...fieldIncomes.map(i => new Date(i.date)),
      ...fieldWaterRecords.map(w => new Date(w.date))
    ];
    const lastActivity = allDates.length > 0 ? 
      new Date(Math.max(...allDates.map(d => d.getTime()))).toLocaleDateString() : 
      'No activity';

    // Efficiency score (based on profit margin and water usage)
    const efficiency = Math.max(0, Math.min(100, 
      (profitMargin * 0.7) + (avgPerSession > 0 ? Math.min(30, (10 / avgPerSession) * 30) : 30)
    ));

    return {
      totalExpenses,
      totalIncome,
      netProfit,
      profitMargin,
      expenseByCategory,
      incomeByType,
      monthlyTrend,
      waterUsage: { totalHours, avgPerSession, sessions },
      thakaInfo: fieldThaka,
      lastActivity,
      efficiency
    };
  }, [field.id, expenses, incomes, thakaRecords, waterRecords]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || '#6B7280';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{field.name}</h2>
                  <p className="text-blue-100 capitalize">{field.status} Field</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span>{field.area?.toFixed(2) || 'N/A'} acres</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created {new Date(field.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Last activity: {analytics.lastActivity}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(field)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Edit Field
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-600 font-medium">Total Income</span>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(analytics.totalIncome)}</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-600 font-medium">Total Expenses</span>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(analytics.totalExpenses)}</p>
            </div>
            
            <div className={`border rounded-xl p-4 ${
              analytics.netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${
                  analytics.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>Net Profit</span>
                <DollarSign className={`w-4 h-4 ${
                  analytics.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
              </div>
              <p className={`text-2xl font-bold ${
                analytics.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>{formatCurrency(analytics.netProfit)}</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-600 font-medium">Profit Margin</span>
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-700">{analytics.profitMargin.toFixed(1)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Breakdown */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Expense Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.expenseByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{category}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
                {Object.keys(analytics.expenseByCategory).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No expenses recorded</p>
                )}
              </div>
            </div>

            {/* Income Sources */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Income Sources
              </h3>
              <div className="space-y-3">
                {Object.entries(analytics.incomeByType).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{type}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                  </div>
                ))}
                {Object.keys(analytics.incomeByType).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No income recorded</p>
                )}
              </div>
            </div>

            {/* Water Usage */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Water Usage
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">{analytics.waterUsage.totalHours.toFixed(1)}</p>
                  <p className="text-xs text-blue-600">Total Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">{analytics.waterUsage.sessions}</p>
                  <p className="text-xs text-blue-600">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">{analytics.waterUsage.avgPerSession.toFixed(1)}</p>
                  <p className="text-xs text-blue-600">Avg Hours/Session</p>
                </div>
              </div>
            </div>

            {/* Field Performance */}
            <div className="bg-yellow-50 rounded-xl p-4">
              <h3 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Field Performance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-700">Efficiency Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-yellow-200 rounded-full">
                      <div 
                        className="h-2 bg-yellow-500 rounded-full" 
                        style={{ width: `${analytics.efficiency}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-yellow-900">
                      {analytics.efficiency.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                {analytics.thakaInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-700">Thaka Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      analytics.thakaInfo.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {analytics.thakaInfo.tenantName} - {analytics.thakaInfo.status}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-700">Field Health</span>
                  <span className="flex items-center gap-1">
                    {analytics.netProfit >= 0 ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      analytics.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {analytics.netProfit >= 0 ? 'Profitable' : 'Loss Making'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              6-Month Financial Trend
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {analytics.monthlyTrend.map((month, index) => (
                <div key={month.month} className="text-center">
                  <p className="text-xs text-gray-600 mb-2">{month.month.split(' ')[0]}</p>
                  <div className="space-y-1">
                    <div className="h-8 bg-green-200 rounded relative">
                      <div 
                        className="h-full bg-green-500 rounded absolute bottom-0 left-0 right-0"
                        style={{ 
                          height: `${Math.min(100, (month.income / Math.max(...analytics.monthlyTrend.map(m => m.income))) * 100)}%` 
                        }}
                      />
                    </div>
                    <div className="h-8 bg-red-200 rounded relative">
                      <div 
                        className="h-full bg-red-500 rounded absolute bottom-0 left-0 right-0"
                        style={{ 
                          height: `${Math.min(100, (month.expenses / Math.max(...analytics.monthlyTrend.map(m => m.expenses))) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(month.profit)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-600">Income</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-gray-600">Expenses</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
