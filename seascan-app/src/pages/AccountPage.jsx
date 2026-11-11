// src/pages/AccountPage.jsx
// My Account: open to every signed-in user (community users, researchers and
// administrators). Scan history, own sightings, profile settings, log out.
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  UserRound, History, MapPin, Settings, LogOut, Trash2, AlertCircle, CheckCircle2, RefreshCw, Camera, Server, Smartphone,
} from 'lucide-react';
import { useAuth, USER_TYPES, portalPathForRole } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import {
  fetchMyScans, deleteScan, clearMyScans, fetchMySightings, deleteSighting, updateMyProfile, changeMyPassword,
} from '../lib/api';
import { onTableChanges } from '../lib/realtime';

const TABS = [
  { id: 'scans', label: 'Scan history', icon: History },
  { id: 'sightings', label: 'My sightings', icon: MapPin },
  { id: 'profile', label: 'Profile settings', icon: Settings },
];

const OUTCOME = {
  identified: { label: 'Identified', cls: 'bg-teal-500/10 text-teal-300 border-teal-500/25' },
  low_confidence: { label: 'Not sure', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/25' },
  not_seagrass: { label: 'Not seagrass', cls: 'bg-rose-500/10 text-rose-300 border-rose-500/25' },
};

const STATUS_CHIP = {
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  rejected: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
};

const PORTAL_NAME = { admin: 'Admin Panel', researcher: 'Researcher Panel', community: 'Community Hub', developer: 'Dev Console' };

const field = 'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors';
const label = 'block text-xs text-slate-400 font-semibold mb-1.5';

function Notice({ kind = 'error', children }) {
  if (!children) return null;
  const ok = kind === 'success';
  const Icon = ok ? CheckCircle2 : AlertCircle;
  return (
    <p role={ok ? 'status' : 'alert'}
      className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" /> <span>{children}</span>
    </p>
  );
}

// ------------------------------------------------------------- scan history

function ScanHistory({ user }) {
  const { speciesByModelLabel } = useCatalog();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try { setRows(await fetchMyScans()); setError(null); } catch (err) { setRows([]); setError(err.message); }
  }, []);
  useEffect(() => {
    load();
    return onTableChanges(['scan_history'], load);
  }, [load]);

  const remove = async (id) => {
    try { await deleteScan(id); load(); } catch (err) { setError(err.message); }
  };
  const clearAll = async () => {
    if (!window.confirm('Delete your whole scan history? This cannot be undone.')) return;
    try { await clearMyScans(user.id); load(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400 max-w-xl">
          Results of the photos you identified while signed in. Only the result is kept, never the photo.
        </p>
        {rows?.length > 0 && (
          <button onClick={clearAll} className="text-xs font-semibold text-rose-300 hover:text-rose-200 flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Clear history
          </button>
        )}
      </div>
      <Notice>{error}</Notice>
      {rows === null ? (
        <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <History className="w-8 h-8 text-slate-700 mx-auto" />
          <p className="text-sm text-slate-400">No scans yet.</p>
          <Link to="/scanner" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200">
            <Camera className="w-4 h-4" /> Identify a photo
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 pr-4">When</th>
                <th className="py-2.5 pr-4">Result</th>
                <th className="py-2.5 pr-4">Species</th>
                <th className="py-2.5 pr-4">Confidence</th>
                <th className="py-2.5 pr-4">Where</th>
                <th className="py-2.5"><span className="sr-only">Delete</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((r) => {
                const name = r.species_label?.replace(/_/g, ' ');
                const sp = name ? speciesByModelLabel(name) : null;
                const o = OUTCOME[r.outcome];
                return (
                  <tr key={r.id}>
                    <td className="py-3 pr-4 text-slate-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${o.cls}`}>{o.label}</span>
                    </td>
                    <td className="py-3 pr-4 italic text-slate-200">
                      {sp ? <Link to={`/library/${sp.slug}`} className="hover:text-teal-300 underline-offset-2 hover:underline">{name}</Link> : (name || '—')}
                    </td>
                    <td className="py-3 pr-4 text-slate-400 tabular-nums">{r.confidence === null ? '—' : `${Number(r.confidence).toFixed(1)}%`}</td>
                    <td className="py-3 pr-4 text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        {r.method === 'server' ? <Server className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                        {r.method === 'server' ? 'SeaScan server' : 'This device'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => remove(r.id)} aria-label="Delete this scan" className="p-1.5 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-950/40">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------- sightings

function MySightings({ user }) {
  const { speciesById } = useCatalog();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try { setRows(await fetchMySightings(user.id)); setError(null); } catch (err) { setRows([]); setError(err.message); }
  }, [user.id]);
  useEffect(() => {
    load();
    return onTableChanges(['sightings'], load); // status changes when a researcher reviews it
  }, [load]);

  const remove = async (s) => {
    if (!window.confirm('Delete this sighting?')) return;
    try { await deleteSighting(s); load(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400 max-w-xl">
          Sightings you submitted. They appear on the public map once a researcher approves them.
          You can delete a sighting while it is still pending.
        </p>
        <Link to="/map" className="text-xs font-semibold text-teal-300 hover:text-teal-200 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Submit a sighting on the map
        </Link>
      </div>
      <Notice>{error}</Notice>
      {rows === null ? (
        <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">No sightings yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 pr-4">Species</th>
                <th className="py-2.5 pr-4">Location</th>
                <th className="py-2.5 pr-4">Observed</th>
                <th className="py-2.5 pr-4">Status</th>
                <th className="py-2.5"><span className="sr-only">Delete</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="py-3 pr-4 italic text-slate-200">{speciesById(s.species_id)?.scientific_name || '—'}</td>
                  <td className="py-3 pr-4 font-mono text-slate-400">
                    {Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}
                    {s.location_source === 'demo' && <span className="ml-1.5 font-sans text-amber-300/80">(demo)</span>}
                  </td>
                  <td className="py-3 pr-4 text-slate-500">{s.observed_on}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize ${STATUS_CHIP[s.status]}`}>{s.status}</span>
                    {s.status === 'rejected' && s.review_note && <span className="block mt-1 text-slate-500">{s.review_note}</span>}
                  </td>
                  <td className="py-3 text-right">
                    {s.status === 'pending' && (
                      <button onClick={() => remove(s)} aria-label="Delete this sighting" className="p-1.5 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-950/40">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- profile

function ProfileSettings({ user, refreshUser }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [userType, setUserType] = useState(USER_TYPES.some((t) => t.value === user.userType) ? user.userType : 'other');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwNotice, setPwNotice] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    setError(null); setNotice(null); setSaving(true);
    try {
      await updateMyProfile(user.id, { displayName, userType });
      await refreshUser();
      setNotice('Profile saved.');
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError(null); setPwNotice(null);
    if (password.length < 8) { setPwError('Use at least 8 characters.'); return; }
    if (password !== confirm) { setPwError('The two passwords do not match.'); return; }
    setPwBusy(true);
    try {
      await changeMyPassword(password);
      setPassword(''); setConfirm('');
      setPwNotice('Password changed.');
    } catch (err) { setPwError(err.message); } finally { setPwBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={save} className="space-y-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-800">
        <h3 className="text-sm font-bold text-white">Profile</h3>
        <Notice>{error}</Notice>
        <Notice kind="success">{notice}</Notice>
        <div>
          <span className={label}>Email</span>
          <p className="text-sm text-slate-300">{user.email}</p>
        </div>
        <div>
          <label htmlFor="acc-name" className={label}>Nickname <span className="font-normal text-slate-500">(optional, no real name needed)</span></label>
          <input id="acc-name" maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="acc-type" className={label}>I am a</label>
          <select id="acc-type" value={userType} onChange={(e) => setUserType(e.target.value)} className={field}>
            {USER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <span className={label}>Role</span>
          <p className="text-sm text-slate-300 capitalize">{user.role}</p>
          <p className="text-xs text-slate-500 mt-0.5">Roles are assigned by a SeaScan administrator.</p>
        </div>
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 text-sm font-bold flex items-center gap-2">
          {saving && <RefreshCw className="w-4 h-4 animate-spin" />} Save profile
        </button>
      </form>

      <form onSubmit={savePassword} className="space-y-4 p-5 rounded-2xl bg-slate-950/40 border border-slate-800 h-fit">
        <h3 className="text-sm font-bold text-white">Change password</h3>
        <Notice>{pwError}</Notice>
        <Notice kind="success">{pwNotice}</Notice>
        <div>
          <label htmlFor="acc-pw" className={label}>New password</label>
          <input id="acc-pw" type="password" autoComplete="new-password" minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={field} />
        </div>
        <div>
          <label htmlFor="acc-pw2" className={label}>Repeat the new password</label>
          <input id="acc-pw2" type="password" autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className={field} />
        </div>
        <button type="submit" disabled={pwBusy || !password} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 text-sm font-bold flex items-center gap-2">
          {pwBusy && <RefreshCw className="w-4 h-4 animate-spin" />} Change password
        </button>
      </form>
    </div>
  );
}

// -------------------------------------------------------------------- page

export default function AccountPage() {
  const { user, logout, refreshUser } = useAuth();
  const [tab, setTab] = useState('scans');
  const portal = portalPathForRole(user.role);
  // Inside a portal (e.g. /admin/account) the sidebar already has the portal
  // and Log Out, so those buttons only show on the standalone page.
  const standalone = useLocation().pathname === '/account';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans antialiased pb-16">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
              <UserRound className="w-4 h-4" /> My Account
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-white tracking-tight">{user.displayName || 'Your account'}</h1>
            <p className="text-sm text-slate-400 mt-1">{user.email} · <span className="capitalize">{user.role}</span></p>
          </div>
          {standalone && <div className="flex flex-wrap gap-2">
            {PORTAL_NAME[user.role] && (
              <Link to={portal} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold">
                Open {PORTAL_NAME[user.role]}
              </Link>
            )}
            <button onClick={() => logout()} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>}
        </div>

        <div role="tablist" className="flex gap-1 border-b border-slate-800 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} role="tab" aria-selected={active} onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap transition-colors ${
                  active ? 'border-teal-400 text-teal-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <section className="bg-slate-900 rounded-2xl border border-slate-800 p-5 sm:p-6">
          {tab === 'scans' && <ScanHistory user={user} />}
          {tab === 'sightings' && <MySightings user={user} />}
          {tab === 'profile' && <ProfileSettings user={user} refreshUser={refreshUser} />}
        </section>
      </main>
    </div>
  );
}
