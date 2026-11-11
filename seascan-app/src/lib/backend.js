// src/lib/backend.js
// Client for the SeaScan Flask API (app.py). Set VITE_API_URL to turn it on.
//
// The API serves the public catalogue and records identification results.
// It is hosted on a free tier that sleeps when idle, so every call here is
// allowed to fail: readers fall back to Supabase (see lib/api.js) and result
// logging is best-effort. Nothing in the app waits long for it.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const READ_TIMEOUT_MS = 2500;
const RETRY_AFTER_MS = 60000;
let skipUntil = 0;

export const backendEnabled = () => !!API_URL;

/**
 * GET a JSON resource from the API. Throws when the API is not configured,
 * slow or failing; after a failure it is skipped for a minute so pages do not
 * wait for it again and again (the failed request still wakes a sleeping API).
 */
export async function backendGet(path) {
  if (!API_URL) throw new Error('The SeaScan API is not configured.');
  if (Date.now() < skipUntil) throw new Error('The SeaScan API is not responding.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);
  try {
    // no-store: after an admin edit the next read must show the new content.
    const res = await fetch(`${API_URL}${path}`, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`The SeaScan API answered ${res.status}.`);
    return await res.json();
  } catch (err) {
    skipUntil = Date.now() + RETRY_AFTER_MS;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// A sleeping free-tier server can take close to a minute to wake up.
const IDENTIFY_TIMEOUT_MS = 90000;

/**
 * Server-side identification, for devices that cannot run the models. Sends
 * the photo to the API, which identifies it in memory and does not store it.
 * Resolves to the same fields as classifySeagrass() (without plantBox).
 */
export async function identifyOnServer(file) {
  if (!API_URL) throw new Error('The SeaScan server is not configured.');
  const form = new FormData();
  form.append('photo', file);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IDENTIFY_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${API_URL}/api/identify`, { method: 'POST', body: form, signal: controller.signal });
  } catch (err) {
    throw new Error(err.name === 'AbortError'
      ? 'The SeaScan server took too long to answer. Please try again.'
      : 'Could not reach the SeaScan server. Check your internet connection.');
  } finally {
    clearTimeout(timer);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `The SeaScan server answered ${res.status}.`);
  return body;
}

/**
 * Send one identification result to the API. Only the model's answer and the
 * time it took are sent - never the photo. Failures are ignored: logging must
 * not get in the way of showing the result. (Server-side identifications are
 * logged by the server itself.)
 */
export function logIdentification({ outcome, speciesLabel, confidence, gateScore, durationMs, modelVersion }) {
  if (!API_URL) return;
  const body = {
    outcome,
    species_label: speciesLabel ?? null,
    confidence: confidence ?? null,
    gate_score: gateScore ?? null,
    duration_ms: Math.round(durationMs),
    model_version: modelVersion,
    device: window.matchMedia?.('(pointer: coarse)').matches ? 'mobile' : 'desktop',
  };
  fetch(`${API_URL}/api/identifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}
