// src/pages/DigitalLibraryPage.jsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, BookOpen, MapPin, Info, ChevronRight, Sprout, AlertCircle } from 'lucide-react';
import { Reveal } from '../components/motion';
import { useCatalog } from '../hooks/useCatalog';

const ALL = 'all';

export default function DigitalLibraryPage() {
  const { species, loading, error, stationsForSpecies } = useCatalog();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShape, setSelectedShape] = useState(ALL);
  const [selectedStatus, setSelectedStatus] = useState(ALL);

  // Filter choices come from the data, so new values appear automatically.
  const shapes = useMemo(() => [...new Set(species.map((s) => s.leaf_shape).filter(Boolean))].sort(), [species]);
  const statuses = useMemo(() => [...new Set(species.map((s) => s.conservation_status).filter(Boolean))].sort(), [species]);

  const filteredSpecies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return species.filter((sp) => {
      const matchesSearch = !q || [sp.scientific_name, sp.common_name, sp.local_name]
        .some((name) => name?.toLowerCase().includes(q));
      const matchesShape = selectedShape === ALL || sp.leaf_shape === selectedShape;
      const matchesStatus = selectedStatus === ALL || sp.conservation_status === selectedStatus;
      return matchesSearch && matchesShape && matchesStatus;
    });
  }, [species, searchTerm, selectedShape, selectedStatus]);

  const filtersActive = searchTerm || selectedShape !== ALL || selectedStatus !== ALL;
  const selectClass = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500 transition-colors';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">

      {/* HEADER HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800/80 py-14">
        <div className="absolute -top-28 left-1/4 w-[34rem] h-[34rem] rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs tracking-widest uppercase">
            <BookOpen className="w-4 h-4" />
            <span>SeaScan Species Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Digital Botanical Library
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            The nine seagrass species of Pujada Bay, Mati City: morphology, ecology,
            conservation status, survey stations and how you can help protect them.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* SEARCH & FILTER BAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Search species"
                placeholder="Search by scientific, common or local name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="md:col-span-3">
              <select aria-label="Leaf shape" value={selectedShape} onChange={(e) => setSelectedShape(e.target.value)} className={selectClass}>
                <option value={ALL}>All leaf shapes</option>
                {shapes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <select aria-label="Conservation status" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={selectClass}>
                <option value={ALL}>All conservation statuses</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                {statuses.length === 0 && <option disabled>(statuses to be added)</option>}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 font-medium">
              Showing <strong className="text-teal-400">{filteredSpecies.length}</strong> of {species.length} species
            </span>
            {filtersActive && (
              <button
                onClick={() => { setSearchTerm(''); setSelectedShape(ALL); setSelectedStatus(ALL); }}
                className="text-xs text-teal-400 hover:text-teal-300 underline font-medium"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            The species catalogue could not be loaded ({error}). Please try again later.
          </div>
        )}

        {/* SPECIES GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-80 rounded-2xl" />)}
          </div>
        ) : filteredSpecies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpecies.map((sp, i) => {
              const stations = stationsForSpecies(sp.id);
              return (
                <Reveal key={sp.id} delay={(i % 3) * 60} className="h-full">
                  <Link
                    to={`/library/${sp.slug}`}
                    className="h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500/40 shadow-lg flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                        {sp.photo_url ? (
                          <img src={sp.photo_url} alt={sp.scientific_name} loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-900 to-teal-950/40 text-teal-300/40">
                            <Sprout className="w-12 h-12" />
                            <span className="text-xs text-slate-600">Photo to be added</span>
                          </div>
                        )}
                        {sp.leaf_shape && (
                          <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-teal-300">
                            {sp.leaf_shape}
                          </div>
                        )}
                      </div>

                      <div className="p-5 space-y-3">
                        <div>
                          <h2 className="text-lg font-bold italic text-white group-hover:text-teal-300 transition">
                            {sp.scientific_name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400 font-medium pt-0.5">
                            {sp.common_name ? <span>{sp.common_name}</span> : <span className="italic text-slate-600">Common name to be added</span>}
                            {sp.local_name && <><span>•</span><span className="text-cyan-400">{sp.local_name}</span></>}
                          </div>
                        </div>

                        {sp.leaf_morphology && (
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                            {sp.leaf_morphology}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">
                            {stations.length ? stations.map((s) => s.name).join(', ') : 'Survey stations to be added'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <span className="w-full py-2.5 px-4 rounded-xl bg-slate-800 group-hover:bg-teal-500 group-hover:text-slate-950 text-teal-300 font-bold text-xs transition-colors flex items-center justify-center gap-2">
                        View species profile
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-3">
            <Info className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No species found</h3>
            <p className="text-xs text-slate-500">Try a different name or clear the filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
