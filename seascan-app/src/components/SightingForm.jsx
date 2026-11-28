// src/components/SightingForm.jsx
// One sighting form for the whole app (Scanner drawer and Community portal),
// so validation and saving behave the same everywhere.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Crosshair, MapPin, RefreshCw, Save, ImagePlus, WifiOff } from 'lucide-react';
import LocationPicker from './LocationPicker';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import { submitSighting } from '../lib/api';
import { ACCEPT_ATTR, validatePhotoFiles } from '../lib/images';
import { useOnline } from '../hooks/useOnline';

// Same box the database enforces for sightings (Mati City waters).
const BOUNDS = { minLat: 6.72, maxLat: 7.08, minLng: 126.08, maxLng: 126.4 };

const today = () => new Date().toISOString().slice(0, 10);

// A sighting that could not be sent (no connection) is kept on this device
// until it is sent, so a reload does not lose what was typed. The photo stays
// in memory only (too large to keep), so after a reload it must be added again.
const draftKey = (userId) => `seascan-unsent-sighting-${userId}`;
const readDraft = (userId) => {
  try { return JSON.parse(localStorage.getItem(draftKey(userId)) || 'null'); } catch { return null; }
};
const writeDraft = (userId, p) => {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify({
      speciesId: p.speciesId, latitude: p.latitude, longitude: p.longitude, locationSource: p.locationSource,
      observedOn: p.observedOn, notes: p.notes, sharePublicly: p.sharePublicly, hadPhoto: !!p.photoFile,
    }));
  } catch { /* storage unavailable: the sighting is still kept while the page is open */ }
};
const clearDraft = (userId) => { try { localStorage.removeItem(draftKey(userId)); } catch { /* ignore */ } };
// Errors that mean "no connection" rather than "the server said no".
const isConnectionError = (err) => !navigator.onLine || /failed to fetch|networkerror|network request failed|load failed/i.test(err?.message || '');

const MODES = [
  { id: 'gps', label: 'My GPS', icon: Crosshair },
  { id: 'map', label: 'Tap the map', icon: MapPin },
];

export default function SightingForm({ initialSpeciesId, photoFile, modelConfidence, onSaved, accent = 'teal' }) {
  const { user } = useAuth();
  const { species } = useCatalog();

  // An unsent sighting from earlier on this device, restored into the form.
  const [draft] = useState(() => (user ? readDraft(user.id) : null));
  const [speciesId, setSpeciesId] = useState(draft ? String(draft.speciesId) : (initialSpeciesId ?? ''));
  const [mode, setMode] = useState(draft?.locationSource === 'gps' ? 'gps' : 'map');
  const [lat, setLat] = useState(draft ? String(draft.latitude) : '');
  const [lng, setLng] = useState(draft ? String(draft.longitude) : '');
  const [observedOn, setObservedOn] = useState(draft?.observedOn || today());
  const [notes, setNotes] = useState(draft?.notes || '');
  const [includeScanPhoto, setIncludeScanPhoto] = useState(true);
  const [sharePublicly, setSharePublicly] = useState(!!draft?.sharePublicly);
  const [pickedPhoto, setPickedPhoto] = useState(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(draft
    ? `Your unsent sighting from earlier was restored${draft.hadPhoto ? '; add its photo again' : ''}. Check it, then press Submit sighting.`
    : null);
  // Waiting for the connection: the sighting (with its photo) is kept here.
  const pendingRef = useRef(null);
  const [waiting, setWaiting] = useState(false);
  const online = useOnline();

  useEffect(() => {
    if (!speciesId && species.length) setSpeciesId(initialSpeciesId ?? species[0].id);
  }, [species, speciesId, initialSpeciesId]);

  const pickedPreview = useMemo(() => (pickedPhoto ? URL.createObjectURL(pickedPhoto) : null), [pickedPhoto]);
  const willHavePhoto = (photoFile && includeScanPhoto) || !!pickedPhoto;
  useEffect(() => () => pickedPreview && URL.revokeObjectURL(pickedPreview), [pickedPreview]);

  const btn = accent === 'emerald'
    ? 'bg-emerald-500 hover:bg-emerald-400 focus:border-emerald-500'
    : 'bg-teal-500 hover:bg-teal-400 focus:border-teal-500';
  const field = `w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none ${accent === 'emerald' ? 'focus:border-emerald-500' : 'focus:border-teal-500'} transition-colors`;
  const label = 'block text-xs text-slate-500 mb-1.5';

  const chooseMode = (next) => {
    setError(null);
    setMode(next);
    setLat(''); setLng('');
    if (next === 'gps') readGps();
  };

  const readGps = () => {
    if (!navigator.geolocation) {
      setError('This browser cannot read GPS. Tap the map instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        setError(`Could not get your GPS position (${err.message}). Tap the map instead.`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const pickPhoto = (e) => {
    const problem = validatePhotoFiles(e.target.files);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (problem) { setError(problem); return; }
    setError(null);
    setPickedPhoto(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const la = Number(lat);
    const ln = Number(lng);
    if (lat === '' || lng === '' || Number.isNaN(la) || Number.isNaN(ln)) {
      setError('Choose a location: use your GPS or tap the map.');
      return;
    }
    if (la < BOUNDS.minLat || la > BOUNDS.maxLat || ln < BOUNDS.minLng || ln > BOUNDS.maxLng) {
      setError('That location is outside Mati City waters. SeaScan only records sightings in Mati City.');
      return;
    }
    if (!speciesId) { setError('Choose the species.'); return; }
    if (!observedOn) { setError('Choose the date you saw it.'); return; }
    if (observedOn > today()) { setError('The date cannot be in the future.'); return; }

    const payload = {
      userId: user.id,
      speciesId: Number(speciesId),
      latitude: la,
      longitude: ln,
      locationSource: mode,
      observedOn,
      notes,
      photoFile: photoFile && includeScanPhoto ? photoFile : pickedPhoto,
      modelConfidence,
      sharePublicly,
    };
    if (!navigator.onLine) keepForLater(payload);
    else send(payload);
  };

  const keepForLater = (payload) => {
    pendingRef.current = payload;
    writeDraft(user.id, payload);
    setWaiting(true);
    setNotice(null);
  };

  const send = async (payload) => {
    setSaving(true);
    setError(null);
    try {
      await submitSighting(payload);
      pendingRef.current = null;
      setWaiting(false);
      clearDraft(user.id);
      setNotice('Sighting submitted. It will appear on the public map once a researcher approves it.');
      setNotes('');
      setSharePublicly(false); // ask again for the next sighting
      setPickedPhoto(null);
      onSaved?.();
    } catch (err) {
      if (isConnectionError(err)) keepForLater(payload);
      else setError(`Could not save the sighting: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const discardPending = () => {
    pendingRef.current = null;
    clearDraft(user.id);
    setWaiting(false);
  };

  // Send a waiting sighting as soon as the connection is back.
  useEffect(() => {
    if (online && waiting && pendingRef.current && !saving) send(pendingRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, waiting]);

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {waiting && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2" role="status">
          <p className="flex items-start gap-2">
            {saving ? <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin" /> : <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>
              <span className="font-semibold">{saving ? 'Sending your sighting…' : 'No connection. Your sighting is kept, not lost.'}</span>{' '}
              It is sent automatically when you are back online; keep this page open. If the page is closed,
              the details are restored next time (add the photo again).
            </span>
          </p>
          <div className="flex gap-2 pl-6">
            <button type="button" disabled={saving} onClick={() => send(pendingRef.current)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-semibold disabled:opacity-50">Try now</button>
            <button type="button" disabled={saving} onClick={discardPending}
              className="px-3 py-1.5 rounded-lg text-amber-300/80 hover:bg-amber-500/10 font-semibold disabled:opacity-50">Discard</button>
          </div>
        </div>
      )}
      {notice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2" role="status">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      <div>
        <label className={label} htmlFor="sighting-species">Species</label>
        <select id="sighting-species" value={speciesId} onChange={(e) => setSpeciesId(e.target.value)} className={`${field} italic`} required>
          {species.map((sp) => <option key={sp.id} value={sp.id}>{sp.scientific_name}</option>)}
        </select>
      </div>

      <div>
        <span className={label}>Location</span>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => chooseMode(m.id)}
                aria-pressed={active}
                className={`min-h-11 px-1 py-2 rounded-xl text-xs font-semibold leading-tight text-center flex items-center justify-center gap-1.5 border transition-colors ${
                  active ? 'bg-teal-500/15 border-teal-500/40 text-teal-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {m.id === 'gps' && locating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                {m.label}
              </button>
            );
          })}
        </div>

        <LocationPicker
          lat={lat}
          lng={lng}
          onPick={(la, ln) => { setMode('map'); setLat(la); setLng(ln); setError(null); }}
        />
        <p className="mt-2 text-xs text-slate-500 font-mono">
          {lat && lng ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)} · ${mode === 'gps' ? 'device GPS' : 'picked on map'}` : 'No location chosen yet'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="sighting-date">Date observed</label>
          <input id="sighting-date" type="date" required max={today()} min="2000-01-01" value={observedOn}
            onChange={(e) => setObservedOn(e.target.value)} className={field} />
        </div>
        <div>
          <span className={label}>Photo <span className="normal-case font-medium text-slate-600">(optional)</span></span>
          {photoFile ? (
            <label className="flex items-center gap-2 py-2.5 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={includeScanPhoto} onChange={(e) => setIncludeScanPhoto(e.target.checked)} />
              Include the scanned photo
            </label>
          ) : (
            <label className="w-full cursor-pointer px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors">
              {pickedPreview ? <img src={pickedPreview} alt="" className="w-5 h-5 rounded object-cover" /> : <ImagePlus className="w-4 h-4" />}
              {pickedPhoto ? 'Change photo' : 'Add a photo'}
              <input type="file" accept={ACCEPT_ATTR} className="hidden" onChange={pickPhoto} />
            </label>
          )}
        </div>
      </div>

      <div>
        <label className={label} htmlFor="sighting-notes">
          Field notes <span className="normal-case font-medium text-slate-600">(optional, max 500 characters)</span>
        </label>
        <textarea id="sighting-notes" rows={3} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Water depth, substrate, tide..." className={`${field} resize-none`} />
      </div>

      {/* Opt-in: off unless the submitter chooses to share. */}
      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 cursor-pointer">
        <input type="checkbox" className="mt-0.5" checked={sharePublicly} onChange={(e) => setSharePublicly(e.target.checked)} />
        <span>
          Show my nickname{willHavePhoto ? ' and photo' : ''} with this sighting on the public map
          <span className="block text-slate-500 mt-0.5">
            {user?.displayName
              ? <>Shown as <span className="text-slate-300 font-semibold">{user.displayName}</span>. </>
              : <>You have no nickname, so it shows as &quot;Community member&quot;. Set one in My Account. </>}
            Only after a researcher approves it. Your email is never shown.
          </span>
        </span>
      </label>

      <p className="text-xs text-slate-500 leading-relaxed">
        Photos are stored privately and their hidden metadata (including any GPS tag) is removed before upload.
        Only you and the research team can see them, unless you choose to show them on the public map above.
        New sightings show as unverified until a researcher reviews them.
      </p>

      <button type="submit" disabled={saving || waiting || !species.length}
        className={`w-full py-3 rounded-xl ${btn} disabled:opacity-60 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2`}>
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Submit sighting
      </button>
    </form>
  );
}
