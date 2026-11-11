/**
 * SeaScan - seagrass classifier (tf.js graph models)
 * ==================================================
 * Two models, both loaded once:
 *   gate    /models/gate_tfjs_f16     one sigmoid output = probability the photo is seagrass
 *   species /models/seascan_tfjs_f16  softmax over the nine species in class_names order
 * Both are float16-quantized copies of the float32 models in model-source/
 * (made by scripts/quantize_models.mjs); tf.js expands them when loading.
 *
 * Every photo goes through the pipeline both models were trained on
 * (see seascanPreprocess.js):
 *   photo -> prepareCanvas (shrink to max 1024 px, contrast stretch, denoise, sharpen)
 *         -> resize to input_size with halfPixelCenters, raw 0-255 values
 *            (NO division by 255) -> gate -> species model only if the gate passes.
 * If the gate cannot be loaded the species model runs alone and the result says so
 * (gateScore = null), so the page can warn that non-seagrass photos are not filtered.
 *
 * tf.js comes from the CDN <script> tag in index.html (window.tf).
 *
 * Devices that cannot run the models (no WebGL/WebGPU, so tf.js would fall back
 * to its very slow CPU backend; or loading/running fails, e.g. out of memory)
 * send the photo to the Flask server-side identification service instead, which
 * runs the same preprocessing and models (seascan_inference.py). identifyPhoto()
 * makes that choice; both paths return the same result shape.
 */
import { prepareCanvas } from "./seascanPreprocess";
import { locatePlant } from "./plantLocator";
import { backendEnabled, identifyOnServer } from "../lib/backend";

const SPECIES_DIR = "/models/seascan_tfjs_f16";
const GATE_DIR = "/models/gate_tfjs_f16";

/** Folder name of the deployed species model, recorded with each logged result. */
export const MODEL_VERSION = SPECIES_DIR.split("/").pop();

// Fallbacks, used only if app_settings.json cannot be read. Order = class_names.json.
const SPECIES_DEFAULTS = {
  input_size: [320, 320],
  confidence_threshold: 0.7,
  class_names: [
    "Cymodocea_rotundata",
    "Cymodocea_serrulata",
    "Enhalus_acoroides",
    "Halodule_pinifolia",
    "Halodule_uninervis",
    "Halophila_minor",
    "Halophila_ovalis",
    "Syringodium_isoetifolium",
    "Thalassia_hemprichii",
  ],
};

const GATE_DEFAULTS = {
  input_size: [320, 320],
  confidence_threshold: 0.87,
  class_names: ["not_seagrass", "seagrass"],
};

let loadPromise = null;
let capablePromise = null;

/** Backends fast enough to identify a photo in the browser. */
const FAST_BACKENDS = ["webgl", "webgpu"];

/**
 * True when this browser can run the models at a usable speed. Resolves once;
 * tf.ready() picks the best backend the device supports.
 */
export function browserCanIdentify() {
  if (!capablePromise) {
    capablePromise = (async () => {
      if (!window.tf) return false;
      try {
        await window.tf.ready();
        return FAST_BACKENDS.includes(window.tf.getBackend());
      } catch {
        return false;
      }
    })();
  }
  return capablePromise;
}

/** The server-side identification service can be used (configured, not switched off). */
export const serverAvailable = (settings) => backendEnabled() && settings?.server_identification !== false;

/** Load both models once; later calls share the same promise. */
export function loadSeagrassModel() {
  if (!loadPromise) {
    loadPromise = loadAll().catch((err) => {
      loadPromise = null; // allow a retry after a failure
      throw err;
    });
  }
  return loadPromise;
}

async function loadAll() {
  if (!window.tf) {
    throw new Error("TensorFlow.js did not load. Check the <script> tag in index.html and your internet connection.");
  }

  const [species, gate] = await Promise.all([
    loadModel(SPECIES_DIR, SPECIES_DEFAULTS),
    loadModel(GATE_DIR, GATE_DEFAULTS).catch((err) => {
      console.warn("SeaScan: gate model not loaded, running the species model alone.", err);
      return null;
    }),
  ]);

  return { species, gate };
}

async function loadModel(dir, defaults) {
  const tf = window.tf;

  let settings = defaults;
  try {
    const res = await fetch(`${dir}/app_settings.json`);
    if (res.ok) {
      const j = await res.json();
      settings = {
        input_size: j.input_size || defaults.input_size,
        confidence_threshold: j.confidence_threshold || defaults.confidence_threshold,
        class_names: j.class_names || defaults.class_names,
      };
    }
  } catch { /* keep the defaults */ }

  const model = await tf.loadGraphModel(`${dir}/model.json`);

  // Warm-up run: compiles the GPU programs so the first real photo is not slow.
  const [w, h] = settings.input_size;
  tf.tidy(() => {
    const out = model.predict(tf.zeros([1, h, w, 3]));
    (Array.isArray(out) ? out[0] : out).dataSync();
  });

  return { model, settings };
}

async function predict(model, input) {
  const out = model.predict(input);
  const values = Array.from(await (Array.isArray(out) ? out[0] : out).data());
  (Array.isArray(out) ? out : [out]).forEach((t) => t.dispose());
  return values;
}

/**
 * Classify a photo (any image URL, e.g. from URL.createObjectURL).
 * Resolves to {
 *   isSeagrass,      false when the gate rejected the photo (species model skipped)
 *   gateScore,       gate probability of seagrass in %, or null if the gate is not loaded
 *   gateThreshold,   in %
 *   predictions,     [{ name, pct }] sorted high to low; empty when rejected
 *   threshold,       species "not sure" threshold in %
 *   plantBox,        the plant's position in the photo (see plantLocator.js) or null
 * }
 * `thresholds` (0-1) override the models' own: { species, gate } from the admin settings.
 */
export async function classifySeagrass(imageUrl, thresholds = {}) {
  const { species, gate } = await loadSeagrassModel();
  const tf = window.tf;

  const img = new Image();
  img.src = imageUrl;
  await img.decode();

  const canvas = prepareCanvas(img, document.createElement("canvas"));
  const pixels = tf.browser.fromPixels(canvas).cast("float32");

  // One resized tensor per input size, so both models share it when the sizes
  // match (they are both 320x320). halfPixelCenters=true matches training.
  const inputs = new Map();
  const inputFor = ([w, h]) => {
    const key = `${w}x${h}`;
    if (!inputs.has(key)) {
      inputs.set(key, tf.tidy(() => tf.image.resizeBilinear(pixels, [h, w], false, true).expandDims(0)));
    }
    return inputs.get(key);
  };

  const gateT = thresholds.gate ?? (gate ? gate.settings.confidence_threshold : GATE_DEFAULTS.confidence_threshold);
  const speciesT = thresholds.species ?? species.settings.confidence_threshold;
  const result = {
    isSeagrass: true,
    gateScore: null,
    gateThreshold: gateT * 100,
    predictions: [],
    threshold: speciesT * 100,
    plantBox: null,
  };

  try {
    if (gate) {
      const [score] = await predict(gate.model, inputFor(gate.settings.input_size));
      result.gateScore = score * 100;
      result.isSeagrass = score >= gateT;
    }

    if (result.isSeagrass) {
      const probs = await predict(species.model, inputFor(species.settings.input_size));
      result.predictions = probs
        .map((p, i) => ({ name: species.settings.class_names[i].replace(/_/g, " "), pct: p * 100 }))
        .sort((a, b) => b.pct - a.pct);
      result.plantBox = locatePlant(img);
    }
  } finally {
    pixels.dispose();
    inputs.forEach((t) => t.dispose());
  }

  return result;
}

/**
 * Identify one photo, in the browser when the device can, otherwise with the
 * server-side identification service. `settings` is the admin model settings
 * row (thresholds, server switch) or null. Resolves to classifySeagrass()'s
 * result plus method: "browser" | "server".
 */
export async function identifyPhoto({ url, file, settings }) {
  const thresholds = {
    species: settings?.species_threshold != null ? Number(settings.species_threshold) : undefined,
    gate: settings?.gate_threshold != null ? Number(settings.gate_threshold) : undefined,
  };

  let browserError = null;
  if (await browserCanIdentify()) {
    try {
      return { ...(await classifySeagrass(url, thresholds)), method: "browser" };
    } catch (err) {
      browserError = err; // e.g. out of GPU memory: try the server below
      console.warn("SeaScan: in-browser identification failed, trying the server.", err);
    }
  }

  if (!serverAvailable(settings)) {
    throw browserError || new Error("This device cannot run the identification model, and the SeaScan server is not available.");
  }
  const result = await identifyOnServer(file);
  // The highlight box is found by colour on this device; it does not need the models.
  const img = new Image();
  img.src = url;
  await img.decode();
  return { ...result, plantBox: result.isSeagrass ? locatePlant(img) : null, method: "server" };
}
