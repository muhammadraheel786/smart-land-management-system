"use client";

import { useState, useMemo } from "react";
import { GeoFence, Expense, Income, ThakaRecord, WaterRecord } from "@/types";
import { useLandStore } from "@/lib/store";
import { statusColors } from "@/lib/map-styles";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Droplets,
  Calendar,
  Wheat,
  Users,
  BarChart3,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Sun,
  X,
  Edit3,
  Eye,
  Calculator
} from "lucide-react";

interface FieldSidePanelProps {
  field: GeoFence | null;
  onClose: () => void;
  onEdit: (field: GeoFence) => void;
}

export default function FieldSidePanel({ field, onClose, onEdit }: FieldSidePanelProps) {
  const { expenses, incomes, thakaRecords, waterRecords } = useLandStore();
  const [activeTab, setActiveTab] = useState<'soil' | 'water' | 'sun'>('soil');

  const analytics = useMemo(() => {
    if (!field) return null;

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

    return {
      totalExpenses,
      totalIncome,
      netProfit,
      profitMargin,
      expenseByCategory,
      incomeByType,
      waterUsage: { totalHours, avgPerSession, sessions },
      thakaInfo: fieldThaka,
      lastActivity,
      fieldExpenses: fieldExpenses.slice(0, 5), // Show recent 5
      fieldIncomes: fieldIncomes.slice(0, 5), // Show recent 5
    };
  }, [field, expenses, incomes, thakaRecords, waterRecords]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!field) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-[1000] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {field.name}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(field)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Edit Field"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>{field.area?.toFixed(2) || 'N/A'} acres</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Created {new Date(field.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Financial Summary - Always Visible */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Financial Summary
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg">
              <span className="font-medium text-green-800">Total Income</span>
              <span className="font-bold text-green-900">{formatCurrency(analytics?.totalIncome || 0)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg">
              <span className="font-medium text-red-800">Total Expenses</span>
              <span className="font-bold text-red-900">{formatCurrency(analytics?.totalExpenses || 0)}</span>
            </div>
            
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              (analytics?.netProfit || 0) >= 0 ? 'bg-blue-100' : 'bg-orange-100'
            }`}>
              <span className={`font-medium ${
                (analytics?.netProfit || 0) >= 0 ? 'text-blue-800' : 'text-orange-800'
              }`}>Net Profit</span>
              <span className={`font-bold ${
                (analytics?.netProfit || 0) >= 0 ? 'text-blue-900' : 'text-orange-900'
              }`}>{formatCurrency(analytics?.netProfit || 0)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg">
              <span className="font-medium text-purple-800">Profit Margin</span>
              <span className="font-bold text-purple-900">{analytics?.profitMargin.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>

        {/* Field Status */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Field Status
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status</span>
              <span 
                className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: statusColors[field.status] }}
              >
                {field.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Activity</span>
              <span className="font-medium">{analytics?.lastActivity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Field Health</span>
              <span className="flex items-center gap-1">
                {(analytics?.netProfit || 0) >= 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={`font-medium ${
                  (analytics?.netProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {(analytics?.netProfit || 0) >= 0 ? 'Profitable' : 'Loss Making'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Recent Expenses
          </h3>
          <div className="space-y-2">
            {analytics?.fieldExpenses && analytics.fieldExpenses.length > 0 ? (
              analytics.fieldExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-sm capitalize">{expense.category}</p>
                    <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-red-600">{formatCurrency(expense.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No expenses recorded</p>
            )}
          </div>
        </div>

        {/* Recent Income */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Recent Income
          </h3>
          <div className="space-y-2">
            {analytics?.fieldIncomes && analytics.fieldIncomes.length > 0 ? (
              analytics.fieldIncomes.map((income) => (
                <div key={income.id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-sm capitalize">{income.type}</p>
                    <p className="text-xs text-gray-500">{new Date(income.date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-bold text-green-600">{formatCurrency(income.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No income recorded</p>
            )}
          </div>
        </div>

        {/* Land Quality */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sun className="w-4 h-4" />
            Land Quality
          </h3>
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('soil')}
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'soil' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Soil
            </button>
            <button
              onClick={() => setActiveTab('water')}
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'water' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Water
            </button>
            <button
              onClick={() => setActiveTab('sun')}
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'sun' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sun
            </button>
          </div>
          <div className="min-h-[120px]">
            {activeTab === 'soil' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Soil Type</span>
                  <span className="text-sm font-medium">Loamy Sand</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">pH Level</span>
                  <span className="text-sm font-medium">6.5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nutrient Levels</span>
                  <span className="text-sm font-medium text-green-600">Good</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Tested</span>
                  <span className="text-sm font-medium">Oct 26, 2023</span>
                </div>
              </div>
            )}
            {activeTab === 'water' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Water Source</span>
                  <span className="text-sm font-medium">Well</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Water Quality</span>
                  <span className="text-sm font-medium text-green-600">Good</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Irrigated</span>
                  <span className="text-sm font-medium">Nov 1, 2023</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Next Irrigation</span>
                  <span className="text-sm font-medium">Nov 5, 2023</span>
                </div>
              </div>
            )}
            {activeTab === 'sun' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sunlight Hours/Day</span>
                  <span className="text-sm font-medium">8-10 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Orientation</span>
                  <span className="text-sm font-medium">South-East</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shade Level</span>
                  <span className="text-sm font-medium text-green-600">Minimal</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sun Intensity</span>
                  <span className="text-sm font-medium text-yellow-600">High</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Water Usage */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Droplets className="w-4 h-4" />
            Water Usage
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <p className="text-lg font-bold text-blue-700">{analytics?.waterUsage.totalHours.toFixed(1) || 0}</p>
              <p className="text-xs text-blue-600">Total Hours</p>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <p className="text-lg font-bold text-blue-700">{analytics?.waterUsage.sessions || 0}</p>
              <p className="text-xs text-blue-600">Sessions</p>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <p className="text-lg font-bold text-blue-700">{analytics?.waterUsage.avgPerSession.toFixed(1) || 0}</p>
              <p className="text-xs text-blue-600">Avg Hours</p>
            </div>
          </div>
        </div>

        {/* Thaka Information */}
        {analytics?.thakaInfo && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Thaka (Lease) Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tenant</span>
                <span className="font-medium">{analytics.thakaInfo.tenantName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  analytics.thakaInfo.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {analytics.thakaInfo.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">{formatCurrency(analytics.thakaInfo.amount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {(analytics?.expenseByCategory && Object.keys(analytics.expenseByCategory).length > 0) && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Expense Breakdown
            </h3>
            <div className="space-y-2">
              {Object.entries(analytics.expenseByCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">{category}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
