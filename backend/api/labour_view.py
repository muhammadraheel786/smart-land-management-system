from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .labour_services import LabourService
from .views import _api_error, _parse_body, _json_response

@csrf_exempt
@require_http_methods(["GET"])
def labour_dashboard(request):
    try:
        stats = LabourService.get_dashboard_stats()
        return _json_response(stats)
    except Exception as e:
        return _api_error(str(e), 500)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def labour_list(request):
    if request.method == "GET":
        items = LabourService.get_labours()
        return _json_response(items)
    elif request.method == "POST":
        body = _parse_body(request)
        try:
            doc = LabourService.create_labour(body)
            return _json_response(doc, 201)
        except Exception as e:
            return _api_error(str(e), 500)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def labour_detail(request, pk):
    if request.method == "GET":
        doc = LabourService.get_labour(pk)
        if doc: return _json_response(doc)
        return _json_response({"error": "Labour not found"}, 404)
    elif request.method == "PUT":
        body = _parse_body(request)
        result = LabourService.update_labour(pk, body)
        if result: return _json_response(result)
        return _json_response({"error": "Labour not found"}, 404)
    elif request.method == "DELETE":
        if LabourService.delete_labour(pk):
            return _json_response({}, 204)
        return _json_response({"error": "Labour not found"}, 404)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def labour_transactions(request, pk):
    if request.method == "GET":
        items = LabourService.get_transactions(pk)
        return _json_response(items)
    elif request.method == "POST":
        body = _parse_body(request)
        try:
            doc = LabourService.add_transaction(pk, body)
            return _json_response(doc, 201)
        except Exception as e:
            return _api_error(str(e), 500)

@csrf_exempt
@require_http_methods(["PUT", "DELETE"])
def transaction_detail(request, tx_id):
    if request.method == "PUT":
        body = _parse_body(request)
        result = LabourService.update_transaction(tx_id, body)
        if result: return _json_response(result)
        return _json_response({"error": "Transaction not found"}, 404)
    elif request.method == "DELETE":
        if LabourService.delete_transaction(tx_id):
            return _json_response({}, 204)
        return _json_response({"error": "Transaction not found"}, 404)

@csrf_exempt
@require_http_methods(["POST"])
def undo_delete(request):
    try:
        result = LabourService.undo_last_delete()
        if result: return _json_response(result)
        return _json_response({"error": "No deleted records found"}, 404)
    except Exception as e:
        return _api_error(str(e), 500)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def labour_attendance(request, pk):
    if request.method == "GET":
        month = request.GET.get("month") # YYYY-MM
        items = LabourService.get_attendance(pk, month)
        return _json_response(items)
    elif request.method == "POST":
        body = _parse_body(request)
        try:
            doc = LabourService.mark_attendance(pk, body)
            return _json_response(doc, 201)
        except Exception as e:
            return _api_error(str(e), 500)
