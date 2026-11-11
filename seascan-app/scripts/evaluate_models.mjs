// scripts/evaluate_models.mjs
// Evaluates the species model on a labelled test set, per species, with the
// same metrics as the evaluation report: confusion matrix, and per species
// accuracy (one-vs-rest), precision, recall and F1, plus overall accuracy.
//
// Both versions of the model are run on the same photos so they can be
// compared directly:
//   float32  model-source/seascan_tfjs        (original, not deployed)
//   float16  public/models/seascan_tfjs_f16   (quantized, what the app loads)
// The deployed seagrass check (gate) is also run, to show how many real
// seagrass photos it would turn away in the app.
//
// Photos: one folder per species, named as in class_names.json, e.g.
//   test_photos/Halophila_minor/*.png
// If the folder contains .enhanced.json (written by enhance_and_flip.py), the
// photos were already enhanced and are used as they are, like in the offline
// evaluation. Otherwise each photo is shrunk and enhanced first, like in the
// app. --enhance / --no-enhance override this.
//
// Usage:  node scripts/evaluate_models.mjs [photosDir] [--enhance | --no-enhance]
// Output: tables on screen, and evaluation_results.json in the photos folder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-wasm';
import {
  enhanceRGBA, MAX_SIDE, MAX_GAIN, DENOISE_FRAC, SHARPEN_FRAC, SHARPEN_PERCENT,
} from '../src/components/seascanPreprocess.js';
import { loadGraphModelFromDisk, predict, decode, shrink, toInput } from './lib/photos.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const PHOTOS = path.resolve(APP, args.find((a) => !a.startsWith('--')) || 'test_photos');
const IMAGE_EXT = /\.(jpe?g|png)$/i;

const VARIANTS = [
  { name: 'float32', dir: path.join(APP, 'model-source/seascan_tfjs') },
  { name: 'float16', dir: path.join(APP, 'public/models/seascan_tfjs_f16') },
];
const GATE_DIR = path.join(APP, 'public/models/gate_tfjs_f16');

// ---------- were the photos already enhanced?

function alreadyEnhanced() {
  if (args.includes('--enhance')) return false;
  if (args.includes('--no-enhance')) return true;
  const marker = path.join(PHOTOS, '.enhanced.json');
  if (!fs.existsSync(marker)) return false;
  const m = JSON.parse(fs.readFileSync(marker, 'utf8'));
  const same = m.max_side === MAX_SIDE && m.max_gain === MAX_GAIN && m.denoise_frac === DENOISE_FRAC
    && m.sharpen_frac === SHARPEN_FRAC && m.sharpen_percent === SHARPEN_PERCENT;
  if (!same) {
    console.warn('WARNING: .enhanced.json settings differ from src/components/seascanPreprocess.js:');
    console.warn(`  photos: ${JSON.stringify(m)}`);
    console.warn('  The app enhances photos with different numbers than the test set was prepared with.\n');
  }
  return true;
}

// ---------- metrics

function metrics(matrix, classes) {
  const total = matrix.flat().reduce((a, b) => a + b, 0);
  const correct = classes.reduce((n, _, i) => n + matrix[i][i], 0);
  const perClass = classes.map((name, i) => {
    const tp = matrix[i][i];
    const fn = matrix[i].reduce((a, b) => a + b, 0) - tp;
    const fp = matrix.reduce((n, row) => n + row[i], 0) - tp;
    const tn = total - tp - fn - fp;
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    return {
      species: name, test_images: tp + fn, tp, fp, fn, tn,
      accuracy: (tp + tn) / total,
      precision,
      recall,
      f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
    };
  });
  return { total, correct, overall_accuracy: correct / total, per_class: perClass, confusion_matrix: matrix };
}

const pct = (v, d = 2) => `${(v * 100).toFixed(d)}%`;

function printReport(name, m, unsure, threshold) {
  console.log(`\n=== ${name}: overall accuracy ${pct(m.overall_accuracy)} (${m.correct} of ${m.total})`);
  console.log(`    below the ${pct(threshold, 0)} "not sure" threshold in the app: ${unsure} photo(s)\n`);
  const head = ['Species', 'Photos', 'Accuracy', 'Precision', 'Recall', 'F1'];
  const rows = m.per_class.map((r) => [r.species, String(r.test_images), pct(r.accuracy), pct(r.precision), pct(r.recall), pct(r.f1)]);
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const line = (cells) => cells.map((c, i) => (i ? c.padStart(widths[i]) : c.padEnd(widths[i]))).join('  ');
  console.log(line(head));
  rows.forEach((r) => console.log(line(r)));
  const low = m.per_class.filter((r) => Math.min(r.accuracy, r.precision, r.recall, r.f1) < 0.85).map((r) => r.species);
  console.log(low.length ? `    BELOW 85% on at least one metric: ${low.join(', ')}` : '    Every species is at least 85% on all four metrics.');
}

function printMatrix(m, classes) {
  const short = classes.map((c) => c.split('_').map((p, i) => (i ? p.slice(0, 4) : p[0])).join('.'));
  const w = Math.max(...short.map((s) => s.length), 4);
  console.log(`\n    Confusion matrix (rows = true species, columns = predicted)`);
  console.log(`${''.padEnd(w)}  ${short.map((s) => s.padStart(w)).join(' ')}`);
  m.confusion_matrix.forEach((row, i) => console.log(`${short[i].padEnd(w)}  ${row.map((v) => String(v).padStart(w)).join(' ')}`));
}

// ---------- run

if (!fs.existsSync(PHOTOS)) {
  console.error(`Photo folder not found: ${PHOTOS}`);
  process.exit(1);
}

await tf.setBackend('wasm');
await tf.ready();

const models = [];
for (const v of VARIANTS) {
  if (fs.existsSync(path.join(v.dir, 'model.json'))) models.push({ ...v, ...(await loadGraphModelFromDisk(v.dir)) });
  else console.warn(`Skipping ${v.name}: ${path.relative(APP, v.dir)} not found.`);
}
if (!models.length) { console.error('No species model found.'); process.exit(1); }
const gate = await loadGraphModelFromDisk(GATE_DIR);

const classes = models[0].settings.class_names;
const threshold = models[0].settings.confidence_threshold;
const folders = fs.readdirSync(PHOTOS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const unknown = folders.filter((f) => !classes.includes(f));
if (unknown.length) console.warn(`Ignoring folder(s) that are not model classes: ${unknown.join(', ')}`);
const missing = classes.filter((c) => !folders.includes(c));
if (missing.length) console.warn(`No photos for: ${missing.join(', ')}`);

const enhanced = alreadyEnhanced();
console.log(`Backend ${tf.getBackend()} | photos ${path.relative(APP, PHOTOS) || '.'} | ` +
  (enhanced ? 'already enhanced, used as they are' : 'shrunk and enhanced as in the app'));

const photos = classes.flatMap((label, truth) => (folders.includes(label)
  ? fs.readdirSync(path.join(PHOTOS, label)).filter((f) => IMAGE_EXT.test(f)).sort().map((f) => ({ file: path.join(PHOTOS, label, f), truth }))
  : []));

for (const m of models) {
  m.matrix = classes.map(() => classes.map(() => 0));
  m.unsure = 0;
}
const gateT = gate.settings.confidence_threshold;
let gateRejected = 0;
let disagree = 0;
let maxDiff = 0;
const failed = [];
const started = performance.now();

for (const [n, { file, truth }] of photos.entries()) {
  try {
    let img = decode(file);
    if (!enhanced) {
      img = shrink(img);
      enhanceRGBA(img.data, img.width, img.height);
    }
    const input = toInput(img, models[0].settings.input_size);
    const tops = [];
    let first = null;
    for (const m of models) {
      const probs = await predict(m.model, input);
      const top = probs.indexOf(Math.max(...probs));
      m.matrix[truth][top]++;
      if (probs[top] < threshold) m.unsure++;
      tops.push(top);
      if (first) probs.forEach((p, i) => { maxDiff = Math.max(maxDiff, Math.abs(p - first[i])); });
      else first = probs;
    }
    if (new Set(tops).size > 1) disagree++;
    const [g] = await predict(gate.model, input);
    if (g < gateT) gateRejected++;
    input.dispose();
  } catch (err) {
    failed.push(`${path.relative(PHOTOS, file)}: ${err.message}`);
  }
  if ((n + 1) % 100 === 0 || n + 1 === photos.length) {
    const s = (performance.now() - started) / 1000;
    process.stdout.write(`\r  ${n + 1}/${photos.length} photos (${s.toFixed(0)} s)`);
  }
}
console.log('');

const results = {
  date: new Date().toISOString(),
  photos: path.relative(APP, PHOTOS),
  already_enhanced: enhanced,
  backend: tf.getBackend(),
  classes,
  models: {},
};
for (const m of models) {
  const r = metrics(m.matrix, classes);
  results.models[m.name] = { dir: path.relative(APP, m.dir), ...r, below_threshold: m.unsure };
  printReport(`${m.name} (${path.relative(APP, m.dir)})`, r, m.unsure, threshold);
  printMatrix(r, classes);
}

if (models.length > 1) {
  const [a, b] = models.map((m) => results.models[m.name].overall_accuracy);
  console.log(`\n=== float32 vs float16`);
  console.log(`    photos where the two give a different top species: ${disagree} of ${photos.length - failed.length}`);
  console.log(`    largest difference in any output: ${(maxDiff * 100).toFixed(2)} percentage points`);
  console.log(`    overall accuracy change: ${((b - a) * 100 >= 0 ? '+' : '')}${((b - a) * 100).toFixed(2)} percentage points`);
  results.comparison = { different_top_species: disagree, max_output_difference: maxDiff, accuracy_change: b - a };
}

const checked = photos.length - failed.length;
console.log(`\n=== Seagrass check (gate, ${path.relative(APP, GATE_DIR)}, threshold ${pct(gateT, 0)})`);
console.log(`    seagrass test photos it would turn away in the app: ${gateRejected} of ${checked} (${pct(checked ? gateRejected / checked : 0)})`);
results.gate = { dir: path.relative(APP, GATE_DIR), threshold: gateT, rejected: gateRejected, checked };

if (failed.length) {
  console.log(`\nUnreadable photos (${failed.length}):`);
  failed.forEach((f) => console.log(`  ${f}`));
  results.unreadable = failed;
}

const out = path.join(PHOTOS, 'evaluation_results.json');
fs.writeFileSync(out, `${JSON.stringify(results, null, 2)}\n`);
console.log(`\nSaved ${path.relative(APP, out)}`);
