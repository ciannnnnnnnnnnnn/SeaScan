// src/lib/seagrass3d.js
// Links SeaScan species records to the 3D seagrass library in
// public/seagrass/ (seagrass-viewer.js, species.json, models/*.glb).
//
// Matching is by scientific name, so it keeps working if an admin edits a
// species' slug. Keep this list in sync with public/seagrass/species.json.

export const SEAGRASS_BASE = '/seagrass/';

const MODEL_IDS_BY_NAME = {
  'enhalus acoroides': 'enhalus-acoroides',
  'thalassia hemprichii': 'thalassia-hemprichii',
  'cymodocea rotundata': 'cymodocea-rotundata',
  'cymodocea serrulata': 'cymodocea-serrulata',
  'oceana serrulata': 'cymodocea-serrulata', // newer name of C. serrulata (WoRMS 2021)
  'halodule pinifolia': 'halodule-pinifolia',
  'halodule uninervis': 'halodule-uninervis',
  'halophila minor': 'halophila-minor',
  'halophila ovalis': 'halophila-ovalis',
  'syringodium isoetifolium': 'syringodium-isoetifolium',
};

/** 3D model id for a scientific name, or null when the library has no model. */
export function modelIdFor(scientificName) {
  const key = String(scientificName || '').toLowerCase().trim().replace(/\s+/g, ' ');
  return MODEL_IDS_BY_NAME[key] ?? null;
}

let viewerScript = null;

/**
 * Load the <seagrass-viewer> web component once. It lives in public/, so it is
 * imported by URL at runtime rather than bundled by Vite.
 */
export function loadSeagrassViewer() {
  if (!viewerScript) {
    const url = new URL(`${SEAGRASS_BASE}seagrass-viewer.js`, window.location.origin).href;
    viewerScript = import(/* @vite-ignore */ url).catch((err) => {
      viewerScript = null; // allow a retry
      throw err;
    });
  }
  return viewerScript;
}
