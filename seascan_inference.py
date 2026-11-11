"""
SeaScan - server-side identification
====================================
The same identification the Scanner runs in the browser, for devices that
cannot run the models themselves (no WebGL, too little memory):

  photo -> EXIF rotation -> shrink to max 1024 px -> enhance (contrast stretch,
  noise filter, sharpen) -> bilinear resize to 320 x 320 (half-pixel centres,
  raw 0-255 values) -> seagrass gate -> species model, only if the gate passes.

The enhancement is a line-by-line port of
seascan-app/src/components/seascanPreprocess.js, including where that code
stores values as 32-bit floats and how JavaScript rounds (Math.round rounds
.5 up; numpy rounds to even), so both give the same pixels. Keep the two in
step: scripts/check_server_inference.py compares them.

The models are the trained Keras models converted to ONNX
(scripts/convert_models_onnx.py) and run with ONNX Runtime, which needs far
less memory than TensorFlow. Photos are processed in memory and never stored.
"""
import io
import json
import math
import os

import numpy as np
from PIL import Image, ImageOps

# Same numbers as seascanPreprocess.js / enhance_and_flip.py.
MAX_SIDE = 1024
MAX_GAIN = 2.5
DENOISE_FRAC = 0.0025
SHARPEN_FRAC = 0.006
SHARPEN_PERCENT = 80
SHARPEN_THRESHOLD = 2

# Decoding limits for uploaded photos.
MAX_PIXELS = 40_000_000  # refuse decompression bombs
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
ALLOWED_FORMATS = {"JPEG", "PNG"}

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server_models")


class PhotoError(ValueError):
    """The upload is not a usable JPEG or PNG photo."""


# ------------------------------------------------------------ preprocessing

def _js_round(x):
    """JavaScript Math.round: halves round up (towards +infinity)."""
    return np.floor(x + 0.5)


def _gaussian_kernel(sigma):
    r = max(1, math.ceil(3 * sigma))
    values = [math.exp(-(i * i) / (2 * sigma * sigma)) for i in range(-r, r + 1)]
    total = sum(values)
    k32 = np.array(values, dtype=np.float32)  # JS stores each weight in a Float32Array
    return (k32.astype(np.float64) / total).astype(np.float32), r


def _blur(channel, sigma):
    """Separable Gaussian blur, border pixels repeated (blurChannel in the JS)."""
    if sigma < 0.05:
        return channel.astype(np.float32, copy=True)
    k, r = _gaussian_kernel(sigma)
    h, w = channel.shape
    taps = k.astype(np.float64)

    padded = np.pad(channel.astype(np.float64), ((0, 0), (r, r)), mode="edge")
    acc = np.zeros((h, w), dtype=np.float64)
    for t in range(2 * r + 1):  # same summation order as the JS loop
        acc += padded[:, t:t + w] * taps[t]
    tmp = acc.astype(np.float32)

    padded = np.pad(tmp.astype(np.float64), ((r, r), (0, 0)), mode="edge")
    acc = np.zeros((h, w), dtype=np.float64)
    for t in range(2 * r + 1):
        acc += padded[t:t + h, :] * taps[t]
    return acc.astype(np.float32)


def _percentile(sorted_values, q):
    """numpy.percentile's linear interpolation, on an already sorted array."""
    pos = (q / 100) * (len(sorted_values) - 1)
    lo = math.floor(pos)
    hi = min(lo + 1, len(sorted_values) - 1)
    a, b = float(sorted_values[lo]), float(sorted_values[hi])
    return a + (b - a) * (pos - lo)


def enhance(rgb):
    """Contrast stretch, noise filter and sharpen an RGB uint8 array (h, w, 3)."""
    h, w, _ = rgb.shape
    short = min(w, h)
    src = rgb.astype(np.float64)

    # 1) contrast stretch on brightness percentiles
    luma = (src[..., 0] * 0.299 + src[..., 1] * 0.587 + src[..., 2] * 0.114).astype(np.float32)
    ordered = np.sort(luma, axis=None)
    lo = _percentile(ordered, 1)
    hi = _percentile(ordered, 99)
    gain = min(MAX_GAIN, max(1.0, 255 / max(hi - lo, 1.0)))
    stretched = np.floor(np.clip((src - lo) * gain, 0, 255)).astype(np.float32)

    out = np.empty((h, w, 3), dtype=np.uint8)
    for c in range(3):
        # 2) noise filter
        den = _js_round(_blur(stretched[..., c], DENOISE_FRAC * short).astype(np.float64)).astype(np.float32)
        # 3) sharpen (unsharp mask)
        blurred = _blur(den, SHARPEN_FRAC * short).astype(np.float64)
        d = den.astype(np.float64)
        diff = d - blurred
        v = np.where(np.abs(diff) > SHARPEN_THRESHOLD, d + (diff * SHARPEN_PERCENT) / 100, d)
        out[..., c] = np.clip(_js_round(v), 0, 255).astype(np.uint8)
    return out


def resize_bilinear(rgb, out_h, out_w):
    """tf.image.resizeBilinear(image, [h, w], alignCorners=false, halfPixelCenters=true)."""
    in_h, in_w, _ = rgb.shape
    img = rgb.astype(np.float32)

    def axis(in_n, out_n):
        scale = in_n / out_n
        x = (np.arange(out_n, dtype=np.float64) + 0.5) * scale - 0.5
        x = np.maximum(x, 0.0)
        x0 = np.minimum(np.floor(x).astype(np.int64), in_n - 1)
        x1 = np.minimum(x0 + 1, in_n - 1)
        return x0, x1, (x - x0).astype(np.float32)

    y0, y1, fy = axis(in_h, out_h)
    x0, x1, fx = axis(in_w, out_w)
    top = img[y0][:, x0] + (img[y0][:, x1] - img[y0][:, x0]) * fx[None, :, None]
    bottom = img[y1][:, x0] + (img[y1][:, x1] - img[y1][:, x0]) * fx[None, :, None]
    return top + (bottom - top) * fy[:, None, None]


def load_photo(data):
    """Decode JPEG/PNG bytes the way a browser draws them on a canvas: RGB uint8."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.format not in ALLOWED_FORMATS:
            raise PhotoError("Only JPEG and PNG photos are supported.")
        img.load()
    except PhotoError:
        raise
    except Image.DecompressionBombError as exc:
        raise PhotoError("This photo is too large.") from exc
    except Exception as exc:  # noqa: BLE001 - any decoding failure is a bad upload
        raise PhotoError("This file could not be read as a photo.") from exc

    img = ImageOps.exif_transpose(img)  # browsers rotate by the EXIF tag too
    if img.mode in ("RGBA", "LA", "P", "PA"):
        rgba = np.asarray(img.convert("RGBA"), dtype=np.float64)
        # A canvas keeps transparent pixels as black.
        return np.floor(rgba[..., :3] * (rgba[..., 3:] / 255) + 1e-9).astype(np.uint8)
    return np.asarray(img.convert("RGB"), dtype=np.uint8)


def shrink(rgb):
    """Longest side at most MAX_SIDE, averaging source pixels (close to a browser's downscale)."""
    h, w, _ = rgb.shape
    scale = min(1.0, MAX_SIDE / max(w, h))
    if scale == 1.0:
        return rgb
    size = (max(1, math.floor(w * scale + 0.5)), max(1, math.floor(h * scale + 0.5)))
    return np.asarray(Image.fromarray(rgb).resize(size, Image.Resampling.BOX), dtype=np.uint8)


def prepare(rgb, input_size, enhanced=False):
    """Model input (1, h, w, 3) float32. `enhanced`: the photo was already enhanced."""
    if not enhanced:
        rgb = enhance(shrink(rgb))
    w, h = input_size
    return resize_bilinear(rgb, h, w)[None, ...]


# ------------------------------------------------------------------- models

class Identifier:
    """The seagrass gate and the species model, loaded once."""

    def __init__(self, models_dir=MODELS_DIR):
        import onnxruntime as ort  # imported here so the API starts without it

        with open(os.path.join(models_dir, "species_settings.json"), encoding="utf-8") as f:
            self.species_settings = json.load(f)
        with open(os.path.join(models_dir, "gate_settings.json"), encoding="utf-8") as f:
            self.gate_settings = json.load(f)
        self.class_names = self.species_settings["class_names"]
        self.input_size = tuple(self.species_settings["input_size"])

        options = ort.SessionOptions()
        options.intra_op_num_threads = int(os.getenv("INFERENCE_THREADS", "2"))
        options.enable_mem_pattern = False  # lower peak memory on a small server
        providers = ["CPUExecutionProvider"]
        self.species = ort.InferenceSession(os.path.join(models_dir, "seascan_species.onnx"), options, providers=providers)
        self.gate = ort.InferenceSession(os.path.join(models_dir, "seascan_gate.onnx"), options, providers=providers)

    @staticmethod
    def _run(session, x):
        return session.run(None, {session.get_inputs()[0].name: x})[0][0]

    def predict(self, x):
        """Gate probability (0-1) and species probabilities for one prepared input."""
        gate = float(self._run(self.gate, x)[0])
        probs = self._run(self.species, x).astype(np.float64)
        return gate, probs

    def identify(self, data, species_threshold=None, gate_threshold=None):
        """
        Identify one uploaded photo. Returns the same fields as classifySeagrass()
        in the browser (percentages 0-100). The species model runs only when the
        gate accepts the photo.
        """
        species_t = species_threshold if species_threshold is not None else self.species_settings["confidence_threshold"]
        gate_t = gate_threshold if gate_threshold is not None else self.gate_settings["confidence_threshold"]

        x = prepare(load_photo(data), self.input_size)
        gate = float(self._run(self.gate, x)[0])
        result = {
            "isSeagrass": gate >= gate_t,
            "gateScore": gate * 100,
            "gateThreshold": gate_t * 100,
            "predictions": [],
            "threshold": species_t * 100,
        }
        if result["isSeagrass"]:
            probs = self._run(self.species, x).astype(np.float64)
            order = np.argsort(-probs)
            result["predictions"] = [
                {"name": self.class_names[i].replace("_", " "), "pct": float(probs[i]) * 100} for i in order
            ]
        return result
