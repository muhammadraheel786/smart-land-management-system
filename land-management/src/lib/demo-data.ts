// Comprehensive demo data for testing the entire geofencing application
export const demoFields = [
  {
    id: 'demo-field-1',
    name: 'North Wheat Farm',
    coordinates: [
      { lat: 31.525, lng: 74.358 },
      { lat: 31.525, lng: 74.365 },
      { lat: 31.518, lng: 74.365 },
      { lat: 31.518, lng: 74.358 }
    ],
    area: 12.5,
    status: 'cultivated' as const,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'demo-field-2',
    name: 'East Pasture Land',
    coordinates: [
      { lat: 31.520, lng: 74.368 },
      { lat: 31.520, lng: 74.378 },
      { lat: 31.512, lng: 74.378 },
      { lat: 31.512, lng: 74.368 }
    ],
    area: 8.3,
    status: 'available' as const,
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-10T14:30:00Z'
  },
  {
    id: 'demo-field-3',
    name: 'South Orchard',
    coordinates: [
      { lat: 31.515, lng: 74.355 },
      { lat: 31.515, lng: 74.368 },
      { lat: 31.505, lng: 74.368 },
      { lat: 31.505, lng: 74.355 }
    ],
    area: 15.7,
    status: 'cultivated' as const,
    createdAt: '2024-01-05T09:15:00Z',
    updatedAt: '2024-01-05T09:15:00Z'
  },
  {
    id: 'demo-field-4',
    name: 'West Barren Plot',
    coordinates: [
      { lat: 31.522, lng: 74.345 },
      { lat: 31.522, lng: 74.355 },
      { lat: 31.515, lng: 74.355 },
      { lat: 31.515, lng: 74.345 }
    ],
    area: 6.2,
    status: 'uncultivated' as const,
    createdAt: '2024-01-20T16:45:00Z',
    updatedAt: '2024-01-20T16:45:00Z'
  },
  {
    id: 'demo-field-5',
    name: 'Central Rice Paddy',
    coordinates: [
      { lat: 31.510, lng: 74.360 },
      { lat: 31.510, lng: 74.370 },
      { lat: 31.502, lng: 74.370 },
      { lat: 31.502, lng: 74.360 }
    ],
    area: 10.8,
    status: 'cultivated' as const,
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2024-01-12T08:00:00Z'
  }
];

export const demoExpenses = [
  {
    id: 'demo-expense-1',
    fieldId: 'demo-field-1',
    category: 'seeds' as const,
    amount: 2500,
    description: 'Premium wheat seeds for spring planting',
    date: '2024-01-15T10:00:00Z'
  },
  {
    id: 'demo-expense-2',
    fieldId: 'demo-field-1',
    category: 'fertilizer' as const,
    amount: 1800,
    description: 'NPK fertilizer for wheat crop',
    date: '2024-01-18T14:30:00Z'
  },
  {
    id: 'demo-expense-3',
    fieldId: 'demo-field-3',
    category: 'labor' as const,
    amount: 3200,
    description: 'Orchard pruning and maintenance',
    date: '2024-01-12T08:00:00Z'
  },
  {
    id: 'demo-expense-4',
    fieldId: 'demo-field-2',
    category: 'water' as const,
    amount: 800,
    description: 'Irrigation system setup',
    date: '2024-01-08T11:00:00Z'
  },
  {
    id: 'demo-expense-5',
    fieldId: 'demo-field-5',
    category: 'seeds' as const,
    amount: 3500,
    description: 'Rice seedlings and nursery costs',
    date: '2024-01-10T06:30:00Z'
  },
  {
    id: 'demo-expense-6',
    fieldId: 'demo-field-4',
    category: 'equipment' as const,
    amount: 1200,
    description: 'Land clearing and preparation',
    date: '2024-01-25T13:00:00Z'
  }
];

export const demoIncomes = [
  {
    id: 'demo-income-1',
    fieldId: 'demo-field-1',
    type: 'crop' as const,
    amount: 8500,
    description: 'Winter wheat harvest',
    date: '2024-01-25T16:00:00Z'
  },
  {
    id: 'demo-income-2',
    fieldId: 'demo-field-3',
    type: 'crop' as const,
    amount: 12000,
    description: 'Apple and pear sales',
    date: '2024-01-22T12:00:00Z'
  },
  {
    id: 'demo-income-3',
    fieldId: 'demo-field-2',
    type: 'thaka' as const,
    amount: 3500,
    description: 'Quarterly lease payment',
    date: '2024-01-01T00:00:00Z'
  },
  {
    id: 'demo-income-4',
    fieldId: 'demo-field-5',
    type: 'crop' as const,
    amount: 6500,
    description: 'Rice harvest - first crop',
    date: '2024-01-28T14:00:00Z'
  }
];

export const demoWaterRecords = [
  {
    id: 'demo-water-1',
    fieldId: 'demo-field-1',
    date: '2024-01-20T06:00:00Z',
    durationMinutes: 120,
    notes: 'Regular irrigation for wheat crop'
  },
  {
    id: 'demo-water-2',
    fieldId: 'demo-field-3',
    date: '2024-01-18T07:30:00Z',
    durationMinutes: 90,
    notes: 'Orchard drip irrigation'
  },
  {
    id: 'demo-water-3',
    fieldId: 'demo-field-2',
    date: '2024-01-15T05:00:00Z',
    durationMinutes: 60,
    notes: 'Pasture land watering'
  },
  {
    id: 'demo-water-4',
    fieldId: 'demo-field-5',
    date: '2024-01-22T06:00:00Z',
    durationMinutes: 150,
    notes: 'Paddy field flooding'
  }
];

export const demoThakaRecords = [
  {
    id: 'demo-thaka-1',
    fieldId: 'demo-field-2',
    tenantName: 'Ahmed Hassan',
    tenantContact: '+92-300-1234567',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-06-30T00:00:00Z',
    amount: 3500,
    status: 'active' as const
  },
  {
    id: 'demo-thaka-2',
    fieldId: 'demo-field-4',
    tenantName: 'Muhammad Ali',
    tenantContact: '+92-300-7654321',
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2024-12-31T00:00:00Z',
    amount: 2800,
    status: 'active' as const
  }
];

export const demoTemperatureRecords = [
  {
    id: 'demo-temp-1',
    fieldId: 'demo-field-1',
    date: '2024-01-20T12:00:00Z',
    temperatureC: 28,
    minTempC: 22,
    maxTempC: 34,
    notes: 'Perfect growing temperature'
  },
  {
    id: 'demo-temp-2',
    fieldId: 'demo-field-3',
    date: '2024-01-18T14:00:00Z',
    temperatureC: 25,
    minTempC: 18,
    maxTempC: 32,
    notes: 'Mild day for orchard'
  },
  {
    id: 'demo-temp-3',
    fieldId: 'demo-field-5',
    date: '2024-01-25T08:00:00Z',
    temperatureC: 30,
    minTempC: 24,
    maxTempC: 36,
    notes: 'Warm day for rice growth'
  }
];

export const demoAIRecommendations = [
  {
    id: 'demo-ai-1',
    type: 'suggestion' as const,
    title: 'Optimize Irrigation Schedule',
    message: 'Based on weather patterns, consider irrigating North Wheat Farm early morning for better water absorption.',
    fieldId: 'demo-field-1',
    priority: 'high' as const,
    createdAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'demo-ai-2',
    type: 'warning' as const,
    title: 'Pest Alert - South Orchard',
    message: 'Weather conditions indicate increased risk of aphids. Consider preventive measures.',
    fieldId: 'demo-field-3',
    priority: 'medium' as const,
    createdAt: '2024-01-18T16:00:00Z'
  },
  {
    id: 'demo-ai-3',
    type: 'insight' as const,
    title: 'Crop Rotation Recommendation',
    message: 'After wheat harvest, consider planting legumes to improve soil nitrogen levels for next season.',
    fieldId: 'demo-field-1',
    priority: 'low' as const,
    createdAt: '2024-01-15T14:00:00Z'
  }
];
