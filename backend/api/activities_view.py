import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .services import ActivityService
from .views import _api_error, _parse_body, _json_response

@csrf_exempt
@require_http_methods(["GET", "POST"])
def activities_list(request):
    if request.method == "GET":
        field_id = request.GET.get("field_id")
        filters = {}
        if field_id:
            filters["field_id"] = field_id
        
        items = ActivityService.get_activities(filters)
        return _json_response(items)

    elif request.method == "POST":
        body = _parse_body(request)
        try:
            doc = ActivityService.create_activity(body)
            return _json_response(doc, 201)
        except Exception as e:
            return _api_error(str(e), 500)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def activities_detail(request, pk):
    if request.method == "GET":
        items = ActivityService.get_activities({"id": pk})
        if items:
            return _json_response(items[0])
        return _json_response({"error": "Activity not found"}, 404)

    elif request.method == "PUT":
        body = _parse_body(request)
        result = ActivityService.update_activity(pk, body)
        if result:
            return _json_response(result)
        return _json_response({"error": "Activity not found"}, 404)

    elif request.method == "DELETE":
        result = ActivityService.delete_activity(pk)
        if result:
            return _json_response({}, 204)
        return _json_response({"error": "Activity not found"}, 404)
