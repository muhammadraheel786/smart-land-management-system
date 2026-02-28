#!/usr/bin/env python
"""
Dangerous: clear all application data from the configured MongoDB database.

Use this once before going live to remove demo/test records.
It respects MONGO_URI and MONGO_DB from backend/.env or environment.
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    # Ensure .env overrides any system-level MONGO_URI so we always target Atlas.
    load_dotenv(env_path, override=True)

MONGO_URI = os.environ.get("MONGO_URI", "")
MONGO_DB = os.environ.get("MONGO_DB", "land_management")


def main() -> None:
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]

    collections = [
        "fields",
        "expenses",
        "incomes",
        "thaka_records",
        "water_records",
        "temperature_records",
        "materials",
        "material_transactions",
        "daily_register",
    ]

    print(f"Connected to MongoDB: {MONGO_URI}, database={MONGO_DB}")
    for name in collections:
        col = db[name]
        count = col.count_documents({})
        if count == 0:
            print(f"{name}: already empty")
            continue
        result = col.delete_many({})
        print(f"{name}: deleted {result.deleted_count} document(s)")

    client.close()
    print("All application collections cleared.")


if __name__ == "__main__":
    main()

