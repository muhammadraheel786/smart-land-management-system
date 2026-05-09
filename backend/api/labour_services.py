import logging
from datetime import datetime
from .db import get_collection, generate_id

logger = logging.getLogger("api.services.labour")

def _to_num(val):
    try:
        if val is None or val == "": return 0
        f = float(val)
        return int(f) if f == int(f) else f
    except (TypeError, ValueError):
        return 0

class LabourService:
    @staticmethod
    def get_labours(filters=None):
        col = get_collection('labours')
        query = filters or {}
        labours = list(col.find(query, {'_id': 0}).sort('created_at', -1))
        
        # Hydrate with summary stats
        trans_col = get_collection('salary_transactions')
        attn_col = get_collection('attendance')
        
        today = datetime.utcnow()
        
        for l in labours:
            lid = l['id']
            # Compute stats
            trans = list(trans_col.find({'labour_id': lid}))
            
            salary_rate = _to_num(l.get('salary_amount', 0))
            total_salary = 0
            
            if l.get('salary_type') == 'monthly':
                # Calculate months from joining date to today
                joining_s = l.get('joining_date') or l.get('salary_start_date') or l.get('created_at', '')[:10]
                try:
                    if not joining_s: raise ValueError()
                    joining_d = datetime.strptime(joining_s[:10], '%Y-%m-%d')
                    months = (today.year - joining_d.year) * 12 + (today.month - joining_d.month)
                    if today.day >= joining_d.day:
                        months += 1
                    months = max(1, months)
                    total_salary = months * salary_rate
                except:
                    total_salary = salary_rate # Fallback to 1 month
            else:
                # Daily: calculate from attendance
                days = attn_col.count_documents({'labour_id': lid, 'status': 'present'})
                halfs = attn_col.count_documents({'labour_id': lid, 'status': 'half_day'})
                total_salary = (days + (halfs * 0.5)) * salary_rate
            
            total_paid = sum(_to_num(t.get('amount')) for t in trans if t.get('type') == 'salary')
            advance_given = sum(_to_num(t.get('amount')) for t in trans if t.get('type') == 'advance')
            advance_recovered = sum(_to_num(t.get('amount')) for t in trans if t.get('type') == 'recovery')
            
            l['total_salary'] = total_salary
            l['total_paid'] = total_paid
            l['balance'] = max(0, total_salary - total_paid)
            l['advance_balance'] = advance_given - advance_recovered
            l['days_worked'] = attn_col.count_documents({'labour_id': lid, 'status': 'present'}) + (attn_col.count_documents({'labour_id': lid, 'status': 'half_day'}) * 0.5)
            
        return labours

    @staticmethod
    def create_labour(data):
        # Validation
        required_fields = ['name', 'salary_type', 'salary_amount']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
        
        # Validate salary_amount is a positive number
        salary_amount = _to_num(data.get('salary_amount', 0))
        if salary_amount <= 0:
            raise ValueError("Salary amount must be greater than 0")
        
        # Validate salary_type
        salary_type = data.get('salary_type', 'daily')
        if salary_type not in ['daily', 'monthly']:
            raise ValueError("Salary type must be 'daily' or 'monthly'")
        
        # Validate work_type
        work_type = data.get('work_type', 'Helper')
        valid_work_types = ['Helper', 'Mason', 'Driver', 'Guard', 'Plumber', 'Electrician', 'Carpenter', 'Painter', 'Welder']
        if work_type not in valid_work_types:
            raise ValueError(f"Work type must be one of: {', '.join(valid_work_types)}")
        
        col = get_collection('labours')
        doc = {
            'id': data.get('id') or generate_id(),
            'name': data.get('name', '').strip(),
            'father_name': data.get('father_name', '').strip(),
            'cnic': data.get('cnic', '').strip(),
            'phone': data.get('phone', '').strip(),
            'address': data.get('address', '').strip(),
            'emergency_contact': data.get('emergency_contact', '').strip(),
            'joining_date': data.get('joining_date', datetime.utcnow().strftime('%Y-%m-%d')),
            'work_type': work_type,
            'salary_type': salary_type,
            'salary_amount': salary_amount,
            'status': data.get('status', 'Active'),
            'photo': data.get('photo', ''),
            'created_at': datetime.utcnow().isoformat() + 'Z'
        }
        
        # Check if labour with same phone already exists
        if doc['phone']:
            existing = col.find_one({'phone': doc['phone']})
            if existing:
                raise ValueError("Labour with this phone number already exists")
        
        col.insert_one(doc)
        if '_id' in doc: del doc['_id']
        return doc

    @staticmethod
    def get_labour(labour_id):
        return next(iter(LabourService.get_labours({'id': labour_id})), None)

    @staticmethod
    def update_labour(labour_id, data):
        col = get_collection('labours')
        doc = col.find_one({'id': labour_id})
        if not doc: return None
        
        excluded = ('id', '_id', 'created_at')
        for k, v in data.items():
            if k not in excluded:
                doc[k] = v
                
        doc['salary_amount'] = _to_num(doc.get('salary_amount', 0))
        
        col.replace_one({'id': labour_id}, doc)
        if '_id' in doc: del doc['_id']
        return doc

    @staticmethod
    def delete_labour(labour_id):
        col = get_collection('labours')
        # Also clean up transactions and attendance
        get_collection('salary_transactions').delete_many({'labour_id': labour_id})
        get_collection('attendance').delete_many({'labour_id': labour_id})
        res = col.delete_one({'id': labour_id})
        return res.deleted_count > 0

    @staticmethod
    def get_dashboard_stats():
        labours = LabourService.get_labours()
        total_labour = len(labours)
        active = sum(1 for l in labours if l.get('status') == 'Active')
        inactive = total_labour - active
        
        total_salary_overall = sum(l['total_salary'] for l in labours)
        total_paid_overall = sum(l['total_paid'] for l in labours)
        pending_salary = sum(l['balance'] for l in labours)
        
        advances_given = sum(l['advance_balance'] for l in labours if l['advance_balance'] > 0)
        
        # To get "This Month" paid, we look at transactions
        trans_col = get_collection('salary_transactions')
        current_month = datetime.utcnow().strftime('%Y-%m')
        this_month_trans = list(trans_col.find({'type': 'salary', 'date': {'$regex': f'^{current_month}'}}))
        paid_this_month = sum(t['amount'] for t in this_month_trans)
        
        return {
            'total_labour': total_labour,
            'active_labour': active,
            'inactive_labour': inactive,
            'total_salary_overall': total_salary_overall,
            'total_paid_overall': total_paid_overall,
            'paid_this_month': paid_this_month,
            'pending_salary': pending_salary,
            'advances_given': advances_given
        }

    # --- Transactions ---
    @staticmethod
    def get_transactions(labour_id):
        col = get_collection('salary_transactions')
        return list(col.find({'labour_id': labour_id}, {'_id': 0}).sort('date', -1))

    @staticmethod
    def add_transaction(labour_id, data):
        col = get_collection('salary_transactions')
        
        amount = _to_num(data.get('amount', 0))
        txn_type = data.get('type', 'salary') # salary, advance, recovery
        
        # If salary payment exceeds balance, auto-convert to advance
        if txn_type == 'salary':
            labour = LabourService.get_labour(labour_id)
            if labour:
                balance = labour['balance']
                if amount > balance and balance > 0:
                    # Split it
                    col.insert_one({
                        'id': generate_id(),
                        'labour_id': labour_id,
                        'amount': balance,
                        'date': data.get('date', datetime.utcnow().strftime('%Y-%m-%d')),
                        'notes': data.get('notes', '') + " (Auto-split salary part)",
                        'transaction_id': data.get('transaction_id', ''),
                        'payment_method': data.get('payment_method', 'Cash'),
                        'type': 'salary',
                        'created_at': datetime.utcnow().isoformat() + 'Z'
                    })
                    advance_amount = amount - balance
                    col.insert_one({
                        'id': generate_id(),
                        'labour_id': labour_id,
                        'amount': advance_amount,
                        'date': data.get('date', datetime.utcnow().strftime('%Y-%m-%d')),
                        'notes': data.get('notes', '') + " (Auto-split to Advance)",
                        'transaction_id': data.get('transaction_id', ''),
                        'payment_method': data.get('payment_method', 'Cash'),
                        'type': 'advance',
                        'created_at': datetime.utcnow().isoformat() + 'Z'
                    })
                    return {"status": "split", "salary": balance, "advance": advance_amount}
        
        doc = {
            'id': generate_id(),
            'labour_id': labour_id,
            'amount': amount,
            'date': data.get('date', datetime.utcnow().strftime('%Y-%m-%d')),
            'notes': data.get('notes', ''),
            'transaction_id': data.get('transaction_id', ''),
            'payment_method': data.get('payment_method', 'Cash'),
            'type': txn_type,
            'created_at': datetime.utcnow().isoformat() + 'Z'
        }
        col.insert_one(doc)
        if '_id' in doc: del doc['_id']
        return doc
        
    @staticmethod
    def delete_transaction(txn_id):
        col = get_collection('salary_transactions')
        res = col.delete_one({'id': txn_id})
        return res.deleted_count > 0

    # --- Attendance ---
    @staticmethod
    def get_attendance(labour_id, month_prefix=None):
        col = get_collection('attendance')
        query = {'labour_id': labour_id}
        if month_prefix:
            query['date'] = {'$regex': f'^{month_prefix}'}
        return list(col.find(query, {'_id': 0}).sort('date', 1))

    @staticmethod
    def mark_attendance(labour_id, data):
        col = get_collection('attendance')
        date_str = data.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
        
        # Upsert attendance for date
        doc = {
            'labour_id': labour_id,
            'date': date_str,
            'status': data.get('status', 'present'), # present, absent, half_day, overtime
            'overtime_hours': _to_num(data.get('overtime_hours', 0))
        }
        
        existing = col.find_one({'labour_id': labour_id, 'date': date_str})
        if existing:
            doc['id'] = existing['id']
            col.replace_one({'_id': existing['_id']}, doc)
        else:
            doc['id'] = generate_id()
            doc['created_at'] = datetime.utcnow().isoformat() + 'Z'
            col.insert_one(doc)
            
        if '_id' in doc: del doc['_id']
        return doc
