// src/pages/SpeciesProfilePage.jsx
// Full species profile: /library/:slug
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Leaf, MapPin, Microscope, Sprout, Waves, BookMarked, Box } from 'lucide-react';
import Seagrass3DViewer from '../components/Seagrass3DViewer';
import { modelIdFor } from '../lib/seagrass3d';
import { Reveal } from '../components/motion';
import { useCatalog, TO_BE_ADDED } from '../hooks/useCatalog';
import { Fact, ConservationGuide, ReviewNotice } from '../components/SpeciesFacts';
import StationMiniMap from '../components/StationMiniMap';

function Section({ icon: Icon, title, children }) {
  return (
    <Reveal>
      <section className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Icon className="w-5 h-5 text-teal-400" />
          {title}
        </h2>
        {children}
      </section>
    </Reveal>
  );
}

const Text = ({ value, className = '' }) => (
  <p className={`text-sm leading-relaxed ${value ? 'text-slate-300' : 'italic text-slate-600'} ${className}`}>{value || TO_BE_ADDED}</p>
);

export default function SpeciesProfilePage() {
  const { slug } = useParams();
  const { species, loading, error, stationsForSpecies } = useCatalog();
  const sp = species.find((s) => s.slug === slug);

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 w-full"><div className="skeleton h-72 rounded-2xl" /></div>;
  }

  if (!sp) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Species not found</h1>
        <p className="text-sm text-slate-400">{error ? `The catalogue could not be loaded (${error}).` : 'This species is not in the library.'}</p>
        <Link to="/library" className="inline-flex items-center gap-2 text-teal-300 hover:text-teal-200 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to the Digital Library
        </Link>
      </div>
    );
  }

  const stations = stationsForSpecies(sp.id);
  const modelId = modelIdFor(sp.scientific_name);
  const unpinned = stations.filter((s) => s.latitude === null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-16">
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800/80 py-10">
        <div className="caustic absolute -top-28 left-1/4 w-[34rem] h-[34rem] rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-5 gap-8 items-center">
          <div className="md:col-span-3 space-y-3">
            <Link to="/library" className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-teal-200">
              <ArrowLeft className="w-3.5 h-3.5" /> Digital Library
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold italic text-white tracking-tight">{sp.scientific_name}</h1>
            <p className="text-sm text-slate-400">
              <span className="text-slate-500">Common name:</span>{' '}
              {sp.common_name || <span className="italic text-slate-600">{TO_BE_ADDED}</span>}
              {sp.local_name && <> · <span className="text-slate-500">Local:</span> <span className="text-cyan-300 font-semibold">{sp.local_name}</span></>}
            </p>
            {sp.leaf_shape && (
              <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{sp.leaf_shape}</span>
            )}
            <ReviewNotice species={sp} />
            <Link to="/scanner" className="cta inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold">
              <Camera className="w-4 h-4" /> Identify a sample
            </Link>
          </div>
          <div className="md:col-span-2">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              {sp.photo_url ? (
                <img src={sp.photo_url} alt={sp.scientific_name} className="img-settle w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-teal-300/40 bg-gradient-to-br from-slate-900 to-teal-950/40">
                  <Sprout className="w-14 h-14" />
                  <span className="text-xs text-slate-600">Photo to be added</span>
                </div>
              )}
            </div>
            {sp.photo_credit && <p className="text-[11px] text-slate-600 mt-1.5">Photo: {sp.photo_credit}</p>}
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {modelId && (
          <Section icon={Box} title="3D model (life size)">
            <Seagrass3DViewer modelId={modelId} scientificName={sp.scientific_name} />
          </Section>
        )}

        <Section icon={Microscope} title="Morphology">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Fact label="Leaf morphology" value={sp.leaf_morphology} wide />
            <Fact label="Blade length" value={sp.blade_length} />
            <Fact label="Blade width" value={sp.blade_width} />
            <Fact label="Venation" value={sp.venation} />
            <Fact label="Leaf margin" value={sp.leaf_margin} />
            <Fact label="Rhizome structure" value={sp.rhizome_structure} wide />
            <Fact label="Sheath characteristics" value={sp.sheath_characteristics} wide />
            <Fact label="Reproductive organs" value={sp.reproductive_organs} wide />
          </div>
        </Section>

        <Section icon={Waves} title="Ecological role">
          <Text value={sp.ecological_role} />
        </Section>

        <Section icon={MapPin} title="Distribution and survey stations">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Geographic distribution</p>
            <Text value={sp.geographic_distribution} />
          </div>
          {sp.local_distribution_note && (
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Pujada Bay</p>
              <Text value={sp.local_distribution_note} />
            </div>
          )}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verified survey stations</p>
            {stations.length ? (
              <>
                <StationMiniMap stations={stations} />
                <ul className="grid sm:grid-cols-2 gap-2">
                  {stations.map((st) => (
                    <li key={st.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="font-semibold text-slate-200">{st.name}</span>
                      <span className="block text-slate-500 mt-0.5">
                        {st.station_species.filter((l) => l.species_id === sp.id).map((l) => l.source).join('; ')}
                      </span>
                      {st.latitude === null && <span className="block text-slate-600 italic mt-0.5">Coordinates to be added</span>}
                    </li>
                  ))}
                </ul>
                {unpinned.length > 0 && stations.length === unpinned.length && (
                  <p className="text-xs text-slate-600 italic">The map will appear once station coordinates are added.</p>
                )}
              </>
            ) : (
              <p className="text-sm italic text-slate-600">{TO_BE_ADDED}</p>
            )}
            <Link to="/map" className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-teal-200">
              <Leaf className="w-3.5 h-3.5" /> Open the full distribution map
            </Link>
          </div>
        </Section>

        <Reveal><ConservationGuide species={sp} /></Reveal>

        <Section icon={BookMarked} title="Sources">
          {/* One reference per line, as entered. */}
          <Text value={sp.sources} className="whitespace-pre-line" />
        </Section>
      </main>
    </div>
  );
}
