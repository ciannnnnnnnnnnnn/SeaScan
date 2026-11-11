// src/components/SightingForm.jsx
// One sighting form for the whole app (Scanner drawer and Community portal),
// so validation and saving behave the same everywhere.
import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Crosshair, MapPin, RefreshCw, Save, FlaskConical, ImagePlus } from 'lucide-react';
import LocationPicker from './LocationPicker';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import { submitSighting } from '../lib/api';
import { ACCEPT_ATTR, validatePhotoFiles } from '../lib/images';

// Same box the database enforces for sightings (Mati City waters).
const BOUNDS = { minLat: 6.72, maxLat: 7.08, minLng: 126.08, maxLng: 126.4 };
// Fixed point used for user testing, so participants never share where they
// really are. Saved with location_source = 'demo' so it can be filtered out.
export const DEMO_LOCATION = { lat: '6.870000', lng: '126.260000' };

const today = () => new Date().toISOString().slice(0, 10);

const MODES = [
  { id: 'gps', label: 'My GPS', icon: Crosshair },
  { id: 'map', label: 'Tap the map', icon: MapPin },
  { id: 'demo', label: 'Demo location', icon: FlaskConical },
];

export default function SightingForm({ initialSpeciesId, photoFile, modelConfidence, onSaved, accent = 'teal' }) {
  const { user } = useAuth();
  const { species } = useCatalog();

  const [speciesId, setSpeciesId] = useState(initialSpeciesId ?? '');
  const [mode, setMode] = useState('map');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [observedOn, setObservedOn] = useState(today());
  const [notes, setNotes] = useState('');
  const [includeScanPhoto, setIncludeScanPhoto] = useState(true);
  const [pickedPhoto, setPickedPhoto] = useState(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!speciesId && species.length) setSpeciesId(initialSpeciesId ?? species[0].id);
  }, [species, speciesId, initialSpeciesId]);

  const pickedPreview = useMemo(() => (pickedPhoto ? URL.createObjectURL(pickedPhoto) : null), [pickedPhoto]);
  useEffect(() => () => pickedPreview && URL.revokeObjectURL(pickedPreview), [pickedPreview]);

  const btn = accent === 'emerald'
    ? 'bg-emerald-500 hover:bg-emerald-400 focus:border-emerald-500'
    : 'bg-teal-500 hover:bg-teal-400 focus:border-teal-500';
  const field = `w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none ${accent === 'emerald' ? 'focus:border-emerald-500' : 'focus:border-teal-500'} transition-colors`;
  const label = 'block text-xs text-slate-500 mb-1.5';

  const chooseMode = (next) => {
    setError(null);
    setMode(next);
    if (next === 'demo') { setLat(DEMO_LOCATION.lat); setLng(DEMO_LOCATION.lng); return; }
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
      setError('Choose a location: use your GPS, tap the map, or pick the demo location.');
      return;
    }
    if (la < BOUNDS.minLat || la > BOUNDS.maxLat || ln < BOUNDS.minLng || ln > BOUNDS.maxLng) {
      setError('That location is outside Mati City waters. SeaScan only records sightings in Mati City.');
      return;
    }
    if (!speciesId) { setError('Choose the species.'); return; }
    if (observedOn > today()) { setError('The date cannot be in the future.'); return; }

    setSaving(true);
    try {
      await submitSighting({
        userId: user.id,
        speciesId: Number(speciesId),
        latitude: la,
        longitude: ln,
        locationSource: mode,
        observedOn,
        notes,
        photoFile: photoFile && includeScanPhoto ? photoFile : pickedPhoto,
        modelConfidence,
      });
      setNotice('Sighting submitted. It will appear on the public map once a researcher approves it.');
      setNotes('');
      setPickedPhoto(null);
      onSaved?.();
    } catch (err) {
      setError(`Could not save the sighting: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
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
        <div className="grid grid-cols-3 gap-2 mb-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => chooseMode(m.id)}
                aria-pressed={active}
                className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                  active ? 'bg-teal-500/15 border-teal-500/40 text-teal-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {m.id === 'gps' && locating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                {m.label}
              </button>
            );
          })}
        </div>

        {mode === 'demo' && (
          <p className="text-xs text-amber-300/90 mb-3">
            Demo location for user testing: a fixed point in Pujada Bay, not where you are. It is saved as a demo record.
          </p>
        )}

        <LocationPicker
          lat={lat}
          lng={lng}
          onPick={(la, ln) => { setMode('map'); setLat(la); setLng(ln); setError(null); }}
        />
        <p className="mt-2 text-xs text-slate-500 font-mono">
          {lat && lng ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)} · ${mode === 'gps' ? 'device GPS' : mode === 'demo' ? 'demo point' : 'picked on map'}` : 'No location chosen yet'}
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

      <p className="text-xs text-slate-500 leading-relaxed">
        Photos are stored privately and their hidden metadata (including any GPS tag) is removed before upload.
        Only you and the research team can see them. New sightings show as unverified until a researcher reviews them.
      </p>

      <button type="submit" disabled={saving || !species.length}
        className={`w-full py-3 rounded-xl ${btn} disabled:opacity-60 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2`}>
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Submit sighting
      </button>
    </form>
  );
}
