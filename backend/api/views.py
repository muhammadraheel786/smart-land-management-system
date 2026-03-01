"""REST API views for Land Management."""
import logging
import json
import os
import re
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator

from .db import get_collection, generate_id

logger = logging.getLogger("api.views")


def _json_response(data, status=200):
    return JsonResponse(data, status=status, safe=False)


def _api_error(message, status=500, detail=None):
    """Return JSON error response and log. Use for production-safe error handling."""
    payload = {"error": message}
    if detail is not None:
        payload["detail"] = str(detail)
    if status >= 500:
        logger.exception("API error %s: %s", status, message)
    else:
        logger.warning("API error %s: %s", status, message)
    return JsonResponse(payload, status=status)


def _parse_body(request):
    try:
        return json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return {}


# --- Fields (GeoFence) ---

@csrf_exempt
@require_http_methods(["GET", "POST"])
def fields_list(request):
    col = get_collection('fields')
    if request.method == 'GET':
        items = list(col.find({}, {'_id': 0}))
        return _json_response(items)

    body = _parse_body(request)
    doc = {
        'id': body.get('id') or generate_id(),
        'name': body.get('name', ''),
        'coordinates': body.get('coordinates', []),
        'area': body.get('area'),
        'status': body.get('status', 'cultivated'),
        'notUsableReason': body.get('notUsableReason'),
        'address': body.get('address'),
        'locationName': body.get('locationName'),
        'createdAt': body.get('createdAt', ''),
        'updatedAt': body.get('updatedAt', ''),
    }
    from datetime import datetime
    now = datetime.utcnow().isoformat() + 'Z'
    doc['createdAt'] = doc['createdAt'] or now
    doc['updatedAt'] = doc['updatedAt'] or now
    col.insert_one(doc)
    del doc['_id']
    return _json_response(doc, 201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def fields_detail(request, pk):
    col = get_collection('fields')
    if request.method == 'GET':
        doc = col.find_one({'id': pk}, {'_id': 0})
        if not doc:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response(doc)

    if request.method == 'PUT':
        body = _parse_body(request)
        from datetime import datetime
        body['updatedAt'] = datetime.utcnow().isoformat() + 'Z'
        result = col.find_one_and_update(
            {'id': pk},
            {'$set': body},
            return_document=True
        )
        if not result:
            return _json_response({'error': 'Not found'}, 404)
        del result['_id']
        return _json_response(result)

    if request.method == 'DELETE':
        col.delete_one({'id': pk})
        get_collection('expenses').delete_many({'fieldId': pk})
        get_collection('incomes').delete_many({'fieldId': pk})
        get_collection('thaka_records').delete_many({'fieldId': pk})
        get_collection('water_records').delete_many({'fieldId': pk})
        get_collection('temperature_records').delete_many({'fieldId': pk})
        return _json_response({}, 204)


# --- Expenses ---

@csrf_exempt
@require_http_methods(["GET", "POST"])
def expenses_list(request):
    col = get_collection('expenses')
    if request.method == 'GET':
        items = list(col.find({}, {'_id': 0}))
        return _json_response(items)

    body = _parse_body(request)
    doc = {
        'id': body.get('id') or generate_id(),
        'fieldId': body.get('fieldId', ''),
        'category': body.get('category', 'seeds'),
        'amount': body.get('amount', 0),
        'description': body.get('description'),
        'date': body.get('date', ''),
    }
    col.insert_one(doc)
    del doc['_id']
    return _json_response(doc, 201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def expenses_detail(request, pk):
    col = get_collection('expenses')
    if request.method == 'GET':
        doc = col.find_one({'id': pk}, {'_id': 0})
        if not doc:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response(doc)
    if request.method == 'PUT':
        body = _parse_body(request)
        allowed = {'fieldId', 'category', 'amount', 'description', 'date'}
        update = {k: body[k] for k in allowed if k in body}
        if not update:
            doc = col.find_one({'id': pk}, {'_id': 0})
            if not doc:
                return _json_response({'error': 'Not found'}, 404)
            del doc['_id']
            return _json_response(doc)
        result = col.find_one_and_update(
            {'id': pk}, {'$set': update}, return_document=True
        )
        if not result:
            return _json_response({'error': 'Not found'}, 404)
        del result['_id']
        return _json_response(result)
    if request.method == 'DELETE':
        if col.delete_one({'id': pk}).deleted_count == 0:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response({}, 204)


# --- Incomes ---

@csrf_exempt
@require_http_methods(["GET", "POST"])
def incomes_list(request):
    col = get_collection('incomes')
    if request.method == 'GET':
        items = list(col.find({}, {'_id': 0}))
        return _json_response(items)

    body = _parse_body(request)
    doc = {
        'id': body.get('id') or generate_id(),
        'fieldId': body.get('fieldId', ''),
        'type': body.get('type', 'crop'),
        'amount': body.get('amount', 0),
        'description': body.get('description'),
        'date': body.get('date', ''),
    }
    col.insert_one(doc)
    del doc['_id']
    return _json_response(doc, 201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def incomes_detail(request, pk):
    col = get_collection('incomes')
    if request.method == 'GET':
        doc = col.find_one({'id': pk}, {'_id': 0})
        if not doc:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response(doc)
    if request.method == 'PUT':
        body = _parse_body(request)
        allowed = {'fieldId', 'type', 'amount', 'description', 'date'}
        update = {k: body[k] for k in allowed if k in body}
        if not update:
            doc = col.find_one({'id': pk}, {'_id': 0})
            if not doc:
                return _json_response({'error': 'Not found'}, 404)
            del doc['_id']
            return _json_response(doc)
        result = col.find_one_and_update(
            {'id': pk}, {'$set': update}, return_document=True
        )
        if not result:
            return _json_response({'error': 'Not found'}, 404)
        del result['_id']
        return _json_response(result)
    if request.method == 'DELETE':
        if col.delete_one({'id': pk}).deleted_count == 0:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response({}, 204)


# --- Thaka Records ---

@csrf_exempt
@require_http_methods(["GET", "POST"])
def thaka_list(request):
    col = get_collection('thaka_records')
    if request.method == 'GET':
        items = list(col.find({}, {'_id': 0}))
        return _json_response(items)

    body = _parse_body(request)
    doc = {
        'id': body.get('id') or generate_id(),
        'fieldId': body.get('fieldId', ''),
        'tenantName': body.get('tenantName', ''),
        'tenantContact': body.get('tenantContact'),
        'startDate': body.get('startDate', ''),
        'endDate': body.get('endDate', ''),
        'amount': body.get('amount', 0),
        'status': body.get('status', 'active'),
    }
    col.insert_one(doc)
    del doc['_id']
    return _json_response(doc, 201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def thaka_detail(request, pk):
    col = get_collection('thaka_records')
    if request.method == 'GET':
        doc = col.find_one({'id': pk}, {'_id': 0})
        if not doc:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response(doc)
    if request.method == 'PUT':
        body = _parse_body(request)
        allowed = {'fieldId', 'tenantName', 'tenantContact', 'startDate', 'endDate', 'amount', 'status'}
        update = {k: body[k] for k in allowed if k in body}
        if not update:
            doc = col.find_one({'id': pk}, {'_id': 0})
            if not doc:
                return _json_response({'error': 'Not found'}, 404)
            del doc['_id']
            return _json_response(doc)
        result = col.find_one_and_update(
            {'id': pk}, {'$set': update}, return_document=True
        )
        if not result:
            return _json_response({'error': 'Not found'}, 404)
        del result['_id']
        return _json_response(result)
    if request.method == 'DELETE':
        if col.delete_one({'id': pk}).deleted_count == 0:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response({}, 204)


# --- Water Records ---

@csrf_exempt
@require_http_methods(["GET"])
def water_analysis(request):
    """Return water warnings, AI analysis, and per-field next-water suggestions (date + duration)."""
    import random
    from datetime import datetime, timedelta

    fields_col = get_collection('fields')
    water_col = get_collection('water_records')
    temp_col = get_collection('temperature_records')
    fields = list(fields_col.find({}, {'_id': 0}))
    today_s = datetime.utcnow().strftime('%Y-%m-%d')

    warnings = []
    per_field = []

    for f in fields:
        fid = f.get('id', '')
        fname = f.get('name', 'Field')
        if f.get('status') == 'not_usable':
            continue
        field_water = list(water_col.find({'fieldId': fid}, {'_id': 0}).sort('date', -1).limit(10))
        field_temp = list(temp_col.find({'fieldId': fid}, {'_id': 0}).sort('date', -1).limit(7))
        last_water = field_water[0] if field_water else None
        last_date_s = last_water.get('date', '')[:10] if last_water else ''
        last_mins = last_water.get('durationMinutes', 30) if last_water else 30

        # Rule-based warning
        warning = None
        if not last_date_s:
            warning = 'no_water_yet'
            warnings.append({'fieldId': fid, 'fieldName': fname, 'type': 'no_water', 'message': 'No irrigation recorded yet. Consider logging water or schedule first irrigation.', 'priority': 'medium'})
        else:
            try:
                last_d = datetime.strptime(last_date_s, '%Y-%m-%d')
                today_d = datetime.strptime(today_s, '%Y-%m-%d')
                days_since = (today_d - last_d).days
                if days_since >= 5:
                    warning = 'overdue'
                    warnings.append({'fieldId': fid, 'fieldName': fname, 'type': 'overdue', 'message': f'No irrigation since {last_date_s} ({days_since} days). Schedule watering soon.', 'priority': 'high'})
                elif days_since >= 3:
                    warning = 'due_soon'
                    warnings.append({'fieldId': fid, 'fieldName': fname, 'type': 'due_soon', 'message': f'Last watered {last_date_s}. Consider irrigation in the next 1–2 days.', 'priority': 'medium'})
            except Exception:
                pass

        # Suggested next date and minutes (same logic as water_forecast)
        base_mins = max(25, min(90, last_mins + round(random.random() * 20 - 5)))
        days_ahead = 7
        if last_date_s:
            try:
                last_d = datetime.strptime(last_date_s, '%Y-%m-%d')
                days_ahead = max(4, min(10, 5 + (35 - (datetime.utcnow() - last_d.replace(tzinfo=None)).days) // 5))
            except Exception:
                pass
        if field_temp:
            avg_t = sum(t.get('temperatureC', 0) for t in field_temp[:7]) / min(7, len(field_temp))
            if avg_t > 32:
                base_mins = min(90, base_mins + 10)
                days_ahead = max(4, days_ahead - 1)
            elif avg_t < 20:
                days_ahead = min(10, days_ahead + 1)
        next_d = (datetime.utcnow() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
        suggested_mins = round(base_mins + random.random() * 10)

        per_field.append({
            'fieldId': fid,
            'fieldName': fname,
            'lastWaterDate': last_date_s or None,
            'lastDurationMinutes': last_mins,
            'suggestedNextDate': next_d,
            'suggestedMinutes': suggested_mins,
            'warning': warning,
            'aiNote': None,
        })

    # AI analysis (overall paragraph + per-field note)
    analysis_text = None
    model_used = 'built-in'
    context_parts = [f"Today: {today_s}. Fields: {len(per_field)}."]
    for p in per_field:
        ctx = f"{p['fieldName']}: last water {p['lastWaterDate'] or 'never'}"
        if p['lastDurationMinutes']:
            ctx += f" ({p['lastDurationMinutes']} min)"
        ctx += f"; suggested next: {p['suggestedNextDate']}, {p['suggestedMinutes']} min. Warning: {p['warning'] or 'none'}."
        context_parts.append(ctx)
    water_context = "\n".join(context_parts)

    system = """You are an irrigation advisor for Pakistan/South Asia. Respond with ONLY valid JSON, no markdown or extra text.
Use this exact structure: {"analysis": "2-4 sentence overall analysis of irrigation status and any risks (over/under watering). Mention which fields need attention and when to water next.", "notes": ["one sentence per field in the same order as given: when to water next and brief reason"]}
The "notes" array must have exactly one entry per field, in the same order as in the user message."""
    user = f"Water data:\n{water_context}"

    ai_content, model_used, _ = _call_ai_chat(system, user)
    if ai_content:
        try:
            # Strip possible markdown code block
            raw = ai_content.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[-1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw.rsplit("```", 1)[0].strip()
            data = json.loads(raw)
            analysis_text = (data.get("analysis") or "").strip()
            notes_list = data.get("notes") or []
            for i, note in enumerate(notes_list):
                if i < len(per_field) and isinstance(note, str):
                    per_field[i]["aiNote"] = note.strip()
        except (json.JSONDecodeError, KeyError):
            analysis_text = ai_content[:800] if ai_content else None
    if not analysis_text:
        analysis_text = (
            f"Based on your water records: {len(warnings)} field(s) need attention. "
            + ("Schedule irrigation for fields with no recent water. " if any(w.get('type') == 'overdue' or w.get('type') == 'no_water' for w in warnings) else "")
            + "Use the suggested next dates and durations below as a guide; adjust for soil type and weather."
        )
    for i, p in enumerate(per_field):
        if not p.get("aiNote"):
            p["aiNote"] = f"Next irrigation suggested on {p['suggestedNextDate']} for about {p['suggestedMinutes']} minutes."

    return _json_response({
        'warnings': warnings,
        'analysis': analysis_text,
        'perField': per_field,
        'model': model_used,
    })


@csrf_exempt
@require_http_methods(["GET", "POST"])
def water_list(request):
    col = get_collection('water_records')
    if request.method == 'GET':
        items = list(col.find({}, {'_id': 0}))
        return _json_response(items)

    body = _parse_body(request)
    doc = {
        'id': body.get('id') or generate_id(),
        'fieldId': body.get('fieldId', ''),
        'date': body.get('date', ''),
        'durationMinutes': body.get('durationMinutes', 0),
        'notes': body.get('notes'),
    }
    col.insert_one(doc)
    del doc['_id']
    return _json_response(doc, 201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def water_detail(request, pk):
    col = get_collection('water_records')
    if request.method == 'GET':
        doc = col.find_one({'id': pk}, {'_id': 0})
        if not doc:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response(doc)
    if request.method == 'PUT':
        body = _parse_body(request)
        allowed = {'fieldId', 'date', 'durationMinutes', 'notes'}
        update = {k: body[k] for k in allowed if k in body}
        if not update:
            doc = col.find_one({'id': pk}, {'_id': 0})
            if not doc:
                return _json_response({'error': 'Not found'}, 404)
            del doc['_id']
            return _json_response(doc)
        result = col.find_one_and_update(
            {'id': pk}, {'$set': update}, return_document=True
        )
        if not result:
            return _json_response({'error': 'Not found'}, 404)
        del result['_id']
        return _json_response(result)
    if request.method == 'DELETE':
        if col.delete_one({'id': pk}).deleted_count == 0:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response({}, 204)


# --- Temperature Records ---

@csrf_exempt
@require_http_methods(["GET", "POST"])
def temperature_list(request):
    col = get_collection('temperature_records')
    if request.method == 'GET':
        items = list(col.find({}, {'_id': 0}))
        return _json_response(items)

    body = _parse_body(request)
    doc = {
        'id': body.get('id') or generate_id(),
        'fieldId': body.get('fieldId', ''),
        'date': body.get('date', ''),
        'temperatureC': body.get('temperatureC', 0),
        'minTempC': body.get('minTempC'),
        'maxTempC': body.get('maxTempC'),
        'notes': body.get('notes'),
    }
    col.insert_one(doc)
    del doc['_id']
    return _json_response(doc, 201)


# --- AI Recommendations (computed) ---

@csrf_exempt
@require_http_methods(["GET"])
def ai_recommendations(request):
    fields_col = get_collection('fields')
    expenses_col = get_collection('expenses')
    incomes_col = get_collection('incomes')
    fields = list(fields_col.find({}, {'_id': 0}))
    expenses = list(expenses_col.find({}, {'_id': 0}))
    incomes = list(incomes_col.find({}, {'_id': 0}))

    recs = []
    from datetime import datetime
    now = datetime.utcnow().isoformat() + 'Z'

    for f in fields:
        fid = f.get('id', '')
        if f.get('status') in ('available', 'uncultivated'):
            has_income = any(i.get('fieldId') == fid for i in incomes)
            if not has_income:
                recs.append({
                    'id': generate_id(),
                    'type': 'suggestion',
                    'title': 'Unused Land',
                    'message': f'Field "{f.get("name")}" is unused. Consider leasing it on Thaka or cultivating.',
                    'fieldId': fid,
                    'priority': 'medium',
                    'createdAt': now,
                })

    for f in fields:
        fid = f.get('id', '')
        field_exp = sum(e.get('amount', 0) for e in expenses if e.get('fieldId') == fid)
        field_inc = sum(i.get('amount', 0) for i in incomes if i.get('fieldId') == fid)
        if field_exp > 0 and field_inc < field_exp and field_exp > 1000:
            recs.append({
                'id': generate_id(),
                'type': 'warning',
                'title': 'Loss-Making Field',
                'message': f'Field "{f.get("name")}" has high expense (Rs {field_exp}) but low income (Rs {field_inc}).',
                'fieldId': fid,
                'priority': 'high',
                'createdAt': now,
            })

    return _json_response(recs[:20])


# --- AI Insights (free: Gemini | paid: OpenAI) ---

def _call_gemini_api(api_key, full_prompt):
    """Call Google Gemini REST API (free tier). Returns response text."""
    import urllib.request
    import urllib.error
    # Free tier: gemini-1.5-flash or gemini-2.0-flash. Set GEMINI_MODEL in .env to override.
    model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 2048},
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            out = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        try:
            err_data = json.loads(body)
            msg = err_data.get("error", {}).get("message", body) or str(e)
        except Exception:
            msg = body or str(e)
        raise ValueError(f"Gemini API {e.code}: {msg}")
    text = (out.get("candidates") or [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    if not text:
        raise ValueError("Empty response from Gemini")
    return text.strip()


def _generate_built_in_insights():
    """Generate summary and recommendations from your data — no API key needed."""
    fields = list(get_collection('fields').find({}, {'_id': 0}))
    expenses = list(get_collection('expenses').find({}, {'_id': 0}))
    incomes = list(get_collection('incomes').find({}, {'_id': 0}))
    water = list(get_collection('water_records').find({}, {'_id': 0}))
    temp = list(get_collection('temperature_records').find({}, {'_id': 0}))
    thaka = list(get_collection('thaka_records').find({}, {'_id': 0}))
    daily = list(get_collection('daily_register').find({}, {'_id': 0}))

    total_exp = sum(e.get('amount', 0) for e in expenses)
    total_inc = sum(i.get('amount', 0) for i in incomes)
    net = total_inc - total_exp
    by_status = {}
    for f in fields:
        s = f.get('status', 'unknown')
        by_status[s] = by_status.get(s, 0) + 1
    cultivated = by_status.get('cultivated', 0)
    available = by_status.get('available', 0) + by_status.get('uncultivated', 0)
    active_thaka = len([t for t in thaka if t.get('status') == 'active'])

    # Summary
    parts = []
    if fields:
        parts.append(f"You have {len(fields)} field(s): {cultivated} cultivated, {available} available or uncultivated.")
    parts.append(f"Total expenses: Rs {total_exp:,}, income: Rs {total_inc:,}, net: Rs {net:,}.")
    if active_thaka:
        parts.append(f"{active_thaka} active Thaka (lease) agreement(s).")
    if water:
        parts.append(f"{len(water)} water record(s) and {len(temp)} temperature record(s) on file.")
    else:
        parts.append("Add water and temperature records for better insights.")
    summary = " ".join(parts)

    # Recommendations
    recs = []
    for f in fields:
        fid = f.get('id', '')
        fname = f.get('name', 'Field')
        if f.get('status') in ('available', 'uncultivated'):
            has_income = any(i.get('fieldId') == fid for i in incomes)
            if not has_income:
                recs.append({
                    "type": "suggestion",
                    "title": "Unused land",
                    "message": f'"{fname}" is not cultivated and has no income. Consider leasing on Thaka or starting cultivation.',
                    "priority": "medium",
                    "fieldId": fid,
                })
        field_exp = sum(e.get('amount', 0) for e in expenses if e.get('fieldId') == fid)
        field_inc = sum(i.get('amount', 0) for i in incomes if i.get('fieldId') == fid)
        if field_exp > 0 and field_inc < field_exp and field_exp > 500:
            recs.append({
                "type": "warning",
                "title": "Loss-making field",
                "message": f'"{fname}" has expenses Rs {field_exp:,} but income Rs {field_inc:,}. Review costs or increase revenue.',
                "priority": "high",
                "fieldId": fid,
            })
    if not water and fields:
        recs.append({
            "type": "suggestion",
            "title": "Track irrigation",
            "message": "No water records yet. Log irrigation in Water Management to monitor usage and plan better.",
            "priority": "medium",
            "fieldId": None,
        })
    if not temp and fields:
        recs.append({
            "type": "insight",
            "title": "Add temperature data",
            "message": "Temperature records help with crop planning. Use the Temperature page (with field locations for live data).",
            "priority": "low",
            "fieldId": None,
        })
    if net < 0 and (expenses or incomes):
        recs.append({
            "type": "warning",
            "title": "Overall loss",
            "message": f"Net profit is negative (Rs {net:,}). Review high-expense fields and consider Thaka for unused land.",
            "priority": "high",
            "fieldId": None,
        })
    if available > 0 and not recs:
        recs.append({
            "type": "suggestion",
            "title": "Use available land",
            "message": f"You have {available} available/uncultivated field(s). Consider Thaka or cultivation to generate income.",
            "priority": "medium",
            "fieldId": None,
        })
    if not recs and fields:
        recs.append({
            "type": "insight",
            "title": "Keep recording",
            "message": "Keep adding expenses, income, and daily register entries. More data improves insights.",
            "priority": "low",
            "fieldId": None,
        })

    now = datetime.utcnow().isoformat() + "Z"
    out_recs = []
    for r in recs[:12]:
        out_recs.append({
            "id": generate_id(),
            "type": r.get("type", "insight"),
            "title": r.get("title", "Insight"),
            "message": r.get("message", ""),
            "fieldId": r.get("fieldId"),
            "priority": r.get("priority", "medium"),
            "createdAt": now,
        })
    return {"summary": summary, "recommendations": out_recs}


def _build_ai_context():
    """Build a concise text summary of all land/farm data for the LLM."""
    fields = list(get_collection('fields').find({}, {'_id': 0}))
    expenses = list(get_collection('expenses').find({}, {'_id': 0}))
    incomes = list(get_collection('incomes').find({}, {'_id': 0}))
    water = list(get_collection('water_records').find({}, {'_id': 0}))
    temp = list(get_collection('temperature_records').find({}, {'_id': 0}))
    thaka = list(get_collection('thaka_records').find({}, {'_id': 0}))
    daily = list(get_collection('daily_register').find({}, {'_id': 0}))

    total_exp = sum(e.get('amount', 0) for e in expenses)
    total_inc = sum(i.get('amount', 0) for i in incomes)
    by_status = {}
    for f in fields:
        s = f.get('status', 'unknown')
        by_status[s] = by_status.get(s, 0) + 1

    lines = [
        "## Fields",
        f"Total: {len(fields)}. By status: {by_status}.",
        "Names and areas: " + ", ".join(f"{f.get('name')} ({f.get('area') or '?'} acres, {f.get('status')})" for f in fields[:15]),
        "",
        "## Finances",
        f"Total expenses: Rs {total_exp}. Total income: Rs {total_inc}. Net: Rs {total_inc - total_exp}.",
        f"Expenses by field: " + ", ".join(f"{e.get('fieldId')}: Rs {e.get('amount')}" for e in expenses[:20]),
        f"Incomes by field: " + ", ".join(f"{i.get('fieldId')}: Rs {i.get('amount')}" for i in incomes[:20]),
        "",
        "## Water",
        f"Records: {len(water)}. Recent: " + (f"{water[0].get('date')} ({water[0].get('durationMinutes')} min)" if water else "none"),
        "",
        "## Temperature",
        f"Records: {len(temp)}. " + (f"Latest avg: {sum(t.get('temperatureC', 0) for t in temp[:10]) / min(10, len(temp)):.1f} °C" if temp else "No data"),
        "",
        "## Thaka (leases)",
        f"Active: {len([t for t in thaka if t.get('status') == 'active'])}. Total records: {len(thaka)}.",
        "",
        "## Daily register (field activity)",
        f"Entries: {len(daily)}. " + (f"Recent activities: {', '.join(d.get('activity', '') for d in daily[:5])}" if daily else "No entries"),
    ]
    return "\n".join(lines)


@csrf_exempt
@require_http_methods(["POST"])
def ai_insights(request):
    """Generate AI insights. Primary: Hugging Face (HF_TOKEN). Fallback: built-in rule-based."""
    # Ensure .env is loaded (e.g. when run from project root)
    from pathlib import Path
    from dotenv import load_dotenv
    _backend_dir = Path(__file__).resolve().parent.parent
    load_dotenv(_backend_dir / ".env", override=True)

    hf_token = os.environ.get("HF_TOKEN", "").strip() or os.environ.get("HUGGINGFACE_TOKEN", "").strip()

    # No Hugging Face token: use built-in rule-based only
    if not hf_token:
        try:
            result = _generate_built_in_insights()
            return _json_response({
                "summary": result["summary"],
                "recommendations": result["recommendations"],
                "model": "built-in",
            })
        except Exception as e:
            return JsonResponse({"error": "Insights error", "detail": str(e)}, status=502)

    context = _build_ai_context()
    system_prompt = """You are an expert land and farm management advisor for Pakistan/ South Asia. You analyze the owner's land data and give concise, actionable insights. Respond only with valid JSON, no markdown or extra text. Use this exact structure:
{"summary": "2-4 sentence overall summary of the farm situation and main opportunities or risks.", "recommendations": [{"type": "warning"|"suggestion"|"insight", "title": "Short title", "message": "One or two sentence actionable message.", "priority": "high"|"medium"|"low", "fieldId": "optional field id if relevant"}]}
- type: use "warning" for risks/losses, "suggestion" for actions (e.g. Thaka, irrigation), "insight" for observations.
- Give 3-8 recommendations. Be specific (mention field names, amounts, dates when you know them)."""
    user_prompt = f"Analyze this farm/land data and provide a JSON response with summary and recommendations:\n\n{context}"

    content = None
    model_used = None
    last_hf_error = None

    # 1. Hugging Face (OpenAI-compatible router; try primary model then fallbacks)
    if content is None and hf_token:
        # Try HF_MODEL, then common free Llama models
        default_hf = os.environ.get("HF_MODEL", "meta-llama/Meta-Llama-3-8B-Instruct")
        hf_models_to_try = [
            default_hf,
            "meta-llama/Llama-3.2-3B-Instruct",
            "Qwen/Qwen2.5-72B-Instruct",
            "mistralai/Mistral-Nemo-Instruct-2407",
        ]
        import urllib.request
        seen = set()
        for hf_model in hf_models_to_try:
            if not hf_model or hf_model in seen:
                continue
            seen.add(hf_model)
            try:
                payload = {
                    "model": hf_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.3
                }
                req = urllib.request.Request("https://router.huggingface.co/v1/chat/completions", data=json.dumps(payload).encode("utf-8"), method="POST")
                req.add_header("Authorization", f"Bearer {hf_token}")
                req.add_header("Content-Type", "application/json")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    resp_data = json.loads(resp.read().decode())
                content = (resp_data.get("choices", [{}])[0].get("message", {}).get("content", "")).strip()
                if content:
                    model_used = hf_model
                    break
            except Exception as _hf_err:
                last_hf_error = _hf_err
                logger.warning("HF API failed (ai_insights) model=%s: %s", hf_model, _hf_err)
                if os.environ.get("DEBUG", "").lower() in ("true", "1"):
                    logger.exception("HF full traceback")
                content = None

    # If Hugging Face failed or unavailable, use built-in so you always get insights
    if not content:
        try:
            result = _generate_built_in_insights()
            payload = {
                "summary": result["summary"],
                "recommendations": result["recommendations"],
                "model": "built-in (API quota exceeded or unavailable)",
            }
            if os.environ.get("DEBUG", "").lower() in ("true", "1") and last_hf_error is not None:
                payload["debug_hf_error"] = str(last_hf_error)
            return _json_response(payload)
        except Exception as e:
            return JsonResponse({"error": "Insights error", "detail": str(e)}, status=502)

    try:
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```$", "", content)
        data = json.loads(content)
        summary = data.get("summary", "")
        recs = data.get("recommendations", [])
        now = datetime.utcnow().isoformat() + "Z"
        out_recs = []
        for i, r in enumerate(recs[:15]):
            out_recs.append({
                "id": generate_id(),
                "type": r.get("type", "insight"),
                "title": r.get("title", "Insight"),
                "message": r.get("message", ""),
                "fieldId": r.get("fieldId"),
                "priority": r.get("priority", "medium"),
                "createdAt": now,
            })
        return _json_response({"summary": summary, "recommendations": out_recs, "model": model_used or "unknown"})
    except json.JSONDecodeError as e:
        return JsonResponse({"error": "Invalid AI response", "detail": str(e)}, status=502)


def _call_ai_chat(system_prompt: str, user_content: str) -> tuple[str | None, str, str | None]:
    """Primary: Hugging Face. Fallback: None (caller uses built-in or 503). Returns (reply_text, model_name, debug_error)."""
    from pathlib import Path
    from dotenv import load_dotenv
    _backend_dir = Path(__file__).resolve().parent.parent
    load_dotenv(_backend_dir / ".env", override=True)

    hf_token = os.environ.get("HF_TOKEN", "").strip() or os.environ.get("HUGGINGFACE_TOKEN", "").strip()
    last_hf_error = None

    # Hugging Face (primary) – try configured model then fallback models
    if hf_token:
        default_hf = os.environ.get("HF_MODEL", "meta-llama/Meta-Llama-3-8B-Instruct")
        hf_candidates = [default_hf, "meta-llama/Llama-3.2-3B-Instruct", "Qwen/Qwen2.5-72B-Instruct", "mistralai/Mistral-Nemo-Instruct-2407"]
        import urllib.request
        seen_hf = set()
        for hf_model in hf_candidates:
            if not hf_model or hf_model in seen_hf:
                continue
            seen_hf.add(hf_model)
            try:
                payload = {
                    "model": hf_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    "temperature": 0.4
                }
                req = urllib.request.Request("https://router.huggingface.co/v1/chat/completions", data=json.dumps(payload).encode("utf-8"), method="POST")
                req.add_header("Authorization", f"Bearer {hf_token}")
                req.add_header("Content-Type", "application/json")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    resp_data = json.loads(resp.read().decode())
                text = (resp_data.get("choices", [{}])[0].get("message", {}).get("content", "")).strip()
                if text:
                    return (text, hf_model, None)
            except Exception as _hf_err:
                last_hf_error = _hf_err
                logger.warning("HF API failed (_call_ai_chat) model=%s: %s", hf_model, _hf_err)
                if os.environ.get("DEBUG", "").lower() in ("true", "1"):
                    logger.exception("HF full traceback")

    # No Gemini/OpenAI: fallback is built-in (handled by caller) or 503 for chat
    return (None, "", str(last_hf_error) if last_hf_error else None)


@csrf_exempt
@require_http_methods(["POST"])
def ai_chat(request):
    """Chat with Hugging Face (primary); uses land data as context. Fallback: built-in message."""
    body = _parse_body(request)
    message = (body.get("message") or "").strip()
    if not message:
        return JsonResponse({"error": "Missing message", "reply": ""}, status=400)

    context = _build_ai_context()
    system_prompt = """You are a helpful land and farm management assistant for Pakistan and South Asia. Use the following data about the user's land when answering. Be concise and friendly. If the user asks about something not in the data, say so politely and suggest they add it. Answer in the same language the user uses (e.g. English or Urdu)."""
    user_content = f"Land data:\n{context}\n\nUser question: {message}"

    reply, model_used, debug_error = _call_ai_chat(system_prompt, user_content)
    if reply:
        return _json_response({"reply": reply, "model": model_used})
    body = {
        "error": "AI not available",
        "reply": "Chat AI is not available right now. Set HF_TOKEN in backend .env and try again, or check that your Hugging Face token has Inference API access.",
    }
    if os.environ.get("DEBUG", "").lower() in ("true", "1") and debug_error:
        body["detail"] = debug_error
    return JsonResponse(body, status=503)


# --- Dashboard / All Data ---

@csrf_exempt
@require_http_methods(["GET"])
def dashboard(request):
    """Return all data in one response for initial load. Auth set by middleware; validate before use."""
    auth_user = getattr(request, "auth_user", None)
    if not auth_user:
        return _api_error("Authentication required", status=401)

    try:
        fields = list(get_collection("fields").find({}, {"_id": 0}))
        expenses = list(get_collection("expenses").find({}, {"_id": 0}))
        incomes = list(get_collection("incomes").find({}, {"_id": 0}))
        thaka = list(get_collection("thaka_records").find({}, {"_id": 0}))
        water = list(get_collection("water_records").find({}, {"_id": 0}))
        temp = list(get_collection("temperature_records").find({}, {"_id": 0}))
        return _json_response({
            "fields": fields,
            "expenses": expenses,
            "incomes": incomes,
            "thakaRecords": thaka,
            "waterRecords": water,
            "temperatureRecords": temp,
        })
    except Exception as e:
        logger.exception("dashboard: failed to load data")
        return _api_error("Failed to load dashboard data", status=500, detail=e)


# --- ML Predict (production: real data + optional AI) ---

def _get_field_context(field_id):
    """Return field plus its water, temperature, expenses, incomes for prediction logic."""
    fields_col = get_collection('fields')
    field = fields_col.find_one({'id': field_id}, {'_id': 0}) if field_id else None
    if not field_id:
        return None, [], [], [], []
    water = list(get_collection('water_records').find({'fieldId': field_id}, {'_id': 0}))
    temp = list(get_collection('temperature_records').find({'fieldId': field_id}, {'_id': 0}))
    expenses = list(get_collection('expenses').find({'fieldId': field_id}, {'_id': 0}))
    incomes = list(get_collection('incomes').find({'fieldId': field_id}, {'_id': 0}))
    # Sort by date descending for "recent"
    for lst, key in [(water, 'date'), (temp, 'date')]:
        try:
            lst.sort(key=lambda x: x.get(key) or '', reverse=True)
        except Exception:
            pass
    return field, water, temp, expenses, incomes


def _prediction_ai_summary(field_id, field_name, context_payload):
    """Optional: get 2–3 sentence AI summary for prediction context. Returns (text, model) or (None, '')."""
    system = "You are a land management advisor for Pakistan/South Asia. In 2-3 short sentences, summarize the prediction outlook for this field and give one actionable recommendation. Be concise; no bullet lists."
    user = f"Field: {field_name or field_id}. Context: {context_payload}"
    text, model, _ = _call_ai_chat(system, user)
    return (text, model)


@csrf_exempt
@require_http_methods(["POST"])
def predict(request):
    import random
    from datetime import datetime, timedelta

    try:
        body = _parse_body(request)
        pred_type = body.get('type')
        field_id = (body.get('fieldId') or '').strip()
        data = body.get('data', {}) or {}
        include_ai = body.get('includeAiSummary', False)

        field, water, temp, expenses, incomes = _get_field_context(field_id)
        field_name = (field.get('name') or 'Field') if field else 'Field'
        status = (field.get('status') or data.get('status') or 'available') if field else data.get('status') or 'available'
        area = float(field.get('area') or data.get('area') or 1) if field else float(data.get('area') or 1)

        # --- crop_health: use water + temp + status for score ---
        if pred_type == 'crop_health':
            base = 70 if status == 'cultivated' else 45 if status in ('available', 'uncultivated') else 25
            # Recent irrigation: last 14 days water boosts health
            recent_water_mins = 0
            if water:
                try:
                    cutoff = (datetime.utcnow() - timedelta(days=14)).strftime('%Y-%m-%d')
                    recent_water_mins = sum(w.get('durationMinutes', 0) for w in water if (w.get('date') or '') >= cutoff)
                except Exception:
                    recent_water_mins = sum(w.get('durationMinutes', 0) for w in water[:5])
            water_bonus = min(15, recent_water_mins // 30)  # up to +15 for regular irrigation
            # Temperature: moderate temps better
            temp_bonus = 0
            if temp:
                avg_temp = sum(t.get('temperatureC', 0) for t in temp[:10]) / min(10, len(temp))
                if 18 <= avg_temp <= 32:
                    temp_bonus = 8
                elif 15 <= avg_temp <= 35:
                    temp_bonus = 4
            health = min(100, base + water_bonus + temp_bonus + round(random.random() * 10))
            ndvi = round(0.35 + (health / 100) * 0.45 + random.random() * 0.05, 2)
            ndvi = min(0.85, ndvi)
            if health < 50:
                rec = 'Schedule irrigation soon and check soil moisture.'
            elif health > 85:
                rec = 'Optimal. Maintain current irrigation and monitor for pests.'
            else:
                rec = 'Monitor growth; consider light irrigation if soil is dry.'
            factors_used = []
            if water:
                factors_used.append(f"{len(water)} water record(s)")
            if temp:
                factors_used.append(f"{len(temp)} temperature record(s)")
            factors_used.append(f"status={status}")
            out = {
                'fieldId': field_id,
                'healthScore': health,
                'ndvi': ndvi,
                'recommendation': rec,
                'factorsUsed': factors_used,
            }
            if include_ai:
                ctx = f"Health score {health}, NDVI {ndvi}. Recommendation: {rec}. Water records: {len(water)}; temp records: {len(temp)}."
                ai_text, model = _prediction_ai_summary(field_id, field_name, ctx)
                if ai_text:
                    out['aiSummary'] = ai_text
                    out['aiModel'] = model
            return _json_response(out)

        # --- yield_prediction: area × historical yield with data-driven adjustment ---
        if pred_type == 'yield_prediction':
            hist_yield = float(data.get('historicalYield') or 500)
            # If we have income for this field, rough inverse: income/price ≈ yield (kg) for planning
            if incomes and field_id:
                total_income = sum(i.get('amount', 0) for i in incomes)
                if total_income > 0 and area > 0:
                    # Assume Rs 80–120/kg range; use as soft prior
                    implied_yield = total_income / 100
                    hist_yield = (hist_yield * 0.6 + (implied_yield / max(0.01, area)) * 0.4)
            yield_per_acre = max(100, hist_yield)
            pred_kg = round(area * yield_per_acre * (0.88 + random.random() * 0.18))
            confidence = 0.72 + random.random() * 0.2
            if water and temp:
                confidence = min(0.95, confidence + 0.08)
            factors_used = [f"area={area} ac", f"historicalYield≈{round(yield_per_acre)} kg/ac"]
            if incomes:
                factors_used.append("income history used")
            out = {
                'fieldId': field_id,
                'predictedYieldKg': pred_kg,
                'confidence': round(confidence, 2),
                'factorsUsed': factors_used,
            }
            if include_ai:
                ctx = f"Field {field_name}: {area} acres, predicted yield {pred_kg} kg (confidence {confidence:.0%})."
                ai_text, model = _prediction_ai_summary(field_id, field_name, ctx)
                if ai_text:
                    out['aiSummary'] = ai_text
                    out['aiModel'] = model
            return _json_response(out)

        # --- price_prediction: crop base + optional AI ---
        if pred_type == 'price_prediction':
            crop = (data.get('cropType') or 'wheat').lower()
            base_prices = {'wheat': 80, 'rice': 120, 'cotton': 200, 'sugarcane': 8, 'maize': 60}
            base = base_prices.get(crop, 80)
            pred = round(base * (0.88 + random.random() * 0.28), 2)
            confidence = round(0.72 + random.random() * 0.22, 2)
            factors_used = [f"cropType={crop}", "local market baseline (Rs/kg)"]
            out = {
                'fieldId': field_id,
                'cropType': crop,
                'predictedPricePerKg': pred,
                'confidence': confidence,
                'factorsUsed': factors_used,
            }
            if include_ai:
                ctx = f"Crop: {crop}. Predicted price Rs {pred}/kg. Use for planning; harvest-time prices may vary."
                ai_text, model = _prediction_ai_summary(field_id, field_name, ctx)
                if ai_text:
                    out['aiSummary'] = ai_text
                    out['aiModel'] = model
            return _json_response(out)

        # --- water_forecast: last irrigation + temp → next date and minutes ---
        if pred_type == 'water_forecast':
            base_mins = 40
            days_ahead = 7
            if water:
                last = water[0]
                last_date_s = last.get('date') or ''
                last_mins = last.get('durationMinutes', 30)
                base_mins = max(25, min(90, last_mins + round(random.random() * 20 - 5)))
                try:
                    if last_date_s:
                        last_d = datetime.strptime(last_date_s[:10], '%Y-%m-%d')
                        days_ahead = max(4, min(10, 5 + (35 - (datetime.utcnow() - last_d.replace(tzinfo=None)).days) // 5))
                except Exception:
                    pass
            if temp:
                avg_t = sum(t.get('temperatureC', 0) for t in temp[:7]) / min(7, len(temp))
                if avg_t > 32:
                    base_mins = min(90, base_mins + 10)
                    days_ahead = max(4, days_ahead - 1)
                elif avg_t < 20:
                    days_ahead = min(10, days_ahead + 1)
            next_d = (datetime.utcnow() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
            suggested_mins = round(base_mins + random.random() * 10)
            factors_used = []
            if water:
                factors_used.append(f"last irrigation: {water[0].get('date', '')} ({water[0].get('durationMinutes', 0)} min)")
            if temp:
                factors_used.append(f"{len(temp)} temperature record(s)")
            factors_used.append("seasonal baseline")
            out = {
                'fieldId': field_id,
                'suggestedIrrigationMinutes': suggested_mins,
                'nextRecommendedDate': next_d,
                'factorsUsed': factors_used,
            }
            if include_ai:
                ctx = f"Next irrigation: {next_d}, {suggested_mins} minutes. {', '.join(factors_used)}."
                ai_text, model = _prediction_ai_summary(field_id, field_name, ctx)
                if ai_text:
                    out['aiSummary'] = ai_text
                    out['aiModel'] = model
            return _json_response(out)

        # --- prediction_ai_summary: standalone AI summary for field ---
        if pred_type == 'prediction_ai_summary':
            if not field_id:
                return _json_response({'error': 'fieldId required'}, 400)
            context_parts = [f"Field: {field_name}, area: {area} acres, status: {status}."]
            if water:
                context_parts.append(f"Water records: {len(water)}; last: {water[0].get('date', '')}.")
            if temp:
                context_parts.append(f"Temperature records: {len(temp)}.")
            if expenses:
                context_parts.append(f"Expenses: {len(expenses)}.")
            if incomes:
                context_parts.append(f"Incomes: {len(incomes)}.")
            ctx = " ".join(context_parts)
            ai_text, model = _prediction_ai_summary(field_id, field_name, ctx)
            if ai_text:
                return _json_response({'fieldId': field_id, 'aiSummary': ai_text, 'model': model})
            return _json_response({
                'fieldId': field_id,
                'aiSummary': 'AI summary is not available. Add GEMINI_API_KEY or OPENAI_API_KEY in backend .env for AI-powered summaries.',
                'model': 'built-in',
            })

        return _json_response({'error': 'Unknown prediction type'}, 400)
    except Exception as e:
        return _json_response({'error': str(e)}, 500)


# --- Materials (supply chain) ---

@csrf_exempt
@require_http_methods(["GET", "POST"])
def materials_list(request):
    col = get_collection('materials')
    if request.method == 'GET':
        items = list(col.find({}, {'_id': 0}))
        return _json_response(items)

    body = _parse_body(request)
    doc = {
        'id': body.get('id') or generate_id(),
        'name': body.get('name', ''),
        'category': body.get('category', 'other'),
        'unit': body.get('unit', 'kg'),
        'currentStock': body.get('currentStock', 0),
        'createdAt': body.get('createdAt', ''),
    }
    from datetime import datetime
    now = datetime.utcnow().isoformat() + 'Z'
    doc['createdAt'] = doc['createdAt'] or now
    col.insert_one(doc)
    del doc['_id']
    return _json_response(doc, 201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def materials_detail(request, pk):
    col = get_collection('materials')
    if request.method == 'GET':
        doc = col.find_one({'id': pk}, {'_id': 0})
        if not doc:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response(doc)

    if request.method == 'PUT':
        body = _parse_body(request)
        result = col.find_one_and_update(
            {'id': pk},
            {'$set': body},
            return_document=True
        )
        if not result:
            return _json_response({'error': 'Not found'}, 404)
        del result['_id']
        return _json_response(result)

    if request.method == 'DELETE':
        col.delete_one({'id': pk})
        get_collection('material_transactions').delete_many({'materialId': pk})
        return _json_response({}, 204)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def material_transactions_list(request):
    col = get_collection('material_transactions')
    if request.method == 'GET':
        date_from = request.GET.get('dateFrom')
        date_to = request.GET.get('dateTo')
        material_id = request.GET.get('materialId')
        query = {}
        if date_from or date_to:
            query['date'] = {}
            if date_from:
                query['date']['$gte'] = date_from
            if date_to:
                query['date']['$lte'] = date_to
        if material_id:
            query['materialId'] = material_id
        items = list(col.find(query, {'_id': 0}))
        return _json_response(items)

    body = _parse_body(request)
    doc = {
        'id': body.get('id') or generate_id(),
        'materialId': body.get('materialId', ''),
        'type': body.get('type', 'in'),
        'quantity': body.get('quantity', 0),
        'date': body.get('date', ''),
        'fieldId': body.get('fieldId'),
        'cost': body.get('cost'),
        'notes': body.get('notes'),
    }
    col.insert_one(doc)
    # update material stock
    mat_col = get_collection('materials')
    mat = mat_col.find_one({'id': doc['materialId']})
    if mat:
        delta = doc['quantity'] if doc['type'] == 'in' else -doc['quantity']
        mat_col.update_one({'id': doc['materialId']}, {'$inc': {'currentStock': delta}})
    del doc['_id']
    return _json_response(doc, 201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def material_transactions_detail(request, pk):
    col = get_collection('material_transactions')
    mat_col = get_collection('materials')
    if request.method == 'GET':
        doc = col.find_one({'id': pk}, {'_id': 0})
        if not doc:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response(doc)
    if request.method == 'PUT':
        body = _parse_body(request)
        old = col.find_one({'id': pk}, {'_id': 0})
        if not old:
            return _json_response({'error': 'Not found'}, 404)
        allowed = {'materialId', 'type', 'quantity', 'date', 'fieldId', 'cost', 'notes'}
        update = {k: body[k] for k in allowed if k in body}
        if not update:
            del old['_id']
            return _json_response(old)
        # reverse old stock delta, then apply new
        mid_old = old.get('materialId')
        qty_old = old.get('quantity', 0)
        type_old = old.get('type', 'in')
        if mid_old:
            delta_old = qty_old if type_old == 'in' else -qty_old
            mat_col.update_one({'id': mid_old}, {'$inc': {'currentStock': -delta_old}})
        result = col.find_one_and_update(
            {'id': pk}, {'$set': update}, return_document=True
        )
        mid_new = result.get('materialId', mid_old)
        qty_new = result.get('quantity', 0)
        type_new = result.get('type', 'in')
        if mid_new:
            delta_new = qty_new if type_new == 'in' else -qty_new
            mat_col.update_one({'id': mid_new}, {'$inc': {'currentStock': delta_new}})
        del result['_id']
        return _json_response(result)
    if request.method == 'DELETE':
        doc = col.find_one({'id': pk}, {'_id': 0})
        if not doc:
            return _json_response({'error': 'Not found'}, 404)
        mid = doc.get('materialId')
        qty = doc.get('quantity', 0)
        t = doc.get('type', 'in')
        if mid:
            add_back = qty if t == 'in' else -qty
            mat_col.update_one({'id': mid}, {'$inc': {'currentStock': -add_back}})
        col.delete_one({'id': pk})
        return _json_response({}, 204)


# --- Daily Register (day-wise, field-wise data entry) ---

@csrf_exempt
@require_http_methods(["GET", "POST"])
def daily_register_list(request):
    col = get_collection('daily_register')
    if request.method == 'GET':
        date = request.GET.get('date')
        field_id = request.GET.get('fieldId')
        query = {}
        if date:
            query['date'] = date
        if field_id:
            query['fieldId'] = field_id
        items = list(col.find(query, {'_id': 0}))
        return _json_response(items)

    body = _parse_body(request)
    from datetime import datetime
    now = datetime.utcnow().isoformat() + 'Z'
    materials_used = body.get('materialsUsed') or []
    doc = {
        'id': body.get('id') or generate_id(),
        'date': body.get('date', ''),
        'fieldId': body.get('fieldId', ''),
        'activity': body.get('activity', 'other'),
        'materialsUsed': materials_used,
        'laborCost': body.get('laborCost'),
        'waterMinutes': body.get('waterMinutes'),
        'notes': body.get('notes'),
    }
    col.insert_one(doc)
    # record material usage (out transactions) and deduct stock
    trans_col = get_collection('material_transactions')
    mat_col = get_collection('materials')
    for mu in materials_used:
        mid = mu.get('materialId')
        qty = mu.get('quantity', 0)
        if not mid or qty <= 0:
            continue
        tdoc = {
            'id': generate_id(),
            'materialId': mid,
            'type': 'out',
            'quantity': qty,
            'date': doc['date'],
            'fieldId': doc['fieldId'],
            'notes': f"Daily register: {doc.get('activity', '')}",
        }
        trans_col.insert_one(tdoc)
        mat_col.update_one({'id': mid}, {'$inc': {'currentStock': -qty}})
    del doc['_id']
    return _json_response(doc, 201)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def daily_register_detail(request, pk):
    col = get_collection('daily_register')
    if request.method == 'GET':
        doc = col.find_one({'id': pk}, {'_id': 0})
        if not doc:
            return _json_response({'error': 'Not found'}, 404)
        return _json_response(doc)
    if request.method == 'PUT':
        body = _parse_body(request)
        allowed = {'date', 'fieldId', 'activity', 'materialsUsed', 'laborCost', 'waterMinutes', 'notes'}
        update = {k: body[k] for k in allowed if k in body}
        if not update:
            doc = col.find_one({'id': pk}, {'_id': 0})
            if not doc:
                return _json_response({'error': 'Not found'}, 404)
            del doc['_id']
            return _json_response(doc)
        result = col.find_one_and_update(
            {'id': pk}, {'$set': update}, return_document=True
        )
        if not result:
            return _json_response({'error': 'Not found'}, 404)
        del result['_id']
        return _json_response(result)
    if request.method == 'DELETE':
        doc = col.find_one({'id': pk}, {'_id': 0})
        if not doc:
            return _json_response({'error': 'Not found'}, 404)
        
        # 1. Deduct/Revert stock and delete associated material transactions
        mat_used = doc.get('materialsUsed') or []
        if mat_used:
            mat_col = get_collection('materials')
            trans_col = get_collection('material_transactions')
            for mu in mat_used:
                mid = mu.get('materialId')
                qty = mu.get('quantity', 0)
                if mid and qty > 0:
                    # Revert stock (was 'out', so add back)
                    mat_col.update_one({'id': mid}, {'$inc': {'currentStock': qty}})
                    # Delete the 'out' transaction created by this register entry
                    trans_col.delete_many({
                        'materialId': mid,
                        'fieldId': doc.get('fieldId'),
                        'quantity': qty,
                        'type': 'out',
                        'date': doc.get('date'),
                        'notes': {'$regex': f"Daily register:.*"}
                    })
        
        # 2. Finally delete the register entry itself
        col.delete_one({'id': pk})
        return _json_response({}, 204)


# --- Field recommendations (today's suggested fields) ---

@csrf_exempt
@require_http_methods(["GET"])
def field_recommendations(request):
    """Suggest which fields need attention today (water, last activity, etc.)."""
    fields_col = get_collection('fields')
    water_col = get_collection('water_records')
    daily_col = get_collection('daily_register')
    fields = list(fields_col.find({}, {'_id': 0}))
    from datetime import datetime, timedelta
    today = datetime.utcnow().strftime('%Y-%m-%d')
    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d')

    recs = []
    for f in fields:
        fid = f.get('id', '')
        name = f.get('name', 'Field')
        if f.get('status') == 'not_usable':
            continue
        # Last water on this field
        last_water = list(water_col.find({'fieldId': fid}).sort('date', -1).limit(1))
        last_daily = list(daily_col.find({'fieldId': fid}).sort('date', -1).limit(1))
        last_water_date = last_water[0]['date'] if last_water else None
        last_activity_date = last_daily[0]['date'] if last_daily else None
        # Suggest irrigation if no water in 3+ days
        if last_water_date:
            try:
                dw = datetime.strptime(last_water_date, '%Y-%m-%d')
                dt = datetime.strptime(today, '%Y-%m-%d')
                if (dt - dw).days >= 3:
                    recs.append({
                        'fieldId': fid,
                        'fieldName': name,
                        'reason': 'irrigation',
                        'message': f'No irrigation since {last_water_date}. Consider watering.',
                        'priority': 'high',
                    })
            except Exception:
                pass
        else:
            recs.append({
                'fieldId': fid,
                'fieldName': name,
                'reason': 'irrigation',
                'message': 'No water record yet. Add irrigation if needed.',
                'priority': 'medium',
            })
        # Suggest activity if no daily entry in 5+ days
        if last_activity_date:
            try:
                da = datetime.strptime(last_activity_date, '%Y-%m-%d')
                dt = datetime.strptime(today, '%Y-%m-%d')
                if (dt - da).days >= 5:
                    recs.append({
                        'fieldId': fid,
                        'fieldName': name,
                        'reason': 'activity',
                        'message': f'No activity since {last_activity_date}. Log today\'s work.',
                        'priority': 'medium',
                    })
            except Exception:
                pass
    return _json_response(recs[:30])
