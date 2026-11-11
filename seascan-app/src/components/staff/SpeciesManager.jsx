// src/components/staff/SpeciesManager.jsx
// Admin: create, edit and delete species profiles (Digital Library content).
import React, { useEffect, useState } from 'react';
import { Leaf, Plus, Save, Trash2, Upload } from 'lucide-react';
import { saveSpecies, deleteSpecies, uploadSpeciesPhoto } from '../../lib/api';
import { validatePhotoFiles, ACCEPT_ATTR } from '../../lib/images';
import { useCatalog, refreshCatalog } from '../../hooks/useCatalog';
import { Panel, Alert, inputClass, labelClass, buttonClass } from './PortalShell';

const TEXT_FIELDS = [
  ['common_name', 'Common name'],
  ['local_name', 'Local name'],
  ['leaf_shape', 'Leaf shape (filter value, e.g. Ribbon-like)'],
  ['blade_length', 'Blade length'],
  ['blade_width', 'Blade width'],
  ['venation', 'Venation'],
  ['leaf_margin', 'Leaf margin'],
  ['conservation_status', 'Conservation status'],
  ['photo_credit', 'Photo credit'],
];

const LONG_FIELDS = [
  ['leaf_morphology', 'Leaf morphology'],
  ['rhizome_structure', 'Rhizome structure'],
  ['sheath_characteristics', 'Sheath characteristics'],
  ['reproductive_organs', 'Reproductive organs'],
  ['ecological_role', 'Ecological role'],
  ['ecosystem_contribution', 'Conservation guide: what it contributes to the ecosystem'],
  ['geographic_distribution', 'Geographic distribution'],
  ['local_distribution_note', 'Notes for Pujada Bay / Mati City'],
  ['sources', 'Sources (citations)'],
];

const EMPTY = { scientific_name: '', slug: '', model_label: '', conservation_tips: [], needs_review: true };

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function SpeciesManager() {
  const { species } = useCatalog();
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [tipsText, setTipsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (form || !species.length) return;
    select(species[0]);
  }, [species]); // eslint-disable-line react-hooks/exhaustive-deps

  function select(sp) {
    setSelectedId(sp?.id ?? null);
    setForm(sp ? { ...sp } : { ...EMPTY });
    setTipsText((sp?.conservation_tips || []).join('\n'));
    setError(null);
    setNotice(null);
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const scientific = form.scientific_name?.trim();
    if (!scientific) { setError('Scientific name is required.'); return; }
    const record = { ...form, scientific_name: scientific, slug: form.slug?.trim() || slugify(scientific) };
    // Empty inputs are stored as NULL so the app shows "To be added".
    for (const [k] of [...TEXT_FIELDS, ...LONG_FIELDS, ['model_label'], ['photo_url']]) {
      if (typeof record[k] === 'string') record[k] = record[k].trim() || null;
    }
    record.conservation_tips = tipsText.split('\n').map((t) => t.trim()).filter(Boolean);
    setSaving(true);
    try {
      const saved = await saveSpecies(record);
      await refreshCatalog();
      select(saved);
      setNotice('Saved. The Digital Library and Scanner now show this version.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!form.id || !window.confirm(`Delete ${form.scientific_name}? Sightings of this species block deletion.`)) return;
    try {
      await deleteSpecies(form.id);
      await refreshCatalog();
      setForm(null);
      setNotice('Species deleted.');
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadPhoto = async (e) => {
    const problem = validatePhotoFiles(e.target.files);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (problem) { setError(problem); return; }
    try {
      const url = await uploadSpeciesPhoto(file, form.slug || slugify(form.scientific_name || 'species'));
      setForm((f) => ({ ...f, photo_url: url }));
      setNotice('Photo uploaded. Click Save to keep it.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Panel icon={Leaf} title="Species catalogue" description="Everything shown in the Digital Library and the Scanner profile. Leave a field empty to show 'To be added'."
      actions={<button onClick={() => select(null)} className={`${buttonClass} bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5`}><Plus className="w-3.5 h-3.5" /> New species</button>}>
      <div className="grid lg:grid-cols-3 gap-6">
        <ul className="space-y-1.5 lg:max-h-[70vh] overflow-y-auto thin-scroll">
          {species.map((sp) => (
            <li key={sp.id}>
              <button onClick={() => select(sp)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                  selectedId === sp.id ? 'border-teal-500/50 bg-teal-500/10 text-white' : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700'}`}>
                <span className="italic font-semibold">{sp.scientific_name}</span>
                {sp.needs_review && <span className="ml-2 text-xs text-amber-300">needs review</span>}
              </button>
            </li>
          ))}
        </ul>

        {form && (
          <form onSubmit={save} className="lg:col-span-2 space-y-4">
            <Alert>{error}</Alert>
            <Alert kind="success">{notice}</Alert>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Scientific name *</label>
                <input className={`${inputClass} italic`} value={form.scientific_name || ''} onChange={set('scientific_name')} required />
              </div>
              <div>
                <label className={labelClass}>URL slug</label>
                <input className={inputClass} value={form.slug || ''} onChange={set('slug')} placeholder="auto from name" pattern="[a-z0-9\-]+" title="Lowercase letters, numbers and hyphens" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Model label (must match class_names.json, e.g. Halophila_minor)</label>
                <input className={`${inputClass} font-mono`} value={form.model_label || ''} onChange={set('model_label')} />
              </div>
              {TEXT_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input className={inputClass} value={form[key] || ''} onChange={set(key)} />
                </div>
              ))}
            </div>

            {LONG_FIELDS.map(([key, label]) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <textarea rows={2} className={`${inputClass} resize-y`} value={form[key] || ''} onChange={set(key)} />
              </div>
            ))}

            <div>
              <label className={labelClass}>Conservation guide: how people can help (one tip per line)</label>
              <textarea rows={4} className={`${inputClass} resize-y`} value={tipsText} onChange={(e) => setTipsText(e.target.value)} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {form.photo_url && <img src={form.photo_url} alt="" className="w-16 h-12 rounded-lg object-cover border border-slate-700" />}
              <label className={`${buttonClass} cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5`}>
                <Upload className="w-3.5 h-3.5" /> {form.photo_url ? 'Replace photo' : 'Upload photo'}
                <input type="file" accept={ACCEPT_ATTR} className="hidden" onChange={uploadPhoto} />
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={!!form.needs_review} onChange={set('needs_review')} />
                Needs review (shows the "draft profile" notice)
              </label>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-800">
              <button type="submit" disabled={saving} className={`${buttonClass} bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5`}>
                <Save className="w-3.5 h-3.5" /> {form.id ? 'Save changes' : 'Create species'}
              </button>
              {form.id && (
                <button type="button" onClick={remove} className={`${buttonClass} bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 flex items-center gap-1.5`}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </Panel>
  );
}
