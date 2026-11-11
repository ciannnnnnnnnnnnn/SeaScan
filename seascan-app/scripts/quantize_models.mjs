// scripts/quantize_models.mjs
// Quantizes the SeaScan TensorFlow.js models from float32 to float16 weights,
// the same result as `tensorflowjs_converter --quantize_float16`: the weight
// files are half the size and TensorFlow.js expands them back to float32 when
// it loads the model.
//
//   source (float32, not deployed):  model-source/<name>/
//   output (float16, deployed):      public/models/<name>_f16/
//
// After writing, both versions are run on the same inputs and the largest
// difference in their outputs is printed. This checks that the models still
// agree; it does not replace re-running the test set
// (node scripts/test_models.mjs).
//
// Usage:  node scripts/quantize_models.mjs [photosDir]
//   photosDir: JPEG photos used for the comparison (default public/species).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tf from '@tensorflow/tfjs';
import jpeg from 'jpeg-js';
import { enhanceRGBA, MAX_SIDE } from '../src/components/seascanPreprocess.js';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = ['seascan_tfjs', 'gate_tfjs'];
const SHARD_BYTES = 4 * 1024 * 1024;
const PHOTOS = path.resolve(APP, process.argv[2] || 'public/species');

// ---------- float32 -> float16 (IEEE 754 half precision, round to nearest even)

const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer);

function toHalf(value) {
  f32[0] = value;
  const x = u32[0];
  const sign = (x >>> 16) & 0x8000;
  const mant = x & 0x7fffff;
  let exp = (x >>> 23) & 0xff;
  if (exp === 0xff) return sign | 0x7c00 | (mant ? 0x200 : 0); // inf / NaN
  exp = exp - 127 + 15;
  if (exp >= 0x1f) return sign | 0x7c00; // too large for float16
  if (exp <= 0) { // very small: stored as a subnormal, or zero
    if (exp < -10) return sign;
    const m = mant | 0x800000;
    const shift = 14 - exp;
    let half = m >>> shift;
    const rem = m & ((1 << shift) - 1);
    const mid = 1 << (shift - 1);
    if (rem > mid || (rem === mid && (half & 1))) half++;
    return sign | half;
  }
  let half = (exp << 10) | (mant >>> 13);
  const rem = mant & 0x1fff;
  if (rem > 0x1000 || (rem === 0x1000 && (half & 1))) half++;
  return sign | half;
}

// ---------- quantize one model folder

function quantize(name) {
  const src = path.join(APP, 'model-source', name);
  const out = path.join(APP, 'public/models', `${name}_f16`);
  const json = JSON.parse(fs.readFileSync(path.join(src, 'model.json'), 'utf8'));

  const specs = json.weightsManifest.flatMap((g) => g.weights);
  const data = Buffer.concat(json.weightsManifest.flatMap((g) => g.paths).map((p) => fs.readFileSync(path.join(src, p))));

  const parts = [];
  let offset = 0;
  let overflow = 0;
  for (const spec of specs) {
    if (spec.quantization) throw new Error(`${name}: already quantized (${spec.name}). Use the float32 model as the source.`);
    const count = spec.shape.reduce((a, b) => a * b, 1);
    const bytesPer = { float32: 4, int32: 4, bool: 1 }[spec.dtype];
    if (!bytesPer) throw new Error(`${name}: unsupported weight type ${spec.dtype} (${spec.name})`);
    const bytes = data.subarray(offset, offset + count * bytesPer);
    offset += count * bytesPer;

    if (spec.dtype !== 'float32') { parts.push(Buffer.from(bytes)); continue; }

    const half = Buffer.alloc(count * 2);
    for (let i = 0; i < count; i++) {
      const v = bytes.readFloatLE(i * 4);
      const h = toHalf(v);
      if (Number.isFinite(v) && (h & 0x7fff) === 0x7c00) overflow++;
      half.writeUInt16LE(h, i * 2);
    }
    parts.push(half);
    spec.quantization = { dtype: 'float16', original_dtype: 'float32' };
  }
  if (offset !== data.length) throw new Error(`${name}: weight files do not match model.json`);
  if (overflow) throw new Error(`${name}: ${overflow} weights are too large for float16; this model cannot be quantized this way.`);

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const all = Buffer.concat(parts);
  const shards = Math.ceil(all.length / SHARD_BYTES);
  const paths = [];
  for (let i = 0; i < shards; i++) {
    const file = `group1-shard${i + 1}of${shards}.bin`;
    fs.writeFileSync(path.join(out, file), all.subarray(i * SHARD_BYTES, (i + 1) * SHARD_BYTES));
    paths.push(file);
  }
  json.weightsManifest = [{ paths, weights: specs }];
  fs.writeFileSync(path.join(out, 'model.json'), JSON.stringify(json));

  const settings = JSON.parse(fs.readFileSync(path.join(src, 'app_settings.json'), 'utf8'));
  settings.weights = 'float16 (quantized from float32 by scripts/quantize_models.mjs)';
  fs.writeFileSync(path.join(out, 'app_settings.json'), `${JSON.stringify(settings, null, 2)}\n`);
  fs.copyFileSync(path.join(src, 'class_names.json'), path.join(out, 'class_names.json'));

  const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  console.log(`${name}: ${mb(data.length)} -> ${mb(all.length)} in ${shards} file(s)  ->  public/models/${name}_f16`);
  return { src, out, settings };
}

// ---------- compare float32 and float16 outputs

async function load(dir) {
  const json = JSON.parse(fs.readFileSync(path.join(dir, 'model.json'), 'utf8'));
  const all = Buffer.concat(json.weightsManifest.flatMap((g) => g.paths).map((p) => fs.readFileSync(path.join(dir, p))));
  return tf.loadGraphModel(tf.io.fromMemory({
    modelTopology: json.modelTopology,
    format: json.format,
    generatedBy: json.generatedBy,
    convertedBy: json.convertedBy,
    signature: json.signature,
    userDefinedMetadata: json.userDefinedMetadata,
    modelInitializer: json.modelInitializer,
    weightSpecs: json.weightsManifest.flatMap((g) => g.weights),
    weightData: all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength),
  }));
}

// A photo prepared as in the app: enhance, then resize to the model input.
function photoInput(file, [inW, inH]) {
  const img = jpeg.decode(fs.readFileSync(file), { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 2048 });
  if (Math.max(img.width, img.height) > MAX_SIDE) return null; // keep the comparison simple: small photos only
  const data = new Uint8ClampedArray(img.data);
  enhanceRGBA(data, img.width, img.height);
  const rgb = new Float32Array(img.width * img.height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) { rgb[j] = data[i]; rgb[j + 1] = data[i + 1]; rgb[j + 2] = data[i + 2]; }
  return tf.tidy(() => tf.image.resizeBilinear(tf.tensor3d(rgb, [img.height, img.width, 3]), [inH, inW], false, true).expandDims(0));
}

async function run(model, input) {
  const out = model.predict(input);
  const values = Array.from(await (Array.isArray(out) ? out[0] : out).data());
  (Array.isArray(out) ? out : [out]).forEach((t) => t.dispose());
  return values;
}

async function compare(name, { src, out, settings }) {
  const [a, b] = [await load(src), await load(out)];
  const [w, h] = settings.input_size;
  const inputs = [];
  if (fs.existsSync(PHOTOS)) {
    for (const f of fs.readdirSync(PHOTOS).filter((n) => /\.jpe?g$/i.test(n)).sort()) {
      const t = photoInput(path.join(PHOTOS, f), settings.input_size);
      if (t) inputs.push([f, t]);
    }
  }
  for (let i = 0; i < 3; i++) inputs.push([`random-${i + 1}`, tf.randomUniform([1, h, w, 3], 0, 255, 'float32', 7 + i)]);

  let maxDiff = 0;
  let sameTop = 0;
  const pct = (v) => `${(v * 100).toFixed(2)}%`;
  for (const [label, input] of inputs) {
    const [pa, pb] = [await run(a, input), await run(b, input)];
    input.dispose();
    pa.forEach((v, i) => { maxDiff = Math.max(maxDiff, Math.abs(v - pb[i])); });
    // One output = yes/no at the threshold; several = which class is highest.
    const top = (p) => (p.length === 1 ? Number(p[0] >= settings.confidence_threshold) : p.indexOf(Math.max(...p)));
    const [ta, tb] = [top(pa), top(pb)];
    if (ta === tb) sameTop++;
    const shown = pa.length === 1 ? 0 : ta;
    console.log(`  ${label.padEnd(32)} ${settings.class_names[pa.length === 1 ? ta : shown].padEnd(26)} float32 ${pct(pa[shown])}  float16 ${pct(pb[shown])}${ta === tb ? '' : '  <-- DIFFERENT'}`);
  }
  console.log(`${name}: same decision on ${sameTop}/${inputs.length} inputs; largest output difference ${(maxDiff * 100).toFixed(4)} percentage points`);
  return sameTop === inputs.length;
}

// ---------- run

const done = MODELS.map((name) => [name, quantize(name)]);
await tf.ready();
console.log(`\nComparing float32 and float16 (tfjs ${tf.getBackend()} backend, photos from ${path.relative(APP, PHOTOS) || '.'})`);
let ok = true;
for (const [name, info] of done) ok = (await compare(name, info)) && ok;
if (!ok) {
  console.error('\nThe quantized models disagree with the originals on some inputs. Do not deploy them without re-running the test set.');
  process.exit(1);
}
