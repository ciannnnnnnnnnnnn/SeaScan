// src/components/staff/ModelManager.jsx
// Admin > CNN Model: what is deployed, how it tested, whether the server-side
// identification service is up, and the settings admins may change (the two
// thresholds and the server switch). Changes apply to every open Scanner
// through Supabase Realtime and are recorded in the audit log.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cpu, Server, SlidersHorizontal, BarChart3, RefreshCw, Save, Wrench } from 'lucide-react';
import { useModelSettings } from '../../hooks/useModelSettings';
import { saveModelSettings, fetchIdentificationLog } from '../../lib/api';
import { backendEnabled, backendGet } from '../../lib/backend';
import { MODEL_METRICS } from '../../data/modelMetrics';
import { Panel, Alert, StatTile, inputClass, labelClass, buttonClass } from './PortalShell';

const BROWSER_MODELS = [
  { key: 'species', title: 'Species model', dir: '/models/seascan_tfjs_f16' },
  { key: 'gate', title: 'Seagrass check (gate)', dir: '/models/gate_tfjs_f16' },
];

// Bytes of the weights, from model.json (float16-quantized weights take 2 bytes).
function weightBytes(json) {
  return json.weightsManifest.flatMap((g) => g.weights).reduce((sum, w) => {
    const n = w.shape.reduce((a, b) => a * b, 1);
    const bytes = w.quantization?.dtype === 'float16' ? 2 : w.quantization?.dtype === 'uint8' ? 1 : 4;
    return sum + n * bytes;
  }, 0);
}

async function loadBrowserModel({ dir }) {
  const [settings, json] = await Promise.all(
    [`${dir}/app_settings.json`, `${dir}/model.json`].map((u) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${u}: ${r.status}`))))),
  );
  const quantized = json.weightsManifest.some((g) => g.weights.some((w) => w.quantization));
  return { settings, mb: weightBytes(json) / 1024 / 1024, weights: quantized ? 'float16 (quantized)' : 'float32', format: json.format };
}

const pct = (v) => `${Math.round(Number(v) * 100)}%`;

export default function ModelManager() {
  const { settings, loaded } = useModelSettings();
  const [models, setModels] = useState({});
  const [server, setServer] = useState(null); // null = checking
  const [usage, setUsage] = useState(null);

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    BROWSER_MODELS.forEach((m) => {
      loadBrowserModel(m)
        .then((info) => setModels((prev) => ({ ...prev, [m.key]: info })))
        .catch((err) => setModels((prev) => ({ ...prev, [m.key]: { error: err.message } })));
    });
    fetchIdentificationLog(1000)
      .then((rows) => setUsage({
        total: rows.length,
        browser: rows.filter((r) => r.method !== 'server').length,
        server: rows.filter((r) => r.method === 'server').length,
      }))
      .catch(() => setUsage(undefined));
  }, []);

  const checkServer = useCallback(async () => {
    if (!backendEnabled()) { setServer({ configured: false }); return; }
    setServer(null);
    try {
      const info = await backendGet('/api/model');
      setServer({ configured: true, reachable: true, ...info.server });
    } catch {
      setServer({ configured: true, reachable: false });
    }
  }, []);
  useEffect(() => { checkServer(); }, [checkServer]);

  // The form starts from the saved settings, and follows them until edited.
  useEffect(() => {
    if (settings && !form) {
      setForm({
        species: Math.round(Number(settings.species_threshold) * 100),
        gate: Math.round(Number(settings.gate_threshold) * 100),
        server: settings.server_identification,
      });
    }
  }, [settings, form]);

  const changed = useMemo(() => settings && form && (
    form.species !== Math.round(Number(settings.species_threshold) * 100)
    || form.gate !== Math.round(Number(settings.gate_threshold) * 100)
    || form.server !== settings.server_identification
  ), [settings, form]);

  const save = async (e) => {
    e.preventDefault();
    setError(null); setNotice(null);
    const inRange = (v) => Number.isFinite(v) && v >= 50 && v <= 99;
    if (!inRange(form.species) || !inRange(form.gate)) { setError('Both thresholds must be between 50% and 99%.'); return; }
    if (!window.confirm('Apply these settings to every SeaScan user now? The reported test results were measured at 70% and 87%.')) return;
    setSaving(true);
    try {
      await saveModelSettings({ speciesThreshold: form.species / 100, gateThreshold: form.gate / 100, serverIdentification: form.server });
      setNotice('Saved. Open Scanner pages apply the new settings immediately; the server within a minute.');
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const reset = () => setForm({ species: 70, gate: 87, server: true });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Overall test accuracy" value={`${MODEL_METRICS.overallAccuracy}%`} icon={BarChart3} tone="teal"
          hint={`Every species ≥ ${MODEL_METRICS.minimumPerSpecies}% on all four metrics`} />
        <StatTile label="Species threshold" value={settings ? pct(settings.species_threshold) : '70%'} icon={SlidersHorizontal} tone="amber"
          hint={'Below this: "Not sure, please retake"'} />
        <StatTile label="Seagrass check threshold" value={settings ? pct(settings.gate_threshold) : '87%'} icon={SlidersHorizontal} tone="cyan"
          hint={'Below this: "Not seagrass"'} />
        <StatTile label="Scans on the server" value={usage ? `${usage.server} / ${usage.total}` : '—'} icon={Server} tone="emerald"
          hint={usage ? 'Of the latest logged scans' : 'No identification log yet'} />
      </div>

      <Panel icon={Cpu} title="Deployed models" description="Both run in the visitor's browser with TensorFlow.js. Devices that cannot run them use the server copies below.">
        <div className="grid md:grid-cols-2 gap-4">
          {BROWSER_MODELS.map((m) => {
            const info = models[m.key];
            return (
              <div key={m.key} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                {!info ? <p className="text-slate-500">Loading…</p> : info.error ? <p className="text-rose-300">{info.error}</p> : (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                    <dt className="text-slate-500">Folder</dt><dd className="text-slate-200 font-mono">{m.dir}</dd>
                    <dt className="text-slate-500">Weights</dt><dd className="text-slate-200">{info.weights}, {info.mb.toFixed(1)} MB</dd>
                    <dt className="text-slate-500">Input</dt><dd className="text-slate-200">{info.settings.input_size.join(' × ')} px, raw 0-255</dd>
                    <dt className="text-slate-500">Classes</dt><dd className="text-slate-200">{info.settings.class_names.length}</dd>
                    <dt className="text-slate-500">Default threshold</dt><dd className="text-slate-200">{pct(info.settings.confidence_threshold)}</dd>
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel icon={Server} title="Server-side identification service"
        description="Flask API (app.py) with the same models in ONNX format. Used when a device cannot run the models; photos are processed in memory and not stored."
        actions={<button onClick={checkServer} className={`${buttonClass} bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5`}><RefreshCw className="w-3.5 h-3.5" /> Check again</button>}>
        {server === null ? <p className="text-sm text-slate-500">Checking…</p>
          : !server.configured ? <Alert>The web app has no VITE_API_URL, so the server cannot be used. See DEPLOYMENT.md, step 8.</Alert>
          : !server.reachable ? <Alert>The SeaScan API did not answer. On Render's free plan it sleeps when idle; it wakes on the next request (up to a minute).</Alert>
          : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <dt className="text-slate-500">Status</dt>
              <dd className={server.enabled ? 'text-emerald-300' : 'text-amber-300'}>{server.enabled ? 'Available' : 'Not available'}</dd>
              <dt className="text-slate-500">Model files</dt>
              <dd className="text-slate-200">{server.model_files ? 'server_models/seascan_species.onnx, seascan_gate.onnx' : 'Missing - run scripts/convert_models_onnx.py'}</dd>
              <dt className="text-slate-500">Models loaded</dt>
              <dd className="text-slate-200">{server.loaded ? 'Yes' : 'Not yet (they load on the first server identification)'}</dd>
              {server.error && (<><dt className="text-slate-500">Error</dt><dd className="text-rose-300">{server.error}</dd></>)}
            </dl>
          )}
      </Panel>

      <Panel icon={SlidersHorizontal} title="Settings" description="Applied by every Scanner and by the server. Every change is recorded in the audit log.">
        {!loaded ? <p className="text-sm text-slate-500">Loading…</p> : !settings ? (
          <Alert>The model settings table does not exist yet. Run migration 20261112000100_account_model_realtime.sql in Supabase.</Alert>
        ) : form && (
          <form onSubmit={save} className="space-y-4 max-w-2xl">
            <Alert>{error}</Alert>
            <Alert kind="success">{notice}</Alert>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="mm-species" className={labelClass}>Species &quot;not sure&quot; threshold (%)</label>
                <input id="mm-species" type="number" min={50} max={99} step={1} className={inputClass}
                  value={form.species} onChange={(e) => setForm({ ...form, species: Number(e.target.value) })} />
                <p className="text-xs text-slate-500 mt-1">Below this confidence no species is named. Tested value: 70%.</p>
              </div>
              <div>
                <label htmlFor="mm-gate" className={labelClass}>Seagrass check threshold (%)</label>
                <input id="mm-gate" type="number" min={50} max={99} step={1} className={inputClass}
                  value={form.gate} onChange={(e) => setForm({ ...form, gate: Number(e.target.value) })} />
                <p className="text-xs text-slate-500 mt-1">Below this the photo is rejected as not seagrass. Tested value: 87%.</p>
              </div>
            </div>
            <label className="flex items-start gap-3 text-sm text-slate-300">
              <input type="checkbox" className="mt-1" checked={form.server} onChange={(e) => setForm({ ...form, server: e.target.checked })} />
              <span>
                Allow server-side identification
                <span className="block text-xs text-slate-500">When off, devices that cannot run the models get an error instead of sending the photo to the server.</span>
              </span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={saving || !changed} className={`${buttonClass} py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5`}>
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save settings
              </button>
              <button type="button" onClick={reset} className={`${buttonClass} py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200`}>Use tested values</button>
              {settings.updated_at && <span className="text-xs text-slate-500">Last changed {new Date(settings.updated_at).toLocaleString()}</span>}
            </div>
          </form>
        )}
      </Panel>

      <Panel icon={Wrench} title="Replacing a model" description="After retraining. The model files are part of the deployed app, so this is done in the repository, not here.">
        <ol className="text-sm text-slate-300 space-y-1.5 list-decimal pl-5">
          <li>Browser models: put the new TensorFlow.js export in <code className="text-slate-200">seascan-app/model-source/</code> and run <code className="text-slate-200">node scripts/quantize_models.mjs</code>.</li>
          <li>Server models: put the new <code className="text-slate-200">.keras</code> files in <code className="text-slate-200">model-keras/</code> and run <code className="text-slate-200">python scripts/convert_models_onnx.py</code>.</li>
          <li>Re-run <code className="text-slate-200">node scripts/evaluate_models.mjs</code>; every species must stay at or above 85%. Update the results in <code className="text-slate-200">src/data/modelMetrics.js</code>.</li>
          <li>Redeploy the web app (Vercel) and the API (Render). Details: DEPLOYMENT.md.</li>
        </ol>
      </Panel>
    </>
  );
}
