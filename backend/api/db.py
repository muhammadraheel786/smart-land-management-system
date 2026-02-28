"""MongoDB connection and helpers. Production-ready: timeouts, indexes, readiness check."""
import logging
import os
import ssl
import certifi
from pymongo import MongoClient
from django.conf import settings

os.environ.setdefault("SSL_CERT_FILE", certifi.where())

logger = logging.getLogger("api.db")

_client = None
_db_ensured = False
_indexes_ensured = False

# Required collections for the app (used by readiness check)
REQUIRED_COLLECTIONS = [
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


def get_db():
    global _client
    if _client is None:
        uri = getattr(settings, "MONGO_URI", "") or ""
        if not uri:
            logger.warning("MONGO_URI is not set")
            raise ValueError("MONGO_URI is not configured")
        kwargs = {
            "connectTimeoutMS": getattr(settings, "MONGO_CONNECT_TIMEOUT_MS", 30000),
            "serverSelectionTimeoutMS": getattr(settings, "MONGO_SERVER_SELECTION_TIMEOUT_MS", 30000),
            "socketTimeoutMS": 30000,
        }
        if "mongodb+srv" in uri or "mongodb.net" in uri:
            kwargs["tls"] = True
            kwargs["tlsCAFile"] = certifi.where()
            kwargs["tlsAllowInvalidCertificates"] = True
        try:
            _client = MongoClient(uri, **kwargs)
            logger.info("MongoDB client created (uri redacted)")
        except Exception as e:
            logger.exception("MongoDB client creation failed: %s", e)
            raise
    db_name = getattr(settings, "MONGO_DB", "land_management")
    return _client[db_name]


def ensure_indexes():
    """Create production indexes for common queries. Idempotent. Skips unique if duplicates exist."""
    global _indexes_ensured
    if _indexes_ensured:
        return
    try:
        db = get_db()
        # Non-unique indexes (safe with existing duplicate ids)
        db["expenses"].create_index([("fieldId", 1), ("date", -1)])
        db["incomes"].create_index([("fieldId", 1), ("date", -1)])
        db["water_records"].create_index([("fieldId", 1), ("date", -1)])
        db["temperature_records"].create_index([("fieldId", 1), ("date", -1)])
        db["daily_register"].create_index([("date", -1), ("fieldId", 1)])
        db["material_transactions"].create_index([("materialId", 1), ("date", -1)])
        db["fields"].create_index("id")  # non-unique so existing duplicates don't break
        db["materials"].create_index("id")
        _indexes_ensured = True
        logger.debug("Indexes ensured")
    except Exception as e:
        logger.warning("ensure_indexes failed (non-fatal): %s", e)


def ensure_database():
    """Create the database and indexes on first request."""
    global _db_ensured
    if _db_ensured:
        return
    try:
        db = get_db()
        db["_bootstrap"].insert_one({"init": True})
        db["_bootstrap"].delete_many({})
        _db_ensured = True
        ensure_indexes()
        logger.debug("Database ensured")
    except Exception as e:
        logger.warning("ensure_database failed (non-fatal): %s", e)


def get_collection(name):
    ensure_database()
    return get_db()[name]


def get_database_readiness():
    """
    Production readiness: connection, required collections exist, indexes present.
    Never raises; always returns dict: ready, mongo, collections, indexes_ok, error.
    """
    result = {
        "ready": False,
        "mongo": "unknown",
        "collections": {},
        "indexes_ok": False,
        "error": None,
    }
    try:
        try:
            db = get_db()
            db.command("ping")
            result["mongo"] = "connected"
        except Exception as e:
            logger.warning("get_database_readiness: ping failed: %s", e)
            result["error"] = str(e)
            return result
        try:
            existing = set(db.list_collection_names())
            for name in REQUIRED_COLLECTIONS:
                result["collections"][name] = name in existing
            result["ready"] = True
            ensure_indexes()
            result["indexes_ok"] = _indexes_ensured
            if result["ready"]:
                result["indexes_ok"] = True
        except Exception as e:
            logger.warning("get_database_readiness: post-ping failed: %s", e)
            result["error"] = str(e)
    except Exception as e:
        logger.exception("get_database_readiness: unexpected error")
        result["error"] = str(e)
    return result


def generate_id():
    import uuid
    return str(uuid.uuid4())
