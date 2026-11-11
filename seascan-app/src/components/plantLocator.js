/**
 * SeaScan - find the plant in a photo
 * ===================================
 * The CNN only names a species; it does not report where the plant is, and
 * testing it on covered and cropped copies of a photo did not reliably point at
 * the plant. So the highlight comes from colour instead: mark the pixels where
 * green clearly dominates, join nearby ones, and box what is left.
 *
 * Limits: it finds green plants, not seagrass specifically, so green algae is
 * boxed too, and brown or very dim plants may get no box at all (returns null).
 */
const GRID = 96; // longest side of the working image, in cells
const MIN_GREEN = 0.02; // how far green must lead red and blue, as a share of brightness
const MIN_BRIGHTNESS = 60; // r + g + b: below this, colour is mostly sensor noise
const MIN_AREA = 0.005; // ignore regions under 0.5% of the photo
const MIN_SHARE = 0.25; // keep regions at least this share of the largest one

/**
 * Returns the plant's box as percentages of the image, { x, y, w, h }, or null.
 * `source` is a loaded <img> or a <canvas>.
 */
export function locatePlant(source) {
  const sw = source.naturalWidth || source.width;
  const sh = source.naturalHeight || source.height;
  const scale = GRID / Math.max(sw, sh);
  const W = Math.max(1, Math.round(sw * scale));
  const H = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data;

  const green = new Uint8Array(W * H);
  for (let i = 0; i < green.length; i++) {
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    const sum = r + g + b;
    if (sum >= MIN_BRIGHTNESS && (g - Math.max(r, b)) / sum > MIN_GREEN) green[i] = 1;
  }

  // Grow each green cell by one, so a leaf speckled with sand stays in one piece.
  const joined = new Uint8Array(W * H);
  forEachCell(W, H, (x, y) => {
    if (!green[y * W + x]) return;
    forEachNeighbour(W, H, x, y, (n) => { joined[n] = 1; });
  });

  // Connected regions, measured on the original green cells so the box stays tight.
  const seen = new Uint8Array(W * H);
  const regions = [];
  for (let start = 0; start < joined.length; start++) {
    if (!joined[start] || seen[start]) continue;
    const region = { area: 0, x0: W, x1: -1, y0: H, y1: -1 };
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const k = stack.pop();
      const x = k % W;
      const y = (k - x) / W;
      if (green[k]) {
        region.area++;
        region.x0 = Math.min(region.x0, x);
        region.x1 = Math.max(region.x1, x);
        region.y0 = Math.min(region.y0, y);
        region.y1 = Math.max(region.y1, y);
      }
      forEachNeighbour(W, H, x, y, (n) => {
        if (joined[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      });
    }
    regions.push(region);
  }

  const largest = Math.max(0, ...regions.map((r) => r.area));
  if (largest < W * H * MIN_AREA) return null;

  const kept = regions.filter((r) => r.area >= largest * MIN_SHARE);
  const x0 = Math.min(...kept.map((r) => r.x0));
  const x1 = Math.max(...kept.map((r) => r.x1)) + 1;
  const y0 = Math.min(...kept.map((r) => r.y0));
  const y1 = Math.max(...kept.map((r) => r.y1)) + 1;

  return {
    x: (x0 / W) * 100,
    y: (y0 / H) * 100,
    w: ((x1 - x0) / W) * 100,
    h: ((y1 - y0) / H) * 100,
  };
}

function forEachCell(W, H, fn) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) fn(x, y);
}

// The cell itself and its 8 neighbours, clipped to the grid.
function forEachNeighbour(W, H, x, y, fn) {
  for (let ny = Math.max(0, y - 1); ny <= Math.min(H - 1, y + 1); ny++) {
    for (let nx = Math.max(0, x - 1); nx <= Math.min(W - 1, x + 1); nx++) {
      fn(ny * W + nx);
    }
  }
}
