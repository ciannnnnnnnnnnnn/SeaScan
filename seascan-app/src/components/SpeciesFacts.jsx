// src/components/SpeciesFacts.jsx
// Species profile building blocks shared by the Scanner result and the
// Digital Library profile page. Empty fields read "To be added" so missing
// research content is visible instead of silently hidden.
import React from 'react';
import { HeartHandshake, ShieldCheck, Info } from 'lucide-react';
import { TO_BE_ADDED } from '../hooks/useCatalog';

export function Fact({ label, value, wide = false }) {
  const missing = value === null || value === undefined || value === '';
  return (
    <div className={`bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 ${wide ? 'sm:col-span-2' : ''}`}>
      <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{label}</div>
      <div className={`text-xs mt-1 leading-relaxed ${missing ? 'text-slate-600 italic' : 'font-semibold text-slate-200'}`}>
        {missing ? TO_BE_ADDED : value}
      </div>
    </div>
  );
}

/** Banner for profiles whose text has not been checked against the sources yet. */
export function ReviewNotice({ species }) {
  if (!species?.needs_review) return null;
  return (
    <p className="text-xs text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2 flex items-start gap-2">
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      Draft profile: this information is awaiting verification by the SeaScan research team.
    </p>
  );
}

/** What the species does for the ecosystem and how people can protect it. */
export function ConservationGuide({ species }) {
  const tips = (species?.conservation_tips || []).filter(Boolean);
  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 space-y-4">
      <h4 className="text-sm font-bold text-white flex items-center gap-2">
        <HeartHandshake className="w-4 h-4 text-emerald-400" />
        Conservation guide
      </h4>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-slate-400">Conservation status:</span>
        <span className={species?.conservation_status ? 'font-semibold text-slate-200' : 'italic text-slate-600'}>
          {species?.conservation_status || TO_BE_ADDED}
        </span>
      </div>

      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Why it matters</p>
        <p className={`text-xs leading-relaxed ${species?.ecosystem_contribution ? 'text-slate-300' : 'italic text-slate-600'}`}>
          {species?.ecosystem_contribution || TO_BE_ADDED}
        </p>
      </div>

      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">How you can help</p>
        {tips.length ? (
          <ul className="space-y-1.5">
            {tips.map((tip) => (
              <li key={tip} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs italic text-slate-600">{TO_BE_ADDED}</p>
        )}
      </div>
    </div>
  );
}
