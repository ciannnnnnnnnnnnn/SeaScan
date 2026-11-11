# SeaScan

Seagrass identification and distribution system for Mati City (DORSU BSIT capstone).

- **Run locally:** `cd seascan-app`, `npm install`, copy `.env.example` to `.env`, `npm run dev`
- **Set up Supabase and deploy:** see [DEPLOYMENT.md](DEPLOYMENT.md)
- **Requirements status:** see [CHECKLIST.md](CHECKLIST.md)
- **Backend API (Flask):** `pip install -r requirements.txt`, `python app.py`; endpoints are listed in [DEPLOYMENT.md](DEPLOYMENT.md), step 8
- **Database:** versioned SQL in `supabase/migrations/`
- **Models:** float32 originals in `seascan-app/model-source/`; `node seascan-app/scripts/quantize_models.mjs` writes the float16 copies the app loads
- **Server-side identification:** `seascan_inference.py` + ONNX models in `server_models/` (made from `model-keras/*.keras` by `scripts/convert_models_onnx.py`); `python scripts/check_server_inference.py` checks it against the browser
- **Model evaluation:** `node seascan-app/scripts/evaluate_models.mjs` (per-species metrics and confusion matrix; needs `seascan-app/test_photos/<Species>/`)
- **Seagrass-check test:** `node seascan-app/scripts/test_models.mjs <folder>` (needs `<folder>/seagrass` and `<folder>/not_seagrass`)
