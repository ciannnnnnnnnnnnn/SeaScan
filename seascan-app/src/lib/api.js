// src/lib/api.js
// Every data read and write in the app goes through here, so table and
// column names live in one place. Permissions are enforced by the database
// (Row Level Security, see supabase/migrations), not by these functions.
//
// The public catalogue (species, stations, approved sightings) is read through
// the Flask API when it is configured and awake, otherwise straight from
// Supabase. Everything tied to an account goes to Supabase with the user's token.
import { supabase } from '../supabaseClient';
import { stripMetadata } from './images';
import { backendEnabled, backendGet } from './backend';

export const SIGHTING_PHOTO_BUCKET = 'sighting-photos';
export const SPECIES_PHOTO_BUCKET = 'species-photos';

// Throws a readable Error for any Supabase error.
function unwrap({ data, error }) {
  if (error) throw new Error(error.message || 'Database request failed.');
  return data;
}

// Public data: ask the Flask API first, fall back to Supabase if it is off,
// asleep or failing.
async function viaBackend(path, fromSupabase) {
  if (backendEnabled()) {
    try { return await backendGet(path); } catch { /* fall through */ }
  }
  return fromSupabase();
}

// ---------------------------------------------------------------- profiles

export async function fetchProfile(userId) {
  return unwrap(await supabase
    .from('profiles')
    .select('id, display_name, user_type, role, is_test_account')
    .eq('id', userId)
    .maybeSingle());
}

/** RBAC: the permission names the signed-in user's role holds. */
export async function fetchMyPermissions() {
  const rows = unwrap(await supabase.rpc('my_permissions'));
  return (rows || []).map((r) => (typeof r === 'string' ? r : r.my_permissions));
}

/**
 * The signed-in user's own profile settings. Only these two fields can be
 * changed by the user; role and test flag are guarded by the database.
 */
export async function updateMyProfile(userId, { displayName, userType }) {
  unwrap(await supabase.from('profiles')
    .update({ display_name: displayName?.trim() || null, user_type: userType })
    .eq('id', userId));
}

export async function changeMyPassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------- scan history

/** Save one identification result for the signed-in user (never the photo). */
export async function saveScan({ outcome, speciesLabel, confidence, gateScore, durationMs, method }) {
  unwrap(await supabase.from('scan_history').insert({
    outcome,
    species_label: speciesLabel ?? null,
    confidence: confidence == null ? null : Number(confidence.toFixed(2)),
    gate_score: gateScore == null ? null : Number(gateScore.toFixed(2)),
    duration_ms: durationMs == null ? null : Math.round(durationMs),
    method,
  }));
}

export async function fetchMyScans(limit = 200) {
  return unwrap(await supabase.from('scan_history')
    .select('id, created_at, outcome, species_label, confidence, gate_score, duration_ms, method')
    .order('created_at', { ascending: false }).limit(limit));
}

export async function deleteScan(id) {
  unwrap(await supabase.from('scan_history').delete().eq('id', id));
}

/** Deletes all of the signed-in user's scan history (RLS limits it to their rows). */
export async function clearMyScans(userId) {
  unwrap(await supabase.from('scan_history').delete().eq('user_id', userId));
}

// ----------------------------------------------------------- model settings

/** Admin-set thresholds and server switch (one row). null if not set up yet. */
export async function fetchModelSettings() {
  const { data, error } = await supabase.from('model_settings')
    .select('species_threshold, gate_threshold, server_identification, updated_at').eq('id', 1).maybeSingle();
  if (error) return null; // migration not run: the models' own settings apply
  return data;
}

export async function saveModelSettings({ speciesThreshold, gateThreshold, serverIdentification }) {
  return unwrap(await supabase.from('model_settings')
    .update({
      species_threshold: speciesThreshold,
      gate_threshold: gateThreshold,
      server_identification: serverIdentification,
    })
    .eq('id', 1).select().single());
}

// --------------------------------------------------------------- audit log

/** Admin only (RLS). Newest first; optional filters by table and action. */
export async function fetchAuditLog({ table, action, limit = 300 } = {}) {
  let query = supabase.from('audit_log').select('*').order('at', { ascending: false }).limit(limit);
  if (table) query = query.eq('table_name', table);
  if (action) query = query.eq('action', action);
  return unwrap(await query);
}

// ----------------------------------------------------------------- species

export async function fetchSpecies() {
  return viaBackend('/api/species', async () =>
    unwrap(await supabase.from('species').select('*').order('scientific_name')));
}

export async function saveSpecies(species) {
  const { id, updated_at: _u, updated_by: _b, ...fields } = species;
  if (id) return unwrap(await supabase.from('species').update(fields).eq('id', id).select().single());
  return unwrap(await supabase.from('species').insert(fields).select().single());
}

export async function deleteSpecies(id) {
  unwrap(await supabase.from('species').delete().eq('id', id));
}

export async function uploadSpeciesPhoto(file, slug) {
  const blob = await stripMetadata(file, 1600);
  const path = `${slug}-${Date.now()}.jpg`;
  unwrap(await supabase.storage.from(SPECIES_PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg' }));
  return supabase.storage.from(SPECIES_PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

// ---------------------------------------------------------------- stations

export async function fetchStations() {
  return viaBackend('/api/map/verified-stations', async () => unwrap(await supabase
    .from('stations')
    .select('id, name, latitude, longitude, sources, notes, station_species(species_id, source)')
    .order('name')));
}

export async function saveStation(station) {
  const { id, station_species: _s, updated_at: _u, updated_by: _b, ...fields } = station;
  if (id) return unwrap(await supabase.from('stations').update(fields).eq('id', id).select().single());
  return unwrap(await supabase.from('stations').insert(fields).select().single());
}

export async function deleteStation(id) {
  unwrap(await supabase.from('stations').delete().eq('id', id));
}

export async function addStationSpecies(stationId, speciesId, source) {
  unwrap(await supabase.from('station_species').insert({ station_id: stationId, species_id: speciesId, source }));
}

export async function removeStationSpecies(stationId, speciesId, source) {
  unwrap(await supabase.from('station_species').delete()
    .match({ station_id: stationId, species_id: speciesId, source }));
}

// --------------------------------------------------------------- sightings

const SIGHTING_COLUMNS =
  'id, user_id, species_id, latitude, longitude, location_source, observed_on, notes, photo_path, ' +
  'model_confidence, status, review_note, reviewed_at, created_at';

/** Approved sightings for the public map (no submitter, no photo). */
export async function fetchPublicSightings() {
  return viaBackend('/api/map/sightings', async () =>
    unwrap(await supabase.from('public_sightings').select('*')));
}

/** The signed-in user's own sightings, any status. */
export async function fetchMySightings(userId) {
  return unwrap(await supabase.from('sightings').select(SIGHTING_COLUMNS)
    .eq('user_id', userId).order('created_at', { ascending: false }));
}

/** Staff view: every sighting, optionally filtered by status. */
export async function fetchAllSightings(status) {
  let query = supabase.from('sightings').select(SIGHTING_COLUMNS).order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  return unwrap(await query);
}

/**
 * Save a sighting. The photo (optional) is re-encoded without metadata and
 * stored privately under the user's own folder.
 */
export async function submitSighting({ userId, speciesId, latitude, longitude, locationSource, observedOn, notes, photoFile, modelConfidence }) {
  let photoPath = null;
  if (photoFile) {
    const blob = await stripMetadata(photoFile);
    photoPath = `${userId}/${crypto.randomUUID()}.jpg`;
    unwrap(await supabase.storage.from(SIGHTING_PHOTO_BUCKET).upload(photoPath, blob, { contentType: 'image/jpeg' }));
  }
  try {
    unwrap(await supabase.from('sightings').insert({
      species_id: speciesId,
      latitude,
      longitude,
      location_source: locationSource,
      observed_on: observedOn,
      notes: notes?.trim() || null,
      photo_path: photoPath,
      model_confidence: modelConfidence ?? null,
    }));
  } catch (err) {
    // Don't leave an orphaned photo behind if the record itself was refused.
    if (photoPath) await supabase.storage.from(SIGHTING_PHOTO_BUCKET).remove([photoPath]);
    throw err;
  }
}

export async function reviewSighting(id, status, reviewNote) {
  unwrap(await supabase.from('sightings').update({ status, review_note: reviewNote?.trim() || null }).eq('id', id));
}

export async function deleteSighting(sighting) {
  unwrap(await supabase.from('sightings').delete().eq('id', sighting.id));
  if (sighting.photo_path) await supabase.storage.from(SIGHTING_PHOTO_BUCKET).remove([sighting.photo_path]);
}

/** Short-lived link to a private sighting photo (owner or staff only). */
export async function sightingPhotoUrl(path, seconds = 600) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(SIGHTING_PHOTO_BUCKET).createSignedUrl(path, seconds);
  return error ? null : data.signedUrl;
}

// ---------------------------------------------------------------- feedback

export async function sendFeedback({ userId, category, message, rating, page }) {
  // No .select() here: anonymous senders may write feedback but not read it,
  // and asking for the inserted row back would be refused.
  unwrap(await supabase.from('feedback').insert({
    user_id: userId ?? null,
    category,
    message: message.trim(),
    rating: rating || null,
    page: page || null,
  }));
}

export async function fetchFeedback() {
  return unwrap(await supabase.from('feedback').select('*').order('created_at', { ascending: false }));
}

export async function deleteFeedback(id) {
  unwrap(await supabase.from('feedback').delete().eq('id', id));
}

// --------------------------------------------------------------- questions

export async function fetchMyQuestions(userId) {
  return unwrap(await supabase.from('community_questions')
    .select('id, topic, question, answer, status, created_at')
    .eq('user_id', userId).order('created_at', { ascending: false }));
}

export async function askQuestion(topic, question) {
  unwrap(await supabase.from('community_questions').insert({ topic, question: question.trim() }));
}

export async function fetchAllQuestions() {
  return unwrap(await supabase.from('community_questions').select('*').order('created_at', { ascending: false }));
}

export async function answerQuestion(id, answer) {
  unwrap(await supabase.from('community_questions')
    .update({ answer: answer.trim(), status: 'Answered' }).eq('id', id));
}

/**
 * Delete a question together with its answer. Allowed (RLS) for the person
 * who asked it and for roles with `questions.delete` (admins); staff
 * deletions are recorded in the audit log.
 */
export async function deleteQuestion(id) {
  const rows = unwrap(await supabase.from('community_questions').delete().eq('id', id).select('id'));
  if (!rows?.length) throw new Error('This question could not be deleted (it may already be gone, or you lack permission).');
}

// ------------------------------------------------------------------- admin

export async function adminListUsers() {
  return unwrap(await supabase.rpc('admin_list_users'));
}

export async function adminUpdateUser(id, fields) {
  unwrap(await supabase.from('profiles').update(fields).eq('id', id));
}

/**
 * Identification results recorded by the Flask API (staff only, RLS).
 * Newest first; no photo or account is ever stored in this log.
 */
export async function fetchIdentificationLog(limit = 1000) {
  return unwrap(await supabase.from('identification_log')
    .select('id, created_at, outcome, species_label, confidence, gate_score, duration_ms, model_version, device')
    .order('created_at', { ascending: false }).limit(limit));
}

/**
 * Deletes test-account data in a window, including their photo files, and
 * the identification results logged in that window. `photosFailed` counts
 * photo files that could not be removed from storage.
 */
export async function deleteTestSessionData(from, to) {
  const rows = unwrap(await supabase.rpc('delete_test_session_data', { p_from: from, p_to: to }));
  const paths = rows.map((r) => r.photo_path).filter(Boolean);
  let photosFailed = 0;
  if (paths.length) {
    const { error } = await supabase.storage.from(SIGHTING_PHOTO_BUCKET).remove(paths);
    if (error) photosFailed = paths.length;
  }
  // The log has no account column, so everything in the window is removed.
  const logged = await supabase.from('identification_log').delete()
    .gte('created_at', from).lt('created_at', to).select('id');
  const first = rows[0] || {};
  return {
    sightings: first.deleted_sightings ?? 0,
    questions: first.deleted_questions ?? 0,
    feedback: first.deleted_feedback ?? 0,
    scans: first.deleted_scans ?? 0,
    photos: paths.length - photosFailed,
    photosFailed,
    // null = the log could not be cleared (e.g. its migration has not been run).
    identifications: logged.error ? null : logged.data.length,
  };
}

// --------------------------------------------------------------------- CSV

/** Turn rows into CSV text (RFC 4180 quoting) and download it. */
export function downloadCsv(filename, rows, columns) {
  const quote = (v) => {
    if (v === null || v === undefined) return '';
    const s = Array.isArray(v) ? v.join('; ') : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => quote(c.label)).join(',')];
  for (const row of rows) lines.push(columns.map((c) => quote(c.value(row))).join(','));
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
