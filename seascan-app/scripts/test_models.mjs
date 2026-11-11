// scripts/test_models.mjs
// Runs the gate model and the species model on folders of photos, in Node,
// with the same preprocessing as the app:
//   decode -> shrink to max 1024 px -> enhanceRGBA (the real file from src/)
//   -> resizeBilinear([320,320], alignCorners=false, halfPixelCenters=true)
//   -> gate (sigmoid) -> species model only if the gate passes.
//
// Usage:  node scripts/test_models.mjs [photosDir]
//   photosDir defaults to test_photos/ and must contain seagrass/ and not_seagrass/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tf from '@tensorflow/tfjs';
import { enhanceRGBA } from '../src/components/seascanPreprocess.js';
import { loadGraphModelFromDisk, predict, decode, shrink, toInput } from './lib/photos.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PHOTOS = path.resolve(APP, process.argv[2] || 'test_photos');
const FOLDERS = ['seagrass', 'not_seagrass'];
const IMAGE_EXT = /\.(jpe?g|png)$/i;

// ---------- run

const pct = (v) => `${(v * 100).toFixed(1)}%`;

const missing = FOLDERS.filter((f) => !fs.existsSync(path.join(PHOTOS, f)));
if (missing.length) {
  console.error(`Missing photo folder(s) in ${PHOTOS}: ${missing.join(', ')}`);
  console.error('Create test_photos/seagrass and test_photos/not_seagrass and put JPG/PNG photos in them.');
  process.exit(1);
}

await tf.ready();
const gate = await loadGraphModelFromDisk(path.join(APP, 'public/models/gate_tfjs_f16'));
const species = await loadGraphModelFromDisk(path.join(APP, 'public/models/seascan_tfjs_f16'));
const GATE_T = gate.settings.confidence_threshold;
const SPECIES_T = species.settings.confidence_threshold;
console.log(`backend ${tf.getBackend()} | gate threshold ${GATE_T} | species threshold ${SPECIES_T}`);
console.log(`photos: ${PHOTOS}\n`);

const tally = Object.fromEntries(FOLDERS.map((f) => [f, { total: 0, accepted: 0, failed: 0 }]));

for (const folder of FOLDERS) {
  const files = fs.readdirSync(path.join(PHOTOS, folder)).filter((f) => IMAGE_EXT.test(f)).sort();
  for (const name of files) {
    const t = tally[folder];
    try {
      const img = shrink(decode(path.join(PHOTOS, folder, name)));
      enhanceRGBA(img.data, img.width, img.height);

      const gateInput = toInput(img, gate.settings.input_size);
      const [gateScore] = await predict(gate.model, gateInput);
      gateInput.dispose();
      const passes = gateScore >= GATE_T;
      t.total++;
      if (passes) t.accepted++;

      let speciesText = '-';
      if (passes) {
        const input = toInput(img, species.settings.input_size);
        const probs = await predict(species.model, input);
        input.dispose();
        const top = probs.indexOf(Math.max(...probs));
        const label = species.settings.class_names[top].replace(/_/g, ' ');
        speciesText = probs[top] >= SPECIES_T
          ? `${label} ${pct(probs[top])}`
          : `not sure (best ${label} ${pct(probs[top])})`;
      }
      console.log([folder, name, `gate ${gateScore.toFixed(3)}`, passes ? 'SEAGRASS' : 'NOT SEAGRASS', speciesText].join(' | '));
    } catch (err) {
      t.failed++;
      console.log([folder, name, 'ERROR', err.message].join(' | '));
    }
  }
}

const { seagrass: s, not_seagrass: n } = tally;
const share = (a, b) => (b ? `${a}/${b} (${((a / b) * 100).toFixed(1)}%)` : 'no photos');
console.log('\nSummary');
console.log(`  seagrass photos accepted by gate:     ${share(s.accepted, s.total)}`);
console.log(`  not-seagrass photos rejected by gate: ${share(n.total - n.accepted, n.total)}`);
if (s.failed || n.failed) console.log(`  unreadable files: ${s.failed + n.failed}`);
