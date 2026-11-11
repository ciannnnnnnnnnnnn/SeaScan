// src/hooks/useCatalog.js
// Species and stations, loaded once per page visit and shared by every page.
// Admin edits reach every open page through Supabase Realtime; call
// refreshCatalog() after an edit to update this page without waiting.
import { useEffect, useState } from 'react';
import { fetchSpecies, fetchStations } from '../lib/api';
import { onTableChanges } from '../lib/realtime';

let cache = null;
let inflight = null;
const listeners = new Set();
let stopRealtime = null;

function load() {
  if (!inflight) {
    inflight = Promise.all([fetchSpecies(), fetchStations()])
      .then(([species, stations]) => {
        cache = { species, stations, error: null };
        return cache;
      })
      .catch((err) => {
        cache = { species: [], stations: [], error: err.message };
        return cache;
      })
      .finally(() => {
        inflight = null;
        listeners.forEach((fn) => fn(cache));
      });
  }
  return inflight;
}

export function refreshCatalog() {
  cache = null;
  return load();
}

export function useCatalog() {
  const [state, setState] = useState(cache);

  useEffect(() => {
    listeners.add(setState);
    if (!cache) load();
    // One subscription for the whole app, kept while any page uses the catalogue.
    if (!stopRealtime) stopRealtime = onTableChanges(['species', 'stations', 'station_species'], refreshCatalog);
    return () => {
      listeners.delete(setState);
      if (!listeners.size && stopRealtime) { stopRealtime(); stopRealtime = null; }
    };
  }, []);

  const species = state?.species ?? [];
  const stations = state?.stations ?? [];
  return {
    loading: !state,
    error: state?.error ?? null,
    species,
    stations,
    speciesById: (id) => species.find((s) => s.id === id) || null,
    speciesByModelLabel: (label) =>
      species.find((s) => s.model_label === label || s.scientific_name === label) || null,
    stationsForSpecies: (id) => stations.filter((st) => st.station_species?.some((l) => l.species_id === id)),
  };
}

/** Readable text for an empty catalogue field. */
export const TO_BE_ADDED = 'To be added';
