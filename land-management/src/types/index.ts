// Land & Farm Management System - Type Definitions

export type LandStatus = 'cultivated' | 'available' | 'uncultivated' | 'not_usable' | 'thaka';
export type LandStatusColor = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeoFence {
  id: string;
  name: string;
  coordinates: Coordinates[];
  area?: number;
  status: LandStatus;
  notUsableReason?: string;
  address?: string;
  locationName?: string;
  detailedAddress?: {
    displayName?: string;
    road?: string;
    suburb?: string;
    city?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  fieldId: string;
  category: 'seeds' | 'fertilizer' | 'labor' | 'water' | 'fencing' | 'equipment' | 'other';
  amount: number;
  description?: string;
  date: string;
}

export interface Income {
  id: string;
  fieldId: string;
  type: 'crop' | 'thaka';
  amount: number;
  description?: string;
  date: string;
}

export interface ThakaRecord {
  id: string;
  fieldId: string;
  tenantName: string;
  tenantContact?: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: 'active' | 'expired' | 'renewed';
}

export interface WaterRecord {
  id: string;
  fieldId: string;
  date: string;
  durationMinutes: number;
  notes?: string;
}

export interface WaterAnalysisWarning {
  fieldId: string;
  fieldName: string;
  type: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface WaterFieldAnalysis {
  fieldId: string;
  fieldName: string;
  lastWaterDate: string | null;
  lastDurationMinutes: number;
  suggestedNextDate: string;
  suggestedMinutes: number;
  warning: string | null;
  aiNote: string | null;
}

export interface WaterAnalysisResponse {
  warnings: WaterAnalysisWarning[];
  analysis: string;
  perField: WaterFieldAnalysis[];
  model: string;
}

export interface TemperatureRecord {
  id: string;
  fieldId: string;
  date: string;
  temperatureC: number;
  minTempC?: number;
  maxTempC?: number;
  notes?: string;
}

export interface PricePrediction {
  cropType?: string;
  predictedPricePerKg: number;
  confidence: number;
  suggestedDate?: string;
}

export interface AIRecommendation {
  id: string;
  type: 'warning' | 'suggestion' | 'insight';
  title: string;
  message: string;
  fieldId?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface CropHealthData {
  fieldId: string;
  ndvi?: number;
  healthScore?: number;
  lastUpdated: string;
}

export interface DashboardStats {
  totalLandArea: number;
  cultivatedArea: number;
  availableArea: number;
  thakaArea: number;
  totalInvestment: number;
  totalIncome: number;
  netProfit: number;
  fieldCount: number;
}

// --- Data Bank & Material Management ---

export type MaterialCategory = 'seed' | 'fertilizer' | 'pesticide' | 'fuel' | 'feed' | 'other';
export type MaterialUnit = 'kg' | 'L' | 'bag' | 'pack' | 'unit';

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  currentStock: number;
  createdAt?: string;
}

export type MaterialTransactionType = 'in' | 'out';

export interface MaterialTransaction {
  id: string;
  materialId: string;
  type: MaterialTransactionType;
  quantity: number;
  date: string;
  fieldId?: string;
  cost?: number;
  notes?: string;
}

export type DailyActivityType = 'ploughing' | 'sowing' | 'irrigation' | 'spraying' | 'fertilizing' | 'weeding' | 'harvesting' | 'other';

export interface MaterialUsed {
  materialId: string;
  quantity: number;
}

export interface DailyRegisterEntry {
  id: string;
  date: string;
  fieldId: string;
  activity: DailyActivityType;
  materialsUsed: MaterialUsed[];
  laborCost?: number;
  waterMinutes?: number;
  notes?: string;
}
