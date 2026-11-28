/**
 * SeaScan - photo quality check (before identification)
 * =====================================================
 * Catches photos the model cannot judge well, so the Scanner can give advice
 * instead of a doubtful answer:
 *   too dark    mean brightness (luma, 0-255) below MIN_BRIGHTNESS
 *   too bright  mean brightness above MAX_BRIGHTNESS (washed out)
 *   blurry      variance of the Laplacian of the luma below MIN_SHARPNESS
 *               (a standard focus measure: sharp edges give large values)
 * Measured on a copy whose longest side is QUALITY_SIDE px, so the numbers do
 * not depend on the camera's resolution.
 *
 * Limits set on the 1,009 labelled test photos (test_photos/), none of which
 * is flagged: their brightness runs from 25.9 to 239.3 and their sharpness
 * from 26.3 upwards. Blurred copies of the same photos (two box-blur passes
 * at 512 px) are caught: all of them at radius 4, about 80% at radius 2.
 * The user can always choose "Identify anyway".
 */
export const QUALITY_SIDE = 512;
export const MIN_BRIGHTNESS = 25;
export const MAX_BRIGHTNESS = 245;
export const MIN_SHARPNESS = 20;

/** Brightness and sharpness of RGBA pixels ({ data, width, height }). */
export function measureQuality({ data, width: w, height: h }) {
  const luma = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0, p = 0; p < luma.length; i += 4, p++) {
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    luma[p] = y;
    sum += y;
  }

  // 4-neighbour Laplacian over the inner pixels; its variance = sharpness.
  let n = 0, mean = 0, m2 = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const lap = luma[p - 1] + luma[p + 1] + luma[p - w] + luma[p + w] - 4 * luma[p];
      n++;
      const d = lap - mean;
      mean += d / n;
      m2 += d * (lap - mean);
    }
  }

  return {
    brightness: sum / luma.length,
    sharpness: n > 1 ? m2 / (n - 1) : 0,
  };
}

/** Which problems a measurement shows. */
export function judgeQuality({ brightness, sharpness }) {
  return {
    tooDark: brightness < MIN_BRIGHTNESS,
    tooBright: brightness > MAX_BRIGHTNESS,
    blurry: sharpness < MIN_SHARPNESS,
  };
}

/**
 * Check a photo (image URL) in the browser. Resolves to
 * { ok, tooDark, tooBright, blurry, brightness, sharpness }.
 * Never throws: if the photo cannot be measured it is treated as fine.
 */
export async function checkPhotoQuality(imageUrl) {
  try {
    const img = new Image();
    img.src = imageUrl;
    await img.decode();
    const scale = Math.min(1, QUALITY_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(3, Math.round(img.naturalWidth * scale));
    const h = Math.max(3, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    const m = measureQuality(ctx.getImageData(0, 0, w, h));
    const issues = judgeQuality(m);
    return { ok: !issues.tooDark && !issues.tooBright && !issues.blurry, ...issues, ...m };
  } catch {
    return { ok: true, tooDark: false, tooBright: false, blurry: false, brightness: null, sharpness: null };
  }
}
