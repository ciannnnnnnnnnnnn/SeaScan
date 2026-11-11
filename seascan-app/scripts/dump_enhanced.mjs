// scripts/dump_enhanced.mjs
// Writes the browser's enhancement result for a list of photos, so the Python
// port (seascan_inference.py) can be compared with it pixel by pixel.
// Used by scripts/check_server_inference.py; not needed otherwise.
//
// Usage:  node scripts/dump_enhanced.mjs <list.txt> <outDir>
//   list.txt: one photo path per line. For each photo, <outDir>/<n>.rgb holds
//   the enhanced pixels (RGB, row by row) and <n>.json its width and height.
import fs from 'node:fs';
import path from 'node:path';
import { enhanceRGBA } from '../src/components/seascanPreprocess.js';
import { decode, shrink } from './lib/photos.mjs';

const [list, outDir] = process.argv.slice(2);
if (!list || !outDir) {
  console.error('Usage: node scripts/dump_enhanced.mjs <list.txt> <outDir>');
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const files = fs.readFileSync(list, 'utf8').split(/\r?\n/).filter(Boolean);
files.forEach((file, n) => {
  const img = shrink(decode(file));
  enhanceRGBA(img.data, img.width, img.height);
  const rgb = Buffer.alloc(img.width * img.height * 3);
  for (let i = 0, j = 0; i < img.data.length; i += 4, j += 3) {
    rgb[j] = img.data[i]; rgb[j + 1] = img.data[i + 1]; rgb[j + 2] = img.data[i + 2];
  }
  fs.writeFileSync(path.join(outDir, `${n}.rgb`), rgb);
  fs.writeFileSync(path.join(outDir, `${n}.json`), JSON.stringify({ file, width: img.width, height: img.height }));
});
console.log(`wrote ${files.length} enhanced photo(s) to ${outDir}`);
