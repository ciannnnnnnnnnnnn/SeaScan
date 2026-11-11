"""
SeaScan - check the server-side identification against the browser
===================================================================
1. Enhancement: the Python port in seascan_inference.py must give the same
   pixels as seascanPreprocess.js. Compared on PNG test photos (lossless, so
   both read identical input pixels); the JavaScript side is run with Node.
2. Models: the ONNX models in server_models/ are run on the whole labelled test
   set (seascan-app/test_photos/<Species>/), and the confusion matrix is
   compared with the browser evaluation (test_photos/evaluation_results.json,
   written by `node seascan-app/scripts/evaluate_models.mjs`).
3. End to end: a few whole photos go through Identifier.identify(), exactly as
   an upload to POST /api/identify would.

Usage (from the repository root, with requirements.txt installed and Node):
    python scripts/check_server_inference.py [--photos N]
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import seascan_inference as si  # noqa: E402

APP = os.path.join(ROOT, "seascan-app")
TEST = os.path.join(APP, "test_photos")


def test_photos():
    classes = json.load(open(os.path.join(si.MODELS_DIR, "species_settings.json"), encoding="utf-8"))["class_names"]
    photos = []
    for truth, label in enumerate(classes):
        folder = os.path.join(TEST, label)
        if os.path.isdir(folder):
            photos += [(os.path.join(folder, f), truth) for f in sorted(os.listdir(folder)) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
    return classes, photos


def check_enhancement(photos, count):
    print(f"1. Enhancement: Python port vs browser JavaScript, {count} photos")
    step = max(1, len(photos) // count)
    sample = [p for p, _ in photos[::step][:count]]
    with tempfile.TemporaryDirectory() as tmp:
        listing = os.path.join(tmp, "list.txt")
        with open(listing, "w", encoding="utf-8") as f:
            f.write("\n".join(sample))
        subprocess.run(["node", os.path.join("scripts", "dump_enhanced.mjs"), listing, os.path.join(tmp, "out")],
                       cwd=APP, check=True, capture_output=True)
        worst, differing, total = 0, 0, 0
        for n, path in enumerate(sample):
            meta = json.load(open(os.path.join(tmp, "out", f"{n}.json"), encoding="utf-8"))
            js = np.fromfile(os.path.join(tmp, "out", f"{n}.rgb"), dtype=np.uint8).reshape(meta["height"], meta["width"], 3)
            py = si.enhance(si.shrink(si.load_photo(open(path, "rb").read())))
            if py.shape != js.shape:
                print(f"   SIZE DIFFERS {os.path.basename(path)}: python {py.shape} js {js.shape}")
                worst = 255
                continue
            d = np.abs(py.astype(int) - js.astype(int))
            worst = max(worst, int(d.max()))
            differing += int((d > 0).sum())
            total += d.size
    print(f"   largest pixel difference {worst}; differing values {differing} of {total} ({differing / max(total, 1):.4%})")
    return worst <= 1


def check_models(classes, photos):
    marker = os.path.join(TEST, ".enhanced.json")
    enhanced = os.path.exists(marker)
    print(f"\n2. ONNX models on the test set ({len(photos)} photos, "
          f"{'already enhanced, used as they are' if enhanced else 'enhanced as in the app'})")
    ident = si.Identifier()
    species_t = ident.species_settings["confidence_threshold"]
    gate_t = ident.gate_settings["confidence_threshold"]
    matrix = np.zeros((len(classes), len(classes)), dtype=int)
    unsure = rejected = 0
    for path, truth in photos:
        x = si.prepare(si.load_photo(open(path, "rb").read()), ident.input_size, enhanced=enhanced)
        gate, probs = ident.predict(x)
        top = int(np.argmax(probs))
        matrix[truth, top] += 1
        unsure += probs[top] < species_t
        rejected += gate < gate_t
    correct = int(np.trace(matrix))
    print(f"   overall accuracy {correct / matrix.sum():.2%} ({correct} of {matrix.sum()}); "
          f"below {species_t:.0%}: {unsure}; rejected by the seagrass check: {rejected}")

    ok = True
    results_file = os.path.join(TEST, "evaluation_results.json")
    if os.path.exists(results_file):
        browser = json.load(open(results_file, encoding="utf-8"))["models"]
        for name, res in browser.items():
            ref = np.array(res["confusion_matrix"])
            same = np.array_equal(ref, matrix)
            changed = int(np.abs(ref - matrix).sum() // 2)
            print(f"   vs browser {name}: {'identical confusion matrix' if same else f'{changed} photo(s) classified differently'}")
            ok = ok and changed <= 2
    else:
        print("   (no evaluation_results.json to compare with: run node seascan-app/scripts/evaluate_models.mjs)")
    return ok, ident


def check_end_to_end(ident):
    print("\n3. End to end: Identifier.identify() on whole photos")
    folder = os.path.join(APP, "public", "species")
    for name in sorted(os.listdir(folder))[:4]:
        r = ident.identify(open(os.path.join(folder, name), "rb").read())
        top = r["predictions"][0] if r["predictions"] else None
        label = f"{top['name']} {top['pct']:.1f}%" if top else "-"
        print(f"   {name:<30} gate {r['gateScore']:5.1f}%  {'seagrass' if r['isSeagrass'] else 'NOT SEAGRASS':<13} {label}")
    for bad, data in (("text file", b"hello"), ("empty", b"")):
        try:
            ident.identify(data)
            print(f"   {bad}: ACCEPTED (should be refused)")
            return False
        except si.PhotoError as exc:
            print(f"   {bad}: refused ({exc})")
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--photos", type=int, default=40, help="photos for the enhancement comparison")
    args = parser.parse_args()
    classes, photos = test_photos()
    if not photos:
        sys.exit(f"No test photos in {TEST}")
    ok = check_enhancement(photos, args.photos)
    models_ok, ident = check_models(classes, photos)
    ok = check_end_to_end(ident) and ok and models_ok
    print("\nAll checks passed." if ok else "\nSOME CHECKS FAILED - see above.")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
