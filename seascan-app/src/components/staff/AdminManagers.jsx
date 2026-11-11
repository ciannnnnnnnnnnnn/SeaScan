// src/components/staff/AdminManagers.jsx
// Admin-only tools: survey stations, users and roles, test-session clean-up.
import React, { useCallback, useEffect, useState } from 'react';
import { MapPin, Plus, Save, Trash2, Users, Eraser, X } from 'lucide-react';
import {
  saveStation, deleteStation, addStationSpecies, removeStationSpecies,
  adminListUsers, adminUpdateUser, deleteTestSessionData,
} from '../../lib/api';
import { useCatalog, refreshCatalog } from '../../hooks/useCatalog';
import { useAuth } from '../../context/AuthContext';
import { Panel, Alert, inputClass, labelClass, buttonClass } from './PortalShell';

// ------------------------------------------------------------------ stations

export function StationsManager() {
  const { stations, species, speciesById } = useCatalog();
  const [form, setForm] = useState(null);
  const [link, setLink] = useState({ speciesId: '', source: '' });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const current = form?.id ? stations.find((s) => s.id === form.id) : null;

  const select = (st) => {
    setError(null);
    setNotice(null);
    setForm(st
      ? { id: st.id, name: st.name, latitude: st.latitude ?? '', longitude: st.longitude ?? '', sourcesText: st.sources.join('\n'), notes: st.notes || '' }
      : { name: '', latitude: '', longitude: '', sourcesText: '', notes: '' });
    setLink({ speciesId: '', source: st?.sources?.[0] || '' });
  };

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    const hasLat = form.latitude !== '' && form.latitude !== null;
    const hasLng = form.longitude !== '' && form.longitude !== null;
    if (hasLat !== hasLng) { setError('Enter both latitude and longitude, or leave both empty.'); return; }
    try {
      const saved = await saveStation({
        id: form.id,
        name: form.name.trim(),
        latitude: hasLat ? Number(form.latitude) : null,
        longitude: hasLng ? Number(form.longitude) : null,
        sources: form.sourcesText.split('\n').map((s) => s.trim()).filter(Boolean),
        notes: form.notes.trim() || null,
      });
      await refreshCatalog();
      setForm((f) => ({ ...f, id: saved.id }));
      setNotice('Station saved.');
    } catch (err) { setError(err.message); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete station ${form.name}?`)) return;
    try { await deleteStation(form.id); await refreshCatalog(); setForm(null); } catch (err) { setError(err.message); }
  };

  const addLink = async () => {
    if (!link.speciesId || !link.source.trim()) { setError('Choose a species and type its source.'); return; }
    try { await addStationSpecies(form.id, Number(link.speciesId), link.source.trim()); await refreshCatalog(); setError(null); }
    catch (err) { setError(err.message); }
  };

  const dropLink = async (l) => {
    try { await removeStationSpecies(form.id, l.species_id, l.source); await refreshCatalog(); }
    catch (err) { setError(err.message); }
  };

  return (
    <Panel icon={MapPin} title="Survey stations" description="Verified stations from the published surveys. Enter coordinates exactly as given in the papers."
      actions={<button onClick={() => select(null)} className={`${buttonClass} bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5`}><Plus className="w-3.5 h-3.5" /> New station</button>}>
      <div className="grid lg:grid-cols-3 gap-6">
        <ul className="space-y-1.5">
          {stations.map((st) => (
            <li key={st.id}>
              <button onClick={() => select(st)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  form?.id === st.id ? 'border-teal-500/50 bg-teal-500/10 text-white' : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'}`}>
                <span className="font-semibold">{st.name}</span>
                <span className="block text-xs text-slate-500">
                  {st.latitude === null ? 'no coordinates' : `${st.latitude}, ${st.longitude}`} · {st.station_species.length} species
                </span>
              </button>
            </li>
          ))}
        </ul>

        {form && (
          <div className="lg:col-span-2 space-y-5">
            <form onSubmit={save} className="space-y-3">
              <Alert>{error}</Alert>
              <Alert kind="success">{notice}</Alert>
              <div>
                <label className={labelClass}>Station name *</label>
                <input className={inputClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Latitude (6.72 - 7.08)</label>
                  <input type="number" step="any" min="6.72" max="7.08" className={`${inputClass} font-mono`} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Longitude (126.08 - 126.40)</label>
                  <input type="number" step="any" min="126.08" max="126.40" className={`${inputClass} font-mono`} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Sources (one per line)</label>
                <textarea rows={2} className={inputClass} value={form.sourcesText} onChange={(e) => setForm({ ...form, sourcesText: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className={`${buttonClass} bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5`}><Save className="w-3.5 h-3.5" /> Save station</button>
                {form.id && <button type="button" onClick={remove} className={`${buttonClass} bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 flex items-center gap-1.5`}><Trash2 className="w-3.5 h-3.5" /> Delete</button>}
              </div>
            </form>

            {current && (
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <p className={labelClass}>Species recorded at this station</p>
                {current.station_species.length === 0 && <p className="text-xs text-slate-500">None yet.</p>}
                <ul className="flex flex-wrap gap-2">
                  {current.station_species.map((l) => (
                    <li key={`${l.species_id}-${l.source}`} className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg bg-slate-800 text-xs">
                      <em className="text-slate-200">{speciesById(l.species_id)?.scientific_name}</em>
                      <span className="text-slate-500">({l.source})</span>
                      <button onClick={() => dropLink(l)} aria-label="Remove" className="p-0.5 text-slate-400 hover:text-rose-300"><X className="w-3.5 h-3.5" /></button>
                    </li>
                  ))}
                </ul>
                <div className="grid sm:grid-cols-5 gap-2">
                  <select className={`${inputClass} sm:col-span-2 italic`} value={link.speciesId} onChange={(e) => setLink({ ...link, speciesId: e.target.value })}>
                    <option value="">Species…</option>
                    {species.map((sp) => <option key={sp.id} value={sp.id}>{sp.scientific_name}</option>)}
                  </select>
                  <input className={`${inputClass} sm:col-span-2`} placeholder="Source, e.g. Sanchez-Delute et al. (2025)" value={link.source} onChange={(e) => setLink({ ...link, source: e.target.value })} />
                  <button type="button" onClick={addLink} className={`${buttonClass} bg-slate-800 hover:bg-slate-700 text-slate-200`}>Add</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

// --------------------------------------------------------------------- users

const ROLES = ['community', 'researcher', 'admin', 'developer'];

export function UsersManager({ onCount }) {
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await adminListUsers();
      setRows(data);
      onCount?.(data.length);
      setError(null);
    } catch (err) { setError(err.message); }
  }, [onCount]);
  useEffect(() => { load(); }, [load]);

  const update = async (row, fields) => {
    if (row.id === me.id && fields.role && fields.role !== 'admin' &&
        !window.confirm('You are removing your own admin access. Continue?')) return;
    try { await adminUpdateUser(row.id, fields); load(); } catch (err) { setError(err.message); }
  };

  const shown = rows.filter((r) => [r.email, r.display_name, r.role, r.user_type].some((v) => v?.toLowerCase().includes(query.toLowerCase())));

  return (
    <Panel icon={Users} title="Users and roles"
      description="Change a role or mark test accounts. To delete an account, use Supabase Dashboard > Authentication > Users (see DEPLOYMENT.md)."
      actions={<input className={`${inputClass} w-56`} placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />}>
      <Alert>{error}</Alert>
      <div className="overflow-x-auto -mx-5 md:-mx-6">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-500 text-xs border-y border-slate-800">
            <tr>
              <th className="py-3 px-5">Account</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Role</th>
              <th className="py-3 px-3">Test account</th>
              <th className="py-3 px-3">Sightings</th>
              <th className="py-3 px-5">Last sign-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="py-3 px-5">
                  <span className="text-slate-200 font-semibold">{r.email}</span>
                  {r.display_name && <span className="block text-slate-500">{r.display_name}</span>}
                </td>
                <td className="py-3 px-3 text-slate-400 capitalize">{r.user_type}</td>
                <td className="py-3 px-3">
                  <select value={r.role} onChange={(e) => update(r, { role: e.target.value })}
                    className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-200">
                    {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </td>
                <td className="py-3 px-3">
                  <input type="checkbox" aria-label="Test account" checked={r.is_test_account} onChange={(e) => update(r, { is_test_account: e.target.checked })} />
                </td>
                <td className="py-3 px-3 text-slate-400 tabular-nums">{r.sighting_count}</td>
                <td className="py-3 px-5 text-slate-500">{r.last_sign_in_at ? new Date(r.last_sign_in_at).toLocaleDateString() : 'never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------- test-data clean-up

const localInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function TestDataCleanup() {
  const now = new Date();
  const [from, setFrom] = useState(localInput(new Date(now.getTime() - 24 * 3600 * 1000)));
  const [to, setTo] = useState(localInput(now));
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setError(null);
    setResult(null);
    const f = new Date(from);
    const t = new Date(to);
    if (!(t > f)) { setError('"To" must be after "From".'); return; }
    if (!window.confirm('Permanently delete all sightings, questions and photos from TEST accounts, and all anonymous feedback and logged identification results, in this time window?')) return;
    setBusy(true);
    try {
      setResult(await deleteTestSessionData(f.toISOString(), t.toISOString()));
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Panel icon={Eraser} title="Delete evaluation-session data"
      description="After user testing: removes what accounts marked as 'test account' created in the chosen window, their photos, and the anonymous feedback and identification results logged in the same window. Real accounts are not touched.">
      <div className="grid sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className={labelClass}>From</label>
          <input type="datetime-local" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>To</label>
          <input type="datetime-local" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button onClick={run} disabled={busy} className={`${buttonClass} py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 flex items-center justify-center gap-1.5`}>
          <Trash2 className="w-3.5 h-3.5" /> Delete test data
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <Alert>{error}</Alert>
        {result && (
          <Alert kind="success">
            Deleted {result.sightings} sighting(s), {result.photos} photo(s), {result.questions} question(s), {result.feedback} feedback message(s),
            {' '}{result.scans} scan history entr{result.scans === 1 ? 'y' : 'ies'}
            {result.identifications !== null && <> and {result.identifications} logged identification result(s)</>}.
          </Alert>
        )}
        {result?.photosFailed > 0 && (
          <Alert>
            {result.photosFailed} photo file(s) could not be removed from storage. Delete them by hand in Supabase &gt; Storage &gt; sighting-photos.
          </Alert>
        )}
        {result && result.identifications === null && (
          <Alert>The identification log could not be cleared. Check that its migration has been run.</Alert>
        )}
      </div>
    </Panel>
  );
}
