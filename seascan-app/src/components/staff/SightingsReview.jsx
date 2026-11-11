// src/components/staff/SightingsReview.jsx
// Researchers and admins approve, reject or delete community sightings and
// export them as CSV. The database only allows staff to do this (RLS).
import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Check, Ban, Trash2, Download, ImageOff, RefreshCw, Eye } from 'lucide-react';
import { fetchAllSightings, reviewSighting, deleteSighting, sightingPhotoUrl, downloadCsv, adminListUsers } from '../../lib/api';
import SightingDetails from './SightingDetails';
import { useCatalog } from '../../hooks/useCatalog';
import { Panel, Alert, buttonClass } from './PortalShell';
import { useAuth } from '../../context/AuthContext';
import { onTableChanges } from '../../lib/realtime';

const STATUS = {
  pending: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  approved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  rejected: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
};

function PhotoThumb({ path }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  if (!path) return <span className="text-slate-700">—</span>;
  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" title="Open full photo">
        <img src={url} alt="Sighting" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
      </a>
    );
  }
  return (
    <button type="button" className="text-xs text-teal-300 hover:text-teal-200 underline"
      onClick={async () => { const u = await sightingPhotoUrl(path); if (u) setUrl(u); else setFailed(true); }}>
      {failed ? <ImageOff className="w-4 h-4 text-slate-600" /> : 'View'}
    </button>
  );
}

export default function SightingsReview({ onChanged }) {
  const { speciesById } = useCatalog();
  const { can } = useAuth();
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [users, setUsers] = useState(null);

  // Admins can see who submitted a sighting (emails come from an admin-only
  // database function). Researchers see an anonymous account reference.
  useEffect(() => {
    if (!can('users.manage')) return;
    adminListUsers()
      .then((list) => setUsers(Object.fromEntries(list.map((u) => [u.id, u]))))
      .catch(() => setUsers({}));
  }, [can]);

  const submitterOf = (row) => {
    const u = users?.[row.user_id];
    if (u) return `${u.email}${u.display_name ? ` (${u.display_name})` : ''} · ${u.role}${u.is_test_account ? ' · test account' : ''}`;
    return `Community member (account ${row.user_id.slice(0, 8)}…)`;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchAllSightings(status));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
    return onTableChanges(['sightings'], load); // new submissions and other reviewers' decisions
  }, [load]);

  const act = async (row, fn) => {
    setBusyId(row.id);
    setError(null);
    try {
      await fn();
      setViewing(null);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const approve = (row) => act(row, () => reviewSighting(row.id, 'approved'));
  const reject = (row) => {
    const note = window.prompt('Reason for rejecting (optional, visible to staff):', '');
    if (note === null) return;
    act(row, () => reviewSighting(row.id, 'rejected', note));
  };
  const remove = (row) => {
    if (!window.confirm('Delete this sighting and its photo permanently?')) return;
    act(row, () => deleteSighting(row));
  };

  const exportCsv = () => downloadCsv(`seascan-sightings-${status}-${new Date().toISOString().slice(0, 10)}.csv`, rows, [
    { label: 'id', value: (r) => r.id },
    { label: 'species', value: (r) => speciesById(r.species_id)?.scientific_name },
    { label: 'latitude', value: (r) => r.latitude },
    { label: 'longitude', value: (r) => r.longitude },
    { label: 'location_source', value: (r) => r.location_source },
    { label: 'observed_on', value: (r) => r.observed_on },
    { label: 'model_confidence_pct', value: (r) => r.model_confidence },
    { label: 'status', value: (r) => r.status },
    { label: 'review_note', value: (r) => r.review_note },
    { label: 'notes', value: (r) => r.notes },
    { label: 'has_photo', value: (r) => (r.photo_path ? 'yes' : 'no') },
    { label: 'submitted_at', value: (r) => r.created_at },
    { label: 'reviewed_at', value: (r) => r.reviewed_at },
  ]);

  return (
    <Panel
      icon={ShieldCheck}
      title="Sighting review"
      description="Approve sightings to show them on the public map as community-submitted, unverified records."
      actions={(
        <>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter"
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <button onClick={load} className={`${buttonClass} bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5`}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={exportCsv} disabled={!rows.length || !can('sightings.export')} className={`${buttonClass} bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5`}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </>
      )}
    >
      <Alert>{error}</Alert>
      {loading ? (
        <div className="space-y-2"><div className="skeleton h-10 rounded-xl" /><div className="skeleton h-10 rounded-xl" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">No {status === 'all' ? '' : status} sightings.</p>
      ) : (
        <div className="overflow-x-auto -mx-5 md:-mx-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-500 text-xs border-y border-slate-800">
              <tr>
                <th className="py-3 px-5">Species</th>
                <th className="py-3 px-3">Photo</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Observed</th>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((r) => (
                <tr key={r.id} className="align-top hover:bg-slate-800/20">
                  <td className="py-3 px-5">
                    <span className="font-semibold italic text-slate-200">{speciesById(r.species_id)?.scientific_name || '—'}</span>
                    {r.notes && <p className="text-slate-500 mt-1 max-w-xs">{r.notes}</p>}
                    {r.review_note && <p className="text-rose-300/80 mt-1 max-w-xs">Review note: {r.review_note}</p>}
                  </td>
                  <td className="py-3 px-3"><PhotoThumb path={r.photo_path} /></td>
                  <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {Number(r.latitude).toFixed(5)}, {Number(r.longitude).toFixed(5)}
                    <span className={`block font-sans mt-0.5 ${r.location_source === 'demo' ? 'text-amber-300/80' : 'text-slate-600'}`}>
                      {r.location_source === 'gps' ? 'device GPS' : r.location_source === 'map' ? 'picked on map' : 'demo location'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{r.observed_on}</td>
                  <td className="py-3 px-3 text-slate-400 tabular-nums">{r.model_confidence != null ? `${r.model_confidence}%` : '—'}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold capitalize ${STATUS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setViewing(r)} title="View all details"
                        className={`${buttonClass} bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1`}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      {r.status !== 'approved' && (
                        <button disabled={busyId === r.id} onClick={() => approve(r)} title="Approve"
                          className={`${buttonClass} bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 flex items-center gap-1`}>
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button disabled={busyId === r.id} onClick={() => reject(r)} title="Reject"
                          className={`${buttonClass} bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 flex items-center gap-1`}>
                          <Ban className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}
                      {can('sightings.delete') && <button disabled={busyId === r.id} onClick={() => remove(r)} title="Delete" aria-label="Delete sighting"
                        className={`${buttonClass} bg-rose-500/15 text-rose-300 hover:bg-rose-500/25`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <SightingDetails
          sighting={viewing}
          species={speciesById(viewing.species_id)}
          submitter={submitterOf(viewing)}
          busy={busyId === viewing.id}
          canDelete={can('sightings.delete')}
          onApprove={() => approve(viewing)}
          onReject={() => reject(viewing)}
          onDelete={() => remove(viewing)}
          onClose={() => setViewing(null)}
        />
      )}
    </Panel>
  );
}
