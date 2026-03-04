import logging
from datetime import datetime
from .db import get_collection, generate_id

logger = logging.getLogger("api.services.activities")

def _to_num(val):
    try:
        if val is None or val == "": return 0
        f = float(val)
        return int(f) if f == int(f) else f
    except (TypeError, ValueError):
        return 0

class ActivityService:
    @staticmethod
    def get_activities(filters=None):
        col = get_collection('activities')
        query = filters or {}
        return list(col.find(query, {'_id': 0}).sort('date', -1))

    @staticmethod
    def create_activity(data):
        col = get_collection('activities')
        mat_col = get_collection('materials')
        
        act_type = data.get('activity_type')
        if not act_type: raise ValueError("activity_type is required")
            
        field_id = data.get('field_id') or data.get('fieldId')
        qty = _to_num(data.get('quantity_used'))
        cost = _to_num(data.get('cost'))
        income = _to_num(data.get('income'))

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
                    price_per_unit = _to_num(mat.get('price_per_unit', 0))
                    # Only update cost if not manually provided
                    if not data.get('cost'):
                        doc['cost'] = _to_num(qty * price_per_unit)

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
        old_qty = _to_num(doc.get('quantity_used') or 0)
        
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
        qty = _to_num(doc.get('quantity_used'))
        doc['quantity_used'] = qty
        doc['cost'] = _to_num(doc.get('cost'))
        doc['income'] = _to_num(doc.get('income'))

        # Apply new stock logic
        if mat_id and qty > 0:
            if act_type == 'material_purchase':
                mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': qty}})
            elif act_type in ('fertilizer_application', 'pesticide_spray', 'seed_sowing'):
                mat = mat_col.find_one({'id': mat_id})
                if mat:
                    mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': -qty}})
                    if not data.get('cost'): # Auto-calc cost if not provided in update
                        price_per_unit = _to_num(mat.get('price_per_unit', 0))
                        doc['cost'] = _to_num(qty * price_per_unit)

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
        qty = _to_num(doc.get('quantity_used'))

        if act_type == 'material_purchase' and mat_id and qty > 0:
            mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': -qty}})
        elif act_type in ('fertilizer_application', 'pesticide_spray', 'seed_sowing') and mat_id and qty > 0:
            mat_col.update_one({'id': mat_id}, {'$inc': {'stock_quantity': qty}})

        col.delete_one({'id': activity_id})
        return True
