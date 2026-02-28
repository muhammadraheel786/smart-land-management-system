#!/usr/bin/env python
"""Test API endpoints to debug issues."""
import requests
import json

# Test adding a field
field_data = {
    "name": "Test Field - Wheat",
    "coordinates": [
        {"lat": 31.5204, "lng": 74.3587},
        {"lat": 31.5214, "lng": 74.3597},
        {"lat": 31.5224, "lng": 74.3587},
        {"lat": 31.5214, "lng": 74.3577}
    ],
    "area": 12.5,
    "status": "cultivated",
    "address": "Test Address",
    "locationName": "Test Location"
}

try:
    response = requests.post(
        'http://localhost:8000/api/fields/',
        json=field_data,
        headers={'Content-Type': 'application/json'}
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("✅ Field created successfully!")
        field_id = response.json().get('id')
        print(f"Field ID: {field_id}")
        
        # Test adding related data
        expense_data = {
            "fieldId": field_id,
            "category": "seeds",
            "amount": 15000,
            "description": "Wheat seeds for test field",
            "date": "2024-02-15"
        }
        
        expense_response = requests.post(
            'http://localhost:8000/api/expenses/',
            json=expense_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f"Expense Status: {expense_response.status_code}")
        print(f"Expense Response: {expense_response.text}")
        
        # Test adding water record
        water_data = {
            "fieldId": field_id,
            "date": "2024-02-15",
            "durationMinutes": 120,
            "notes": "Test irrigation"
        }
        
        water_response = requests.post(
            'http://localhost:8000/api/water/',
            json=water_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f"Water Status: {water_response.status_code}")
        print(f"Water Response: {water_response.text}")
        
        # Test adding thaka record
        thaka_data = {
            "fieldId": field_id,
            "tenantName": "Test Tenant",
            "tenantContact": "+92-300-1234567",
            "startDate": "2024-01-01",
            "endDate": "2024-12-31",
            "amount": 50000,
            "status": "active"
        }
        
        thaka_response = requests.post(
            'http://localhost:8000/api/thaka/',
            json=thaka_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f"Thaka Status: {thaka_response.status_code}")
        print(f"Thaka Response: {thaka_response.text}")
        
        # Test adding temperature record
        temp_data = {
            "fieldId": field_id,
            "date": "2024-02-15",
            "temperatureC": 25,
            "minTempC": 20,
            "maxTempC": 30,
            "notes": "Test temperature"
        }
        
        temp_response = requests.post(
            'http://localhost:8000/api/temperature/',
            json=temp_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f"Temperature Status: {temp_response.status_code}")
        print(f"Temperature Response: {temp_response.text}")
        
        # Test adding income record
        income_data = {
            "fieldId": field_id,
            "type": "crop",
            "amount": 85000,
            "description": "Wheat harvest sale",
            "date": "2024-04-15"
        }
        
        income_response = requests.post(
            'http://localhost:8000/api/incomes/',
            json=income_data,
            headers={'Content-Type': 'application/json'}
        )
        print(f"Income Status: {income_response.status_code}")
        print(f"Income Response: {income_response.text}")
        
except Exception as e:
    print(f"Error: {e}")
