// src/components/staff/IdentificationLog.jsx
// What the Scanner answered and how long it took, as recorded by the Flask
// API. No photo or account is stored, so rows cannot be linked to a person.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Timer, CheckCircle2, HelpCircle, Download } from 'lucide-react';
import { fetchIdentificationLog, downloadCsv } from '../../lib/api';
import { onTableChanges } from '../../lib/realtime';
import { Panel, Alert, StatTile, buttonClass } from './PortalShell';

const TARGET_MS = 5000; // response-time requirement: identification within 5 seconds
const LIMIT = 1000;

const OUTCOME_LABEL = {
  identified: 'Identified',
  low_confidence: 'Not sure (below 70%)',
  not_seagrass: 'Not seagrass',
};

const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
const share = (n, total) => (total ? `${Math.round((n / total) * 100)}%` : '—');

// Value at the q-th percentile of an ascending list (nearest rank).
const percentile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.ceil((q / 100) * sorted.length) - 1)];

export default function IdentificationLog() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try { setRows(await fetchIdentificationLog(LIMIT)); setError(null); } catch (err) { setRows([]); setError(err.message); }
  }, []);
  useEffect(() => {
    load();
    return onTableChanges(['identification_log'], load); // new scans appear as they are logged
  }, [load]);

  const stats = useMemo(() => {
    if (!rows?.length) return null;
    const times = rows.map((r) => r.duration_ms).sort((a, b) => a - b);
    const count = (outcome) => rows.filter((r) => r.outcome === outcome).length;
    const perSpecies = {};
    for (const r of rows) {
      if (r.outcome !== 'identified') continue;
      const s = (perSpecies[r.species_label] ||= { n: 0, sum: 0 });
      s.n++;
      s.sum += Number(r.confidence);
    }
    return {
      total: rows.length,
      identified: count('identified'),
      unsure: count('low_confidence'),
      rejected: count('not_seagrass'),
      median: percentile(times, 50),
      p95: percentile(times, 95),
      withinTarget: times.filter((t) => t <= TARGET_MS).length,
      perSpecies: Object.entries(perSpecies)
        .map(([label, s]) => ({ name: label.replace(/_/g, ' '), n: s.n, mean: s.sum / s.n }))
        .sort((a, b) => b.n - a.n),
    };
  }, [rows]);

  const exportCsv = () => downloadCsv(`seascan-identifications-${new Date().toISOString().slice(0, 10)}.csv`, rows, [
    { label: 'recorded_at', value: (r) => r.created_at },
    { label: 'outcome', value: (r) => r.outcome },
    { label: 'species', value: (r) => r.species_label?.replace(/_/g, ' ') },
    { label: 'confidence_pct', value: (r) => r.confidence },
    { label: 'seagrass_check_pct', value: (r) => r.gate_score },
    { label: 'duration_ms', value: (r) => r.duration_ms },
    { label: 'device', value: (r) => r.device },
    { label: 'model_version', value: (r) => r.model_version },
  ]);

  return (
    <>
      <Alert>{error}</Alert>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Identifications logged" value={stats?.total ?? (rows ? 0 : null)} icon={Activity} tone="teal"
          hint={rows?.length === LIMIT ? `Latest ${LIMIT} shown` : 'Recorded by the SeaScan API'} />
        <StatTile label="Median time" value={stats ? seconds(stats.median) : null} icon={Timer} tone="cyan"
          hint={stats ? `95% finished within ${seconds(stats.p95)}` : 'From photo chosen to result'} />
        <StatTile label="Within 5 seconds" value={stats ? share(stats.withinTarget, stats.total) : null} icon={CheckCircle2} tone="emerald"
          hint={stats ? `${stats.withinTarget} of ${stats.total} scans` : 'Response-time target'} />
        <StatTile label="Not sure or rejected" value={stats ? share(stats.unsure + stats.rejected, stats.total) : null} icon={HelpCircle} tone="amber"
          hint={stats ? `${stats.unsure} below 70%, ${stats.rejected} not seagrass` : 'No species named'} />
      </div>

      <Panel icon={Activity} title="Identified species" description="Scans where a species was named (confidence 70% or more)."
        actions={(
          <button disabled={!rows?.length} onClick={exportCsv} className={`${buttonClass} bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5`}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        )}>
        {!stats?.perSpecies.length ? (
          <p className="text-sm text-slate-500 text-center py-6">
            {rows ? 'No identifications logged yet. Results appear here once the SeaScan API is deployed and the Scanner is used.' : 'Loading…'}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-5 md:-mx-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-500 uppercase text-[11px] tracking-wider border-y border-slate-800">
                <tr>
                  <th className="py-3 px-5">Species</th>
                  <th className="py-3 px-3">Scans</th>
                  <th className="py-3 px-5">Mean confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.perSpecies.map((s) => (
                  <tr key={s.name}>
                    <td className="py-3 px-5 italic text-slate-200">{s.name}</td>
                    <td className="py-3 px-3 text-slate-400 tabular-nums">{s.n}</td>
                    <td className="py-3 px-5 text-slate-400 tabular-nums">{s.mean.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel icon={Timer} title="Latest scans" description="The 25 most recent results. The first scan after opening the Scanner includes the model download.">
        {!rows?.length ? (
          <p className="text-sm text-slate-500 text-center py-6">{rows ? 'Nothing logged yet.' : 'Loading…'}</p>
        ) : (
          <div className="overflow-x-auto -mx-5 md:-mx-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-500 uppercase text-[11px] tracking-wider border-y border-slate-800">
                <tr>
                  <th className="py-3 px-5">When</th>
                  <th className="py-3 px-3">Result</th>
                  <th className="py-3 px-3">Species</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-5">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.slice(0, 25).map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-5 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-300">{OUTCOME_LABEL[r.outcome]}</td>
                    <td className="py-3 px-3 italic text-slate-200">{r.species_label?.replace(/_/g, ' ') || '—'}</td>
                    <td className="py-3 px-3 text-slate-400 tabular-nums">{r.confidence === null ? '—' : `${Number(r.confidence).toFixed(1)}%`}</td>
                    <td className={`py-3 px-3 tabular-nums ${r.duration_ms > TARGET_MS ? 'text-amber-300' : 'text-slate-400'}`}>{seconds(r.duration_ms)}</td>
                    <td className="py-3 px-5 text-slate-500 capitalize">{r.device || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
