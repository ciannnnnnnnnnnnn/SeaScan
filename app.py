import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv

# Path directly pointing to seascan-app/.env
dotenv_path = os.path.join(os.path.dirname(__file__), 'seascan-app', '.env')
load_dotenv(dotenv_path)

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase URL or Anon Key in .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# API ENDPOINTS
# ==========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to test connection."""
    return jsonify({"status": "healthy", "message": "SeaScan Flask API running"}), 200


@app.route('/api/map/verified-stations', methods=['GET'])
def get_verified_stations():
    """Fetch baseline survey stations from Supabase."""
    try:
        response = supabase.table("survey_stations").select("*").execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/map/user-sightings', methods=['GET'])
def get_user_sightings():
    """Fetch user-submitted community sightings from Supabase."""
    try:
        response = supabase.table("user_sightings").select("*").execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/map/user-sightings', methods=['POST'])
def submit_sighting():
    """Submit a new user sighting (Manual selection without CNN)."""
    try:
        data = request.get_json()
        
        new_sighting = {
            "species_id": data.get("species_id"),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "image_url": data.get("image_url"),
            "status": "unverified"
        }

        response = supabase.table("user_sightings").insert(new_sighting).execute()
        return jsonify({"message": "Sighting submitted successfully", "data": response.data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)