"""
SeaScan - convert the trained Keras models to ONNX for the Flask server
=======================================================================
Reads   model-keras/seascan_final.keras   (species model, 9 classes)
        model-keras/seascan_gate.keras    (seagrass gate, 1 sigmoid output)
        model-keras/class_names.json, model-keras/gate_settings.json
Writes  server_models/seascan_species.onnx, server_models/seascan_gate.onnx,
        server_models/species_settings.json, server_models/gate_settings.json

The server runs these with ONNX Runtime, which needs far less memory than
TensorFlow. Each converted model is checked against the Keras original on
random inputs before it is written.

Needs a separate Python 3.12 environment with TensorFlow (only for this
conversion; the server itself does not need TensorFlow):
    pip install "tensorflow==2.20.*" "keras==3.13.2" tf2onnx onnx onnxruntime
    python scripts/convert_models_onnx.py
"""
import json
import os
import shutil
import sys
import tempfile

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "model-keras")
OUT = os.path.join(ROOT, "server_models")
BROWSER_SETTINGS = os.path.join(ROOT, "seascan-app", "public", "models", "seascan_tfjs_f16", "app_settings.json")

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import keras  # noqa: E402
import onnxruntime as ort  # noqa: E402


def convert(keras_file, onnx_file):
    model = keras.models.load_model(os.path.join(SRC, keras_file), compile=False)
    shape = tuple(model.inputs[0].shape)
    print(f"{keras_file}: input {shape}, output {tuple(model.outputs[0].shape)}, Keras {keras.__version__}")

    # Raw 0-255 pixels, as the app feeds them; the model rescales internally.
    rng = np.random.default_rng(7)
    x = rng.uniform(0, 255, size=(4, *shape[1:])).astype(np.float32)
    # Keras only exports a model that has been called at least once.
    expected = np.asarray(model.predict(x, verbose=0))

    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "model.onnx")
        model.export(path, format="onnx")
        session = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
        name = session.get_inputs()[0].name
        got = np.concatenate([session.run(None, {name: x[i:i + 1]})[0] for i in range(len(x))])
        diff = float(np.max(np.abs(expected - got)))
        print(f"  Keras vs ONNX on random inputs: largest difference {diff:.2e}")
        if diff > 1e-4:
            sys.exit(f"  ONNX output differs from Keras ({diff}); not writing {onnx_file}.")
        shutil.copyfile(path, os.path.join(OUT, onnx_file))
    print(f"  wrote server_models/{onnx_file} ({os.path.getsize(os.path.join(OUT, onnx_file)) / 1e6:.1f} MB)")


def main():
    os.makedirs(OUT, exist_ok=True)

    with open(os.path.join(SRC, "class_names.json"), encoding="utf-8") as f:
        class_names = json.load(f)
    with open(BROWSER_SETTINGS, encoding="utf-8") as f:
        browser = json.load(f)
    if class_names != browser["class_names"]:
        sys.exit("class_names.json does not match the browser model's class order.")
    with open(os.path.join(SRC, "gate_settings.json"), encoding="utf-8") as f:
        gate = json.load(f)

    convert("seascan_final.keras", "seascan_species.onnx")
    convert("seascan_gate.keras", "seascan_gate.onnx")

    species_settings = {
        "input_size": browser["input_size"],
        "pixel_range": "raw 0-255 (do NOT divide by 255)",
        "confidence_threshold": browser["confidence_threshold"],
        "class_names": class_names,
    }
    gate_settings = {
        "input_size": gate["input_size"],
        "pixel_range": "raw 0-255 (do NOT divide by 255)",
        "confidence_threshold": gate["threshold"],
        "class_names": gate["class_names"],
        "test": gate.get("test"),
    }
    for name, data in (("species_settings.json", species_settings), ("gate_settings.json", gate_settings)):
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
    print("wrote server_models/species_settings.json and gate_settings.json")


if __name__ == "__main__":
    main()
