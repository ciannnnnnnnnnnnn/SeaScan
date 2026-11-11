/**
 * SeaScan - photo preprocessing for the web app
 * =============================================
 * This is the JavaScript copy of what enhance_and_flip.py did to every training/validation/test photo.
 * The model was trained and tested on photos that went through this exact process, so the app MUST run
 * it before every prediction (otherwise accuracy in the browser will be lower than the reported results).
 *
 *   1. shrink so the longest side is at most MAX_SIDE
 *   2. contrast stretch   (brightness 1st-99th percentile -> full range, gain capped at MAX_GAIN)
 *   3. noise filter       (Gaussian blur, radius = DENOISE_FRAC x short side)
 *   4. sharpen            (unsharp mask, radius = SHARPEN_FRAC x short side, strength SHARPEN_PERCENT, threshold 2)
 *
 * Keep these numbers identical to the ones in enhance_and_flip.py.
 */

export const MAX_SIDE = 1024;
export const MAX_GAIN = 2.5;
export const DENOISE_FRAC = 0.0025;
export const SHARPEN_FRAC = 0.006;
export const SHARPEN_PERCENT = 80;
export const SHARPEN_THRESHOLD = 2;

function gaussianKernel(sigma) {
  const r = Math.max(1, Math.ceil(3 * sigma));
  const k = new Float32Array(2 * r + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k[i + r] = v;
    sum += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  return { k, r };
}

// Separable Gaussian blur of one channel (edges repeat the border pixel, like PIL).
function blurChannel(src, w, h, sigma) {
  if (sigma < 0.05) return Float32Array.from(src);
  const { k, r } = gaussianKernel(sigma);
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let t = -r; t <= r; t++) {
        let xx = x + t;
        if (xx < 0) xx = 0; else if (xx >= w) xx = w - 1;
        acc += src[row + xx] * k[t + r];
      }
      tmp[row + x] = acc;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let t = -r; t <= r; t++) {
        let yy = y + t;
        if (yy < 0) yy = 0; else if (yy >= h) yy = h - 1;
        acc += tmp[yy * w + x] * k[t + r];
      }
      out[y * w + x] = acc;
    }
  }
  return out;
}

function percentile(sortedArr, q) {            // same linear interpolation as numpy.percentile
  const pos = (q / 100) * (sortedArr.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, sortedArr.length - 1);
  return sortedArr[lo] + (sortedArr[hi] - sortedArr[lo]) * (pos - lo);
}

const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

/**
 * Enhance an RGBA pixel array (from canvas getImageData) in place.
 * @param {Uint8ClampedArray} rgba  pixels, 4 values per pixel
 * @param {number} w  width
 * @param {number} h  height
 */
export function enhanceRGBA(rgba, w, h) {
  const n = w * h;
  const short = Math.min(w, h);

  // 2) contrast stretch
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    y[i] = rgba[4 * i] * 0.299 + rgba[4 * i + 1] * 0.587 + rgba[4 * i + 2] * 0.114;
  }
  const sorted = Float32Array.from(y).sort();
  const lo = percentile(sorted, 1);
  const hi = percentile(sorted, 99);
  const gain = Math.min(MAX_GAIN, Math.max(1.0, 255 / Math.max(hi - lo, 1.0)));

  const ch = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) {
      ch[c][i] = Math.floor(clamp255((rgba[4 * i + c] - lo) * gain)); // stored as whole numbers, like uint8
    }
  }

  // 3) noise filter
  const denoiseSigma = DENOISE_FRAC * short;
  const den = ch.map((c) => blurChannel(c, w, h, denoiseSigma).map((v) => Math.round(v)));

  // 4) sharpen (unsharp mask)
  const sharpSigma = SHARPEN_FRAC * short;
  for (let c = 0; c < 3; c++) {
    const blurred = blurChannel(den[c], w, h, sharpSigma);
    const src = den[c];
    for (let i = 0; i < n; i++) {
      const diff = src[i] - blurred[i];
      const v = Math.abs(diff) > SHARPEN_THRESHOLD ? src[i] + (diff * SHARPEN_PERCENT) / 100 : src[i];
      rgba[4 * i + c] = clamp255(Math.round(v));
    }
  }
  for (let i = 0; i < n; i++) rgba[4 * i + 3] = 255;
  return rgba;
}

/**
 * Draw an <img>/<canvas>/<video> into `canvas` (shrunk to MAX_SIDE) and enhance it.
 * Afterwards `canvas` holds the photo exactly as the model saw it during training.
 */
export function prepareCanvas(source, canvas) {
  const sw = source.naturalWidth || source.videoWidth || source.width;
  const sh = source.naturalHeight || source.videoHeight || source.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  enhanceRGBA(data.data, w, h);
  ctx.putImageData(data, 0, 0);
  return canvas;
}
