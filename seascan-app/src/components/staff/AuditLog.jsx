// src/components/staff/AuditLog.jsx
// Admin: read-only view of public.audit_log. Entries are written by database
// triggers, so every admin and researcher change is recorded even if it was
// made outside this app. Nobody can edit or delete entries through the API.
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollText, Download, RefreshCw } from 'lucide-react';
import { fetchAuditLog, downloadCsv } from '../../lib/api';
import { Panel, Alert, buttonClass } from './PortalShell';

const TABLES = ['species', 'stations', 'station_species', 'profiles', 'sightings', 'feedback', 'community_questions', 'test_session_data'];
const ACTIONS = ['insert', 'update', 'delete', 'review', 'role_change', 'bulk_delete'];
const ACTION_STYLE = {
  insert: 'text-emerald-300', update: 'text-cyan-300', review: 'text-teal-300',
  role_change: 'text-violet-300', delete: 'text-rose-300', bulk_delete: 'text-rose-300',
};
const IGNORED = new Set(['updated_at', 'updated_by', 'reviewed_at', 'reviewed_by']);

/** Short human summary of what changed between old and new rows. */
function summarize(entry) {
  if (entry.details) return entry.details;
  const o = entry.old_data || {};
  const n = entry.new_data || {};
  if (entry.action === 'insert') return `Created ${n.scientific_name || n.name || n.id || ''}`.trim();
  if (entry.action.endsWith('delete')) return `Deleted ${o.scientific_name || o.name || ''}`.trim();
  const changed = Object.keys({ ...o, ...n })
    .filter((k) => !IGNORED.has(k) && JSON.stringify(o[k]) !== JSON.stringify(n[k]));
  return changed.map((k) => `${k}: ${short(o[k])} → ${short(n[k])}`).join('; ') || 'No visible change';
}

const short = (v) => {
  if (v === null || v === undefined || v === '') return '∅';
  const s = Array.isArray(v) ? v.join(', ') : String(v);
  return s.length > 40 ? `${s.slice(0, 40)}…` : s;
};

export default function AuditLog() {
  const [rows, setRows] = useState([]);
  const [table, setTable] = useState('');
  const [action, setAction] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchAuditLog({ table: table || undefined, action: action || undefined }));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [table, action]);

  useEffect(() => { load(); }, [load]);

  const select = 'px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200';

  return (
    <Panel
      icon={ScrollText}
      title="Audit log"
      description="Every change made by administrators and researchers, recorded automatically by the database. Entries cannot be edited or deleted."
      actions={(
        <>
          <select aria-label="Table" value={table} onChange={(e) => setTable(e.target.value)} className={select}>
            <option value="">All areas</option>
            {TABLES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select aria-label="Action" value={action} onChange={(e) => setAction(e.target.value)} className={select}>
            <option value="">All actions</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={load} className={`${buttonClass} bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5`}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button disabled={!rows.length} className={`${buttonClass} bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5`}
            onClick={() => downloadCsv(`seascan-audit-log-${new Date().toISOString().slice(0, 10)}.csv`, rows, [
              { label: 'time', value: (r) => r.at },
              { label: 'actor_email', value: (r) => r.actor_email || 'system / SQL editor' },
              { label: 'actor_role', value: (r) => r.actor_role },
              { label: 'action', value: (r) => r.action },
              { label: 'table', value: (r) => r.table_name },
              { label: 'record_id', value: (r) => r.record_id },
              { label: 'summary', value: (r) => summarize(r) },
              { label: 'old_data', value: (r) => (r.old_data ? JSON.stringify(r.old_data) : '') },
              { label: 'new_data', value: (r) => (r.new_data ? JSON.stringify(r.new_data) : '') },
            ])}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </>
      )}
    >
      <Alert>{error}</Alert>
      {loading ? (
        <div className="space-y-2"><div className="skeleton h-10 rounded-xl" /><div className="skeleton h-10 rounded-xl" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No entries yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-5 md:-mx-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-500 text-xs border-y border-slate-800">
              <tr>
                <th className="py-3 px-5">When</th>
                <th className="py-3 px-3">Who</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Area</th>
                <th className="py-3 px-5">What changed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 align-top">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-5 text-slate-400 whitespace-nowrap">{new Date(r.at).toLocaleString()}</td>
                  <td className="py-3 px-3">
                    <span className="text-slate-200">{r.actor_email || 'system / SQL editor'}</span>
                    {r.actor_role && <span className="block text-slate-500">{r.actor_role}</span>}
                  </td>
                  <td className={`py-3 px-3 font-semibold ${ACTION_STYLE[r.action] || 'text-slate-300'}`}>{r.action}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono">{r.table_name}</td>
                  <td className="py-3 px-5 text-slate-300 max-w-md break-words">{summarize(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
