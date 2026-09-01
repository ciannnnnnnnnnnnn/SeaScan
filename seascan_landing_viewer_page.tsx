import React, { useState, useEffect } from 'react';
import { 
  Waves, 
  Camera, 
  BookOpen, 
  MapPin, 
  Shield, 
  LogIn, 
  Menu, 
  X, 
  Upload, 
  Search, 
  Filter, 
  CheckCircle2, 
  Info, 
  Sparkles, 
  Compass, 
  ArrowRight, 
  ChevronRight, 
  Award, 
  Eye, 
  Activity,
  UserCheck,
  UserCheck2,
  Lock,
  Layers,
  FileText
} from 'lucide-react';

// --- MOCK SPECIES DATA (9 Native Pujada Bay Species) ---
const SEAGRASS_SPECIES = [
  {
    id: 'ea',
    scientificName: 'Enhalus acoroides',
    commonName: 'Tape Seagrass',
    localName: 'Laway-laway / Lusay',
    family: 'Hydrocharitaceae',
    morphology: 'Very long ribbon-like leaves (up to 1m), thick persistent rhizomes with stiff black fibers.',
    habitat: 'Muddy and sandy substrate, intertidal to shallow subtidal zones.',
    ecologicalRole: 'High carbon sequestration capacity, juvenile fish habitat, sediment stabilization.',
    status: 'Least Concern (IUCN)',
    stationsFound: ['Lawigan', 'Taganilao'],
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    imgUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'th',
    scientificName: 'Thalassia hemprichii',
    commonName: 'Pacific Turtle Grass',
    localName: 'Lusay',
    family: 'Hydrocharitaceae',
    morphology: 'Falcate (sickle-shaped) leaves with black tannin cells or specks; prominent thick rhizomes with short shoots.',
    habitat: 'Reef flats, shallow subtidal waters with coarse sand and coral rubble.',
    ecologicalRole: 'Primary food source for green sea turtles (Chelonia mydas) and dugongs; sediment trap.',
    status: 'Least Concern (IUCN)',
    stationsFound: ['Lawigan', 'Taganilao', 'Pujada Island'],
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    imgUrl: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'ho',
    scientificName: 'Halophila ovalis',
    commonName: 'Paddlegrass',
    localName: 'Dungon-dungon',
    family: 'Hydrocharitaceae',
    morphology: 'Small oval paired leaves with 10–25 cross-veins; thin delicate rhizome.',
    habitat: 'Intertidal mudflats to deep subtidal environments; highly adaptable Pioneer species.',
    ecologicalRole: 'Rapid substrate recolonizer, key grazing resource for dugongs.',
    status: 'Least Concern (IUCN)',
    stationsFound: ['Taganilao', 'Pujada Island'],
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    imgUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'hs',
    scientificName: 'Halophila spinulosa',
    commonName: 'Fern Seagrass',
    localName: 'Fern Lusay',
    family: 'Hydrocharitaceae',
    morphology: 'Distinct fern-like structure with opposite serrated leaflets along an erect shoot.',
    habitat: 'Sheltered deeper waters, sandy-mud sediments.',
    ecologicalRole: 'Provides vertical micro-habitat structural complexity for benthic invertebrates.',
    status: 'Least Concern (IUCN)',
    stationsFound: ['Pujada Island'],
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    imgUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'hu',
    scientificName: 'Halodule uninervis',
    commonName: 'Narrowleaf Seagrass',
    localName: 'Pana-pana',
    family: 'Cymodoceaceae',
    morphology: 'Linear narrow leaf blade with 3 tridentate leaf tips (black central vein prominent).',
    habitat: 'Exposed reef flats, sandy intertidal zones.',
    ecologicalRole: 'High disturbance tolerance, fast rhizome expansion prevents shoreline erosion.',
    status: 'Least Concern (IUCN)',
    stationsFound: ['Lawigan', 'Pujada Island'],
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    imgUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'hp',
    scientificName: 'Halodule pinifolia',
    commonName: 'Fine Needle Seagrass',
    localName: 'Gamot-lupa',
    family: 'Cymodoceaceae',
    morphology: 'Extremely thin hair-like blades (< 1mm wide) with serrated/rounded tips.',
    habitat: 'Shallow calm sandy waters, upper intertidal flats.',
    ecologicalRole: 'Forms dense carpet mats that trap silt particles.',
    status: 'Least Concern (IUCN)',
    stationsFound: ['Taganilao'],
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    imgUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cs',
    scientificName: 'Cymodocea serrulata',
    commonName: 'Serrated Ribbon Seagrass',
    localName: 'Lusay Serrada',
    family: 'Cymodoceaceae',
    morphology: 'Flat linear leaves with serrated/toothed apex; broad triangular leaf sheath leaving complete scars.',
    habitat: 'Subtidal sandy to muddy bottoms.',
    ecologicalRole: 'Benthic nursery grounds for juvenile blue swimming crabs and penaeid shrimps.',
    status: 'Least Concern (IUCN)',
    stationsFound: ['Lawigan', 'Taganilao'],
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    imgUrl: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cr',
    scientificName: 'Cymodocea rotundata',
    commonName: 'Smooth Ribbon Seagrass',
    localName: 'Lusay Malinis',
    family: 'Cymodoceaceae',
    morphology: 'Smooth rounded leaf apex without serrations; persistent closed leaf sheaths.',
    habitat: 'Shallow marine sheltered lagoons and coral reef crests.',
    ecologicalRole: 'Supports epiphytic microalgae biodiversity, vital lower trophic level base.',
    status: 'Least Concern (IUCN)',
    stationsFound: ['Lawigan', 'Pujada Island'],
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    imgUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'si',
    scientificName: 'Syringodium isoetifolium',
    commonName: 'Noodle / Syringe Seagrass',
    localName: 'Arayis / Tubo-tubo',
    family: 'Cymodoceaceae',
    morphology: 'Distinct cylindrical (spaghetti-like) hollow cross-section leaves; flexible in strong currents.',
    habitat: 'Subtidal zones with high water flow and sandy seabed.',
    ecologicalRole: 'Buffers wave momentum, dampens hydrodynamics protecting fragile coral reefs.',
    status: 'Least Concern (IUCN)',
    stationsFound: ['Pujada Island', 'Taganilao'],
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    imgUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'
  }
];

// --- MOCK SURVEY STATIONS DATA ---
const SURVEY_STATIONS = [
  {
    id: 'st-1',
    name: 'Station 1: Lawigan Coastal Area',
    coordinates: '6.8521° N, 126.2410° E',
    type: 'Intertidal Mudflat / Reef Crest',
    dominantSpecies: 'Enhalus acoroides, Thalassia hemprichii, Cymodocea serrulata',
    historicalSource: 'Angsinco-Jimenez et al. Survey (2018)',
    healthIndex: '88% Cover (Good Condition)',
    color: 'from-blue-600 to-teal-500'
  },
  {
    id: 'st-2',
    name: 'Station 2: Taganilao Mangrove Margin',
    coordinates: '6.8942° N, 126.2133° E',
    type: 'Estuarine Sand-Mud Flat',
    dominantSpecies: 'Halophila ovalis, Halodule pinifolia, Enhalus acoroides',
    historicalSource: 'Sanchez-Delute et al. Coastal Assessment',
    healthIndex: '76% Cover (Moderate Disturbance)',
    color: 'from-emerald-600 to-teal-600'
  },
  {
    id: 'st-3',
    name: 'Station 3: Pujada Island Marine Protected Reserve',
    coordinates: '6.8012° N, 126.2618° E',
    type: 'Subtidal Sandy Lagoon',
    dominantSpecies: 'Thalassia hemprichii, Syringodium isoetifolium, Halophila spinulosa',
    healthIndex: '94% Cover (Pristine Protected)',
    historicalSource: 'DENR CMEMP Monitoring Grid',
    color: 'from-cyan-600 to-blue-700'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // home, scanner, library, map, about
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('researcher'); // admin, researcher, public

  // Digital Library Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');
  const [familyFilter, setFamilyFilter] = useState('ALL');

  // Scanner Simulator States
  const [scanImage, setScanImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Selected Station for Interactive Map Simulator
  const [activeStation, setActiveStation] = useState(SURVEY_STATIONS[0]);

  // Smooth scroll helper
  const navigateToTab = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mock AI Image Recognition Trigger
  const handleSimulatedScan = (speciesObj = null) => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      // Pick provided or random species
      const matched = speciesObj || SEAGRASS_SPECIES[Math.floor(Math.random() * SEAGRASS_SPECIES.length)];
      setScanResult({
        species: matched,
        confidence: (89.4 + Math.random() * 8.5).toFixed(1),
        model: 'MobileNetV3-Seagrass-v2',
        inferenceTime: '184 ms',
        leafFeatures: [
          'Parallel venation verified',
          'Serrated apical margin absent',
          'Rhizome scarring consistent'
        ]
      });
      setIsScanning(false);
    }, 1800);
  };

  // Filtered Species for Library View
  const filteredSpecies = SEAGRASS_SPECIES.filter((s) => {
    const matchesSearch = 
      s.scientificName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.commonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.localName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStation = stationFilter === 'ALL' || s.stationsFound.some((st) => st.includes(stationFilter));
    const matchesFamily = familyFilter === 'ALL' || s.family === familyFilter;

    return matchesSearch && matchesStation && matchesFamily;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-teal-500 selection:text-white flex flex-col">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. STICKY TOP NAVIGATION BAR BAR */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Academic Badge */}
          <div 
            onClick={() => navigateToTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-900/10 group-hover:scale-105 transition-transform">
              <Waves className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-2xl tracking-tight text-slate-900 font-serif">SeaScan</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-teal-100 text-teal-800 rounded-full border border-teal-200">
                  Mati City
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Pujada Bay Seagrass ID System • DORSU
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/80">
            {[
              { id: 'home', label: 'Home' },
              { id: 'scanner', label: 'CNN Scanner', icon: Camera },
              { id: 'library', label: 'Digital Library', icon: BookOpen },
              { id: 'map', label: 'Distribution Map', icon: MapPin },
              { id: 'about', label: 'About Pujada Bay', icon: Info },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => navigateToTab(link.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-900 to-teal-950 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-300' : 'text-slate-500'}`} />}
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action Button: Login Modal Gate */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-700 hover:text-teal-900 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 transition-all shadow-sm flex items-center gap-2 group"
            >
              <LogIn className="w-3.5 h-3.5 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
              <span>Portal Login</span>
            </button>
          </div>

          {/* Mobile Navigation Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
            {[
              { id: 'home', label: 'Home' },
              { id: 'scanner', label: 'CNN AI Scanner', icon: Camera },
              { id: 'library', label: 'Digital Library (9 Species)', icon: BookOpen },
              { id: 'map', label: 'Distribution Heatmap', icon: MapPin },
              { id: 'about', label: 'About Pujada Bay', icon: Info },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => navigateToTab(link.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3 ${
                    activeTab === link.id ? 'bg-teal-50 text-teal-900 border border-teal-200' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 text-teal-600" />}
                  {link.label}
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <LogIn className="w-4 h-4 text-teal-400" />
                Researcher & Admin Portal Access
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA CONTAINER */}
      <main className="flex-1">

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: HOME PAGE (Hero, Core Features, Stats, Showcase) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'home' && (
          <div className="space-y-20 pb-20">
            
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-teal-950 to-slate-900 text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
              {/* Background Ambient SVG Waves */}
              <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                  <path d="M0,100 C150,200 350,0 500,100 C650,200 900,50 1000,100 L1000,1000 L0,1000 Z" fill="currentColor" className="text-teal-300" />
                </svg>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 items-center">
                  
                  {/* Left Column Text Content */}
                  <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
                      <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                      <span>MobileNetV3 Powered Visual Recognition System</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] font-serif">
                      Automated Seagrass Identification & Coastal Monitoring for <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-200 to-emerald-300">Mati City</span>
                    </h1>

                    <p className="text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
                      Empowering students, tourists, local fisherfolk, and marine researchers to explore, catalog, and protect the <strong className="text-white font-semibold">9 native seagrass species</strong> of Pujada Bay using AI-driven visual image recognition.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                      <button
                        onClick={() => navigateToTab('scanner')}
                        className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 group"
                      >
                        <Camera className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
                        <span>Scan Seagrass Photo</span>
                        <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => navigateToTab('library')}
                        className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                      >
                        <BookOpen className="w-4 h-4 text-teal-400" />
                        <span>Explore 9 Native Species</span>
                      </button>
                    </div>

                    {/* Academic Institution Micro Badge */}
                    <div className="pt-6 border-t border-slate-800/80 flex items-center justify-center lg:justify-start gap-3 text-xs text-slate-400">
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Developed at Davao Oriental State University (DORSU) — FCET Project</span>
                    </div>
                  </div>

                  {/* Right Column Interactive Hero AI Scanner Preview Card */}
                  <div className="lg:col-span-5">
                    <div className="relative mx-auto max-w-md lg:max-w-none">
                      {/* Decorative Glowing Backdrop */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                      
                      <div className="relative rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 backdrop-blur-xl">
                        
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">AI Scanner Live Mode</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">v2.4 MobileNetV3</span>
                        </div>

                        {/* Visual Image Preview with Target Overlay */}
                        <div className="relative mt-4 rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 flex items-center justify-center group">
                          <img 
                            src="https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=800&q=80" 
                            alt="Thalassia hemprichii specimen" 
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Simulated Target Reticle */}
                          <div className="absolute inset-6 border-2 border-dashed border-teal-400/70 rounded-lg flex items-center justify-center">
                            <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-teal-500/40 text-[11px] text-teal-300 font-mono flex items-center gap-2 shadow-lg">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Thalassia hemprichii (98.2%)</span>
                            </div>
                          </div>
                        </div>

                        {/* Trait Detection Mini Tags */}
                        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/60">
                            <span className="text-slate-400 block text-[10px]">Apical Margin</span>
                            <span className="font-semibold text-slate-200">Sickle Curved Blade</span>
                          </div>
                          <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-700/60">
                            <span className="text-slate-400 block text-[10px]">Survey Station</span>
                            <span className="font-semibold text-teal-300">Pujada Island Reef</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <button
                            onClick={() => navigateToTab('scanner')}
                            className="w-full py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
                          >
                            <span>Test Live Recognition Tool</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>


            {/* CORE FEATURE HIGHLIGHTS (3 Cards Grid) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-teal-700 font-bold text-xs uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  Core System Modules
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 mt-3 font-serif">
                  Engineered for Environmental Research & Community Engagement
                </h2>
                <p className="text-slate-600 mt-2 text-sm">
                  Integrated machine learning tools tailored for Mati City's coastal conservation framework.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                
                {/* Feature Card 1 */}
                <div 
                  onClick={() => navigateToTab('scanner')}
                  className="group bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-6 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all">
                      <Camera className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors">
                      CNN Species Scanner
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      Upload underwater photographs for immediate automated identification via our optimized MobileNetV3 deep learning architecture trained on local specimen datasets.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-teal-700 gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>Try Image Identification</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Feature Card 2 */}
                <div 
                  onClick={() => navigateToTab('library')}
                  className="group bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                      Localized Digital Library
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      Explore detailed ecological profiles of all 9 native seagrass species documented in Pujada Bay, featuring botanical taxonomies, leaf traits, and ecological roles.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-emerald-700 gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>Browse Species Directory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Feature Card 3 */}
                <div 
                  onClick={() => navigateToTab('map')}
                  className="group bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 mb-6 group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-cyan-700 transition-colors">
                      Distribution Heatmap
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      Interactive GPS sampling station mapping based on academic baseline studies (Angsinco-Jimenez et al. & Sanchez-Delute et al.) and continuous user sightings.
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-cyan-700 gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>View Interactive Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

              </div>
            </section>


            {/* ECOLOGICAL FOCUS & QUICK STATS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
                
                <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
                      <Shield className="w-3.5 h-3.5" />
                      <span>DENR Coastal & Marine Ecosystems Management Program</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-serif">
                      Protecting Mati City's Benthic Biodiversity
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Pujada Bay harbors rich seagrass meadows that serve as nursery grounds for marine species and critical buffers against coastal erosion. SeaScan bridges academic field monitoring with AI visual tools to mitigate anthropogenic threats and climate pressures.
                    </p>
                  </div>

                  {/* Stat Counters Grid */}
                  <div className="lg:col-span-5 grid grid-cols-3 gap-4 text-center border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-8">
                    <div className="space-y-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-teal-300 font-mono">9</span>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                        Native Species Documented
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-cyan-300 font-mono">3</span>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                        Core Survey Stations
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-emerald-300 font-mono">85%+</span>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                        CNN Target Accuracy
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </section>


            {/* QUICK ACCESS SPECIES SHOWCASE */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 font-serif">
                    Target Native Species Preview
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Quick access taxonomy chips representing Pujada Bay's benthic flora.
                  </p>
                </div>
                <button
                  onClick={() => navigateToTab('library')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>View All 9 Species</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Grid Chips */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SEAGRASS_SPECIES.slice(0, 4).map((species) => (
                  <div
                    key={species.id}
                    onClick={() => {
                      setSearchTerm(species.scientificName);
                      navigateToTab('library');
                    }}
                    className="bg-white rounded-xl p-4 border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <img 
                      src={species.imgUrl} 
                      alt={species.scientificName} 
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-sm text-slate-900 italic truncate group-hover:text-teal-700 transition-colors">
                        {species.scientificName}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">{species.commonName}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                        {species.localName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}


        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: CNN SPECIES SCANNER MODULE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'scanner' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold mb-3">
                <Camera className="w-3.5 h-3.5" />
                <span>MobileNetV3 Visual Identification Engine</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 font-serif">
                Seagrass Image Scanner
              </h1>
              <p className="text-slate-600 text-sm mt-2">
                Upload a clear close-up image of a seagrass specimen (leaf blades or rhizome) to initiate automated identification.
              </p>
            </div>

            {/* Main Scanner Card Grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Image Input Area */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                
                <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span>Specimen Upload</span>
                </h3>

                {/* Upload Drag & Drop Area */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    scanImage ? 'border-teal-400 bg-teal-50/20' : 'border-slate-300 hover:border-teal-400 bg-slate-50'
                  }`}
                >
                  {scanImage ? (
                    <div className="space-y-4">
                      <div className="relative max-h-64 rounded-lg overflow-hidden mx-auto inline-block border border-slate-200 shadow-md">
                        <img src={scanImage} alt="Uploaded Seagrass Specimen" className="max-h-64 object-contain" />
                      </div>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => setScanImage(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Clear Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Click to select photo or drag image file</p>
                        <p className="text-[11px] text-slate-400 mt-1">Supports JPG, PNG formats up to 10MB</p>
                      </div>
                      
                      {/* Sample Test Quick Buttons */}
                      <div className="pt-3 border-t border-slate-200/80">
                        <p className="text-[11px] text-slate-500 font-semibold mb-2">Or test with baseline dataset samples:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {SEAGRASS_SPECIES.slice(0, 3).map((sp) => (
                            <button
                              key={sp.id}
                              onClick={() => {
                                setScanImage(sp.imgUrl);
                                handleSimulatedScan(sp);
                              }}
                              className="px-2.5 py-1 rounded bg-white hover:bg-teal-50 border border-slate-200 text-[11px] font-medium text-slate-700 hover:text-teal-800"
                            >
                              Sample: <span className="italic">{sp.scientificName}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scan Action Button */}
                <div className="mt-6">
                  <button
                    disabled={isScanning}
                    onClick={() => handleSimulatedScan()}
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-teal-900 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin text-teal-400" />
                        <span>Running MobileNetV3 CNN Model...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        <span>Execute AI Species Identification</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Right Column: AI Detection Results Panel */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Inference Results</span>
                </h3>

                {isScanning && (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs font-semibold text-slate-600">Analyzing leaf morphology & venation pattern...</p>
                  </div>
                )}

                {!isScanning && scanResult && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    
                    {/* Top Confidence Header */}
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest block">Primary Match</span>
                        <h4 className="text-lg font-bold text-slate-900 italic">
                          {scanResult.species.scientificName}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">{scanResult.species.commonName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-teal-700 font-mono">{scanResult.confidence}%</span>
                        <span className="block text-[10px] text-slate-500">Confidence</span>
                      </div>
                    </div>

                    {/* Taxonomic Features Identified */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Key Feature Predictions</span>
                      <ul className="space-y-1.5">
                        {scanResult.leafFeatures.map((ft, idx) => (
                          <li key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{ft}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Morphological Quick Reference */}
                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-xs font-bold text-slate-700 block mb-1">Morphology Summary</span>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {scanResult.species.morphology}
                      </p>
                    </div>

                    {/* Deep Library Link */}
                    <button
                      onClick={() => {
                        setSearchTerm(scanResult.species.scientificName);
                        navigateToTab('library');
                      }}
                      className="w-full py-2.5 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Open Complete Botanical Record</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                  </div>
                )}

                {!isScanning && !scanResult && (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Info className="w-8 h-8 mx-auto opacity-40" />
                    <p className="text-xs">No scan executed yet. Select or upload an image to view identification results.</p>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}


        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: DIGITAL LIBRARY MODULE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'library' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            
            {/* Page Title */}
            <div className="max-w-3xl">
              <span className="text-teal-700 font-bold text-xs uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Pujada Bay Botanical Catalog
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-2 font-serif">
                Native Seagrass Digital Library
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Explore the 9 documented native species of Mati City with taxonomic attributes, vegetative structure, and habitat parameters.
              </p>
            </div>

            {/* Filter and Search Bar Control Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
              
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search scientific, common, or local name..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600">
                    Clear
                  </button>
                )}
              </div>

              {/* Station Select */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  className="py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="ALL">All Stations</option>
                  <option value="Lawigan">Lawigan Area</option>
                  <option value="Taganilao">Taganilao Margin</option>
                  <option value="Pujada Island">Pujada Island Reserve</option>
                </select>
              </div>

              {/* Family Select */}
              <select
                value={familyFilter}
                onChange={(e) => setFamilyFilter(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="ALL">All Botanical Families</option>
                <option value="Hydrocharitaceae">Hydrocharitaceae</option>
                <option value="Cymodoceaceae">Cymodoceaceae</option>
              </select>

            </div>

            {/* Results Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpecies.map((sp) => (
                <div 
                  key={sp.id} 
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Species Image Header */}
                    <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                      <img 
                        src={sp.imgUrl} 
                        alt={sp.scientificName} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${sp.badgeColor}`}>
                          {sp.family}
                        </span>
                      </div>
                    </div>

                    {/* Taxonomic Content Body */}
                    <div className="p-5 space-y-3">
                      <div>
                        <span className="text-[11px] font-semibold text-teal-700 block">Local: "{sp.localName}"</span>
                        <h3 className="text-xl font-bold text-slate-900 italic">
                          {sp.scientificName}
                        </h3>
                        <p className="text-xs text-slate-600 font-medium">{sp.commonName}</p>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <div>
                          <strong className="text-slate-800">Leaf Morphology:</strong>
                          <p className="text-[11px] mt-0.5 leading-snug">{sp.morphology}</p>
                        </div>
                        <div>
                          <strong className="text-slate-800">Habitat / Substrate:</strong>
                          <p className="text-[11px] mt-0.5 leading-snug">{sp.habitat}</p>
                        </div>
                        <div>
                          <strong className="text-slate-800">Ecological Role:</strong>
                          <p className="text-[11px] mt-0.5 leading-snug text-slate-500">{sp.ecologicalRole}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Info */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      {sp.stationsFound.join(', ')}
                    </span>
                    <span className="font-semibold text-emerald-700">{sp.status}</span>
                  </div>

                </div>
              ))}
            </div>

            {filteredSpecies.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No matching species found</p>
                <p className="text-xs text-slate-500 mt-1">Try resetting your search filters.</p>
              </div>
            )}

          </div>
        )}


        {/* ------------------------------------------------------------- */}
        {/* VIEW 4: DISTRIBUTION HEATMAP MODULE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'map' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            
            <div className="max-w-3xl">
              <span className="text-teal-700 font-bold text-xs uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Geospatial Monitoring Grid
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-2 font-serif">
                Pujada Bay Distribution Heatmap
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Based on historical field baseline surveys (Angsinco-Jimenez et al. & Sanchez-Delute et al.) and active station coordinates.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Map Interactive Visualization Frame */}
              <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-xl min-h-[420px] flex flex-col justify-between relative overflow-hidden">
                
                {/* Simulated Geographic Grid Overlay */}
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>

                {/* Header Bar */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-teal-400 animate-spin-slow" />
                    <span className="font-mono text-xs text-slate-300">Pujada Bay Spatial View (Mati City)</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-full text-teal-300 font-mono">
                    DATUM: WGS84
                  </span>
                </div>

                {/* Simulated Station Map Markers */}
                <div className="my-12 relative h-64 border border-slate-800 rounded-xl bg-slate-950/60 p-4 flex items-center justify-around z-10">
                  {SURVEY_STATIONS.map((st) => {
                    const isSelected = activeStation.id === st.id;
                    return (
                      <div
                        key={st.id}
                        onClick={() => setActiveStation(st)}
                        className={`cursor-pointer transition-all transform hover:scale-110 flex flex-col items-center ${
                          isSelected ? 'z-20' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className={`relative p-3 rounded-full bg-gradient-to-tr ${st.color} shadow-lg shadow-teal-500/20 text-white`}>
                          <MapPin className="w-6 h-6" />
                          {isSelected && (
                            <span className="absolute -inset-1 rounded-full border-2 border-teal-300 animate-ping"></span>
                          )}
                        </div>
                        <span className={`mt-2 text-[11px] font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-teal-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                          {st.name.split(':')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Map Footer Information */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-slate-400 border-t border-slate-800 pt-3 z-10 gap-2">
                  <span>Selected Station: <strong className="text-teal-300">{activeStation.name}</strong></span>
                  <span>Coordinates: <strong className="text-slate-200 font-mono">{activeStation.coordinates}</strong></span>
                </div>

              </div>

              {/* Station Detail Sidebar */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-teal-700 block">Survey Station Profile</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">{activeStation.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{activeStation.coordinates}</p>
                </div>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-semibold">Substrate Classification</span>
                    <span className="font-bold text-slate-800">{activeStation.type}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-semibold">Benthic Cover Health</span>
                    <span className="font-bold text-emerald-700">{activeStation.healthIndex}</span>
                  </div>

                  <div>
                    <strong className="text-slate-900 block mb-1">Dominant Seagrass Assemblage:</strong>
                    <p className="text-slate-600 bg-teal-50/60 p-2.5 rounded-lg border border-teal-100 italic">
                      {activeStation.dominantSpecies}
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-900 block mb-1">Baseline Academic Citation:</strong>
                    <p className="text-slate-500 text-[11px]">
                      {activeStation.historicalSource}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}


        {/* ------------------------------------------------------------- */}
        {/* VIEW 5: ABOUT PUJADA BAY & INSTITUTIONAL CONTEXT */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'about' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-teal-700 font-bold text-xs uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Research Project Background
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-3 font-serif">
                About SeaScan & Pujada Bay
              </h1>
              <p className="text-slate-600 text-sm mt-2">
                A web-based seagrass species identification system designed for Mati City, Davao Oriental.
              </p>
            </div>

            {/* Content Cards */}
            <div className="space-y-8">
              
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-teal-600" />
                  <span>Institutional Framework</span>
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Developed at <strong>Davao Oriental State University (DORSU)</strong> under the Faculty of Computing, Engineering, and Technology (FCET). The SeaScan system addresses the need for automated ecological monitoring tools along Pujada Bay—a recognized protected seascape rich in marine biodiversity.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <span>The 9 Native Species Ecosystem</span>
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Based on academic surveys including <em>Angsinco-Jimenez et al.</em> and <em>Sanchez-Delute et al.</em>, Pujada Bay hosts 9 primary native seagrass species: <em>Enhalus acoroides, Thalassia hemprichii, Halophila ovalis, Halophila spinulosa, Halodule uninervis, Halodule pinifolia, Cymodocea serrulata, Cymodocea rotundata,</em> and <em>Syringodium isoetifolium</em>. These plants provide vital ecosystem services, carbon sequestration, and coastal stabilization against intense storm surges.
                </p>
              </div>

            </div>

          </div>
        )}

      </main>


      {/* ------------------------------------------------------------- */}
      {/* 2. SHARED PORTAL LOGIN MODAL GATE */}
      {/* ------------------------------------------------------------- */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 font-serif">SeaScan Portal</h3>
              <p className="text-xs text-slate-500">Access role-restricted research & administrative features</p>
            </div>

            {/* Role Selection Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
              <button
                onClick={() => setSelectedRole('admin')}
                className={`py-2 rounded-lg transition-all ${selectedRole === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Admin
              </button>
              <button
                onClick={() => setSelectedRole('researcher')}
                className={`py-2 rounded-lg transition-all ${selectedRole === 'researcher' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Researcher
              </button>
              <button
                onClick={() => setSelectedRole('public')}
                className={`py-2 rounded-lg transition-all ${selectedRole === 'public' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Local User
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); setLoginModalOpen(false); alert(`Logged in as ${selectedRole.toUpperCase()}`); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Institutional ID or Email</label>
                <input
                  type="text"
                  required
                  placeholder={selectedRole === 'admin' ? 'admin@dorsu.edu.ph' : 'researcher@dorsu.edu.ph'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-teal-900 text-white font-bold text-xs transition-colors shadow-md mt-2"
              >
                Authenticate & Access Dashboard
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-400">
                Restricted access for authorized DORSU FCET research team members.
              </span>
            </div>

          </div>
        </div>
      )}


      {/* ------------------------------------------------------------- */}
      {/* 3. FOOTER SECTION */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800/80">
            
            {/* Branding Column */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-lg font-serif">
                <Waves className="w-5 h-5 text-teal-400" />
                <span>SeaScan</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                A Web-Based Seagrass Species Identification System for Mati City, Davao Oriental. Powered by MobileNetV3 CNN for automated ecological monitoring.
              </p>
              <div className="text-[11px] text-teal-400 font-medium">
                Davao Oriental State University (DORSU) — FCET Project
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="md:col-span-3 space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">System Navigation</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => navigateToTab('home')} className="hover:text-teal-300 transition-colors">Home Landing Page</button></li>
                <li><button onClick={() => navigateToTab('scanner')} className="hover:text-teal-300 transition-colors">CNN Species Scanner</button></li>
                <li><button onClick={() => navigateToTab('library')} className="hover:text-teal-300 transition-colors">9 Native Species Library</button></li>
                <li><button onClick={() => navigateToTab('map')} className="hover:text-teal-300 transition-colors">Distribution Heatmap</button></li>
              </ul>
            </div>

            {/* Conservation Context */}
            <div className="md:col-span-4 space-y-2">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Institutional References</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Supported under DENR Coastal and Marine Ecosystems Management Program (CMEMP) directives for Pujada Bay Protected Seascape (PBPS).
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-teal-300 text-[11px] font-semibold hover:bg-slate-800 transition-colors"
                >
                  Researcher Portal Access
                </button>
              </div>
            </div>

          </div>

          {/* Copyright Row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} SeaScan Mati City. Developed at Davao Oriental State University.</p>
            <p>Pujada Bay Coastal Research • Figure 16 Public Viewer Implementation</p>
          </div>

        </div>
      </footer>

    </div>
  );
}