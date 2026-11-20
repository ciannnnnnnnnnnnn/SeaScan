// src/components/StationPanel.jsx
// Details of the selected survey station on the Distribution Map: name, where
// it is, the species recorded there (each opening its library profile), and a
// switch that shows or hides the study the record comes from. Shown as a panel
// docked inside the map (not a Leaflet popup), so it is always fully visible.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronDown, ChevronRight, BookMarked, Leaf, X } from 'lucide-react';

export default function StationPanel({ station, speciesById, onClose }) {
  const [showStudy, setShowStudy] = useState(false);

  // One entry per species, with every study that recorded it at this station.
  const records = station.speciesIds
    .map((id) => ({
      species: speciesById(id),
      sources: (station.station_species || []).filter((l) => l.species_id === id).map((l) => l.source),
    }))
    .filter((r) => r.species)
    .sort((a, b) => a.species.scientific_name.localeCompare(b.species.scientific_name));

  return (
    <section aria-label={`Survey station ${station.name}`} className="text-slate-300 font-sans">
      {/* Name and location */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-white leading-snug">{station.name}</h3>
        <button type="button" onClick={onClose} aria-label="Close station details"
          className="-mt-1 -mr-1 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed">
        <MapPin className="w-3.5 h-3.5 mt-px shrink-0 text-cyan-400" />
        {station.location
          ? <span className="text-slate-300">{station.location}</span>
          : <span className="italic text-slate-500">Location to be added</span>}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        Verified survey station · <span className="text-cyan-300 font-semibold tabular-nums">{records.length}</span> species
      </p>

      {/* Species, collapsed until the visitor opens it */}
      <details className="group mt-3 rounded-xl border border-slate-700/80 bg-slate-950/50">
        <summary className="list-none cursor-pointer select-none flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-slate-200">
          <span className="flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-teal-400" /> Species recorded ({records.length})
          </span>
          <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
        </summary>
        {records.length ? (
          <ul className="px-1.5 pb-1.5 space-y-0.5">
            {records.map(({ species, sources }) => (
              <li key={species.id}>
                <Link
                  to={`/library/${species.slug}`}
                  title={`Open the ${species.scientific_name} profile`}
                  className="group/sp flex items-start gap-2 rounded-lg px-1.5 py-1.5 hover:bg-slate-800/80 transition-colors"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs italic font-semibold text-slate-100 group-hover/sp:text-teal-300">
                      {species.scientific_name}
                    </span>
                    {species.common_name && <span className="block text-[11px] text-slate-500">{species.common_name}</span>}
                    {showStudy && sources.length > 0 && (
                      <span className="block text-[11px] text-cyan-300/80 mt-0.5">{sources.join('; ')}</span>
                    )}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-600 group-hover/sp:text-teal-300" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 pb-2.5 text-xs italic text-slate-500">Species list to be added</p>
        )}
      </details>

      {/* Study switch */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <BookMarked className="w-3.5 h-3.5" /> Show study
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={showStudy}
          aria-label="Show the study for this station"
          onClick={() => setShowStudy((v) => !v)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${showStudy ? 'bg-teal-500' : 'bg-slate-700'}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${showStudy ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {showStudy && (
        <div className="mt-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 space-y-1.5 text-[11px] leading-relaxed">
          <p className="font-semibold text-cyan-300">Study</p>
          {station.sources?.length
            ? <ul className="space-y-0.5 text-slate-300">{station.sources.map((s) => <li key={s}>{s}</li>)}</ul>
            : <p className="italic text-slate-500">Source to be added</p>}
          {station.notes && <p className="text-slate-400">{station.notes}</p>}
        </div>
      )}
    </section>
  );
}
