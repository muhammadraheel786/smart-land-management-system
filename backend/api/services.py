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
        
        # Primary validation
        act_type = data.get('activity_type')
        if not act_type:
            raise ValueError("activity_type is required")
            
        # Unified field naming: map fieldId to field_id if needed
        field_id = data.get('field_id') or data.get('fieldId')
        
        try:
            qty = float(data.get('quantity_used') or 0)
        except (TypeError, ValueError):
            qty = 0.0
            
        try:
            cost = float(data.get('cost') or 0)
        except (TypeError, ValueError):
            cost = 0.0
            
        try:
            income = float(data.get('income') or 0)
        except (TypeError, ValueError):
            income = 0.0

        doc = {
            'id': data.get('id') or generate_id(),
            'date': data.get('date', datetime.utcnow().strftime('%Y-%m-%d')),
            'field_id': field_id,
            'activity_type': act_type,
            'material_id': data.get('material_id'),
            'quantity_used': qty,
            'cost': cost,
            'income': income,
            'notes': data.get('notes', ''),
            'created_at': data.get('created_at', datetime.utcnow().isoformat() + 'Z')
        }

        mat_id = doc['material_id']

        # Business Logic Rules
        if act_type == 'material_purchase':
            if mat_id and qty > 0:
                mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': qty}})
        
        elif act_type in ('fertilizer_application', 'pesticide_spray', 'seed_sowing'):
            if mat_id and qty > 0:
                mat = mat_col.find_one({'id': mat_id})
                if mat:
                    mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': -qty}})
                    price_per_unit = float(mat.get('price_per_unit', 0))
                    # Only update cost if not manually provided
                    if not data.get('cost'):
                        doc['cost'] = qty * price_per_unit

        elif act_type == 'harvest':
            pass
            
        elif act_type == 'irrigation':
            # Water record usually doesn't have cost/income in simple mode
            doc['cost'] = cost
            doc['income'] = income

        col.insert_one(doc)
        if '_id' in doc:
            del doc['_id']
        return doc

    @staticmethod
    def update_activity(activity_id, data):
        col = get_collection('activities')
        mat_col = get_collection('materials')
        
        doc = col.find_one({'id': activity_id})
        if not doc:
            return None

        # Revert old stock if applicable
        old_type = doc.get('activity_type')
        old_mat_id = doc.get('material_id')
        old_qty = float(doc.get('quantity_used') or 0)
        
        # If material changed or quantity changed, we need to revert old and apply new.
        # Simplify: revert old, then apply new logic.
        if old_mat_id and old_qty > 0:
            if old_type == 'material_purchase':
                mat_col.update_one({'id': old_mat_id}, {'$inc': {'stock_quantity': -old_qty}})
            elif old_type in ('fertilizer_application', 'pesticide_spray', 'seed_sowing'):
                mat_col.update_one({'id': old_mat_id}, {'$inc': {'stock_quantity': old_qty}})

        # Apply updates to doc (shallow merge from data)
        excluded = ('id', '_id', 'created_at')
        for k, v in data.items():
            if k not in excluded:
                doc[k] = v
        
        # Recalculate fields if needed
        act_type = doc.get('activity_type')
        mat_id = doc.get('material_id')
        try:
            qty = float(doc.get('quantity_used') or 0)
            doc['quantity_used'] = qty
        except:
            qty = 0.0

        # Apply new stock logic
        if mat_id and qty > 0:
            if act_type == 'material_purchase':
                mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': qty}})
            elif act_type in ('fertilizer_application', 'pesticide_spray', 'seed_sowing'):
                mat = mat_col.find_one({'id': mat_id})
                if mat:
                    mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': -qty}})
                    if not data.get('cost'): # Auto-calc cost if not provided in update
                        price_per_unit = float(mat.get('price_per_unit', 0))
                        doc['cost'] = qty * price_per_unit

        col.replace_one({'id': activity_id}, doc)
        if '_id' in doc: del doc['_id']
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
