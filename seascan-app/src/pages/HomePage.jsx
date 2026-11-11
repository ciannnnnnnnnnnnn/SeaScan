import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Box,
  BookOpen,
  Quote,
  GraduationCap,
  Microscope,
  Eye,
  Layers,
  ChevronDown,
  MapPin,
  Leaf,
  Camera,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import OceanBackdrop from '../components/OceanBackdrop';
import { Reveal, CountUp } from '../components/motion';

const SLIDE_MS = 5000;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Slideshow of the species photos. Advances on its own every few seconds,
 * pauses while the pointer or keyboard focus is on it (or with the pause
 * button), and does not advance at all for visitors who prefer reduced motion.
 */
function SpeciesSlideshow() {
  const { species, loading } = useCatalog();
  const slides = species.slice(0, 9);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(() => prefersReducedMotion());
  const [hovered, setHovered] = useState(false);

  const count = slides.length;
  const go = (step) => setIndex((i) => (i + step + count) % count);

  useEffect(() => {
    if (paused || hovered || count < 2) return undefined;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, hovered, count]);

  if (loading || !count) return <div className="skeleton aspect-[4/3] rounded-2xl" />;

  const current = slides[index % count];

  return (
    <div
      className="space-y-3"
      aria-roledescription="carousel"
      aria-label="The nine seagrass species of Pujada Bay"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false); }}
    >
      <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
        {/* All photos are stacked; only the current one is visible, so they crossfade. */}
        {slides.map((sp, i) => (
          <div key={sp.id} className={`absolute inset-0 transition-opacity duration-700 ease-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={i !== index}>
            {sp.photo_url ? (
              <img src={sp.photo_url} alt={sp.scientific_name} loading={i === 0 ? 'eager' : 'lazy'}
                className={`w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${i === index ? 'scale-105' : 'scale-100'}`} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-teal-950/50">
                <Leaf className="w-14 h-14 text-teal-400/40" />
              </div>
            )}
          </div>
        ))}

        {/* Caption: links to the species profile */}
        <Link to={`/library/${current.slug}`}
          className="absolute inset-x-0 bottom-0 px-4 pt-12 pb-3.5 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent flex items-end justify-between gap-3">
          <span className="min-w-0" aria-live={paused || hovered ? 'polite' : 'off'}>
            <span className="block text-lg font-bold italic text-white truncate">{current.scientific_name}</span>
            {current.common_name && <span className="block text-xs text-slate-300 truncate">{current.common_name}</span>}
          </span>
          <span className="shrink-0 text-xs font-semibold text-teal-300 flex items-center gap-1">
            Profile <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>

        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-950/70 text-[11px] font-semibold text-slate-300 tabular-nums">
          {index + 1} / {count}
        </span>

        <button type="button" onClick={() => go(-1)} aria-label="Previous species"
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 text-white opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-slate-950/80 transition-opacity">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next species"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 text-white opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-slate-950/80 transition-opacity">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a species">
          {slides.map((sp, i) => (
            <button key={sp.id} type="button" onClick={() => setIndex(i)}
              aria-label={sp.scientific_name} aria-current={i === index ? 'true' : undefined}
              className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-teal-400' : 'w-2 bg-slate-700 hover:bg-slate-500'}`} />
          ))}
        </div>
        <button type="button" onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { openAuthModal } = useAuth();

  return (
    <div className="bg-slate-950 font-sans text-slate-300 antialiased selection:bg-teal-500 selection:text-slate-950">

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section data-theme="dark" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 bg-slate-950">
        <OceanBackdrop />

        <div className="relative z-10 max-w-5xl mx-auto text-center py-24">
          <Reveal className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Marine conservation in Mati City</span>
          </Reveal>

          <Reveal delay={80} as="h1" className="mt-7 text-[2.75rem] leading-[1.08] sm:text-6xl lg:text-7xl font-semibold tracking-tight text-white">
            AI Powered
            <span className="block mt-1 pb-2 bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Seagrass Intelligence
            </span>
          </Reveal>

          <Reveal delay={160} as="p" className="mt-6 text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto leading-relaxed">
            A high-fidelity identification system bridging advanced image recognition
            and local environmental preservation in Pujada Bay.
          </Reveal>

          <Reveal delay={240} className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/scanner"
              className="group w-full sm:w-auto px-7 py-3.5 rounded-md bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Start Identifying</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/library"
              className="w-full sm:w-auto px-7 py-3.5 rounded-md bg-white/5 hover:bg-white/10 text-white border border-white/15 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Species</span>
            </Link>
          </Reveal>

          {/* Stat strip */}
          <Reveal delay={320} className="mt-14 grid grid-cols-3 gap-px max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            {[
              { value: 9, suffix: '', label: 'Native species', decimals: 0 },
              { value: 3, suffix: '', label: 'Survey stations', decimals: 0 },
              { value: 96.9, suffix: '%', label: 'Test accuracy', decimals: 1 },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-5 bg-slate-950/40">
                <div className="text-2xl sm:text-3xl font-bold text-teal-300 tabular-nums">
                  <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  {stat.label}
                </div>
              </div>
            ))}
          </Reveal>
        </div>

        <a
          href="#vision"
          aria-label="Scroll to content"
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 text-teal-300/70 hover:text-teal-300 transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </a>
      </section>

      {/* ── 2. VISION ───────────────────────────────────────────────────── */}
      <section id="vision" className="relative py-24 sm:py-28 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          <Reveal className="lg:col-span-5">
            <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col gap-6 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(45_212_191_/_0.12),transparent_60%)]" />

              {/* Slideshow of the nine species of Pujada Bay, each opening its profile. */}
              <div className="relative z-10">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">The nine species</span>
                  <Link to="/library" className="text-xs font-semibold text-slate-400 hover:text-teal-300">View library</Link>
                </div>
                <SpeciesSlideshow />
              </div>

              <div className="relative z-10 rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-3">
                <Quote className="w-6 h-6 text-teal-400" />
                <p className="text-sm font-medium text-slate-200 leading-relaxed">
                  "Seagrass beds are the lungs of our bay. Identifying them is the
                  first step to saving them."
                </p>
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-widest">
                  — Local Marine Ecologist
                </span>
              </div>
            </div>
          </Reveal>

          <div className="lg:col-span-7 space-y-6">
            <Reveal as="span" className="text-xs font-bold text-teal-400 uppercase tracking-widest block">
              The Vision
            </Reveal>

            <Reveal delay={60} as="h2" className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight">
              Preserving the underwater blueprints of Pujada Bay
            </Reveal>

            <Reveal delay={120} as="p" className="text-slate-400 leading-relaxed">
              Mati City is blessed with diverse marine ecosystems, yet monitoring
              seagrass health remains a challenge. SeaScan turns every smartphone
              into a research instrument.
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {[
                { icon: GraduationCap, title: 'Education', body: 'Engaging the youth of Mati City with interactive marine literacy.' },
                { icon: Microscope, title: 'Research', body: 'Supplying marine researchers with accurate, georeferenced data.' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={180 + i * 60}>
                    <div className="h-full flex items-start gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-teal-500/40">
                      <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{item.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TECHNOLOGY (bento) ───────────────────────────────────────── */}
      <section id="technology" className="relative py-24 sm:py-28 bg-slate-900/30 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <Reveal as="span" className="text-xs font-bold text-teal-400 uppercase tracking-widest block">
              Core Technology
            </Reveal>
            <Reveal delay={60} as="h2" className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              Innovation beneath the surface
            </Reveal>
            <Reveal delay={120} as="p" className="text-sm text-slate-400">
              Five capabilities integrated into a single responsive platform.
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

            {/* Feature tile — spans two columns */}
            <Reveal id="recognition" className="lg:col-span-2">
              <div className="group h-full relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-7 hover:border-teal-500/40">
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-300 flex items-center justify-center">
                    <Eye className="w-5 h-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">AI Recognition</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-md">
                    A convolutional neural network trained on local samples, identifying
                    species such as <em className="italic text-slate-300">Cymodocea</em> and{' '}
                    <em className="italic text-slate-300">Thalassia hemprichii</em>.
                  </p>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-4xl font-semibold text-teal-300 tabular-nums">
                      <CountUp value={96.9} decimals={1} suffix="%" />
                    </span>
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold pb-2">
                      test accuracy
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div className="h-full rounded-3xl border border-slate-800 bg-slate-900/70 p-7 hover:border-emerald-500/40">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <Box className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-base font-bold text-white">3D Botanical Models</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Study root systems and blade structures without damaging live samples.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120} id="prototypes">
              <div className="h-full rounded-3xl border border-slate-800 bg-slate-900/70 p-7 hover:border-violet-500/40">
                <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-base font-bold text-white">Augmented Reality</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Bring seagrass ecology into the classroom by overlaying models in real space.
                </p>
              </div>
            </Reveal>

            {/* Library tile */}
            <Reveal delay={180} id="ar" className="lg:col-span-2">
              <Link
                to="/library"
                className="group h-full flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/70 p-7 hover:border-amber-500/40"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white">Digital Botanical Library</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-sm">
                    Morphological parameters, local nomenclature, and conservation notes
                    for all nine native species of Pujada Bay.
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  Open the catalog <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </Reveal>

            {/* Map tile */}
            <Reveal delay={240} className="lg:col-span-2">
              <Link
                to="/map"
                className="group h-full flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/70 p-7 hover:border-cyan-500/40"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white">Distribution Mapping</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-sm">
                    Georeferenced sightings across Lawigan, Taganilao, and Pujada Island —
                    focused entirely on Mati City waters.
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  View the map <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 4. CALL TO ACTION ───────────────────────────────────────────── */}
      <section className="py-24">
        <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 p-10 sm:p-16 text-center">
            <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
            <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" style={{ animationDelay: '-24s' }} />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
                Ready to explore Mati's marine wonders?
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                Join the BSIT Capstone 2026 initiative and contribute to the
                conservation of our blue ecosystems.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  to="/scanner"
                  className="w-full sm:w-auto px-7 py-3 rounded-md bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm"
                >
                  Enter SeaScan System
                </Link>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="w-full sm:w-auto px-7 py-3 rounded-md bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm"
                >
                  Create an Account
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

    </div>
  );
}
