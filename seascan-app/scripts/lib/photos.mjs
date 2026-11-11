// scripts/lib/photos.mjs
// Shared by the model scripts: load a tf.js graph model from disk, and turn a
// photo file into model input exactly as the browser does (EXIF rotation,
// transparent pixels on black, shrink to MAX_SIDE, bilinear resize with
// half-pixel centres, raw 0-255 values).
import fs from 'node:fs';
import path from 'node:path';
import * as tf from '@tensorflow/tfjs';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { MAX_SIDE } from '../../src/components/seascanPreprocess.js';

// ---------- models

export async function loadGraphModelFromDisk(dir) {
  const json = JSON.parse(fs.readFileSync(path.join(dir, 'model.json'), 'utf8'));
  const weightSpecs = json.weightsManifest.flatMap((group) => group.weights);
  const shards = json.weightsManifest.flatMap((group) => group.paths)
    .map((p) => fs.readFileSync(path.join(dir, p)));
  const all = Buffer.concat(shards);
  const weightData = all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength);
  const model = await tf.loadGraphModel(tf.io.fromMemory({
    modelTopology: json.modelTopology,
    format: json.format,
    generatedBy: json.generatedBy,
    convertedBy: json.convertedBy,
    signature: json.signature,
    userDefinedMetadata: json.userDefinedMetadata,
    modelInitializer: json.modelInitializer,
    weightSpecs,
    weightData,
  }));
  const settings = JSON.parse(fs.readFileSync(path.join(dir, 'app_settings.json'), 'utf8'));
  return { model, settings };
}

export async function predict(model, input) {
  const out = model.predict(input);
  const tensor = Array.isArray(out) ? out[0] : out;
  const values = Array.from(await tensor.data());
  (Array.isArray(out) ? out : [out]).forEach((t) => t.dispose());
  return values;
}

// ---------- decoding, matching what the browser hands to the canvas

// EXIF orientation (1-8). Browsers rotate phone photos by it before drawing.
function jpegOrientation(buf) {
  let i = 2;
  while (i + 4 < buf.length && buf[i] === 0xff) {
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xe1 && buf.toString('ascii', i + 4, i + 10) === 'Exif\0\0') {
      const t = i + 10;
      const le = buf.toString('ascii', t, t + 2) === 'II';
      const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
      const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
      const ifd = t + u32(t + 4);
      for (let e = 0; e < u16(ifd); e++) {
        const entry = ifd + 2 + e * 12;
        if (u16(entry) === 0x0112) return u16(entry + 8);
      }
      return 1;
    }
    if (marker === 0xda) break; // image data starts; no EXIF before it
    i += 2 + len;
  }
  return 1;
}

function orient({ data, width: w, height: h }, o) {
  if (o === 1 || o < 1 || o > 8) return { data, width: w, height: h };
  const swap = o >= 5;
  const W = swap ? h : w;
  const H = swap ? w : h;
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let X, Y;
      switch (o) {
        case 2: X = w - 1 - x; Y = y; break;
        case 3: X = w - 1 - x; Y = h - 1 - y; break;
        case 4: X = x; Y = h - 1 - y; break;
        case 5: X = y; Y = x; break;
        case 6: X = h - 1 - y; Y = x; break;
        case 7: X = h - 1 - y; Y = w - 1 - x; break;
        case 8: X = y; Y = w - 1 - x; break;
      }
      const s = (y * w + x) * 4;
      const d = (Y * W + X) * 4;
      out[d] = data[s]; out[d + 1] = data[s + 1]; out[d + 2] = data[s + 2]; out[d + 3] = data[s + 3];
    }
  }
  return { data: out, width: W, height: H };
}

export function decode(file) {
  const buf = fs.readFileSync(file);
  if (/\.png$/i.test(file)) {
    const png = PNG.sync.read(buf);
    const data = new Uint8ClampedArray(png.data);
    // A canvas stores transparent pixels as black, so match that.
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3] / 255;
      data[i] *= a; data[i + 1] *= a; data[i + 2] *= a; data[i + 3] = 255;
    }
    return { data, width: png.width, height: png.height };
  }
  const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 2048 });
  return orient({ data: new Uint8ClampedArray(img.data), width: img.width, height: img.height }, jpegOrientation(buf));
}

// Shrink so the longest side is at most MAX_SIDE, averaging the source pixels
// under each output pixel (close to the browser's high-quality downscale).
export function shrink({ data, width: w, height: h }) {
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  if (scale === 1) return { data, width: w, height: h };
  const W = Math.max(1, Math.round(w * scale));
  const H = Math.max(1, Math.round(h * scale));
  const out = new Uint8ClampedArray(W * H * 4);
  for (let Y = 0; Y < H; Y++) {
    const y0 = Math.floor((Y * h) / H), y1 = Math.max(y0 + 1, Math.floor(((Y + 1) * h) / H));
    for (let X = 0; X < W; X++) {
      const x0 = Math.floor((X * w) / W), x1 = Math.max(x0 + 1, Math.floor(((X + 1) * w) / W));
      let r = 0, g = 0, b = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const s = (y * w + x) * 4;
          r += data[s]; g += data[s + 1]; b += data[s + 2];
        }
      }
      const n = (y1 - y0) * (x1 - x0);
      const d = (Y * W + X) * 4;
      out[d] = r / n; out[d + 1] = g / n; out[d + 2] = b / n; out[d + 3] = 255;
    }
  }
  return { data: out, width: W, height: H };
}

export function toInput({ data, width, height }, [inW, inH]) {
  const rgb = new Float32Array(width * height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgb[j] = data[i]; rgb[j + 1] = data[i + 1]; rgb[j + 2] = data[i + 2];
  }
  // Raw 0-255 values: the models rescale internally. halfPixelCenters=true as in training.
  return tf.tidy(() =>
    tf.image.resizeBilinear(tf.tensor3d(rgb, [height, width, 3]), [inH, inW], false, true).expandDims(0)
  );
}
