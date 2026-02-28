#!/usr/bin/env python
"""Add 2-5 complete lands with all details for testing."""
import os
from pathlib import Path
from datetime import datetime, timedelta

from dotenv import load_dotenv
from pymongo import MongoClient

# Load backend/.env so this script always uses the same DB (Atlas) as Django.
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)

# MongoDB connection (no local default here; must be configured via env)
MONGO_URI = os.environ.get("MONGO_URI", "")
MONGO_DB = os.environ.get("MONGO_DB", "land_management")

def add_complete_lands():
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    
    # Complete land data with all details
    lands_data = [
        {
            'field': {
                'id': 'land_001',
                'name': 'Green Valley Farm - Wheat',
                'coordinates': [
                    {'lat': 31.5204, 'lng': 74.3587},
                    {'lat': 31.5214, 'lng': 74.3597},
                    {'lat': 31.5224, 'lng': 74.3587},
                    {'lat': 31.5214, 'lng': 74.3577}
                ],
                'area': 15.5,
                'status': 'cultivated',
                'address': 'Near Lahore Canal, Green Valley',
                'locationName': 'Lahore, Punjab',
                'createdAt': '2024-01-15T10:30:00Z',
                'updatedAt': '2024-02-15T14:20:00Z'
            },
            'expenses': [
                {'id': 'exp_land_001_1', 'fieldId': 'land_001', 'category': 'seeds', 'amount': 25000, 'description': 'Premium wheat seeds variety', 'date': '2024-01-16'},
                {'id': 'exp_land_001_2', 'fieldId': 'land_001', 'category': 'fertilizer', 'amount': 12000, 'description': 'NPK and urea fertilizers', 'date': '2024-01-18'},
                {'id': 'exp_land_001_3', 'fieldId': 'land_001', 'category': 'labor', 'amount': 18000, 'description': 'Farm workers monthly wages', 'date': '2024-01-25'},
                {'id': 'exp_land_001_4', 'fieldId': 'land_001', 'category': 'water', 'amount': 8000, 'description': 'Irrigation canal charges', 'date': '2024-02-01'},
                {'id': 'exp_land_001_5', 'fieldId': 'land_001', 'category': 'equipment', 'amount': 35000, 'description': 'Tractor and harvester rental', 'date': '2024-02-10'},
                {'id': 'exp_land_001_6', 'fieldId': 'land_001', 'category': 'pesticides', 'amount': 6000, 'description': 'Crop protection chemicals', 'date': '2024-02-15'}
            ],
            'incomes': [
                {'id': 'inc_land_001_1', 'fieldId': 'land_001', 'type': 'crop', 'amount': 150000, 'description': 'Wheat harvest - premium quality', 'date': '2024-04-15'},
                {'id': 'inc_land_001_2', 'fieldId': 'land_001', 'type': 'crop', 'amount': 25000, 'description': 'Wheat straw sale', 'date': '2024-04-20'}
            ],
            'water_records': [
                {'id': 'water_land_001_1', 'fieldId': 'land_001', 'date': '2024-01-20', 'durationMinutes': 180, 'notes': 'Pre-sowing irrigation'},
                {'id': 'water_land_001_2', 'fieldId': 'land_001', 'date': '2024-02-05', 'durationMinutes': 120, 'notes': 'Germination stage watering'},
                {'id': 'water_land_001_3', 'fieldId': 'land_001', 'date': '2024-02-20', 'durationMinutes': 150, 'notes': 'Vegetative stage irrigation'},
                {'id': 'water_land_001_4', 'fieldId': 'land_001', 'date': '2024-03-10', 'durationMinutes': 200, 'notes': 'Flowering stage critical watering'},
                {'id': 'water_land_001_5', 'fieldId': 'land_001', 'date': '2024-03-25', 'durationMinutes': 160, 'notes': 'Grain filling stage irrigation'},
                {'id': 'water_land_001_6', 'fieldId': 'land_001', 'date': '2024-04-10', 'durationMinutes': 100, 'notes': 'Pre-harvest watering'}
            ],
            'temperature_records': [
                {'id': 'temp_land_001_1', 'fieldId': 'land_001', 'date': '2024-01-20', 'temperatureC': 18, 'minTempC': 12, 'maxTempC': 24, 'notes': 'Cool winter day'},
                {'id': 'temp_land_001_2', 'fieldId': 'land_001', 'date': '2024-02-05', 'temperatureC': 22, 'minTempC': 16, 'maxTempC': 28, 'notes': 'Mild temperature'},
                {'id': 'temp_land_001_3', 'fieldId': 'land_001', 'date': '2024-02-20', 'temperatureC': 25, 'minTempC': 18, 'maxTempC': 32, 'notes': 'Optimal growth temperature'},
                {'id': 'temp_land_001_4', 'fieldId': 'land_001', 'date': '2024-03-10', 'temperatureC': 28, 'minTempC': 22, 'maxTempC': 34, 'notes': 'Warm day, good for flowering'},
                {'id': 'temp_land_001_5', 'fieldId': 'land_001', 'date': '2024-03-25', 'temperatureC': 30, 'minTempC': 24, 'maxTempC': 36, 'notes': 'Hot day, increased water demand'},
                {'id': 'temp_land_001_6', 'fieldId': 'land_001', 'date': '2024-04-10', 'temperatureC': 32, 'minTempC': 26, 'maxTempC': 38, 'notes': 'Peak temperature before harvest'}
            ],
            'thaka_records': []
        },
        {
            'field': {
                'id': 'land_002',
                'name': 'Riverside Farm - Rice',
                'coordinates': [
                    {'lat': 31.5104, 'lng': 74.3487},
                    {'lat': 31.5114, 'lng': 74.3497},
                    {'lat': 31.5124, 'lng': 74.3487},
                    {'lat': 31.5114, 'lng': 74.3477}
                ],
                'area': 10.8,
                'status': 'thaka',
                'address': 'Near River Ravi, Riverside Colony',
                'locationName': 'Lahore, Punjab',
                'createdAt': '2023-12-01T09:00:00Z',
                'updatedAt': '2024-02-01T11:30:00Z'
            },
            'expenses': [
                {'id': 'exp_land_002_1', 'fieldId': 'land_002', 'category': 'seeds', 'amount': 30000, 'description': 'Basmati rice seeds', 'date': '2024-01-10'},
                {'id': 'exp_land_002_2', 'fieldId': 'land_002', 'category': 'fertilizer', 'amount': 15000, 'description': 'Rice specific fertilizers', 'date': '2024-01-15'},
                {'id': 'exp_land_002_3', 'fieldId': 'land_002', 'category': 'water', 'amount': 20000, 'description': 'Paddy field water management', 'date': '2024-01-20'},
                {'id': 'exp_land_002_4', 'fieldId': 'land_002', 'category': 'labor', 'amount': 25000, 'description': 'Transplantation and care', 'date': '2024-01-25'}
            ],
            'incomes': [
                {'id': 'inc_land_002_1', 'fieldId': 'land_002', 'type': 'thaka', 'amount': 120000, 'description': 'Annual thaka payment', 'date': '2024-01-01'},
                {'id': 'inc_land_002_2', 'fieldId': 'land_002', 'type': 'crop', 'amount': 180000, 'description': 'Basmati rice harvest', 'date': '2024-05-15'}
            ],
            'water_records': [
                {'id': 'water_land_002_1', 'fieldId': 'land_002', 'date': '2024-01-10', 'durationMinutes': 240, 'notes': 'Paddy field preparation flooding'},
                {'id': 'water_land_002_2', 'fieldId': 'land_002', 'date': '2024-01-20', 'durationMinutes': 300, 'notes': 'Transplantation watering'},
                {'id': 'water_land_002_3', 'fieldId': 'land_002', 'date': '2024-02-01', 'durationMinutes': 200, 'notes': 'Regular paddy irrigation'},
                {'id': 'water_land_002_4', 'fieldId': 'land_002', 'date': '2024-02-15', 'durationMinutes': 180, 'notes': 'Growth stage watering'},
                {'id': 'water_land_002_5', 'fieldId': 'land_002', 'date': '2024-03-01', 'durationMinutes': 220, 'notes': 'Vegetative stage irrigation'},
                {'id': 'water_land_002_6', 'fieldId': 'land_002', 'date': '2024-03-20', 'durationMinutes': 160, 'notes': 'Reproductive stage watering'}
            ],
            'temperature_records': [
                {'id': 'temp_land_002_1', 'fieldId': 'land_002', 'date': '2024-01-10', 'temperatureC': 20, 'minTempC': 14, 'maxTempC': 26, 'notes': 'Cool day for rice transplanting'},
                {'id': 'temp_land_002_2', 'fieldId': 'land_002', 'date': '2024-01-20', 'temperatureC': 23, 'minTempC': 17, 'maxTempC': 29, 'notes': 'Good temperature for growth'},
                {'id': 'temp_land_002_3', 'fieldId': 'land_002', 'date': '2024-02-01', 'temperatureC': 26, 'minTempC': 20, 'maxTempC': 32, 'notes': 'Optimal rice growing temperature'},
                {'id': 'temp_land_002_4', 'fieldId': 'land_002', 'date': '2024-02-15', 'temperatureC': 28, 'minTempC': 22, 'maxTempC': 34, 'notes': 'Warm and humid'},
                {'id': 'temp_land_002_5', 'fieldId': 'land_002', 'date': '2024-03-01', 'temperatureC': 30, 'minTempC': 24, 'maxTempC': 36, 'notes': 'Hot and humid conditions'},
                {'id': 'temp_land_002_6', 'fieldId': 'land_002', 'date': '2024-03-20', 'temperatureC': 32, 'minTempC': 26, 'maxTempC': 38, 'notes': 'Peak growing season temperature'}
            ],
            'thaka_records': [
                {
                    'id': 'thaka_land_002_1',
                    'fieldId': 'land_002',
                    'tenantName': 'Ahmed Hassan',
                    'tenantContact': '+92-321-9876543',
                    'startDate': '2024-01-01',
                    'endDate': '2024-12-31',
                    'amount': 120000,
                    'status': 'active'
                }
            ]
        },
        {
            'field': {
                'id': 'land_003',
                'name': 'Sunshine Farm - Cotton',
                'coordinates': [
                    {'lat': 31.5304, 'lng': 74.3687},
                    {'lat': 31.5314, 'lng': 74.3697},
                    {'lat': 31.5324, 'lng': 74.3687},
                    {'lat': 31.5314, 'lng': 74.3677}
                ],
                'area': 18.2,
                'status': 'cultivated',
                'address': 'Near Multan Road, Sunshine Colony',
                'locationName': 'Lahore, Punjab',
                'createdAt': '2024-01-05T14:15:00Z',
                'updatedAt': '2024-02-10T16:45:00Z'
            },
            'expenses': [
                {'id': 'exp_land_003_1', 'fieldId': 'land_003', 'category': 'seeds', 'amount': 35000, 'description': 'BT cotton seeds', 'date': '2024-02-01'},
                {'id': 'exp_land_003_2', 'fieldId': 'land_003', 'category': 'fertilizer', 'amount': 20000, 'description': 'Cotton specific nutrients', 'date': '2024-02-05'},
                {'id': 'exp_land_003_3', 'fieldId': 'land_003', 'category': 'pesticides', 'amount': 15000, 'description': 'Cotton pest control', 'date': '2024-02-10'},
                {'id': 'exp_land_003_4', 'fieldId': 'land_003', 'category': 'labor', 'amount': 30000, 'description': 'Picking and processing labor', 'date': '2024-02-15'},
                {'id': 'exp_land_003_5', 'fieldId': 'land_003', 'category': 'equipment', 'amount': 40000, 'description': 'Cotton picking machine rental', 'date': '2024-02-20'}
            ],
            'incomes': [
                {'id': 'inc_land_003_1', 'fieldId': 'land_003', 'type': 'crop', 'amount': 250000, 'description': 'Cotton harvest - premium quality', 'date': '2024-06-15'},
                {'id': 'inc_land_003_2', 'fieldId': 'land_003', 'type': 'crop', 'amount': 30000, 'description': 'Cotton seeds sale', 'date': '2024-06-20'}
            ],
            'water_records': [
                {'id': 'water_land_003_1', 'fieldId': 'land_003', 'date': '2024-02-01', 'durationMinutes': 140, 'notes': 'Pre-sowing irrigation'},
                {'id': 'water_land_003_2', 'fieldId': 'land_003', 'date': '2024-02-15', 'durationMinutes': 120, 'notes': 'Germination stage'},
                {'id': 'water_land_003_3', 'fieldId': 'land_003', 'date': '2024-03-01', 'durationMinutes': 100, 'notes': 'Early growth stage'},
                {'id': 'water_land_003_4', 'fieldId': 'land_003', 'date': '2024-03-20', 'durationMinutes': 130, 'notes': 'Vegetative growth'},
                {'id': 'water_land_003_5', 'fieldId': 'land_003', 'date': '2024-04-10', 'durationMinutes': 110, 'notes': 'Flowering stage'},
                {'id': 'water_land_003_6', 'fieldId': 'land_003', 'date': '2024-05-01', 'durationMinutes': 90, 'notes': 'Boll development stage'}
            ],
            'temperature_records': [
                {'id': 'temp_land_003_1', 'fieldId': 'land_003', 'date': '2024-02-01', 'temperatureC': 24, 'minTempC': 18, 'maxTempC': 30, 'notes': 'Good for cotton sowing'},
                {'id': 'temp_land_003_2', 'fieldId': 'land_003', 'date': '2024-02-15', 'temperatureC': 27, 'minTempC': 21, 'maxTempC': 33, 'notes': 'Optimal germination temperature'},
                {'id': 'temp_land_003_3', 'fieldId': 'land_003', 'date': '2024-03-01', 'temperatureC': 30, 'minTempC': 24, 'maxTempC': 36, 'notes': 'Excellent growth conditions'},
                {'id': 'temp_land_003_4', 'fieldId': 'land_003', 'date': '2024-03-20', 'temperatureC': 33, 'minTempC': 27, 'maxTempC': 39, 'notes': 'Hot day, good for cotton'},
                {'id': 'temp_land_003_5', 'fieldId': 'land_003', 'date': '2024-04-10', 'temperatureC': 35, 'minTempC': 29, 'maxTempC': 41, 'notes': 'Peak temperature, boll formation'},
                {'id': 'temp_land_003_6', 'fieldId': 'land_003', 'date': '2024-05-01', 'temperatureC': 38, 'minTempC': 32, 'maxTempC': 44, 'notes': 'Very hot, boll maturation stage'}
            ],
            'thaka_records': []
        },
        {
            'field': {
                'id': 'land_004',
                'name': 'Fertile Plains - Available',
                'coordinates': [
                    {'lat': 31.5404, 'lng': 74.3787},
                    {'lat': 31.5414, 'lng': 74.3797},
                    {'lat': 31.5424, 'lng': 74.3787},
                    {'lat': 31.5414, 'lng': 74.3777}
                ],
                'area': 22.0,
                'status': 'available',
                'address': 'Near Ferozepur Road, Fertile Plains',
                'locationName': 'Lahore, Punjab',
                'createdAt': '2024-01-01T08:00:00Z',
                'updatedAt': '2024-01-01T08:00:00Z'
            },
            'expenses': [],
            'incomes': [],
            'water_records': [
                {'id': 'water_land_004_1', 'fieldId': 'land_004', 'date': '2024-01-15', 'durationMinutes': 60, 'notes': 'Soil preparation watering'},
                {'id': 'water_land_004_2', 'fieldId': 'land_004', 'date': '2024-02-01', 'durationMinutes': 45, 'notes': 'Light irrigation for soil moisture'}
            ],
            'temperature_records': [
                {'id': 'temp_land_004_1', 'fieldId': 'land_004', 'date': '2024-01-15', 'temperatureC': 19, 'minTempC': 13, 'maxTempC': 25, 'notes': 'Pleasant weather'},
                {'id': 'temp_land_004_2', 'fieldId': 'land_004', 'date': '2024-02-01', 'temperatureC': 23, 'minTempC': 17, 'maxTempC': 29, 'notes': 'Good agricultural weather'}
            ],
            'thaka_records': []
        },
        {
            'field': {
                'id': 'land_005',
                'name': 'Desert Rose Farm - Not Usable',
                'coordinates': [
                    {'lat': 31.5504, 'lng': 74.3887},
                    {'lat': 31.5514, 'lng': 74.3897},
                    {'lat': 31.5524, 'lng': 74.3887},
                    {'lat': 31.5514, 'lng': 74.3877}
                ],
                'area': 8.5,
                'status': 'not_usable',
                'notUsableReason': 'Severe water logging and soil salinity',
                'address': 'Near Desert Area, Rose Colony',
                'locationName': 'Lahore, Punjab',
                'createdAt': '2023-11-15T12:30:00Z',
                'updatedAt': '2024-01-20T10:15:00Z'
            },
            'expenses': [
                {'id': 'exp_land_005_1', 'fieldId': 'land_005', 'category': 'other', 'amount': 5000, 'description': 'Soil testing and analysis', 'date': '2023-11-20'},
                {'id': 'exp_land_005_2', 'fieldId': 'land_005', 'category': 'other', 'amount': 8000, 'description': 'Land reclamation attempt', 'date': '2024-01-10'}
            ],
            'incomes': [],
            'water_records': [
                {'id': 'water_land_005_1', 'fieldId': 'land_005', 'date': '2023-11-20', 'durationMinutes': 300, 'notes': 'Excessive water due to logging'},
                {'id': 'water_land_005_2', 'fieldId': 'land_005', 'date': '2024-01-10', 'durationMinutes': 200, 'notes': 'Drainage attempt'}
            ],
            'temperature_records': [
                {'id': 'temp_land_005_1', 'fieldId': 'land_005', 'date': '2023-11-20', 'temperatureC': 25, 'minTempC': 19, 'maxTempC': 31, 'notes': 'Water logging observed'},
                {'id': 'temp_land_005_2', 'fieldId': 'land_005', 'date': '2024-01-10', 'temperatureC': 21, 'minTempC': 15, 'maxTempC': 27, 'notes': 'Cool day, drainage work'}
            ],
            'thaka_records': []
        }
    ]
    
    # Insert all data
    total_expenses = 0
    total_incomes = 0
    total_water = 0
    total_temperature = 0
    total_thaka = 0
    
    for land_data in lands_data:
        # Insert field
        db.fields.insert_one(land_data['field'])
        print(f"✅ Added field: {land_data['field']['name']}")
        
        # Insert related data
        if land_data['expenses']:
            db.expenses.insert_many(land_data['expenses'])
            total_expenses += len(land_data['expenses'])
            
        if land_data['incomes']:
            db.incomes.insert_many(land_data['incomes'])
            total_incomes += len(land_data['incomes'])
            
        if land_data['water_records']:
            db.water_records.insert_many(land_data['water_records'])
            total_water += len(land_data['water_records'])
            
        if land_data['temperature_records']:
            db.temperature_records.insert_many(land_data['temperature_records'])
            total_temperature += len(land_data['temperature_records'])
            
        if land_data['thaka_records']:
            db.thaka_records.insert_many(land_data['thaka_records'])
            total_thaka += len(land_data['thaka_records'])
    
    print(f"\n🎉 Complete lands added successfully!")
    print(f"📊 Total Fields: {len(lands_data)}")
    print(f"💰 Total Expenses: {total_expenses}")
    print(f"💵 Total Incomes: {total_incomes}")
    print(f"💧 Total Water Records: {total_water}")
    print(f"🌡️ Total Temperature Records: {total_temperature}")
    print(f"📝 Total Thaka Records: {total_thaka}")
    
    client.close()

if __name__ == '__main__':
    add_complete_lands()
