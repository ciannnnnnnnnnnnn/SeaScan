// src/pages/DigitalLibraryPage.jsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  BookOpen,
  MapPin,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
  Compass,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

// The 9 Native Seagrass Species of Pujada Bay / Mati City
const seagrassSpeciesCatalog = [
  {
    id: 'sp-1',
    sciname: 'Enhalus acoroides',
    localName: 'Lagu-lagu',
    englishName: 'Tropical Eelgrass',
    leafShape: 'Ribbon-like',
    stations: ['Station 1 - Lawigan', 'Station 3 - Pujada Island'],
    thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    morphologyTag: 'Ribbon-like, coarse sheath base',
    bladeLength: '30 - 150 cm',
    leafWidth: '1.2 - 2.0 cm',
    veinCount: 'Direct parallel veins',
    margin: 'Slightly serrated near apex',
    ecologicalRole: 'Provides key nursery grounds for juvenile fish and dugongs; high carbon sequestration potential.',
    pujadaNote: 'Abundant in soft muddy substrates near the inner basin of Lawigan and sheltered coves of Pujada Island.'
  },
  {
    id: 'sp-2',
    sciname: 'Thalassia hemprichii',
    localName: 'Pugai',
    englishName: 'Pacific Turtle Grass',
    leafShape: 'Ribbon-like',
    stations: ['Station 1 - Lawigan', 'Station 2 - Taganilao'],
    thumbnail: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=600&q=80',
    morphologyTag: 'Slightly curved blades, dark flecks',
    bladeLength: '10 - 40 cm',
    leafWidth: '0.4 - 1.0 cm',
    veinCount: '10 - 17 veins',
    margin: 'Smooth or micro-serrated apex',
    ecologicalRole: 'Primary dietary staple for green sea turtles (*Chelonia mydas*) in shallow reef flats.',
    pujadaNote: 'Dominant species in intertidal reef flats across Taganilao and Lawigan coastlines.'
  },
  {
    id: 'sp-3',
    sciname: 'Halophila ovalis',
    localName: 'Puso-puso',
    englishName: 'Paddle Weed',
    leafShape: 'Oval',
    stations: ['Station 2 - Taganilao', 'Station 3 - Pujada Island'],
    thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80',
    morphologyTag: 'Paired paddle-shaped leaves',
    bladeLength: '1 - 4 cm',
    leafWidth: '0.5 - 2.0 cm',
    veinCount: '10 - 25 cross veins',
    margin: 'Smooth margins',
    ecologicalRole: 'Pioneer species that stabilizes disturbed sandy sediments and re-establishes degraded meadows.',
    pujadaNote: 'Found in sandy patches subject to moderate wave exposure in Pujada Island.'
  },
  {
    id: 'sp-4',
    sciname: 'Halophila spinulosa',
    localName: 'Puso-puso Fern',
    englishName: 'Fern Seagrass',
    leafShape: 'Oval',
    stations: ['Station 3 - Pujada Island'],
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    morphologyTag: 'Fern-like opposite leaf clusters',
    bladeLength: '2 - 5 cm',
    leafWidth: '0.2 - 0.5 cm',
    veinCount: '4 - 5 cross veins',
    margin: 'Serrated leaf margins',
    ecologicalRole: 'Subtidal specialist that supports small invertebrate populations and epiphytic algae.',
    pujadaNote: 'Restricted to deeper, clearer waters along the sheltered drop-offs of Pujada Island.'
  },
  {
    id: 'sp-5',
    sciname: 'Cymodocea rotundata',
    localName: 'Lusay',
    englishName: 'Smooth Ribbon Seagrass',
    leafShape: 'Ribbon-like',
    stations: ['Station 1 - Lawigan', 'Station 2 - Taganilao'],
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    morphologyTag: 'Smooth, rounded leaf tip',
    bladeLength: '7 - 15 cm',
    leafWidth: '0.2 - 0.4 cm',
    veinCount: '9 - 13 veins',
    margin: 'Smooth, smooth leaf sheath',
    ecologicalRole: 'Forms dense meadows that trap fine silt and prevent coastal erosion.',
    pujadaNote: 'Common in shallow sandy-muddy intertidal zones of Taganilao.'
  },
  {
    id: 'sp-6',
    sciname: 'Cymodocea serrulata',
    localName: 'Lusay Serrated',
    englishName: 'Serrated Ribbon Seagrass',
    leafShape: 'Ribbon-like',
    stations: ['Station 2 - Taganilao'],
    thumbnail: 'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=600&q=80',
    morphologyTag: 'Distinctly serrated tip, wide blade',
    bladeLength: '6 - 15 cm',
    leafWidth: '0.4 - 0.9 cm',
    veinCount: '13 - 17 veins',
    margin: 'Distinctly serrated tips',
    ecologicalRole: 'High leaf productivity contributing significant organic detritus to coastal food webs.',
    pujadaNote: 'Frequent in sublittoral sandy beds near Taganilao fishing reserves.'
  },
  {
    id: 'sp-7',
    sciname: 'Syringodium isoetifolium',
    localName: 'Tubong-tubong',
    englishName: 'Noodle Seagrass',
    leafShape: 'Cylindrical',
    stations: ['Station 1 - Lawigan', 'Station 3 - Pujada Island'],
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    morphologyTag: 'Cylindrical, spaghetti-like blades',
    bladeLength: '7 - 30 cm',
    leafWidth: '0.1 - 0.2 cm (diameter)',
    veinCount: 'Central vascular bundle',
    margin: 'Smooth round cross-section',
    ecologicalRole: 'Adapts well to strong currents; provides habitat for juvenile pipefish and seahorses.',
    pujadaNote: 'Thrives in high-energy channels with moderate to strong tidal flow near Pujada Island.'
  },
  {
    id: 'sp-8',
    sciname: 'Halodule uninervis',
    localName: 'Lusay-pino',
    englishName: 'Narrow-leaf Seagrass',
    leafShape: 'Ribbon-like',
    stations: ['Station 1 - Lawigan', 'Station 2 - Taganilao'],
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    morphologyTag: 'Three-toothed tip, narrow blade',
    bladeLength: '6 - 15 cm',
    leafWidth: '0.1 - 0.35 cm',
    veinCount: '3 distinct veins',
    margin: 'Tridentate (3-toothed) apex',
    ecologicalRole: 'Pioneer colonizer capable of rapid horizontal rhizome extension.',
    pujadaNote: 'Widespread across intertidal sandy flats in Lawigan.'
  },
  {
    id: 'sp-9',
    sciname: 'Halodule pinifolia',
    localName: 'Lusay-pino Fine',
    englishName: 'Fine-leaf Seagrass',
    leafShape: 'Ribbon-like',
    stations: ['Station 2 - Taganilao', 'Station 3 - Pujada Island'],
    thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    morphologyTag: 'Hair-like ultra fine blades',
    bladeLength: '5 - 20 cm',
    leafWidth: '0.06 - 0.12 cm',
    veinCount: '1 central vein',
    margin: 'Slightly serrated tip',
    ecologicalRole: 'Tolerates extreme salinities and exposure during low spring tides.',
    pujadaNote: 'Forms delicate carpets in shallow upper intertidal zones across Pujada Island.'
  }
];

export default function DigitalLibraryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShape, setSelectedShape] = useState('All Shapes');
  const [selectedStation, setSelectedStation] = useState('All Stations');
  const [activeModalSpecies, setActiveModalSpecies] = useState(null);

  // Filter Logic
  const filteredSpecies = useMemo(() => {
    return seagrassSpeciesCatalog.filter((sp) => {
      const matchesSearch = 
        sp.sciname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.localName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.englishName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesShape = selectedShape === 'All Shapes' || sp.leafShape === selectedShape;
      
      const matchesStation = selectedStation === 'All Stations' || 
        sp.stations.some(s => s.includes(selectedStation));

      return matchesSearch && matchesShape && matchesStation;
    });
  }, [searchTerm, selectedShape, selectedStation]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      
      {/* HEADER HERO BANNER */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-teal-400 font-semibold text-xs tracking-widest uppercase">
            <BookOpen className="w-4 h-4" />
            <span>SeaScan Species Catalog</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Digital Botanical Library
          </h1>
          
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Comprehensive botanical guide for the 9 baseline seagrass species native to Pujada Bay, Mati City. 
            Includes morphological parameters, local nomenclature, and marine conservation notes.
          </p>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 1. SEARCH & FILTER BAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by scientific name (e.g. Enhalus) or local name (e.g. Lagu-lagu)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Leaf Shape Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedShape}
                onChange={(e) => setSelectedShape(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500 transition"
              >
                <option value="All Shapes">All Leaf Shapes</option>
                <option value="Ribbon-like">Ribbon-like</option>
                <option value="Oval">Oval / Paddle-shaped</option>
                <option value="Cylindrical">Cylindrical / Tubular</option>
              </select>
            </div>

            {/* Station Filter */}
            <div className="md:col-span-3">
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500 transition"
              >
                <option value="All Stations">All Sampling Stations</option>
                <option value="Lawigan">Station 1 - Lawigan</option>
                <option value="Taganilao">Station 2 - Taganilao</option>
                <option value="Pujada Island">Station 3 - Pujada Island</option>
              </select>
            </div>

          </div>

          {/* Active Filter Chips & Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 font-medium">
              Showing <strong className="text-teal-400">{filteredSpecies.length}</strong> of 9 native species
            </span>

            {(selectedShape !== 'All Shapes' || selectedStation !== 'All Stations' || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedShape('All Shapes');
                  setSelectedStation('All Stations');
                }}
                className="text-[11px] text-teal-400 hover:text-teal-300 underline font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* 2. THE 9 NATIVE SPECIES GRID */}
        {filteredSpecies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpecies.map((species) => (
              
              /* 3. SPECIES CARD DESIGN */
              <div 
                key={species.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition shadow-lg flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail & Quick Shape Tag */}
                  <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                    <img 
                      src={species.thumbnail} 
                      alt={species.sciname}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-lg px-2.5 py-1 text-[10px] font-semibold text-teal-300">
                      {species.leafShape}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold italic text-white group-hover:text-teal-300 transition">
                        {species.sciname}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium pt-0.5">
                        <span className="text-cyan-400">{species.localName}</span>
                        <span>•</span>
                        <span>{species.englishName}</span>
                      </div>
                    </div>

                    {/* Quick Leaf Morphology Tag */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Morphology Tag</div>
                      <div className="font-medium text-slate-200">{species.morphologyTag}</div>
                    </div>

                    {/* Primary Station Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{species.stations.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => setActiveModalSpecies(species)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-teal-600 hover:text-white text-teal-300 font-semibold text-xs transition flex items-center justify-center gap-2 group-hover:shadow-md"
                  >
                    <span>View Botanical Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-3">
            <Info className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Species Found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or leaf shape filters.</p>
          </div>
        )}

      </main>

      {/* 4. DETAILED SPECIES BOTANICAL DRAWER / MODAL */}
      {activeModalSpecies && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div>
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-800">
                  Botanical Profile
                </span>
                <h2 className="text-2xl font-extrabold italic text-white mt-2">
                  {activeModalSpecies.sciname}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Local: <strong className="text-cyan-300">{activeModalSpecies.localName}</strong> | English: {activeModalSpecies.englishName}
                </p>
              </div>

              <button
                onClick={() => setActiveModalSpecies(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs text-slate-300">
              
              {/* Image Banner */}
              <div className="aspect-video rounded-xl bg-black overflow-hidden border border-slate-800">
                <img 
                  src={activeModalSpecies.thumbnail} 
                  alt={activeModalSpecies.sciname} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Morphological Feature Breakdown Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Key Morphological Features
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Blade Length</span>
                    <div className="font-bold text-slate-200 mt-0.5">{activeModalSpecies.bladeLength}</div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Blade Width</span>
                    <div className="font-bold text-slate-200 mt-0.5">{activeModalSpecies.leafWidth}</div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Vein Structure</span>
                    <div className="font-bold text-slate-200 mt-0.5">{activeModalSpecies.veinCount}</div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Leaf Margin</span>
                    <div className="font-bold text-slate-200 mt-0.5">{activeModalSpecies.margin}</div>
                  </div>
                </div>
              </div>

              {/* Ecological Role */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Ecological Role & Significance
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  {activeModalSpecies.ecologicalRole}
                </p>
              </div>

              {/* Pujada Bay Distribution Notes */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Pujada Bay Distribution & Habitat Notes
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  {activeModalSpecies.pujadaNote}
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  {activeModalSpecies.stations.map((st, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-medium">
                      {st}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setActiveModalSpecies(null)}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}