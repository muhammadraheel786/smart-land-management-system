import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.db import get_collection

def clear_data():
    collections = ['labours', 'salary_transactions', 'attendance']
    print("Clearing labour data...")
    for coll_name in collections:
        coll = get_collection(coll_name)
        result = coll.delete_many({})
        print(f"Deleted {result.deleted_count} documents from '{coll_name}'")
    print("Done.")

if __name__ == "__main__":
    clear_data()
