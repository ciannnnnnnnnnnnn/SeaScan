"""
SeaScan - Flask backend API
===========================
The REST layer between the React web app and the Supabase database.

What it does
  - serves the public data the app shows: species profiles, verified survey
    stations and approved community sightings;
  - serves the CNN model settings (input size, class order, thresholds);
  - server-side identification service (POST /api/identify): for devices that
    cannot run the models in the browser, it applies the same preprocessing,
    seagrass gate and species model (seascan_inference.py) to an uploaded
    photo and returns the result. The photo is processed in memory and never
    stored;
  - receives each browser identification result (species, confidence, time
    taken) and stores it, so the team can monitor accuracy in use and
    response time.

Most identifications still run in the user's browser with TensorFlow.js, so
for most scans no photo is sent anywhere.

What it does not do
  - It does not handle accounts or private data. Signing in, submitting
    sightings and all admin work go from the app straight to Supabase with the
    user's own token, where Row Level Security decides what is allowed.

It uses only the public anon key, so it can never do more than an anonymous
visitor is allowed to by the database rules (supabase/migrations).

Run locally:   pip install -r requirements.txt  &&  python app.py
Environment:   SUPABASE_URL, SUPABASE_ANON_KEY (or the VITE_ names in
               seascan-app/.env), ALLOWED_ORIGINS (comma-separated), PORT,
               INFERENCE_THREADS (default 2), FLASK_DEBUG=1 only for local
               debugging.
"""
import json
import os
import re
import threading
import time
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

import seascan_inference

ROOT = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(ROOT, "seascan-app", ".env"))

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL / SUPABASE_ANON_KEY.")

REST_URL = f"{SUPABASE_URL}/rest/v1"
TIMEOUT = 10  # seconds for each database request

# The browser models are static files deployed with the web app; the API reads
# their settings so every client gets the same thresholds and class order.
MODELS_DIR = os.path.join(ROOT, "seascan-app", "public", "models")
MODEL_FOLDERS = {"species": "seascan_tfjs_f16", "gate": "gate_tfjs_f16"}

MAX_PHOTO_MB = 10
MAX_JSON_BYTES = 16 * 1024  # identification results are a few hundred bytes

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = (MAX_PHOTO_MB + 1) * 1024 * 1024  # photo + form overhead
allowed = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
CORS(app, origins=allowed, methods=["GET", "POST"], allow_headers=["Content-Type"])

db = requests.Session()
db.headers.update({"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})


# ----------------------------------------------------------------- helpers

def _select(table, **params):
    """Read rows from a table or view through Supabase's REST interface."""
    res = db.get(f"{REST_URL}/{table}", params=params, timeout=TIMEOUT)
    res.raise_for_status()
    return res.json()


def _read(fn):
    try:
        return jsonify(fn()), 200
    except requests.RequestException as exc:
        app.logger.warning("Database request failed: %s", exc)
        return jsonify({"error": "The database could not be reached. Please try again."}), 502


def _store_log(row):
    """Add one row to the identification log. Returns False if it failed."""
    try:
        res = db.post(f"{REST_URL}/identification_log", json=row, headers={"Prefer": "return=minimal"}, timeout=TIMEOUT)
        res.raise_for_status()
        return True
    except requests.RequestException as exc:
        app.logger.warning("Could not store identification result: %s", exc)
        return False


# Server identifications are logged in the background, so the user gets the
# result without waiting for the database write.
_log_writer = ThreadPoolExecutor(max_workers=1)


def _model_settings():
    models = {}
    for key, folder in MODEL_FOLDERS.items():
        try:
            with open(os.path.join(MODELS_DIR, folder, "app_settings.json"), encoding="utf-8") as f:
                models[key] = {**json.load(f), "version": folder, "path": f"/models/{folder}/model.json"}
        except (OSError, ValueError):
            models[key] = None
    return models


MODELS = _model_settings()
SPECIES_LABELS = set((MODELS.get("species") or {}).get("class_names", []))

STATION_COLUMNS = "id,name,latitude,longitude,sources,notes,station_species(species_id,source)"
SLUG = re.compile(r"^[a-z0-9-]{1,80}$")

# Simple per-address limits for the write endpoints. Kept in memory, which is
# enough for a single small instance.
RATE_WINDOW = 60  # seconds
RATE_LIMITS = {"results": 30, "identify": 10}  # requests per window
_recent = defaultdict(deque)
_recent_lock = threading.Lock()


def _too_many_requests(bucket):
    address = (request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0]).strip()
    now = time.monotonic()
    with _recent_lock:
        times = _recent[(bucket, address)]
        while times and now - times[0] > RATE_WINDOW:
            times.popleft()
        if len(times) >= RATE_LIMITS[bucket]:
            return True
        times.append(now)
        if len(_recent) > 5000:  # do not let the table grow without bound
            _recent.clear()
    return False


def _number(value, low, high):
    """value as a float within [low, high], or None when it is missing or invalid."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value) if low <= value <= high else None


# Thresholds and the on/off switch set by admins (public.model_settings),
# cached for a minute. None when the table cannot be read.
SETTINGS_TTL = 60
_settings_cache = {"at": None, "value": None}


def _admin_settings():
    at = _settings_cache["at"]
    if at is not None and time.monotonic() - at < SETTINGS_TTL:
        return _settings_cache["value"]
    value = None
    try:
        rows = _select("model_settings", select="species_threshold,gate_threshold,server_identification", id="eq.1")
        value = rows[0] if rows else None
    except requests.RequestException as exc:
        app.logger.warning("Could not read model settings: %s", exc)
    _settings_cache.update(at=time.monotonic(), value=value)
    return value


# The ONNX models load on the first identification, so the API starts quickly
# and uses little memory until the service is actually needed.
_identifier = None
_identifier_error = None
_identifier_lock = threading.Lock()


def _get_identifier():
    global _identifier, _identifier_error
    with _identifier_lock:
        if _identifier is None and _identifier_error is None:
            try:
                _identifier = seascan_inference.Identifier()
            except Exception as exc:  # noqa: BLE001 - report it, keep the API running
                _identifier_error = str(exc)
                app.logger.error("Server-side identification unavailable: %s", exc)
    return _identifier


def _server_model_files():
    return all(os.path.exists(os.path.join(seascan_inference.MODELS_DIR, f))
               for f in ("seascan_species.onnx", "seascan_gate.onnx"))


# --------------------------------------------------------------- endpoints

@app.get("/api/health")
def health_check():
    return jsonify({"status": "healthy", "message": "SeaScan Flask API running"}), 200


@app.get("/api/species")
def get_species():
    """All species profiles."""
    return _read(lambda: _select("species", select="*", order="scientific_name"))


@app.get("/api/species/<slug>")
def get_species_profile(slug):
    """One species profile, by its slug (e.g. halophila-ovalis)."""
    if not SLUG.match(slug):
        return jsonify({"error": "Unknown species."}), 404
    try:
        rows = _select("species", select="*", slug=f"eq.{slug}")
    except requests.RequestException as exc:
        app.logger.warning("Database request failed: %s", exc)
        return jsonify({"error": "The database could not be reached. Please try again."}), 502
    if not rows:
        return jsonify({"error": "Unknown species."}), 404
    return jsonify(rows[0]), 200


@app.get("/api/map/verified-stations")
def get_verified_stations():
    """Survey stations with the species recorded at each."""
    return _read(lambda: _select("stations", select=STATION_COLUMNS, order="name"))


@app.get("/api/map/sightings")
def get_public_sightings():
    """Approved community sightings, without submitter or photo."""
    return _read(lambda: _select("public_sightings", select="*"))


@app.get("/api/model")
def get_model():
    """Settings of the deployed CNN models and of the server-side service."""
    settings = _admin_settings()
    files = _server_model_files()
    return jsonify({
        "inference": "in-browser (TensorFlow.js); server-side fallback (ONNX Runtime)",
        **MODELS,
        "settings": settings,
        "server": {
            "enabled": bool(files and (settings or {}).get("server_identification", True)),
            "model_files": files,
            "loaded": _identifier is not None,
            "error": _identifier_error,
        },
    }), 200


@app.post("/api/identify")
def identify():
    """
    Server-side identification for devices that cannot run the models. Send one
    JPEG or PNG as the multipart form field "photo". The photo is processed in
    memory and not stored; only the result is logged, without the photo.
    """
    if _too_many_requests("identify"):
        return jsonify({"error": "Too many identifications. Please wait a minute."}), 429

    settings = _admin_settings() or {}
    if settings.get("server_identification") is False:
        return jsonify({"error": "Server-side identification is switched off."}), 503

    upload = request.files.get("photo")
    if upload is None:
        return jsonify({"error": 'Send the photo as the form field "photo".'}), 400
    limit = MAX_PHOTO_MB * 1024 * 1024
    data = upload.read(limit + 1)
    if len(data) > limit:
        return jsonify({"error": f"The photo is larger than {MAX_PHOTO_MB} MB."}), 413
    if not data:
        return jsonify({"error": "The photo is empty."}), 400

    identifier = _get_identifier()
    if identifier is None:
        return jsonify({"error": "Server-side identification is not available right now."}), 503

    started = time.perf_counter()
    try:
        species_t = settings.get("species_threshold")
        gate_t = settings.get("gate_threshold")
        result = identifier.identify(
            data,
            species_threshold=None if species_t is None else float(species_t),
            gate_threshold=None if gate_t is None else float(gate_t),
        )
    except seascan_inference.PhotoError as exc:
        return jsonify({"error": str(exc)}), 400
    finally:
        del data  # the photo is not kept
    duration = (time.perf_counter() - started) * 1000

    top = result["predictions"][0] if result["predictions"] else None
    if top is None:
        outcome = "not_seagrass"
    else:
        outcome = "identified" if top["pct"] >= result["threshold"] else "low_confidence"
    _log_writer.submit(_store_log, {
        "outcome": outcome,
        "species_label": None if top is None else top["name"].replace(" ", "_"),
        "confidence": None if top is None else round(top["pct"], 2),
        "gate_score": round(result["gateScore"], 2),
        "duration_ms": int(duration),
        "model_version": "seascan_species.onnx",
        "device": None,
        "method": "server",
    })
    return jsonify({**result, "plantBox": None, "method": "server", "serverMs": round(duration)}), 200


@app.post("/api/identifications")
def log_identification():
    """
    Record one identification made in the browser. No photo and nothing about
    the user is accepted or stored: only what the model answered and how long
    it took.
    """
    if _too_many_requests("results"):
        return jsonify({"error": "Too many requests. Please slow down."}), 429
    if (request.content_length or 0) > MAX_JSON_BYTES:
        return jsonify({"error": "Request too large."}), 413

    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send a JSON object."}), 400

    outcome = body.get("outcome")
    if outcome not in ("identified", "low_confidence", "not_seagrass"):
        return jsonify({"error": "outcome must be identified, low_confidence or not_seagrass."}), 400

    label = body.get("species_label")
    if outcome == "not_seagrass":
        label = None
    elif not isinstance(label, str) or (SPECIES_LABELS and label not in SPECIES_LABELS):
        return jsonify({"error": "species_label is not one of the model's classes."}), 400

    confidence = _number(body.get("confidence"), 0, 100)
    if outcome != "not_seagrass" and confidence is None:
        return jsonify({"error": "confidence must be a number from 0 to 100."}), 400

    duration = _number(body.get("duration_ms"), 0, 600000)
    if duration is None:
        return jsonify({"error": "duration_ms must be a number from 0 to 600000."}), 400

    gate_score = _number(body.get("gate_score"), 0, 100)  # missing when the gate did not load
    version = body.get("model_version")
    row = {
        "outcome": outcome,
        "species_label": label,
        "confidence": None if outcome == "not_seagrass" else round(confidence, 2),
        "gate_score": None if gate_score is None else round(gate_score, 2),
        "duration_ms": int(duration),
        "model_version": version[:60] if isinstance(version, str) else None,
        "device": body.get("device") if body.get("device") in ("mobile", "desktop") else None,
        "method": "browser",
    }
    if not _store_log(row):
        return jsonify({"error": "The result could not be stored."}), 502
    return jsonify({"status": "recorded"}), 201


# ------------------------------------------------------------------ errors

@app.errorhandler(404)
def not_found(_err):
    return jsonify({"error": "Not found."}), 404


@app.errorhandler(405)
def method_not_allowed(_err):
    return jsonify({"error": "Method not allowed."}), 405


@app.errorhandler(413)
def too_large(_err):
    return jsonify({"error": "Request too large."}), 413


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG") == "1",
    )
