import logging
from datetime import datetime
from .db import get_collection, generate_id

logger = logging.getLogger("api.services.activities")

class ActivityService:
    @staticmethod
    def get_activities(filters=None):
        col = get_collection('activities')
        query = filters or {}
        # Return sorted by date descending
        return list(col.find(query, {'_id': 0}).sort('date', -1))

    @staticmethod
    def create_activity(data):
        col = get_collection('activities')
        mat_col = get_collection('materials')
        
        doc = {
            'id': data.get('id') or generate_id(),
            'date': data.get('date', datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S')),
            'field_id': data.get('field_id'),
            'activity_type': data.get('activity_type'),
            'material_id': data.get('material_id'),
            'quantity_used': float(data.get('quantity_used') or 0),
            'cost': float(data.get('cost') or 0),
            'income': float(data.get('income') or 0),
            'notes': data.get('notes', ''),
            'created_at': data.get('created_at', datetime.utcnow().isoformat() + 'Z')
        }

        act_type = doc['activity_type']
        mat_id = doc['material_id']
        qty = doc['quantity_used']

        # Business Logic Rules
        if act_type == 'material_purchase':
            if mat_id and qty > 0:
                mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': qty}})
            # Cost is provided dynamically by user.
        
        elif act_type in ('fertilizer_application', 'pesticide_spray', 'seed_sowing'):
            if mat_id and qty > 0:
                # Deduct stock and autocalculate cost
                mat = mat_col.find_one({'id': mat_id})
                if mat:
                    mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': -qty}})
                    price_per_unit = float(mat.get('price_per_unit', 0))
                    doc['cost'] = qty * price_per_unit

        elif act_type == 'harvest':
            # Income should be provided in data
            pass
            
        elif act_type == 'irrigation':
            # Just log activity (no cost or income)
            doc['cost'] = 0
            doc['income'] = 0

        col.insert_one(doc)
        del doc['_id']
        return doc

    @staticmethod
    def delete_activity(activity_id):
        col = get_collection('activities')
        mat_col = get_collection('materials')
        doc = col.find_one({'id': activity_id})
        
        if not doc:
            return False

        # Revert stock changes if applicable
        act_type = doc.get('activity_type')
        mat_id = doc.get('material_id')
        qty = float(doc.get('quantity_used') or 0)

        if act_type == 'material_purchase' and mat_id and qty > 0:
            mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': -qty}})
        elif act_type in ('fertilizer_application', 'pesticide_spray', 'seed_sowing') and mat_id and qty > 0:
            mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': qty}})

        col.delete_one({'id': activity_id})
        return True
